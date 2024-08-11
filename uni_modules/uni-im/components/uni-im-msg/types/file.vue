<template>
  <view class="msg-content file-msg-box" @click="downLoadFile" ref="msg-content">
    <view class="file-msg-info">
      <text class="file-msg-info-name">
        {{ fileName }}
      </text>
      <text class="file-msg-info-size">
        {{ fileSize }}
      </text>
    </view>
    <uni-im-icons code="e858" size="50" color="#EEEEEE" class="file-icon" />
  </view>
</template>

<script>
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  export default {
    props: {
      msg: {
        type: Object,
        default () {
          return {
            body: ""
          }
        }
      },
    },
    computed: {
      fileSize() {
        if (this.msg.type == 'file') {
          let size = this.msg.body.size
          if (size < Math.pow(1024, 1)) {
            return parseInt(size * 10) / 10 + 'B'
          } else if (size < Math.pow(1024, 2)) {
            return parseInt(size / Math.pow(1024, 1) * 10) / 10 + 'KB'
          } else if (size < Math.pow(1024, 3)) {
            return parseInt(size / Math.pow(1024, 2) * 10) / 10 + 'MB'
          } else {
            return 'err'
          }
        }
        return 'err'
      },
      fileName() {
        if (this.msg.type == 'file') {
          let name = this.msg.body.name
          if (name.length < 30) {
            return name
          } else {
            return name.slice(0, 15) + '...' + name.slice(-15)
          }
        }
        return ''
      }
    },
    data() {
      return {

      }
    },
    methods: {
      async downLoadFile() {
        const url = await uniIm.utils.getTempFileURL(this.msg.body.url)
        // #ifdef H5
        return window.open(url)
        // #endif

        // #ifndef H5
        uni.downloadFile({
          url,
          success: (res) => {
            if (res.statusCode === 200) {
              // console.log('下载成功');
              // console.log(res.tempFilePath);
              uni.saveFile({
                tempFilePath: res.tempFilePath,
                success: (res) => {
                  // console.log('res',res);
                  uni.openDocument({
                    filePath: res.savedFilePath
                  })
                }
              });
            }
          }
        });
        // #endif
      },
    }
  }
</script>

<style>
  .file-msg-box {
    background-color: #FFFFFF;
    width: 500rpx;
    padding: 10px;
    border-radius: 8px;
    flex-direction: row;
    justify-content: space-between;
  }

  .file-msg-info {
    width: 300rpx;
    flex-direction: column;
    justify-content: space-around;
  }

  .file-msg-info-name {
    word-wrap: break-word;
    font-size: 16px;
  }

  .file-msg-info-size {
    font-size: 12px;
    color: #666;
  }
</style>