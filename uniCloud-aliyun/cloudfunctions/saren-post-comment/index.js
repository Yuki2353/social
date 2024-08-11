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
const db_name_comment = databaseName.comment;
const db_post = db.collection(db_name_post);
const db_user = db.collection(db_name_user);
const db_comment = db.collection(db_name_comment);

const limit = 10;

exports.main = async (event, context) => {
	const { method } = event;
	// 帖子按时间排序的评论
	if (method === "post_id") {
		const { post_id } = event;
		const data =  (await getCommentNoLike({
			match: {
					post_id: post_id,
				},
			sort: {
				createTime: 1
			},
			skip: event.skip,
			limit: limit
		})).data;
		return {
			errCode: 0,
			errMsg: "success",
			data: data
		}
	}
	// 按 _id 查找评论
	
	// 添加评论
	else if (method === "add") {
		const result = await checkToken(event, context);
		if (result.errCode) {
			result.errCode = 30203;
			result.errMsg = "uni-id-token-expired";
			result.data = "";
			return result;
		}
		const { user_id } = result;
		const {
			content,
			type,
			post_id,
			father_id,
			replied_id
		} = event;
		const status = 1;
		const likeCount = 0;
		const createTime = Date.now(), updateTime = Date.now();
		// 查看帖子状态
		const post = (await db_post.doc(post_id).get()).data[0];
		if (post.status === 3) {
			return {
				errCode: 1,
				errMsg: "帖子已被删除",
				data: ""
			}
		}
		// 添加
		const _id = (await db_comment.add({
			user_id,
			content,
			type,
			post_id,
			father_id,
			replied_id,
			status,
			likeCount,
			createTime,
			updateTime,
		})).id;
		return {
			errCode: 0,
			errMsg: "success",
			data: {
				_id,
				user_id,
				status,
				likeCount,
				createTime,
				updateTime,
				// content,
				// type,
				// post_id,
				// father_id,
				// replied_id
			}
		}
	}
	// 增加评论数
	else if (method === "addCount") {
		const { post_id } = event;
		await db_post.doc(post_id).update({
			commentCount: dbCmd.inc(1)
		});
		return {
			errCode: 0,
			errMsg: "success",
			data: {
				changeCount: 1
			}
		}
	}
	// 删除评论
	else if (method === "remove") {
		const result = await checkToken(event, context);
		if (result.errCode) {
			result.errCode = 30203;
			result.errMsg = "uni-id-token-expired";
			result.data = "";
			return result;
		}
		const { comment_id, post_id, type } = event;
		// 删除并鉴权
		const data = await db_comment.where({
			_id: comment_id,
			status: 1,
			user_id: result.user_id
		}).update({
			status: 3,
			updateTime: Date.now()
		});
		// 删除数量
		let changeCount = data.updated;
		// 鉴权不通过
		if (!changeCount) {
			result.errCode = 1;
			result.errMsg = "fail";
			result.data = {
				changeCount: 0
			};
			return result;
		}
		// 鉴权通过则更新post信息
		if (data.updated && type === 2) {
			await db_post.doc(post_id).update({
				commentCount: dbCmd.inc(-changeCount)
			});
		}
		// 鉴权通过则删除子评论
		if (data.updated && type === 1) {
			const dataChild = await db_comment.where({
				father_id: comment_id,
				status: 1
			}).update({
				status: 3,
				updateTime: Date.now()
			});
			changeCount += dataChild.updated;
			await db_post.doc(post_id).update({
				commentCount: dbCmd.inc(-changeCount)
			});
		}
		result.errCode = 0;
		result.errMsg = "success";
		result.data = {
			changeCount: -changeCount
		};
		return result;
	}
};

function getCommentNoLike({
	match,
	sort,
	skip,
	limit
}) {
	return db_comment.aggregate()
				.match({
					...match,
					type: 1,
					status: 1
				})
				.sort(sort)
				.skip(skip)
				.limit(limit)
				// 一级评论用户信息
				.lookup({
					from: db_name_user,
					let: {
						user_id: '$user_id',
					},
					pipeline: $.pipeline()
								.match(
									dbCmd.expr(
										$.eq(['$_id', '$$user_id'])
									)
								)
								.limit(1)
								.project({
									_id: 0,
									avatar: 1,
									nickname: 1,
								})
								.done(),
					as: 'userList',
				})
				.project({
					_id: 1,
					user_id: 1,
					nickname: $.arrayElemAt(['$userList.nickname', 0]),
					avatar: $.arrayElemAt(['$userList.avatar', 0]),
					status: 1,
					content: 1,
					createTime: 1,
					updateTime: 1,
					commentCount: 1,
					likeCount: 1,
					type: 1,
					post_id: 1,
					father_id: 1,
					replied_id: 1,
				})
				// 二级评论查询
				.lookup({
					from: db_name_comment,
					let: {
						father_id: "$_id"
					},
					pipeline: $.pipeline()
								.match(
									dbCmd.expr(
										$.and([
											$.eq(["$father_id", "$$father_id"]),
											$.eq(["$type", 2]),
											$.eq(["$status", 1]),
										])
									)
								)
								.sort({
									createTime: 1
								})
								// 嵌套查询：二级评论用户信息（评论者）
								.lookup({
									from: db_name_user,
									let: {
										user_id: '$user_id',
									},
									pipeline: $.pipeline()
												.match(
													dbCmd.expr(
														$.eq(['$_id', '$$user_id'])
													)
												)
												.limit(1)
												.project({
													_id: 0,
													avatar: 1,
													nickname: 1,
												})
												.done(),
									as: 'userList',
								})
								// 二级评论用户：被评论者id
								.lookup({
									from: db_name_comment,
									let: {
										replied_id: "$replied_id"
									},
									pipeline: $.pipeline()
												.match(
													dbCmd.expr(
														$.eq(["$_id", "$$replied_id"])
													)
												)
												.project({
													_id: 0,
													user_id: 1
												})
												// 二级评论用户信息：被评论者信息
												.lookup({
													from: db_name_user,
													let: {
														user_id: '$user_id',
													},
													pipeline: $.pipeline()
																.match(
																	dbCmd.expr(
																		$.eq(['$_id', '$$user_id'])
																	)
																)
																.limit(1)
																.project({
																	_id: 1,
																	avatar: 1,
																	nickname: 1,
																})
																.done(),
													as: 'userList',
												})
												.project({
													_id: 0,
													status: 1,
													user_id: 1,
													nickname: $.arrayElemAt(['$userList.nickname', 0]),
													avatar: $.arrayElemAt(['$userList.avatar', 0]),
												})
												.done(),
									as: 'replyChildComment',
								})
								.unwind({
									path: "$replyChildComment",
									preserveNullAndEmptyArrays: true,
								})
								.project({
									_id: 1,
									user_id: 1,
									nickname: $.arrayElemAt(['$userList.nickname', 0]),
									avatar: $.arrayElemAt(['$userList.avatar', 0]),
									status: 1,
									content: 1,
									createTime: 1,
									updateTime: 1,
									commentCount: 1,
									likeCount: 1,
									type: 1,
									post_id: 1,
									father_id: 1,
									replied_id: 1,
									repliedUserId: "$replyChildComment.user_id",
									repliedNickname: "$replyChildComment.nickname",
									repliedAvatar: "$replyChildComment.avatar",
								})
								.done(),
					as: "childCommentList"
				})
				.end();
}