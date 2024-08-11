<template>
  <view class="video-box" @click="playVideo">
    <image class="video-img" mode="aspectFill" :src="videoPoster" />
    <view class="video-box-mark" />
    <uni-im-icons code="e650" size="35" color="#FFF" class="play-video-icon" />
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
    data() {
      return {
        videoPoster: '', //视频封面
        videoUrl: '', //视频地址
      }
    },
    watch: {
      'msg.body': {
        async handler(msgBody) {
          this.videoUrl = await uniIm.utils.getTempFileURL(this.msg.body.url)
          //设置videoPoster
          if (this.videoUrl.indexOf('blob:') === 0) {
            // #ifdef H5
            try {
              let videoEl = document.createElement("video");
              videoEl.src = this.videoUrl
              videoEl.currentTime = 1
              let canvasEl = document.createElement("canvas");
              let context = canvasEl.getContext("2d");
              // console.log('videoEl',videoEl);
              videoEl.addEventListener('loadeddata', () => {
                canvasEl.width = videoEl.videoWidth;
                canvasEl.height = videoEl.videoHeight;
                context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
                let firstFrameUrl = canvasEl.toDataURL();
                // console.log('firstFrameUrl',firstFrameUrl);
                this.videoPoster = firstFrameUrl
              });
            } catch (e) {
              console.error('浏览器环境，获取本地视频封面失败。将使用默认图片', e)
              this.videoPoster = '/uni_modules/uni-im/static/msg/video-uploading.gif'
            }
            // #endif
             
            // #ifndef H5
            this.videoPoster = '/uni_modules/uni-im/static/msg/video-uploading.gif'
            // #endif
          }else{
            // 文件存储的服务商
            let storageProvider = this.msg.body.url.substring(0, 8) == "cloud://" ? 'tencent' : 'aliyun'
            this.videoPoster = this.videoUrl + (storageProvider == 'aliyun' ? '?x-oss-process=video/snapshot,t_1000,f_jpg,w_200,m_fast,ar_auto':'?imageView2/0/w/200')
          }
        },
        deep: true,
        immediate: true
      }
    },
    mounted() {
    },
    methods: {
      async playVideo() {
        let url = await uniIm.utils.getTempFileURL(this.msg.body.url)
        if (uniIm.isWidescreen) {
          uni.$emit('uni-im-playVideo', url)
        } else {
          uni.navigateTo({
            url: "/uni_modules/uni-im/pages/common/video/video?url=" + url,
            animationDuration: 300,
            animationType: "fade-in"
          })
        }
      },
    }
  }
</script>

<style>
  .video-box {
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
    width: 200rpx;
    height: 200rpx;
    position: relative;
  }
  
  .video-img {
    width: 200rpx;
    height: 200rpx;
  }
  
  .play-video-icon {
    position: absolute;
    width: 35px;
    height: 35px;
    top: 35px;
    left: 35px;
    border-radius: 50%;
    border: 2px solid #FFF;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.2);
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
  }
  
  .video-box-mark {
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.1);
  }
</style>