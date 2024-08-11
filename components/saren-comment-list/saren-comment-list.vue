<template>
	<view>
		<!-- 一级 + 二级 -->
		<view v-for="(item,index) in commentList" :key="item._id">
			<!-- 一级 -->
			<saren-comment-item 
				:ref="'_'+item._id"
				:commentInfo="item"
				 @selectComment="selectComment" @removeComment="removeComment"></saren-comment-item>
			<!-- 二级 -->
			<view class="margin-left-xl">
				<view v-for="(childInfo,childIndex) in item.childCommentList" :key="childInfo._id">
					<saren-comment-item 
						:ref="'_'+childInfo._id"
						:commentInfo="childInfo"
						 @selectComment="selectComment" @removeComment="removeComment"></saren-comment-item>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-comment-child-list",
		data() {
			return {
				
			};
		},
		props: {
			commentList: {
				type: Array,
				required: true
			}
		},
		methods: {
			selectComment(params) {
				this.$emit("selectComment", params);
			},
			removeComment(params) {
				this.$emit("removeComment", params);
			},
			getCommentTop(comment_id) {
				return this.$refs[`_${comment_id}`][0].getCommentTop();
			}
		}
	}
</script>

<style>

</style>