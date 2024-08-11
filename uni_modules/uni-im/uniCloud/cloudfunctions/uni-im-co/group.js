const {
  db,
  checkParam,
} = require('uni-im-utils')

async function chooseUserIntoGroup(params) {
  let {
    group_id = false,
    groupInfo = {},
    user_ids = [],
    admin_uids = []
  } = params

  // 校验参数是否合法
  checkParam(params, {
    required: [],
    type: {
      group_id: ["Boolean", "String"],
      groupInfo: ["Object"],
      user_ids: ["Array"],
      admin_uids: ["Array"],
    }
  })

  if (user_ids.length > 499) {
    return {
      errSubject: 'uni-im',
      errCode: 2000,
      errMsg: "拉人进群一次不能超过500人，请分多次操作"
    }
  }

  if (Object.keys(groupInfo).length !== 0) {
    checkParam(groupInfo, {
      required: ["name"],
      type: {
        name: ["String"],
        introduction: ["String"],
        avatar_file: ["Object"],
        join_option: ["String"],
        type: ["String"]
      }
    })
    if (groupInfo.avatar_file) {
      checkParam(groupInfo.avatar_file, {
        required: ["url"],
        type: {
          extname: ["String"],
          name: ["String"],
          url: ["String"]
        }
      })
    }
  }

  if (admin_uids.length > 0) {
    admin_uids.forEach(uid => {
      if (user_ids.includes(uid)) {
        throw new Error("参数admin_uids和user_ids的成员不能重复")
      }
    })
  }

  // 存在群 id是拉用户进群，否则是创建新的群并拉新用户进群
  if (!group_id) {
    // 创建群时，需要把创建者（群主）也拉进群
    user_ids.unshift(this.current_uid)

    // 调用扩展点 before-create-group，允许扩展程序添加群成员
    const { invokeExts } = require('uni-im-ext')
    await invokeExts('before-create-group', user_ids, this)
  }

  const dbJQL = uniCloud.databaseForJQL({
    clientInfo: this.clientInfo
  })

  let {
    data: userList
  } = await dbJQL.collection('uni-id-users')
    .where(`"_id" in ${JSON.stringify(user_ids)}`)
    .field('_id,nickname,avatar_file')
    .limit(500)
    .get()

  if (userList.length != user_ids.length) {
    return {
      errSubject: 'uni-im:chooseUserIntoGroup',
      errCode: 2000,
      errMsg: "参数user_ids错误，用户不存在"
    }
  }

  // 如果没有输入群id，就先创建群
  if (!group_id) {
    // 默认群昵称为：群用户昵称拼接 取前30个字符
    if (!groupInfo.name) {
      groupInfo.name = userList.map(user => user.nickname).join(' ').substring(0, 30)
    }
    // console.log({
    // 	name
    // });
    if(groupInfo.user_id === undefined){
      groupInfo.user_id = this.current_uid
    }else if(this.clientInfo.source != "function" && groupInfo.user_id != this.current_uid){
      throw new Error('触发器限制，user_id的值必须为当前操作者')
    }
    
    dbJQL.setUser({
      uid: this.current_uid,
      role: ['admin'],
      permission: []
    })
    let res = await dbJQL.collection('uni-im-group').add(groupInfo)
    group_id = res.id
  } else {
    let res = await db.collection('uni-im-group').doc(group_id).get()
    if (!res.data[0]) {
      throw new Error('群id不存在')
    } else if (admin_uids.length > 0 && res.data[0].user_id != this.current_uid) {
      throw new Error("非群创建者，不可传递参数参数admin_uids")
    }
  }

  const now_timestamp = Date.now()
  // 1. 设为群成员
  let that = this;
  let groupMemberList = []
  groupMemberList.push(...createMemberList(user_ids, false))
  groupMemberList.push(...createMemberList(admin_uids, ['admin']))

  function createMemberList(userIdList, role = false) {
    return userIdList.map(user_id => {
      return {
        group_id,
        user_id,
        // 设置群创建者角色
        role: role || (user_id === that.current_uid ? ['creator', 'admin'] : []),
        create_time: now_timestamp
      }
    })
  }

  let res;
  try {
    res = await db.collection('uni-im-group-member').add(groupMemberList)
    // 补充群成员id
    groupMemberList.forEach((item,index) => {
      item._id = res.ids[index]
    })
    console.log('uni-im-group-member-  res', res);
  } catch (error) {
    if (error.message.includes("index: user_id_group_id dup")) {
      throw new Error('用户已经在群里')
    } else {
      throw error
    }
  }
  // console.log('uni-im-group-member-  res', res);

  // 2.给新群成员加上会话表
  let conversationList = groupMemberList.map(({ user_id }) => {
    return {
      group_id,
      id: 'group_' + group_id,
      user_id: user_id,
      type: 2,
      unread_count: 0,
      create_time: now_timestamp,
      update_time: now_timestamp
    }
  })
  res = await db.collection('uni-im-conversation').add(conversationList)

  // 3. 创建”用户加群“的指令型消息，到群聊（通知所有群成员，有用户加入群聊）
  const msgData = {
    body: {
      user_id_list: groupMemberList.map(item => item.user_id),
      new_member_list: groupMemberList
    },
    action: "join-group",
    type: "system",
    from_uid: "system",
    create_time: now_timestamp,
    conversation_id: "group_" + group_id,
    group_id
  }
  
  res = await db.collection('uni-im-msg').add(msgData)
  _checkForLongMsg(msgData)
  // console.log('res uni-im-msg add', res);
  msgData._id = res.id
  // 更新“所有”此群相关会话列表
  await db.collection('uni-im-conversation')
    .where({
      id: "group_" + group_id
    })
    .update({
      update_time: msgData.create_time,
      last_msg_note: "新用户加群通知"
    })

  let title = "新用户加群通知",
    content = "用户成功加入群：" + groupInfo.name;
  //通知所有群成员
  const uniImCo = uniCloud.importObject("uni-im-co")
  let pushRes = await uniImCo.sendMsgToGroup({
    pushParam: {
      // 同时发给对方和当前用户自己（包括了他的其他设备，比如web和app、小程序同时登录时，实现消息同步；注：发送此消息的设备会在客户端过滤）
      payload: {
        type: "uni-im",
        data: msgData,
        title, // "收到im消息，在线时显示的标题",
        content // "在线时显示的副标题",
      },
      title, // "收到im消息，离线时显示的标题",
      content //"离线时显示的内容"
    },
    appId: this.clientInfo.appId
  })

  // console.log('uni-im-group-member-  res', res);

  return {
    errSubject: 'uni-im',
    errCode: 0,
    data: {
      pushRes,
      group_id
    },
    errMsg: ''
  }
}

