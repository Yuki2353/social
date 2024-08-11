<template>
<view
  v-if="showMsgList"
  class="uni-im-view-msg"
  @click="close()"
>
  <view class="msg-list" @click.stop>
    <view class="header">
      <view class="title">
        转发的消息内容
      </view>
      <view class="close" @click="close">
        <uni-icons
          type="clear"
          size="25px"
          color="#ccc"
        />
      </view>
    </view>
    <scroll-view :scroll-y="true" class="content">
      <uni-im-msg
        v-for="(msg,index) in msgList"
        :key="index"
        :msg="msg"
      />
    </scroll-view>
  </view>
</view>
</template>

<script>
export default {
  name: 'UniImViewMsg',
  data() {
    return {
      showMsgList: false,
      msgList: [],
    }
  },
  methods: {
    open(msgList) {
      this.showMsgList = true;
      this.msgList = msgList;
      // document.getElementById('dialog').showModal();
    },
    close() {
      this.showMsgList = false;
      // document.getElementById('dialog').close();
      this.msgList = [];
    }
  }
}
</script>

<style lang="scss">
.uni-im-view-msg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  width: 100vw;
  height: 100vh;
  max-width: 100vw !important;
  max-height: 100vh !important;
  background-color: rgba(0, 0, 0, .5);
  .msg-list {
    background-color: #fff;
    top: 25%;
  }
  /* #ifdef H5 */
  @media screen and (min-device-width:960px) {
    .msg-list {
      position: fixed;
      width: 600px;
      left: calc(50% - 300px);
    }
  }
  /* #endif */
  
  .msg-list .header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    background-color: rgba(250, 250, 250, 1);
    padding: 10px;
  }
  
  .msg-list .header .close {
    cursor: pointer;
  }
  
  .msg-list .title {
    font-size: 20px;
    color: #333;
  }
  
  .msg-list .content {
    padding: 10px;
    height: 400px;
    background-color: rgba(245, 245, 245, 1);
  }
  /* #ifdef H5 */
  @media screen and (min-device-width:960px) {
    .msg-list .content ::v-deep * {
      max-height: none !important;
    }
    #dialog {
      border-radius: 10px;
      border: none;
      padding: 0;
    }
    //  关闭 #dialog选中时的蓝色边框
    #dialog:focus {
      display: none;
    }
    #dialog::backdrop {
      background: rgba(0, 0, 0, .5);
    }
  }
  /* #endif */
}
</style>
