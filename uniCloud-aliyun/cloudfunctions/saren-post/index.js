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
const db_name_star = databaseName.star;
const db_name_share = databaseName.share;
const db_name_look = databaseName.look;
const db_name_comment = databaseName.comment;
const db_name_message = databaseName.message;
const db_post = db.collection(db_name_post);
const db_user = db.collection(db_name_user);
const db_like = db.collection(db_name_like);
const db_star = db.collection(db_name_star);
const db_share = db.collection(db_name_share);
const db_look = db.collection(db_name_look);
const db_comment = db.collection(db_name_comment);
const db_message = db.collection(db_name_message);

const limit = 10;

exports.main = async (event, context) => {
	const { method } = event;
	// 按id查询
	if (method === "_id") {
		const { post_id } = event;
		return await getPostToken({
			event,
			context,
			match: {
				_id: post_id
			},
			sort: {
				createTime: -1
			},
			skip: 0,
			limit: 1
		});
	}
	// 按用户查询
	else if (method === "user_id") {
		const { user_id, skip } = event;
		return await getPostToken({
			event,
			context,
			match: {
				user_id: user_id,
				status: 1
			},
			sort: {
				createTime: -1
			},
			skip: skip,
			limit: limit
		});
	}
	// 查询我的
	else if (method === "myPost") {
		const result = await checkToken(event, context);
		if (result.errCode) {
			result.errCode = 30203;
			result.errMsg = "uni-id-token-expired";
			result.data = "";
			return result;
		}
		const { skip } = event;
		return await getPostToken({
			event,
			context,
			match: {
				user_id: result.user_id,
				status: 1
			},
			sort: {
				createTime: -1
			},
			skip: skip,
			limit: limit
		});
	}
	// 按时间查询
	else if (method === "time") {
		return await getPostToken({
			event,
			context,
			match: {
				status: 1,
			},
			sort: {
				createTime: -1
			},
			skip: event.skip,
			limit: limit
		});
	}
	// 按分享数查询
	else if (method === "shareCount") {
		return await getPostToken({
			event,
			context,
			match: {
				status: 1,
			},
			sort: {
				shareCount: -1,
				createTime: -1
			},
			skip: event.skip,
			limit: limit
		});
	}
	// 按点赞数查询
	else if (method === "likeCount") {
		return await getPostToken({
			event,
			context,
			match: {
				status: 1,
			},
			sort: {
				likeCount: -1,
				createTime: -1
			},
			skip: event.skip,
			limit: limit
		});
	}
	// 按浏览数查询
	else if (method === "lookCount") {
		return await getPostToken({
			event,
			context,
			match: {
				status: 1,
			},
			sort: {
				lookCount: -1,
				createTime: -1
			},
			skip: event.skip,
			limit: limit
		});
	}
	// 按评论数查询
	else if (method === "commentCount") {
		return await getPostToken({
			event,
			context,
			match: {
				status: 1,
			},
			sort: {
				commentCount: -1,
				createTime: -1
			},
			skip: event.skip,
			limit: limit
		});
	}
	// 联表【点赞】查询
	else if (method === "myLike") {
		return await getPostLookupToken({
			context,
			event,
			match: {},
			sort: {
				createTime: -1
			},
			skip: event.skip,
			limit: limit,
			table_db: db_like
		});
	}
	// 联表【收藏】查询
	else if (method === "myStar") {
		return await getPostLookupToken({
			context,
			event,
			match: {},
			sort: {
				createTime: -1
			},
			skip: event.skip,
			limit: limit,
			table_db: db_star
		});
	}
	// 联表【浏览】查询
	else if (method === "myLook") {
		return await getPostLookupToken({
			context,
			event,
			match: {},
			sort: {
				createTime: -1
			},
			skip: event.skip,
			limit: limit,
			table_db: db_look
		});
	}
	// 联表【分享】查询
	else if (method === "myShare") {
		return await getPostLookupToken({
			context,
			event,
			match: {},
			sort: {
				createTime: -1
			},
			skip: event.skip,
			limit: limit,
			table_db: db_share
		});
	}
	// 按搜索查询
	else if (method === "search") {
		const {keyword} = event;
		const words = keyword.split(/\s+/);
		const reg = words.join('|');
		return await getPostToken({
			event,
			context,
			match: {
				status: 1,
				$or: [
					{
						title: {
							$regex: reg,
							$options: "i"
						}
					},
					{
						content: {
							$regex: reg,
							$options: "i"
						}
					}
				]
			},
			sort: {
				createTime: -1
			},
			skip: event.skip,
			limit: limit
		});
	}
	// 新增帖子
	else if (method === "add") {
		const result = await checkToken(event, context);
		if (result.errCode) {
			result.errCode = 30203;
			result.errMsg = "uni-id-token-expired";
			result.data = "";
			return result;
		}
		const {title, content, imgList} = event;
		const status = 1;
		const shareCount = 0, lookCount = 0, commentCount = 0, likeCount = 0, reportCount = 0;
		const now = Date.now();
		const createTime = now, updateTime = now;
		const data = await db_post.add({
			title,
			content,
			imgList,
			user_id: result.user_id,
			status,
			shareCount,
			lookCount,
			commentCount,
			likeCount,
			reportCount,
			createTime,
			updateTime
		});
		result.errCode = 0;
		result.errMsg = "success";
		result.data = data.id;
		return result;
	}
	// 修改帖子
	else if (method === "update") {
		const result = await checkToken(event, context);
		if (result.errCode) {
			result.errCode = 30203;
			result.errMsg = "uni-id-token-expired";
			result.data = "";
			return result;
		}
		const params = {};
		const changeable = ['title', 'content', 'imgList', 'status'];
		for (let index = 0; index < changeable.length; index++) {
			const key = changeable[index];
			const value = event[key];
			if (value) {
				params[key] = value;
			}
		}
		const { post_id } = event;
		const data = await db_post.where({
			post_id: post_id,
			user_id: result.user_id
		}).update({
			...params,
			updateTime: Date.now()
		});
		result.errCode = 0;
		result.errMsg = "success";
		result.data = data.updated;
		return result;
	}
	// 删除帖子
	else if (method === "remove") {
		const result = await checkToken(event, context);
		if (result.errCode) {
			result.errCode = 30203;
			result.errMsg = "uni-id-token-expired";
			result.data = "";
			return result;
		}
		const { post_id } = event;
		// 删除帖子
		const data = await db_post.where({
			_id: post_id,
			user_id: result.user_id
		}).update({
			status: 3,
			updateTime: Date.now()
		});
		if (data.updated) {
			// 删除所有评论 和 点赞
			await Promise.all([
				db_comment.where({
					post_id: post_id
				}).update({
					status: 3,
					updateTime: Date.now()
				}),
				db_message.where({
					post_id: post_id
				}).update({
					status: 3,
					updateTime: Date.now()
				}),
			]);
			result.errCode = 0;
			result.errMsg = "success";
			result.data = data.updated;
			return result;
		}
		result.errCode = 1;
		result.errMsg = "fail";
		result.data = data.updated;
		return result;
	}
};

