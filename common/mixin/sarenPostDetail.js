import MescrollMixin from "@/uni_modules/mescroll-uni/components/mescroll-uni/mescroll-mixins.js";
		
export default {
	mixins: [MescrollMixin],
	data() {
		return {
			// 数据的配置
			dataOption: {
				method: "post_id",
				post_id: ""
			},
			// 下拉刷新的配置
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
					bottom: '240rpx',
					safearea: true,
					width: '80rpx',
					radius: '50%',
				},
				textNoMore: "没有更多数据"
			},
			// 帖子内容
			postInfo: {},
			// 评论数据
			dataList: [],
			// 选中评论相关信息
			commentActiveInfo: {},
			// 当前页面已经划过的高度
			pageTop: 0
		}
	},
	// 获取进入时参数
	onLoad(e) {
		console.log(e);
		this.dataOption.post_id = e.post_id;
	},
	// 记录页面划过高度
	onPageScroll(e) {
		this.pageTop = e.scrollTop;
	},
	computed: {
		// 评论输入框的placeholder
		commentPlaceholder() {
			if (this.postInfo.status === 3) {
				return "已删除的内容无法评论"
			}
			const commentActiveInfo = this.commentActiveInfo;
			if (!commentActiveInfo._id) {
				return "善语结善缘，恶语伤人心"
			}
			else {
				return `回复 ${commentActiveInfo.nickname}`
			}
		},
		// 添加评论的相关信息
		commentAddInfo() {
			const commentActiveInfo = this.commentActiveInfo;
			const post_id = this.dataOption.post_id;
			if (!commentActiveInfo._id) {
				return {
					type: 1,
					post_id: post_id,
					father_id: null,
					replied_id: null,
					replied_user_id: this.postInfo.user_id
				};
			}
			else {
				if (commentActiveInfo.type === 1) {
					return {
						type: 2,
						post_id: post_id,
						father_id: commentActiveInfo._id,
						replied_id: commentActiveInfo._id,
						repliedNickname: commentActiveInfo.nickname,
						repliedAvatar: commentActiveInfo.avatar,
						replied_user_id: commentActiveInfo.user_id
					}
				}
				else {
					const fatherInfo = this.dataList.find((item) => item._id == commentActiveInfo.father_id);
					return {
						type: 2,
						post_id: post_id,
						father_id: commentActiveInfo.father_id,
						replied_id: commentActiveInfo._id,
						repliedNickname: fatherInfo.nickname,
						repliedAvatar: fatherInfo.avatar,
						replied_user_id: commentActiveInfo.user_id
					}
				}
			}
		},
		replyDisabled() {
			return this.postInfo.status === 3 || !this.hasLogin;
		},
	},
	methods: {
		// 加载数据
		...{
			// 加载更多数据
			upCallback(page) {
				const post_id = this.dataOption.post_id;
				if(page.num == 1){
					uniCloud.callFunction({
						name:"saren-post",
						data: {
							method: "_id",
							post_id: post_id
						}
					})
					.then((res) => {
						console.log("帖子详情", res);
						this.postInfo = res.result.data[0];
						if (this.postInfo.status === 3) {
							this.$api.showToast("内容已删除！")
						}
						this.lookPost(post_id);
					});
				}
				const pageNum = page.num; // 页码, 默认从1开始
				const pageSize = page.size; // 页长, 默认每页10条
				const sumLength = (pageNum - 1) * pageSize;
				uniCloud.callFunction({
					name: "saren-post-comment",
					data: {
						//...this.dataOption,
						method: "post_id",
						post_id: post_id,
						skip: sumLength
					}
				})
				.then((res) => {
					console.log("评论列表", res);
					const curPageData = res.result.data;
					const curPageLen = curPageData.length; 
					// 设置列表数据
					if(page.num == 1) this.dataList = []; //如果是第一页需手动置空列表
					this.dataList = this.dataList.concat(curPageData); //追加新数据
					// 没有更多数据判断
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
		
		// 更新帖子信息
		...{
			// 获取对象
			getInfo() {
				return this.postInfo;
			},
			// 删除对象
			removeInfo() {
				
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
					uni.showLoading({
						mask: true
					});
					// 发起删除请求
					this.loginCloudFunction({
						name: "saren-post",
						data: {
							method: "remove",
							post_id: post_id
						}
					})
					.then((res) => {
						uni.hideLoading();
						// 删除成功回调
						if (!res.result.data.errCode) {
							this.$api.showToast("删除成功");
							this.$api.navigateBack(true);
						}
						// 删除失败回调
						else {
							this.$api.showToast("删除失败");
						}
					})
					.catch((err) => {
						uni.hideLoading();
						this.$api.showToast("删除失败");
					})
				});
			},
		},
		
		// 评论相关内容
		...{
			// 选中评论
			selectComment(commentInfo, from_father=false) {
				// 先进行鉴权
				if (!this.checkLogin()) {
					return ;
				}
				// console.log(commentInfo);
				// 节流
				if (this.commentActiveInfo._id && this.commentActiveInfo._id === commentInfo._id) {
					this.focusComment();
					return;
				}
				// 输入框失焦触发，清空、不再失去焦点（避免循环调用）、不滑动
				if (!commentInfo._id && !from_father) {
					this.clearCommentContent();
				}
				// 如果有内容，清空、获取焦点、进行滚动
				else if (commentInfo._id) {
					this.clearCommentContent();
					this.focusComment();
					this.scrollToComment(commentInfo._id);	
				}
				// 如果没有内容，清空、不获取焦点、不滑动
				else {
					this.clearCommentContent();
					this.blurComment();
				}
				// 设置信息
				this.commentActiveInfo = commentInfo;
			},
			// 输入框放弃焦点的相关处理
			blurCommentDeal() {
				return;
				this.selectComment({});
			},
			// 取消评论
			cancelComment() {
				this.selectComment({}, true);
			},
			// 获取评论
			getCommentContent() {
				return this.$refs.reply.getContent();
			},
			// 清空评论
			clearCommentContent() {
				this.$refs.reply.clearContent();
			},
			// 点击输入框进行鉴权
			clickComment() {
				this.checkLogin();
			},
			// 输入框获取焦点
			focusComment(){
				setTimeout(() => {
					this.$refs.reply.focusComment();
				}, 0);
			}, 
			// 主动使输入框放弃焦点
			blurComment() {
				this.$refs.reply.blurComment();
			},
			// 滚动到指定评论
			scrollToComment(comment_id) {
				this.$refs.detail.getCommentTop(comment_id)
									.boundingClientRect((data) => {
										this.mescroll.scrollTo(this.pageTop + data.top);
									})
									.exec();
			},
			// 添加评论数
			commentPost(post_id) {
				const postInfo = this.getInfo(post_id);
				uniCloud.callFunction({
					name: "saren-post-comment",
					data: {
						method: "addCount",
						post_id: post_id
					}
				})
				.then((res) => {
					console.log(res);
					const { changeCount } = res.result.data;
					const newLookCount = postInfo.commentCount + changeCount;
					this.updateInfo({
						infoItem: postInfo,
						data: {
							commentCount: newLookCount
						}
					})
				});
			},
			// 删除评论
			removeComment(commentInfo) {
				this.$api.confirm("是否确认删除", () => {
					uni.showLoading({
						mask: true
					});
					this.loginCloudFunction({
						name: "saren-post-comment",
						data: {
							method: "remove",
							comment_id: commentInfo._id,
							post_id: commentInfo.post_id,
							type: commentInfo.type
						}
					})
					.then((res) => {
						uni.hideLoading();
						if (!res.result.errCode) {
							// 当前选中该评论则重置
							if (this.commentActiveInfo._id === commentInfo._id) {
								this.selectComment({}, true);
							}
							// 删除一级评论
							if (commentInfo.type === 1) {
								// 直接删除内容即可
								let dataList = this.dataList;
								dataList = dataList.filter((item) => {
									return item._id !== commentInfo._id
								});
								this.dataList = dataList;
								// 更新加载状态
								if (this.dataList.length === 0) {
									this.mescroll.triggerUpScroll();
								}
							}
							// 删除二级评论
							else {
								// 找到一级评论
								const father_id = commentInfo.father_id;
								const fatherComment = this.dataList.find((item) => item._id === father_id);
								// 一级评论的childCommentList更新
								let dataList = fatherComment.childCommentList;
								dataList = dataList.filter((item) => {
									return item._id !== commentInfo._id
								});
								fatherComment.childCommentList = dataList;
							}
							// 更新评论数
							const { changeCount } = res.result.data;
							const postInfo = this.getInfo();
							const newLookCount = postInfo.commentCount + changeCount;
							this.updateInfo({
								infoItem: postInfo,
								data: {
									commentCount: newLookCount
								}
							});
							// 删除对应消息
							this.loginCloudFunction({
								name: "saren-post-message",
								data: {
									method: "removeComment",
									comment_id: commentInfo._id,
									type: commentInfo.type
								}
							});
							// 提示
							this.$api.showToast("删除成功");
						}
						else {
							this.$api.showToast("删除失败");
						}
					})
					.catch((res) => {
						uni.hideLoading();
						this.$api.showToast("删除失败");
					});
				});
			},
			// 增加评论
			addComment() {
				// 检测输入
				const content = this.getCommentContent();
				if (!content.length) {
					this.$api.showToast("请输入评论内容");
					return;
				}
				// 添加评论
				uni.showLoading({
					mask: true
				})
				const {
					type,
					post_id,
					father_id,
					replied_id,
					repliedNickname,
					repliedAvatar,
					replied_user_id
				} = this.commentAddInfo;
				this.loginCloudFunction({
					name: "saren-post-comment",
					data: {
						method: "add",
						content,
						type,
						post_id,
						father_id,
						replied_id
					}
				})
				.then((res) => {
					// 加载
					uni.hideLoading();
					// 失败的情况
					if (res.result.errCode) {
						this.$api.showToast(res.result.errMsg);
						return;
					}
					// 新数据
					const new_id = res.result.data._id;
					const userInfo = this.userInfo;
					const newComment = {
						...res.result.data,
						content,
						type,
						post_id,
						father_id,
						replied_id,
						avatar: userInfo.avatar,
						nickname: userInfo.nickname,
					}
					// 生成一级评论
					if (type === 1) {
						// 插入新评论
						newComment.childCommentList = [];
						this.dataList.unshift(newComment);
						// 更新加载状态
						if (this.dataList.length === 1) {
							this.mescroll.triggerUpScroll();
						}
						// 滑动至新评论
						this.$nextTick(() => {
							this.scrollToComment(new_id);
						});
					}
					// 生成二级评论
					else {
						// 插入新评论
						newComment.repliedUserId = replied_user_id;
						newComment.repliedNickname = repliedNickname;
						newComment.repliedAvatar = repliedAvatar;
						const fatherComment = this.dataList.find((item) => item._id === father_id);
						fatherComment.childCommentList.push(newComment);
						// 滑动至父级评论
						// this.$nextTick(() => {
						// 	this.scrollToComment(father_id);
						// });
					}
					// 添加未读消息
					if (true) {		// this.userInfo._id !== replied_user_id
						this.loginCloudFunction({
							name: "saren-post-message",
							data: {
								method: "addComment",
								post_id,
								type,
								replied_id: replied_user_id,
								comment_id: new_id
							}
						});	
					}
					// 清空输入框内容
					this.selectComment({}, true);
				})
				.catch((err) => {
					uni.hideLoading();
					this.$api.showToast("评论失败");
				})
				// 增加评论数
				this.commentPost(post_id);
			}
		},
	}
}