// 拉黑会话
async function addToGroupMenberBlackList({
  user_id,
  group_id
}) {
  // 入参数都不能为空
  if (!user_id || !group_id) {
    throw Error('参数不完整')
  }
  // 判断操作者是否为群主
  let res = await db.collection('uni-im-group-member')
                    .where({
                      group_id,
                      user_id:this.current_uid
                    })
                    .get()
  if( !(res.data[0] && res.data[0].role.includes('admin')) ){
  	throw Error('没有权限')
  }
  res = await db.collection('uni-im-group-member-black')
    .add({
      group_id,
      user_id,
      create_time: Date.now()
    })
  if (res.id) {
    return {
      errCode: 0,
      errMsg: '拉黑成功'
    }
  }else{
    throw Error('拉黑失败')
  }
}

module.exports = {
  chooseUserIntoGroup,
  addToGroupMenberBlackList
}


function _checkForLongMsg(msgData) {
  let bodyStr = JSON.stringify(msgData.body)
  if (bodyStr > 50000) {
    throw new Error('单次消息最长字符长度不得超过50000')
  }
  if (bodyStr.length > 250) {
    switch (msgData.type) {
    case 'rich-text':
      msgData.body = "富文本消息"
      break;
    case 'history':
      msgData.body = "转发的聊天记录"
      break;
    case 'text':
      // 截断，但标识消息为长文本消息，客户端收到此标识，会从数据库中拉取完整消息内容
      msgData.body = msgData.body.slice(0, 50)
      break;
    default:
      msgData.body = `[${msgData.type}]类型消息`
      break;
    }

    msgData.LongMsg = true
  }
}