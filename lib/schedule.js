var qs = require('querystring');

// 发送html响应
exports.sendHtml = function (res, html) {
	// @notice 要在返回头里加charset=utf-8，否则显示出来乱码
	res.setHeader('Content-Type', 'text/html;charset=utf-8');
	res.setHeader('Content-Length', Buffer.byteLength(html));
	res.end(html);
};

// 解析http post数据
exports.parseReceivedData = function (req, callback) {
	var body = '';
	req.setEncoding('utf8');
	req.on('data', function (chunk) {
		body += chunk;
	});
	req.on('end', function () {
		// 将传过来的字符串解析成对象
		var data = qs.parse(body);
		callback(data);
	});
}
// mysql增删改查
exports.add = function (db, req, res) {
	exports.parseReceivedData(req, function (work) {
		db.query(
			'INSERT INTO work(hours, date, description) VALUES(?, ?, ?)',
			[work.hours, work.date, work.description],
			function (err) {
				if (err) {
					throw err;
				}
				// 给用户显示工作清单
				exports.show(db,res);
			}
		);
	});
};

exports.delete = function (db, req, res) {
	exports.parseReceivedData(req, function (work) {
		db.query(
			'DELETE FROM work WHERE id=?',
			[work.id],
			function (err) {
				if (err) {
					throw err;
				}
				exports.show(db, res);
			}
		);
	});
};

exports.archive = function (db, req, res) {
	exports.parseReceivedData(req, function (work) {
		db.query(
			'UPDATE work SET archived=1 WHERE id=?',
			[work.id],
			function (err) {
				if (err) {
					throw err;
				}
				exports.show(db, res);
			}
		);
	});
};

exports.show = function (db, res, showArchived) {
	var query = 'SELECT * FROM work WHERE archived=? ORDER BY date DESC';
	var archiveValue = (showArchived) ? 1 : 0;
	db.query(
		query,
		[archiveValue],
		function (err, rows) {
			if (err) {
				throw err;
			}
			html = (showArchived)
				? '<a href="/">查看未完成的记录</a><br />'
				: '<a href="/archive">查看已完成的记录</a><br />';
			// 将结果格式化为html
			html += exports.workHitlistHtml(rows);
			html += exports.workFormHtml();
			// 给用户发送html响应
			exports.sendHtml(res, html);
		}
	)
};

exports.showArchived = function (db, res) {
	// 只显示归档的工作记录
	exports.show(db, res, true);
}

// 将工作记录渲染为html表格
exports.workHitlistHtml = function (rows) {
	var html = '<table>';
	for (var i =0; i < rows.length; i++) {
		html += '<tr>';
		html += '<td>' + rows[i].date + '</td>';
		html += '<td>' + rows[i].hours + '</td>';
		html += '<td>' + rows[i].description + '</td>';
		// 如果工作记录没归档，显示归档按钮
		if (!rows[i].archived) {
			html += '<td>' + exports.workArchiveForm(rows[i].id) + '</td>';
		}
		html += '<td>' + exports.workDeleteForm(rows[i].id) + '</td>';
		html += '</tr>'
	}
	html += '</table>';
	return html;
};

// 添加、归档、删除表单
// 新工作记录的空白表单
exports.workFormHtml = function () {
	var html = '<form method="POST" action="/">'
		+ '<p>Date (YYYY-MM-DD):<br /><input name="date" type="text" /></p>'
		+ '<p>Hours worked:<br /><input name="hours" type="text" /></p>'
		+ '<p>Description:<br /></p>'
		+ '<textarea name="description"></textarea>'
		+ '<input type="submit" value="add" />'
		+ '<form>';
	return html;
};

// 归档按钮表单
exports.workArchiveForm = function (id) {
	return exports.actionForm(id, '/archive', 'Archive');
};

// 删除按钮表单
exports.workDeleteForm = function (id) {
	return exports.actionForm(id, '/delete', 'Delete');
};

// 渲染简单的按钮表单
exports.actionForm = function (id, path, lable) {
	var html = '<form method="POST" action="' + path + '">'
		+ '<input type="hidden" name="id" value="' + id + '" />'
		+ '<input type="submit" value="' + lable + '" />'
		+ '</form>';
	return html;
}
