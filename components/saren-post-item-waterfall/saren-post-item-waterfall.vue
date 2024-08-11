<template>
	<!-- 商品卡片 -->
	<view class="goods-card margin-bottom-xs border-radius bg-main padding-tb-xs padding-lr-sm" @click="detailPost">
		<!-- 图片 -->
		<view class="imgContainer border-radius-xs" 
			v-if="postInfo.imgList && postInfo.imgList.length > 0"
		>
			<image :src="postInfo.imgList[0]" mode="aspectFill" class="goods-img w-full border-radius-xs animated-all"></image>
		</view>
		<!-- 标题 -->
		<view class="goods-title padding-lr-sm margin-top-sm clamp-3">
			{{postInfo.title}}
		</view>
		<!-- 用户信息 -->
		<view class="goods-info dflex-b margin-top-sm">
			<view class="user-info dflex flex1">
				<image class="user-avartar border-radius-c headimg flex0" :src="postInfo.avatar"></image>
				<view class="user-nickname ft-dark margin-left-xs fs-xxs clamp-short flex1">
					{{postInfo.nickname}}
				</view>
			</view>
			<view class="like-info dflex flex0">
				<view :class="{
					iconfont: true,
					iconaixin: !postInfo.isLiked,
					'iconaixin-01': postInfo.isLiked,
					'ft-base': postInfo.isLiked
				}"  @click.stop="likePost"></view>
				<view class="like-count clamp ft-dark fs-xxs margin-left-xs">
					{{this.$api.formatCount(postInfo.likeCount)}}
				</view>
			</view>
		</view>
	</view>
</template>

<script>

	export default {
		name:"saren-goods-card",
		data() {
			return {
				
			};
		},
		props: {
			postInfo: {
				type: Object,
				required: true
			}
		},
		methods: {
			likePost() {
				this.$emit("likePost", this.postInfo._id);
			},
			sharePost() {
				this.$emit("sharePost", this.postInfo._id);
			},
			removePost() {
				this.$emit("removePost", this.postInfo._id);
			},
			detailPost() {
				this.$emit("detailPost", this.postInfo._id);
			}
		}
	}
</script>

<style scoped lang="scss">
.goods-card {
	.imgContainer {
		max-height: 450rpx;
		overflow: hidden;
		
		.goods-img {
			
		}
	}
	// box-shadow: 1px 1px 10px;
	.goods-info {
		.user-info {
			.user-avartar {
				width: 30rpx;
				height: 30rpx;
			}
		}
	}
}
</style>