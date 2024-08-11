<template>
	<view>
		<block v-for="(item) in infoList">
			<saren-title-input v-if="item.type !== 'address' && item.type !== 'image'"
				:type="item.type" :title="item.title" :showTitle="item.showTitle"
				:min="item.min"
				:placeholderText="item.placeholderText" :ref="item.filedName"
			></saren-title-input>
			<saren-img-picker v-else :title="item.title" :ref="item.filedName"
				:min="item.min" :max="item.max"
			></saren-img-picker>
		</block>
		<view class="submitBtn margin-lr-xl margin-tb-xs padding-tb-sm tac bg-base border-radius-lg" @click.stop="submitPost">
			发布
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				infoList: [
					{
						type: "text",
						title: "标题",
						showTitle: false,
						placeholderText: "请输入标题",
						min: 5,
						filedName: "title"
					},
					{
						type: "textarea",
						title: "描述",
						showTitle: false,
						placeholderText: "请输入描述",
						min: 10,
						filedName: "content"
					},
					{
						type: "image",
						title: "图片",
						showTitle: false,
						min: 1,
						max: 9,
						filedName: "imgList"
					}
				],
			}
		},
		methods: {
			async submitPost() {
				uni.showLoading({
					mask: true
				})
				let infoList = this.infoList;
				let dataObj = {};
				// 遍历整个infoList，查看其结果是否成功
				for (let i = 0; i < infoList.length; i++) {
					let {filedName} = infoList[i];
					let res = this.$refs[filedName][0].getInfo();
					// 有一失败则提示错误并返回
					if (res.success === false) {
						uni.showToast({
							icon: "none",
							title: res.errMsg,
							duration: 3000
						});
						return;
					}
					// 成功则记录
					else {
						// 图片需要等待promise
						let data = res.data;
						if (data instanceof Promise) {
							data = await data;
						}
						dataObj[filedName] = data;
					}
				}
				// 全部成功后，上传表单
				console.log("上传数据", dataObj);
				this.loginCloudFunction({
					name: "saren-post",
					data: {
						method: "add",
						...dataObj
					}
				})
				.then((res) => {
					uni.hideLoading();
					this.$api.showToast("发布成功");
					console.log(res);
					this.$api.navigateBack(true);
				})
				.catch((err) => {
					uni.hideLoading();
					this.$api.showToast("发布失败");
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
.submitBtn {
	
}
</style>
