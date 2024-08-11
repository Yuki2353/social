<template>
	<view class="post-detail">
		<!-- 帖子内容 -->
		<saren-post-item v-if="postInfo._id"
			:postInfo="postInfo" :detail="true"
			@likePost="likePost" @sharePost="sharePost" @removePost="removePost"
		></saren-post-item>
		<!-- 评论内容 -->
		<saren-comment-list 
			:commentList="commentList"
			ref="commentList"
			@selectComment="selectComment" @removeComment="removeComment" @clickComment="clickComment"></saren-comment-list>
	</view>
</template>

<script>
	export default {
		name:"saren-post-detail",
		data() {
			return {
				
			};
		},
		props: {
			postInfo: {
				type: Object,
				required: true
			},
			commentList: {
				type: Array,
				required: true
			},
			placeholder: {
				type: String,
				required: true
			}
		},
		methods: {
			likePost(params) {
				this.$emit("likePost", params);
			},
			sharePost(params) {
				this.$emit("sharePost", params);
			},
			removePost(params) {
				this.$emit("removePost", params);
			},
			selectComment(params) {
				this.$emit("selectComment", params);
			},
			removeComment(params) {
				this.$emit("removeComment", params);
			},
			clickComment() {
				this.$emit("clickComment");
			},
			getCommentTop(comment_id) {
				return this.$refs.commentList.getCommentTop(comment_id);
			}
		}
	}
</script>

<style scoped>
.post-detail {
	
}
</style>