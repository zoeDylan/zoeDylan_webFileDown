var
    http = require('http'),
	url = require('url'),
	express = require('express'),
	app = express(),
	fileDown = require('./server/fileDown.js');

app.get(/.+/, function (req, res) {
	fileDown.saveFile({
		url: req.query.url,
		name: req.query.name
	}, function (data) {
		
	});
});

//服务器
var httpServer = http.createServer(app);

//启动监听
httpServer.listen(3000, function () {
	console.warn('【服务器已启动(端口:3000)】');
});
