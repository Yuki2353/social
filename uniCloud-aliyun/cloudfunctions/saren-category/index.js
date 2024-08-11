const {
	databaseName
} = require('saren-config');

const db = uniCloud.database();
const dbCmd = db.command;
const $ = dbCmd.aggregate;

const db_name_category = databaseName.category;
const db_category = db.collection(db_name_category);

exports.main = async (event, context) => {
	// 获取分类信息
	return await db_category.where({
				valid: true
			}).get();
};
