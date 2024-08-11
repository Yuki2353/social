<template>
	<view class="img-list margin-top-xs" v-if="imgList.length !== 0">
		<view class="img-group" v-for="(groupItem, groupIndex) in displayList" :key="groupIndex" :style="{gridTemplateColumns: gridTemplateColumns(groupItem.count)}">
			<block v-for="(imgItem, imgIndex) in groupItem.imgGroup" :key="imgIndex">
				<!-- <view class="image-container">
					<image :src="imgItem" mode="aspectFill" lazy-load="true" class="post-image wh-full"></image>
				</view> -->
				<view class="image-container clear-aspect-ratio" v-if="groupItem.count === 1">
					<image :src="imgItem" mode="widthFix" lazy-load="true" class="post-image w-full" @click.stop="previewImage(imgIndex, this.imgList)"></image>
				</view>
				<view :class="['image-container', imgIndex === 0? 'count3_specail': '']" v-else-if="groupItem.count === 3 && groupItem.type === 1">
					<image :src="imgItem" mode="aspectFill" lazy-load="true" class="post-image wh-full" @click.stop="previewImage(imgIndex, this.imgList)"></image>
				</view>
				<view class="image-container" v-else>
					<image :src="imgItem" mode="aspectFill" lazy-load="true" class="post-image wh-full" @click.stop="this.$api.previewImage(imgIndex, this.imgList)"></image>
				</view>
			</block>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-imglist",
		data() {
			return {
				displayModes: [
					{
						id: 0,
						count: 1,
						type: 1,
					},
					{
						id: 1,
						count: 2,
						type: 1,
					},
					{
						id: 2,
						count: 3,
						type: 1,
					},
					{
						id: 3,
						count: 3,
						type: 2
					}
				],
				displayRules: {
					1: [0],
					2: [0, 0],
					3: [0, 1],
					4: [0, 2],
					5: [0, 1, 1],
					6: [0, 1, 3],
					7: [0, 2, 3],
					8: [0, 1, 1, 3],
					9: [0, 0, 1, 1, 3]
				}
			};
		},
		props: {
			imgList: {
				type: Array,
				required: true
			}
		},
		computed: {
			// 分组后展示
			displayList() {
				// 边界情况：如果为空
				if (this.imgList.length === 0) {
					return [];
				}
				// 正常处理
				const imgList = this.imgList;
				const displayModes = this.displayModes;
				const displayRule = this.displayRules[imgList.length];
				let result = [];
				for (let index = 0, imgIndex = 0; index < displayRule.length; index++) {
					const mode = displayModes[displayRule[index]];
					const count = mode.count;
					const groupItem = {
						count: count,
						type: mode.type,
						imgGroup: imgList.slice(imgIndex, imgIndex + count),
					};
					result.push(groupItem);
					imgIndex += count;
				}
				return result;
			},
		},
		//
		methods: {
			// 网格布局列数（style绑定不支持css函数）
			gridTemplateColumns(count) {
				return `repeat(${count}, 1fr)`;
			},
			// 预览图片
			previewImage(index, imgList) {
				uni.previewImage({
					current: index,
					urls: imgList,
				});
			},
		},
		// 挂载时进行图片布局，增强可编程性
		mounted() {
			
		}
	}
</script>

<style scoped lang="scss">
.img-list {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	
	.img-group {
		display: grid;
		gap: 10rpx;
		
		.image-container {
			aspect-ratio: 1;
			
			.post-image {
				border-radius: 10rpx;
			}
		}
	}
}

.count3_specail {
	grid-row: span 2;
	grid-column: span 2;
	aspect-ratio: auto !important;
}

.clear-aspect-ratio {
	aspect-ratio: auto !important;
}
</style>