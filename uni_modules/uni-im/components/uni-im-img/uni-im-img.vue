<template>
  <image @load="load" :src="url" :mode="mode" :style='{"width":viewWidth,"height":viewHeight}' @click="handleClick"></image>
</template>

<script>
import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  export default {
    emits: ['click'],
    props: {
      src: {
        type: String,
        default: ''
      },
      mode: {
        type: String,
        default: ''
      },
      maxWidth: {
        type: [String,Number],
        default: false
      },
      maxHeight: {
        type: [String,Number],
        default: ''
      },
      width: {
        type: [String,Number],
        default: ''
      },
      height: {
        type: [String,Number],
        default: ''
      }
    },
    data() {
      return {
        url: '',
        viewWidth: '',
        viewHeight: ''
      }
    },
    mounted() {
      // console.log('beforeCreate')
      if( this.width && this.height){
        // 根据maxWidth 和 maxWidth，在保持宽高比例不变的情况下 计算viewWidth 和 viewHeight
        const maxWidth = this.toPx(this.maxWidth)
        const maxHeight = this.toPx(this.maxHeight)
        let width = this.toPx(this.width)
        let height = this.toPx(this.height)
        
        // 如果宽超过最大宽度，高度按比例缩小
        if(width > maxWidth){
          height = height * maxWidth / width
          width = maxWidth
        }
        // 如果高超过最大高度，宽度按比例缩小
        if(height > maxHeight){
          width = width * maxHeight / height
          height = maxHeight
        }
        this.viewWidth = width + 'px'
        this.viewHeight = height + 'px'
      }
    },
    watch: {
       src:{
        async handler(src) {
          if(src){
            this.url = await uniIm.utils.getTempFileURL(src)
            // src 是cloud://开头的云存储地址，是腾讯云，否则是阿里云
            if(src.indexOf('cloud://') === 0){
              this.url += '?imageMogr2/thumbnail/400x400>'
            }else if(src.indexOf('http') === 0){
              // 因为还可能是 base64 blob 的本地图片，所以这里判断是不是http开头的
              this.url += '?x-oss-process=image/resize,w_200/quality,q_80'
            }
          }
        },
        immediate: true
      }
    },
    methods: {
      load(e){
        // console.log('img load',e)
        // TODO：渲染后再设置宽高，为兼容旧版系统，图片消息中没有带宽高的情况
        if(!this.width || !this.height){
          let width = e.detail.width
          let maxWidth = this.toPx(this.maxWidth)
          if(maxWidth && width > maxWidth){
            this.viewWidth = maxWidth + 'px'
            this.viewHeight = maxWidth * e.detail.height / e.detail.width + 'px'
            // console.error('超了',this.width,this.height)
          }else{
            this.viewWidth = e.detail.width + 'px'
            this.viewHeight = e.detail.height + 'px'
          }
        }
      },
      handleClick(){
        this.$emit('click')
      },
      // 如果是rpx单位，转换为px
      toPx(val){
        if(typeof val === 'string' && val.indexOf('rpx') > -1){
          return parseInt(val) * uniIm.systemInfo.windowWidth / 750
        }
        return parseInt(val)
      }
    }
  }
</script>

<style>
</style>
