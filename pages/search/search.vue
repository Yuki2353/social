<template>
	<view class="search-detail">
		<!-- 输入部分 -->
		<view class="search-area dflex-b padding-lr">
			<view class="search-input-area flex1 dflex border-radius-lg">
				<view class="search-icon iconfont iconsousuo-01 padding-lr-sm"></view>
				<input type="text" placeholder="请输入关键词" v-model="keyword" class="search-input h-full flex1" />
			</view>
			<view class="search-btn bg-base padding-tb-xs padding-lr margin-left border-radius-big" @click.stop="submit_search">
				搜索
			</view>
		</view>
		<!-- 间隔 -->
		<view class="gap"></view>
		<!-- 历史记录 -->
		<view class="history-area padding-lr padding-top-lg" v-if="history_search && history_search.length > 0">
			<!-- 标题 -->
			<view class="history-title padding-bottom-sm dflex-b">
				<view>历史搜索</view>
				<view class="iconfont iconfont iconlajitong-01 dflex-c ft-dark padding-sm" @click.stop="clear_history"></view>
			</view>
			<!-- 搜索记录 -->
			<view class="history-record-list dflex dflex-wrap-w">
				<view v-for="(item, index) in history_search" :key="index" class="history-item bg-drak padding-lr padding-tb-xs border-radius-lg margin-right-sm margin-bottom-sm">
					{{ item }}
				</view>
			</view>
		</view>
		<!-- 热门搜索 -->
		<view class="history-area padding-lr padding-top-lg">
			<!-- 标题 -->
			<view class="history-title padding-bottom-sm">
				<view>热门搜索</view>
			</view>
			<!-- 搜索记录 -->
			<view class="history-record-list dflex dflex-wrap-w">
				<view v-for="item in 10" class="history-item bg-drak padding-lr padding-tb-xs border-radius-lg margin-right-sm margin-bottom-sm">
					原神
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				keyword: "",
				history_search: []
			};
		},
		onLoad() {
			// 历史记录
			this.history_search = uni.getStorageSync("history_search") || [];
			// 热门搜索
			
		},
		methods: {
			// 输入搜索
			submit_search() {
				let keyword = this.keyword;
				if (!keyword) {
					return;
				}
				this.add_history(this.keyword);
				uni.navigateTo({
					url: `/pages/list/list?method=search&&keyword=${keyword}`
				});
			},
			// 历史记录
			set_history(data) {
				this.history_search = data;
				uni.setStorageSync("history_search", data);
			},
			add_history(text) {
				let new_search_data = this.history_search;
				new_search_data = new_search_data.filter(item => item !== text);
				new_search_data.unshift(text);
				this.set_history(new_search_data);
			},
			clear_history() {
				this.$api.alert("是否清空历史记录", this.set_history([]));
			},
			// 热门搜索
			
		}
	}
</script>

<style scoped lang="scss">
.search-area {
	height: 120rpx;
	
	.search-input-area {
		height: 65rpx;
		background-color: #f5f5f5;
	}
}
.gap {
	display: block;
	width: 100%;
	height: 20rpx;
	background-color: #f5f5f5;;
}

</style>