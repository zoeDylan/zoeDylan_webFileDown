var request = require('request'),
    fs = require('fs'),
	file = require('./file.js');

/*
 * 存储文件
 * <op{array||object},callback{function(data)}>
 */
function saveFile(op, callback) {

	function _____() {

		q.push(function (cb) {

		});
		q.start(function () {
			saveData();
			console.warn("【已全部更新】");
			fn({
				message: "已全部更新!"
			})
			end();
			//发送邮件
			sendMail();

		});
	}
	op = {
		url: op.url || op,
		name: op.name
	}
	console.log("【开始爬取】" + op.url);
	request(op.url, {
		encoding: null
	}, function (error, response, body) {
		if (error) {
			console.log("【爬取失败】" + error);
			return false;
		}
		var
			uri = response.request.uri,
			dir = process.cwd() + '/upload/',
			host = dir + uri.hostname.replace(/[^.\w]/g, '_'),
			name = host + '/' + ((op.name ? '【' + op.name + '】' : '') + uri.pathname.replace(/[^.\w]/g, '-'));
		if (!fs.existsSync(host)) {
			file.createDir(host);
		}
		file.writeFile(name, body, function () {
			console.log("【爬取完成】" + op.url);
		});
	});
} 

module.exports = (function () {
	return {
		saveFile: saveFile
	}
})();