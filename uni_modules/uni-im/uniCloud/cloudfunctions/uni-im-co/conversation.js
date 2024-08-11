const {
  db,
  dbCmd,
  $,
} = require('uni-im-utils')

// 获取会话列表
async function getConversationList({
  // 会话条数
  limit = 500,
  // 最大的会话更新时间
  maxUpdateTime = false,
  // 最小的会话更新时间
  minUpdateTime = false,
  // 不为false则表示获取指定的会话
  conversation_id = false,
  sort = {
    update_time: -1
  }
}) {
  
  let matchObj = {
    // 限制只能查询当前用户自己的会话记录
    user_id: this.current_uid,
    // group_id: dbCmd.exists(false), //是否查询群聊会话
  }
  if (conversation_id) {
    matchObj.id = conversation_id
  } else {
    if (maxUpdateTime) {
      matchObj.update_time = dbCmd.lt(maxUpdateTime)
    } else if (minUpdateTime) {
      matchObj.update_time = dbCmd.gt(minUpdateTime)
    }
    matchObj.leave = dbCmd.neq(true)
    matchObj.hidden = dbCmd.neq(true)
    // TODO：临时方案解决，因历史问题，造成的last_msg_note为空的问题
    // matchObj = dbCmd.or({
    //   ...matchObj,
    //   last_msg_note: dbCmd.neq(null)
    // }, {
    //   ...matchObj,
    //   unread_count: dbCmd.neq(0)
    // }, )
  }
  
  // console.error('getConversationList matchObj', matchObj,'limit：'+limit)
  
  // 计算请求时间
  let startTime = Date.now()
  let res = await db.collection('uni-im-conversation').aggregate()
    .match(matchObj)
    .sort(sort)
    .limit(limit)
    // 联查获得最新的对话记录
    .lookup({
      from: "uni-im-msg",
      let: {
        id: '$id'
      },
      pipeline: $.pipeline()
        .match(dbCmd.expr($.eq(['$conversation_id', '$$id'])))
        .sort({update_time: -1})
        .limit(1)
        .project({
          _id: 1,
          type: 1,
          body: 1,
          to_uid: 1,
          is_read: 1,
          is_revoke: 1,
          from_uid: 1,
          create_time: 1,
          update_time: 1,
          conversation_id: 1,
          action: 1
        })
        .done(),
      as: 'visible_msgs'
    })
    // 联查获得对话的用户信息
    // .lookup({
    // 	from: "uni-id-users",
    // 	let: {
    // 		friend_uid: '$friend_uid'
    // 	},
    // 	pipeline: $.pipeline()
    // 		.match(
    // 			dbCmd.expr($.eq(['$_id', '$$friend_uid']))
    // 		)
    // 		.limit(1)
    // 		.project({
    // 			_id: 1,
    // 			avatar_file: 1,
    // 			nickname: 1
    // 		})
    // 		.done(),
    // 	as: 'user_info'
    // })
    // 联查获得对话的群信息
    .lookup({
      from: "uni-im-group",
      let: {
        group_id: '$group_id'
      },
      pipeline: $.pipeline()
        .match(
          dbCmd.expr($.eq(['$_id', '$$group_id']))
        )
        .project({
          user_id: 1,
          name: 1,
          introduction: 1,
          notification: 1,
          avatar_file: 1,
          join_option: 1,
          mute_all_members: 1,
          type: 1
        })
        .done(),
      as: 'group_info'
    })
    .end()
  // log请求时间
  // console.error('getConversationList耗时', Date.now() - startTime,startTime)
  
  // // 计时
  // startTime = Date.now()
  // // 查每个会话的最后一条消息
  // console.error('res.data',res.data,res.data.map(item => item.id));
  // let getLastVisibleMsgsRes = await uniCloud.database().collection('uni-im-msg')
  //                              .where({
  //                                conversation_id: dbCmd.in(res.data.map(item => item.id))
  //                              })
  //                              .orderBy('update_time', 'desc')
  //                              .limit(limit)
  //                              .get()
  // // log请求时间
  // console.error('getLastVisibleMsgsRes耗时', Date.now() - startTime,startTime)
  // let lastVisibleMsgs = {}
  // getLastVisibleMsgsRes.data.forEach(item => {
  //   lastVisibleMsgs[item.conversation_id] = item
  // })
  // console.error('lastVisibleMsgs',lastVisibleMsgs);
  // res.data.forEach(item => {
  //   item.last_visible_msg = lastVisibleMsgs[item.id]
  //   if (item.last_visible_msg) {
  //     if (item.last_visible_msg.is_revoke) {
  //       item.last_visible_msg.body = "消息已经被撤回"
  //     }
  //   }
  // })
  

  const dbJQL = uniCloud.databaseForJQL({
    clientInfo: this.clientInfo
  })
  let friend_uids = res.data.map(item => item.friend_uid).filter(i => i)
  // 计算请求时间
  startTime = Date.now()
  let usersInfoRes = await dbJQL.collection('uni-id-users')
    .where(`_id in ${JSON.stringify(friend_uids)}`)
    .field('_id,avatar_file,nickname')
    .get()
  // log请求时间
  // console.error('get user耗时', Date.now() - startTime,startTime)
  
  // 计算请求时间
  startTime = Date.now()
  
  let usersInfoObj = {}
  usersInfoRes.data.forEach(item => {
    usersInfoObj[item._id] = item
  })

  res.data.forEach(item => {
    item.user_info = usersInfoObj[item.friend_uid]
    item.group_info = item.group_info[0]

    // 处理特殊情况
    item.last_visible_msg = item.visible_msgs[0];
    delete item.visible_msgs;
    // console.error('item.last_visible_msg',item.last_visible_msg);
    if (item.last_visible_msg) {
      if (item.last_visible_msg.is_revoke) {
        item.last_visible_msg.body = "消息已经被撤回"
      }
    }
  })
  // log请求时间
  // console.error('forEach user_info耗时', Date.now() - startTime,startTime)
  return {
    data: res.data,
    errCode: 0
  }
}

async function clearUnreadCount(){
  let res = await db.collection('uni-im-conversation').where({
    user_id: this.current_uid,
    unread_count: dbCmd.gt(0)
  }).update({
    unread_count: 0
  })
  console.error('clearUnreadCount',res);
  return {
    errCode: 0,
    data: res.updated
  }
}

module.exports = {
  getConversationList,
  clearUnreadCount
}
