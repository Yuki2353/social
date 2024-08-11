import $state from '@/uni_modules/uni-im/sdk/state/index.js';
import $methods from '@/uni_modules/uni-im/sdk/methods/index.js';
import appEvent from './appEvent';
import createObservable from './createObservable';
import toFriendlyTime from './toFriendlyTime';
import shortcutKey from './shortcut-key.js';
import parseHtml from './html-parser.js';
import markdownIt from './markdown-it.min.js';
import md5 from './md5.min.js'

export default {
  appEvent,
  createObservable,
  toFriendlyTime,
  shortcutKey,
  parseHtml,
  markdownIt,
  /**
   *深度合并多个对象的方法
   */
  deepAssign() {
    let len = arguments.length,
      target = arguments[0]
    if (!this.isPlainObject(target)) {
      target = {}
    }
    for (let i = 1; i < len; i++) {
      let source = arguments[i]
      if (this.isPlainObject(source)) {
        for (let s in source) {
          if (s === '__proto__' || target === source[s]) {
            continue
          }
          if (this.isPlainObject(source[s])) {
            target[s] = this.deepAssign(target[s], source[s])
          } else {
            target[s] = source[s]
          }
        }
      }
    }
    return target
  },
  /**
   * 替换文本中的url为套了html的a标签的方式
   */
  replaceUrlToLink(str) {
    // 找网址
    let urlPattern = /(https?:\/\/|www\.)[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    return str.replace(urlPattern, function(match) {
      var href = match;
      if (match.indexOf("http") == -1) {
        //如果不带http://开头就带上
        href = "http://" + match;
      }
      return `<a class="link" target="_blank" href="${href}">${match}</a> `;
    });
  },
  /**
   *判断对象是否是一个纯粹的对象
   */
  isPlainObject(obj) {
    return typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]'
  },
  getScreenMetrics() {
    let metrics = {
      pageLeft: 0,
      pageTop: 0,
      pageWidth: $state.systemInfo.screenWidth,
      pageHeight: $state.systemInfo.screenHeight,
    };
    [
      'screenWidth',
      'screenHeight',
      'windowWidth',
      'windowHeight',
      'windowTop',
      'windowBottom',
      'statusBarHeight',
      'safeArea',
      'safeAreaInsets',
    ].forEach(name => { metrics[name] = $state.systemInfo[name] })
    try {
      uni.createSelectorQuery()
        .select('uni-page-body > #page, uni-page-body > .page')
        .boundingClientRect(data => {
          if (data) {
            metrics['pageLeft'] = data.left
            metrics['pageTop'] = data.top
            metrics['pageWidth'] = data.width
            metrics['pageHeight'] = data.height
          }
        })
        .exec()
    } catch (e) {
      console.error('调用 uni.createSelectorQuery 时机过早：', e)
    }
    return metrics
  },
  isMuteMsg(msg){
    return (
      // TODO：静默消息
      msg.is_mute === true
      ||
      // 加群消息
      msg.action === "join-group" 
      || 
      // 禁言通知
      msg.action === 'update-group-info-mute_all_members' 
    )
  },
  isReadableMsg(msg) {
    // 如果是扩展的消息类型，则由扩展程序决定结果
    let result = $methods.msgTypes.get(msg.type)?.isReadable()
    if (typeof result !== 'undefined') return result
    return msg.type !== 'revoke_msg' &&
      msg.action !== 'update-group-info-avatar_file' && 
      msg.type !== 'clear-conversation-unreadCount'
  },
  filterMsgList(msgList) {
    return msgList.filter(msg => this.isReadableMsg(msg))
  },
  getMsgNote(_msg) {
    const msg = JSON.parse(JSON.stringify(_msg))
    const type = msg.type;
    let note = '[多媒体]'
    if (msg.is_revoke) {
      note = "消息已被撤回"
    } else if (msg.is_delete) {
      note = "消息已被删除"
    } else if (type === 'text') {
      note = msg.body.toString()
    } else if (type === 'userinfo-card') {
      note = `[${msg.body.name} 的名片]`
    } else {
      note = {
        "image": "[图片]",
        "sound": "[语音]",
        "video": "[视频]",
        "file": "[文件]",
        "location": "[位置]",
        "system": "[系统通知]",
        "code": "[代码]",
        "rich-text": "[富文本消息]",
        "revoke_msg": "[消息已被撤回]",
      } [type] || `[${type}]`
        
      if (type == "system") {
        note = {
          "join-group": "[新用户加入群聊]",
          "group-exit": "[退出群聊]",
          "group-expel": "[被踢出群聊]",
          "group-dissolved": "[此群聊已被解散]"
        } [msg.action] || '[系统消息]'
      } else if (type == "rich-text") {
        note = getRichTextText(msg.body)
        function getRichTextText(nodesList) {
          return getTextNode(nodesList)
          function getTextNode(nodesList) {
            let text = '';
            nodesList.forEach(item => {
              if (item.type == "text") {
                text += item.text.replace(/(\r\n|\n|\r)/gm, "")
              } else{
                text += ({
                  'image': '[图片]',
                  'link': '[链接]',
                })[item.type] || ''
              }
              if(item.name === 'img'){
                text += ' [图片] '
              }
              if (item.attrs && item.attrs.class === 'nickname' && item.attrs.user_id) {
                let userInfo = $state.users[item.attrs.user_id]
                delete item.children
                if(userInfo){
                  text += ` @${userInfo.nickname} `
                }else{
                  text += '@[昵称加载中...]'
                  $state.users.get(item.attrs.user_id)
                }
              }
              if (Array.isArray(item.children)) {
                text += getTextNode(item.children)
              }
            })
            // 替换换行为空格
            return text || '';
          }
        }
      }
    }
    // 去掉换行符
    note = note.replace(/(\r\n|\n|\r)/gm, "");
    // 改 &nbsp; &emsp; &ensp;等空格为普通空格
    note = note.replace(/&nbsp;|&emsp;|&ensp;/g, ' ')
    // 截取80个字符
    note = note.slice(0, 80).trim()
    return note
  },
  // 节流执行函数，用于控制频繁触发的事件。
  throttle(fn, delay) {
    fn.timer && clearTimeout(fn.timer);
    fn.timer = setTimeout(fn, delay);
  },
  async sleep(time) {
    return await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, time)
    })
  },
  getConversationId(id, type = 'single') { //single,group
    if (type == 'single') {
      let current_uid = uniCloud.getCurrentUserInfo().uid
      if (!current_uid) {
        console.error('错误current_uid不能为空', current_uid);
      }
      let param = [id, current_uid]
      return 'single_' + md5(param.sort().toString())
    } else {
      return 'group_' + id
    }
  },
  async getTempFileURL(fileid) {
    // console.log('getTempFileURL', fileid)
    // 如果不是fileid就直接返回。
    if (!fileid || fileid.indexOf('blob:') === 0 || fileid.indexOf('data:image/png;base64,') === 0 || fileid.substring(0, 8) != "cloud://") {
      return fileid
    }
    let res = await uniCloud.getTempFileURL({
      fileList: [fileid]
    })
    return res.fileList[0].tempFileURL
  }
}
