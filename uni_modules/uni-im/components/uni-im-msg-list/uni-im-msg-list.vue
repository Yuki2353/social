<template>
  <view class="uni-im-msg-list-root">
    <uni-im-list class="uni-im-list" :scrollTop="scrollTop"
      :scroll-into-view="scrollIntoView" ref="uni-im-list"
      @scroll="onScroll" @scrolltolower="onScrollToLower"
    >
     <template v-for="(msg,index) in visibleMsgList" :key="msg.unique_id || msg._id">
       <view class="uni-im-list-item" :ref="'item-'+index">
         <view v-if="index === 0" class="data-state-tip-box">
           <uni-im-load-state :status="hasMore?'loading':'noMore'" 
              :contentText='{"contentrefresh": "正在加载历史消息","contentnomore": "没有更多历史消息"}'></uni-im-load-state>
         </view>
         <view :class="['item',msg.type]" :id="'item-'+index" @click="clickItem">
           <view class="msg-box" :class="{'active-msg':msg._id === activeMsgId || msg.unique_id === activeMsgId,'pointer':chooseMore}" @click="checkMsg(msg)">
             <template v-if="chooseMore">
              <checkbox :checked="checkedMsgList.find(i=>i._id == msg._id) != undefined" class="checkbox" />
              <view class="mask"></view>
             </template>
             <!-- <text style="width: 750rpx;text-align: center;border: 1px solid #000;">{{'item-'+index}}</text> -->
             <uni-im-msg :msg="msg" :id="msg._id" :self="current_uid() == msg.from_uid" :index="index"
             @putChatInputContent="putChatInputContent" :equalPrevTime="equalPrevTime(index)" 
             :avatar_file="conversation.avatar_file" @showMsgById="showMsgById" @showControl="showControl" 
             @loadMore="loadMore" @longpressMsgAvatar="longpressMsgAvatar" @retriesSendMsg="retriesSendMsg" 
             @viewMsg="viewMsg" :ref="'uni-im-msg'" class="uni-im-msg"
             >
             </uni-im-msg>
           </view>
         </view>
       </view>
     </template>
     <uni-im-load-state v-if="visibleMsgList.length === 0" :status="hasMore?'loading':'noMore'" class="uni-im-list-item" :contentText='{"contentrefresh": "加载中","contentnomore": "- 没有聊天记录 -"}'></uni-im-load-state>
    </uni-im-list>
    
    <view v-if="hasNewMsg" class="new-msg-bar" @click="showLast">
      <uni-icons type="pulldown" size="18" color="#007fff"></uni-icons>
      <text>有新消息</text>
    </view>
    
    <view style="position: fixed;top: 100px;width: 500rpx;">
      <!-- hasNewMsg:{{hasNewMsg}} -->
      <!-- scrollTop：{{scrollTop}} -->
      <!-- scrollIntoView:{{scrollIntoView}}
			visibleMsgList.length:{{visibleMsgList.length}} -->
			<!-- <button @click="showLast">showLast</button> -->
		</view>

    <view v-if="call_list.length" class="showCallMe" @click="showCallMe">@回复我({{call_list.length}})</view>

    <uni-popup @change="$event.show?'':closeGroupNotification()" ref="group-notification-popup" type="center" class="group-notification-popup">
      <uni-im-group-notification ref="group-notification"></uni-im-group-notification>
    </uni-popup>

    <uni-im-view-msg ref="view-msg"></uni-im-view-msg>
  </view>
</template>

