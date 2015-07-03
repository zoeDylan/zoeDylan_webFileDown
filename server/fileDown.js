
var request = require('request'),
    fs = require('fs');



function saveFile(op) {
	op = {
		url: op.url || op,
		name: op.name || ''
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
			name = host + '/' + ('【' + op.name + '】' + uri.pathname.replace(/[^.\w]/g, '-'));
		if (!fs.existsSync(host)) {
			fs.mkdirSync(host);
		}
		save(name, body);
		console.log("【爬取完成】" + op.url);
	});
}

//保存文件
function save(path, cont) {
	fs.writeFile(path, cont);
}

module.exports = (function () {
	return {
		saveFile: saveFile
	}
})();