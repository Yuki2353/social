<template>
	<view>
		<block v-if="waterfall">
			<view class="goods-list padding-lr-xs padding-top-xs">
				<view class="leftList">
					<block v-for="(item) in leftList" :key="item._id">
						<saren-post-item-waterfall 
							:postInfo="item" 
							@likePost="likePost" @sharePost="sharePost" @removePost="removePost" @detailPost="detailPost"
						>
						</saren-post-item-waterfall>
					</block>
				</view>
				<view class="rightList">
					<block v-for="(item) in rightList" :key="item._id">
						<saren-post-item-waterfall
							:postInfo="item" 
							@likePost="likePost" @sharePost="sharePost" @removePost="removePost" @detailPost="detailPost"
						>
						</saren-post-item-waterfall>
					</block>
				</view>
			</view>
		</block>
		<block v-else>
			<view v-for="(item, index) in dataList" :key="item._id">
				<saren-post-item
					:postInfo="item" 
					@likePost="likePost" @sharePost="sharePost" @removePost="removePost" @detailPost="detailPost"
				>
				</saren-post-item>
			</view>
		</block>
	</view>
</template>

<script>
	export default {
		name:"saren-post-list",
		data() {
			return {

			};
		},
		props: {
			dataList: {
				type: Array,
				default: [],
				required: true
			},
			waterfall: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			leftList() {
				return this.dataList.filter((item, index) => {
					return (index % 2 === 0);
				});
			},
			rightList() {
				return this.dataList.filter((item, index) => {
					return (index % 2 === 1);
				});
			}
		},
		methods: {
			likePost(params) {
				this.$emit("likePost", params);
			},
			sharePost(params) {
				this.$emit("sharePost", params);
			},
			removePost(params) {
				this.$emit("removePost", params);
			},
			detailPost(params) {
				this.$emit("detailPost", params);
			}
		}
	}
</script>

<style>
.goods-list {
	display: flex;
	justify-content: center;
	background-color: #f3f4f6;
}
.leftList {
	width: 50%;
	padding-right: 5rpx;
}
.rightList {
	width: 50%;
	padding-left: 5rpx;
}
</style>