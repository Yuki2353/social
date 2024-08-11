import $state from '@/uni_modules/uni-im/sdk/state/index.js';
export default res => {
  res.data.create_time = Date.now()
  res.data.is_read = res.data.is_read || false
  console.log('res.data notification.add', res.data)
  res.data._id = res.data.payload.notificationId
  const notificationData = res.data
  delete res.data.payload.notificationId
  delete res.data.unipush_version
  $state.notification.add(res.data)
}