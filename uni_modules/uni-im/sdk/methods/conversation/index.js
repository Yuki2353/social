// #ifdef VUE3
import {watch,computed} from 'vue'
// #endif

/**
 * 会话对象
 * data:会话对象数据模型（conversationDatas是原始数据，data为经过转化的数据）
 * loadMore：加载更多数据方法
 */
import Conversation from './Conversation.class.js';
import $state from '@/uni_modules/uni-im/sdk/state/index.js';
import $utils from '@/uni_modules/uni-im/sdk/utils/index.js';
import MsgManager from '@/uni_modules/uni-im/sdk/ext/MsgManager.class.js';

import $extensions from '../extensions.js';
import $users from '../users.js';
import $group from '../group.js';

const uniImCo = uniCloud.importObject("uni-im-co")
import {
  store as uniIdStore,
} from '@/uni_modules/uni-id-pages/common/store'

const current_uid = () => uniIdStore.userInfo._id
// console.log('current_uid', current_uid())

export default {
  // 同步获取已经缓存在本地的会话信息，适用于在能够确定会话信息已经拉到本地的上下文中调用。
  getCached(conversation_id) {
    return $state.conversation.dataList.find(c => c.id == conversation_id)
  },

  async get(param) {
    /**
     *  字符串	会话id
     * 	数组		一组会话id（暂不支持）
     * 	对象类型	会话对方信息（用于如果本地不存在则需要自动创建的场景），包括：{friend_uid,to_uid,from_uid,group_id,user_info}
     */
    let conversationId = false
    if (param) {
      if (typeof param == 'object') {
        let {
          friend_uid,
          user_id,
          group_id,
          conversation_id
        } = param
        conversationId = conversation_id
        if (user_id) {
          friend_uid = user_id
          param.friend_uid = user_id
        }
        if (!conversationId) {
          if (!group_id && !friend_uid) {
            console.log('param---------', param);
            throw new Error("会话对象不详，请检查参数", param)
          }
          conversationId = $utils.getConversationId(friend_uid || group_id, friend_uid ? 'single' : 'group')
        }
      } else if (typeof param == 'string') {
        conversationId = param
      } else {
        throw new Error("会话对象不详，请检查参数", param)
      }
    }
    let conversationDatas = $state.conversation.dataList
    if (conversationId) {
      conversationDatas = conversationDatas.filter(i => i.id == conversationId)
      if (conversationDatas.length == 0) {
        // 本地没有没有就联网查找
        let conversationData = await this.loadMore(conversationId)
        if (conversationData) {
          conversationDatas = [conversationData]
        } else if (param.friend_uid) {
          //  普通用户会话，云端没有可以本地创建一个
          if (!param.user_info) {
            let res = await uniCloud.database()
              .collection('uni-id-users')
              .doc(param.friend_uid)
              .field('_id,nickname,avatar_file')
              .get()
            console.log('user_info', res)
            param.user_info = res.result.data[0]
            // console.log('param.user_info', param.user_info);
            if (!param.user_info) {
              throw new Error("用户查找失败")
            }
          }
          let conversationData = {
            "friend_uid": param.friend_uid,
            "unread_count": 0,
            "user_id": current_uid(),
            "id": conversationId,
            "user_info": param.user_info,
            "type": param.friend_uid ? 1 : 2,
            "msgList": [],
            "update_time": Date.now()
          }
          
          /**
           * 存在source字段的会话，表示此会话基于某个来源而被创建。
           * 比如：群聊会话，可能是从群聊列表中创建的，此时source字段会记录群聊的id
           * 用于在云端同步创建会话时的判断依据，比如：限制只能群成员和群管理员才能发起私聊时，确定指的是哪个群
           */
          if(param.source){
            conversationData.source = param.source
          }
          
          conversationData = this.add(conversationData)[0]
          conversationDatas.push(conversationData)
        } else {
          throw new Error("未找到此群会话")
        }
      }

      let conversationData = conversationDatas[0]
      // console.error('conversationData',conversationData,conversationData.group_member)
      // 指定获取某个id的群会话时，判断如果群会话的 群成员为空就从云端拉取
      if (conversationData.group_id && Object.keys(conversationData.group_member).length == 0 && !conversationData
        .leave) {
        // uni.showLoading({
        //   title: '加载中',
        //   mask: true
        // });
        await $group.loadMember(conversationData.group_id)
        // uni.hideLoading()
      }

      // console.log('conversationData*-*--*-**-',conversationData)
      // #ifdef APP
      // if (!conversationData.isInit) {
      //   conversationData.msgManager = new MsgManager(conversationData)
      // }
      // #endif
      return conversationData
    } else {
      return conversationDatas
    }
  },
  async loadMore(conversation_id) {
    // console.log('loadMore-----','loadMore')
    if (!conversation_id) {
      // console.log('$state.conversation.loading',$state.conversation.loading)
      //上一次正在调用，下一次不能马上开始
      if ($state.conversation.loading) {
        // console.log('加载中')
        return []
      } else {
        $state.conversation.loading = true
      }
    }

    let conversationDatas = await this.get()
    let lastConversation = [...conversationDatas].sort((a, b) => a.update_time - b.update_time)[0]
    // console.log('conversationDatas.length',conversationDatas.length,lastConversation)
    let maxUpdateTime = lastConversation ? lastConversation.update_time : ''
    if (conversation_id) {
      // 已有会话id的情况下，不设置更新时间条件
      maxUpdateTime = ''
    }
    let res = {
      data: []
    }
    // console.log('maxUpdateTime', maxUpdateTime);
    try {
      const uniImCo = uniCloud.importObject("uni-im-co",{
        customUI: true
      })
      res = await uniImCo.getConversationList({
        maxUpdateTime,
        limit: 30,
        conversation_id
      })
    } catch (e) {
      console.log(e)
      if (!conversation_id) {
        $state.conversation.loading = false
      }
    }

    if (res.data.length) {
      // console.log('getConversationList res', res, {
      // 	maxUpdateTime,
      // 	limit: 30,
      // 	conversation_id
      // });
      // console.log('res.data',JSON.parse(JSON.stringify(res.data)))
      res.data = this.add(res.data)
    }
    if (!conversation_id) {
      $state.conversation.loading = false
      $state.conversation.hasMore = (res.data.length == 30)
      return res.data
    } else {
      return res.data[0]
    }
  },
  add(datas) {
    if (!Array.isArray(datas)) {
      datas = [datas]
    }
    return datas.reduce((resList, item, index) => {
      // console.log('resList',resList);
      // 判断是否存在，再新增。
      let conversation_item = $state.conversation.getCached(item.id)
      if (conversation_item) {
        // 此会话已经存在，返回给add方法调用者，不重复插到$state.conversation.dataList
        resList.push(conversation_item)
        return resList
      }
      // console.log('新增会话', item)
      
      const conversation = new Conversation(item)
      // console.log('新增会话', conversation)
      const usersInfo = conversation.getUsersInfo()
      // 把会话相关的用户信息合并到 $users
      $users.merge(usersInfo)
      // 插入到会话列表
      $state.conversation.dataList.push(conversation)
      
      // 拿到响应式的conversation对象
      const _conversation = $state.conversation.getCached(conversation.id)
      // 设置字段为响应式
      let activeProperty = _conversation.activeProperty()
      Object.keys(activeProperty).forEach(key => {
        conversation[key] = computed(activeProperty[key])
      })
      
      resList.push(_conversation)
      // #ifdef H5
        // // 将会话数据存入indexDB
        // let data = JSON.parse(JSON.stringify(_conversation))
        // let request = $state.indexDB.transaction(['uni-im-convasation'], 'readwrite')
        //   .objectStore("uni-im-convasation")
        //   .put(data)
        // request.onsuccess = function(event) {
        //   // console.error('indexDB success',event);
        // }
        // request.onerror = function(event) {
        //   console.error('add convasation data to indexDB error',event);
        // };
      // #endif
      return resList
    }, [])
  },
  // 统计所有消息的未读数
  unreadCount() {
    let conversationDatas = $state.conversation.dataList
    const unreadCount = conversationDatas.reduce((sum, item, index, array) => {
      if (!item.hidden && !item.mute) {
        sum += item.unread_count
      }
      return sum
    }, 0)
    return unreadCount
  },
  remove(id) {
    let index = $state.conversation.dataList.findIndex(i => i.id == id)
    $state.conversation.dataList.splice(index, 1)
  },
  /**
   * 清空所有未读消息数
   */
  clearUnreadCount(){
    uniImCo.clearUnreadCount().then(res => {
      let conversationDatas = $state.conversation.dataList.filter(i => i.unread_count > 0)
      conversationDatas.forEach(i => {
        i.unread_count = 0
        // console.log('i',i)
      })
    }).catch(err => {
      console.error('clearUnreadCount err',err)
    })
  }
}
