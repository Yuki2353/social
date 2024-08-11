<template>
	<view>
		<mescroll-body @init="mescrollInit" @down="downCallback" @up="upCallback" :down="downOption" :up="upOption">
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
					
				},
			}
		},
		onLoad(e) {
			if (e.navigationBarTitle) {
				uni.setNavigationBarTitle({
					title: e.navigationBarTitle
				});	
				delete e.navigationBarTitle;
			}
			this.dataOption = {
				...e
			};
		},
		methods: {
			
		}
	}
</script>

<style>

</style>
