<template>
  <view class="group-members-box">
    <uni-search-bar v-model="keyword" class="search-bar" radius="5" placeholder="输入昵称搜索" clearButton="auto"
      cancelButton="none"></uni-search-bar>
    <view v-if="!leave_group" class="members-list-container" :class="{'show-less':!showAllMember}">
      <view class="invite-box item" v-if="isAdmin">
        <view class="invite-icon">
          <uni-icons @click="invite" color="#989898" size="20px" type="plusempty"></uni-icons>
        </view>
        <text class="invite-text">邀请</text>
      </view>
      <template v-for="(member,index) in memberList" :key="index">
        <view class="item" :title="member.users.nickname"
          :class="{'pointer': canPrivateChat,'focus':member.focus}" @click="toChat(member.users._id)"
          @longpress.prevent="openConversationMenu($event,index)"
          @contextmenu.prevent="openConversationMenu($event,index)"
          @mousemove="hoverUserId = member.users._id"
          >
          <image class="avatar"
            :src="(member.users.avatar_file && member.users.avatar_file.url) ? member.users.avatar_file.url:'/uni_modules/uni-im/static/avatarUrl.png'"
            mode="widthFix"></image>
          <text class="nickname">{{member.users.nickname||'匿名用户'}}</text>
          <text v-if="member.role.includes('admin')" class="group-admin">管</text>
          <text v-if="!mute_all_members && member.mute_type" class="mute-type-1">已被禁言</text>
        </view>
      </template>
    </view>
    <text v-if="showMoreBtn" class="show-all-menber-btn" @click="onClickShowAllMenber">{{showAllMember ? '收起' : '查看更多'}}</text>
    <uni-im-contextmenu ref="uni-im-contextmenu"></uni-im-contextmenu>
  </view>
</template>

