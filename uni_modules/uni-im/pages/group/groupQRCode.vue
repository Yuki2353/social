<template>
	<view class="group-QRCode">
		<view class="qr-code">
			<view class="code-info">
				<text class="group-name">{{name}}</text>
				<text class="group-id" @click="copyGroupID">群号：{{group_id}}</text>
				<!--uqrcode 组件来源，插件Sansnn-uQRCode 链接地址：https://ext.dcloud.net.cn/plugin?id=1287 -->
				<!-- #ifndef MP-WEIXIN -->
				<!-- <uqrcode ref="uqrcode" :start="false" :size="200" canvas-id="qrcode" :value="qrcodeData"></uqrcode> -->
				<!-- #endif -->
			</view>
			<image class="group-avatar" :src="avatar_file || '/uni_modules/uni-im/static/avatarUrl.png'" mode="">
			</image>
		</view>

		<!-- <view class="btn-box">
			<view class="btn-item" @click="save">
				<uni-icons type="arrow-down" size="30"></uni-icons>
				<text class="btn-text">保存</text>
			</view>
			<view class="btn-item" @click="share">
				<uni-icons type="paperplane" size="30"></uni-icons>
				<text class="btn-text">分享</text>
			</view>
		</view> -->
	</view>
</template>

<script>
	import uqrcode from "@/uni_modules/Sansnn-uQRCode/components/uqrcode/uqrcode"
	export default {
		components: {
			uqrcode
		},
		data() {
			return {
				group_id: '',
				name: '',
				avatar_file: ''
			}
		},
		computed: {
			qrcodeData() {
				let data = {
					"type": "uni-im",
					"subType": "groupInfo",
					"data": {
						group_id: this.group_id,
						name: this.name,
						avatar_file: this.avatar_file
					}
				}
				return JSON.stringify(data)
			}
		},
		onLoad(options) {
			// console.log("options: ",options);
			this.group_id = options.id
			this.name = options.name
			this.avatar_file = options.avatar_file
		},
		onReady(){
			setTimeout(()=>{
				this.$refs.uqrcode.make({
					success: () => {
						// console.log('生成成功');
					},
					fail: err => {
						// console.log(err)
					}
				});
			},1000)
		},
		methods: {
			copyGroupID() {
				uni.setClipboardData({
					data: this.group_id,
					success: function() {
						console.log('success');
					}
				});
			},
			save() {
				console.log('保存');
			},
			share() {
				console.log('分享');
			}
		}
	}
</script>

<style lang="scss">
@import "@/uni_modules/uni-im/common/baseStyle.scss";
.group-QRCode {
  height: 100vh;
  padding-top: 200rpx;
  // justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  .qr-code {
    width: 550rpx;
    height: 780rpx;
    align-items: center;
    justify-content: center;
    border-radius: 20rpx;
    background-color: #fff;
    position: relative;
  }
  
  .code-info {
    align-items: center;
    justify-content: center;
  }
  
  .group-avatar {
    width: 150rpx;
    height: 150rpx;
    border-radius: 100rpx;
    position: absolute;
    top: -70rpx;
  }
  
  .group-name {
    width: 400rpx;
    font-size: 46rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 120rpx;
    text-align: center;
  }
  
  .group-id {
    margin: 40rpx 0;
    font-size: 30rpx;
  }
  
  .btn-box {
    flex-direction: row;
    margin-top: 100rpx;
  }
  
  .btn-item {
    align-items: center;
    justify-content: center;
    width: 130rpx;
    height: 130rpx;
    border-radius: 100rpx;
    background-color: #fff;
    margin: 0 80rpx;
    border: 1px solid #eee;
  }
  
  .btn-text {
    font-size: 28rpx;
  }
}
</style>
