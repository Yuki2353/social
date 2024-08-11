export default {
  uniPush: {
    // 消息渠道设置，避免被限量推送、静默推送（静音且需下拉系统通知栏才可见通知内容）详情文档：https://doc.dcloud.net.cn/uniCloud/uni-cloud-push/api.html#channel
    channel:{
      // 渠道id 
      id: "114240",
      // 消息渠道描述，会显示在手机系统关于当前应用的通知设置中
      desc: "客服消息"
    }
  }
}