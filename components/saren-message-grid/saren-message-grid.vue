<template>
	<view class="message-grid-container">
		<view class="grid-item" @click="goto('/pages/message/message-like/message-like')">
			<uni-badge class="uni-badge-left-margin" :text="countList[0]" absolute="rightTop" :offset="[-3, -3]"
			ize="small">
				<image class="icon" src="@/static/svg/message-like.svg" mode=""></image>
			</uni-badge>
			<view class="text">
				赞和收藏
			</view>
		</view>
		<!-- <view class="grid-item" @click="goto('/pages/message/message-care/message-care')">
			<uni-badge class="uni-badge-left-margin" :text="countList[1]" absolute="rightTop" :offset="[-3, -3]"
				size="small">
				<image class="icon" src="@/static/svg/message-care.svg" mode=""></image>
			</uni-badge>
			<view class="text">
				新增关注
			</view>
		</view> -->
		<view class="grid-item" @click="goto('/pages/message/message-comment/message-comment')">
			<uni-badge class="uni-badge-left-margin" :text="countList[1]" absolute="rightTop" :offset="[-3, -3]"
				size="small">
				<image class="icon" src="@/static/svg/message-comment.svg" mode=""></image>
			</uni-badge>
			<view class="text">
				评论回复
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-message-grid",
		data() {
			return {
				
			};
		},
		props: {
			countList: {
				type: Array,
				default: [0, 0]
			}
		},
		methods: {
			goto(url) {
				uni.navigateTo({
					url
				})
			}
		}
	}
</script>

<style scoped lang="scss">
	.message-grid-container {
		padding: 30rpx 100rpx;
		background-color: #f5f5f5;
		display: grid;
		grid-template-columns: repeat(2, 1fr);

		.grid-item {
			display: flex;
			flex-direction: column;
			align-items: center;

			.icon {
				height: 80rpx;
				width: 80rpx;
			}

			.text {
				margin-top: 10rpx;
				font-size: 24rpx;
				color: #747474;
			}
		}
	}
</style>
