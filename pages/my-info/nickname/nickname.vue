<template>
	<view class="container">
		<view class="tips">
			{{ tips }}
		</view>
		<view class="nickname-box">
			<input v-model="nickname" type="nickname" placeholder="请输入昵称" maxlength="15" @change="nicknameChange" />
		</view>
		<button class="save-btn" type="primary" @click="saveUpdate">保存</button>
	</view>
</template>

<script>
	/**
	 * 建议昵称不重复
	 */
	export default {
		data() {
			return {
				user: null,
				nickname: '',
				tips: '请输入1-10长度的昵称'
			};
		},
		async onLoad(option) {
			if (!this.hasLogin) {
				this.toLogin(true);
			}
			this.nickname = this.userInfo.nickname;
		},
		methods: {
			// 保存更改
			async saveUpdate() {
				this.nickname = this.nickname.replace(/\s/g, '')
				if (!this.isValidNickname(this.nickname)) return
				uni.showLoading({
					title: '保存中',
					mask: true
				})
				try {
					await this.updateUserInfo({
									nickname: this.nickname
								});
					// uni.navigateBack()
					uni.hideLoading()
					this.$api.navigateBack(true);
				} catch (err) {
					console.log(err);
					uni.hideLoading()
					uni.showToast({
						title: '昵称已被占用',
						icon: 'none'
					})
				}
			},
			isValidNickname(nickname) {
				// 昵称长度限制
				if (nickname.length < 1 || nickname.length > 10) {
					uni.showToast({
						title: this.tips,
						icon: 'none'
					})
					return false;
				}

				// 允许的字符：字母、数字、下划线和短划线
				// const validCharacters = /^[a-zA-Z0-9_-]+$/;
				// return validCharacters.test(nickname);

				return true
			},
			// 昵称填写能力回调
			nicknameChange(e) {
				this.nickname = e.detail.value
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

	.tips {
		margin-bottom: 20rpx;
		padding-left: 20rpx;
		color: #8a8a8a;
	}

	.nickname-box {
		padding: 20rpx 30rpx;
		background-color: #fff;
		border-radius: 20rpx;
	}

	.save-btn {
		margin-top: 50rpx;
	}
</style>