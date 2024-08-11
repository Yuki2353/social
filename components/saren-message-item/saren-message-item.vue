<template>
	<view class="dflex padding-tb-sm padding-lr border-bottom pos-r" @click="detailPost" v-if="msgInfo._id">
		<!-- 未读消息提示 -->
		<view class="unReadTick border-radius-c" v-if="unreadStatus"></view>
		<!-- 用户头像 -->
		<view class="avatarContainer flex0" @click.stop="toHomePage">
			<image class="avatar border-radius-c" :src="msgInfo.avatar" mode="aspectFill"></image>
		</view>
		<!-- 评论内容 -->
		<view class="msgItemCenter flex1 margin-lr-sm dflex">
			<view>
				<view class="nickname clamp-long fs-30 fwb" @click.stop="toHomePage">
					{{ msgInfo.nickname }}
				</view>
				<view class="dflex dflex-wrap-w margin-top-xs commentInfo">
					<view class="commentContent ft-dark clamp-2 fs-sm">
						{{ messageInfo }}
					</view>
					<view class="msgTime ft-dark fs-xxs margin-left-xs">
						{{ this.$api.formatTime(msgInfo.createTime) }}
					</view>
				</view>
			</view>
		</view>
		<!-- 图片 -->
		<view class="postImgContainer flex0" v-if="msgInfo.postImgList && msgInfo.postImgList.length > 0">
			<image class="postImg border-radius-sm" :src="msgInfo.postImgList[0]" mode="aspectFill"></image>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-message-item",
		data() {
			return {
				
			};
		},
		props: {
			msgInfo: {
				type: Object,
				required: true
			}
		},
		computed: {
			unreadStatus() {
				return this.msgInfo.status === 0;
			},
			messageInfo() {
				if (this.msgInfo.type === 1) {
					return "赞了你的帖子";
				}
				else {
					return "回复你 " + this.msgInfo.content
				}
			}
		},
		methods: {
			// 查看帖子详情
			detailPost() {
				if (this.msgInfo.status === 0) {
					this.$emit("readMessage", this.msgInfo._id)
				}
				uni.navigateTo({
					url: `/pages/detail/detail?post_id=${this.msgInfo.post_id}`
				});
			},
			// 查看用户主页
			toHomePage() {
				uni.navigateTo({
					url: `/pages/homepage/homepage?user_id=${this.msgInfo.user_id}`
				});
			}
		}
	}
</script>

<style scoped>
.avatar {
	width: 110rpx;
	height: 110rpx;
}
.postImg {
	width: 130rpx;
	height: 130rpx;
}
.commentInfo {
	margin-top: 5rpx;
}
.unReadTick {
	position: absolute; 
	background: #ff6a6c; 
	padding: 8rpx;
	color: #fff;
	top: 20rpx;
	right: 20rpx;
}
</style>