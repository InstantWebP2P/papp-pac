/* papp browser for peer apps
 * Copyright(c) 2015 Tom Zhou <iwebpp@gmail.com>
 * MIT Licensed
 */

var exec = require('child_process').exec,
	fork = require('child_process').fork,
    child;
var http = require('http');
var fs = require('fs');
var socks = require('socks5');
var freeport = require('freeport');
var os = require('os'); 


var forwardProxy = require('forward-proxy');
var httppForward = require('httpp-forward');

// prompt user key
var readline = require('readline');

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.question('Please enter your user key:', function(answer) {
	var userkey = answer && answer.trim();
	
	console.log('You just typed: '+userkey);
	console.log('\nPlease waiting seconds and Chrome will show up ...... \n');

	rl.close();

	var prxySrv = new forwardProxy({
		endpoints: [{ip: 'iwebpp.com', port: 51686}, {ip: 'iwebpp.com', port: 51868}],
		turn: [{ip: 'iwebpp.com', agent: 51866, proxy: 51688}],

		usrkey: userkey, 
		secmode: 'acl', 
		sslmode: 'srv', // only authenticate server
		access_local: true // allow acces to local export
	}, function(err, proxy){
		if (err || !proxy) {
			console.log(err+',create proxy failed');
			return 
		}

		// query export sevice once
		prxySrv.queryExport(function(err, srv){
			if (err || !srv) {
				console.log('No available export service, please run export service in advance');
			} else {
				console.log('%d available export services', Object.keys(srv).length);
			}

			// turn on export service query timer
			prxySrv.turnQuerytimer(true);

			var importApp = proxy.importApp;

			// 1.
			// get free tcp port
			freeport(function(err, prxyPort) {
				if (err) throw new Error(err+', get proxy port failed');

				// 2.
				// start http proxy service
				var pxySrv = http.createServer();

				pxySrv.on('request', importApp.httpApp.proxy);
				pxySrv.on('connect', importApp.httpApp.tunnel);

				pxySrv.listen(prxyPort, function() {
					console.log('Http proxy server listen on port '+prxyPort);

					freeport(function(err, scksPort) {
						if (err) throw new Error(err+', get socks port failed');

						// 2.1
						// start socks proxy service
						var sockspxySrv = socks.createServer(importApp.socksApp);

						sockspxySrv.listen(scksPort, function() {

							sockspxySrv.on('error', function (e) {
								console.error('SERVER ERROR: %j', e);
							});
							console.log('Socks proxy server listen on port '+scksPort);

							// 3.
							// start httpp-forward proxy server for httpp enabled sites
							var httppPrxy = new httppForward(function(err, proxy1){
							    if (err || !proxy1) {
							        console.log(err+',create httpp forward proxy failed');
							        return 
							    }

							    // 3.1
							    // start http forward proxy service
							    freeport(function(err, prxyPort1) {
							    	if (err) throw new Error(err+', get httpp proxy port failed');

							    	var pxySrv1 = http.createServer();

							    	pxySrv1.on('request', proxy1.httpProxy);
							    	pxySrv1.on('connect', proxy1.httpTunnel);

							    	pxySrv1.listen(prxyPort1, function() {
							    		console.log('Httpp-forward proxy server listen on port '+prxyPort1);

							    		// 3.2
							    		// start httpp socks forward proxy service
							    		freeport(function(err, scksPort1) {
							    			if (err) throw new Error(err+', get httpp socks port failed');

							    			var sockspxySrv1 = socks.createServer(proxy1.socksProxy);

							    			sockspxySrv1.listen(scksPort1, function() {
							    				sockspxySrv1.on('error', function (e) {
							    					console.error('httpp SERVER ERROR: %j', e);
							    				});
							    				console.log('Httpp-forward socks server listen on port '+scksPort1);

							    				// 5.
							    				// start pac server
							    				freeport(function(err, pacPort) {
							    					if (err) throw new Error(err+', get pac port failed');


							    					// pac server
							    					var rawstr = fs.readFileSync(__dirname+'/auto.pac').toString('utf-8');
							    					
							    					// fill http proxy server
							    					var pacstr = rawstr.replace(/proxy_port/gi, ''+prxyPort);
							    					pacstr = pacstr.replace(/socks_port/gi, ''+scksPort);
							    					
							    					// fill httpp-forward server
							    					pacstr = pacstr.replace(/proxy_httpp_port/gi, ''+prxyPort1);
							    					pacstr = pacstr.replace(/socks_httpp_port/gi, ''+scksPort1);
							    					
							    					///console.log('pacstr: '+pacstr);
							    					var pacsrv = http.createServer(function(req, res){
							    						res.writeHead(200, {'Content-Type': 'application/x-ns-proxy-autoconfig'});
							    						res.end(pacstr);
							    					});

							    					pacsrv.listen(pacPort, function() {
							    						console.log('pac server listening on '+pacPort);

							    						/*var pac = fork('./pac.js', [pacPort, prxyPort, scksPort, prxyPort1, scksPort1]);
							    								pac.on('exit', function(code){
							    									console.log('pac server exited '+code);
							    									// exit main program
							    									process.exit(code);
							    								});*/
							    					});
							    				});
							    			});
							    		});
							    	});
							    });
							});													
						});
					});
				});
			});
		});
	});
});
