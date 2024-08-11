<template>
  <view class="uni-im-rich-text"
    :class="{'isFromSelf':isFromSelf, 'only1u': trBody.length === 0 &&webInfoList.length === 1 , isSingeImg}">
    <template v-for="(item,index) in trBody" :key="index">
      <template v-if="item.name == 'span'">
        <text v-if="item.attrs && item.attrs.class == 'nickname'" class="text nickname"
          :class="{pointer:canPrivateChat}"
          @click="privateChat(item.attrs.user_id)"
        >
          {{item.children[0].text}}
        </text>
        <text v-else class="text">
          {{item.children[0].text}}
        </text>
        <uni-im-icons class="text isRead" v-if="isFromSelf && 'isRead' in item" :code="item.isRead?'e609':'e741'"
          size="14px" :color="item.isRead?'#25882a':'#bbb'"></uni-im-icons>
      </template>
      <text class="text" v-else-if="item.type == 'text'" :decode="true" space="ensp">{{item.text}}</text>
      <uni-im-img v-else-if="item.name == 'img'" max-width="200px" @click="previewImage(item.attrs.src)"
        :src="item.attrs.src" :width="item.attrs.width" :height="item.attrs.height" mode="widthFix" class="img" />
      <uni-link class="link" v-else-if="item.name == 'a' && item.children && typeof(item.children[0]) === 'object'" :href="item.attrs.href" color="#007fff"
        :text="item.children[0].text"></uni-link>
    </template>


    <!-- <view class="web-info" v-for="(item,index) in webInfoList" :key="index">
        <view class="title-box">
          <image v-if="item.icon" :src="item.icon" mode="widthFix" class="web-icon" @error="item.icon = false" />
          <view v-if="item.title" class="title">{{item.title}}</view>
        </view>
        <view class="content">
          <view v-if="item.description" class="description">{{item.description}}</view>
          <image v-if="item.thumbnail" class="web-thumbnail" :src="item.thumbnail" mode="widthFix"
            @error="item.thumbnail = false" />
        </view>
        <view class="link-box" v-if="item.url">
          <uni-link class="link" :href="item.url" color="#007fff" :text="item.url"></uni-link>
          <uni-im-icons @click="copy(item.url)" class="copy" code="e67e"></uni-im-icons>
        </view>
      </view> -->
  </view>
</template>

<script>
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  export default {
    props: {
      msg: {
        type: Object,
        default: () => {
          return {
            reader_list: [],
            body: []
          }
        }
      }
    },
    data() {
      return {
        webInfoList: []
      }
    },
    async mounted() {
      // let aList = this.msg.body.filter(item => item.name == 'a')
      //                           // .filter(item => {
      //                           //   return item.attrs && item.attrs.href &&
      //                           //    item.attrs.href.includes('dcloud.net.cn') ||
      //                           //    item.attrs.href.includes('dcloud.io')
      //                           // })
      // // console.log('aList',aList)
      // for(let i = 0; i < aList.length; i++){
      //   const uniImCo = uniCloud.importObject("uni-im-co",{customUI:true})
      //   let res = await uniImCo.getWebInfo(aList[i].attrs.href)
      //   // console.log('getWebInfo',res.data)
      //   res.data.url = aList[i].attrs.href
      //   if(res.data.title){
      //     res.data.title = getStr(res.data.title, 60)
      //     res.data.description = getStr(res.data.description, 60)
      //   // // 取字符串的前20个字符，如果超出加...
      //    function getStr(str='', len) {
      //      if (str.length > len) {
      //        return str.substring(0, len) + "...";
      //      } else {
      //        return str;
      //      }
      //    }
      //     this.webInfoList.push(res.data)
      //   }
      // }
    },
    computed: {
      isSingeImg() {
        return this.msg.body.filter(item => item.name != 'img' && item.text || item?.attrs?.class === "nickname" ).length === 0
      },
      imgList() {
        return this.msg.body.filter(item => item.name == 'img').map(item => item.attrs.src)
      },
      isFromSelf() {
        return this.msg.from_uid === uniCloud.getCurrentUserInfo().uid
      },
      trBody() {
        if (
          this.webInfoList.length === 1 &&
          this.msg.body.filter(i => !(i.type === 'text' && i.text === ' ')).length === 1 &&
          this.webInfoList[0].url === this.msg.body[0].attrs.href
        ) {
          // 只有一个链接，且链接的地址和消息体的地址一样，则不显示消息体
          return []
        } else {
          return this.msg.body.map(node => {
            if (node.name == 'span' && node.attrs && node.attrs.class == 'nickname' && node.attrs.user_id) {
              // 改写/设置 nickname
              node.children = [{
                type: 'text',
                text: '@' + this.getNicknameByUid(node.attrs.user_id)
              }]
              // 设置是否已读
              node.isRead = this.msg.reader_list ? this.msg.reader_list.find(item => item.user_id == node.attrs.user_id) : false
            }
            return node
          })
        }
      },
      canPrivateChat() {
        if(this.uniIDHasRole('staff')){
          return true
        }
        const {conversation_id,from_uid} = this.msg
        const {group_member} = uniIm.conversation.getCached(conversation_id)
        return group_member ? group_member[from_uid]?.role.includes('admin') : false
      }
    },
    methods: {
      getNicknameByUid(uid) {
        let users = uniIm.users[uid]
        if (users) {
          return users.nickname
        } else {
          return ''
        }
      },
      previewImage(src) {
        uni.previewImage({
          urls: this.imgList,
          current: src
        })
      },
      copy(text) {
        uni.setClipboardData({
          data: text,
          success: () => {
            uni.showToast({
              title: '复制成功',
              icon: 'none'
            })
          }
        })
      },
      privateChat(user_id) {
        if (this.canPrivateChat) {
          uniIm.toChat({
            user_id,
            source:{
              group_id: this.msg.group_id
            }
          })
        }
      }
    }
  }
