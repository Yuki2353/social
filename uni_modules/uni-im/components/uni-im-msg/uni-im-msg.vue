<template>
  <view v-if="!msg.is_delete" class="uni-im-msg" :class="{self}">
    <msg-system v-if="msg.type === 'system'" class="system-msg-box" :msg="msg" />
    <template v-else>
      <view v-if="!noTime" class="friendlyTime">
        <text class="format-time-text" :class="{'dup-format-time-text':equalPrevTime}">
          {{ friendlyTime }}
        </text>
      </view>
      <view class="msg-box">
        <view v-if="msg.is_revoke" class="revoke-text-box">
          <text class="revoke-text">
            已被撤回
          </text>
          <text v-if="msg.before_revoke_body && ['text','rich-text'].includes(msg.type) " class="re-edit" @click="putChatInputContent">
            重新编辑
          </text>
        </view>
        <view v-else-if="msg.revoke_ing" class="revoke-text-box">
          <text class="revoke-text">
            消息撤回中...
          </text>
        </view>
        <template v-else>
          <cloud-image ref="avatar" width="40px" height="40px" border-radius="5px"
            :src="avatarUrl||'/uni_modules/uni-im/static/avatarUrl.png'" mode="widthFix"
            :class="{'pointer':canPrivateChat}"
            @click.stop="toChat" @longpress.stop="longpressMsgAvatar" />
          <view class="msg-main">
            <view v-if="!self" class="nickname-box">
              <text :selectable="true" class="nickname" @click="longpressMsgAvatar">{{ msg.nickname || users.nickname }}</text>
              <text class="isFromAdmin" v-if="isFromAdmin">管理员</text>
            </view>
            
            <view v-if="msg.about_msg_id" class="cite-box">
              <template v-if="aboutMsg.body">
                <text v-if="aboutMsg.is_revoke" class="cite-box-text">
                  回复的消息已被撤回
                </text>
                <text v-else class="cite-box-text" :class="{'pointer':!noJump}" @click="showAboutMsg">
                  {{ getNicknameByUid(aboutMsg.from_uid) }}：{{ aboutMsg.body }}
                </text>
              </template>
              <text v-else class="cite-box-text">
                [加载中]
              </text>
            </view>
            <view class="msg-content-box" @longpress="showControl">
              <uni-icons v-if="self && msg.state != 100 && msgStateIcon" :color="msg.state===0?'#999':'#d22'"
                :type="msgStateIcon" class="msgStateIcon" @click="retriesSendMsg" />
              <component :is="'msg-'+msg.type" :class="'msg-'+msg.type" class="msg-content" ref="msg-content" :msg="msg"
                @viewMsg="$emit('viewMsg',$event)"
                cementing="MsgByType"
              ></component>
            </view>
          </view>
        </template>
      </view>
      <slot />
    </template>

    <template
      v-for="extra in extraComponents"
      :key="extra.component.name"
    >
      <component
        :is="extra.component"
        v-bind="extra.props"
        ref="extras"
        cementing="MsgExtra"
      />
    </template>
  </view>
</template>

<script>
  import {
    store as uniIdStore,
  } from '@/uni_modules/uni-id-pages/common/store'
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  // 导入各类型的消息组件
  import msgSystem from './types/system.vue'
  import msgUserinfoCard from './types/userinfo-card.vue'
  import msgVideo from './types/video.vue'
  import msgFile from './types/file.vue'
  import msgHistory from './types/history.vue'
  import msgRichText from './types/rich-text.vue'
  import msgCode from './types/code.vue'
  import msgText from './types/text.vue'
  import msgSound from './types/sound.vue'
  import msgImage from './types/image.vue'

  import { markRaw } from 'vue'

