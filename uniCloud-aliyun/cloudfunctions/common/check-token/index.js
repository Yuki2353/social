const uniID = require('uni-id-common');

module.exports = {
	checkToken: async function(event, context) {
		const uniIDIns = uniID.createInstance({
		  context: context,
		});
		const payload = await uniIDIns.checkToken(event.uniIdToken);
		if (payload.errCode) {
			return payload
		}
		const result = {};
		result.errCode = 0;
		result.errMsg = "";
		result.user_id = payload.uid;
		if (payload.token) {
			result.newToken = {
				token: payload.token,
				tokenExpired: payload.tokenExpired
			}
		}
		return result;
	}
}
