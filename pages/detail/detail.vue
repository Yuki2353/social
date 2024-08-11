<template>
	<view>
		<!-- 内容 -->
		<mescroll-body @init="mescrollInit" @down="downCallback" @up="upCallback" :down="downOption" :up="upOption">
			<saren-post-detail 
				ref="detail" 
				:postInfo="postInfo" :commentList="dataList" :placeholder="commentPlaceholder"
				@likePost="likePost" @sharePost="sharePost"  @removePost="removePost"
				@selectComment="selectComment" @removeComment="removeComment"></saren-post-detail>
		</mescroll-body>
		<!-- 评论输入 -->
		<saren-comment-reply 
			ref="reply"
			:placeholder="commentPlaceholder" :disabled="replyDisabled"
			@addComment="addComment" @blurCommentDeal="blurCommentDeal" @clickComment="clickComment" @cancelComment="cancelComment"></saren-comment-reply>
	</view>
</template>

<script>
	import detailMixin from "@/common/mixin/sarenPostDetail.js"
	
	export default {
		mixins: [detailMixin],
		data() {
			return {
				
			}
		},
	}
</script>

<style>

</style>
