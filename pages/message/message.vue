<template>
	<view id="page" class="uni-im-index">
		
		<!-- #ifdef H5 -->
    <!-- 底部栏 -->
    <view id="foot" v-if="isWidescreen">
      
      <view class="item">
        <image class="icon" src="https://mp-172f98d6-0564-4974-980e-d78dc9189b22.cdn.bspapp.com/cloudstorage/af92325b-6993-4765-8c80-4c69eb900fa7.png" mode="widthFix"></image>
      	<text>APP端</text>
        <uni-link class="link" href="https://im.dcloud.net.cn/uni-portal.html" text="下载地址"></uni-link>
      </view>
      
      <view class="item">
        <image class="icon" src="https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/hx.png" mode="widthFix"></image>
      	<text>离线通知插件</text>
        <uni-link class="link" href="https://ext.dcloud.net.cn/plugin?id=16984" text="下载地址"></uni-link>
      </view>
      
      <view class="item">
        <image class="icon" src="https://web-assets.dcloud.net.cn/unidoc/zh/git-1.png" mode="widthFix"></image>
      	<text>本项目已开源</text>
        <uni-link class="link" href="https://gitcode.net/dcloud/hello-uni-im/-/tree/v3" text="git仓库地址"></uni-link>
      </view>
      
    </view>

		<!-- 布局最左侧 菜单栏 -->
		<view id="left-view" v-if="isWidescreen" @click="chatInfoIsShow = false;">
			<cloud-image class="user-avatar" @click="toUcenter" :src="avatarUrl" width="40px" height="40px"
				borderRadius="100px"></cloud-image>
			<!-- {{currentUserInfo.username}} -->
			<uni-badge @contextmenu.prevent.native="openConversationMenu($event,'unreadMsgCount')" class="chat-icon" size="small" :text="unreadMsgCount" absolute="rightTop" type="error">
				<uni-icons  @click="showChatView"
					:color="contactsViewIsShow?'#c5c5c5':'#5fc08e'" size="32" type="chatbubble-filled"></uni-icons>
			</uni-badge>
			<uni-badge id="show-contacts-btn" size="small" :text="unreadnotificationCount" absolute="rightTop" type="error">
				<uni-icons @click="showContactsView" :color="contactsViewIsShow?'#5fc08e':'#c5c5c5'" size="32"
					type="staff-filled"></uni-icons>
			</uni-badge>
		</view>
		<!-- #endif -->

		<!-- 会话列表 -->
		<view id="center-view">
			<!-- #ifdef H5 -->
      <template v-if="isWidescreen">
        <!-- 搜索会话用户、聊天记录... -->
        <view id="search-bar-box" v-show="!contactsViewIsShow">
        	<uni-search-bar v-model="keyword" id="search-bar" radius="5" placeholder="搜索" clearButton="auto" cancelButton="none"></uni-search-bar>
        	<uni-icons class="pointer" @click="beforeJoinGroup" color="#aaa" size="26" type="plus"></uni-icons>
        </view>
        <view id="uni-im-contacts-box" v-show="contactsViewIsShow">
        	<uni-im-contacts @clickMenu="clickMenu" id="uni-im-contacts" ref="uni-im-contacts"></uni-im-contacts>
        </view>
        <!-- 会话查找结果列表 -->
        <uni-im-filtered-conversation-list 
          v-if="keyword"
          ref="uni-im-filtered-conversation-list"
          id="conversation-list-box"
          :keyword="keyword"
          @to-chat="toChat($event)"
          @to-chat-filtered="toChatFiltered($event)"
        ></uni-im-filtered-conversation-list>
      </template>
			<!-- #endif -->
      
	  <!-- 自定义消息 -->
	  <saren-message-grid :count-list="countList"></saren-message-grid>
	  
      <!-- 会话用户列表 -->
      <uni-im-conversation-list 
        v-if="!keyword"
        ref="uni-im-conversation-list" @clickItem="toChat($event.id)"
        @change="conversationList = $event" :active-conversation-id="currentConversationId"
        id="conversation-list-box"
      ></uni-im-conversation-list>
		</view>

		<!-- #ifdef H5 -->
		<view id="right-view" v-if="isWidescreen">
			<!-- 聊天窗口 -->
			<view id="chat-view-box">
				<template v-if="!contactsViewIsShow && currentConversationId">
          <chat-filtered v-if="filteredConversationId" class="content" ref="chat-filtered" @to-chat="toChat($event)"/>
          <template v-else>
            <view class="header">
            	<uni-icons @click="showChatInfo" class="more" type="more-filled" size="20"></uni-icons>
            </view>
            <view class="content">
              <chat-view ref="chat-view"></chat-view>
              <view v-if="chatInfoIsShow" class="chatInfoBox" @click.stop="chatInfoIsShow = false">
                <view @click.stop class="group-info-parent">
                  <uni-im-group-info v-if="currentConversation.group_id" ref="group-info"></uni-im-group-info>
                  <uni-im-chat-info v-else ref="chat-info"></uni-im-chat-info>
                </view>
              </view>
            </view>
					</template>
					
				</template>
    
				<view v-else id="ccid-is-null-tip">
					<image class="img" src="https://im.dcloud.net.cn/static/favicon.ico" mode="widthFix"></image>
					<text class="text">未选择会话对象</text>
				</view>
			</view>
			<view id="dynamic-component-box" v-show="contactsViewIsShow">
				<view class="dynamic-component-title">{{view2Title}}</view>
				<component ref="dynamicComponent" :is="dynamicComponentName"></component>
			</view>
		</view>
    <uniImVideo></uniImVideo>
    <uni-im-contextmenu ref="uni-im-contextmenu" />
		<!-- #endif -->
	</view>
