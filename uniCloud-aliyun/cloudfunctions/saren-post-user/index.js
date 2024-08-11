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
	const { method } = event;
	if (method === "get") {
		const { user_id } = event;
		const data = await Promise.all([
										db_user.doc(user_id).field({
											nickname: 1,
											avatar: 1,
											backgroundImg: 1,
											introduction: 1
										}).get(),
										db_post.where({
											user_id,
											status: 1
										}).count()
									]);
		return {
			errCode: 0,
			errMsg: "success",
			data: {
				...data[0].data[0],
				postCount: data[1].total
			}
		}
	}
};
