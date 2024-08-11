<template>
	<view class="post-item-container padding-sm border-bottom" @click="detailPost">
		<!-- 用户信息 -->
		<view class="userInfo dflex">
			<image class="avatar flex0 border-radius-c margin-right-xs ft-base" 
				:src="postInfo.avatar"
				@click.stop="toHomePage"
			>
			</image>
			<view class="nickname-time flex1 dflex-s dflex-flow-c">
				<view class="nickname fs-30 ft-base margin-bottom-xs fwb clamp" @click.stop="toHomePage">
					{{postInfo.nickname}}
				</view>
				<view class="time fs-20">{{this.$api.formatTime(postInfo.createTime)}}</view>
			</view>
			<view 
				class="delete flex0 margin-left-sm padding-tb-5 padding-lr-sm border-radius-big" 
				v-if="userInfo._id && userInfo._id === postInfo.user_id"
				@click.stop="removePost"
				>
					删除
			</view>
		</view>
		<!-- 标题 -->
		<view class="post-title fs-34 fwbd margin-top-sm">{{postInfo.title}}</view>
		<!-- 内容 -->
		<view class="post-content fs-30 ws-nm margin-top-sm">{{postInfo.content}}</view>
		<!-- 图片列表 -->
		<block v-if="detail">
			<saren-imglist :imgList="postInfo.imgList"></saren-imglist>
		</block>
		<block v-else>
			<saren-imglist-grid :imgList="postInfo.imgList"></saren-imglist-grid>
		</block>
		<!-- 底部按钮 -->
		<view class="post-item-footer margin-top-sm dflex">
			<view class="look-box flex1 dflex-c">
				<button class="btn-box" 
					:data-title="postInfo.title || postInfo.content" 
					:data-image-url="postInfo.imgList[0] || ''"
					:data-path="'/pages/post-detail/post-detail?_id='+postInfo._id"
					open-type="share" 
					@click.stop="sharePost">
					<image class="icon margin-right" src="@/static/svg/share.svg"></image>
				</button>
				<text v-if="postInfo.shareCount && postInfo.shareCount > 0">{{this.$api.formatCount(postInfo.shareCount)}}</text>
				<text v-else>分享</text>
			</view>
			<view class="look-box flex1 dflex-c">
				<image class="icon margin-right" src="@/static/svg/view.svg"></image>
				<text v-if="postInfo.lookCount && postInfo.lookCount > 0">{{this.$api.formatCount(postInfo.lookCount)}}</text>
				<text v-else>围观</text>
			</view>
			<view class="comment-box flex1 dflex-c">
				<image class="icon margin-right" src="@/static/svg/comment.svg"></image>
				<text v-if="postInfo.commentCount && postInfo.commentCount > 0">{{this.$api.formatCount(postInfo.commentCount)}}</text>
				<text v-else>评论</text>
			</view>
			<view class="like-box flex1 dflex-c">
				<image v-if="!postInfo.isLiked" class="icon margin-right" src="@/static/svg/like.svg" @click.stop="likePost"></image>
				<image v-else class="icon margin-right" src="@/static/svg/liked.svg" @click.stop="likePost"></image>
				<text v-if="postInfo.likeCount && postInfo.likeCount > 0">{{this.$api.formatCount(postInfo.likeCount)}}</text>
				<text v-else>点赞</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-post-item",
		data() {
			return {
				
			};
		},
		props: {
			postInfo: {
				type: Object,
				required: true
			},
			detail: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			likePost() {
				this.$emit("likePost", this.postInfo._id);
			},
			sharePost() {
				this.$emit("sharePost", this.postInfo._id);
			},
			removePost() {
				this.$emit("removePost", this.postInfo._id);
			},
			detailPost() {
				if (this.detail) {
					return;
				}
				this.$emit("detailPost", this.postInfo._id);
			},
			toHomePage() {
				uni.navigateTo({
					url: `/pages/homepage/homepage?user_id=${this.postInfo.user_id}`
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.avatar {
		width: 70rpx;
		height: 70rpx;
	}
	.delete {
		color: red;
		border: 2rpx red solid;
	}
	.post-title {
		color: #3e3e3e;
	}
	.icon {
		height: 50rpx;
		width: 50rpx;
	}
	.btn-box {
		margin: 0;
		padding: 0;
		background-color: transparent;
		line-height: 1;
	}
	.btn-box::after {
		border: none;
	}
	@keyframes growShrink {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.5);
		}
		100% {
			transform: scale(1);
		}
	}
	.growShrink {
		animation: growShrink 1s ease-in-out 1;
	}
</style>