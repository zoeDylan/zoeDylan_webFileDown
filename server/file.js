var
	fs = require('fs'),
	process = require('child_process');

/*
 *保存文件
 * <path,cont[,callback]> 
 */
function writeFile(path, cont, callback) {
	if (typeof (callback) == 'function') {
		fs.writeFile(path, cont, function (err, data) {
			callback(err);
		});
	} else {
		return fs.writeFileSync(path, cont);
	}
}

/*
 *保存文件
 * <path[,callback]> 
 */
function readFile(path, callback) {
	if (typeof (callback) == 'function') {
		fs.readFile(path, function (err, data) {
			callback(err, data);
		});
	} else {
		return fs.readFileSync(path);
	}
}

//创建路径,不存在自动创建
//传入路径必须：'/'或者'\\'
function createDir(path, callback) {
	path = path.replace(/\/$||\\$/g, '');
	console.log('文件夹创建！' + path);
	if (typeof callback == 'function') {
		process.exec('md ' + path.replace(/\//g, '\\'), function (err, out, stderr) {
			callback(err, out, stderr);
		});
	} else {
		return process.execSync('md ' + path.replace(/\//g, '\\'));
	}
	//fs.mkdirSync(path);
}

//删除路径
//kill：是否强制删除
function removeDir(path, kill, callback) {
	var
		com = kill ? 'rd/s/q' : 'rd';
	process.exec(com + path.replace(/\//g, '\\'), function (err, out, stderr) {
		if (err) {
			console.log('文件夹删除失败！');
		} else {
			console.log('文件夹删除成功！');
		}
	});
	//fs.rmdirSync(path);
}
module.exports = (function () {
	return {
		writeFile: writeFile,
		readFile: readFile,
		createDir: createDir,
		removeDir: removeDir
	}
})();