</template>

<script>
	import {
		store as uniIdStore,
		mutations as uniIdMutations
	} from '@/uni_modules/uni-id-pages/common/store.js';
	import uniIm from '@/uni_modules/uni-im/sdk/index.js';
	import contacts from '@/uni_modules/uni-im/pages/contacts/contacts';
	
	import pagesJson from '@/pages.json';

	// #ifdef H5
	import chatView from '@/uni_modules/uni-im/pages/chat/chat';
	import chatFiltered from '@/uni_modules/uni-im/pages/chat/chat-filtered';
	import notification from '@/uni_modules/uni-im/pages/contacts/notification/notification';
	import addPeopleGroups from '@/uni_modules/uni-im/pages/contacts/addPeopleGroups/addPeopleGroups';
	import groupList from '@/uni_modules/uni-im/pages/contacts/groupList/groupList';
	import createGroup from '@/uni_modules/uni-im/pages/contacts/createGroup/createGroup';
	import chatInfo from '@/uni_modules/uni-im/pages/chat/info';
	import groupInfo from '@/uni_modules/uni-im/pages/group/info';
  import uniImVideo from '@/uni_modules/uni-im/pages/common/video/video';
  let currentScrollTop = 0
	// #endif

	let lastConversationId = false
	export default {
		// #ifdef H5
		components: {
			chatView,
			chatFiltered,
			"uni-im-contacts": contacts,
			"uni-im-notification": notification,
			"uni-im-addPeopleGroups": addPeopleGroups,
			"uni-im-groupList": groupList,
			"uni-im-createGroup": createGroup,
			"uni-im-chat-info": chatInfo,
			"uni-im-group-info": groupInfo,
			uniImVideo
		},
		// #endif
		data() {
			return {
				// 自定义消息
				countList: [0, 0],
				
				users: {},
				dynamicComponentName: 'uni-im-addPeopleGroups', //通过动态组件引入页面在pc端显示
				view2Title: '加人/加群',
				contactsViewIsShow: false,
				chatInfoIsShow: false,
				currentConversation: {},
				keyword:'',
				conversationList: [],
				filteredConversationId: false, // 仅显示匹配的聊天记录的会话
			};
		},
		computed: {
			// 导入uniIm响应式数据，支持别名：比如:['a as b']
			...uniIm.mapState(['currentConversationId', 'isWidescreen']),
			unreadMsgCount() {
				return uniIm.conversation.unreadCount()
			},
			unreadnotificationCount() {
				return uniIm.notification.unreadCount()
			},
			currentUserInfo() {
				return uniIdStore.userInfo
			},
			avatarUrl() {
				if (this.currentUserInfo.avatar_file && this.currentUserInfo.avatar_file.url) {
					return this.currentUserInfo.avatar_file.url
				}
				return '/uni_modules/uni-im/static/avatarUrl.png'
			},
			
			// 自定义未读消息
			unreadPostMsgCount() {
				return this.countList.reduce((accu, item) => {
					return accu + item;
				}, 0);
			},
			// 聊天消息和自定义未读消息之和
			unreadMsgCountSum() {
				console.log("this.unreadMsgCount", this.unreadMsgCount);
				console.log("this.unreadPostMsgCount", this.unreadPostMsgCount);
				return this.unreadMsgCount + this.unreadPostMsgCount;
			},
			// 计算 消息页 的索引
			tabBarIndex() {
				const pages = getCurrentPages();
				const currentPage = pages[pages.length - 1].route;	// pages/message/message，不含query
				const tabList = pagesJson.tabBar.list;
				return  tabList.findIndex((item) => item.pagePath === currentPage);
			},
		},
		watch: {
			// 此处更改为 聊天和帖子消息之和
			unreadMsgCountSum: {
				handler(unreadMsgCount) {
					// console.log({
					// 	unreadMsgCount
					// });

					// #ifdef APP
					plus.runtime.setBadgeNumber(unreadMsgCount)
					// #endif

					if (unreadMsgCount == 0) {
						uni.removeTabBarBadge({
							index: this.tabBarIndex,
							complete: (e) => {
								// console.log(e)
							}
						})
					} else {
						uni.setTabBarBadge({
							index: this.tabBarIndex,
							text: unreadMsgCount + '',
							complete: (e) => {
								// console.log(e)
							}
						})
					}

					// 调用扩展点，更新未读消息总数。
					uniIm.extensions.invokeExts('ui-update-unread-count', unreadMsgCount)
				},
				immediate: true,
			},
			contactsViewIsShow(contactsViewIsShow) {
				if (contactsViewIsShow) {
					lastConversationId = this.currentConversationId
					uniIm.currentConversationId = false
				} else {
					if (lastConversationId) {
						uniIm.currentConversationId = lastConversationId
						this.$nextTick(() => {
							this.toChat(lastConversationId)
						})
					}
				}
			},
			//  根据当前会话id，设置会话对象
			async currentConversationId(id) {
				this.currentConversation = await uniIm.conversation.get(id)
				// 如果是被隐藏的会话，取消隐藏
				if(this.currentConversation.hidden){
				  this.currentConversation.hidden = false
				}
			}
		},
		async onLoad(param) {	
		  console.log('onLoad',param)
		  /**
		   * 打开index页面之前的扩展点，用于自己扩展登录等逻辑
		   */
		  await Promise.all(uniIm.extensions.invokeExts('index-load-before-extra', param))
      
		  const {tokenExpired} = uniCloud.getCurrentUserInfo()
		  if (tokenExpired < Date.now()) {
			console.info('当前用户的登录状态无效，将自动跳转至登录页面。', param)
			let url = '/uni_modules/uni-id-pages/pages/login/login-withoutpwd?uniIdRedirectUrl='
			let paramString = '/pages/message/message?'
			for (let key in param) {
				paramString += `${key}=${param[key]}&`
			}
			paramString = paramString.substring(0, paramString.length - 1) //携带参数，实现登录成功后 跳回首页时传回
			url += encodeURIComponent(paramString)
			return uni.redirectTo({
				url
			})
		  }
      
		  uniIm.onInitDataAfter(()=>{
			// console.log('onUniImInitDataAfter');
			// 执行当前页面初始化
			this.init(param)
		  })
		},
		// 自定义消息获取
		onShow() {
			this.loginCloudFunction({
				name: "saren-post-message",
				data: {
					method: "getCount"
				}
			})
			.then((res) => {
				const { like, comment } = res.result.data;
				this.countList = [like, comment];
			})
		},
		async onReady() {
			uni.$on('uni-im-toChat', param => {
			if (param) {
				// 关闭最后一次的会话id，防止切回后重新显示最后一次会话，而指定显示到某个会话
				lastConversationId = false
				this.toChat(param)
			}
			this.contactsViewIsShow = false
      })
			// #ifdef H5
      const shortcutKeyFn = (keyName,event)=>{
        const index = this.conversationList.findIndex(item=>item.id == this.currentConversationId)
        if(keyName == 'ArrowUp' && index > 0){
          this.toChat( this.conversationList[index - 1].id )
          event.preventDefault();
        }else if(keyName == 'ArrowDown' && index < this.conversationList.length){
          this.toChat( this.conversationList[index + 1].id )
          event.preventDefault();
        }
      }
      uniIm.utils.shortcutKey.withMeta(shortcutKeyFn)
      uniIm.utils.shortcutKey.withCtrl(shortcutKeyFn)
      
			let systemInfo = uni.getSystemInfoSync()
			uniIm.systemInfo = systemInfo
			if (systemInfo.browserName != 'chrome' && (this.isWidescreen == true || systemInfo.osName != 'ios')) {
			let newElement = document.createElement('div')
			newElement.innerHTML = `
			<div id="tip-browser-compatibility" style="background: #fff9ea;color: #ff9a43;position: fixed;top: 0;left: 0;width: 100vw;padding: 15px;font-size: 18px;">
				注意：本系统仅兼容chrome浏览器，其他浏览器可能出现异常。<a href="https://www.google.cn/chrome/">点此下载chrome浏览器</a>
			</div>
			`
			document.body.appendChild(newElement)
      }
      
      // 设置 right-view的宽为屏幕的百分之99
      // document.querySelector('#right-view').style.width = systemInfo.screenWidth - 360 + 'px'
			// #endif
		},
		onUnload() {
		},
    onBackPress(e) {
      const clRef = this.$refs['uni-im-conversation-list']
      if(clRef.focusConversationId){
        clRef.closeConversationMenu()
        return true
      }
    },
		onHide() {},
		methods: {
			clickMenu(data) {
				// console.log('79879789798898798978789', data);
				this.dynamicComponentName = data.componentName

				if (data.title) {
					this.view2Title = data.title
				}

        this.$nextTick(() => {
        	this.$refs.dynamicComponent.setParam(data.param || {})
          if (data.componentName == 'uni-im-createGroup') {
            this.$refs.dynamicComponent.getFriendsData()
          }
        })
				// console.log('data.componentName----',data.componentName);
			},
      /**
       * @description 根据群id，申请加入群聊
       * @param {Object} 群id
       */
      joinGroup(group_id){
        console.log('group_id',group_id);
        const db = uniCloud.database();
        uni.showLoading({
          title: '正在申请加群...',
          mask: true
        });
        db.collection('uni-im-group-join').add({
        	group_id,
        	"message":''
        }).then((res) => {
        	console.log("res: ",res);
          if(res.result.isPass){
            this.toChat("group_" + group_id)
          }else{
            uni.showToast({
            	icon: 'none',
            	title: '已提交加群申请，等待管理员审核'
            })
          }
        }).catch((err) => {
        	if(err.message === "已经是群成员"){
            console.log('已经是群成员 直接打开对应页面');
        		return this.toChat("group_" + group_id)
        	}
        	uni.showModal({
        		content: err.message || '请求服务失败',
        		showCancel: false
        	})
        })
        .finally(()=>{
          uni.hideLoading()
        })
      },
      // #ifdef H5
      beforeJoinGroup(){
        let group_id = prompt("请输入群id", "");
        if (group_id) {
          this.joinGroup(group_id)
        }
      },
      // #endif
			readQrCode() {
				uni.scanCode({
					complete: (e) => {
						// console.log(e);
						try {
							let data = JSON.parse(e.result)
							// console.log(data);
							if (data.type == 'uni-im' && data.subType == "groupInfo") {
							}
						} catch (e) {
						}
					}
				})
			},
			async init({
				conversation_id,
				goods,
				user_id,
        joinGroup
			}) {
        // console.log('init', {
        //   conversation_id,
        //   goods,
        //   user_id
        // });
        
				//  如果列表小于30个会话，尝试着从云端拉取一次
        if( this.conversationList.length < 30 ){
            await this.$nextTick()
            await this.$refs['uni-im-conversation-list'].loadMore()
        }else{
          console.log('会话列表已满一页，需要用户自己滚动到底，再拉取更多');
        }
				// console.log('this.conversationList.length',this.conversationList.length);
				if (conversation_id) {
					console.log('conversation_id', conversation_id);
					this.toChat(conversation_id)
				} else if (user_id) {
					//创建会话
					const currentConversation = await uniIm.conversation.get({
						friend_uid: user_id
					})
          // console.log('currentConversation', currentConversation);
          // 当前用户给对方发个消息
          this.toChat(currentConversation.id)
				}
        
        if(user_id){
          //  如果初始化时，指定了要访问的user会话。将指定要访问的会话排序位置置顶，方便看到
          // 场景：插件市场，点击联系作者。自动将此会话放到首个
          setTimeout(()=> {
            this.currentConversation.customIndex = Date.now()
          }, 0);
        }
				
				// 传递参数goods（对象格式，包含：商品名称name，链接url。自动设置对话框默认内容
				if (this.isWidescreen && goods) {
					// console.log(goods);
					if (typeof goods != 'object') {
						goods = JSON.parse(goods)
					}
					const {
						name,
						url
					} = goods
					if (name && url) {
						setTimeout(()=>{
							this.$refs['chat-view'].chatInputContent = '【' + name + ':' + url + '】'
						}, 1000);
					}
				}
        
        /**
         * 在本页面链接传递参数 joinGroup=group_id即可申请加入群，
         * 比如：http://localhost:8082/#/uni_modules/uni-im/pages/index/index?joinGroup=xxx
         */ 
        if(joinGroup){
        	// #ifdef H5
        	//删除URL后面的参数（主要是删除joinGroup=xxx），且不刷新页面
        	history.pushState({}, '', '/#/');
        	// #endif
          this.joinGroup(joinGroup)
        };
			},
			search(e) {
				// console.log("search-e: " + JSON.stringify(e));
				uni.showToast({
					title: '加好友功能入口，暂时在左侧菜单的通讯录中',
					icon: 'none',
					duration: 3000
				});
			},
			addUser() {
				uni.showToast({
					title: '加好友功能入口，暂时在左侧菜单的通讯录中',
					icon: 'none',
					duration: 3000
				});
			},
      showChatView() {
        this.contactsViewIsShow = false
        // 拿到所有存在未读消息的会话对象
        const ucId = uniIm.conversation.dataList
                          .filter(item => item.unread_count > 0)
                          .filter(item => !item.mute)
                          .map(item => item.id)
        if(ucId.length > 0){
          let index = ucId.findIndex(item => item.id == this.currentConversation.id)
          // 如果当前会话存在未读消息，则切换到下一个会话。如果当前会话不存在未读消息，则切换到第一个存在未读消息的会话
          index >= 0 ? index ++ : index = 0;
          this.toChat(ucId[index])
        }
      },
      showContactsView() {
        this.contactsViewIsShow = true
        // 判断是不是第一次打开
        if(!this.showContactsView.firstOpen){
          this.showContactsView.firstOpen = true
          this.$nextTick(() => {
            const contactsRef = this.$refs['uni-im-contacts']
            contactsRef.openPages(contactsRef.menuList[0])
          })
        }
      },
      toChatFiltered({ conversation_id, count, keyword }) {
        this.chatInfoIsShow = false;
        this.filteredConversationId = conversation_id
        uniIm.currentConversationId = conversation_id

        if (this.isWidescreen) { // 若为宽屏，则切换右侧的组件
          this.$nextTick(() => {
            let chatFilteredRef = this.$refs['chat-filtered']
            if (chatFilteredRef) {
              chatFilteredRef.load({
                conversation_id,
                keyword,
                count,
              })
            }
          })
        } else { // 若为窄屏，则打开新窗体
          uni.navigateTo({
            url: '/uni_modules/uni-im/pages/chat/chat-filtered'
                  + `?conversation_id=${conversation_id}`
                  + `&keyword=${encodeURIComponent(keyword)}`
                  + `&count=${count}`,
            animationDuration: 300
          })
        }
      },

      async toChat(param) {
        this.chatInfoIsShow = false;
        // console.log('toChat param',param);
        let conversation_id = await getConversationId(param)

        this.keyword = ''
        this.filteredConversationId = false
        uniIm.currentConversationId = conversation_id
        
        // console.log('conversation_id',conversation_id);
        
        if(conversation_id.indexOf('group_') === 0){
          uni.showLoading({
            title: '加载中',
            mask: false
          });
          const conversation = await uniIm.conversation.get(conversation_id)
          uni.hideLoading()
        }

        if (this.isWidescreen) { // 若为宽屏，则切换右侧的组件
          this.$nextTick(() => {
            let chatViewRef = this.$refs['chat-view']
            if (chatViewRef) {
              chatViewRef.load(conversation_id)
            }
          })
        } else { // 若为窄屏，则打开新窗体
          uni.navigateTo({
            url: '/uni_modules/uni-im/pages/chat/chat?conversation_id=' + conversation_id,
            animationDuration: 300
          })
        }
        
        async function getConversationId(param){
          if (typeof param == 'string') {
            return param
          } else {
            if (param.conversation_id) {
              return param.conversation_id
            } else if (param.group_id) {
              return 'group_' + param.group_id
            } else if (param.user_id || param.friend_uid) {
              // 注：这里不使用静态方法，为了将打开的会话可能不存在的情况，需要本地创建的情况
              return (await uniIm.conversation.get(param)).id
            } else {
              throw new Error("toChat param is error")
            }
          }
        }
      },
			showChatInfo() {
				this.chatInfoIsShow = !this.chatInfoIsShow
        if(this.chatInfoIsShow){
          this.$nextTick(()=>{
            if(this.currentConversation.group_id){
              this.$refs['group-info'].load(this.currentConversation.id)
            }else{
              this.$refs['chat-info'].load(this.currentConversation)
            }
          })
        }
			},
			toUcenter() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo?showLoginManage=true',
					complete(e) {
						// console.log("e: " + JSON.stringify(e));
					}
				})
			},
      openConversationMenu(e,name){
        const myContextmenu = this.$refs['uni-im-contextmenu']
        let menuList = []
        if(name == 'unreadMsgCount' && this.unreadMsgCount > 0){
          menuList.push({
            "title": "清空所有未读消息数",
            "action": () => {
              console.log('清空所有未读消息数')
              uniIm.conversation.clearUnreadCount()
            }
          })
        }
        if(menuList.length == 0){
          return
        }
        console.log('menuList.length',menuList.length)
        myContextmenu.show({
          "top": e.clientY + 35,
          "left": e.clientX
        }, menuList)
        // myContextmenu.onClose(() => {
        //   console.log('关闭右键菜单')
        // })
      }
		},
		async onReachBottom() {
			await this.$refs['uni-im-conversation-list']?.loadMore()
		},
		onNavigationBarButtonTap() {
      uni.navigateTo({
      	url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo?showLoginManage=true',
      	complete: e => {
      		// console.log(e);
      	}
      });
		}
	}
</script>

<style lang="scss">
  @import "@/uni_modules/uni-im/common/baseStyle.scss";
  @import "@/uni_modules/uni-im/pages/index/index.scss";
</style>