const db = uniCloud.database();
const $ = db.command.aggregate
import $users from './users.js';
import state from '../state/index.js';
export default {
  get() {
    return state.group.dataList
  },
  /**
   * @description 加载更多群成员
   * @param {String} 群id
   */
  async loadMember(group_id, before_id) {
    // console.log('loadMember');
    let _where = {
      group_id
    }
    if (before_id) {
      _where._id = db.command.gt(before_id)
    }
    let res = await db.collection(
        db.collection('uni-im-group-member').where(_where).orderBy("_id asc").limit(500).getTemp(),
        db.collection('uni-id-users').field('_id,nickname,avatar_file').getTemp()
      )
      .get()
    // console.log('loadMember', res);
    let userInfoObj = {}
    const group_member = res.result.data
    const memberObj = {};
    group_member.forEach(item => {
      const usersInfo = item.user_id[0];
      delete item.user_id
      item.users = usersInfo
      userInfoObj[usersInfo._id] = usersInfo
      memberObj[usersInfo._id] = item
    })
    // console.log('userInfoObj',userInfoObj);
    // console.log('memberObj',memberObj);
    $users.merge(userInfoObj)
    const conversation = state.conversation.dataList.find(item => item.group_id == group_id)
    conversation.group_member = Object.assign(conversation.group_member, memberObj)
    let count = Object.keys(conversation.group_member).length
    // console.log('查到群成员总数数：',count);
    if (group_member.length === 500) {
      // console.log('count 500个一批，直到查完  继续->');
      await this.loadMember(group_id, group_member[group_member.length - 1]._id)
    }
  },
  async loadMore({
    group_id
  } = {}) {
    let whereString = '"user_id" == $cloudEnv_uid '
    if (group_id) {
      whereString += `&& "group_id" == "${group_id}"`
    }
    // console.log('whereString',whereString)
    let res = await db.collection(
        db.collection('uni-im-group-member').where(whereString).getTemp(),
        db.collection('uni-im-group').getTemp()
      )
      .limit(500)
      .get()
    res.result.data
      .filter(item => item.group_id.length)
      .map(item => {
        item.group_info = item.group_id[0]
        item._id = item.group_info._id
        // delete item.group_id
        return item
      })
    // 过滤掉已经被删除的群
    res.result.data = res.result.data.filter(item => item.group_info)

    state.group.hasMore = res.result.data.length == 500
    if (group_id) {
      state.group.dataList.push(...res.result.data)
    } else {
      state.group.dataList = res.result.data
    }
  },
  remove({
    group_id
  }) {
    let groupList = state.group.dataList
    let index = groupList.findIndex(i => i.group_info._id == group_id)
    // console.log('index',group_id,index,groupList)
    if (index != -1) {
      groupList.splice(index, 1)
      // console.log('state.group.dataList',state.group.dataList)
    }
  },
}
