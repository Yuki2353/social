<template>
	<view>
		<scroll-view scroll-x>
			<view class="dflex padding-bottom-sm">
				<view class="padding-tb-xs padding-lr margin-right-xs filter-text active">
					全部
				</view>
				<view class="padding-tb-sm padding-lr margin-right-xs filter-text" v-for="ietm in 8">
					全部
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		name:"saren-filter-bar",
		data() {
			return {
				
			};
		}
	}
</script>

<style lang="scss" scoped>
	.active {
		color: #ff6a6c;
		font-weight: bold;
		font-size: 34rpx;
	}
	.filter-text {
		flex-shrink: 0;
	}
</style>