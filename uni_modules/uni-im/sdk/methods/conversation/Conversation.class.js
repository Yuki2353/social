import $state from '@/uni_modules/uni-im/sdk/state/index.js';
import $utils from '@/uni_modules/uni-im/sdk/utils/index.js';
import MsgManager from '@/uni_modules/uni-im/sdk/ext/MsgManager.class.js';
import $extensions from '../extensions.js';
const uniImCo = uniCloud.importObject("uni-im-co")
const current_uid = () => uniCloud.getCurrentUserInfo().uid;
const db = uniCloud.database();
/**
 * 会话类，实现会话相关的业务逻辑。
 */
class Conversation {
  constructor(data) {
    // 检查是否关联用户/群被删除
    if (!data.group_id && !data.user_info) {
      console.error(JSON.stringify(data));
      throw new Error('会话列表失效，疑似关联用户/群被删除(请改为软删除避免系统异常）');
    }
    // 对话框消息内容
    this.chatInputContent = ""
    // @我的消息id列表
    this.call_list = []
    // 消息列表
    this.msgList = []
    // 客户端创建此会话的时间
    this.client_create_time = Date.now()
    // 是否已离开（退出、被踢出）群聊
    this.leave = false
    // 默认不置顶
    this.pinned = false

    // 是否已经初始化。 从缓存中取出的会话数据可能已经初始化，这里需要归零
    data.isInit = false
    Object.assign(this, data)

    if (this.group_id) {
      // 群聊

      // 1. 将群成员数据转换为对象
      let group_member_obj = {}
      if (Array.isArray(this.group_member)) {
        this.group_member.forEach(item => {
          let usersInfo = item.user_id[0]
          group_member_obj[usersInfo._id] = usersInfo
        })
      }
      this.group_member = group_member_obj

      // 2. 设置群tag
      // 调用扩展点，扩展程序可以为该会话增加 tag。
      let tags = $extensions.invokeExts('conversation-tags', this)
        .reduce((all, target) => {
          if (Array.isArray(target)) {
            for (let tag of target) {
              all[tag] = true
            }
          }
          return all
        }, {})
      this.tags = Object.keys(tags)
      if (this.tags.length == 0) {
        this.tags = ['群聊']
      }

      // 3. 初始化字段:群简介、群公告、群头像
      const fieldList = [{
          "introduction": ""
        }, {
          "notification": {
            "content": false
          }
        }, {
          "avatar_file": {
            "url": ""
          }
        },
        {
          "mute_all_members": false // 全员禁言
        }
      ]
      fieldList.forEach(item => {
        const key = Object.keys(item)[0]
        if (!this.group_info[key]) {
          this.group_info[key] = item[key]
        }
      })
      // 4. 非单聊，不需要用户信息
      // this.user_info = false
    } else {
      // 单聊
      // 非单聊，不需要群消息
      this.group_info = false
    }
    
    // 初始化响应式属性
    this.activeProperty().init()
    // 初始化消息管理器
    this.msgManager = new MsgManager(this)
    
    // if( this.update_time != this._last_visible_msg.create_time){
    //   console.error('update_time != _last_visible_msg.create_time',this.update_time,this._last_visible_msg.create_time,this)
    // }
  }

  /**
   * 会话未读消息数清零。
   */
  clearUnreadCount() {
    // console.log('clearUnreadCount');
    setTimeout(() => {
      this.unread_count = 0
    }, 100);
    // console.log('clearUnreadCount this.id', this.id)
    // 触发器会触发消息表的 is_read = true
    uniCloud.database()
      .collection('uni-im-conversation')
      .where({
        user_id: current_uid(),
        id: this.id
      })
      .update({
        "unread_count": 0
      }).then(e => {
        console.log('设置为已读', e.result.updated);
      }).catch(err => {
        console.error('设置为已读失败', err);
      })
  }

