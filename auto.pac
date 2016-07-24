// 1.
// iWebPP.io vURL will go through proxy

// both vHost and vPath
var regex_vboth = /((([0-9]|[a-f]){32}-)*([0-9]|[a-f]){32}\.vurl\.)|(\/vurl\/([0-9]|[a-f]){32}(-([0-9]|[a-f]){32})*)/;

// 2.
// HTTPP(http over udt over udp) enabled sites
var httpp_sites = [
    'iwebpp.com',
    'ruyier.com',
    '51dese.com',
    'anyany.me',
];

function checkHttpp(url, host) {
	for (var i = 0; i < httpp_sites.length; i ++) {
		if (host && host.match(httpp_sites[i])) return true;
		if (url  &&  url.match(httpp_sites[i])) return true;
	}

	return false;
}

function FindProxyForURL(url, host) {
	// 1.
	// check iWebPP.io vURL sites
	if (url.match(regex_vboth)) {
		// ftp site prefer socks5 proxy
		if (url.match("ftp:")) {
			return "SOCKS5 127.0.0.1:socks_port;";
		}

		// http/ws site prefer socks5 proxy
		if (url.match("http:") || url.match("ws:")) {
			return "SOCKS5 127.0.0.1:socks_port;PROXY 127.0.0.1:proxy_port;";
		}

		// https/wss site prefer http proxy
		if (url.match("https:") || url.match("wss:")) {
			return "PROXY 127.0.0.1:proxy_port;SOCKS5 127.0.0.1:socks_port;";
		}
	} else {
		// 2.
		// check httpp enabled sites
		if (checkHttpp(url, host)) {
			// ftp site prefer socks5 proxy
			if (url.match("ftp:")) {
				return "SOCKS5 127.0.0.1:socks_httpp_port;";
			}

			// http/ws site prefer socks5 proxy
			if (url.match("http:") || url.match("ws:")) {
				return "SOCKS5 127.0.0.1:socks_httpp_port;PROXY 127.0.0.1:proxy_httpp_port;";
			}

			// https/wss site prefer http proxy
			if (url.match("https:") || url.match("wss:")) {
				return "PROXY 127.0.0.1:proxy_httpp_port;SOCKS5 127.0.0.1:socks_httpp_port;";
			}
		} else {
			return "DIRECT";
		}
	}
}
