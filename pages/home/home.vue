<template>
	<view>
		<mescroll-body @init="mescrollInit" @down="downCallback" @up="upCallback" :down="downOption" :up="upOption">
			<saren-search searchUrl="/pages/search/search"></saren-search>
			<saren-swiper></saren-swiper>
			<saren-post-list 
				:dataList="dataList" :waterfall="true" 
				@likePost="likePost" @sharePost="sharePost"  @removePost="removePost" @detailPost="detailPost"
			></saren-post-list>
			<view class="addPost bg-base border-radius-c" @click.stop="toRelease">
				+
			</view>
		</mescroll-body>
	</view>
</template>

<script>
	import listMixin from "@/common/mixin/sarenPostList.js"
	
	export default {
		mixins: [listMixin],
		data() {
			return {
				dataOption: {
					method: "time",
					// post_id: "6686370b213929f866083306"
				},
			}
		},
		methods: {
			toRelease() {
				this.navigateLogin("/pages/release/release");
			}
		},
		onLoad() {
			console.log(this.vuex_navbar);
		}
	}
</script>

<style lang="scss" scoped>
.addPost {
	position: fixed;
	right: 24rpx;
	bottom: 60rpx;
	width: 80rpx;
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	font-size: 60rpx;
}
</style>
