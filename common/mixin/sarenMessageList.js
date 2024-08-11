import MescrollMixin from "@/uni_modules/mescroll-uni/components/mescroll-uni/mescroll-mixins.js";

export default {
	mixins: [MescrollMixin],
	data() {
		return {
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
					name: "saren-post-message",
					data: {
						...this.dataOption,
						skip: sumLength
					}
				})
				.then((res) => {
					const curPageData = res.result.data;
					console.log(curPageData);
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
		
		// 更新消息内容
		...{
			// 获取对象
			getInfo(message_id) {
				return this.dataList.find((item) => item._id === message_id);
			},
			// 删除数据
			removeInfo(message_id) {
				let dataList = this.dataList;
				dataList = dataList.filter((item) => item._id !== message_id);
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
		
		// 对消息的相关操作
		...{
			// 已读消息
			readMessage(message_id) {
				const messageInfo = this.getInfo(message_id);
				this.loginCloudFunction({
					name: "saren-post-message",
					data: {
						method: "readMessage",
						message_id
					}
				})
				.then((res) => {
					this.updateInfo({
						infoItem: messageInfo,
						data: {
							...res.result.data
						}
					})
				});
			},
		},
	}
}
