<template>
  <view class="uni-im-filtered-conversation-list">
    <view v-if="loading" class="hint">正在查找……</view>
    <scroll-view v-else class="conversation-list" ref="filtered-conversation-list" scroll-y="true">
      <template v-if="noMatched">
        <view class="hint">没有匹配的内容</view>
      </template>

      <template v-if="matchedFriends.data?.length">
        <view class="category-name">联系人</view>
        <uni-im-info-card
          class="conversation-list-item"
          v-for="item in matchedFriends.data"
          :key="item.id"
          :title="item.title"
          note=" "
          :avatar="item.avatar_file?.url || '/uni_modules/uni-im/static/avatarUrl.png'"
          clickable
          @click="$emit('to-chat', {friend_uid:item.friend_uid})"
        />
        <view v-if="matchedFriends.loading" class="category-loadmore">正在加载……</view>
        <view v-else-if="matchedFriends.hasMore || matchedFriends.localMore" class="category-loadmore">
          <view
            class="btn-loadmore"
            @click="loadMoreFriends"
          >显示更多</view>
        </view>
      </template>

      <template v-if="matchedGroups.data?.length">
        <view class="category-name">群聊</view>
        <uni-im-info-card
          class="conversation-list-item"
          v-for="item in matchedGroups.data"
          :key="item.id"
          :title="item.title"
          note=" "
          :avatar="item.avatar_file?.url || '/uni_modules/uni-im/static/avatarUrl.png'"
          :tags="['群聊']"
          clickable
          @click="$emit('to-chat', {group_id:item.group_id})"
        />
        <view v-if="matchedGroups.loading" class="category-loadmore">正在加载……</view>
        <view v-else-if="matchedGroups.hasMore || matchedGroups.localMore" class="category-loadmore">
          <view
            class="btn-loadmore"
            @click="loadMoreGroups"
          >显示更多</view>
        </view>
      </template>

      <template v-if="matchedConversations.data?.length">
        <view class="category-name">聊天记录</view>
        <uni-im-info-card
          class="conversation-list-item"
          v-for="item in matchedConversations.data"
          :key="item.id"
          :title="item.title"
          :note="`${item.count}条相关聊天记录`"
          :avatar="item.avatar_file?.url || '/uni_modules/uni-im/static/avatarUrl.png'"
          :tags="item.type==2 ? ['群聊'] : []"
          clickable
          @click="$emit('to-chat-filtered', { conversation_id: item.id, count: item.count, keyword: keyword })"
        />
        <view v-if="matchedConversations.loading" class="category-loadmore">正在加载……</view>
        <view v-else-if="matchedConversations.hasMore || matchedConversations.localMore" class="category-loadmore">
          <view
            class="btn-loadmore"
            @click="loadMoreConversations"
          >显示更多</view>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script>
  // 防抖
  function debounce(delay = 200) {
    let timer = null
    let busy = false
    let last_kw = ''
    let debouncedFn = function(kw, cb) {
      last_kw = kw
      if (busy) {
        // 如果上一次请求还没完成，则本次不执行，只记录参数，事后补发
        return
      }
      if (timer) {
        // 如果还在防抖期间，则重新计算防抖期
        clearTimeout(timer)
      }
      timer = setTimeout(async () => {
        // 防抖时间到，调用 cb 执行请求
        let kw = last_kw
        timer = null
        busy = true
        last_kw = ''
        await cb(kw)
        busy = false

        // 如果执行期间又有请求进来，则补发请求
        if (last_kw) {
          debouncedFn(last_kw, cb)
        }
      }, delay)
    }
    return debouncedFn
  }

  const debouncedSearch = debounce()
  const uniImCo = uniCloud.importObject("uni-im-co", {
    customUI: true
  })
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';

  export default {
    emits:['to-chat', 'to-chat-filtered'],

    props: {
      keyword: {
        type: String,
        default: ''
      },
    },

    data() {
      return {
        loading: true,
        matchedFriends: {},
        matchedGroups: {},
        matchedConversations: {},
        
        canCheck: false,
      }
    },

    computed: {
      noMatched() {
        return this.matchedFriends.data.length == 0
          && this.matchedGroups.data.length == 0
          // && this.matchedConversations.data.length == 0
      }
    },

    watch: {
      keyword: {
        handler(keyword) {
          debouncedSearch(keyword, async (keyword) => {
            this.loading = true
            let {
              matchedFriends,
              matchedGroups,
              matchedConversations
            } = await uniImCo.getFilteredConversationList({ keyword })
            this.matchedFriends = matchedFriends
            this.matchedGroups = matchedGroups
            this.matchedConversations = matchedConversations

            if (this.matchedFriends.data.length > 5) {
              this.matchedFriends.localMore = this.matchedFriends.data.splice(5)
            }
            if (this.matchedGroups.data.length > 5) {
              this.matchedGroups.localMore = this.matchedGroups.data.splice(5)
            }
            if (this.matchedConversations.data.length > 5) {
              this.matchedConversations.localMore = this.matchedConversations.data.splice(5)
            }

            this.loading = false
          })
        },
        immediate: true
      }
    },

    methods: {
      loadMoreFriends() {
        this._loadMore(this.matchedFriends, 'getSingleConversationsByFriendName')
      },

      loadMoreGroups() {
        this._loadMore(this.matchedGroups, 'getGroupConversationsByName')
      },

      loadMoreConversations() {
        this._loadMore(this.matchedConversations, 'getConversationsByMessage')
      },

      async _loadMore(list, method) {
        if (list.localMore) {
          list.data.push(...list.localMore)
          delete list.localMore
          return
        }
        if (list.loading) return
        if (!list.hasMore) return
        list.loading = true
        let more = await uniImCo[method]({
          keyword: this.keyword,
          skip: list.skip,
        })
        list.data.push(...more.data)
        list.hasMore = more.hasMore
        list.skip = more.skip
        list.loading = false
      }
    }
  }
</script>

<style lang="scss">
.uni-im-filtered-conversation-list{
  .hint {
    text-align: center;
    color: #aaa;
  }
  
  .category-name {
    font-size: 14px;
    color: #999;
    margin: 0.3em 0.5em;
  }
  
  .category-loadmore {
    background-color: #fff;
    padding: 6px 15px 10px;
    flex-direction: row;
    font-size: 12px;
    color: #576b95;
  }
  
  .btn-loadmore {
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }
  .btn-loadmore:hover {
    color: #7c8cae;
  }
  
  .conversation-list,
  .tip {
    flex: 1;
  }
  .conversation-list .conversation-list-item {
    background-color: #fff;
  }
  .conversation-list .conversation-list-item.focus {
    border: 2px solid #1ab94e;
  }
  
  .conversation-list .conversation-list-item:hover {
    background-color: #f8f8f8;
  }
  
  .conversation-list .conversation-list-item {
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }
  /* #ifdef H5 */
  .conversation-list ::v-deep .conversation-list-item .uni-list--border {
    display: none;
  }
  /* #endif */
  
  .conversation-list .conversation-list-item.activeConversation {
    background-color: #f8f8f8;
  }
  
  .check-box{
    border: 1px solid #ccc;
    width: 20px;
    height: 20px;
    border-radius: 2px;
    margin-right: 10px;
  }
  .check-box.checked{
    background-color: #00a953;
    border-color: #00a953;
  }
}
</style>
