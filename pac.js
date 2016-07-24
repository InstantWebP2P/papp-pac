/* Copyright(c) 2015 Tom Zhou <iwebpp@gmail.com>
 * MIT Licensed
 */

var http = require('http');
var fs = require('fs');


// check arguments
if (process.argv.length < 7)
	throw new Error('Invalud pac cli');

var pacPort   = (process.argv[2] && parseInt(process.argv[2])) || 51888;
var prxyPort  = (process.argv[3] && parseInt(process.argv[3])) || 52007;
var scksPort  = (process.argv[4] && parseInt(process.argv[4])) || 52008;
var prxyPort1 = (process.argv[5] && parseInt(process.argv[5])) || 53007;
var scksPort1 = (process.argv[6] && parseInt(process.argv[6])) || 53008;

// 3.
// start pac server

// pac server
var rawstr = fs.readFileSync(__dirname+'/auto.pac').toString('utf-8');

// fill http proxy server
var pacstr = rawstr.replace(/proxy_port/gi, ''+prxyPort);
pacstr = pacstr.replace(/socks_port/gi, ''+scksPort);

// fill httpp forward server
pacstr = pacstr.replace(/proxy_httpp_port/gi, ''+prxyPort1);
pacstr = pacstr.replace(/socks_httpp_port/gi, ''+scksPort1);

///console.log('pacstr: '+pacstr);
var pacsrv = http.createServer(function(req, res){
	res.writeHead(200, {'Content-Type': 'application/x-ns-proxy-autoconfig'});
	res.end(pacstr);
});

pacsrv.listen(pacPort);
console.log('pac server listening on '+pacPort);