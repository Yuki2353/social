<template>
  <view class="history-msg" @click="viewMsg">
    <view class="title">{{title}}</view>
    <view class="item-text-list">
      <view class="item-text" v-for="(item,index) in msgList.slice(0,3)" :key="index">
        {{item.nickname}}：{{item.content}}
      </view>
    </view>
  </view>
</template>

<script>
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  export default {
    emits: ['viewMsg'],
    props: {
      msg: {
        type: Object,
        default: {}
      },
    },
    data() {
      return {
        msgList: [],
        title: ''
      }
    },
    mounted() {
      const msg = this.msg
      // console.log(msg)
      this.msgList = msg.body.msgList || []
      for (let i = 0; i < this.msgList.length; i++) {
        let msg = this.msgList[i]
        this.setNickname(msg)
        // 获取body 去掉所有 html 标签
        msg.content = typeof(msg.body) === 'string' ? msg.body.replace(/<[^>]+>/g, "") : '[多媒体类型]'
      }
      if(!this.msgList[0].group_id){
        let currentUid = uniCloud.getCurrentUserInfo().uid;
        let currentUidInfo = uniIm.users[currentUid];
        let currentNickname = currentUidInfo?currentUidInfo.nickname:'';
        // 找到不是自己的nickname去重
        let nickname = this.msgList.map(item=>item.nickname).filter(nickname=>nickname!==currentNickname)[0]
        this.title = currentNickname + (nickname?'与'+nickname:'')+'的聊天记录';
        // console.log(this.title)
      }else{
        this.title = msg.body.title
      }
    },
    methods: {
      viewMsg(){
        this.$emit('viewMsg',this.msgList)
      },
      setNickname(msg) {
        let users = uniIm.users[msg.from_uid]
        if (users) {
          msg.nickname = users.nickname;
        } else {
          const dbJQL = uniCloud.databaseForJQL();
          dbJQL.collection('uni-id-users').doc(msg.from_uid).field('nickname').get().then(res => {
            msg.nickname = res.data[0].nickname;
          })
        }
      }
    }
  }
</script>

<style>
  /* #ifdef H5 */
  .history-msg,.history-msg * {
    cursor: pointer;
  }
  /* #endif */
  .history-msg {
    padding: 10px;
    background-color: #fff;
    width: 600rpx;
    max-height:200px !important;
    overflow: hidden;
  }
  .item-text-list{
    max-height: 150px !important;
    overflow: hidden;
  }

  .title {
    text-align: left;
    font-size: 16px;
    height: 36px;
    color: #333;
    padding: 5px;
    border-bottom: 1px solid #eee;
  }

  .item-text {
    color: #888;
    margin-top: 5px;
  }
</style>