// 常规查表
function getPostNotLogin(match, sort, skip, limit) {
	return db_post.aggregate()
				.match(match)
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.lookup({
					from: db_name_user,
					let: {
						user_id: "$user_id"
					},
					pipeline: $.pipeline()
								.match(dbCmd.expr($.eq(["$_id", "$$user_id"])))
								.limit(1)
								.project({
									_id: 0,
									avatar: 1,
									nickname: 1
								})
								.done(),
					as: "userList"
				})
				// .lookup({
				// 	from: db_name_category,
				// 	let: {
				// 		catagoryId: "$catagoryId"
				// 	},
				// 	pipeline: $.pipeline()
				// 				.match(dbCmd.expr($.eq(["$_id", "$$catagoryId"])))
				// 				.limit(1)
				// 				.project({
				// 					title: 1,
				// 					description: 1,
				// 					icon: 1
				// 				})
				// 				.done(),
				// 	as: "catagoryInfo"
				// })
				.project({
					_id: 1,
					user_id: 1,
					avatar: $.arrayElemAt(["$userList.avatar", 0]),
					nickname: $.arrayElemAt(["$userList.nickname", 0]),
					status: 1,
					title: 1,
					content: 1,
					imgList: 1,
					shareCount: 1,
					lookCount: 1,
					commentCount: 1,
					likeCount: 1,
					createTime: 1,
					updateTime: 1,
					// catagoryId: 1,
					// catagoryTitle: $.arrayElemAt(["catagoryInfo.title", 0]),
					// catagoryDescription: $.arrayElemAt(["catagoryInfo.description", 0]),
					// catagoryIcon: $.arrayElemAt(["catagoryInfo.icon", 0])
				})
				.addFields({
				    isLiked: false,
					like_id: null
				})
				.end();
}
function getPostLogin(match, sort, skip, limit, user_id) {
	return db_post.aggregate()
				.match(match)
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.lookup({
					from: db_name_user,
					let: {
						user_id: "$user_id"
					},
					pipeline: $.pipeline()
								.match(dbCmd.expr($.eq(["$_id", "$$user_id"])))
								.limit(1)
								.project({
									_id: 0,
									avatar: 1,
									nickname: 1
								})
								.done(),
					as: "userList"
				})
				.lookup({
					from: db_name_like,
					let: {
						post_id: "$_id",
					},
					pipeline: $.pipeline()
								.match(dbCmd.expr($.and([
									$.eq(["$post_id", "$$post_id"]),
									$.eq(["$user_id", user_id])
								])))
								.done(),
					as: "likeList"
				})
				// .lookup({
				// 	from: db_name_category,
				// 	let: {
				// 		catagoryId: "$catagoryId"
				// 	},
				// 	pipeline: $.pipeline()
				// 				.match(dbCmd.expr($.eq(["$_id", "$$catagoryId"])))
				// 				.limit(1)
				// 				.project({
				// 					title: 1,
				// 					description: 1,
				// 					icon: 1
				// 				})
				// 				.done(),
				// 	as: "catagoryInfo"
				// })
				.project({
					_id: 1,
					user_id: 1,
					avatar: $.arrayElemAt(["$userList.avatar", 0]),
					nickname: $.arrayElemAt(["$userList.nickname", 0]),
					status: 1,
					title: 1,
					content: 1,
					imgList: 1,
					shareCount: 1,
					lookCount: 1,
					commentCount: 1,
					likeCount: 1,
					createTime: 1,
					updateTime: 1,
					// catagoryId: 1,
					// catagoryTitle: $.arrayElemAt(["catagoryInfo.title", 0]),
					// catagoryDescription: $.arrayElemAt(["catagoryInfo.description", 0]),
					// catagoryIcon: $.arrayElemAt(["catagoryInfo.icon", 0]),
					isLiked: $.cond({
						if: {
							$gt: [dbCmd.size("$likeList"), 0]
						},
						then: true,
						else: false
					}),
					like_id: $.cond({
						if: {
							$gt: [dbCmd.size("$likeList"), 0]
						},
						then: $.arrayElemAt(["$likeList._id", 0]),
						else: null
					}),
				})
				.end();
}
async function getPostToken(params) {
	const {event, context} = params;
	const result = await checkToken(event, context);
	const {match, sort, skip, limit} = params;
	if (result.errCode) {
		const data = (await getPostNotLogin(match, sort, skip, limit)).data;
		result.errCode = 0;
		result.errMsg = "success";
		result.data = data;
		return result;
	}
	const data = (await getPostLogin(match, sort, skip, limit, result.user_id)).data;
	result.errCode = 0;
	result.errMsg = "success";
	result.data = data;
	return result;
}

