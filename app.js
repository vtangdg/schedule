var http = require('http');
var schedule = require('./lib/schedule');
var mysql = require('mysql');

// 连接mysql
var db = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password: 'root',
	database: 'timetrack'
});

// 路由
var server = http.createServer(function (req, res) {
	switch (req.method) {
		// post请求
		case 'POST':
			switch (req.url) {
				case '/':
					schedule.add(db, req, res);
					break;
				case '/archive':
					schedule.archive(db, req, res);
					break;
				case '/delete':
					schedule.delete(db, req, res);
					break;
			}
			break;
		// get请求
		case 'GET':
			switch (req.url) {
				case '/':
					schedule.show(db, res);
					break;
				case '/archive':
					schedule.showArchived(db, res);
					break;
			}
			break;
	}
});

// 如果不存在的话，创建work表
db.query(
	'CREATE TABLE IF NOT EXISTS work ('
	+ 'id INT(10) NOT NULL AUTO_INCREMENT,'
	+ 'hours DECIMAL(5,2) DEFAULT 0,'
	+ 'date DATE,'
	+ 'archived INT(1) DEFAULT 0,'
	+ 'description LONGTEXT,'
	+ 'PRIMARY KEY(id))',
	function (err) {
		if (err) {
			throw err;
		}
		console.log("server started");
		server.listen('3000');
	}
);