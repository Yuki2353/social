<template>
	<view class="wh-full">
		<!-- 上方搜索框 -->
		<saren-search></saren-search>
		<!-- 下方分类和品牌 -->
		<div class="category h-full padding-top-big dflex-s">
			<!-- 左侧分类 -->
			<scroll-view class="h-full left">
				<ul class="wh-full">
					<li class="item dflex-c active">第一项</li>
					<li class="item dflex-c">第二项</li>
					<li class="item dflex-c">第三项</li>
				</ul>
			</scroll-view>
			<!-- 右侧品牌 -->
			<scroll-view class="h-full bg-main right" scroll-y="true">
				<ul class="wh-full dflex-s dflex-wrap-w">
					<li class="item padding-bottom dflex dflex-flow-c" v-for="index in 18">
						<image src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-7e00db99-ad65-4b9f-a74b-61bccb92b124/36fbb7b6-2761-4955-ab2a-adf1803554da.jpg" mode="" :lazy-load="true" class="category-image"></image>
						<span class="category-name tac clamp margin-top-sm">商品名</span>
					</li>
				</ul>
			</scroll-view>
		</div>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		onLoad() {

		},
		methods: {

		}
	}
</script>

<style lang="scss">
	.category {
		
		.left {
			width: 200rpx;
			background-color: #f5f5f5;
			
			.item {
				height: 100rpx;
				color: $font-color-base;
				position: relative;
				
				&.active {
					color: $uni-color-primary;
					background: #fff;
					
					&::before {
						content: "";
						position: absolute;
						left: 0;
						height: 70%;
						border-radius: 10rpx;
						width: 8rpx;
						background-color: $uni-color-primary;
						background-clip: content-box;
						opacity: 0.8;
					}
				}
			}
		}
		
		.right {
			flex: 1;
			
			.item {
				flex-shrink: 0;
				width: 33.33%;
				font-size: 26rpx;
				color: #666;
				
				.category-image {
					width: 130rpx;
					height: 130rpx;
				}
				
				.category-name {
					
				}
			}
		}
	}
</style>
