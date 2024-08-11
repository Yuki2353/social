export default function changeMute(conversation) {
  conversation.mute = !conversation.mute
  const db = uniCloud.database();
  db.collection('uni-im-conversation')
    .doc(conversation._id)
    .update({
      "mute": conversation.mute
    })
    .then((e) => {
      console.log('updated 消息免打扰设置', e.result.updated, conversation._id)
    })
    .catch(() => {
      uni.showToast({
        title: '服务端错误，消息免打扰设置失败，请稍后重试',
        icon: 'none'
      });
      conversation.mute = !conversation.mute
    })
}