<script>
/**
 * uni-im-msg-list 组件，渲染一个会话列表。
 * 
 * 内部使用 {@link module:uni-im-list} 组件实现列表功能，使用 {@link module:uni-im-msg} 组件实现每条消息的渲染。
 * 
 * @module
 * @see module:chat
 * @see module:uni-im-list
 */
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  import {
    store as uniIdStore
  } from '@/uni_modules/uni-id-pages/common/store';

  import uniImList from './components/uni-im-list/uni-im-list';

  // 一页多少条数据
  let pageLimit = 30
  // 当前页面滚动条高度
  let currentScrollTop = 0
  
  let appearObj = {};

  export default {
    components: {
      uniImList
    },
    emits:['checkedMsgList','update:checkedMsgList','longpressMsgAvatar','showControl','clickItem','retriesSendMsg','putChatInputContent'],
    computed: {
      ...uniIm.mapState(['systemInfo', 'isWidescreen']),
      loadState() {
        return this.hasMore ? '正在加载历史消息' : '没有更多历史消息'
      },
      hasMore() {
        return this.conversation.hasMore
      },
      visibleMsgList() {
        const msgList = this.conversation.msgList || []
        // 过滤掉，撤回消息的指令型消息 、 群头像更新（指令型）消息
        const visibleMsgList = uniIm.utils.filterMsgList(msgList)
        // 返回倒数 laterRenderIndex 条消息，实现懒渲染
                                    .slice(-this.laterRenderIndex)
        this.$nextTick(() => {
          uniIm.utils.throttle(this.setIntersectionObserver, 3000);
        })
        return visibleMsgList
      }
    },
    data() {
      return {
        conversation: {
          hasMore: true,
          has_unread_group_notification: false,
          group_info: {
            notification: false
          }
        },
        scrollIntoView: "",
        scrollTop: 0,
        hasNewMsg: false,
        call_list: [],
        activeMsgId: "",
        loadMoreIng: false,
        // 延迟渲染，避免页面卡顿
        laterRenderIndex: pageLimit
      }
    },
    watch: {
      'conversation.call_list'(call_list) {
        this.call_list = call_list
      },
      'conversation.has_unread_group_notification': {
        async handler(hasUnreadGroupNotification) {
          const group_notification = this.conversation?.group_info?.notification
          const conversation_id = this.conversationId
          // 弹出群公告
          if (hasUnreadGroupNotification && group_notification && group_notification.content) {
            await uniIm.utils.sleep(1000)
            // TODO 临时解决，公告还没弹出来就切换会话，导致弹出多次
            if(conversation_id !== this.conversationId){
              return
            }
            // 判断列表中是否已经渲染了此群公告，是则 call 当前用户。否则弹框提示
            let groupNotificationMsg = [...this.visibleMsgList].reverse().find(msg => msg.action ===
              'update-group-info-notification')
            // console.log('groupNotificationMsg', groupNotificationMsg,this.visibleMsgList);
            
            if (groupNotificationMsg) {
              this.conversation.call_list.push(groupNotificationMsg._id)
              this.closeGroupNotification()
            } else {
              this.$refs["group-notification-popup"].open()
              this.$nextTick(() => {
                this.$refs["group-notification"].notification = group_notification
              })
            }
          }
        },
        immediate: true
      }
    },
    props: {
      conversationId: {
        default () {
          return false
        }
      },
      chooseMore: {
        default: false
      },
      checkedMsgList: {
        default () {
          return []
        }
      }
    },
    async mounted() {
      // for (var i = 0; i < 10; i++) {
      // 	this.msgList.unshift({
      // 		t:i
      // 	})
      // }
      //
    },
    destroyed() {
      // console.log('destroyed')
      if (this.intersectionObserver){
        this.intersectionObserver.disconnect()
      }
    },
    methods: {
      async init() {
        if (this.intersectionObserver){
          this.intersectionObserver.disconnect()
        }
        this.conversation = await uniIm.conversation.get(this.conversationId)
        // init data --start
        this.scrollIntoView = ''
        this.scrollTop = 0
        currentScrollTop = 0
        this.laterRenderIndex = pageLimit

        if (!this.conversation.isInit) {
          this.conversation.hasMore = true
          await this.loadMore()
          this.conversation.isInit = true
          if (this.conversation.hasMore && this.visibleMsgList.length < pageLimit) {
            console.log('不满一屏时，再loadMore一次');
            await this.loadMore()
          }
        }

        if(this.isWidescreen){
          this.$nextTick(()=>{
            this.showLast()
            // TODO：未知原因，部分情况下 $nextTick时机执行不能定位到最后一条，需要用setTimeout 500再次定位
            setTimeout(() => {
              this.showLast()
            },500)
          })
        }
      },
      async loadMore(callback) {
        let datas = []
        if(this.laterRenderIndex < this.conversation.msgList.length){
          let oldVisibleMsgList = JSON.parse(JSON.stringify(this.visibleMsgList))
          await this.canHoldScrollDo(()=>{
            this.laterRenderIndex += pageLimit
          })
          await this.$nextTick()
          // 新加载到的数据为：oldVisibleMsgList和this.visibleMsgList的差集
          datas = this.visibleMsgList.filter(i => !oldVisibleMsgList.some(j => j._id == i._id))
          // console.log('beforeLoadMore 懒渲染=>',this.laterRenderIndex,this.conversation.msgList.length);
        }else{
          datas = await this.conversation.msgManager.getHistory()
          // console.error(`加载到${datas.length}条，历史聊天数据`);
          // console.log('加载到历史聊天数据：', datas);
          if (datas.length === 0) {
            this.conversation.hasMore = false
          } else {
            await this.insertMsg(datas)
          }
        }
        if (typeof callback === 'function') {
          // 为兼容 web pc端特殊场景 不能使用$nextTick
          setTimeout(() => {
            callback(datas)
          }, 0)
        }
        return datas
      },
      async beforeLoadMore() {
        if (!this.loadMoreIng && this.hasMore) {
          this.loadMoreIng = true
          await this.loadMore()
          this.loadMoreIng = false
        }
      },
      msgOnAppear(msgId){
        uniIm.utils.throttle(()=>{
          let index = this.visibleMsgList.findIndex(i => i._id == msgId)
          if (index == -1) {
            return //因为是异步的，可能已经被销毁了替换了新对象
          }
          // console.log('msgOnAppear',index);
        }, 1000);
      },
      async setIntersectionObserver() {
        // console.log('setIntersectionObserver');
        if (this.intersectionObserver) {
          // console.log('this.intersectionObserver存在','执行销毁');
          this.intersectionObserver.disconnect()
        }
        
        await uniIm.utils.sleep(1000)
        
        this.intersectionObserver = uni.createIntersectionObserver(this, { observeAll: true })
          .relativeTo('.uni-im-list', {})
          .observe('.uni-im-msg', (res) => {
            const msgId = res.id
            const msgRef = this.$refs['uni-im-msg'].find(item => item.msg._id == msgId)
            if (!msgRef) {
              // console.error('找不到msgRef，或会话已切走', msgId);
              return
            }
            
            // hasBeenDisplayed表示是否已经显示过了
            const hasBeenDisplayed = appearObj[msgId] || false;
            // 新显示的
            const isAppear = res.intersectionRatio > 0 && !hasBeenDisplayed
            
            
            // 是否为最后一条消息
            const isLastMsg = [...this.visibleMsgList].pop()?._id === msgId
            if(isLastMsg){
              this.lastMsgIsShow = isAppear
              if(this.lastMsgIsShow){
                this.hasNewMsg = false
              }
            }
            
            if (isAppear) {
              appearObj[msgId] = true;
              msgRef.onAppear()
              this.msgOnAppear(msgId)
              
              // console.error('出现了',msgRef.msg.body)
              const isFirstMsg = this.visibleMsgList[0]?._id === msgId
              // 是否为第一个消息
              if (isFirstMsg) {
                // console.log('第一个消息出现在视窗内，加载更多',this.visibleMsgList[0]?._id , msgId);
                this.beforeLoadMore()
              }
              // 调用扩展点，通知消息列表某条消息进入显示区。
              uniIm.extensions.invokeExts('msg-appear', msgRef.msg, {
                user_id: uniCloud.getCurrentUserInfo().uid,
                isInternalUser: this.uniIDHasRole('staff'),
              })
            } else if (!res.intersectionRatio > 0 && hasBeenDisplayed) {
              appearObj[msgId] = false;
              msgRef.onDisappear()
              // console.error('消失了',msgRef.msg.body)
              // 调用扩展点，通知消息列表某条消息离开显示区。
              uniIm.extensions.invokeExts('msg-disappear', msgRef.msg, {
                user_id: uniCloud.getCurrentUserInfo().uid,
                isInternalUser: this.uniIDHasRole('staff'),
              })
            }
          })
      },
      viewMsg(msgList) {
        this.$refs['view-msg'].open(msgList);
      },
      async onScroll(e) {
        // 记录当前滚动条高度
        currentScrollTop = e.detail.scrollTop
        // console.log('onScroll', e.detail.scrollTop)
        
        // TODO:滚动停止后，将end置为true
        this.onScroll.end = false
        if (this.onScroll.timeoutId) {
          clearTimeout(this.onScroll.timeoutId)
        }
        this.onScroll.timeoutId = setTimeout(() => {
          this.onScroll.end = true
        }, 500)
      },
      async onScrollToLower() {
      },
      async canHoldScrollDo(fn){
        /**
         * 解决web-pc端，部分情况下插入消息滚动内容会跳动的问题
         */
        // #ifdef H5
        if(this.isWidescreen){
          if(this.systemInfo.browserName === "chrome"){
            // console.error('currentScrollTop',currentScrollTop)
            if(currentScrollTop === 0 && this.visibleMsgList.length != 0){
              this.scrollTop = currentScrollTop
              currentScrollTop += 1
              await this.$nextTick(()=>this.scrollTop = currentScrollTop)
              
              if(!this.canHoldScrollDo.tryIndex){
                this.canHoldScrollDo.tryIndex = 1
              }else{
                this.canHoldScrollDo.tryIndex ++
              }
              
              if(this.canHoldScrollDo.tryIndex > 100){
                console.error('canHoldScrollDo tryIndex > 100')
                fn()
              }else{
                this.$nextTick(()=>this.canHoldScrollDo(fn))
              }
            }else{
              fn()
            }
          }else{
            const getScrollContentHeight = ()=>document.querySelector('.scroll-content').offsetHeight
            let scrollContent = getScrollContentHeight()
            fn()
            this.$nextTick(()=>{
              const diff = getScrollContentHeight() - scrollContent
              console.error( diff, diff)
              this.scrollTop = currentScrollTop
              currentScrollTop += diff
              this.$nextTick(()=> this.scrollTop = currentScrollTop)
            })
          }
          return
        }
        // #endif
        fn()
      },
      async insertMsg(data) {
        // 重新获取会话对象，防止web pc端 切换太快引起的会话对象指向错误
        const conversation = await uniIm.conversation.get(data[0].conversation_id)
        this.canHoldScrollDo(()=>{
          conversation.msgList.unshift(...data)
          // 有新消息插入laterRenderIndex的值重新设置
          this.laterRenderIndex += data.length
        })
      },
      equalPrevTime(index) {
        if (index === 0) {
          return false
        } else if (index == this.visibleMsgList.length - 1) {
          return false
        } else {
          const getFriendlyTime = (msg) => {
            return uniIm.utils.toFriendlyTime(msg.create_time || msg.client_create_time)
          }
          return getFriendlyTime(this.visibleMsgList[index]) == getFriendlyTime(this.visibleMsgList[index - 1])
        }
      },
      async showCallMe() {
        let msgId = this.conversation.call_list.pop()
        console.log('msgId', msgId)
        this.showMsgById(msgId)
      },
      showLast() {
        let mLength = this.visibleMsgList.length
        this.showMsgByIndex(mLength - 1)
        this.hasNewMsg = false
      },
      notifyNewMsg() {
        this.hasNewMsg = true
        // 如果当前在底部，则自动显示最新消息
        if (this.lastMsgIsShow) {
          this.showLast()
        }
      },
      async getElInfo(select){
        return await new Promise((resolve, rejece) => {
          const query = uni.createSelectorQuery().in(this);
          query.select(select).boundingClientRect(data => {
            if (!data) {
              console.log('找不到 showMsgByIndex' + select);
              return rejece(false)
            }
            resolve(data)
          }).exec()
        })
      },
      async showMsgByIndex(index) {
        if (index == -1) {
          return
        }
        const listHeight = (await this.getElInfo('.uni-im-list')).height
        const targetInfo = await this.getElInfo('#item-' + index)
        const itemScrollTop = targetInfo.top
        // console.error('currentScrollTop',currentScrollTop)
        // console.error('itemScrollTop',itemScrollTop,listHeight,currentScrollTop,index)
        let val = 0;
        let m = listHeight - targetInfo.height
        if(m < 0){
          m = 10
        }
         if(this.isWidescreen){
           val = itemScrollTop + currentScrollTop - 0.5 * m
         }else{
           val = itemScrollTop * -1 + currentScrollTop + 0.3 * m
         }
        
        // console.error('val',val)
        // 赋值为当前滚动条的高度
        this.scrollTop = currentScrollTop
        // 设置一个新值触发视图更新 -> 滚动
        this.$nextTick(async () => {
          this.scrollTop = val
          currentScrollTop = val
          // console.error('currentScrollTop',currentScrollTop)
        })
      },
      async showMsgById(msgId) {
        // 找到消息的索引
        let index = this.visibleMsgList.findIndex(i => i._id == msgId)
        if (index === -1) {
          // 如果找不到，先加载更多，再找
          uni.showLoading();
          const {_findIndex} = this.showMsgById
          if (!_findIndex) {
            this.showMsgById._findIndex = 0
          } else if (_findIndex > 30) {
            uni.hideLoading()
            this.showMsgById._findIndex = false
            return console.error('防止特殊情况下死循环，不加载30屏以外的引用数据');
          }
          this.showMsgById._findIndex++
          await this.loadMore()
          this.showMsgById._findIndex = false
          await uniIm.utils.sleep(300)
          uni.hideLoading()
          return await this.showMsgById(msgId)
        }
        
        this.activeMsgId = msgId
        if(this.showMsgActiveColorActionT){
          clearTimeout(this.showMsgActiveColorActionT)
        }
        this.showMsgActiveColorActionT = setTimeout(() => {
          this.activeMsgId = ''
        }, 2000);
        this.showMsgByIndex(index)

        // 如果是显示群公告，则设置未读的群公告内容为 false
        if (this.visibleMsgList[index].action === "update-group-info-notification") {
          this.closeGroupNotification()
        }

      },
      closeGroupNotification() {
        // console.log('######关闭群公告',this.conversationId)
        
        const db = uniCloud.database();
        
        db.collection('uni-im-conversation')
        .where({
          id:this.conversationId,
          user_id: uniCloud.getCurrentUserInfo().uid
        })
        .update({
          has_unread_group_notification: false
        }).then(res => {
          this.conversation.has_unread_group_notification = false
          // console.log('关闭群公告成功', res)
        }).catch(err => {
          console.error('关闭群公告失败', err)
        })
      },
      isChecked(msg) {
        return this.checkedMsgList.some(i => i._id === msg._id)
      },
      checkMsg(msg) {
        if (!this.chooseMore) {
          return
        }
        let checkedMsgList = this.checkedMsgList
        if (this.isChecked(msg)) {
          checkedMsgList.splice(checkedMsgList.findIndex(i => i._id === msg._id), 1)
        } else {
          checkedMsgList.push(msg)
        }
        this.$emit('update:checkedMsgList', checkedMsgList)
      },
      //当前用户自己的uid
      current_uid() {
        return uniCloud.getCurrentUserInfo().uid;
      },
      showControl(e) {
        this.$emit('showControl', e)
      },
      longpressMsgAvatar(e) {
        this.$emit('longpressMsgAvatar', e)
      },
      retriesSendMsg(e) {
        this.$emit('retriesSendMsg', e)
      },
      clickItem() {
        this.$emit('clickItem')
      },
      putChatInputContent(msgBody) {
        this.$emit('putChatInputContent', msgBody)
      }
    }
  }