<script>
  const db = uniCloud.database()
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  export default {
    data() {
      return {
        conversation: {
          group_info: {
            user_id: "",
            mute_all_members: false
          },
          group_member: {},
          mute: false
        },
        leave_group: false,
        member_list: [],
        editorType: '',
        editorDefaultValue: '',
        groupType: '',
        isAdmin: false,
        keyword: '',
        mute_all_members: false,
        showAllMember: false,
        // 鼠标在哪个用户id上
        hoverUserId: '',
        showMoreBtn: true,
        // 延迟渲染，避免页面卡顿
        laterRenderIndex: 1
      };
    },
    computed: {
      ...uniIm.mapState(['isWidescreen']),
      memberList() {
        let memberList = this.member_list
          // 根据关键词搜索
          .filter(member => {
            // 忽略大小写
            return member.users.nickname.toLowerCase().includes(this.keyword.toLowerCase())
          })
          // 是管理员排序靠前
          .sort((a, b) => {
            if (a.role.includes('admin') && !b.role.includes('admin')) {
              return -1
            } else if (!a.role.includes('admin') && b.role.includes('admin')) {
              return 1
            } else {
              return 0
            }
          })
          // laterRenderIndex
          .filter((item, index) => {
            // web-pc端有显示更多按钮，不需要延迟渲染
            return this.showMoreBtn ? true : index < this.laterRenderIndex * 50
          })
        
        const memberCount = memberList.length
        if(memberCount && memberCount < 10){
          this.showMoreBtn = false
        }
          
        if (!this.showAllMember) {
          memberList = memberList.slice(0, 9)
        }
        return memberList
      },
      isGroupCreator() {
        return this.conversation.group_info.user_id == uniCloud.getCurrentUserInfo().uid
      },
      canPrivateChat(){
        // 当前登录的账号是管理员，或者是群管理员，或者要私信管理员
        const currentUserId = uniCloud.getCurrentUserInfo().uid
        return this.uniIDHasRole('staff') || 
              this.conversation.group_member[currentUserId].role.includes('admin') ||
              this.hoverUserId && this.conversation.group_member[this.hoverUserId].role.includes('admin') 
      }
    },
    onReachBottom() {
      this.laterRenderIndex++
    },
    watch: {
      "conversation.group_info.user_id"(adminUserId) {
        // 当前用户是群的创建者或者管理员（在群成员中找到当前用户的角色包含admin）
        const currentUserId = uniCloud.getCurrentUserInfo().uid
        this.isAdmin = this.isGroupCreator || this.conversation.group_member[currentUserId]?.role.includes('admin')
      },
      "conversation.group_member": {
        handler(group_member, oldValue) {
          // console.log('group_member',group_member);
          this.member_list = []
          for (let key in group_member) {
            this.member_list.push(group_member[key])
          }
          if (!uniIm.isWidescreen && this.showMoreBtn === false) { // pc宽屏不需要
            let title = "群成员列表（" + this.member_list.length + "人）"
            uni.setNavigationBarTitle({
              title
            });
          }
        },
        deep: true,
        immediate: true
      },
      // （后续）通过监听实现实时切换管理员实时刷新权限
      // console.log('isAdmin',isAdmin);
      conversation: {
        handler(conversation, oldValue) {
          const currentUserId = uniCloud.getCurrentUserInfo().uid
          this.isAdmin = this.isGroupCreator || this.conversation.group_member[currentUserId]?.role.includes('admin')
          this.leave_group = conversation.leave
          this.mute_all_members = conversation.group_info.mute_all_members
        },
        deep: true
      },
    },
    props: {
      conversation_id: {
        default () {
          return false
        }
      }
    },
    async onLoad(e) {
      if (!e.conversation_id) {
        throw new Error("会话id不能为空")
      }
      // 以页面的方式打开，不需要显示更多的按钮和隐藏部分用户
      this.showMoreBtn = false
      this.showAllMember = true
      this.load(e.conversation_id)
    },
    mounted() { //pc端以组件模式加载时逻辑
      if (this.conversation_id) {
        this.load(this.conversation_id)
      }
    },
    methods: {
      async load(conversation_id) {
        this.conversation = await uniIm.conversation.get(conversation_id)
      },
      toChat(user_id) {
        if (this.canPrivateChat) {
          uniIm.toChat({
            user_id,
            source:{
              group_id: this.conversation.group_id
            }
          })
        }
      },
      onClickShowAllMenber() {
        if(this.isWidescreen){
          this.showAllMember = !this.showAllMember
        }else{
          uni.navigateTo({
            url: '/uni_modules/uni-im/pages/group/members?conversation_id=' + this.conversation.id,
            animationType:"slide-in-right"
          })
        }
      },
      invite() {
        uni.navigateTo({
          url: '/uni_modules/uni-im/pages/contacts/createGroup/createGroup?group_id=' + this.conversation.group_info._id
        })
      },
      async expel(item) {
        uni.showModal({
          title: '确定要将该用户移出本群吗？',
          content: '不能撤销，请谨慎操作',
          cancelText: '取消',
          confirmText: '确认',
          complete: async (e) => {
            // console.log(e);
            if (e.confirm) {
              uni.showLoading({
                mask: true
              });
              try {
                let res = await db.collection('uni-im-group-member').where({
                    user_id: item.users._id,
                    group_id: this.conversation.group_info._id
                  })
                  .remove()
                if (res.result.deleted) {
                  uni.showToast({
                    title: '成功移除',
                    icon: 'none',
                    complete: () => {}
                  });
                  // console.log('exitGroup', res);
                }
              } catch (error) {
                uni.showToast({
                  title: error.message,
                  icon: 'error',
                  complete: () => {}
                });
              }
              uni.hideLoading()
            }
          }
        });
      },
      async expelAndToBlack(item) {
      
        uni.showModal({
          title: '确定要将该用户移出本群并拉黑吗？',
          content: '拉黑后此用户将不能再次加入本群，不能撤销，请谨慎操作',
          cancelText: '取消',
          confirmText: '确认',
          complete: async (e) => {
            // console.log(e);
            if (e.confirm) {
              uni.showLoading({
                mask: true
              });
              try {
                let res = await db.collection('uni-im-group-member').where({
                    user_id: item.users._id,
                    group_id: this.conversation.group_info._id
                  })
                  .remove()
                console.log('expel', res);
                const uniImCo = uniCloud.importObject("uni-im-co")
                res = await uniImCo.addToGroupMenberBlackList({
                  user_id: item.users._id,
                  group_id: this.conversation.group_info._id
                })
                console.log('expelAndToBlack', res);
              } catch (error) {
                uni.showToast({
                  title: error.message,
                  icon: 'error',
                  complete: () => {}
                });
              }
              uni.hideLoading()
            }
          }
        });
      },
      async changeMemberMute(item) {
        let nickname = item.users.nickname || '匿名用户'
        uni.showModal({
          title: '确定要' + (item.mute_type ? `为"${nickname}"解除禁言吗？` : `禁言"${nickname}"吗？`),
          cancelText: '取消',
          confirmText: '确认',
          complete: async (e) => {
            // console.log(e);
            if (e.confirm) {
              uni.showLoading({
                mask: true
              });
              try {
                let res = await db.collection('uni-im-group-member').where({
                    _id: item._id,
                    mute_type: item.mute_type // 防止此时云端已经变化
                  })
                  .update({
                    mute_type: item.mute_type ? 0 : 1
                  })
                // console.log('mute_type', res);
                if (res.result.updated) {
                  item.mute_type = item.mute_type ? 0 : 1
      
                  uni.showToast({
                    title: '设置成功',
                    icon: 'none',
                    complete: () => {}
                  });
                }
              } catch (error) {
                // console.log('error',merror)
                uni.showToast({
                  title: error.message,
                  icon: 'error',
                  complete: () => {}
                });
              }
              uni.hideLoading()
            }
          }
        });
      },
      openConversationMenu(e, index) {
        if (!this.isAdmin) {
          return
        }
        const member = this.memberList[index]
        const menuList = []
        menuList.unshift({
          "title": "移除",
          "action": () => {
            // console.log('移除');
            this.expel(member)
          }
        })
            
        menuList.unshift({
          "title": "移除并拉黑",
          "action": () => {
            console.log('移除并拉黑');
            this.expelAndToBlack(member)
          }
        })
            
        if (!this.conversation.group_info.mute_all_members) {
          menuList.unshift({
            "title": member.mute_type ? "解除禁言" : '设为禁言',
            "action": () => {
              // console.log('禁言');
              this.changeMemberMute(member)
            }
          })
        }
            
        const isAdmin = member.role.includes('admin')
        menuList.push({
          "title": isAdmin ? "取消管理员" : "设置管理员",
          "action": () => {
            let role = member.role;
            if (isAdmin) {
              // console.log('取消管理员');
              role = member.role.filter(item => item !== 'admin')
            } else {
              role.push('admin')
              // console.log('设置管理员');
            }
            uni.showLoading({
              mask: true
            });
            db.collection('uni-im-group-member').doc(member._id).update({
                "role": role
              }).then(res => {
                // console.log('res', res);
                member.role = role
              })
              .catch(err => {
                console.error(err)
                uni.showToast({
                  title: err.message,
                  icon: 'none'
                });
              })
              .finally(() => {
                uni.hideLoading()
              })
          }
        })
      
        if (menuList.length > 0) {
          member.focus = true
          const myContextmenu = this.$refs['uni-im-contextmenu']
          const position = {
            "contextmenu": {
              "top": e.clientY,
              "left": e.clientX
            },
            "longpress": {
              "top": e.touches[0].screenY || e.touches[0].clientY,
              "left": e.touches[0].screenX || e.touches[0].clientX
            }
          } [e.type]
      
          // #ifdef H5
          position.top = position.top + 120
          // #endif
      
          myContextmenu.show(position, menuList)
          myContextmenu.onClose(() => {
            member.focus = false
          })
        }
      },
    }
  }
