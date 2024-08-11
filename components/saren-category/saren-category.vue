<template>
	<div class="category dflex dflex-wrap-w">
		<div class="category-item dflex dflex-flow-c margin-bottom-sm" v-for="(item) in categoryList">
			<image class="category-image margin-bottom-xs" :src="item.icon"></image>
			<span class="tac clamp">{{item.title}}</span>
		</div>
	</div>
</template>

<script>
	export default {
		name:"saren-category",
		data() {
			return {
				
			};
		},
		props: {
			categoryList: {
				type: Array,
				required: true
			}
		}
	}
</script>

<style lang="scss" scoped>
	.category {
		padding: 60rpx 0 30rpx 0;
		
		.category-item {
			font-size: 26rpx;
			color: #303133;
			width: 25%;
			
			.category-image {
				width: 96rpx;
				height: 96rpx;
			}
		}
	}
</style>