</script>

<style lang="scss">
.uni-im-rich-text {
  display: inline-block;
  background-color: #fff;
  padding: 10px;
  border-radius: 10px;
  max-width: 100%;
  /* #ifdef H5 */
  @media screen and (min-device-width:960px) {
    .img {
      max-width: 480px !important;
    }
  }
  .pointer {
    cursor: pointer !important;
  }
  /* #endif */
  
  .text {
    word-break: break-all;
    cursor: text;
    /* #ifdef H5 */
    @media screen and (min-device-width:960px){
      user-select: text;
    }
    /* #endif */
  }
  
  .link {
    display: inline;
    user-select: all;
    margin: 0 2px;
    word-break: break-all;
  }
  
  .isFromSelf {
    background-color: #c9e7ff !important;
  }
  
  .only1u {
    padding: 0;
    .web-info {
      margin-top: 0;
    }
  }
  
  .img {
    margin: 5px 0 !important;
    /* #ifdef H5 */
    max-width: 460rpx !important;
    display: block !important;
    box-shadow: #eee 0 0 5px;
    cursor: pointer;
    /* #endif */
  }
  
   .nickname {
    color: #0b65ff;
    margin: 0 2px;
    font-size: 15px;
  }
  
   .isRead {
    position: relative;
    top: -3px;
    margin-right: 3px;
  }
  
  .isSingeImg {
    background-color: transparent !important;
    padding: 0;
  }
  
  .web-info {
    background-color: #FFF;
    padding: 10px;
    border-radius: 10px;
    margin-top: 10px;
    border: 1px solid #eee;
    .title-box {
      flex-direction: row;
      .web-icon {
        width: 16px;
        height: 16px;
        margin: 4px 5px 0 0;
      }
    }
    .title {
      font-size: 16px;
      flex: 1;
      font-weight: bold;
    }
    .content {
      flex-direction: row;
      .description {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
        flex: 1;
        beak-word: break-all;
      }
      .web-thumbnail {
        height: 100px;
        width: 100px;
        margin: 5px;
      }
    }
    .link-box {
      flex-direction: row;
      border-top: 1px solid #eee;
      padding-top: 5px;
      justify-content: space-between;
      align-items: flex-end;
      .link {
        font-size: 12px;
        // 不会换行
        white-space: nowrap;
        flex: 1;
        overflow: hidden;
      }
      .copy {
        opacity: 0.5;
        margin-left: 20px;
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}
</style>