<template>
	<view>
		<view :style="{height: emptyHeight+'px'}" class="emptyPlace"></view>
		<view class="reply-container fixed-bottom padding-lr-sm padding-tb dflex-b">
			<view class="reply-input padding-lr-sm padding-tb-sm bg-drak border-radius-lg flex1">
				<textarea v-model="content" class="w-full textarea" 
					:placeholder="placeholder" :disabled="disabled"
					maxlength="-1" auto-height="true" 
					:focus="focus" @focus="focusComment" @blur="blurComment" @linechange="changeHeight" @click="clickComment"></textarea>
			</view>
			<view class="send-btn border-radius-lg bg-base margin-left-sm padding-lr padding-tb-xs" 
				v-if="content.length" @click.stop="addComment">
				发送
			</view>
			<view class="cancel-btn border-radius-lg margin-left-xs padding-lr padding-tb-xs"
				v-if="focus" @click.stop="cancelComment">
				取消
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name:"saren-reply",
		data() {
			return {
				content: "",
				focus: false,
				emptyHeight: 0
			};
		},
		props: {
			placeholder: {
				type: String,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			changeHeight(e) {
				this.emptyHeight = e.detail.height;
			},
			getContent() {
				return this.content;
			},
			clearContent() {
				this.content = "";
			},
			focusComment() {
				// console.log("获取焦点");
				this.focus = true;
			},
			blurComment() {
				// console.log("失去焦点");
				this.focus = false;
				this.$emit("blurCommentDeal");
			},
			clickComment() {
				this.$emit("clickComment");
			},
			addComment() {
				this.$emit("addComment");
			},
			cancelComment() {
				this.$emit("cancelComment");
			}
		}
	}
</script>

<style lang="scss" scoped>
.reply-container {
	width: 100%;
	// height: 120rpx;
}
.textarea {
	font-size: 30rpx;
	line-height: 30rpx;
	max-height: 300rpx;
}
.emptyPlace {
	margin-top: 70rpx;
}
.cancel-btn {
	background-color: lightgray;
	color: white;
}
</style>