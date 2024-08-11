<template>
	<div class="saren-search w-full padding-lr bg-main dflex-c">
		<div class="search-box w-full padding-lr dflex-b border-radius-lg" @click.stop="toSearch">
			<span class="text">请输入搜索关键词</span>
			<i class="icon iconfont icon-search_light"></i>
		</div>
	</div>
</template>

<script>
	export default {
		name:"saren-search",
		data() {
			return {
				
			};
		},
		props: {
			searchUrl: {
				type: String,
				required: true
			}
		},
		methods: {
			toSearch() {
				uni.navigateTo({
					url: this.searchUrl
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.saren-search {
		height: 100rpx;
		
		.search-box {
			height: 70rpx;
			line-height: 70rpx;
			background-color: #f5f5f5;
			
			color: #c0c0c0;
			
			.icon {
				font-size: $font-base + 6upx;
			}
		}
	}
</style>