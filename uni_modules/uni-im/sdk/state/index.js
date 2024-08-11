import {default as createObservable,$watch} from '@/uni_modules/uni-im/sdk/utils/createObservable.js';
import data from './data';
const observable = createObservable(data);

let lastKey = ''
$watch(() => observable.conversation.dataList, (conversationDataList) => {
  // 会话数据排序
  const currentKey = sortConversationDataList(conversationDataList.slice()).map(item => item.id).join(',')
  if (currentKey !== lastKey) {
    // TODO：优化未知错误需要加setTimeout 0，使得在下一次js引擎的事件循环执行，后续可以考虑优化
    setTimeout(()=>sortConversationDataList(conversationDataList),0)
    lastKey = currentKey
  }else{
    // console.error('---无需重新排序')
  }
},{
  deep: true,
  immediate: true
})

function sortConversationDataList(conversationDataList) {
  return conversationDataList.sort(function(a, b) {
    if (a.pinned != b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (a.customIndex || b.customIndex) {
      let aIndex = a.customIndex || a.time
      let bIndex = b.customIndex || b.time
      return bIndex - aIndex
    }
    return b.time - a.time
  })
}

// 异步存到storage// TODO 暂时不离线存储会话数据
/*const {uid} = uniCloud.getCurrentUserInfo();
if (uid) {
  uni.setStorage({
    key: 'uni-im-conversation-list' + '_uid:' + uid,
    data: conversationList.map(item => {
      let _item = {}
      for (let key in item) {
        if (!["msgManager"].includes(key)) {
          _item[key] = item[key]
        }
        // 清空防止 localStorage 的数据量过大。// 记录最后一个消息，用于会话列表显示last_msg_note，更多消息启动后再从缓存中读取
        if (key === "msgList" && item.msgList.length != 0) {
          _item[key] = [item.msgList[item.msgList.length - 1]]
        }
      }
      return _item
    })
  })
}*/

export default observable;