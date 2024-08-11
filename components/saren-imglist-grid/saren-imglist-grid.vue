<template>
	<view>
		<view class="img-list" :style="{gridTemplateColumns: gridTemplateColumns}" v-if="imgList.length > 1">
			<view class="image-container" 
				v-for="(item, index) in displayImgList" :key="index" 
				@click.stop="previewImage(index, this.imgList)">
					<image :src="item" mode="aspectFill" lazy-load="true" class="post-image wh-full"></image>
					<!-- 大于9张时的蒙层 -->
					<view v-if="beyondCount > 0 && index === 8" class="mosk-count wh-full">
						+{{beyondCount}}
					</view>
			</view>
		</view>
		<view v-else-if="imgList.length === 1" class="one-img-contaienr" @click.stop="previewImage(index, this.imgList)">
			<image :src="imgList[0]" mode="widthFix" class="one-img"></image>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-imglist-grid",
		data() {
			return {
				
			};
		},
		props: {
			imgList: {
				type: Array,
				required: true
			},
			maxCount: {
				type: Number,
				default: 9
			}
		},
		computed: {
			gridTemplateColumns() {
				let imgLength = this.imgList.length;
				let column = imgLength >= 3? 3: 2;
				return `repeat(${column}, 1fr)`;
			},
			displayImgList() {
				return this.imgList.slice(0, this.maxCount);
			},
			beyondCount() {
				let imgLength = this.imgList.length;
				if (imgLength <= this.maxCount) {
					return 0;
				}
				return imgLength - this.maxCount + 1;
			}
		},
		methods: {
			// 预览图片
			previewImage(index, imgList) {
				uni.previewImage({
					current: index,
					urls: imgList,
				});
			},
		}
	}
</script>

<style scoped lang="scss">
.img-list {
	display: grid;
	gap: 15rpx;
	
	.image-container {
		aspect-ratio: 1;
		border-radius: 10rpx;
		overflow: hidden;
		position: relative;
		
		.post-image {
			
		}
		
		.mosk-count {
			position: absolute;
			top: 0;
			left: 0;
			background-color: gray;
			opacity: 0.8;
			font-size: 40rpx;
			color: white;
			display: grid;  
			place-items: center;
		}
	}
}

.one-img-contaienr {
	border-radius: 10rpx;
	overflow: hidden;
	max-height: 75vh;
	
	.one-img {
		width: 75%;
	}
}
</style>