</script>

<style lang="scss">
.uni-im-msg-list-root{
  &,.uni-im-list {
    background-color: transparent;
    height: 100%;
  }
  
  .uni-im-list-item {
    transform: scale(1, -1);
    .uni-im-msg {
      width: 0;
      flex-grow: 1;
    }
  }
  /* #ifdef H5 */
  @media screen and (min-device-width:960px) {
    .uni-im-list-item {
       // 关闭上下翻转
       transform: scale(1, 1);
     }
  }
  /* #endif */
  
  
  .item {
    margin:10px 0;
    // border: solid 1px #0055ff;
  }
  .uni-im-list-item .system .checkbox {
    display: none;
  }
  
  .data-state-tip-box {
    // height: 35px;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    color: #999999;
    margin-bottom: -5px;
    margin-top: 10px;
  }
  
  .data-state-tip-text {
    height: 36px;
    line-height: 36px;
    font-size: 12px;
    margin: 0 5px;
    color: #999999;
  }
  
  /* #ifdef H5 */
  .loadMore-btn {
    font-size: 14px;
    color: #666;
  }
  
  .loadMore-btn::after {
    display: none;
  }
  
  /* #endif */
  .msg-box {
    position: relative;
    transition-property: background-color;
    transition-duration: 2s;
    flex-direction: row;
  }
  
  .msg-box .checkbox {
    margin: 30px 0 0 10px;
    // transform: translateX(20px);
  }
  
  .msg-box .mask {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 999;
    width: 100%;
    height: 100%;
  }
  
  .active-msg {
    background-color: #f9f9f9;
  }
  
  .showCallMe {
    background-color: #62caf8;
    border-radius: 50px;
    padding: 2px 15px;
    font-size: 12px;
    color: #FFF;
    position: fixed;
    right: 5px;
    top: 10px;
    /* #ifdef H5 */
    top: 55px;
    cursor: pointer;
  
    @media screen and (min-device-width:960px) {
      top: calc(7vh + 20px);
      right: 30px;
      font-size: 16px;
    }
  
    /* #endif */
  }
  
  .group-notification-popup {
    z-index: 9999;
  }
  
  .new-msg-bar {
    position: absolute;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    right: 40px;
    bottom: 10px;
    font-size: 12px;
    background-color: white;
    color: #007fff;
    padding: 5px 8px 5px 5px;
    border-radius: 15px 15px 15px 15px;
    /* #ifdef H5 */
    pointer-events: auto;
    cursor: pointer;
    /* #endif */
  }
  /* #ifdef H5 */
  .pointer {
    cursor: pointer;
  }
  /* #endif */
}
</style>