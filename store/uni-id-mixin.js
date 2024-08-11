import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'

import pagesJson from '@/pages.json'

export default {
	computed: {
		/**
		 * @description 检查是否已经登录，不含跳转
		*/
		hasLogin() {
			return store.hasLogin && Date.now() < (uni.getStorageSync("uni_id_token_expired") || 0);
		},
		
		/**
		 * @description 用户信息
		*/
		userInfo() {
		    return store.userInfo
		},
	},
	methods: {
		// mutations
		// 本质上只是函数，并不是真正的mutations
		...mutations,
		
		/**
		 * @description 跳转登录
		*/
		toLogin(redirect = false) {
			if (redirect) {
				return uni.redirectTo({
					url: `/${pagesJson.uniIdRouter.loginPage}`
				});
			}
			uni.navigateTo({
				url: `/${pagesJson.uniIdRouter.loginPage}`
			});
		},
		
		/**
		 * @description 检查是否已经登录，未登录则返回false并跳转到登录页
		*/
		checkLogin() {
			if (!store.hasLogin) {
				this.toLogin();
				return false;
			}
			const uni_id_token_expired = uni.getStorageSync("uni_id_token_expired") || 0;
			if (Date.now() > uni_id_token_expired) {
				this.logout();
				return false;
			}
			return true;
		},
		
		/**
		 * @description 登陆态才可执行的操作
		*/
		loginFunc(callback) {
			if (this.checkLogin()) {
				callback();
			}
		},
		
		/**
		 * @description 登陆态才能跳转到指定页面
		*/
		navigateLogin(url) {
			if (this.checkLogin()) {
				uni.navigateTo({
					url
				})
			}
		},
		
		/**
		 * @description 登陆态才可执行的云函数
		*/
		loginCloudFunction({name, data = null}) {
			return new Promise((resolve, reject) => {
				if (!this.checkLogin()) {
					reject("未登录");
					return;
				}
				uniCloud.callFunction({
					name,
					data
				})
				.then(res => {
					if (res.result.errMsg == "uni-id-token-expired") {
						this.showToast("登录过期");
						this.logout();
						reject(res);
						return;
					}
					if (res.result.newToken) {
						console.log("更新token");
						uni.setStorageSync('uni_id_token_expired', res.result.newToken.tokenExpired)
						uni.setStorageSync('uni_id_token', res.result.newToken.token)
					}
					resolve(res);
				})
				.catch(err => {
					reject(err);
				})
			});
		},
	}
}
	

