const db = uniCloud.database()
const dbCmd = db.command
const $ = dbCmd.aggregate

const md5 = require('./md5');

function getConversationId({
  group_id,
  from_uid,
  to_uid,
}) {
  if (group_id) {
    return `group_${group_id}`
  }
  let arr = [from_uid, to_uid]
  return 'single' + '_' + md5(arr.sort().toString())
}

function hideEmailStr(email) {
  if (email == undefined) {
    return ''
  }
  const content = email.split("@")
  return content[0].substr(0, content[0].length - 2) + '**' + content[1]
}

function hideMobileStr(mobile) {
  return mobile.substr(0, 3) + '****' + mobile.substr(-1 * 4)
}

function checkParam(params, rule) {
  rule.required.forEach(item => {
    if (!params[item]) {
      throw new Error('错误，参数：' + item + "的值不能为空")
    }
  })
  for (let key in rule.type) {
    if (key in rule.type) {
      let val = params[key]
      let types = rule.type[key]

      function parseType(data) {
        return Object.prototype.toString.call(data).replace(/[\[\]]/g, '').split(' ')[1]
      }

      if (val && !types.includes(parseType(val))) {
        throw new Error('错误，参数：' + key + '的数据类型必须为：' + types.join('或'))
      }
    }
  }
}

module.exports = {
  db,
  dbCmd,
  $,
  md5,
  getConversationId,
  hideEmailStr,
  hideMobileStr,
  checkParam
}