  /** 撤回消息。
   * @param {object} msg - 参数对象
   * @param {string} msg._id - 消息id
   * @param {string} msg.msg_id - 消息id和_id二选一
   * @param {string} msg.conversation_id - 所属会话的id
   * @param {number} msg.create_time - 创建时间
   * @param {boolean} [submit=true] -  是否需要提交；操作撤回端需要提交，被动撤回消息端无需提交
   */
  async revokeMsg(msg_id, submit = true) {
    console.log('revokeMsg_');
    // 检查此消息是否已经缓存在本地
    let localMsg = (await this.msgManager.localMsg.get({
      "_id": msg_id
    }))[0]
    if (localMsg) {
      // 处理本地存储中的
      localMsg.is_revoke = true
      localMsg.before_revoke_body = localMsg.body
      localMsg.body = '[此消息已被撤回]'
      this.msgManager.localMsg.update(localMsg.unique_id, localMsg)
    } else {
      console.log('本地数据库中没有此消息')
    }

    // 处理显示中的数据
    let msg = false
    let index = this.msgList.findIndex(item => item._id == msg_id)
    if (index != -1) {
      msg = this.msgList[index]
      msg.is_revoke = true
      // 如果是当前用户撤回自己发的消息
      if (submit && msg.from_uid === current_uid()) {
        // 保存撤回前的消息内容，用于方便点击重新编辑
        msg.before_revoke_body = msg.body
      }
      msg.body = '[此消息已被撤回]'
      this.msgList.splice(index, 1, Object.assign({}, msg))
    }

    // 提交操作到云端
    if (submit) {
      if (msg) {
        // ui 界面上显示撤回中
        msg.revoke_ing = true
      }
      try {
        let res = await uniImCo.sendMsg({
          "type": "revoke_msg",
          "body": {
            msg_id
          }
        })
        // console.log('revoke_msg res', res);
      } catch (err) {
        console.log('err', err);
        // 撤回失败，还原本地数据
        if (localMsg) {
          localMsg.is_revoke = false
          localMsg.body = localMsg.before_revoke_body
          delete localMsg.before_revoke_body
          this.msgManager.localMsg.update(localMsg.unique_id, localMsg)
        }

        if (msg) {
          msg.is_revoke = false
          msg.body = msg.before_revoke_body
          delete msg.before_revoke_body
          delete msg.revoke_ing
          this.msgList.splice(index, 1, Object.assign({}, msg))
        }

        return uni.showToast({
          title: err.message,
          icon: 'none'
        });
      }
      if (msg) {
        // ui 界面上去掉撤回中
        delete msg.revoke_ing
      }
    }
  }

