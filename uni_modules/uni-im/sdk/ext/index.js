import $state from '@/uni_modules/uni-im/sdk/state/index.js';
export default {
  toChat(param) {
    if ($state.isWidescreen) {
      uni.$emit('uni-im-toChat', param)
    } else {
      let url = '/uni_modules/uni-im/pages/chat/chat?'
      for (let key in param) {
        let value = param[key]
        if (typeof value === 'object') {
          value = decodeURIComponent(JSON.stringify(value))
        }
        url += key + '=' + value + '&'
      }
      uni.navigateTo({url,animationDuration: 300})
    }
  },
}