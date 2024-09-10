window.common = window.common || {
	init: (main) => {
		console.log("(window.common) start");

		// common definitions ////////////////////////////
		window.common.url = `https://${window.config.endpoint}`;
		window.common.util = {};
		window.common.auth = {};
		window.common.rest = {};
		window.common.wsock = {};

		// post configurations /////////////////////


		// login handlers
		window.common.loginServiceProviders = async () => { };
		window.common.logoutServiceProviders = async () => { };

		// window.common.util /////////////////////////////
		window.common.util.parseQueryToMap = (query) => {
			let map = {};
			query.replace("?", "").split("&").forEach((q) => {
				if (q) {
					let kv = q.split("=");
					map[kv[0]] = kv[1];
				}
			});
			return map;
		};
		window.common.util.getQueryMap = () => {
			return window.common.util.parseQueryToMap(window.location.search);
		};

		window.common.util.parseHashToMap = (hash) => {
			let map = {};
			hash.replace("#", "").split("&").forEach((h) => {
				if (h) {
					let kv = h.split("=");
					map[kv[0]] = kv[1];
				}
			});
			return map;
		};
		window.common.util.getHashMap = () => {
			return window.common.util.parseHashToMap(window.location.hash);
		};

		window.common.util.getCookie = (name) => {
			let value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
			return value ? value[2] : null;
		};

		window.common.util.setCookie = (name, value, expire, path) => {
			if (!expire) { expire = 3600; }
			if (!path) { path = "/"; }
			var date = new Date();
			date.setTime(date.getTime() + expire * 1000);
			document.cookie = `${name}=${value};expires=${date.toUTCString()};path=${path}`;
		};

		window.common.util.delCookie = (name, path) => {
			if (!path) { path = "/"; }
			document.cookie = `${name}=;expires=Thu, 01 Jan 1999 00:00:10 UTC;path=${path}`;
		};

		window.common.util.setArrayFunctions = (arr, obj) => {
			arr.len = () => { return arr.length; };
			arr.empty = () => {
				if (arr.len() == 0) { return true; }
				else { return false; }
			};
			arr.findById = (id) => {
				arr.forEach((content) => { if (id == content.id) { return content; } });
				return None
			};
			arr.searchByName = (name) => {
				let result = [];
				arr.forEach((content) => { if (content.name.indexOf(name) > -1) { result.push(content); } });
				return setArrayFunctions(result, arr.obj);
			};
			arr.searchByField = (field, value) => {
				let result = [];
				arr.forEach((content) => { if (value == content[field]) { result.push(content); } });
				return setArrayFunctions(result, arr.obj);
			};
			arr.sortAscBy = (field) => {
				if (!arr.empty()) {
					let val = arr[0][field]
					if (typeof val == "string") {
						arr.sort((a, b) => {
							let aval = a[field];
							let bval = b[field];
							return aval < bval ? -1 : aval > bval ? 1 : 0;
						});
					} else if (typeof val == "number") {
						arr.sort((a, b) => { return a[field] - b[field]; });
					} else {
						console.error("could not sort", arr);
					}
				}
				return arr;
			};
			arr.sortDescBy = (field) => {
				if (!arr.empty()) {
					let val = arr[0][field]
					if (typeof val == "string") {
						arr.sort((a, b) => {
							let aval = a[field];
							let bval = b[field];
							return aval > bval ? -1 : aval < bval ? 1 : 0;
						});
					} else if (typeof val == "number") {
						arr.sort((a, b) => { return b[field] - a[field]; });
					} else {
						console.error("could not sort", arr);
					}
				}
				return arr
			};
			arr.print = () => {
				if (arr.empty()) { console.log(`${arr.obj.name}s is empty array`); }
				else { console.log(`${arr.obj.name}s`, arr); }
			};
			arr.obj = obj;
			return arr;
		};

		// window.common.auth /////////////////////////////
		window.common.auth.url = `${window.common.url}/auth`;

		window.common.setOrg = (org) => {
			if (org) { window.common.auth.org = org; }
			else { window.common.auth.org = window.config.tenant; }
			return window.common.auth.org;
		};

		window.common.getOrg = () => {
			if (window.common.auth.org) { return window.common.auth.org; }
			return window.common.setOrg();
		};

		//// window.common.auth login function ////////////
		window.common.login = (redirectUri) => {
			let keycloak = new Keycloak({
				url: window.common.auth.url,
				realm: window.common.getOrg(),
				clientId: window.config.tenant
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
					return window.common.loginServiceProviders().then(window.common.auth.checkUserInfo);
				};
				window.common.auth.postLogin().then(() => {
					if (window.module) { for (let key in window.module) { if (window.module[key].isAutoLogin) { window.module[key].login(); } }; }
					window.common.auth.startTokenDaemon();
					main();
				});
			};
			keycloak.onAuthError = () => {
				console.error("could not get authorization");
				window.location.replace(redirectUri ? redirectUri : "/");
			};
			keycloak.init({
				onLoad: "login-required",
				redirectUri: redirectUri ? redirectUri : "/"
			});
		};

		window.common.logout = async (redirectUri) => {
			window.common.logoutServiceProviders().then(() => {
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
			return fetch(`/auth/realms/${window.common.getOrg()}/protocol/openid-connect/userinfo`, {
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
			window.common.auth.keycloak.updateToken(300).then((refreshed) => {
				if (refreshed) { window.common.auth.postLogin(); }
				setTimeout(window.common.auth.startTokenDaemon, 60000);
			});
		};

		//// window.common.auth model interfaces //////////
		window.common.getSchema = async () => { return window.common.rest.get(`${window.config.uerpUrl}/schema`).then((content) => { return content; }); };

		window.common.auth.readOrg = async (id) => { return window.common.rest.get(`${window.config.uerpUrl}/common/auth/org/${id}`).then((content) => { return new Org(content); }); };
		window.common.auth.countOrg = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.common.rest.get(`${window.config.uerpUrl}/common/auth/org/count${query}`).then((content) => { return content });
		};
		window.common.auth.searchOrg = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.common.rest.get(`${window.config.uerpUrl}/common/auth/org${query}`).then((contents) => {
				let results = [];
				contents.forEach((content) => { results.push(new Org(content)); });
				return window.common.util.setArrayFunctions(results, Org);
			});
		};
		function Org(content) {
			if (content) { Object.assign(this, content); }
			this.reloadModel = async () => { return window.common.rest.get(this.uref).then((content) => { Object.assign(this, content); return this; }); };
			this.createModel = async () => { return window.common.rest.post(`${window.config.uerpUrl}/common/auth/org`, this).then((content) => { Object.assign(this, content); return this; }); };
			this.updateModel = async () => { return window.common.rest.put(this.uref, this).then((content) => { Object.assign(this, content); return this; }); };
			this.deleteModel = async () => { return window.common.rest.delete(this.uref).then((content) => { return content; }); };
			this.print = () => { console.log(this); };
		};
		window.common.auth.Org = Org;

		window.common.auth.readRole = async (id) => { return window.common.rest.get(`${window.config.uerpUrl}/common/auth/role/${id}`).then((content) => { return new Role(content); }); };
		window.common.auth.countRole = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.common.rest.get(`${window.config.uerpUrl}/common/auth/role/count${query}`).then((content) => { return content });
		};
		window.common.auth.searchRole = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.common.rest.get(`${window.config.uerpUrl}/common/auth/role${query}`).then((contents) => {
				let results = [];
				contents.forEach((content) => { results.push(new Role(content)); });
				return window.common.util.setArrayFunctions(results, Role);
			});
		};
		function Role(content) {
			if (content) { Object.assign(this, content); }
			this.reloadModel = async () => { return window.common.rest.get(this.uref).then((content) => { Object.assign(this, content); return this; }); };
			this.createModel = async () => { return window.common.rest.post(`${window.config.uerpUrl}/common/auth/role`, this).then((content) => { Object.assign(this, content); return this; }); };
			this.updateModel = async () => { return window.common.rest.put(this.uref, this).then((content) => { Object.assign(this, content); return this; }); };
			this.deleteModel = async () => { return window.common.rest.delete(this.uref).then((content) => { return content; }); };
			this.print = () => { console.log(this); };
		};
		window.common.auth.Role = Role;

		window.common.auth.readGroup = async (id) => { return window.common.rest.get(`${window.config.uerpUrl}/common/auth/group/${id}`).then((content) => { return new Group(content); }); };
		window.common.auth.countGroup = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.common.rest.get(`${window.config.uerpUrl}/common/auth/group/count${query}`).then((content) => { return content });
		};
		window.common.auth.searchGroup = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.common.rest.get(`${window.config.uerpUrl}/common/auth/group${query}`).then((contents) => {
				let results = [];
				contents.forEach((content) => { results.push(new Group(content)); });
				return window.common.util.setArrayFunctions(results, Group);
			});
		};
		function Group(content) {
			if (content) { Object.assign(this, content); }
			this.reloadModel = async () => { return window.common.rest.get(this.uref).then((content) => { Object.assign(this, content); return this; }); };
			this.createModel = async () => { return window.common.rest.post(`${window.config.uerpUrl}/common/auth/group`, this).then((content) => { Object.assign(this, content); return this; }); };
			this.updateModel = async () => { return window.common.rest.put(this.uref, this).then((content) => { Object.assign(this, content); return this; }); };
			this.deleteModel = async () => { return window.common.rest.delete(this.uref).then((content) => { return content; }); };
			this.print = () => { console.log(this); };
		};
		window.common.auth.Group = Group;

		window.common.auth.readAccount = async (id) => { return window.common.rest.get(`${window.config.uerpUrl}/common/auth/account/${id}`).then((content) => { return new Account(content); }); };
		window.common.auth.countAccount = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.common.rest.get(`${window.config.uerpUrl}/common/auth/account/count${query}`).then((content) => { return content });
		};
		window.common.auth.searchAccount = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.common.rest.get(`${window.config.uerpUrl}/common/auth/account${query}`).then((contents) => {
				let results = [];
				contents.forEach((content) => { results.push(new Account(content)); });
				return window.common.util.setArrayFunctions(results, Account);
			});
		};
		function Account(content) {
			if (content) { Object.assign(this, content); }
			this.reloadModel = async () => { return window.common.rest.get(this.uref).then((content) => { Object.assign(this, content); return this; }); };
			this.createModel = async () => { return window.common.rest.post(`${window.config.uerpUrl}/common/auth/account`, this).then((content) => { Object.assign(this, content); return this; }); };
			this.updateModel = async () => { return window.common.rest.put(this.uref, this).then((content) => { Object.assign(this, content); return this; }); };
			this.deleteModel = async () => { return window.common.rest.delete(this.uref).then((content) => { return content; }); };
			this.print = () => { console.log(this); };
		};
		window.common.auth.Account = Account;

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

		window.common.rest.delete = async (url, data) => {
			return fetch(url, {
				method: "DELETE",
				headers: window.common.auth.headers,
				body: data ? data : null
			}).then((res) => {
				if (res.ok) { return res.json(); }
				throw res
			});
		};

		// window.common.wsock ////////////////////////////
		window.common.wsock.connect = (url, receiver, initiator, closer) => {
			let socket = new WebSocket(`wss://${window.config.endpoint}${url}`);
			socket.sendData = async (key, value) => { return socket.send(JSON.stringify([key, value])); };
			socket.onmessage = (event) => { receiver(event.target, event.data); };
			socket.onerror = (event) => { console.error("(wsock) error", event); };
			socket.onopen = (event) => {
				console.log("(wsock) open");
				event.target.sendData("auth", {
					org: window.common.getOrg(),
					token: window.common.auth.accessToken
				});
				if (initiator) { initiator(event.target); }
			};
			socket.onclose = (event) => {
				console.log("(wsock) close");
				if (closer) { closer(event); }
			};
			return socket;
		};

		if (window.module) { for (let key in window.module) { window.module[key].init(); }; }
		console.log("(window.common) ready");
		return window.common;
	}
};