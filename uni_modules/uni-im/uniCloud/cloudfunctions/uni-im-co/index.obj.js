const conversation = require('./conversation.js')
const msg = require('./msg.js')
const push = require('./push.js')
const friend = require('./friend.js')
const group = require('./group.js')
const filtered_conversation = require('./filtered-conversation.js')
const tools = require('./tools.js')

module.exports = {
  async _before() {
    // 记录请求时间
    this.requestStartTime = Date.now()
    
    // 获取客户端信息
    this.clientInfo = this.getClientInfo()
    
    // 调用扩展插件的初始化接口
    const { invokeExts } = require('uni-im-ext')
    await invokeExts('ext-init',this.clientInfo)

    // 定义uni-id公共模块对象
    const uniIdCommon = require('uni-id-common')
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo: this.clientInfo
    })

    // 除非特定方法允许未登录用户调用，其它都需要验证用户的身份
    const allowedMethodsWithouLogin = []
    if (!allowedMethodsWithouLogin.includes(this.getMethodName())) {
      if (this.getClientInfo().source == 'function') {
        // 云函数互调时，免校验 token 直接使用传来的用户 id
        this.current_uid = this.getParams()[1]
        this.current_user_role = []
      } else {
        // 客户端调用时验证 uni-id token
        let res = await this.uniIdCommon.checkToken(this.clientInfo.uniIdToken)
        // console.log('checkToken res',res);
        if (res.errCode) {
          // 如果token校验出错，则抛出错误
          throw res
        }

        // token 有效，取出 id 和角色
        this.current_uid = res.uid
        this.current_user_role = res.role
      }
    }

    // 为方便云对象内部调用 sendPushMsg() 方法，把它挂在云对象实例上
    this.sendPushMsg = push.sendPushMsg

    // 提供一个方法，用于添加并发任务
    this._promises = []
    this.addPromise = (promise) => {
      this._promises.push(promise)
    }
  },

  async _after(error, result) {
    // 请求完成时间
    // console.error('请求完成时间', Date.now() - this.requestStartTime, 'ms')
    
    if (error) {
      // console.log({
      // 	error,
      // 	result
      // });
      if (error.errCode && error.errMsg) {
        // 符合响应体规范的错误，直接返回
        return error
      } else {
        throw error // 直接抛出异常
      }
    }

    // 如果有并发任务，则等它们都执行完再返回
    if (this._promises.length > 0) {
      await Promise.all(this._promises)
    }
    
    // console.error('云函数结束时间', Date.now() - this.requestStartTime, 'ms')

    return result || { errCode: 0 }
  },

  ...conversation,
  ...msg,
  ...push,
  ...friend,
  ...group,
  ...filtered_conversation,
  ...tools,
}
