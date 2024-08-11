export default {
	// 1.发送给朋友
	onShareAppMessage(e) {
		if (e.target?.dataset) {
			return {
				...e.target.dataset
			};
		}
	},
	// 2.分享到朋友圈
	onShareTimeline(e) {
		if (e.target?.dataset) {
			return {
				...e.target.dataset
			};
		}
	},
}
