<template>
  <view class="group-info-box" v-if="conversation_id">
    <uni-im-group-members :conversation_id="conversation_id"></uni-im-group-members>
    <uni-list>
      <uni-list-item v-if="!leave_group" title="消息免打扰" @switchChange="changeConversationMute"
        :switchChecked="conversation.mute" :showSwitch="true"></uni-list-item>
      <uni-list-item v-for="(val,key) in editorFields" :key="key" @click.native="openPopupInfo(key)" :title="val"
        :showArrow="isAdmin" :clickable="isAdmin">
        <template v-slot:footer>
          <text
            class="group-info-text">{{ (key == "notification" ? conversation.group_info[key]?.content : conversation.group_info[key]) || '未设置' }}</text>
        </template>
      </uni-list-item>
      <uni-list-item @click.native="setAvatar" title="群头像" :clickable="isAdmin">
        <template v-slot:footer>
          <image class="logo" :src="logoUrl||'/uni_modules/uni-im/static/avatarUrl.png'" mode=""></image>
        </template>
      </uni-list-item>
      <template v-if="isAdmin">
        <uni-list-item @click.native="setAddGroupType" title="加群方式" note="申请加入本群的验证规则" :clickable="isAdmin">
          <template v-slot:footer>
            <text class="join_option">{{join_option}}</text>
          </template>
        </uni-list-item>
        <uni-list-item title="全员禁言" @switchChange="setMuteAllMembers"
          :switchChecked="conversation.group_info.mute_all_members" :showSwitch="true"></uni-list-item>
      </template>
      <!-- #ifdef H5 -->
      <uni-list-item @click="share" :clickable="true" title="分享此群">
        <template v-slot:footer>
          <uni-icons size="25px" color="#666" type="redo"></uni-icons>
        </template>
      </uni-list-item>
      <!-- #endif -->
    </uni-list>
    <view v-if="leave_group">
      <text style="padding: 15px;text-align: center;color: #666;">- 你不是此群成员 -</text>
      <!-- <text @click="joinGroup" style="padding: 15px;text-align: center;color: #005eca;cursor: pointer;">申请加入</text> -->
    </view>
    <text v-else class="exitGroup" @click="exitGroup">{{isGroupCreator?'解散群聊':'退出群聊'}}</text>
    <uni-popup ref="popupInfo" type="dialog">
      <uni-popup-dialog mode="input" :title="editorFields[editorType]" :placeholder="'请输入'+editorFields[editorType]"
        :duration="2000" :before-close="true" :value="editorDefaultValue" @close="closePopupInfo"
        @confirm="confirmPopupInfo"></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
  const db = uniCloud.database()
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  import members from '@/uni_modules/uni-im/pages/group/members';
  export default {
    components: {
      'uni-im-group-members':members
    },
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
        editorFields: {
          "name": " 群聊名称",
          "introduction": "群简介",
          "notification": "群公告"
        },
        editorType: '',
        editorDefaultValue: '',
        groupType: '',
        isAdmin: false,
        keyword: '',
        mute_all_members: false,
        showAllMember: false,
        conversation_id:'',
        // 鼠标在哪个用户id上
        hoverUserId: ''
      };
    },
    computed: {
      ...uniIm.mapState(['isWidescreen']),
      logoUrl() {
        return this.conversation.group_info.avatar_file ? this.conversation.group_info.avatar_file.url : false
      },
      join_option() {
        let val = this.conversation.group_info.join_option
        return {
          needPermission: "需要验证权限",
          freeAccess: "自由加入",
          disableApply: "禁止加入"
        } [val]
      },
      memberList() {
        return this.member_list
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
      },
      isGroupCreator() {
        return this.conversation.group_info.user_id == uniCloud.getCurrentUserInfo().uid
      },
      canPrivateChat(){
        // 当前登录的账号是管理员，或者当前消息是群管理员发的
        return this.uniIDHasRole('staff') || this.hoverUserId && this.conversation.group_member[this.hoverUserId].role.includes('admin')
      }
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
          if (!uniIm.isWidescreen) { // pc宽屏不需要
            let title = "群信息（" + this.member_list.length + "人）"
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
    async onLoad(e) {
      if (!e.conversation_id) {
        throw new Error("会话id不能为空")
      }
      this.load(e.conversation_id)
    },
    onShow() {
      // console.log("this.conversation: ", this.conversation.group_member);
    },
    methods: {
      navToMembers(conversation_id){
        uni.navigateTo({
          url:"/uni_modules/uni-im/pages/group/members?conversation_id=" + conversation_id
        })
      },
      async load(conversation_id) {
        this.conversation_id = conversation_id
        this.conversation = await uniIm.conversation.get(conversation_id)
      },
      async exitGroup() {
        const group_id = this.conversation.group_info._id
        if (this.isGroupCreator) {
          uni.showModal({
            title: '确认要解散群聊吗？',
            content: '不能撤销，请谨慎操作',
            cancelText: '取消',
            confirmText: '确认',
            complete: async (e) => {
              // console.log(e);
              if (e.confirm) {
                uni.showLoading({
                  mask: true
                });
                let res = await db.collection('uni-im-group')
                  .where({
                    _id: group_id
                  })
                  .remove()
                  .finally((res) => {
                    // uni.navigateBack({ // 收到离群的推送通知会自动关闭当前页面
                    // 	delta: 2
                    // })
                    uni.hideLoading()
                  })
                // console.log('exitGroup', res);
              }
            }
          });
        } else {
          uni.showModal({
            title: '确认要退出群聊吗？',
            content: '不能撤销，请谨慎操作',
            cancelText: '取消',
            confirmText: '确认',
            complete: async (e) => {
              // console.log(e);
              if (e.confirm) {
                // uni.navigateBack({ // 收到离群的推送通知会自动关闭当前页面
                // 	delta: 2
                // })
                uni.showLoading({
                  mask: true
                });
                let res = await db.collection('uni-im-group-member').where({
                    user_id: uniCloud.getCurrentUserInfo().uid,
                    group_id
                  })
                  .remove()
                // console.log(res.result);
                if (res.result.deleted) {
                  uni.showToast({
                    title: '成功退出',
                    icon: 'none'
                  });
                }
                uni.hideLoading()
                // console.log('exitGroup', res);
              }
            }
          });
        }
      },
      openPopupInfo(type) {
        // console.log(type);
        if (!this.isAdmin) return
        this.editorType = type
        this.editorDefaultValue = this.conversation.group_info[type]
        if (this.editorType == "notification") {
          this.editorDefaultValue = this.editorDefaultValue?.content || ""
        }
        this.$refs.popupInfo.open()
      },
      closePopupInfo() {
        this.$refs.popupInfo.close()
      },
      confirmPopupInfo(value) {
        if (!value) {
          uni.showToast({
            title: '内容不能为空！',
            icon: 'none'
          });
          return
        }
        // console.log('value', value);
        const updateData = {};
        if (this.editorType == 'notification') {
          updateData[this.editorType] = {
            "content": value
          }; // 创建时间服务端生成
        } else {
          updateData[this.editorType] = value;
        }
        this.updateGroupInfo(updateData)
        this.$refs.popupInfo.close()
      },
      setAddGroupType() {
        if (!this.isAdmin) return
        uni.showActionSheet({
          itemList: ['自由加入', '需要验证权限', '禁止加入'],
          success: (e) => {
            let join_option = ['freeAccess', 'needPermission', 'disableApply'][e.tapIndex]
            this.updateGroupInfo({
              join_option
            })
          },
          fail: (err) => {
            console.error("err: ", err);
          }
        })
      },
      async updateGroupInfo(group_info) {
        // console.log('group_info---------',group_info);
        this.conversation.group_info = Object.assign(this.conversation.group_info, group_info)
        let res = await db.collection('uni-im-group')
          .doc(this.conversation.group_id)
          .update(group_info)
        // console.log('change group info', res.result.updated,this.conversation);
      },
      async setAvatar() {
        if (!this.isAdmin) return
        const crop = {
          quality: 100,
          width: 600,
          height: 600,
          resize: true
        };
        uni.chooseImage({
          count: 1,
          crop,
          success: async (res) => {
            let tempFile = res.tempFiles[0],
              avatar_file = {
                // #ifdef H5
                extname: tempFile.name.split('.')[tempFile.name.split('.').length - 1],
                // #endif
                // #ifndef H5
                extname: tempFile.path.split('.')[tempFile.path.split('.').length - 1]
                // #endif
              },
              filePath = res.tempFilePaths[0]
            // #ifndef APP-PLUS
            //非app端用前端组件剪裁头像，app端用内置的原生裁剪
            let isPC = false
            // #ifdef H5
            isPC = !['ios', 'android'].includes(uni.getSystemInfoSync().platform)
            // #endif
            if (!isPC) {
              filePath = await new Promise((callback) => {
                uni.navigateTo({
                  url: '/uni_modules/uni-id-pages/pages/users/cropImage/cropImage?path=' +
                    filePath + `&options=${JSON.stringify(crop)}`,
                  animationType: "fade-in",
                  events: {
                    success: url => {
                      callback(url)
                    }
                  },
                  complete(e) {
                    // console.log(e);
                  }
                });
              })
            }
            // #endif
            // console.log(this.users);
            let cloudPath = uniCloud.getCurrentUserInfo().uid + '' + Date.now()
            avatar_file.name = cloudPath
            uni.showLoading({
              title: "更新中",
              mask: true
            });
            let {
              fileID
            } = await uniCloud.uploadFile({
              filePath,
              cloudPath,
              fileType: "image"
            });
            // console.log(result)
            avatar_file.url = fileID
            // console.log({avatar_file});
            uni.hideLoading()
            this.updateGroupInfo({
              avatar_file
            })
          }
        })
      },
      // #ifdef H5
      share() {
        // 获取当前域名
        const data = location.origin + "/#/?joinGroup=" + this.conversation.group_info._id
        uni.setClipboardData({
          data,
          showToast: false,
          success: () => {
            uni.showToast({
              title: "已成功复制分享链接",
              duration: 2000,
              icon: 'none'
            });
          }
        })
      
        // uni.navigateTo({
        // 	url: '/uni_modules/uni-im/pages/group/groupQRCode?id=' +
        // 		this.conversation.group_info._id +
        // 		'&name=' + this.conversation.group_info.name +
        // 		'&avatar_file=' + url,
        // 	complete: (e) => {
        // 		// console.log(e);
        // 	}
        // });
      },
      // #endif
      joinGroup() {
        db.collection('uni-im-group-join').add({
          "group_id": this.conversation.group_id,
          "message": ''
        }).then((res) => {
          // console.log("res: ", res);
          uni.showToast({
            icon: 'none',
            title: '已申请'
          })
        })
      },
      setMuteAllMembers(e) {
        for (let user_id in this.conversation.group_member) {
          const member = this.conversation.group_member[user_id]
          member.mute_type += (e.value ? 1 : -1)
        }
        this.updateGroupInfo({
          "mute_all_members": e.value
        })
      },
      changeConversationMute(e) {
        this.conversation.changeMute()
      }
    }
  }
</script>

<style lang="scss">
  @import "@/uni_modules/uni-im/common/baseStyle.scss";
  page,
  .group-info-box {
    width: 100%;
    height: 100%;
    background-color: #f5f5f5;
    .logo {
      width: 50px;
      height: 50px;
    }
    
    .exitGroup {
      margin: 10px 0;
      background-color: #FFFFFF;
      padding: 6px 0;
      color: #e64141;
      border-radius: 0;
      font-size: 16px;
      text-align: center;
      padding: 15px 0;
      /* #ifdef H5 */
      cursor: pointer;
      /* #endif */
    }
    
    .exitGroup::after {
      display: none;
    }
    
    .group-info-text {
      color: #666;
      font-size: 14px;
      max-width: 560rpx;
      text-align: right;
    }
    
    .join_option {
      color: #666;
      font-size: 14px;
    }
  }
</style>