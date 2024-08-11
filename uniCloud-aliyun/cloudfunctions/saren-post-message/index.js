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
const db_name_comment = databaseName.comment;
const db_name_message = databaseName.message;
const db_post = db.collection(db_name_post);
const db_user = db.collection(db_name_user);
const db_like = db.collection(db_name_like);
const db_comment = db.collection(db_name_comment);
const db_message = db.collection(db_name_message);

const limit = 10;

exports.main = async (event, context) => {
	const result = await checkToken(event, context);
	if (result.errCode) {
		result.errCode = 30203;
		result.errMsg = "uni-id-token-expired";
		result.data = "";
		return result;
	}
	const { user_id } = result;
	const { method } = event;
	// 新增message
	// 点赞、评论
	if (method === "addLike") {
		const { replied_id, like_id, post_id } = event;
		const now = Date.now();
		const newMsg = {
			user_id,
			replied_id,
			post_id,
			like_id,
			comment_id: null,
			status: 0,
			type: 1,
			createTime: now,
			updateTime: now
		};
		console.log(newMsg);
		const data = await db_message.add({
			...newMsg
		});
		result.errCode = 0;
		result.errMsg = "success";
		result.data = data.id;
		return result;
	}
	// 新增评论
	else if (method === "addComment") {
		const { type, replied_id, comment_id, post_id } = event;
		const now = Date.now();
		const newMsg = {
			user_id,
			replied_id,
			post_id,
			like_id: null,
			comment_id,
			status: 0,
			type: 2,
			createTime: now,
			updateTime: now
		};
		const data = await db_message.add({
			...newMsg
		});
		result.errCode = 0;
		result.errMsg = "success";
		result.data = data.id;
		return result;
	}
	// 删除message
	// 点赞、一级评论、二级评论
	else if (method === "removeComment") {
		const { type, comment_id } = event;
		if (type === 1) {
			// 所有评论列表
			let comment_list = [];
			// 该评论本身
			comment_list.push(comment_id);
			// 其下所有二级评论
			let childList = (await db_comment.where({
									father_id: comment_id,
									// status: dbCmd.neq(3)
								}).field({
									_id: 1
								}).get()).data;
			childList = childList.map((item) => item._id);
			comment_list = comment_list.concat(childList);
			// 删除所有评论
			await db_message.where({
				comment_id: dbCmd.in(comment_list)
			}).update({
				status: 3,
				updateTime: Date.now()
			});
			result.errCode = 0;
			result.errMsg = "success";
			result.data = comment_list.length;
			return result;
		}
		else {
			await db_message.where({
				comment_id,
			}).update({
				status: 3,
				updateTime: Date.now()
			});
			result.errCode = 0;
			result.errMsg = "success";
			result.data = 1;
			return result;
		}
	}
	// 删除点赞消息
	else if (method === "removeLike") {
		const { like_id } = event;
		await db_message.where({
			like_id,
		}).update({
			status: 3,
			updateTime: Date.now()
		});
		result.errCode = 0;
		result.errMsg = "success";
		result.data = 1;
		return result;
	}
	// 查询未读数量
	else if (method === "getCount") {
		const data = await Promise.all([
			db_message.where({
				replied_id: user_id,
				type: 1,
				status: 0
			}).count(),
			db_message.where({
				replied_id: user_id,
				type: 2,
				status: 0
			}).count()
		]);
		return {
			errCode: 0,
			errMsg: "success",
			data: {
				like: data[0].total,
				comment: data[1].total
			}
		}
	}
	// 查询点赞具体内容
	else if (method === "getLikeMessage") {
		const { skip } = event;
		const data = await db_message.aggregate()
								.match({
									type: 1,
									replied_id: result.user_id,
									status: dbCmd.neq(3)
								})
								.sort({
									createTime: -1
								})
								.skip(skip)
								.limit(limit)
								.lookup({
									from: db_name_user,
									let: {
										user_id: '$user_id',
									},
									pipeline: $.pipeline()
										.match(dbCmd.expr($.eq(['$_id', '$$user_id'])))
										.limit(1)
										.project({
											_id: 1,
											avatar: 1,
											nickname: 1,
										})
										.done(),
									as: 'userList',
								})
								.lookup({
									from: db_name_post,
									let: {
										post_id: '$post_id',
									},
									pipeline: $.pipeline()
												.match(dbCmd.expr($.eq(['$_id', '$$post_id'])))
												.limit(1)
												.done(),
									as: 'postList',
								})
								.project({
									type: 1,
									status: 1,
									createTime: 1,
									post_id: 1,
									// userList: 1,
									user_id: 1,
									avatar: $.arrayElemAt(["$userList.avatar", 0]),
									nickname: $.arrayElemAt(["$userList.nickname", 0]),
									postTitle: $.arrayElemAt(["$postList.title", 0]),
									postConetnt: $.arrayElemAt(["$postList.content", 0]),
									postImgList: $.arrayElemAt(["$postList.imgList", 0])
								})
								.end();
		result.errCode = 0;
		result.errMsg = "success";
		result.data = data.data;
		return result;
	}
	// 查询评论具体内容
	else if (method === "getCommentMessage") {
		const { skip } = event;
		const data = await db_message.aggregate()
							.match({
								type: 2,
								replied_id: result.user_id,
								status: dbCmd.neq(3)
							})
							.sort({
								createTime: -1
							})
							.skip(skip)
							.limit(limit)
							.lookup({
								from: db_name_user,
								let: {
									user_id: '$user_id',
								},
								pipeline: $.pipeline()
									.match(dbCmd.expr($.eq(['$_id', '$$user_id'])))
									.limit(1)
									.project({
										_id: 1,
										avatar: 1,
										nickname: 1,
									})
									.done(),
								as: 'userList',
							})
							.lookup({
								from: db_name_post,
								let: {
									post_id: '$post_id',
								},
								pipeline: $.pipeline()
											.match(dbCmd.expr($.eq(['$_id', '$$post_id'])))
											.limit(1)
											.done(),
								as: 'postList',
							})
							.lookup({
								from: db_name_comment,
								let: {
									comment_id: '$comment_id',
								},
								pipeline: $.pipeline()
											.match(dbCmd.expr($.eq(['$_id', '$$comment_id'])))
											.limit(1)
											.done(),
								as: 'commentList',
							})
							.project({
								type: 1,
								status: 1,
								createTime: 1,
								post_id: 1,
								user_id: 1,
								// commentList: 1,
								content: $.arrayElemAt(["$commentList.content", 0]),
								avatar: $.arrayElemAt(["$userList.avatar", 0]),
								nickname: $.arrayElemAt(["$userList.nickname", 0]),
								postTitle: $.arrayElemAt(["$postList.title", 0]),
								postConetnt: $.arrayElemAt(["$postList.content", 0]),
								postImgList: $.arrayElemAt(["$postList.imgList", 0])
							})
							.end();
		result.errCode = 0;
		result.errMsg = "success";
		result.data = data.data;
		return result;
	}
	// 标记已读
	else if (method === "readMessage") {
		const { message_id } = event;
		await db_message.doc(message_id).update({
			status: 1
		});
		result.errCode = 0;
		result.errMsg = "success";
		result.data = {
			status: 1
		}
		return result;
	}
};
