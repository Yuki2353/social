<template>
	<view>
		<mescroll-body @init="mescrollInit" @down="downCallback" @up="upCallback" :down="downOption" :up="upOption">
			<saren-user-info :thisUserInfo="thisUserInfo"></saren-user-info>
			<saren-gap></saren-gap>
			<saren-post-list 
				:dataList="dataList" 
				@likePost="likePost" @sharePost="sharePost"  @removePost="removePost" @detailPost="detailPost"
			>
			</saren-post-list>
		</mescroll-body>
	</view>
</template>

<script>
	import listMixin from "@/common/mixin/sarenPostList.js"
	
	export default {
		mixins: [listMixin],
		data() {
			return {
				dataOption: {
					method: "user_id",
					user_id: ""
				},
				thisUserInfo: {
					
				}
			}
		},
		onLoad(e) {
			this.dataOption.user_id = e.user_id;
		},
		methods: {
			initData() {
				if (this.dataOption.user_id === this.userInfo._id) {
					this.thisUserInfo = this.userInfo;
					return;
				}
				uniCloud.callFunction({
					name: "saren-post-user",
					data: {
						method: "get",
						user_id: this.dataOption.user_id
					}
				})
				.then((res) => {
					console.log(res.result.data);
					this.thisUserInfo = res.result.data;
				})
				.catch((err) => {
					this.$api.showToast("加载用户信息失败");
				});
			}
		}
	}
</script>

<style>

</style>
