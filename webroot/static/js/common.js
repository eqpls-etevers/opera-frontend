window.common = window.common || {};
window.common.init = (main) => {

	// common definitions ////////////////////////////
	window.common.env = {};
	window.common.util = {};
	window.common.auth = {};
	window.common.rest = {};
	window.common.wsock = {};
	window.common.data = {};
	window.common.term = {};

	// tenant configurations //////////////////////////
	window.common.env.tenant = "opera";
	window.common.env.endpoint = "portal.sddc.lab";
	window.common.env.isDataService = true;
	window.common.env.isTermService = true;

	// tenant post configurations /////////////////////
	window.common.env.url = `https://${window.common.env.endpoint}`;

	// login handlers
	window.common.auth.loginMiddleWare = async () => {
		console.log("bypass login middleware");
	};

	window.common.auth.logoutMiddleWare = async () => {
		console.log("bypass logout middleware");
	};

	window.common.auth.loginSuccess = async () => {
		console.log("login success");
	};

	window.common.auth.loginError = async (error) => {
		console.error(error);
	};

	// window.common.util /////////////////////////////
	window.common.util.parseQueryToMap = (query) => {
		let map = {};
		query.replace("?", "").split("&").forEach((q) => {
			let kv = q.split("=");
			map[kv[0]] = kv[1];
		});
		return map;
	};

	window.common.util.getCookie = (name) => {
		var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
		return value ? value[2] : null;
	};

	window.common.util.setCookie = (name, value, expire) => {
		if (!expire) { expire = 3600; }
		var date = new Date();
		date.setTime(date.getTime() + expire * 1000);
		document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
	};

	window.common.util.delCookie = (name) => {
		document.cookie = name + '=; expires=Thu, 01 Jan 1999 00:00:10 GMT;';
	};

	// window.common.auth /////////////////////////////
	window.common.auth.url = `${window.common.env.url}/auth`;

	window.common.auth.setOrg = (org) => {
		if (org) { window.common.auth.org = org; }
		else { window.common.auth.org = window.common.env.tenant; }
		return window.common.auth.org;
	};

	window.common.auth.getOrg = () => {
		if (window.common.auth.org) { return window.common.auth.org; }
		return window.common.auth.setOrg();
	};

	//// window.common.auth login library /////////////
	window.common.auth.login = (redirectUri) => {
		let onLogin = window.common.util.getCookie("EQPLS_ON_LOGIN");
		window.common.util.setCookie("EQPLS_ON_LOGIN", "TRUE");
		let keycloak = new Keycloak({
			url: window.common.auth.url,
			realm: window.common.auth.getOrg(),
			clientId: window.common.env.tenant
		});
		keycloak.onAuthSuccess = () => {
			window.common.auth.keycloak = keycloak;
			window.common.auth.postLogin = () => {
				window.common.auth.accessToken = window.common.auth.keycloak.token;
				window.common.auth.refreshToken = window.common.auth.keycloak.refreshToken;
				window.common.auth.idToken = window.common.auth.keycloak.idToken;
				window.common.auth.bearerToken = `Bearer ${window.common.auth.accessToken}`
				window.common.auth.headers = {
					"Authorization": window.common.auth.bearerToken,
					"Content-Type": "application/json; charset=utf-8",
					"Accept": "application/json; charset=utf-8"
				};
				return window.common.auth.loginMiddleWare().then(window.common.auth.checkUserInfo);
			};
			window.common.auth.postLogin().then(() => {
				window.common.util.delCookie("EQPLS_ON_LOGIN");
				window.common.auth.loginSuccess().then(window.common.auth.startTokenDaemon);
			});
		};
		keycloak.onAuthError = () => {
			window.common.util.delCookie("EQPLS_ON_LOGIN");
			window.common.auth.loginError();
		};
		keycloak.init({
			//onLoad: onLogin ? "check-sso" : "login-required",
			onLoad: "login-required",
			redirectUri: redirectUri ? redirectUri : "/"
		});
	};

	window.common.auth.logout = (redirectUri) => {
		window.common.auth.logoutMiddleWare().then(() => {
			window.common.auth.keycloak.logout({
				redirectUri: redirectUri ? redirectUri : "/"
			}).catch((error) => {
				console.error(error);
				window.location.replace("/");
			});
		}).catch((error) => {
			console.error(error);
		});
	};

	window.common.auth.checkUserInfo = async () => {
		return fetch(`/auth/realms/${window.common.auth.getOrg()}/protocol/openid-connect/userinfo`, {
			headers: window.common.auth.headers
		}).then((res) => {
			if (res.ok) { return res.json(); }
			throw res
		}).then((userInfo) => {
			window.common.auth.username = userInfo.preferred_username;
			window.common.auth.userInfo = userInfo;
		});
	};

	window.common.auth.startTokenDaemon = () => {
		window.common.auth.keycloak.updateToken(5).then((refreshed) => {
			if (refreshed) { window.common.auth.postLogin(); }
			setTimeout(window.common.auth.startTokenDaemon, 60000);
		});
	};

	// window.common.rest /////////////////////////////
	window.common.rest.get = async (url) => {
		return fetch(url, {
			headers: window.common.auth.headers
		}).then((res) => {
			if (res.ok) { return res.json(); }
			throw res
		});
	};

	window.common.rest.post = async (url, data) => {
		return fetch(url, {
			method: "POST",
			headers: window.common.auth.headers,
			body: JSON.stringify(data)
		}).then((res) => {
			if (res.ok) { return res.json(); }
			throw res
		});
	};

	window.common.rest.put = async (url, data) => {
		return fetch(url, {
			method: "PUT",
			headers: window.common.auth.headers,
			body: JSON.stringify(data)
		}).then((res) => {
			if (res.ok) { return res.json(); }
			throw res
		});
	};

	window.common.rest.patch = async (url, data) => {
		return fetch(url, {
			method: "PATCH",
			headers: window.common.auth.headers,
			body: JSON.stringify(data)
		}).then((res) => {
			if (res.ok) { return res.json(); }
			throw res
		});
	};

	window.common.rest.delete = async (url) => {
		return fetch(url, {
			method: "DELETE",
			headers: window.common.auth.headers
		}).then((res) => {
			if (res.ok) { return res.json(); }
			throw res
		});
	};

	// window.common.wsock ////////////////////////////
	window.common.wsock.connect = (url, receiver, initiator, closer) => {
		let socket = new WebSocket(`wss://${window.common.env.endpoint}${url}`);
		socket.sendData = (key, value) => { socket.send(JSON.stringify([key, value])) };
		socket.onmessage = (event) => { receiver(event.target, event.data); };
		socket.onerror = (event) => { console.log("wsock:error"); };
		socket.onopen = (event) => {
			console.log("wsock:open");
			event.target.sendData("auth", {
				org: window.common.auth.getOrg(),
				token: window.common.auth.accessToken
			});
			if (initiator) { initiator(event.target); }
		};
		socket.onclose = (event) => {
			console.log("wsock:close");
			if (closer) { closer(event); }
		};
		return socket;
	};

	if (main) { main(); }

}; // window.common.init finished
