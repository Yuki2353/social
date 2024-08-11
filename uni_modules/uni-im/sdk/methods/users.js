import $state from '../state/index.js';
export default {
  merge(usersInfo) {
    if (Array.isArray(usersInfo)) {
      let obj = {}
      usersInfo.forEach(item => {
        obj[item._id] = item
      })
      usersInfo = obj
    }
    $state.users = Object.assign({}, $state.users, usersInfo)
  },
  async get(param) {
    const uid_list = Array.isArray(param) ? param : [param]
    // 信息在本地不存在的用户id
    let new_uid_list = [];
    let userInfoList = [];
    uid_list.forEach(uid => {
      let users = $state.users[uid]
      if (users) {
        userInfoList.push(users)
      } else {
        new_uid_list.push(uid)
      }
    })
    if (new_uid_list.length) {
      // 从云端加载本地不存在的用户数据
      const db = uniCloud.database();
      let res = await db.collection('uni-id-users').where({
          "_id": db.command.in(new_uid_list)
        })
        .field('_id,nickname,avatar_file')
        .get()
      userInfoList.push(...res.result.data)
      $state.users.merge(res.result.data)
    }
    return Array.isArray(param) ? userInfoList : userInfoList[0]
  }
}