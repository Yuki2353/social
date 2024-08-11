<template>
<view class="chat-fragment">
  <view class="head">
    <uni-icons class="btn-back" @click="onBack" type="arrow-left" size="20"></uni-icons>
  </view>
  <scroll-view
    class="message-list"
    scroll-y
    :scroll-into-view="autoScrollToEl"
    @scrolltoupper="onScrollToUpper"
    @scrolltolower="onScrollToLower"
  >
    <uni-im-msg
      v-for="(msg, index) in msgList"
      :key="msg._id"
      :id="`msg-${msg._id}`"
      :msg="msg"
      :equalPrevTime="equalPrevTime(index)"
      no-jump
      :class="{highlight:msg.highlight}"
      @loadMore="cb => cb()"
    />
  </scroll-view>
</view>
</template>

<script>
/**
 * chat-fragment 组件，渲染会话中一个片段的消息列表，用于显示某条消息搜索结果的上下文列表。
 * 
 * @module
 */
  const uniImCo = uniCloud.importObject("uni-im-co", {
    customUI: true
  })
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';

  export default {
    emits: ['close'],

    props: {
      entry: {
        type: Object
      }
    },

    data() {
      // 因为要修改 msg 对象的属性值，所以 clone 一下，以切断响应性，避免干扰原数据
      let { ...cloneEntry } = this.entry
      cloneEntry.highlight = true
      return {
        msgList: [cloneEntry],
        hasMoreBackward: true,
        skipBackward: this.entry.create_time,
        hasMoreForward: true,
        skipForward: this.entry.create_time,
        autoScrollToEl: '',
      };
    },

    mounted() {
      this.loadDataForward(() => {
        this.loadDataBackward(() => {
          this.autoScrollToEl = 'msg-' + this.entry._id
        }, 15)
      }, 15)
    },

    methods: {
      async loadDataForward(afterLoaded, limit = 30) {
        this.loading = true
        let result = await uniImCo.getFragmentMessageOfConversation({
          conversation_id: this.entry.conversation_id,
          skip: this.skipForward,
          limit,
          forward: true,
        })
        this.msgList.push(...result.data)
        this.hasMoreForward = result.hasMore
        this.skipForward = result.skip
        this.loading = false
        this.$nextTick(afterLoaded)
      },

      async loadDataBackward(afterLoaded, limit = 30) {
        this.loading = true
        let result = await uniImCo.getFragmentMessageOfConversation({
          conversation_id: this.entry.conversation_id,
          skip: this.skipBackward,
          limit,
          forward: false,
        })
        this.msgList.unshift(...result.data.reverse())
        this.hasMoreBackward = result.hasMore
        this.skipBackward = result.skip
        this.loading = false
        this.$nextTick(afterLoaded)
      },

      onScrollToUpper(evt) {
        if (this.loading) return
        if (!this.hasMoreBackward) return
        let elId = 'msg-' + this.msgList[0]._id
        this.autoScrollToEl = ''
        this.loadDataBackward(() => {
          this.autoScrollToEl = elId
        })
      },

      onScrollToLower(evt) {
        if (this.loading) return
        if (!this.hasMoreForward) return
        this.loadDataForward(() => {})
      },

      onBack() {
        this.$emit('close')
      },

      equalPrevTime(index) {
        if (index === 0) {
          return false
        } else if (index == this.msgList.length - 1) {
          return false
        } else {
          const getFriendlyTime = (msg) => {
            return uniIm.utils.toFriendlyTime(msg.create_time || msg.client_create_time)
          }
          return getFriendlyTime(this.msgList[index]) == getFriendlyTime(this.msgList[index - 1])
        }
      },
    }
  }
</script>

<style>
@import "@/uni_modules/uni-im/common/baseStyle.scss";
.chat-fragment {
  padding: 5px;
  background-color: #efefef;
}

.message-list {
  height: calc(100% - 30px);
}

.head {
  flex-direction: row;
  border-bottom: 1px solid #ddd;
}

.btn-back {
  /* #ifdef H5 */
  cursor: pointer;
  /* #endif */
}
.highlight {
  background-color: #f9f3de;
}
</style>
