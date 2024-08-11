<template>
  <!-- 设置导航栏标题，如与谁对话，群人数为几人等 -->
  <page-meta v-if="!isWidescreen">
     <navigation-bar :title="navTitle" background-color="#f8f8f8" front-color="#000000" />
  </page-meta>
  <text v-else style="position: absolute;top: 25px;left: 15px;" :selectable="true">{{ navTitle }}</text>

  <view class="chat-filtered">
    <view class="head">
      <view v-if="count == 0 && loading" class="hint">正在加载……</view>
      <view v-else class="hint">{{ count }} 条与“{{ keyword }}”相关的聊天记录</view>
      <view
        v-if="conversation_id"
        class="enter-chat"
        @click="onEnterConversation(conversation_id)"
      >
        <uni-icons type="chatbubble" size="16"></uni-icons>
        进入会话
      </view>
    </view>
    <scroll-view
      class="message-list"
      scroll-y
      :scroll-into-view="autoScrollToEl"
      @scrolltoupper="onScrollToUpper"
    >
      <uni-im-msg
        v-for="msg in msgList"
        :key="msg._id"
        :id="`msg-${msg._id}`"
        :msg="msg"
        no-time
        no-jump
        @loadMore="cb => cb()"
      >
        <view class="float-info">
          <view>{{ toFriendlyTime(msg) }}</view>
          <view class="enter-fragment" @click="onOpenFragment(msg)">查看上下文</view>
        </view>
      </uni-im-msg>
      <view id="bottom-el" style="height: 1px;"></view>
    </scroll-view>

    <chat-fragment
      v-if="fragment"
      :entry="fragment"
      @close="onCloseFragment"
    />
  </view>
</template>

<script>
/**
 * chat-filtered 组件，渲染一个会话中经过滤选择的消息列表，用于显示某个会话的消息搜索结果。
 * 
 * 点击某条消息的“查看上下文”按钮可以打开 {@link module:chat-fragment} 组件。
 * 
 * @module
 */
  const uniImCo = uniCloud.importObject("uni-im-co", {
    customUI: true
  })
  import uniIm from '@/uni_modules/uni-im/sdk/index.js'
  import ChatFragment from './cmp/chat-fragment'

  export default {
    components: {
      ChatFragment,
    },
    emits: ['to-chat'],
    data() {
      return {
        loading: true,
        count: 0,
        keyword: '',
        msgList: [],
        hasMore: true,
        skip: Number.MAX_SAFE_INTEGER,
        conversation_id: '',
        autoScrollToEl: '',
        // 当前会话对象
        conversation: {},
        // 聊天记录片段的入口消息
        fragment: null,
      };
    },
    computed: {
      ...uniIm.mapState(['isWidescreen']),
      navTitle() {
        let title = this.conversation.title
        if (this.conversation.group_id) {
          title += `(${Object.keys(this.conversation.group_member).length})`;
        }
        return title
      }
    },
    async onLoad(param) {
      // 调用load方法，因为pc宽屏时本页面是以组件形式展示，如 $refs.chatFiltered.load(conversation_id)
      await this.load(param);
    },
    methods: {
      async load({ keyword, count, conversation_id }) {
        // 根据入口参数进行初始化
        this.loading = true
        this.count = count
        this.keyword = keyword
        this.msgList = []
        this.hasMore = true
        this.skip = Number.MAX_SAFE_INTEGER
        this.conversation_id = conversation_id
        this.conversation = await uniIm.conversation.get(conversation_id)
        this.autoScrollToEl = ''
        this.fragment = null

        // 加载第一批匹配的聊天记录
        this.loadData(() => {
          // 自动滚动到底
          this.autoScrollToEl = 'bottom-el'
        })
      },
      async loadData(afterLoaded) {
        this.loading = true
        let result = await uniImCo.getFilteredMessageOfConversation({
          keyword: this.keyword,
          skip: this.skip,
          conversation_id: this.conversation_id,
        })
        this.msgList.unshift(...result.data.reverse())
        if (this.count < this.msgList.length) {
          // 计数以传入的 count 为准，除非实际查询到的更多
          this.count = this.msgList.length
        }
        this.hasMore = result.hasMore
        this.skip = result.skip
        this.loading = false
        this.$nextTick(afterLoaded)
      },
      onScrollToUpper(evt) {
        if (this.loading) return
        if (!this.hasMore) return
        let elId = 'bottom-el'
        if (this.msgList.length > 0) {
          elId = 'msg-' + this.msgList[0]._id
        }
        this.autoScrollToEl = ''
        this.loadData(() => {
          this.autoScrollToEl = elId
        })
      },
      onEnterConversation(conversation_id) {
        this.$emit('to-chat', { conversation_id })
      },
      onOpenFragment(msg) {
        this.fragment = msg
      },
      onCloseFragment() {
        this.fragment = null
      },
      toFriendlyTime(msg) {
        return uniIm.utils.toFriendlyTime(msg.create_time || msg.client_create_time)
      }
    }
  }
</script>

<style lang="scss">
@import "@/uni_modules/uni-im/common/baseStyle.scss";
.chat-filtered {
  flex: 1;
  height: 100%;
  background-color: #efefef;
  /* #ifdef H5 */
  .pc {
    // .pc内的元素只有pc端打开才显示，样式在index页面
    display: none;
  }
  /* #endif */
  
  .head {
    flex-direction: row;
    justify-content: space-between;
    height: 30px;
    line-height: 30px;
    padding: 0px 15px;
    font-size: 12px;
    border-bottom: 1px solid #ddd;
  }
  
  .hint {
    color: #999;
  }
  
  .enter-chat {
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
    flex-direction: row;
    padding: 0 5px;
  }
  
  /* #ifdef H5 */
  .enter-chat:hover {
    background-color: #ddd;
  }
  /* #endif */
  
  .message-list {
    height: calc(100% - 30px);
  }
  
  .uni-im-msg ::v-deep .msg-content {
    width: calc(95% - 40px);
  }
  
  .float-info {
    align-items: flex-end;
    position: absolute;
    top: 0;
    right: 0px;
    font-size: 12px;
    color: #999;
    padding: 10px;
  }
  
  .enter-fragment {
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
    color: #576b95;
  }
  
  /* #ifdef H5 */
  .enter-fragment:hover {
    color: #7c8cae;
  }
  
  .uni-im-msg:hover .enter-fragment {
    display: block;
  }
  /* #endif */
  
  .chat-fragment {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-color: white;
  }
}
</style>
