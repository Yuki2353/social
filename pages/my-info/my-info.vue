<template>
	<view v-if="userInfo._id">
		<view class="top-box">
			<!-- #ifndef MP-WEIXIN -->
			<view class="avatar-box" @click="chooseAvatar">
				<image class="avatar" :src="userInfo.avatar"></image>
				<image class="select-icon" src="@/static/svg/selectAvatar.svg"></image>
			</view>
			<!-- #endif -->
			<!-- #ifdef MP-WEIXIN -->
			<button class="btn-box" open-type="chooseAvatar" size="mini" @chooseavatar="chooseAvatar">
				<view class="avatar-box">
					<image class="avatar" :src="userInfo.avatar"></image>
					<image class="select-icon" src="@/static/svg/selectAvatar.svg"></image>
				</view>
			</button>
			<!-- #endif -->
		</view>
		<view class="list-container">
			<view class="item-box" hover-class="view-hover" :hover-stay-time="50" hover-stop-propagation
				@click="goto(`./nickname/nickname`)">
				<view class="left-box">
					昵称
				</view>
				<view class="right-box">
					<view class="text">
						{{ userInfo.nickname || '' }}
					</view>
					<image class="icon" src="@/static/svg/right.svg"></image>
				</view>
			</view>
			<view class="item-box" hover-class="view-hover" :hover-stay-time="50" hover-stop-propagation
				@click="goto(`./introduction/introduction`)">
				<view class="left-box">
					简介
				</view>
				<view class="right-box">
					<view class="text">
						{{ userInfo.introduction || '' }}
					</view>
					<image class="icon" src="@/static/svg/right.svg"></image>
				</view>
			</view>
			<view class="item-box" hover-class="view-hover" :hover-stay-time="50" hover-stop-propagation
				@click="goto(`./gender/gender`)">
				<view class="left-box">
					性别
				</view>
				<view class="right-box">
					<view class="text">
						{{ genderText }}
					</view>
					<image class="icon" src="@/static/svg/right.svg"></image>
				</view>
			</view>
			<view class="item-box" hover-class="view-hover" :hover-stay-time="50" hover-stop-propagation
				@click="chooseBackgroundImg">
				<view class="left-box">
					背景图
				</view>
				<view class="right-box">
					<image class="img" :src="userInfo.backgroundImg" mode="aspectFill"></image>
					<image class="icon" src="@/static/svg/right.svg"></image>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	
	export default {
		data() {
			return {
				
			};
		},
		computed: {
			// 中文性别
			genderText() {
				let gender = this.userInfo?.gender
				return gender === 0 ? '女' : gender === 1 ? '男' : '保密'
			}
		},
		watch: {
			
		},
		onLoad(option) {
			if (!this.hasLogin) {
				this.toLogin();	
			}
		},
		async onPullDownRefresh() {
			uni.showLoading();
			await this.getUser();
			uni.hideLoading();
		},
		methods: {
			async getUser() {
				await this.updateUserInfo();
			},
			// 生成文件名
			generateCloudName(fileName) {
				let timestamp = Date.now();  // 获取当前时间戳
				let prefix = fileName.substring(fileName.lastIndexOf('.') + 1);	// 文件后缀名
				let cloudName = this.userInfo._id + '_' + timestamp + '.' + prefix;
				return cloudName;
			},
			// 选择头像
			async chooseAvatar(e) {
				// #ifndef MP-WEIXIN
				let img = await this.chooseImg(1)
				// #endif
				// #ifdef MP-WEIXIN
				let img = e.detail.avatarUrl
				// #endif
				console.log(img);
				if (img) {
					try {
						uni.showLoading({
							title: '更换中',
							mask: true
						})
						let cloudPath = `/avatar/${this.generateCloudName(img)}`
						let avatar = ''
						let avatar_file = {
							extname: img.split('.')[img.split('.').length - 1],
							name: cloudPath,
							url: ''
						}
						let upload_res = await uniCloud.uploadFile({
							filePath: img,
							cloudPath,
							fileType: 'image'
						});
						avatar = upload_res.fileID
						avatar_file.url = avatar
						console.log(avatar);
						await this.updateUserInfo({
							avatar,
							avatar_file
						});
						uni.hideLoading()
						uni.showToast({
							title: '更换成功'
						})
					} catch (e) {
						uni.hideLoading()
						uni.showToast({
							title: '更换失败',
							icon: 'error'
						})
					}
				}
			},
			// 选择背景图
			async chooseBackgroundImg() {
				let img = await this.chooseImg(1)
				if (img) {
					try {
						uni.showLoading({
							title: '更换中',
							mask: true
						})
						let backgroundImg = ''
						let upload_res = await uniCloud.uploadFile({
							filePath: img,
							cloudPath: `/backImg/${this.generateCloudName(img)}`,
							fileType: 'image'
						});
						backgroundImg = upload_res.fileID
						console.log(backgroundImg);
						await this.updateUserInfo({
							backgroundImg
						});
						uni.showToast({
							title: '更换成功'
						})
					} catch (e) {
						uni.showToast({
							title: '更换失败',
							icon: 'error'
						})
					}
				}
			},
			// 选择头像，推荐使用图片裁剪能力
			chooseImg(count, maxSize = 5) {
				return new Promise((resole, reject) => {
					// #ifndef MP-WEIXIN
					uni.chooseImage({
						count,
						sizeType: ['compressed'],
						success: (res) => {
							if (res.tempFilePaths.length <= 0) {
								return resole(null)
							}

							const tempFiles = res.tempFiles
							const maxSizeBytes = maxSize * 1024 * 1024 // 5MB的字节数
							const filePath = tempFiles[0].path
							const fileSize = tempFiles[0].size

							if (fileSize > maxSizeBytes) {
								// 图片大小超过5MB，进行相应的处理
								uni.showToast({
									title: '图片大小不能超过5MB',
									duration: 2000
								});
							} else {
								// 图片大小符合要求，可以进行其他操作
								return resole(filePath)
							}

						},
						fail: (err) => {
							return reject(null)
						}
					});
					// #endif
					// #ifdef MP-WEIXIN
					uni.chooseMedia({
						count,
						mediaType: ['image'],
						sizeType: ['compressed'],
						success: (res) => {
							if (res.tempFiles.length <= 0) {
								return resole(null)
							}

							const tempFiles = res.tempFiles
							const maxSizeBytes = maxSize * 1024 * 1024 // 5MB的字节数
							const filePath = tempFiles[0].tempFilePath
							const fileSize = tempFiles[0].size

							if (fileSize > maxSizeBytes) {
								// 图片大小超过5MB，进行相应的处理
								uni.showToast({
									title: '图片大小不能超过5MB',
									duration: 2000
								});
							} else {
								// 图片大小符合要求，可以进行其他操作
								return resole(filePath)
							}
						},
						fail: (err) => {
							return reject(err)
						}
					});
					// #endif
				})
			},
			goto(url) {
				uni.navigateTo({
					url
				})
			}
		}
	}
</script>

<style scoped lang="scss">
	.top-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 50rpx 0;

		.btn-box {
			margin: 0;
			padding: 0;
			background-color: transparent;
		}

		.btn-box::after {
			border: none;
		}

		.avatar-box {
			position: relative;

			.avatar {
				background-color: #eee;
				height: 180rpx;
				width: 180rpx;
				border-radius: 50%;
			}

			.select-icon {
				position: absolute;
				right: 0;
				bottom: 0;
				height: 60rpx;
				width: 60rpx;
			}
		}
	}

	.list-container {

		.item-box {
			box-sizing: border-box;
			padding: 30rpx;
			width: 100%;
			display: inline-flex;
			justify-content: space-between;
			border-bottom: 2rpx #dcdcdc solid;
			font-size: 30rpx;
			line-height: 1;

			.left-box {
				width: 160rpx;
				flex-shrink: 0;
				display: flex;
				align-items: center;
			}

			.right-box {
				display: inline-flex;
				align-items: center;

				.img {
					flex-shrink: 0;
					height: 100rpx;
					width: 100rpx;
				}

				.text {}

				.icon {
					flex-shrink: 0;
					margin-left: 20rpx;
					height: 30rpx;
					width: 30rpx;
				}
			}
		}
	}
</style>