import store from '@/store/index.js'

/**
 * 获取导航栏信息
 */
function getSystemInfo() {
	// 如果是小程序，获取右上角胶囊的尺寸信息，避免导航栏右侧内容与胶囊重叠(支付宝小程序非本API，尚未兼容)
	// #ifdef MP-WEIXIN || MP-BAIDU || MP-TOUTIAO || MP-QQ
	let menuButtonObject = uni.getMenuButtonBoundingClientRect();
	uni.getSystemInfo({
		success: res => {
			//导航高度
			let statusBarHeight = res.statusBarHeight,
				navTop = menuButtonObject.top,
				navObjWidAndMar = res.windowWidth - menuButtonObject.right + menuButtonObject
				.width,
				// 胶囊按钮与右侧的距离 = windowWidth - right+胶囊宽度
				navObjMarRight = res.windowWidth - menuButtonObject.right, //胶囊按钮与右侧的距离
				navHeight = statusBarHeight + menuButtonObject.height + (menuButtonObject.top -
					statusBarHeight) * 2;
			// 设置 vuex_navbar
			store.commit('$store', {
				name: 'vuex_navbar',
				value: {
					statusBarHeight,
					navHeight, //导航栏总体高度
					navTop, //胶囊距离顶部距离
					navObjHei: menuButtonObject.height, //胶囊高度
					navObjWidAndMar, //胶囊宽度(包括右边距离)
					navObjMarRight //胶囊按钮与右侧的距离
				}
			})
		}
	});
	// #endif

	//#ifdef H5
	store.commit('$store', {
		name: 'vuex_navbar',
		value: {
			statusBarHeight: 20,
			navHeight: 85, //导航栏总体高度
			navTop: 24, //胶囊距离顶部距离
			navObjHei: 32, //胶囊高度
			navObjWidAndMar: 94, //胶囊宽度(包括右边距离)
			navObjMarRight: 7 //胶囊按钮与右侧的距离
		}
	})
	//#endif
}

export default getSystemInfo;