</script>

<style lang="scss">
@import "@/uni_modules/uni-im/common/baseStyle.scss";
page,
.group-members-box {
  width: 750rpx;
  background-color: #f5f5f5;
  .members-list-container {
    width: 750rpx;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .item {
    position: relative;
    width: 150rpx;
    height: 140rpx;
    margin: 5px 0;
    align-items: center;
    justify-content: space-around;
  }
  
  .invite-icon {
    border: 1px dashed #ccc;
    border-radius: 10px;
    width: 90rpx;
    height: 90rpx;
    justify-content: center;
  }
  
  /* #ifdef H5 */
  // 收缩
  .show-less {
    max-height: 400px;
  }
  .windows .item {
    width: 146rpx;
  }
  /* #endif */
  
  .item.focus {
    border: 1px dashed #ccc;
  }
  
  .group-admin {
    position: absolute;
    top: 5px;
    right: 5px;
    padding: 1px 3px;
    border-radius: 6px;
    background-color: #e64141;
    color: #fff;
    font-size: 12px;
  }
  
  .mute-type-1 {
    position: absolute;
    padding: 1px 10px;
    background-color: #0b60ff;
    color: #fff;
    font-size: 10px;
    bottom: 28px;
  }
  
  /* #ifdef H5 */
  .pointer {
    cursor: pointer;
  }
  /* #endif */
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 10px;
    box-shadow: 0 0 1px #aaa;
  }
  
  .invite-text,.nickname {
    width: 140rpx;
    text-align: center;
    font-size: 12px;
    color: #666;
    padding: 0 16rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .show-all-menber-btn {
    text-align: center;
    font-size: 14px;
    color: #666;
    height: 40px;
    line-height: 40px;
  }
  /* #ifdef H5 */
  .show-all-menber-btn {
    cursor: pointer;
  }
  .show-all-menber-btn:hover {
    color: #333;
  }
  /* #endif */
}

  
</style>