<template>
  <view class="system-msg-box">
    <template v-if="content">
      <uni-im-group-notification v-if="msg.action === 'update-group-info-notification'" :content="content" :create_time="create_time"></uni-im-group-notification>
      <text v-else class="system-msg">{{friendlyTime}} {{content}}</text>
    </template>
  </view>
</template>

<script>
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  export default {
    data() {
      return {
        content: false,
        create_time:false
      }
    },
    props: {
      msg: {
        type: Object,
        default () {
          return {}
        }
      },
    },
    computed: {
      friendlyTime() {
        return uniIm.utils.toFriendlyTime(this.create_time || this.msg.create_time || this.msg.client_create_time)
      }
    },
    watch: {
      msg: {
        handler: async function (msg, oldMsg) {
          if(msg.action.indexOf("update-group-info-") === 0){
            const key = Object.keys(msg.body.updateData)[0]
            const value = msg.body.updateData[key];
            if (key ==  "notification"){
              this.content = value.content
              this.create_time = value.create_time
            }else if(key ==  "avatar_file"){
              this.content = "群聊头像已更新"// 已在 msg-list 组件隐藏此类型消息
            }
            // mute_all_members 
            else if(key ==  "mute_all_members"){
              this.content = value ? "已开启“全员禁言”" : "已关闭“全员禁言”"
            } else{
              this.content = {
                "name":" 群聊名称",
                "introduction":"群简介"
              }[key] + "已更新为：" + value
            }
          }else if( ["join-group","group-exit","group-expel"].includes(msg.action) ){
            let nicknameList = (await uniIm.users.get(msg.body.user_id_list)).map(item => item.nickname)
            let actionName = {
              "join-group":"加入群聊",
              "group-exit":"退出群聊",
              "group-expel":"被踢出群聊"
            }[msg.action];
            this.content = nicknameList.join(' , ') + actionName
          }else if(msg.action === "group-dissolved"){
            this.content = '此群聊已被解散'
          }else if(msg.action === "set-group-admin"){
            const {user_id,addRole,delRole} = msg.body
            const nickname = (await uniIm.users.get(user_id)).nickname
            this.content = `已将"${nickname}"${addRole.includes("admin") ? "添加为群管理员" : "从群管理员中移除"}`
          }else{
            this.content = msg.body
          }
        },
        deep: true,
        immediate: true
      }
    },
    async mounted() {}
  }
</script>

<style lang="scss">
  .system-msg-box{
    align-items: center;
  }
  // 如果是 pc 端
  // #ifdef H5
  @media screen and (min-device-width:960px){
    .system-msg-box{
      max-width: 550px!important;
      word-break: break-all;
      margin: 0 auto;
    }
  }
  // #endif
    
  .hidden {
    height: 0;
  }
  .system-msg {
    background-color: #f2f2f2;
    color: #9d9e9d;
    font-size: 12px;
    line-height: 30px;
    padding: 0 15rpx;
    border-radius: 8px;
    margin: 0 2em;
  }
  .group-notification {
    padding:14px 16px;
    background-color: #FFFFFF;
    width: 600rpx;
    font-size: 18px;
    margin-top: 10px;
  }
  .group-notification .title-box{
    flex-direction: row;
  }
  .group-notification .title-box .title{
    padding-left: 5px;
    color: #888;
  }
  .group-notification .content{
    color: #555;
    padding: 6px 0;
  }
</style>