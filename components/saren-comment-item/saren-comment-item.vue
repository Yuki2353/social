<template>
	<view class="post-item-container padding-sm border-bottom" @click="selectComment" :id="'_'+commentInfo._id">
		<!-- 用户信息 -->
		<view class="userInfo dflex-s">
			<image class="avatar flex0 border-radius-c margin-right-xs ft-base" 
				:src="commentInfo.avatar" @click.stop="toHomePage(commentInfo.user_id)"
			></image>
			<view class="nickname-time flex1">
				<view class="nickname-box dflex-b">
					<view class="clamp-long fwb" 
						v-if="commentInfo.type === 1" @click.stop="toHomePage(commentInfo.user_id)"
					>
						{{commentInfo.nickname}}
					</view>
					<view class="nicknameBoth dflex" v-else>
						<view class="nicknameText clamp-short fwb" @click.stop="toHomePage(commentInfo.user_id)">
							{{commentInfo.nickname}}
						</view>
						<view class="replay ft-dark margin-lr-sm">
							回复
						</view>
						<view class="nicknameText clamp-short fwb" @click.stop="toHomePage(commentInfo.repliedUserId)">
							{{commentInfo.repliedNickname}}
						</view>
					</view>
					<view class="delete" 
						v-if="userInfo._id && userInfo._id === commentInfo.user_id"
						@click.stop="removeComment">
							删除
					</view>
				</view>
				<view class="post-content fs-sm ws-nm">{{commentInfo.content}}</view>
				<view class="fs-20 ft-dark">{{this.$api.formatTime(commentInfo.createTime)}}</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-comment-item",
		data() {
			return {
				
			};
		},
		props: {
			commentInfo: {
				type: Object,
				required: true
			}
		},
		methods: {
			selectComment() {
				this.$emit("selectComment", this.commentInfo);
			},
			getCommentTop() {
				const query = uni.createSelectorQuery().in(this);
				const queryHeight = query
									  .select(`#_${this.commentInfo._id}`);
				return queryHeight;
			},
			removeComment() {
				this.$emit("removeComment", this.commentInfo);
			},
			toHomePage(user_id) {
				uni.navigateTo({
					url: `/pages/homepage/homepage?user_id=${user_id}`
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
	}
	.post-title {
		color: #3e3e3e;
	}
</style>