// import uniIm from '@/uni_modules/uni-im/sdk/index.js';
import $utils from '@/uni_modules/uni-im/sdk/utils/index.js';
import $methods from '@/uni_modules/uni-im/sdk/methods/index.js';
import md5 from '@/uni_modules/uni-im/sdk/utils/md5.min.js'
const db = uniCloud.database();
const dbCmd = db.command
const uniImCo = uniCloud.importObject("uni-im-co", {customUI: true})

import $state from '../state/index.js'


export default class Message {
  constructor(currentConversation) {
    // #ifdef APP
    // this.sqlite = getApp().globalData.sqlite
    // this.sqlite.clearMsgTable() // 清空数据库
    // #endif
    this.conversation_id = currentConversation.id

    Object.defineProperty(this, 'msgList', {
      get() {
        return currentConversation.msgList
      },
      set(data) {
        currentConversation.msgList = data
      }
    })
  }
  msgList = []
  async sleep(t) {
    return await new Promise((resolve, rejece) => {
      setTimeout(resolve, t)
    })
  }
  async localMsgMaxTime() {
    // 拿到【本地】数据库中，当前会话聊天记录的最大值
    if (this.localMsg.maxTime === false) {
      let lastLocalDatas = await this.localMsg.get({
        limit: 1,
        orderBy: {
          "create_time": "desc"
        }
      })
      // console.log('lastLocalDatas------',lastLocalDatas);
      let [lastLocalData] = lastLocalDatas
      if (lastLocalData) {
        this.localMsg.maxTime = lastLocalData.create_time
      } else {
        this.localMsg.maxTime = 0
      }
      // console.log('init localMsgMaxTime',this.localMsg.maxTime);
    }
    return this.localMsg.maxTime
  }
  getHistory = async () => {
    // 锁定接口，禁止同一个会话对象并发查询
    if(this.getHistory.isLock){
      // console.log('this.getHistory.isLock');
      await new Promise((resolve,reject)=>{
        setTimeout(()=> {
          if(this.getHistory.isLock === false){
            // console.log('已结束');
            resolve()
          }
        }, 300);
      })
    }
    this.getHistory.isLock = true
    // console.log('do getHistory');
    /**
     *  必须满足假设条件：大于本地会话更新时间的聊天数据（1.会话过程中，实时收到 2.启动/socket断线重连时，查云端数据库拉取）已拉取完整。
     */
    let database = false
    if (0 && this.localMsg.hasMore) { // TODO暂时先不查本地库
      database = this.localMsg
    }else if(this.cloudMsg.hasMore){
      database = this.cloudMsg
    }else{
      this.getHistory.isLock = false
      return []
    }
    //已经拉取的数据中时间最小的值，作为最大
    let maxTime = this.msgList[0] ? this.msgList[0].create_time : false
    let data = await database.get({maxTime})
    this.getHistory.isLock = false
    
    if(data.length && database != this.localMsg){
      // 如果数据不来源本地，需要将查到的数据存入数据库
      // this.localMsg.add(data) // TODO暂时先不写
    }
    database.hasMore = data.length != 0
    return data.length ? data : this.getHistory()
  }
  cloudMsg = {
    hasMore: true,
    get: async ({
      minTime = 0,
      maxTime = false,
      limit = 30
    } = {}) => {
      // console.log(1111,minTime,maxTime);
      //console.log('this',this);
      // let where = `"conversation_id" == "${this.conversation_id}"`
      let where = {
        "conversation_id": this.conversation_id
      }
      if (minTime && maxTime) {
        where.update_time = dbCmd.and([
          dbCmd.gt(minTime),
          dbCmd.lt(maxTime)
        ])
      } else {
        if (minTime) {
          // where += `&& "update_time" > ${minTime}`
          where.update_time = dbCmd.gt(minTime)
        }
        if (maxTime) {
          // where += `&& "update_time" < ${maxTime}`
          where.update_time = dbCmd.lt(maxTime)
        }
      }
      const msgTable = db.collection('uni-im-msg')
      let data;
      try {
        let res = await msgTable.where(where)
          .limit(limit)
          .orderBy('update_time', 'desc')
          .get()
        data = res.result.data.reverse()
        // console.error('where', where,{minTime,maxTime},data);
      } catch (e) {
        // console.error(e);
        // 断网等网络异常情况，会请求不到直接返回空即可
        data = []
      }
      return data
    }
  }
  localMsg = {
    maxTime: false,
    hasMore: true,
    get: async ({
      minTime = 0,
      maxTime = false,
      limit = 30,
      orderBy = {
        "create_time": "asc"
      }, //asc 升序，desc 降序
      _id = false
    } = {}) => {
      // #ifdef APP
      // console.log('app的暂时注释掉')
      // return []
      let sql = `select * from msg WHERE conversation_id = "${this.conversation_id}" ` //注意结尾要留空格，下一段语句连接
      if (_id) {
        sql += `AND "_id" == "${_id}" `
      } else if (maxTime || minTime) {
        if (maxTime) {
          sql += `AND create_time < ${maxTime} `
        }
        if (minTime) {
          sql += `AND create_time > ${minTime} `
        }
      }
      // 注意传入的orderBy是查询结果不是过程，im场景下都是从大到小查询
      sql += `ORDER BY "create_time" DESC `

      if (limit) {
        sql += `LIMIT ${limit} `
      }

      let datas = []
      try {
        // datas = await this.sqlite.selectSql(sql)
        // console.log(`###############从本地sqlite中找到，${datas.length}条，数据,sql:`,sql,{datas});
      } catch (e) {
        // 错误时，仍然返回空数组，提高 高可用性
        console.error(e)
      }
      
      datas = datas.map(data => {
        try {
          // 将数据中的字符串转义字符恢复
          for (let key in data) {
            if (typeof data[key] === 'string') {
              data[key] = unescapeText(data[key])
              // 尝试将字符串转换为对象
              if (data[key].indexOf('{') === 0 || data[key].indexOf('[') === 0) {
                try {
                  data[key] = JSON.parse(data[key])
                } catch (e) {
                  console.log(e,data[key])
                }
              }
            }
          }
          // console.log('data',data);
          
        } catch (e) {
          console.error(e,data.body)
        }
        return data
      }).sort((a, b) => {
        if (orderBy.create_time == 'asc') {
          return a.create_time - b.create_time
        } else {
          return b.create_time - a.create_time
        }
      })
      // console.log('datas~~~~~~',datas);
      // 方便测试先只显示1条
      // datas = datas.slice(0,1)
      return datas
      // #endif

      // #ifdef H5
      let datas = await new Promise((resolve, reject) => {
        //  根据 id 查询
        if (_id) {
          // console.error('$state.indexDB~~~',$state.indexDB)
          let getRequest = $state.indexDB.transaction("uni-im-msg")
            .objectStore("uni-im-msg")
            .index("_id")
            .get(_id)
          getRequest.onsuccess = function(event) {
            if (getRequest.result) {
              resolve([getRequest.result])
            } else {
              resolve([])
            }
          };
          getRequest.onerror = function(event) {
            console.log('Error getting data');
            resolve([])
          };
          return
        }

        let datas = [],
          index = 0
        if (!maxTime) {
          maxTime = Date.now()
        }
        try {
          // 设置查询索引
          // console.log('kkkkkkkk',[this.conversation_id, minTime], [this.conversation_id,maxTime]);
          let range = IDBKeyRange.bound([this.conversation_id, minTime], [this.conversation_id, maxTime])
          // 传入的 prev 表示是降序遍历游标，默认是next表示升序；
          // $state.indexDB 在im的场景下，查始终是降序遍历游标 orderBy指的是查询结果的排序方式
          let sort = "prev"
          // console.log('sortsortsortsortsortsortsort',sort);
          // console.error('$state.indexDB~~~',$state.indexDB)
          let task = $state.indexDB.transaction("uni-im-msg")
            .objectStore("uni-im-msg")
            .index("conversation_id-create_time")
            .openCursor(range, sort)

          task.onsuccess = function(event) {
            let cursor = event.target.result;
            if (cursor) {
              // console.log('cursor',cursor.value);
              // 排除边界值
              if (![minTime, maxTime].includes(cursor.value.create_time)) {
                datas.push(cursor.value)
              }
              index++
              if (limit && index === limit) {
                resolve(datas)
              } else {
                cursor.continue();
              }
            } else {
              resolve(datas)
            }
          }

          task.onerror = function(err) {
            console.error(err);
            resolve([])
          }
        } catch (e) {
          console.error(e);
          resolve([])
        }
      })
      return datas.sort((a, b) => {
        if (orderBy.create_time == 'asc') {
          return a.create_time - b.create_time
        } else {
          return b.create_time - a.create_time
        }
      })
      // #endif

      // #ifdef MP
      return []
      // #endif
    },
    add: async (datas, action = 'push') => {
      // console.log('localMsg.add',action,datas);
      if (!Array.isArray(datas)) {
        datas = [datas]
      }
      let _currentConversation = $state.conversation.getCached(this.conversation_id)
      // 隐藏的会话，收到消息后需要再次显示出来
      if(_currentConversation.hidden){
        _currentConversation.hidden = false
      }
      
      // 插入前，处理消息
      datas.forEach(async data => {
        // 创建唯一id:unique_id
        data.unique_id = "u"+md5(JSON.stringify(data) + Math.random())
        
        // 以下代码，处理指令型消息（撤回、新用户进群、用户离群、@我 等）
        const client_create_time = _currentConversation.client_create_time || 0
        if (data.create_time < client_create_time) {
          return // console.log("此消息指令，创建时间在当前设备，创建此会话之前。此设备无需执行");
        }
        //  如果收到的是撤回消息指令
        if (data.type === "revoke_msg") {
          let {
            body: {
              msg_id
            },
            conversation_id,
            create_time
          } = data
          _currentConversation.revokeMsg(msg_id, false)
        }

        // 由扩展的消息类型处理 beforeLocalAdd
        $methods.msgTypes.get(data.type)?.beforeLocalAdd?.(data, _currentConversation)

        let current_uid = uniCloud.getCurrentUserInfo().uid
        //  系统通知
        if (data.type === "system") {
          // 用户退出、被踢出群
          if (["group-exit", "group-expel"].includes(data.action)) {
            data.body.user_id_list.forEach(uid=>{
              // 从列表中移除这些用户
              // #ifdef VUE3
              delete _currentConversation.group_member[uid]
              // #endif
              // #ifdef VUE2
              Vue.delete(_currentConversation.group_member, uid)
              // #endif
            })
          } 
          // 新用户加群
          else if (data.action === "join-group") {
            const {new_member_list} = data.body
            //  如果加入此群的用户id列表，包括当前用户 且此会话当前设备之前就加载过，需要重新加载群会话和成员列表（因为被踢出群期间可能有其他用户进群、发消息等）
            if(new_member_list.includes(current_uid) && _currentConversation.client_create_time < data.create_time){
              //重新拉取 群信息
              let res = await uniImCo.getConversationList({"conversation_id":_currentConversation.id})
              _currentConversation = Object.assign(_currentConversation, res.data[0])
              //先清空 群成员
              _currentConversation.group_member = []
              //重新拉取 群成员
              await uniIm.group.loadMember(_currentConversation.group_id)
              // 获取群公告
              _currentConversation.has_unread_group_notification = !!_currentConversation.group_info.notification
            }else{
              // 将新成员加入到群成员列表
              for (let i = 0; i < new_member_list.length; i++) {
                let member = new_member_list[i]
                // 获取成员信息
                member.users = await $state.users.get(member.user_id)
                // #ifdef VUE3
                _currentConversation.group_member[member.users._id] = member
                // #endif
                // #ifdef VUE2
                Vue.set(_currentConversation.group_member, member.users._id, member)
                // #endif
              }
            }
            console.log('add user to group_member', _currentConversation.group_member)
          }
          //更新群资料
          else if (data.action.indexOf("update-group-info-") === 0) {
            if(data.action === "update-group-info-mute_all_members" && _currentConversation?.group_info?.mute_all_members != data?.body?.updateData?.mute_all_members){
              const {mute_all_members} = data.body.updateData
              for (let user_id in _currentConversation.group_member) {
                const member = _currentConversation.group_member[user_id]
                member.mute_type += (mute_all_members ? 1 : -1)
              }
            }
            _currentConversation.group_info = Object.assign(_currentConversation.group_info,data.body.updateData)
            const {notification} = data.body.updateData
            if(data.action === "update-group-info-notification"){
              console.log('收到群公告');
              _currentConversation.has_unread_group_notification = true
            }
          }else if(data.action === "set-group-admin"){
            const {user_id,addRole,delRole} = data.body
            const {role} = _currentConversation.group_member[user_id]
            if(addRole.length != 0){
              role.push(...addRole)
            }else if(delRole.length != 0){
              console.log('delRole',delRole);
              delRole.forEach(r=>{
                console.log('r',r);
                console.log('role',role);
                const index = role.findIndex(i => i === r)
                console.log('index',index);
                if(index > -1){
                  role.splice(index,1)
                }
              })
            }
            console.log('设置群管理员',_currentConversation.group_member[user_id]);
          }
        }
        if (data.group_id && data.call_uid && data.call_uid.includes(current_uid)) {
          _currentConversation.call_list.push(data._id)
        }
      })
      
      return // TODO：暂时先关闭本地库相关逻辑
      
      // #ifdef APP
      /**
       * 根据 datas 生成 sql 语句，插入到sqlList。
       * 注意：所有字符串类型的字段，需要转义（包括对象/数组的值为字符串）
       */
      let sqlList = []
      datas.forEach(data => {
        let keys = [],
          values = []
        for (let key in data) {
          keys.push(key)
          let value = data[key]
          if (typeof value === 'string') {
            value = escapeText(value)
            value = `'${value}'`
          } else if (typeof value === 'object') {
            value = escapeText(JSON.stringify(value))
            value = `'${value}'`
          }
          values.push(value)
        }
        let sql = `INSERT INTO msg (${keys.join(',')}) VALUES (${values.join(',')});`
        sqlList.push(sql)
      })
      // console.log('executeSql:',sqlList);
      if (sqlList.length) {
        try {
          // let res = await this.sqlite.executeSql(sqlList)
          // console.log('executeSql: add res',res,sqlList); 
        } catch (e) {
          console.error(e)
        }
      }
      // #endif

      // #ifdef H5
      let res = await new Promise((resolve, reject) => {
        // console.log('datas', datas[0]);
        // 事务对象 指定表格名称和操作模式（"只读"或"读写"）
        // console.error('$state.indexDB~~~',$state.indexDB)
        let transaction = $state.indexDB.transaction('uni-im-msg', 'readwrite')
        let objectStore = transaction.objectStore('uni-im-msg') // 仓库对象
        let index = 0
        let length = datas.length
        datas.forEach(data => {
          let res = objectStore.add(data)
          res.onsuccess = (e) => {
            // console.log('resolve',e, index, length);
            index++
            if (index == length) {
              resolve()
            }
          }
          res.onerror = (e) => {
            console.error('add - failed', e);
            reject(e)
          }
        })
      })
      // #endif

      // #ifdef MP
        // 小程序端不离线存储
      // #endif

      // 更新最大值
      let maxTime = datas.map(i => i.create_time).sort((a, b) => b - a)[0]
      let localMsgMaxTime = await this.localMsgMaxTime()
      if (maxTime > localMsgMaxTime) {
        // console.error('更新最大值 maxTime----------------',maxTime);
        this.localMsg.maxTime = maxTime
      }
    },
    update: async (unique_id, data) => {
      // console.log('localMsg update',{data,unique_id});
      data = JSON.parse(JSON.stringify(data))
      
      return []// TODO：暂时先关闭本地库相关逻辑
      
      // #ifdef APP
      let dataStr = ''
      for (let key in data) {
        dataStr += `"${key}" = `
        if (typeof data[key] === 'string') {
          dataStr += `'${escapeText(data[key])}',`
        } else if (typeof data[key] === 'object') {
          dataStr += `'${escapeText(JSON.stringify(data[key]))}',`
        } else {
          dataStr += `${data[key]},`
        }
      }
      let sql = `UPDATE msg SET ${dataStr.slice(0,-1)} WHERE unique_id = "${unique_id}"`
      try {
        // await this.sqlite.executeSql(sql)
      } catch (e) {
        console.log(e)
      }
      console.log('executeSql:',sql);
      // #endif

      // #ifdef H5
      let datas = await new Promise((resolve, reject) => {
        // console.error('$state.indexDB~~~',$state.indexDB)
        let request = $state.indexDB.transaction(['uni-im-msg'], 'readwrite')
          .objectStore("uni-im-msg")
          .put(data)
        request.onsuccess = function(event) {
          // console.log('event---',event);
          resolve(event)
        }
        request.onerror = function(event) {
          console.error(event);
          reject(event)
        };
      })
      // #endif

      // #ifdef MP
      //  小程序端，无本地数据无需更新
      return []
      // #endif
    },
    delete: async (unique_id) => {
      return []// TODO：暂时先关闭本地库相关逻辑
      
      // #ifdef APP
      let sql = `DELETE FROM msg WHERE unique_id = "${unique_id}"`
      try {
        // await this.sqlite.executeSql(sql)
      } catch (e) {
        console.error(e)
      }
      // #endif

      // #ifdef H5
      let datas = await new Promise((resolve, reject) => {
        // console.error('$state.indexDB~~~',$state.indexDB)
        let request = $state.indexDB.transaction(['uni-im-msg'], 'readwrite')
          .objectStore("uni-im-msg")
          .delete(unique_id)
        request.onsuccess = function(event) {
          // console.log('event---',event);
          resolve(event)
        }
        request.onerror = function(event) {
          console.error(event);
          reject(event)
        };
      })
      // #endif

      // #ifdef MP
      //  小程序端，无本地数据无需更新
      return []
      // #endif
    }
  }
}

// #ifdef APP
const matchRegExp = /["'&<>]/
// 转义字符
function escapeText(string) {
  const str = '' + string
  const match = matchRegExp.exec(str)
  if (!match) {
    return str
  }
  let escape
  let _str = ''
  let index = 0
  let lastIndex = 0
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;'
        break
      case 38: // &
        escape = '&amp;'
        break
      case 39: // '
        escape = '&#39;'
        break
      case 60: // <
        escape = '&lt;'
        break
      case 62: // >
        escape = '&gt;'
        break
      default:
        continue
    }
    if (lastIndex !== index) {
      _str += str.substring(lastIndex, index)
    }
    lastIndex = index + 1
    _str += escape
  }

  return lastIndex !== index ? _str + str.substring(lastIndex, index) : _str
}
// 恢复转义字符
function unescapeText(string) {
  return string.replace(/&(quot|amp|#39|lt|gt);/g, function(match) {
    switch (match) {
      case '&quot;':
        return '"'
      case '&amp;':
        return '&'
      case '&#39;':
        return "'"
      case '&lt;':
        return '<'
      case '&gt;':
        return '>'
    }
  })
}
// #endif