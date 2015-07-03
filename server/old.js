var
	request = require('request'),
    iconv = require('iconv-lite'),
    BufferHelper = require('bufferhelper'),
    $ = require('cheerio'),
    http = require('http'),
    fs = require('fs'),
    config = './settings.json',
    q = require('queue')(),
    email = require('./mail.js');

/*
 * 爬虫核心
 * <id,fn(data),end(data)>
 * id:配置文件id或者配置
 * fn<data{message}>:每一个配置完成后的执行方法
 * end<data{message}>所有配置全部完成后的执行方法
 */
function reset(id, fn, end) {
	readConfig();
	var op = (typeof (id) == 'object') && id ? id : (typeof (fn) == 'object') && fn ? fn : (typeof (id) == 'number') ? [config.reptile[parseInt(id)]] : config.reptile;
	fn = (typeof (fn) == 'function') && fn ? fn : (typeof (id) == 'function') ? id : function () { };
	end = funcDispost(end);
	config.temp = [];
	//转码
	function transcoding(cont, op) {
		return iconv.decode(new BufferHelper().concat(cont).toBuffer(), op.encoding || 'utf-8');
	}

	//处理数据，逻辑循环
	function dispose(op, body) {
		var
			cont = [],
            body = $(body),
            num = op.selector.length;
		$(op.selector).each(function () {
			var
				nowConfig = this,
                all = $(body.find(nowConfig.elem)),
                temp = [],
                detection = function (data) {
                	//是否为空值
                	if (!data.title || !data.url) { return false; }
                		//是否存在重复
                	else if (temp.indexOf(data.url) > -1) { return false; }
                		//a标签是javascript:;
                	else if (data.url.search(/javascript/) > -1) { return false; }
                	else { temp[temp.length] = data.url; return true; }
                };
			//a标签循环
			$(all).each(function () {
				var
					elem = $(this);
				if (!elem.attr('href')) {
					return false;
				}
                  var  nowCont = {
                    	url: elem.attr('href').replace(/^\s|\s$/, ""),
                    	title: iconv.encode(elem.html(), 'utf-8').toString('UTF-8'),
                    	fUrl: op.url,
                    	place: nowConfig.elem,
                    	desc: nowConfig.desc,
                    	time: new Date().toLocaleString(),
                    	name: op.name
                    };
				if (detection(nowCont)) {
					//图片处理
					var
                            img = $(elem.children('img'));
					if (img.length > 0) {
						img.attr('src', img.attr(nowConfig.img || 'src')).css({ 'max-width': '120px', 'max-height': '90px' }).removeAttr('width').removeAttr('height');
						nowCont.title = iconv.encode(elem.html(), 'utf-8').toString('UTF-8');
						nowCont.title = nowCont.title + (elem.attr('title') && elem.attr('title').length > 0 ? elem.attr('title') : img.attr('alt'));
					}
					cont[cont.length] = nowCont;
					config.temp[config.temp.length] = nowCont;
				}
			});
		});
		return cont;
	}

	//URL处理 消息推送
	function urlDispose(op, cb) {
		console.warn("【页面爬取】" + op.url);
		fn({
			message: "【页面爬取】" + op.url
		});
		request({ url: op.url, encoding: null }, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var cont = dispose(op, transcoding(body, op));
				console.warn("【已更新】" + op.url + "[" + cont.length + "]");
				fn({
					message: "【已更新】" + op.url + "[" + cont.length + "]"
				});
				cb();
			} else {
				fn({
					message: "【出错】" + error + '||' + op.url,
				});
				cb(err);
				console.log("【出错】" + error + '||' + op.url);
			}
		});
	}

	$(op).each(function () {
		var opt = this;
		q.push(function (cb) {
			urlDispose(opt, cb);
		});
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

//邮件发送
function sendMail(fn) {
	fn = funcDispost(fn);
	if (!config.setting.mail.send) {
		console.warn("【邮件发送未启用】");
		fn("【邮件发送未启用】");
		return false;
	}
	console.warn("【邮件发送已启用】");
	fn("【邮件发送已启用】");
	var
        cont = "",
        emails = [],
		template = function (obj) {
			var
				html = config.setting.mail.template,
				method = html.match(/{{(\w+)}}/g);
			for (var i = 0; i < method.length; i++) {
				var
					val = method[i],
					newVal = obj[val.replace(/{{|}}/g, '')];
				html = html.replace(val, newVal);
			}
			return html;
		};
	for (var i = 0; i < config.temp.length; i++) {
		var
            val = config.temp[i];

		cont += template({
			name: val.name || val.fUrl,
			desc: val.desc,
			url: val.url,
			title: val.title
		});
	}
	for (var i = 0; i < config.setting.mail.receive.length; i++) {
		emails[i] = config.setting.mail.receive[i].email
	}
	//console.warn(cont);
	email.sendMail({
		title: "test",
		content: cont,
		email: emails,
		auth: config.setting.mail.auth
	}, fn);
}

//function处理
function funcDispost(fn) {
	return (typeof (fn) == 'function') ? fn : function () { };
}

/*
 * 读取爬虫数据
 * <id,fn>
 * id:配置列表id号
 * fn完成后执行的方法
 */
function dataset(id, fn) {
	var
        cont = readFile(config.setting.dataPath + config.setting.jsonData);
	readConfig();
	if (config.temp.length <= 0 && cont) { config.temp = JSON.parse(cont); } else { cont = []; }
	fn(config.temp);
}

//获取配置文件
function readConfig() {
	//获取配置文件 
	config = readFile((typeof (config) != 'string') ? config.setting.path : config);
	config = config ? JSON.parse(config) : {
		//爬虫匹配
		"reptile": [{
			"url": "http://cd.qq.com/",
			"selector": [{
				"elem": "#fsD1 a",
				"desc": "轮播位"
			}],
			"encoding": "gbk",
			"name": "大成网(腾讯新闻)",
			"getPage": false
		}],
		//设置
		"setting": {
			//配置文件位置
			"path": "./settings.json",
			//数据保存文件夹位置
			"dataPath": "./db/",
			//json数据文件
			"jsonData": "reptile.data.json",
			//自动爬取
			"autoReptile": false,
			//管理员信息
			"admin": {
				//管理员地址
				"url": "/admin",
				//管理员姓名
				"name": "",
				//管理员钥匙 
				"key": ""
			},
			//邮件发送
			"mail": {
				//是否启用
				"send": false,
				//邮件接收人数组
				"receive": [
                {
                	"name": "",
                	"email": ""
                }
				],
				//邮件发送人
				"auth": {
					//邮箱(有点不合理,后期改)
					"name": "",
					//密码
					"key": ""
				},
				//邮件模版
				template: "<p style='margin:10px 0;'>【{{name}}】<b>[{{desc}}]</b><a style='margin-left:20px;' href='{{url}}'>{{title}}</a></p>"
			}
		}
	}
	config.temp = config.temp || [];
}

//保存配置文件
function saveConfig() {
	saveFile(config.setting.path, JSON.stringify(config));
}

//保存数据
function saveData() {
	saveFile(config.setting.dataPath + config.setting.jsonData, JSON.stringify(config.temp));
}

//读取文件
function readFile(path) {
	if (fs.existsSync(path)) {
		return fs.readFileSync(path, { encoding: 'utf-8' });
	} else {
		console.warn("【文件不存在】" + path);
		return false;
	}
}
//配置文件设置
function setting(op, fn) {
	fn = funcDispost(fn);
	readConfig();
	if (op) {
		var
			message = "配置修改成功!",
			tempConfig = {
				userKey: config.setting.admin.key,
				emailKey: config.setting.mail.auth.key
			};
		config = op;
		config.setting.mail.template = config.setting.mail.template.replace(/\"/g, '\'');
		if (config.setting.admin.name.length > 0 && config.setting.admin.key.length <= 0) {

			config.setting.admin.key = tempConfig.userKey;
		}

		if (config.setting.mail.auth.email.length > 0 && config.setting.mail.auth.key.length <= 0) {
			config.setting.mail.auth.key = tempConfig.emailKey;
		}

		saveConfig();
		fn({
			state: true,
			message: message,
			data: {
				setting: config.setting,
				reptile: config.reptile
			}
		});
	} else {
		fn({
			data: {
				setting: config.setting,
				reptile: config.reptile
			},
			type: 'get',
			state: true,
			message: "配置获取成功！"
		});
	}
}

module.exports = (function () {
	readConfig();
	if (config.setting.autoReptile) { reset(); }
	return {
		dataset: dataset,
		reset: reset,
		sendMail: sendMail,
		readConfig: function () { readConfig(); return config; },
		setting: setting
	}
})();

