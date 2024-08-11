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
const db_name_share = databaseName.share;
const db_post = db.collection(db_name_post);
const db_user = db.collection(db_name_user);
const db_share = db.collection(db_name_share);

exports.main = async (event, context) => {
	const { method, post_id } = event;
	if (method === "add") {
		await Promise.all([
			db_post.doc(post_id).update({
				shareCount: dbCmd.inc(1)
			}),
			new Promise((resolve) => {
				checkToken(event, context).then((result) => {
					if (!result.errCode) {
						const now = Date.now();
						const { user_id } = result;
						db_share.add({
							post_id: post_id,
							user_id: user_id,
							createTime: now,
							updateTime: now
						})
						.then((res) => {
							resolve(res);
						});
					}
					else {
						resolve();
					}
				})
			})
		]);
		return {
			errCode: 0,
			errMsg: "success",
			data: {
				changeCount: 1
			}
		}
	}
};
