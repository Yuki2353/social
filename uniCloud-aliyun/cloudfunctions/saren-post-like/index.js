'use strict';

const {
	databaseName
} = require('saren-config');
const {
	checkToken
} = require("check-token");

const db = uniCloud.database();
const dbCmd = db.command;
const $ = dbCmd.aggregate;

const db_name_post = databaseName.post;
const db_name_user = databaseName.user;
const db_name_like = databaseName.like;
const db_post = db.collection(db_name_post);
const db_user = db.collection(db_name_user);
const db_like = db.collection(db_name_like);

const limit = 10;

exports.main = async (event, context) => {
	const result = await checkToken(event, context);
	if (result.errCode) {
		result.errCode = 30203;
		result.errMsg = "uni-id-token-expired";
		result.data = "";
		return result;
	}
	const { method, post_id } = event;
	const { user_id } = result;
	// 检测帖子
	const post = (await db_post.doc(post_id).get()).data[0];
	console.log("post***", post);
	if (post.status === 3) {
		return {
			errCode: 1,
			errMsg: "帖子已被删除",
			data: ""
		}
	}
	// 点赞
	if (method === "addLike") {
		const now = Date.now();
		const data = await Promise.all([
			await db_like.add({
				post_id: post_id,
				user_id: user_id,
				createTime: now,
				updateTime: now
			}),
			await db_post.doc(post_id).update({
				likeCount: dbCmd.inc(1)
			})
		]);
		result.errCode = 0;
		result.errMsg = "success";
		result.data = {
			changeCount: 1,
			isLiked: true,
			like_id: data[0].id
		};
		return result;
	}
	// 取消点赞
	else if (method === "removeLike") {
		const count = (await db_like.where({
			post_id: post_id,
			user_id: user_id
		}).remove()).deleted;
		await db_post.doc(post_id).update({
			likeCount: dbCmd.inc(-count)
		});
		result.errCode = 0;
		result.errMsg = "success";
		result.data = {
			changeCount: -count,
			isLiked: false,
			like_id: null
		};
		return result;
	}
};
