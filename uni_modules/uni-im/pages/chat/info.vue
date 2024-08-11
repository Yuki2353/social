<template>
<view class="chat-info">
  <uni-list :border="false" class="list">
    <uni-im-info-card
      :avatarUrl="friend_info.avatar_file ? friend_info.avatar_file.url:'/uni_modules/uni-im/static/avatarUrl.png'"
      :title="friend_info.nickname"
      :note="friend_info.nickname != friend_info.email ? friend_info.email : ''"
    />
    <uni-list-item
      title="消息免打扰"
      :switch-checked="conversation.mute"
      :show-switch="true"
      @switchChange="changeConversationMute"
    />
    <!-- #ifdef H5 -->
    <!-- 发送名片消息（仅内部人员可用） -->
    <uni-list-item
      v-if="uniIDHasRole('staff')"
      :link="true"
      title="发送他（她）的名片"
      @click="sendNameCard"
    />
    <!-- #endif -->
    <!-- 选择某个用户创建群聊（仅dcloud员工可用） -->
    <uni-list-item
      v-if="uniIDHasRole('staff') && friend_uid != currentUid"
      :link="true"
      title="选此用户创建群聊"
      @click="createGroup"
    />
    <template v-for="item in UserinfoMenu" :key="item.component.name">
      <component :is="item.component" :conversation="conversation" cementing="UserinfoMenu" />
    </template>
  </uni-list>
  <button
    v-if="isFriend"
    class="btn"
    plain
    type="warn"
    @click="deteleFriend"
  >
    删除好友
  </button>

  <!-- #ifdef H5 -->
  <uni-im-share-msg
    ref="share-msg"
    no-msg-list
    no-comment
  />
  <!-- #endif -->
</view>
</template>

<script>
const db = uniCloud.database();
import uniIm from '@/uni_modules/uni-im/sdk/index.js';
import { ref,markRaw } from "vue"
export default {
  data() {
    // 调用扩展点，扩展程序可以在消息输入框新增一个工具类的项
    let UserinfoMenu = uniIm.extensions
      .invokeExts("userinfo-menu-extra",)
      .filter((result) => result && result.component)
      .map((result) => {
        return {
          component: markRaw(result.component),
          props: result.props
        };
      });
      
    return {
      UserinfoMenu,
      conversation: {},
      friend_uid: '',
      friend_info: {
        username: '',
        nickname: '',
        avatar_file: {
          url: ''
        }
      }
    }
  },
  computed: {
    ...uniIm.mapState(['isWidescreen']),
    isFriend() {
      let friendList = uniIm.friend.get()
      return friendList.find(i => i._id == this.friend_uid)
    },
    currentUid() {
      return uniCloud.getCurrentUserInfo().uid
    }
  },
  async onLoad(options) {
    this.load(options)
  },
  methods: {
    async load(options) {
      console.log('options',options);
      let conversation_id = options.conversation_id || options.id
      // 如果只传了user_id，需要先获取conversation_id
      if(!conversation_id){
        if(!options.user_id){
          console.error('参数错误')
          return uni.showToast({
            title: '参数错误',
            icon: 'none'
          });
        }
        conversation_id = await uniIm.utils.getConversationId(options.user_id)
        console.log('conversation_id',conversation_id);
      }
      
      let conversation = await uniIm.conversation.get(conversation_id)
      this.conversation = conversation
      this.friend_uid = conversation.friend_uid
      let field = '_id,nickname,avatar_file'
      if (this.uniIDHasRole('staff')) {
        field += ',email'
      }
      let res = await db.collection('uni-id-users')
        .doc(this.friend_uid)
        .field(field)
        .get()
        // console.log("res: ",res);
      this.friend_info = res.result.data[0]
    },

    changeConversationMute() {
      console.log('changeConversationMute',this.conversation)
      this.conversation.changeMute()
    },
    async deteleFriend() {
      uni.showModal({
        title: '确认要删除好友吗',
        content: '此操作不可撤销',
        showCancel: true,
        cancelText: '取消',
        confirmText: '确认',
        complete: async (e) => {
          if (e.confirm) {
            uni.showLoading({
              mask: true
            });
            try {
              await db.collection('uni-im-friend').where({
                friend_uid: this.friend_uid,
                user_id: uniCloud.getCurrentUserInfo().uid
              }).remove()
              // 收到push消息后store会自动，将此用户从列表中移除
              uni.navigateBack({ delta: 2 })
            } catch (e) {
              uni.showModal({
                content: JSON.stringify(e.message),
                showCancel: false
              });
            }
            uni.hideLoading()
          }
        }
      });
    },
    async createGroup(){
      console.log('createGroup')
      const user_ids = [this.friend_uid]
      const uniImCo = uniCloud.importObject("uni-im-co")
      let res = await uniImCo.chooseUserIntoGroup({
        user_ids
      })
      uni.$emit('uni-im-toChat','group_'+res.data.group_id)
    },
    // #ifdef H5
    async sendNameCard() {
      let msg = {
        type: 'userinfo-card',
        body: {
          user_id: this.conversation.friend_uid,
          name: this.conversation.title,
        },
        from_uid: uniCloud.getCurrentUserInfo().uid,
        create_time: Date.now(),
      }
      this.$refs['share-msg'].open([msg], false)
    }
    // #endif
  }
}
</script>

<style lang="scss">
@import "@/uni_modules/uni-im/common/baseStyle.scss";
.chat-info {
  width: 750rpx;
  height: 100vh;
  align-items: center;
  background-color: #fff;
  
  .list {
    width: 750rpx;
    border-bottom: 1px solid #ececec;
  }

  /* #ifdef H5 */
  .list ::v-deep .info-card {
    .title, .note {
      cursor: text;
      user-select: text;
    }
  }
  .list ::v-deep .uni-list-item + .uni-list-item{
    cursor: pointer;
  }
  /* #endif */

  .btn {
    margin-top: 15px;
    width: 600rpx;
    /* height: 45px; */
    text-align: center;
    line-height: 45px;
    border-radius: 20rpx;
  }
}
</style>