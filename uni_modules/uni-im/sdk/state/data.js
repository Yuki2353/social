export default {
  isDisabled: false,
  // 会话数据
  conversation: {
    dataList: [],
    hasMore: true,
    loading: false // 加锁防止意外重复请求时出错
  },
  // 正在对话的会话id
  currentConversationId: false,
  // 全局响应式心跳，用于更新消息距离当前时长 等
  heartbeat: '',
  // 好友列表
  friend: {
    dataList: [],
    hasMore: true
  },
  // 群列表
  group: {
    dataList: [],
    hasMore: true
  },
  // 系统通知消息
  notification: {
    dataList: [],
    hasMore: true
  },
  //存储所有出现过的用户信息，包括群好友信息
  users: {},
  //是否为pc宽屏
  isWidescreen: false,
  //是否为触摸屏
  isTouchable: false,
  //系统信息
  systemInfo: {},
  // #ifndef H5
  indexDB: false,
  // #endif
  audioContext: false,
  // sqlite数据库是否已经打开
  dataBaseIsOpen: false,
  socketIsClose: false,
  // 自由挂载任意自定义的全局响应式变量，特别用于nvue下跨页面通讯
  ext:{
    appIsActive:true,
    _initImData:{
      callbackList:[],
      isInit:false
    },
    _extensionPoints:{}
  }
}