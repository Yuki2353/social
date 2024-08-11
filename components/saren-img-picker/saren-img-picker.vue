<template>
	<view class="dflex-wrap padding">
		<!--已选择图片-->
		<view class="imgItem" v-for="(item) in imgList" :key="index">
			<image class="full-img" :src="item.path" mode='aspectFit'></image>
			<view class="delete right-top" @click.stop="deleteImage" :data-index="index">
				<image class="full-img" src="@/static/svg/sc.svg"></image>
			</view>
			<!-- <view class="bottom progress" v-show="item.progress !== 0">
				<progress
					:percent="item.progress" :stroke-width="5" activeColor="#10AEFF"></progress>
			</view> -->
		</view>
		<!--选择新图片-->
		<view class="imgItem bc-dark dflex-c dflex-flow-c" v-if="imgList.length < max" @click='chooseImage'>
			<image class="picker-img" src="@/static/svg/add.svg" ></image>
			<view class="msg">最多{{max}}张</view>
		</view>
	</view>
</template>

<script>
	export default {
		name:"imgPicker",
		data() {
			return {
				imgList: [],
			};
		},
		props: {
			"min": {
				type: Number,
				default: 0
			},
			"max": {
				type: Number,
				default: 9
			},
			"dirname": {
				type: String,
				default: "media"
			},
			"title": {
				type: String,
				default: ""
			}
		},
		methods: {
			// 删除图片
			deleteImage(e) {
				const index = e.currentTarget.dataset.index;
				this.imgList.splice(index, 1);
			},
			// 选择图片
			chooseImage() {
				uni.chooseImage({
					count: this.max - this.imgList.length, // 最多选择 - 当前已有
					sizeType: ['compressed'], //可以指定是原图还是压缩图，默认二者都有
					sourceType: ['album'], //从相册选择
					success: (res) => {
						let tempFiles = res.tempFiles;
						tempFiles.forEach((item) => {
							item.progress = 0;
						});
						this.imgList = this.imgList.concat(tempFiles);
					}
				});
			},
			// 上传一张图片
			uploadOneImage(filePath, index) {
				return new Promise((resolve, reject) => {
					if (filePath.indexOf("http://tmp") === -1) {
						resolve(filePath);
					}
					uniCloud.uploadFile({
						filePath: filePath,
						cloudPath: `/${this.dirname}/${this.generateCloudName(filePath)}`,
						cloudPathAsRealPath: true,
						onUploadProgress: (progressEvent) => {
						  let percentCompleted = Math.round(
							(progressEvent.loaded * 100) / progressEvent.total
						  );
						  this.imgList[index].progress = percentCompleted;
						},
						success: (res) => {
							let {fileID, filePath} = res;
							this.imgList[index].fileID = fileID;
							this.imgList[index].filePath = filePath;
							resolve(fileID);
						},
						fail: (err) => {
							reject(err);
						}
					  });
				});
			},
			// 上传全部图片
			getInfo() {
				let result = this.getMinMax(this.imgList.length, this.min, this.max, "张图片");
				if (result.success === false) {
					return result;
				}
				let promiseList = [];
				let imgList = this.imgList;
				imgList.forEach((item, index) => {
					promiseList.push(this.uploadOneImage(item.path, index));
				});
				result.data = Promise.all(promiseList);
				return result;
			},
			// 获取8位随机数字
			generateRandomNumber(length) {
				let result = '';
				let characters = '0123456789';
				let charactersLength = characters.length;
			
				for (let i = 0; i < length; i++) {
					result += characters.charAt(Math.floor(Math.random() * charactersLength));
				}
			
				return result;
			},
			// 获取8位随机字母
			generateRandomLetters(length) {
				let result = '';
				let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
				let charactersLength = characters.length;
			
				for (let i = 0; i < length; i++) {
					result += characters.charAt(Math.floor(Math.random() * charactersLength));
				}
			
				return result;
			},
			// 生成文件名
			generateCloudName(fileName) {
				let timestamp = Date.now();  // 获取当前时间戳
				let randomNum = this.generateRandomNumber(8);  // 生成一个8位随机数
				let randomLetters = this.generateRandomLetters(8);  // 生成一个8位随机字母
				let prefix = fileName.substring(fileName.lastIndexOf('.') + 1);	// 文件后缀名
				let cloudName = randomNum + randomLetters + '_' + timestamp + '.' + prefix;
				return cloudName;
			},
			// 获取 min~max 类型数据
			getMinMax(compare, min, max, postfix) {
				let res = {
					success: true,
				};
				if (min === null && max === null) {
					
				}
				else if (min === null && max !== null) {
					if (compare > max) {
						res.success = false;
						res.errMsg = `${this.title}最多选择${max}${postfix}`;
					}
				}
				else if (min !== null && max === null) {
					if (compare < min) {
						res.success = false;
						res.errMsg = `${this.title}最少选择${min}${postfix}`;
					}
				}
				else {
					if (compare < min || compare > max) {
						res.success = false;
						res.errMsg = `${this.title}选择${min}~${max}${postfix}`;
					}
				}
				return res;
			},
		}
	}
</script>

<style lang="scss" scoped>
/*上传图片*/
.dflex-wrap {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
}
.full-img {
	width: 100%;
	height: 100%;
	border-radius: 10rpx;
}
.picker-img {
	width: 50rpx;
	height: 50rpx;
}
.right-top {
	position: absolute;
	right: 0;
	top: 0;
}
.bottom {
	position: absolute;
	bottom: 0rpx;
}
.bc-dark {
	background-color: gainsboro;
}
</style>

<style lang="scss" scoped>
.imgItem {
	position: relative;
	width: 148rpx;
	height: 148rpx;
	margin-right: 16rpx;
	margin-bottom: 15rpx;
	border-radius: 10rpx;
	
	.delete {
		width: 30rpx;
		height: 30rpx;
	}
	
	.msg {
		font-size: 24rpx;
		color: #a8a8a8;
	}
	
	.progress {
		width: 100%;
		height: 5px;
		overflow: hidden;
	}
}

</style>