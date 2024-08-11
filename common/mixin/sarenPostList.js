import MescrollMixin from "@/uni_modules/mescroll-uni/components/mescroll-uni/mescroll-mixins.js";

export default {
	mixins: [MescrollMixin],
	data() {
		return {
			// 数据配置
			dataOption: {
				method: "time"
			},
			// 下拉刷新配置
			downOption: { 
				
			},
			// 上拉加载的配置
			upOption: {
				page: {
					size: 10
				},
				noMoreSize: 5,
				empty: {
					tip: '暂无相关数据'
				},
				toTop: {
					right: '24rpx',
					bottom: '160rpx',
					safearea: true,
					width: '80rpx',
					radius: '50%',
				},
				textNoMore: "没有更多数据"
			},
			// 帖子列表数据
			dataList: []
		}
	},
	methods: {
		// 加载数据
		...{
			// 加载更多数据
			upCallback(page) {
				if(page.num == 1){
					if (this.initData && typeof this.initData === 'function') {
						this.initData();
					}
				}
				const pageNum = page.num; // 页码, 默认从1开始
				const pageSize = page.size; // 页长, 默认每页10条
				const sumLength = (pageNum - 1) * pageSize;
				uniCloud.callFunction({
					name: "saren-post",
					data: {
						...this.dataOption,
						skip: sumLength
					}
				})
				.then((res) => {
					const curPageData = res.result.data;
					const curPageLen = curPageData.length; 
					// 设置列表数据
					if(page.num == 1) this.dataList = []; //如果是第一页需手动置空列表
					this.dataList = this.dataList.concat(curPageData); //追加新数据
					// 设置数据提示
					this.mescroll.endSuccess(curPageLen);
				})
				.catch((err) => {
					this.mescroll.endErr();
				});
			},
			// 刷新数据
			reloadList(){
				this.mescroll.resetUpScroll();
			},
			// 下拉刷新
			onPullDownRefresh() {
				reloadList();
			},
		},
		
		// 更新帖子内容
		...{
			// 获取对象
			getInfo(post_id) {
				return this.dataList.find((item) => item._id === post_id);
			},
			// 删除数据
			removeInfo(post_id) {
				let dataList = this.dataList;
				dataList = dataList.filter((item) => item._id !== post_id);
				this.dataList = dataList;
			},
			// 更新数据
			updateInfo(params) {
				const { infoItem, data, callback } = params;
				if (infoItem) {
					for (let key in data) {
						infoItem[key] = data[key];
					}
					if (callback && typeof callback === 'function') {
						callback();
					}
				}
			},
		},
		
		// 对帖子的相关操作
		...{
			// 观看帖子
			lookPost(post_id) {
				const postInfo = this.getInfo(post_id);
				uniCloud.callFunction({
					name: "saren-post-look",
					data: {
						method: "add",
						post_id
					}
				})
				.then((res) => {
					const { changeCount } = res.result.data;
					const newLookCount = postInfo.lookCount + changeCount;
					this.updateInfo({
						infoItem: postInfo,
						data: {
							lookCount: newLookCount
						}
					})
				});
			},
			// 点赞帖子
			likePost(post_id) {
				// 先查看是否已经登录
				if (!this.hasLogin) {
					this.toLogin();
					return;
				}
				const postInfo = this.getInfo(post_id);
				// 节流
				if (postInfo.likeUpdating === undefined) {
					postInfo.likeUpdating = false;
				}
				if (postInfo.likeUpdating) {
					return;
				}
				// 查看对应 isLiked 调用不同接口
				const method = postInfo.isLiked? "removeLike": "addLike";
				// 标记节流
				postInfo.likeUpdating = true;
				// 发起点赞的云函数
				this.loginCloudFunction({
					name: "saren-post-like",
					data: {
						method: method,
						post_id
					}
				})
				.then((res) => {
					// 失败的情况
					if (res.result.errCode) {
						this.$api.showToast(res.result.errMsg);
						postInfo.likeUpdating = false;
						return;
					}
					// 更新帖子内容
					const { changeCount, isLiked, like_id } = res.result.data;
					const newLikeCount = postInfo.likeCount + changeCount;
					this.updateInfo({
						infoItem: postInfo,
						data: {
							likeCount: newLikeCount,
							isLiked,
							like_id
						}
					});
					// 增加消息
					if (method === "addLike") {	// this.userInfo._id !== postInfo.user_id
						this.loginCloudFunction({
							name: "saren-post-message",
							data: {
								method: "addLike",
								replied_id: postInfo.user_id,
								like_id: like_id,
								post_id: postInfo._id
							}
						});
					}
					postInfo.likeUpdating = false;
				})
				.catch((err) => {
					postInfo.likeUpdating = false;
				});
				// 如果为删除消息
				if (method === "removeLike") {
					this.loginCloudFunction({
						name: "saren-post-message",
						data: {
							method: "removeLike",
							like_id: postInfo.like_id,
						}
					});
				}
			},
			// 分享帖子
			sharePost(post_id) {
				// 增加计数并增加记录
				const postInfo = this.getInfo(post_id);
				uniCloud.callFunction({
					name: "saren-post-share",
					data: {
						method: "add",
						post_id
					}
				})
				.then((res) => {
					const { changeCount } = res.result.data;
					const newLookCount = postInfo.shareCount + changeCount;
					this.updateInfo({
						infoItem: postInfo,
						data: {
							shareCount: newLookCount
						}
					})
				});
			},
			// 删除帖子
			removePost(post_id) {
				// 确认提示
				this.$api.confirm("是否确认删除", () => {
					// 发起删除请求
					this.loginCloudFunction({
						name: "saren-post",
						data: {
							method: "remove",
							post_id: post_id
						}
					})
					.then((res) => {
						// 删除成功回调
						if (!res.result.data.errCode) {
							this.$api.showToast("删除成功");
							// this.$api.navigateBack(true);
							this.removeInfo(post_id);
						}
						// 删除失败回调
						else {
							this.$api.showToast("删除失败");
						}
					})
					.catch((err) => {
						this.$api.showToast("删除失败");
					})
				});
			},
			// 查看帖子详情
			detailPost(post_id) {
				uni.navigateTo({
					url: `/pages/detail/detail?post_id=${post_id}`
				});
			},
		},
		
	}
}
