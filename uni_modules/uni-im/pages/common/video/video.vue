<template>
  <view v-if="url" class="video-box" :class="{'is-float-mode':mode == 'float'}">
    <view class="mask" v-if="mode == 'float'"></view>
  	<video @click="showCloseBtnFn" :src="url" :autoplay="true" :page-gesture="true" :show-mute-btn="true" :show-fullscreen-btn="mode == 'float'" class="video"></video>
  	<uni-icons v-if="showCloseBtn" @click="close" size="30px" color="#FFFFFF" type="closeempty" class="close-icon"></uni-icons>
  </view>
</template>

<script>
import uniIm from '@/uni_modules/uni-im/sdk/index.js';
	export default {
		data() {
			return {
				url:"",
				showCloseBtn:true,
        // 全屏模式和小窗模式，fullscreen为全屏模式，float为小窗模式
        mode: 'fullscreen',
			};
		},
		onLoad({url}) {
			// console.log({url});
			this.url = url
			setTimeout(()=> {
				this.showCloseBtn = false
			}, 1000);
		},
    mounted(){
      // console.log('mounted');
      uni.$on('uni-im-playVideo',(url)=>{
        this.mode = 'float'
        this.url = url
        this.showCloseBtn = true
      })
      
      // 监听esc按键，关闭视频
      // #ifdef H5
      uniIm.utils.appEvent.onKeyDown(evt => this.onDownEscapeKey, {
        order: 1000,
        match: {
          key: 'Escape',
          altKey: false,
          ctrlKey: false,
          shiftKey: false,
        }
      })
      // #endif
    },
    beforeDestroy(){
      // #ifdef H5
      uniIm.utils.appEvent.offKeyDown(this.onDownEscapeKey)
      // #endif
    },
		methods:{
      onDownEscapeKey() {
        if (this.url.length) {
          this.close()
        }
        return true
      },
			close(){
        if(this.mode == 'fullscreen'){
          uni.navigateBack()
        }else{
          this.url = ''
        }
			},
			showCloseBtnFn(){
				// console.log('showCloseBtnFn');
				this.showCloseBtn = true
        if(this.mode == 'fullscreen'){
          setTimeout(()=> {
          	this.showCloseBtn = false
          }, 5000);
        }
			}
		}
	}
</script>

<style lang="scss">
@import "@/uni_modules/uni-im/common/baseStyle.scss";
page {
  height: 100%;
}
.video-box {
  &.video{
    width: 100vw;
    height: 100%;
  }
  .close-icon{
  	position: absolute;
  	top: 80rpx;
  	left: 30rpx;
  	z-index: 10;
  	text-shadow: 0 0 15px black;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }
  &.is-float-mode,
  &.is-float-mode .video{
  	position: fixed;
  	top: 10vh;
    left: calc(10vw + 250px);
    width: calc(80vw - 220px) !important;
    height: 80vh !important;
    z-index: 9;
  }
  .mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1;
  }
}
</style>