/**
 * uni-im-msg 组件，渲染一条消息。
 * 
 * 支持多种消息类型：
 * 
 * - text
 * - rich-text
 * - code
 * - file
 * - image
 * - sound
 * - video
 * - userinfo-card
 * - history
 * 
 * @module
 */
  export default {
    components: {
      msgSystem,
      msgUserinfoCard,
      msgVideo,
      msgFile,
      msgHistory,
      msgRichText,
      msgCode,
      msgText,
      msgSound,
      msgImage
    },
    props: {
      msg: {
        type: Object,
        default () {
          return {
            body: ""
          }
        }
      },
      self: {
        type: Boolean,
        default () {
          return false
        }
      },
      avatar_file: {
        type: [Object, String, Boolean],
        default () {
          return {
            url: "/uni_modules/uni-im/static/avatarUrl.png"
          }
        }
      },
      index: {
        type: Number
      },
      equalPrevTime: {
        type: Boolean,
        default () {
          return false
        }
      },
      noTime: { // 不显示时间
        type: Boolean,
        default: false
      },
      noJump: { // 引用的消息不可点击跳转
        type: Boolean,
        default: false
      },
    },
    emits: ['viewMsg', 'showControl', 'showMsgById','loadMore','longpressMsgAvatar','putChatInputContent'],
    data() {
      let currentUser = {
        user_id: uniCloud.getCurrentUserInfo().uid,
        isInternalUser: this.uniIDHasRole('staff'),
      }
      // 调用扩展点，正在渲染一条消息，扩展程序可以返回扩展组件，为该消息增加一些显示元素。
      let extraComponents = uniIm.extensions.invokeExts('msg-extra', this.msg, currentUser)
        .filter(result => result && result.component)
        .map(result => {
          return {
            component: markRaw(result.component),
            props: result.props || {},
            handlers: result.handlers || {},
          }
        })

      return {
        nickname: "用户名",
        videoUrl: '',
        soundPlayState: 0,
        aboutMsg: {},
        extraComponents,
      };
    },
    computed: {
      currentConversation() {
        return uniIm.conversation.getCached(this.msg.conversation_id)
      },
      friendlyTime() {
        let time = this.msg.create_time || this.msg.client_create_time
        // 使得时间会随着心跳动态更新
        time = time + uniIm.heartbeat * 0
        return uniIm.utils.toFriendlyTime(time)
      },
      users() {
        return uniIm.users[this.msg.from_uid] || {}
      },
      msgStateIcon() {
        switch (this.msg.state) {
          case 0:
            // 发送中
            return 'spinner-cycle'
            break;
          case -100:
            // 发送失败
            return 'refresh-filled'
            break;
          case -200:
            // 禁止发送（内容不合法）
            return 'info-filled'
            break;
          default:
            return false
            break;
        }
      },
      isFromAdmin() {
        const conversation = uniIm.conversation.getCached(this.msg.conversation_id)
        return conversation?.group_id && conversation.group_member[this.msg.from_uid]?.role?.includes('admin')
      },
      mineId() {
        return uniCloud.getCurrentUserInfo().uid
      },
      avatarUrl() {
        if (this.self) {
          // console.error('uniIdStore.userInfo',uniIdStore.userInfo)
          return uniIdStore.userInfo.avatar_file?.url
        } else {
          return this.users.avatar_file?.url
        }
      },
      soundBoxWidth() {
        return uni.upx2px(750 / 60 * this.msg.body.time) + 50 + 'px'
      },
      canPrivateChat(){
        const conversation = uniIm.conversation.getCached(this.msg.conversation_id)
        const currentUserId = uniCloud.getCurrentUserInfo().uid;
        // 当前登录的账号是管理员，或者是群管理员，或者当前消息是群管理员发的
        return this.uniIDHasRole('staff') || 
               conversation.group_member?.[currentUserId]?.role?.includes('admin') || 
               this.isFromAdmin
      }
    },
    async mounted() {
      this.initAboutMsg()

      // #ifdef H5
      // web端限制不选中文字时出现系统右键菜单
      let msgContent = this.$refs['msg-content']
      if (msgContent && uniIm.isWidescreen) {
        msgContent.$el.addEventListener('contextmenu', (e) => {
          if (!document.getSelection().toString()) {
            this.showControl(e)
            e.preventDefault()
          }
        })
      }
      let avatarRef = this.$refs['avatar']
      if (avatarRef) {
        avatarRef.$el.addEventListener('contextmenu', (e) => {
          if (uniIm.isWidescreen) {
            this.longpressMsgAvatar()
          }
          e.preventDefault()
        })
      }
      // #endif
    },
    methods: {
      getNicknameByUid(uid) {
        let users = uniIm.users[uid]
        if (users) {
          return users.nickname
        } else {
          return ''
        }
      },
      showAboutMsg() {
        this.$emit('showMsgById', this.aboutMsg._id)
      },
      onAppear() {
        // console.log('msg ----msgAppear msg.body',this.msg.body)
        let index = this.currentConversation.call_list.findIndex(i => i == this.msg._id)
        if (index != -1) {
          console.log('已读，移除call_list对应数据')
          this.currentConversation.call_list.splice(index, 1)
        }
      },
      onDisappear() {},
      async showControl(e) {
        let msgContentDomInfo;
        const query = uni.createSelectorQuery().in(this);
        await new Promise(callback => {
          query.selectAll('.msg-content-box .msg-content').boundingClientRect(data => {
            msgContentDomInfo = data[0]
            // console.log('msgContentDomInfo data--------', data);
            callback(msgContentDomInfo)
          }).exec();
        })

        this.$emit('showControl', {
          msgId: this.msg._id,
          msgContentDomInfo,
          // #ifdef H5
          coordinate: {
            left: e.x,
            top: e.y
          }
          // #endif
        })
      },
      retriesSendMsg() {
        // if (this.msg.state == -200) {
        //   return uni.showToast({
        //     title: '内容不合法',
        //     icon: 'error'
        //   });
        // }
        this.$emit('retriesSendMsg', this.msg)
      },
      toChat() {
        if (this.canPrivateChat) {
          uniIm.toChat({
            user_id: this.msg.from_uid,
            source: {
              group_id: this.msg.group_id
            }
          })
        }
      },
      longpressMsgAvatar() {
        if (this.msg.group_id) {
          // console.log('~~~~this.msg.from_uid', this.msg.from_uid)
          this.$emit('longpressMsgAvatar', this.msg.from_uid)
        }
      },
      async initAboutMsg() {
        // 处理引用消息
        const {
          about_msg_id
        } = this.msg
        if (about_msg_id) {
          const _aboutMsg = this.currentConversation.msgList.find(i => i._id == about_msg_id) || false
          let aboutMsg = JSON.parse(JSON.stringify(_aboutMsg))
          // 本地不存在联网查找
          if (!aboutMsg) {
            const db = uniCloud.database();
            let {
              conversation_id,
              "about_msg_id": _id
            } = this.msg;
            let res = await db.collection('uni-im-msg')
              .where({
                conversation_id,
                _id
              })
              .limit(1)
              .get()
            aboutMsg = res.result.data[0]
            if (aboutMsg) {
              aboutMsg.isCloudMsg = true
            } else {
              console.error('疑似脏数据，云端也没有查到');
              delete this.msg.about_msg_id
              return
            }
          }
          aboutMsg.body = uniIm.utils.getMsgNote(aboutMsg)
          this.aboutMsg = aboutMsg
        }
      },
      putChatInputContent() {
        this.$emit('putChatInputContent', JSON.parse(JSON.stringify(this.msg.before_revoke_body)))
      }
    }
  }
