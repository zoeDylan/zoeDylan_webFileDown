var
    http = require('http'),
	url = require('url'),
		express = require('express'),
		app = express(),
	fileDown = require('./server/fileDown.js');

//fileDown.saveFile("http://www.duomi.com/third-getfile2?id=27412322-206975532", __dirname + '/upload/');
//fileDown.saveFile("http://192.168.0.160/index.html", __dirname + '/upload/');  
app.get(/.+/, function (req, res) {
	fileDown.saveFile({
		url: req.query.url,
		name: req.query.name
	});
});

//服务器
var httpServer = http.createServer(app);

//启动监听
httpServer.listen(3000, function () {
	console.warn('【服务器已启动(端口:3000)】');
});