  /**
   * 获取用户信息。
   */
  getUsersInfo() {
    // 群会话返回群成员信息，单聊返回对方用户信息
    return this.group_id ? this.group_member : {
      [this.user_info._id]: this.user_info
    }
  }
  /**
   * changeMute
   */
  changeMute() {
    this.mute = !this.mute
    const db = uniCloud.database();
    db.collection('uni-im-conversation')
      .doc(this._id)
      .update({
        "mute": this.mute
      })
      .then((e) => {
        console.log('updated 消息免打扰设置', e.result.updated, this._id)
      })
      .catch(() => {
        uni.showToast({
          title: '服务端错误，消息免打扰设置失败，请稍后重试',
          icon: 'none'
        });
        this.mute = !this.mute
      })
  }
  /**
   * 设置响应式属性。
   * @param {Object} data
   */
  activeProperty(data) {
    this._last_visible_msg = this.last_visible_msg
    this._leave = this.leave
    this._update_time = this.update_time || this.create_time
    const _conversation = this
    const activeProperty = {
      title() {
        return _conversation.group_id ? _conversation.group_info.name : _conversation.user_info.nickname
      },
      avatar_file() {
        return _conversation.group_id ? _conversation.group_info.avatar_file : _conversation.user_info.avatar_file
      },
      leave:{
        get() {
          if (_conversation.msgList.length === 0) {
            return _conversation._leave
          } else {
            let last_msg = _conversation.msgList[_conversation.msgList.length - 1]
            //群被解散，或者被踢出
            return "group-dissolved" === last_msg.action || ["group-exit", "group-expel"].includes(last_msg.action) && last_msg.body.user_id_list.includes(current_uid())
          }
        },
        set(value){
          console.log('set leave value',value)
          _conversation._leave = value
        }
      },
      isMuteAllMembers() {
        if (!_conversation.group_id) return false
        const member = _conversation.group_member[current_uid()]
        // console.log('member',member)
        return member && !member.role.includes('admin') && _conversation.group_info.mute_all_members
      },
      // 最后一条可见消息的时间
      time() {
        // 如果存在最后一条可见消息，就用它的时间，否则用会话的更新时间
        const last_visible_msg = _conversation.last_visible_msg
        return last_visible_msg ? (last_visible_msg.create_time || last_visible_msg.client_create_time) : _conversation.update_time
      },
      // 最后一条可见消息的内容
      note() {
        let note = _conversation.last_msg_note || "暂无记录"
        // 如果输入框有文本未发出（草稿），直接覆盖消息
        let chatInputContent = _conversation.chatInputContent
        if (typeof chatInputContent === 'object') {
          chatInputContent = chatInputContent.text || '[富文本消息]'
        } else {
          // 把this.chatInputContent中的&nbsp;变成空格，再把头尾的空格去掉
          chatInputContent = chatInputContent.replace(/&nbsp;/g, ' ').trim()
        }
        _conversation.hasDraft = chatInputContent && $state.currentConversationId != _conversation.id
        let last_visible_msg = _conversation.last_visible_msg
        if (_conversation.hasDraft) {
          note = chatInputContent
          last_visible_msg = {
            body: chatInputContent,
            type: 'text'
          }
        }
        if (last_visible_msg) { // 如果存在最后一条消息
          const _last_visible_msg = JSON.parse(JSON.stringify(last_visible_msg))
          // console.error('last_visible_msg',_last_visible_msg)
          note = $utils.getMsgNote(_last_visible_msg)
        }
        // 替换\\n \\r \n \r &nbsp; &lt; &gt; &amp; 为 空格
        note = note.replace(/\\n|\\r|\n|\r|&nbsp;|&lt;|&gt;|&amp;/g, ' ')
        return note.trim()
      },
      // 刷新会话的更新时间
      update_time:{
        get() {
          // console.log('refreshUpdateTime');
          // 拿到最后一条消息
          let update_time = _conversation._update_time
          let msgLength = _conversation.msgList.length
          if (msgLength > 0) {
            let last_msg = _conversation.msgList[msgLength - 1]
            // 拿到最后一条消息的创建时间，消息发送成功之前没有create_time，用client_create_time
            let last_msg_time = last_msg.create_time || last_msg.client_create_time
            if (last_msg_time > update_time) {
              update_time = last_msg_time
            }
          }
          return update_time
        },
        set(value) {
          _conversation._update_time = value
        }
      },
      // 刷新最后一条可见消息
      last_visible_msg:{
        get() {
          // 拿到会话中带的
          let lastVisibleMsg = _conversation._last_visible_msg
          // 拿到内存中的
          let visibleMsgList = $utils.filterMsgList(_conversation.msgList)
          let vml = visibleMsgList.length
          let lastVisibleMsg2 = vml > 0 ? visibleMsgList[vml - 1] : false;
          if (lastVisibleMsg2) {
            // 内存中的存在最后一条可见消息，且比会话中带的新
            const lvmCreateTime = lastVisibleMsg2.create_time || lastVisibleMsg2.client_create_time
            // 会话原始带的不存在，或者比内存中的小
            if(!lastVisibleMsg || lvmCreateTime > lastVisibleMsg.create_time){
              lastVisibleMsg = lastVisibleMsg2
            }
          }
          return lastVisibleMsg
        },
        set(value) {
          _conversation._last_visible_msg = value
        }
      }
    }
    
    let res = {
      init() {
        Object.keys(activeProperty).forEach(key => {
          let item = activeProperty[key];
          if (typeof activeProperty[key] != 'function') {
            item = activeProperty[key].get
          }
          this[key] = item()
        })
      },
      ...activeProperty
    }
    
    Object.defineProperty(res, 'init', {
      // 设置init方法不可枚举
      enumerable: false
    })
    return res
  }
  // 隐藏会话
  async hide() {
    console.log('hidden######');
    this.hidden = true
    let res = await db.collection('uni-im-conversation')
      .doc(this._id)
      .update({
        "hidden": true
      })
    console.log('updated hidden', res)
    return res
  }
  // 设置未读消息数
  async setUnreadCount(count) {
    // console.log('setUnreadCount', count);
    const oldCount = this.unread_count
    this.unread_count = count
    let res = await db.collection('uni-im-conversation')
      .doc(this._id)
      .update({
        "unread_count": count
      })
      .catch(err => {
        console.error('setUnreadCount err', err);
        this.unread_count = oldCount
      })
      .then(e => {
        // console.log('setUnreadCount updated', e.result.updated);
      })
    return res
  }
}

export default Conversation