</script>
<style lang="scss">
.uni-im-msg {
  position: relative;
  width: 100%;
  .msg-box {
    position: relative;
    flex-direction: row;
    justify-content: flex-start;
    margin: 8px;
    /* #ifdef H5 */
    &,& > * {
      cursor: default;
    }
    .file-msg-box,
    .cloud-image {
      cursor: pointer;
    }
    /* #endif */
    .msg-main {
      margin: 0 8px;
      margin-right: 40px;
      align-items: flex-start;
      width: 0;
      flex-grow: 1;
      .msg-content-box {
        width: 100%;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
      }
      
      /* 回复引用某条消息提示框 */
      .cite-box {
        margin:8px 0;
        background-color: #e3e3e3;
        color: #6a6a6a;
        border-radius: 5px;
        max-width: 100%;
        justify-content: center;
        padding: 5px 10px;
        .cite-box-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 14px;
        }
      }
    }
  }
  
  &.self {
    .msg-box {
      flex-direction: row-reverse;
    }
    .msg-main {
      align-items: flex-end;
      margin-right: 8px;
      margin-left: 40px;
      .msg-content-box {
        justify-content: flex-end;
      }
    }
  }
  
  .nickname-box {
    flex-direction: row;
    align-items: center;
  }
  
  .nickname {
    font-size: 13px;
    color: #666666;
    padding-left: 2px;
  }
  
  /* #ifdef H5 */
  .nickname-box .nickname:hover {
    color: #0b65ff;
    cursor: pointer;
  }
  .nickname-box .nickname:hover::after {
    content: '@';
    margin-left: 3px;
  }
  /* #endif */
  
  .isFromAdmin {
    font-size: 14px;
    color: #FFFFFF;
    background-color: #1ab94d;
    padding: 2px 3px;
    border-radius: 2px;
    transform: scale(0.7);
    margin-left: -4px;
  }
  
  .rich-text {
    background-color: transparent;
    width: 500rpx;
  }
  
  .link {
    // font-size: 16px;
    color: #007fff;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }
  
  .msgStateIcon {
    margin-right: 5px;
  }
  
  .revoke-text-box {
    flex-direction: row;
    flex: 1;
    justify-content: center;
  }
  
  .revoke-text-box .revoke-text {
    color: #999;
    font-size: 12px;
  }
  
  .revoke-text-box .re-edit {
    color: #0b65ff;
    font-size: 12px;
    margin-left: 10px;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }
  
  .friendlyTime {
    height: 22px;
  }
  
  .format-time-text {
    font-size: 12px;
    text-align: center;
    color: #999999;
    line-height: 22px;
  }
  
  /* #ifdef H5 */
  .dup-format-time-text {
    display: none;
  }
  &:hover .dup-format-time-text {
    display: unset;
  }
  .pointer {
    cursor: pointer;
  }
  /* #endif */
}
</style>