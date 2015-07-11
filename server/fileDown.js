var request = require('request'),
    fs = require('fs'),
	file = require('zoeDylan-tool').file,
	config = {
		maxDown: 3,
		nowDown: 0,
		stop: false,
		num: 0,
		list: [],
		errorList: []
	},
	configPath = './config.json';

/*
 * 存储网络文件
 * <op{array||object},callback{function(data)}>
 */
function downFile() {
	if (config.nowDown >= config.maxDown) {
		return false;
	} else if ((config.list.length - 1) == config.num) {
		console.log('已全部推送到下载队列！');
		return false;
	}
	var
		op = config.list[config.num + config.nowDown];
	config.nowDown += 1;
	if (!op) { config.nowDown -= 1; return false; }
	//下载
	console.log('正在下载：【' + op.id + '/' + config.list.length + '】--------队列中【' + config.nowDown + '/' + config.maxDown + '】');
	console.log(' ');
	request(op.url, { encoding: null }, function (error, response, body) {
		config.nowDown -= 1;
		config.num += 1;
		if (error) {
			op.error = true;
			console.log('下载失败：【' + op.id + '/' + config.list.length + '】--------队列中【' + config.nowDown + '/' + config.maxDown + '】');
		} else {
			op.loading = true;
			op.path = process.cwd() + '/upload/【' + op.id+ '】' + op.name + '_' + response.request.uri.pathname.replace(/[^.\w]/g, '-');
			fs.writeFileSync(op.path, body);
			console.log('下载完成：【' + op.id + '/' + config.list.length + '】--------队列中【' + config.nowDown + '/' + config.maxDown + '】');
			console.log(' ');
		}
		if (config.num >= config.list.length) {
			console.log('已全部下载完成。');
		}
		saveConfig();
		downFile();
	});
	downFile();
}
/*
 * 读取配置文件
 */
function readConfig() {
	if (!fs.existsSync(configPath)) {
		fs.writeFileSync(configPath, JSON.stringify(config))
	}
	config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));
}
/*
 * 保存配置文件
 */
function saveConfig(path) {
	path = path || configPath;
	fs.writeFileSync(path, JSON.stringify(config));
}
/*
 * 添加配置
 */
function addConfig(op) {
	op = op ? typeof op == 'object' ? op : JSON.parse(op) : false;
	if (op.length) {
		for (var i = 0; i < op.length; i++) {
			var
				item = op[i];
			addConfig(item);
		}
	} else if (op) {
		//处理数组
		config.list[config.list.length] = {
			id: (config.list.length + 1),
			name: op.name,
			url: op.url,
			fUrl: op.fUrl,
			path: null,
			loading: false,
			error: false
		};
	}
	downFile();
	saveConfig();
	return op.length;
}

/*
 * 备份
 */
function backups() {
	saveConfig('./backups/config.json-' + new Date().getTime());
}

readConfig();
downFile();


module.exports = {
	addConfig: addConfig
}

process.on('exit', function () {
	config.nowDown = 0;
	saveConfig();
	console.log('关闭');
})