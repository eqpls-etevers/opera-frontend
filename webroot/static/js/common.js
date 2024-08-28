window.common = window.common || {};
window.common.init = (mainHandler) => {

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
	window.common.auth.loginMiddleWare = (loginProcess) => {
		console.log("bypass login middleware");
		loginProcess();
	};

	window.common.auth.logoutMiddleWare = () => {
		console.log("bypass logout middleware");
	};

	window.common.auth.login = (redirectUri, resultHandler, errorHandler) => {
		let keycloak = new Keycloak({
			url: window.common.auth.url,
			realm: window.common.auth.getOrg(),
			clientId: window.common.env.tenant
		});
		keycloak.onAuthSuccess = () => {
			window.common.auth.keycloak = keycloak;
			window.common.auth.tokenDaemon();
			window.common.auth.postLogin(resultHandler, errorHandler);
		};
		keycloak.onAuthError = () => {
			if (errorHandler) { errorHandler(); }
		};
		keycloak.init({
			onLoad: 'login-required',
			redirectUri: redirectUri
		});
	};

	window.common.auth.postLogin = (resultHandler, errorHandler) => {
		window.common.auth.accessToken = window.common.auth.keycloak.token;
		window.common.auth.refreshToken = window.common.auth.keycloak.refreshToken;
		window.common.auth.idToken = window.common.auth.keycloak.idToken;
		window.common.auth.bearerToken = `Bearer ${window.common.auth.accessToken}`
		window.common.auth.headers = {
			"Authorization": window.common.auth.bearerToken,
			"Content-Type": "application/json; charset=utf-8",
			"Accept": "application/json; charset=utf-8"
		};

		try {
			window.common.auth.loginMiddleWare(() => {
				window.common.auth.checkUserInfo(resultHandler, errorHandler);
			});
		} catch (error) {
			if (errorHandler) { errorHandler(error); }
		}
	};

	window.common.auth.logout = () => {
		window.common.auth.keycloak.logout({
			redirectUri: "/"
		}).then(() => {
			try {
				window.common.auth.logoutMiddleWare();
			} catch (error) {
				console.error(error);
				window.location.replace("/");
			}
		}).catch((error) => {
			console.error(error);
			window.location.replace("/");
		});
	};

	window.common.auth.checkUserInfo = (resultHandler, errorHandler) => {
		fetch(`/auth/realms/${window.common.auth.getOrg()}/protocol/openid-connect/userinfo`, {
			headers: window.common.auth.headers
		}).then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(); }
			throw res
		}).then((userInfo) => {
			window.common.auth.username = userInfo.preferred_username;
			window.common.auth.userInfo = userInfo;
			if (resultHandler) { resultHandler(); }
		});
	};

	window.common.auth.tokenDaemon = () => {
		window.common.auth.keycloak.updateToken(5).then((refreshed) => {
			if (refreshed) {
				window.common.auth.postLogin();
			}
			setTimeout(window.common.auth.tokenDaemon, 60000);
		});
	};

	//// window.common.auth default integrations //////
	window.common.auth.loginTermService = (resultHandler, errorHandler) => {
		if (window.common.env.isTermService) {
			window.common.auth.termToken = localStorage.getItem("authTermToken");
			if (window.common.auth.termToken) {
				fetch(`/guacamole/api/session/data/postgresql/users/${window.common.auth.username}`, {
					headers: { "Guacamole-Token": window.common.auth.termToken }
				}).then((res) => {
					if (res.ok) {
						if (resultHandler) { resultHandler(); }
					} else {
						localStorage.removeItem("authTermToken");
						window.location.replace("/guacamole/api/ext/openid/login");
					}
				});
			} else if (window.location.hash && window.location.hash.indexOf("id_token=")) {
				fetch("/guacamole/api/tokens", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						"Accept": "application/json"
					},
					body: window.location.hash.replace("#", "")
				}).then((res) => {
					if (res.ok) { return res.json(); }
					localStorage.removeItem("authTermToken");
					if (errorHandler) { errorHandler(); }
					throw res;
				}).then((guacamole) => {
					localStorage.setItem("GUAC_AUTH", JSON.stringify(guacamole));
					localStorage.setItem("authTermToken", guacamole.authToken);
					window.location.replace("/");
				});
			} else { window.location.replace("/guacamole/api/ext/openid/login"); }
		} else {
			if (resultHandler) { resultHandler(); }
		}
	};

	window.common.auth.loginDataService = (resultHandler, errorHandler) => {
		if (window.common.env.isDataService) {
			if (window.common.auth.dataToken) {
				if (resultHandler) { resultHandler(); }
			} else {
				fetch("/minio/ui/api/v1/login").then((res) => {
					if (res.ok) { return res.json(); }
					if (errorHandler) { errorHandler(); }
					throw res;
				}).then((data) => {
					fetch(data.redirectRules[0].redirect).then((res) => {
						if (res.ok) { return res.json(); }
						if (errorHandler) { errorHandler(); }
						throw res;
					}).then((data) => {
						data.state = decodeURIComponent(data.state);
						fetch("/minio/ui/api/v1/login/oauth2/auth", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(data)
						}).then((res) => {
							if (res.ok) {
								fetch("/minio/ui/cookie_to_data").then((res) => {
									if (res.ok) { return res.json(); }
									if (errorHandler) { errorHandler(); }
									throw res;
								}).then((data) => {
									window.common.auth.dataToken = data.token;
									if (resultHandler) { resultHandler(); }
								});
							} else {
								if (errorHandler) { errorHandler(); }
								throw res;
							}
						});
					});
				});
			}
		} else if (resultHandler) { resultHandler(); }
	};

	// window.common.rest /////////////////////////////
	window.common.rest.get = (url, resultHandler, errorHandler) => {
		fetch(url, {
			headers: window.common.auth.headers
		}).then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(res); }
			throw res
		}).then((data) => {
			if (resultHandler) { resultHandler(data); }
		});
	};

	window.common.rest.post = (url, data, resultHandler, errorHandler) => {
		fetch(url, {
			method: "POST",
			headers: window.common.auth.headers,
			body: JSON.stringify(data)
		}).then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(res); }
			throw res
		}).then((data) => {
			if (resultHandler) { resultHandler(data); }
		});
	};

	window.common.rest.put = (url, data, resultHandler, errorHandler) => {
		fetch(url, {
			method: "PUT",
			headers: window.common.auth.headers,
			body: JSON.stringify(data)
		}).then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(res); }
			throw res
		}).then((data) => {
			if (resultHandler) { resultHandler(data); }
		});
	};

	window.common.rest.delete = (url, resultHandler, errorHandler) => {
		fetch(url, {
			method: "DELETE",
			headers: window.common.auth.headers
		}).then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(res); }
			throw res
		}).then((data) => {
			if (resultHandler) { resultHandler(data); }
		});
	};

	// window.common.wsock ////////////////////////////
	window.common.wsock.connect = (url, recvHandler, openHandler, closeHandler, errorHandler, recursiveConnect) => {
		try {
			let socket = new WebSocket(`wss://${window.common.env.endpoint}${url}`);
			socket.sendData = (key, value) => { socket.send(JSON.stringify([key, value])) }
			socket.onmessage = (event) => {
				if (recvHandler) { recvHandler(event.target, event.data); }
			};
			socket.onopen = (event) => {
				console.log("wsock:open");
				event.target.sendData("auth", {
					org: window.common.auth.getOrg(),
					token: window.common.auth.accessToken
				});
				if (openHandler) { openHandler(event.target); }
			};
			socket.onclose = (event) => {
				console.log("wsock:close");
				if (closeHandler) { closeHandler(event); }
			};
			socket.onerror = (event) => {
				console.log("wsock:error");
				if (errorHandler) { errorHandler(event); }
				if (recursiveConnect) { window.common.wsock.connect(url, recvHandler, openHandler, closeHandler, errorHandler, recursiveConnect); }
			};
			return socket;
		} catch (e) {
			if (errorHandler) { errorHandler(e); }
			throw e
		}
	};

	// window.common.data /////////////////////////////
	window.common.data._upload = (bucket, path, files, resultHandler, errorHandler) => {
		if (files.length > 0) {
			let basePath = path.split("/").filter((item) => { return item; }).join("/");
			let coros = [];
			let results = [];
			let isOk = true;

			for (let i = 0; i < files.length; i++) {
				let file = files[i];
				let prefix = basePath ? `${basePath}/${file.name}` : file.name;
				let form = new FormData();
				form.append(file.size, file);
				coros.push(fetch(`/minio/ui/api/v1/buckets/${bucket}/objects/upload?prefix=${btoa(prefix)}`, {
					method: "POST",
					body: form
				}));
				results.push(null);
			}
			for (let i = 0, j = 1; i < files.length; i++, j++) {
				let coro = coros[i];
				coro.then((res) => {
					results[i] = res;
					if (res.ok) {
						if (j == files.length && isOk && resultHandler) {
							resultHandler(bucket, path, files, results);
						}
					} else if (errorHandler) {
						isOk = false
						errorHandler(bucket, path, files, results);
					}
				});
			}
		} else if (errorHandler) {
			errorHandler(bucket, path, files);
		}
	};

	window.common.data._download = (url, resultHandler, errorHandler) => {
		fetch(`/minio/ui/api/v1${url}`).then((res) => {
			if (res.ok) { return res.blob(); }
			else {
				if (res.status == 401) { window.common.auth.refreshDataService(() => { window.common.data._download(url, resultHandler, errorHandler); }); }
				else { if (errorHandler) { errorHandler(res); }; throw res; }
			}
		}).then((data) => { if (resultHandler) { resultHandler(data); } });
	};

	window.common.data._get = (url, resultHandler, errorHandler) => {
		fetch(`/minio/ui/api/v1${url}`).then((res) => {
			if (res.ok) { return res.json(); }
			else {
				if (res.status == 401) { window.common.auth.refreshDataService(() => { window.common.data._get(url, resultHandler, errorHandler); }); }
				else { if (errorHandler) { errorHandler(res); }; throw res; }
			}
		}).then((data) => { if (resultHandler) { resultHandler(data); } });
	};

	window.common.data._post = (url, data, resultHandler, errorHandler) => {
		fetch(`/minio/ui/api/v1${url}`).then((res) => {
			if (res.ok) { return res.json(); }
			else {
				if (res.status == 401) { window.common.auth.refreshDataService(() => { window.common.data._get(url, resultHandler, errorHandler); }); }
				else { if (errorHandler) { errorHandler(res); }; throw res; }
			}
		}).then((data) => { if (resultHandler) { resultHandler(data); } });
	};




	window.common.data._set_object_functions_ = (bucket, object) => {
		if (object.etag !== undefined) {
			object.url = `/minio/ui/api/v1/buckets/${bucket}/objects/download?prefix=${btoa(object.name)}`;
			object.dir = false;
			object.download = (resultHandler, errorHandler) => {
				fetch(object.url).then((res) => {
					if (res.ok) { return res.blob(); }
					if (errorHandler) { errorHandler(res); }
					throw res;
				}).then((data) => {
					if (resultHandler) { resultHandler(data); }
				});
			};
			object.delete = (resultHandler, errorHandler) => {
				fetch(`/minio/ui/api/v1/buckets/${bucket}/objects?prefix=${btoa(object.name)}`, {
					method: "DELETE"
				}).then((res) => {
					if (res.ok) { if (resultHandler) { resultHandler(res); } }
					else { if (errorHandler) { errorHandler(res); }; throw res; }
				});
			};
		} else {
			object.url = `/minio/ui/api/v1/buckets/${bucket}/objects/download?prefix=${btoa(object.name)}`;
			object.isData = () => { return false; };
			object.isDir = () => { return true; };
			object.getObjectList = (resultHandler, errorHandler) => {
				fetch(`/minio/ui/api/v1/buckets/${bucket}/objects?prefix=${btoa(object.name)}`).then((res) => {
					if (res.ok) { return res.json(); }
					if (errorHandler) { errorHandler(res); }
					throw res;
				}).then((data) => {
					let objects = data.objects ? data.objects : [];
					objects.forEach((object) => { window.common.data._set_object_functions_(bucket, object); });
					if (resultHandler) { resultHandler(objects); }
				});
			};
			object.delete = (resultHandler, errorHandler) => {
				fetch(`/minio/ui/api/v1/buckets/${bucket}/objects?prefix=${btoa(object.name)}&recursive=true`, {
					method: "DELETE"
				}).then((res) => {
					if (res.ok) { if (resultHandler) { resultHandler(res); } }
					else { if (errorHandler) { errorHandler(res); }; throw res; }
				});
			};
		}
	};

	window.common.data.getBucketList = (resultHandler, errorHandler) => {
		fetch("/minio/ui/api/v1/buckets").then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(res); }
			throw res;
		}).then((data) => {
			let buckets = data.buckets;
			buckets.forEach((bucket) => {
				bucket.isData = () => { return false; };
				bucket.isDir = () => { return true; };
				bucket.getObjectList = (resultHandler, errorHandler) => {
					fetch(`/minio/ui/api/v1/buckets/${bucket.name}/objects`).then((res) => {
						if (res.ok) { return res.json(); }
						if (errorHandler) { errorHandler(res); }
						throw res;
					}).then((data) => {
						let objects = data.objects ? data.objects : [];
						objects.forEach((object) => { window.common.data._set_object_functions_(bucket.name, object); });
						if (resultHandler) { resultHandler(objects); }
					});
				}
			});
			if (resultHandler) { resultHandler(buckets); }
		});
	};

	window.common.data.getObjectList = (bucket, path, resultHandler, errorHandler) => {
		let prefix = "";
		if (!(path === undefined || path == null || path == '/')) {
			let paths = path.split("/").filter((item) => {
				if (item) return true;
				else return false;
			});
			path = `${paths.join("/")}/`
			prefix = `prefix=${btoa(path)}`;
		}
		fetch(`/minio/ui/api/v1/buckets/${bucket}/objects?${prefix}`).then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(res); }
			throw res;
		}).then((data) => {
			let objects = data.objects ? data.objects : [];
			objects.forEach((object) => { window.common.data._set_object_functions_(bucket, object); });
			if (resultHandler) { resultHandler(objects); }
		});
	};

	window.common.data.getObject = (bucket, path, resultHandler, errorHandler) => {
		if (path === undefined || path == null || path == '/') { throw "path is required"; }
		path = path.split("/").filter((item) => { return item; }).join("/");
		fetch(`/minio/ui/api/v1/buckets/${bucket}/objects?prefix=${btoa(path)}`).then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(res); }
			throw res;
		}).then((data) => {
			if (!(data.objects)) { if (errorHandler) { errorHandler(data); } }
			else if (data.objects.length != 1) { if (errorHandler) { errorHandler(data); } }
			else {
				let object = data.objects[0];
				window.common.data._set_object_functions_(bucket, object);
				if (resultHandler) { resultHandler(object); }
			}
		});
	};

	window.common.data.upload = (bucket, path, files, resultHandler, errorHandler) => {
		if (files.length > 0) {
			let basePath = path.split("/").filter((item) => { return item; }).join("/");
			let coros = [];
			let results = [];
			let isOk = true;

			for (let i = 0; i < files.length; i++) {
				let file = files[i];
				let prefix = basePath ? `${basePath}/${file.name}` : file.name;
				let form = new FormData();
				form.append(file.size, file);
				coros.push(fetch(`/minio/ui/api/v1/buckets/${bucket}/objects/upload?prefix=${btoa(prefix)}`, {
					method: "POST",
					body: form
				}));
				results.push(null);
			}
			for (let i = 0, j = 1; i < files.length; i++, j++) {
				let coro = coros[i];
				coro.then((res) => {
					results[i] = res;
					if (res.ok) {
						if (j == files.length && isOk && resultHandler) {
							resultHandler(bucket, path, files, results);
						}
					} else if (errorHandler) {
						isOk = false
						errorHandler(bucket, path, files, results);
					}
				});
			}
		} else if (errorHandler) {
			errorHandler(bucket, path, files);
		}
	};

	window.common.data.delete = (bucket, path, resultHandler, errorHandler) => {
		fetch(`/minio/ui/api/v1/buckets/${bucket}/objects?prefix=${btoa(path)}`, {
			method: "DELETE"
		}).then((res) => {
			if (res.ok) {
				if (resultHandler) { resultHandler(bucket, path, res); }
			} else if (errorHandler) { errorHandler(bucket, path, res); }
		});
	};

	// window.common.term /////////////////////////////
	window.common.term.openNewWindow = (username, hostname, hostport) => {
		hostport = hostport ? hostport : "22";
		window.open(`/static/html/terminal.html?username=${username}&hostname=${hostname}&hostport=${hostport}`, "_blank", "menubar=no,status=no,titlebar=no,toolbar=no");
	};

	window.common.term.openNewTab = (username, hostname, hostport) => {
		hostport = hostport ? hostport : "22";
		window.open(`/static/html/terminal.html?username=${username}&hostname=${hostname}&hostport=${hostport}`, "_blank");
	};

	window.common.term.openOnDom = (dom, username, hostname, hostport) => {
		hostport = hostport ? hostport : "22";
		fetch(`/guacamole/api/session/ext/quickconnect/create?token=${window.common.auth.termToken}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: `uri=ssh://${username}@${hostname}:${hostport}`
		}).then((res) => {
			if (res.ok) { return res.json(); }
			throw res;
		}).then((data) => {
			window.common.term.connectToSSH(dom, data.identifier);
		})
	};

	window.common.term.closeByException = (message) => {
		window.alert(message);
		window.close();
	};

	window.common.term.connectToSSH = (dom, id) => {
		let guac = new Guacamole.Client(new Guacamole.WebSocketTunnel('/guacamole/websocket-tunnel'));
		let guacDisp = guac.getDisplay().getElement();
		dom.appendChild(guacDisp);

		let options = `token=${window.common.auth.termToken}&GUAC_ID=${id}&GUAC_DATA_SOURCE=quickconnect&GUAC_TYPE=c`;
		options += `&GUAC_WIDTH=${Math.round(window.innerWidth)}&GUAC_HEIGHT=${Math.round(window.innerHeight)}&GUAC_DPI=96`;
		options += "&GUAC_AUDIO=audio/L8&GUAC_AUDIO=audio/L16&GUAC_IMAGE=image/jpeg&GUAC_IMAGE=image/png&GUAC_IMAGE=image/webp&GUAC_TIMEZONE=Asia/Seoul";

		guac.connect(options);
		guac.onerror = (error) => {
			console.error(error);
			window.common.term.closeByException("문제가 발생하여 연결하지 못했습니다");
		};
		guac.onstatechange = (state) => {
			switch (state) {
				case 3:
					console.log("connected");
					break;
				case 4:
					console.log("logout");
					break;
				case 5:
					console.log("disconnected");
					window.close();
					break;
			}
		};
		guac.onclipboard = (stream, mimetype) => {
			if (mimetype == "text/plain") {
				let reader = new Guacamole.StringReader(stream);
				reader.ontext = (data) => { navigator.clipboard.writeText(data); };
			}
		};
		window.onauxclick = () => {
			navigator.clipboard.readText().then((data) => {
				let stream = guac.createClipboardStream("text/plain");
				let writer = new Guacamole.StringWriter(stream);
				writer.sendText(data);
				writer.sendEnd();
			});
		};
		window.onresize = () => guac.sendSize(Math.round(window.innerWidth), Math.round(window.innerHeight));
		window.onunload = () => guac.disconnect();
		window.onclose = () => guac.disconnect();

		let guacMouse = new Guacamole.Mouse(guacDisp);
		guacMouse.onmousedown = (state) => guac.sendMouseState(state);
		guacMouse.onmouseup = (state) => guac.sendMouseState(state);
		guacMouse.onmousemove = (state) => guac.sendMouseState(state);

		let guacKbd = new Guacamole.Keyboard(document);
		guacKbd.onkeydown = (k) => guac.sendKeyEvent(1, k);
		guacKbd.onkeyup = (k) => guac.sendKeyEvent(0, k);
	};

	if (mainHandler) { mainHandler(); }

}; // window.common.init finished
