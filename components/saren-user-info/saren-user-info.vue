<template>
	<view class="user-wrap" v-if="thisUserInfo._id">
		<!-- 此处添加背景图片标签 -->
		<view v-if="thisUserInfo.backgroundImg" class="background-image"
			:style="{backgroundImage:`url(${thisUserInfo.backgroundImg})`}"></view>
		<view v-else class="background-mask"></view>
		<view class="user-container"
			:style="{paddingTop: 0+'px',color: thisUserInfo.backgroundImg ? '#fff' : '#000'}">
			<view class="user-main">
				<view class="user-left">
					<view class="user-box">
						<image class="avatar" :src="thisUserInfo.avatar" @click.stop="previewImage(0, [thisUserInfo.avatar])">
						</image>
						<view class="avatar-right">
							<view class="nickname">
								{{ thisUserInfo.nickname || '未填写昵称' }}
							</view>
						</view>
					</view>
					<view class="introduction">
						<text user-select>{{ thisUserInfo.introduction || '' }}</text>
					</view>
				</view>
				<view v-if="thisUserInfo._id !== userInfo._id" class="action-box margin-top-xl">
					<view v-if="thisUserInfo._id !== userInfo._id" class="chat-box"
						@click.stop="toChat(thisUserInfo._id)"
					>
						私信
					</view>
					<!-- <view v-if="isCareUser" class="has-care-box" @click.stop="clickCareUser">
						已关注
					</view>
					<view v-else class="care-box" @click.stop="clickCareUser">
						关注
					</view> -->
				</view>
			</view>
			<view class="footer">
				<view class="count-warp">
					<view class="count-container" v-if="thisUserInfo._id !== userInfo._id">
						<view class="count-box">
							<view class="count">
								{{ thisUserInfo.postCount || 0 }}
							</view>
							<view class="text">
								发布
							</view>
						</view>
					</view>
					<!-- <view class="count-container"
						@click.stop="goto(`../user-care/user-care?tab=fans&id=${user.id}`)">
						<view class="count-box">
							<view class="count">
								{{ user.fansCount || 0 }}
							</view>
							<view class="text">
								粉丝
							</view>
						</view>
					</view> -->
					<!-- <view class="count-container">
						<view class="count-box">
							<view class="count">
								{{ (user.likeCount + user.collectCount) || 0 }}
							</view>
							<view class="text">
								获赞和收藏
							</view>
						</view>
					</view> -->
				</view>
				<view v-if="thisUserInfo._id === userInfo._id || userInfo.isAdmin" class="edit-info"
					@click.stop="toEditInfo"
				>
					编辑资料
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-user-info",
		data() {
			return {
				
			};
		},
		props: {
			thisUserInfo: {
				type: Object,
				required: true
			}
		},
		methods: {
			previewImage(index, imgList) {
				uni.previewImage({
					current: index,
					urls: imgList,
				});
			},
			toChat(user_id) {
				this.navigateLogin(`/uni_modules/uni-im/pages/chat/chat?user_id=${user_id}`);
			},
			toEditInfo() {
				this.navigateLogin(`/pages/my-info/my-info`);
			}
		}
	}
</script>

<style scoped lang="scss">
.user-wrap {
	position: relative;

	.background-image {
		z-index: -2;
		position: absolute;
		height: 100%;
		width: 100%;
		background-size: cover; // 使背景图片覆盖整个容器
		background-position: center; // 将背景图片水平和垂直居中
		background-repeat: no-repeat; // 防止背景图片重复
		background-blend-mode: multiply; // 使用混合模式，可以尝试不同的模式
		// background: inherit;
		filter: contrast(40%);
	}

	.background-mask {
		z-index: -1;
		position: absolute;
		width: 100%;
		min-height: 100vh;
		background: linear-gradient(180deg, #d0ddf5, #f7f9fc 31%);
	}

	.user-container {
		padding: 30rpx 30rpx 80rpx;

		.user-main {
			width: 100%;
			display: inline-flex;

			.user-left {
				width: 100%;

				.user-box {
					margin-top: 30rpx;
					width: 100%;
					display: inline-flex;

					.avatar {
						background-color: #eee;
						flex-shrink: 0;
						height: 130rpx;
						width: 130rpx;
						border-radius: 50%;
						margin-right: 30rpx;
					}

					.avatar-right {
						width: 100%;
						display: flex;
						flex-direction: column;
						justify-content: center;

						.nickname {
							font-size: 34rpx;
							font-weight: 700;
						}

						.location-box {
							margin-top: 20rpx;
							display: inline-flex;
							align-items: center;

							.text {
								margin-left: 10rpx;
							}
						}
					}
				}

				.ban-tips {
					margin-top: 30rpx;
					color: red;
					display: inline-flex;
					align-items: center;

					.ban-text {
						margin-right: 20rpx;
					}
				}

				.introduction {
					margin-top: 30rpx;
				}
			}

			.action-box {
				margin-left: 20rpx;
				flex-shrink: 0;
				text-align: center;

				.border-box {
					margin-bottom: 20rpx;
					border-radius: 100rpx;
					font-size: 28rpx;
					padding: 6rpx 20rpx;
					border: 2rpx solid;
				}

				.ban-box {
					@extend .border-box;
					border-color: #ffaa00;
					color: #ffaa00;
				}

				.care-box {
					@extend .border-box;
					border-color: #55aaff;
					color: #55aaff;
				}

				.has-care-box {
					@extend .border-box;
					color: #878787;
					border-color: #878787;
				}

				.chat-box {
					@extend .border-box;
				}
			}
		}

		.footer {
			margin-top: 30rpx;
			width: 100%;
			display: inline-flex;
			align-items: center;
			font-weight: 600;

			.count-warp {
				flex: 1;
				display: inline-flex;

				.count-container {
					width: 130rpx;
					display: inline-flex;

					.count-box {
						font-size: 24rpx;
						text-align: center;

						// display: flex;
						// flex-direction: column;
						// justify-content: center;
						// align-items: center;

						.count {}

						.text {
							margin-top: 10rpx;
						}
					}
				}
			}

			.edit-info {
				border: 2rpx solid;
				padding: 10rpx 20rpx;
				border-radius: 100rpx;
			}
		}
	}
}
</style>