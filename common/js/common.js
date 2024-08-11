// 'use strict';

import config from "./config.js";
import pagesJson from '@/pages.json'

class Common {
	
	/**
	 * @timestamp 格式化时间
	*/
	formatTime(timestamp) {
		const now = Date.now();
		if (timestamp > now) {
			return "time error";
		}
		const diffTimestamp = now - timestamp;
		const floor = Math.floor;
		const diffSecond = floor(diffTimestamp / (1000));
		const diffMinute = floor(diffTimestamp / (60 * 1000));
		const diffHour = floor(diffTimestamp / (60 * 60 * 1000));
		const diffDay = floor(diffTimestamp / (24 * 60 * 60 * 1000));
		const diffMonth = floor(diffTimestamp / (30 * 24 * 60 * 60 * 1000));	// 此处假设一个月有30天
		const diffYear = floor(diffTimestamp / (12 * 30 * 24 * 60 * 60 * 1000));	// 延续上文假设
		if (diffYear >= 1) {
			const date = new Date(timestamp);
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();
			return `${year}年${month}月${day}日`;
		}
		else if (diffMonth >= 1) {
			return `${diffMonth}个月前`;
		}
		else if (diffDay >= 1) {
			return `${diffDay}天前`;
		}
		else if (diffHour >= 1) {
			return `${diffHour}小时前`;
		}
		else if (diffMinute >= 1) {
			return `${diffMinute}分钟前`;
		}
		else {
			return `${diffSecond}秒前`;
		}
	}
	
	/**
	 * @timestamp 格式化数字
	*/
	formatCount(count, show=false) {
		if (!show && count === 0) {
			return "";
		}
		let sign = "";
		if (count < 0) {
			count = -count;
			sign = "-";
		}
		const config = [
			{
				max: Math.pow(10, 3) - 1,
				item: 1,
				description: ""
			},
			{
				max: Math.pow(10, 4) - 1,
				item: Math.pow(10, 3),
				description: "千"
			},
			{
				max: Math.pow(10, 8) - 1,
				item: Math.pow(10, 4),
				description: "万"
			},
			{
				max: Number.MAX_VALUE,
				item: Math.pow(10, 8),
				description: "亿"
			}
		];
		const length = config.length;
		const round = function(num, digits) {  
			return parseFloat(num.toFixed(digits));
		};
		for (let index = 0; index < length; index++) {
			const infoItem = config[index];
			if (count <= infoItem.max) {
				return `${sign}${round(count/infoItem.item,1)}${infoItem.description}`;
			}
			else {
				continue;
			}
		}
		return "count error";
	}
	
	/**
	 * @description 返回首页
	*/
	toHome() {
		const page = pagesJson.pages[0]
		uni.reLaunch({
			url: `/${page.path}`
		});
	}
	
	/**
	 * @refresh 是否刷新上一页
	*/
	navigateBack(refresh = false) {
		const pages = getCurrentPages();
		if (pages.length > 1) {
			if (refresh) {
				pages[pages.length - 2].onPullDownRefresh();
			}
			uni.navigateBack({
				delta: 1
			})
			return
		}
	}
	
	/**
	 * @description 确认提示
	*/
	confirm(content, callback) {
		uni.showModal({
			title: "提示",
			content: content,
			success: (res) => {
				if (res.confirm) {
					if (typeof callback === "function") {
						callback();
					}
				}
				else if (res.cancel) {
					
				}
			}
		});
	}
	
	/**
	 * @description 提示成功
	*/
	showSuccess(title) {
		uni.showToast({
			title: `${title}成功`,
			icon: "success",
			duration: 3000
		});
	}
	
	/**
	 * @description 提示失败
	*/
	showFail(title) {
		uni.showToast({
			title: `${title}失败`,
			icon: "fail",
			duration: 3000
		});
	}
	
	/**
	 * @description 提示文字
	*/
	showToast(title) {
		uni.showToast({
			title: `${title}`,
			icon: "none",
			duration: 3000
		});
	}
};

export default new Common();