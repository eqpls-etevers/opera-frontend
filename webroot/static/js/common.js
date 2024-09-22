window.Common = window.Common || {
	init: (main) => {
		console.log("(Common) start");

		// Common definitions /////////////////////////////
		window.Common.url = `https://${window.Config.endpoint}`;
		window.Common.uerpUrl = `/${window.Config.uerp}/v${window.Config.version}`;
		window.Common.Util = window.Common.Util || {};
		window.Common.DB = window.Common.DB || {};
		window.Common.Session = window.Common.Session || { Query: {}, Hash: {}, Cookie: {}};
		window.Common.Auth = window.Common.Auth || {};
		window.Common.Rest = window.Common.Rest || {};
		window.Common.WSock = window.Common.WSock || {};

		// login service provider handlers ////////////////
		window.Common.loginServiceProviders = window.Common.loginServiceProviders || async function() { };
		window.Common.logoutServiceProviders = window.Common.logoutServiceProviders || async function() { };

		// window.Common.Util /////////////////////////////
		window.Common.Util.utoa = (str) => { return window.btoa(unescape(encodeURIComponent(str))); };
		window.Common.Util.atou = (str) => { return decodeURIComponent(escape(window.atob(str))); };

		window.Common.Util._regex_uuid = /^[a-z,0-9,-]{36,36}$/;
		window.Common.Util.checkUUID = (uuid) => { window.Common.Util._regex_uuid.test(uuid); };
		window.Common.Util.getUUID = () => { return crypto.randomUUID(); };

		window.Common.Util.getRandomString = (length) => {
			let result = "";
			let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * 62)); }
			return result;
		};

		window.Common.Util.setArrayFunctions = (arr) => {
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
				return setArrayFunctions(result);
			};
			arr.searchByField = (field, value) => {
				let result = [];
				arr.forEach((content) => { if (value == content[field]) { result.push(content); } });
				return setArrayFunctions(result);
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
				if (arr.empty()) { console.log("this is empty array"); }
				else { console.log(arr); }
			};
			return arr;
		};

		// window.Common.DB ///////////////////////////////
		window.Common.DB._databases = window.Config.databases;
		window.Common.DB._databases.Blob = ["index"];

		function Database (name, tables) {
			this._name = name;
			this._tables = [];
			let request = window.indexedDB.open(this._name, 1);
			request.onsuccess = () => {
				this._conn = request.result;
				tables.forEach((table) => { this[table] = new Table(table, this); });
				window.Common.DB[name] = this;
			};
			request.onupgradeneeded = () => {
				tables.forEach((table) => { request.result.createObjectStore(table, {keyPath: "id"}); });
				window.Common.DB[name] = this;
			};
			request.onerror = () => {
				console.error("could not create database");
				window.Common.DB.pop(name);
			};
		};

		function Table (name, db) {
			this._name = name;
			this._db = db;
			this.readAll = () => {
				return new Promise((resultHandler) => {
					let request = this._db._conn.transaction(this._name).objectStore(this._name).getAll();
					request.onsuccess = () => { resultHandler(window.Common.Util.setArrayFunctions(request.result)); };
					request.onerror = () => { resultHandler(request); };
				});
			};
			this.read = (id) => {
				return new Promise((resultHandler) => {
					let request = this._db._conn.transaction(this._name).objectStore(this._name).get(id);
					request.onsuccess = () => { resultHandler(request.result); };
					request.onerror = () => { resultHandler(request); };
				});
			};
			this.write = (id, data) => {
				return new Promise((resultHandler) => {
					data.id = id;
					let request = this._db._conn.transaction([this._name], "readwrite").objectStore(this._name).put(data);
					request.onsuccess = () => { resultHandler(data); };
					request.onerror = () => { resultHandler(request); };
				});
			};
			this.delete = (id) => {
				return new Promise((resultHandler) => {
					let request = this._db._conn.transaction([this._name], "readwrite").objectStore(this._name).delete(id);
					request.onsuccess = () => { resultHandler(id); };
					request.onerror = () => { resultHandler(request); };
				});
			};
			this._db._tables.push(name);
			console.log(`(DB.${this._db._name}.${name}) table is created`);
		};

		// window.Common.Session //////////////////////////
		window.Common.Session.Query.parse = (query) => {
			let map = {};
			query.replace("?", "").split("&").forEach((q) => {
				if (q) {
					let kv = q.split("=");
					map[kv[0]] = kv[1];
				}
			});
			return map;
		};
		window.Common.Session.Query.get = () => {
			return window.Common.Query.parse(window.location.search);
		};

		window.Common.Session.Hash.parse = (hash) => {
			let map = {};
			hash.replace("#", "").split("&").forEach((h) => {
				if (h) {
					let kv = h.split("=");
					map[kv[0]] = kv[1];
				}
			});
			return map;
		};
		window.Common.Session.Hash.get = () => {
			return window.Common.Session.Hash.parse(window.location.hash);
		};

		window.Common.Session.Cookie.get = (name) => {
			let value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
			return value ? value[2] : null;
		};

		window.Common.Session.Cookie.set = (name, value, expire, path) => {
			if (!expire) { expire = 3600; }
			if (!path) { path = "/"; }
			var date = new Date();
			date.setTime(date.getTime() + expire * 1000);
			document.cookie = `${name}=${value};expires=${date.toUTCString()};path=${path}`;
		};

		window.Common.Session.Cookie.del = (name, path) => {
			if (!path) { path = "/"; }
			document.cookie = `${name}=;expires=Thu, 01 Jan 1999 00:00:10 UTC;path=${path}`;
		};

		// window.Common.Auth /////////////////////////////
		window.Common.Auth.url = `${window.Common.url}/auth`;

		window.Common.setOrg = (org) => {
			if (org) { window.Common.Auth.org = org; }
			else { window.Common.Auth.org = window.Config.tenant; }
			return window.Common.Auth.org;
		};

		window.Common.getOrg = () => {
			if (window.Common.Auth.org) { return window.Common.Auth.org; }
			return window.Common.setOrg();
		};

		//// window.Common.Auth login function ////////////
		window.Common.login = (redirectUri) => {
			let keycloak = new Keycloak({
				url: window.Common.Auth.url,
				realm: window.Common.getOrg(),
				clientId: window.Config.tenant
			});
			keycloak.onAuthSuccess = () => {
				window.Common.Auth.keycloak = keycloak;
				window.Common.Auth.postLogin = () => {
					window.Common.Auth.accessToken = window.Common.Auth.keycloak.token;
					window.Common.Auth.refreshToken = window.Common.Auth.keycloak.refreshToken;
					window.Common.Auth.idToken = window.Common.Auth.keycloak.idToken;
					window.Common.Auth.bearerToken = `Bearer ${window.Common.Auth.accessToken}`
					window.Common.Auth.headers = {
						"Authorization": window.Common.Auth.bearerToken,
						"Content-Type": "application/json; charset=utf-8",
						"Accept": "application/json; charset=utf-8"
					};
					return window.Common.loginServiceProviders().then(window.Common.Auth.checkUserInfo);
				};
				window.Common.Auth.postLogin().then(() => {
					if (window.Module) { for (let key in window.Module) { if (window.Module[key].isAutoLogin) { window.Module[key].login(); } }; }
					window.Common.Auth.startTokenDaemon();
					let databaseNames = Object.keys(window.Common.DB._databases);
					databaseNames.forEach((name) => { new Database(name, window.Common.DB._databases[name]); });
					function waitStableForMain () {
						try {
							for (let i = 0; i < databaseNames.length; i++) {
								let name = databaseNames[i];
								let innerList = window.Common.DB[name]._tables.sort().join(',');
								let outerList = window.Common.DB._databases[name].sort().join(',');
								if (innerList != outerList) { return setTimeout(checkDB, 200); }
							}
						} catch (e) { return setTimeout(waitStableForMain, 200); }
						main();
					};
					waitStableForMain();
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

		window.Common.logout = (redirectUri) => {
			window.Common.logoutServiceProviders().then(() => {
				window.Common.Auth.keycloak.logout({
					redirectUri: redirectUri ? redirectUri : "/"
				}).catch((error) => {
					console.error(error);
					window.location.replace("/");
				});
			}).catch((error) => {
				console.error(error);
			});
		};

		window.Common.Auth.checkUserInfo = async () => {
			fetch(`/auth/realms/${window.Common.getOrg()}/protocol/openid-connect/userinfo`, {
				headers: window.Common.Auth.headers
			}).then((res) => {
				if (res.ok) { return res.json(); }
				throw res
			}).then((userInfo) => {
				window.Common.Auth.username = userInfo.preferred_username;
				window.Common.Auth.UserInfo = new UserInfo(userInfo);
			});
		};

		window.Common.Auth.startTokenDaemon = () => {
			window.Common.Auth.keycloak.updateToken(300).then((refreshed) => {
				if (refreshed) { window.Common.Auth.postLogin(); }
				setTimeout(window.Common.Auth.startTokenDaemon, 60000);
			});
		};

		function UserInfo (content) {
			if (content) { Object.assign(this, content); }
			this.getRoles = async () => {
				let result = [];
				let coros = [];
				for (let i = 0; i < this.roles.length; i++) { coros.push(window.Common.Auth.readRole(this.roles[i])); }
				for (let i = 0; i < coros.length; i++) { result.push(await coros[i]) }
				return window.Common.Util.setArrayFunctions(result);
			};
			this.getGroups = async () => {
				let result = [];
				let coros = [];
				for (let i = 0; i < this.groups.length; i++) { coros.push(window.Common.Auth.readGroup(this.groups[i])); }
				for (let i = 0; i < coros.length; i++) { result.push(await coros[i]) }
				return window.Common.Util.setArrayFunctions(result);
			};
			this.getRoles().then((roles) => { this.Roles = roles; });
			this.getGroups().then((groups) => { this.Groups = groups; });
		};

		//// window.Common.Auth model interfaces //////////
		window.Common.getSchema = async () => { return window.Common.Rest.get(`${window.Common.uerpUrl}/schema`).then((content) => { return content; }); };

		window.Common.Auth.readOrg = async (id) => { return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/org/${id}`).then((content) => { return new Org(content); }); };
		window.Common.Auth.countOrg = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/org/count${query}`).then((content) => { return content });
		};
		window.Common.Auth.searchOrg = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/org${query}`).then((contents) => {
				let results = [];
				contents.forEach((content) => { results.push(new Org(content)); });
				return window.Common.Util.setArrayFunctions(results);
			});
		};
		function Org(content) {
			if (content) { Object.assign(this, content); }
			this.reloadModel = async () => { return window.Common.Rest.get(this.uref).then((content) => { Object.assign(this, content); return this; }); };
			this.createModel = async () => { return window.Common.Rest.post(`${window.Common.uerpUrl}/common/auth/org`, this).then((content) => { Object.assign(this, content); return this; }); };
			this.updateModel = async () => { return window.Common.Rest.put(this.uref, this).then((content) => { Object.assign(this, content); return this; }); };
			this.deleteModel = async () => { return window.Common.Rest.delete(this.uref).then((content) => { return content; }); };
			this.print = () => { console.log(this); };
		};
		window.Common.Auth.Org = Org;

		window.Common.Auth.readRole = async (id) => { return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/role/${id}`).then((content) => { return new Role(content); }); };
		window.Common.Auth.countRole = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/role/count${query}`).then((content) => { return content });
		};
		window.Common.Auth.searchRole = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/role${query}`).then((contents) => {
				let results = [];
				contents.forEach((content) => { results.push(new Role(content)); });
				return window.Common.Util.setArrayFunctions(results);
			});
		};
		function Role(content) {
			if (content) { Object.assign(this, content); }
			this.reloadModel = async () => { return window.Common.Rest.get(this.uref).then((content) => { Object.assign(this, content); return this; }); };
			this.createModel = async () => { return window.Common.Rest.post(`${window.Common.uerpUrl}/common/auth/role`, this).then((content) => { Object.assign(this, content); return this; }); };
			this.updateModel = async () => { return window.Common.Rest.put(this.uref, this).then((content) => { Object.assign(this, content); return this; }); };
			this.deleteModel = async () => { return window.Common.Rest.delete(this.uref).then((content) => { return content; }); };
			this.print = () => { console.log(this); };
		};
		window.Common.Auth.Role = Role;

		window.Common.Auth.readGroup = async (id) => { return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/group/${id}`).then((content) => { return new Group(content); }); };
		window.Common.Auth.countGroup = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/group/count${query}`).then((content) => { return content });
		};
		window.Common.Auth.searchGroup = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/group${query}`).then((contents) => {
				let results = [];
				contents.forEach((content) => { results.push(new Group(content)); });
				return window.Common.Util.setArrayFunctions(results);
			});
		};
		function Group(content) {
			if (content) { Object.assign(this, content); }
			this.reloadModel = async () => { return window.Common.Rest.get(this.uref).then((content) => { Object.assign(this, content); return this; }); };
			this.createModel = async () => { return window.Common.Rest.post(`${window.Common.uerpUrl}/common/auth/group`, this).then((content) => { Object.assign(this, content); return this; }); };
			this.updateModel = async () => { return window.Common.Rest.put(this.uref, this).then((content) => { Object.assign(this, content); return this; }); };
			this.deleteModel = async () => { return window.Common.Rest.delete(this.uref).then((content) => { return content; }); };
			this.print = () => { console.log(this); };
		};
		window.Common.Auth.Group = Group;

		window.Common.Auth.readAccount = async (id) => { return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/account/${id}`).then((content) => { return new Account(content); }); };
		window.Common.Auth.countAccount = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/account/count${query}`).then((content) => { return content });
		};
		window.Common.Auth.searchAccount = async (query) => {
			if (query) {
				let qstr = []
				for (let key in query) { qstr.push(`${key}=${query[key]}`); }
				query = `?${qstr.join("&")}`;
			} else { query = ""; }
			return window.Common.Rest.get(`${window.Common.uerpUrl}/common/auth/account${query}`).then((contents) => {
				let results = [];
				contents.forEach((content) => { results.push(new Account(content)); });
				return window.Common.Util.setArrayFunctions(results);
			});
		};
		function Account(content) {
			if (content) { Object.assign(this, content); }
			this.reloadModel = async () => { return window.Common.Rest.get(this.uref).then((content) => { Object.assign(this, content); return this; }); };
			this.createModel = async () => { return window.Common.Rest.post(`${window.Common.uerpUrl}/common/auth/account`, this).then((content) => { Object.assign(this, content); return this; }); };
			this.updateModel = async () => { return window.Common.Rest.put(this.uref, this).then((content) => { Object.assign(this, content); return this; }); };
			this.deleteModel = async () => { return window.Common.Rest.delete(this.uref).then((content) => { return content; }); };
			this.print = () => { console.log(this); };
		};
		window.Common.Auth.Account = Account;

		// window.Common.Rest /////////////////////////////
		window.Common.Rest.get = async (url) => {
			return fetch(url, {
				headers: window.Common.Auth.headers
			}).then((res) => {
				if (res.ok) { return res.json(); }
				throw res
			});
		};

		window.Common.Rest.post = async (url, data) => {
			return fetch(url, {
				method: "POST",
				headers: window.Common.Auth.headers,
				body: JSON.stringify(data)
			}).then((res) => {
				if (res.ok) { return res.json(); }
				throw res
			});
		};

		window.Common.Rest.put = async (url, data) => {
			return fetch(url, {
				method: "PUT",
				headers: window.Common.Auth.headers,
				body: JSON.stringify(data)
			}).then((res) => {
				if (res.ok) { return res.json(); }
				throw res
			});
		};

		window.Common.Rest.patch = async (url, data) => {
			return fetch(url, {
				method: "PATCH",
				headers: window.Common.Auth.headers,
				body: JSON.stringify(data)
			}).then((res) => {
				if (res.ok) { return res.json(); }
				throw res
			});
		};

		window.Common.Rest.delete = async (url, data) => {
			return fetch(url, {
				method: "DELETE",
				headers: window.Common.Auth.headers,
				body: data ? data : null
			}).then((res) => {
				if (res.ok) { return res.json(); }
				throw res
			});
		};

		// window.Common.WSock ////////////////////////////
		window.Common.WSock.connect = (url, receiver, initiator, closer) => {
			let socket = new WebSocket(`wss://${window.Config.endpoint}${url}`);
			socket.sendJson = async (data) => { return socket.send(JSON.stringify(data)); };
			socket.sendData = async (key, value) => { return socket.send(JSON.stringify([key, value])); };
			socket.onmessage = (event) => { receiver(event.target, event.data); };
			socket.onerror = (event) => { console.error("(wsock) error", event); };
			socket.onopen = (event) => {
				console.log("(wsock) open");
				event.target.sendData("auth", {
					org: window.Common.getOrg(),
					token: window.Common.Auth.accessToken
				});
				if (initiator) { initiator(event.target); }
			};
			socket.onclose = (event) => {
				console.log("(wsock) close");
				if (closer) { closer(event); }
			};
			return socket;
		};

		if (window.Module) { for (let key in window.Module) { window.Module[key].init(); }; }
		console.log("(Common) ready");
		return window.Common;
	}
};