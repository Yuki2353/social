<template>
	<view class="page">
		<view class="padding-lr-sm dflex-b padding-bottom">
			<view class="dflex-c">
				<image class="avatarSize border-radius-c headimg flex0" :src="userInfo.avatar" mode="aspectFill"></image>
				<text class="margin-left-sm fs-lg flex1 clamp">{{userInfo.nickname}}</text>
			</view>
			<view class="bg-base border-radius-big padding-lr padding-tb-5 dflex-c flex0" @click.stop="toHomePage">
				<view class="iconfont fs-xl iconqiandao margin-right-xs"></view>
				<view>主页</view>
			</view>
		</view>
		<view class="border-radius margin-lr-sm dflex bg-main margin-bottom-sm">
			<view class="flex1 padding-tb dflex-c dflex-flow-c">
				<view class="margin-bottom-xs fs-30">
					0
				</view>
				<view class="ft-dark">
					已发布
				</view>
			</view>
			<view class="flex1 padding-tb dflex-c dflex-flow-c">
				<view class="margin-bottom-xs">
					0
				</view>
				<view class="ft-dark">
					已发布
				</view>
			</view>
		</view>
		<view class="border-radius margin-lr-sm bg-main">
			<view class="padding-lr dflex-b" @click="toListPage('myLook', '我的足迹')">
				<view class="dflex padding-tb-16">
					<view class="iconfont margin-right-sm iconzuji fs-xl" style="color: #ffab6c;"></view>
					<view class="fwb fs-30">我的足迹</view>
				</view>
				<view class="iconfont fs-sm iconjiantou-01"></view>
			</view>
			<view class="padding-lr dflex-b" @click="toListPage('myShare', '我的分享')">
				<view class="dflex padding-tb-16">
					<view class="iconfont margin-right-sm iconshoucang- fs-xl" style="color:#ff6a6c;"></view>
					<view class="fwb fs-30">我的分享</view>
				</view>
				<view class="iconfont fs-sm iconjiantou-01"></view>
			</view>
			<view class="padding-lr dflex-b" @click="toListPage('myLike', '我赞过的')">
				<view class="dflex padding-tb-16">
					<view class="iconfont margin-right-sm iconshangpin-01 fs-xl" style="color: #ffab6c;;"></view>
					<view class="fwb fs-30">我赞过的</view>
				</view>
				<view class="iconfont fs-sm iconjiantou-01"></view>
			</view>
		</view>
	</view>
</template>

<script>
	
	export default {
		data() {
			return {
				
			}
		},
		onLoad() {
			if (!this.hasLogin) {
				this.toLogin(true);	
			}
		},
		methods: {
			toListPage(method, title) {
				this.navigateLogin(`/pages/list/list?method=${method}&navigationBarTitle=${title}`);
			},
			toHomePage() {
				uni.navigateLogin({
					url: `/pages/homepage/homepage?user_id=${this.userInfo._id}`
				});
			},
		}
	}
</script>

<style scoped lang="scss">
.page {
	min-height: 100vh;
	background: #f5f5f5;
}
.avatarSize {
	width: 130rpx;
	height: 130rpx;
}
</style>