// 联表查表
function getPostLookup(match, sort, skip, limit, table_db, user_id) {
 	return table_db.aggregate().match({
 			user_id: user_id
 		})
 		.sort(sort)
		.group({
		      _id: {
		        user_id: '$user_id', // 分组的依据是 user_id 和 post_id
		        post_id: '$post_id'
		      },
		      doc: $.first('$$ROOT') // 选择每个分组中的第一个文档
		  })
		.replaceRoot({
			newRoot: '$doc' // 将 doc 字段（包含原始文档）作为新的根文档
		})
		.sort(sort)
		.skip(skip)
		.limit(limit)
 		.lookup({
 			from: db_name_post,
 			let: {
 				post_id: "$post_id"
 			},
 			pipeline: $.pipeline()
 						.match(dbCmd.expr($.and([
 									$.eq(["$_id", "$$post_id"]),
 									$.eq(["$status", 1])
 								])))
 						.limit(1)
 						.project({
 							_id: 1,
 							user_id: 1,
 							status: 1,
 							title: 1,
 							content: 1,
 							imgList: 1,
 							shareCount: 1,
 							lookCount: 1,
 							commentCount: 1,
 							likeCount: 1,
 							createTime: 1,
 							updateTime: 1,
 						})
 						.done(),
 			as: "postList"
 		})
 		.unwind({
 			path: "$postList"
 		})
 		.replaceRoot({
 			newRoot: "$postList"
 		})
 		.lookup({
 			from: db_name_user,
 			let: {
 				user_id: "$user_id"
 			},
 			pipeline: $.pipeline()
 						.match(dbCmd.expr($.eq(["$_id", "$$user_id"])))
 						.limit(1)
 						.project({
 							_id: 0,
 							avatar: 1,
 							nickname: 1,
 						})
 						.done(),
 			as: "userList"
 		})
 		.lookup({
 			from: db_name_like,
 			let: {
 				post_id: "$_id",
 			},
 			pipeline: $.pipeline()
 						.match(dbCmd.expr($.and([
 							$.eq(["$post_id", "$$post_id"]),
 							$.eq(["$user_id", user_id])
 						])))
 						.done(),
 			as: "likeList"
 		})
 		.project({
 			_id: 1,
 			user_id: 1,
 			avatar: $.arrayElemAt(["$userList.avatar", 0]),
 			nickname: $.arrayElemAt(["$userList.nickname", 0]),
 			status: 1,
 			title: 1,
 			content: 1,
 			imgList: 1,
 			shareCount: 1,
 			lookCount: 1,
 			commentCount: 1,
 			likeCount: 1,
 			createTime: 1,
 			updateTime: 1,
 			isLiked: $.cond({
 				if: {
 					$gt: [dbCmd.size("$likeList"), 0]
 				},
 				then: true,
 				else: false
 			}),
			like_id: $.cond({
				if: {
					$gt: [dbCmd.size("$likeList"), 0]
				},
				then: $.arrayElemAt(["$likeList._id", 0]),
				else: null
			}),
 		})
 		.end();
 }
async function getPostLookupToken(params) {
	const {event, context} = params;
	const result = await checkToken(event, context);
	if (result.errCode) {
		result.errCode = 30203;
		result.errMsg = "uni-id-token-expired";
		result.data = "";
		return result;
	}
	const {match, sort, skip, limit, table_db} = params;
	const data = (await getPostLookup(match, sort, skip, limit, table_db, result.user_id)).data;
	result.errCode = 0;
	result.errMsg = "success";
	result.data = data;
	return result;
}