<template>
	<view class="container">
		<view class="introduction-box">
			<textarea v-model="introduction" placeholder="请输入简介" maxlength="100" />
		</view>
		<button class="save-btn" type="primary" @click="saveUpdate">保存</button>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				introduction: ''
			};
		},
		async onLoad(option) {
			if (!this.hasLogin) {
				this.toLogin(true);
			}
			this.introduction = this.userInfo.introduction;
		},
		methods: {
			// 保存更改
			async saveUpdate() {
				uni.showLoading({
					title: '保存中',
					mask: true
				})
				try {
					await this.updateUserInfo({
									introduction: this.introduction
								});
					// uni.navigateBack()
					uni.hideLoading()
					this.$api.navigateBack(true);
				} catch (err) {
					console.log(err);
					uni.hideLoading()
					uni.showToast({
						title: '保存失败',
						icon: 'error'
					})
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	.container {
		height: 100vh;
		padding: 20rpx;
		background-color: #eee;
	}

	.introduction-box {
		padding: 20rpx 30rpx;
		background-color: #fff;
		border-radius: 20rpx;
	}

	.save-btn {
		margin-top: 50rpx;
	}
</style>