window.Module = window.Module || {};
window.Module.Term = window.Module.Term || {
	init: () => {
		window.Module.Term.isAutoLogin = false;
		console.log("(Module.Term) start");
		window.Module.Term.requests = [];

		// called from main index
		window.Module.Term.openSSH = (username, hostname, hostport, target, options) => {
			if (!username) { throw "(module.term.openSSH) username parameter is required"; }
			if (!hostname) { throw "(module.term.openSSH) hostname parameter is required"; }
			hostport = hostport ? hostport : 22;
			target = target ? target : "_blank";
			options = options ? options : "menubar=no,status=no,titlebar=no,toolbar=no";
			Common.Session.Cookie.set("Guac-Req", JSON.stringify({
				type: "ssh",
				account: Common.Auth.username,
				username: username,
				hostname: hostname,
				hostport: hostport
			}), null, "/static/html/terminal.html");
			window.open("/static/html/terminal.html", target, options);
		};

		// called from term index
		window.Module.Term.connect = (dom) => {
			let token = Common.Session.Cookie.get("Guac-Token");
			let connection = Common.Session.Cookie.get("Guac-Req");
			if (connection) { connection = JSON.parse(connection); }
			else {
				window.Module.Term.closeByException("연결 요청 정보가 없습니다");
				throw "(module.term.connect) could not find connection info";
			}

			if (token) {
				fetch(`/guacamole/api/session/data/postgresql/users/${connection.account}`, {
					headers: { "Guacamole-Token": token }
				}).then((res) => {
					if (res.ok) {
						Common.Session.Cookie.del("Guac-Req", "/static/html/terminal.html");
						if (connection.type == "ssh") {
							fetch(`/guacamole/api/session/ext/quickconnect/create?token=${token}`, {
								method: "POST",
								headers: { "Content-Type": "application/x-www-form-urlencoded" },
								body: `uri=ssh://${connection.username}@${connection.hostname}:${connection.hostport}`
							}).then((res) => {
								if (res.ok) { return res.json(); }
								throw res;
							}).then((data) => {
								window.Module.Term.connectToSSH(dom, data.identifier, token);
							});
						} else {
							window.Module.Term.closeByException("지원하지 않는 연결 형식 입니다");
							throw "(module.term.connect) could not support connection type";
						}
					} else {
						Common.Session.Cookie.del("Guac-Token", "/static/html/terminal.html");
						window.location.replace("/guacamole/api/ext/openid/login");
					}
				});
			} else {
				let hash = Common.Session.Hash.get();
				if (hash.id_token) {
					fetch("/guacamole/api/tokens", {
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
							"Accept": "application/json"
						},
						body: window.location.hash.replace("#", "")
					}).then((res) => {
						if (res.ok) { return res.json(); }
						throw res;
					}).then((guacamole) => {
						Common.Session.Cookie.del("Guac-Req", "/static/html/terminal.html");
						token = guacamole.authToken;
						Common.Session.Cookie.set("Guac-Token", token, null, "/static/html/terminal.html");
						if (connection.type == "ssh") {
							fetch(`/guacamole/api/session/ext/quickconnect/create?token=${token}`, {
								method: "POST",
								headers: { "Content-Type": "application/x-www-form-urlencoded" },
								body: `uri=ssh://${connection.username}@${connection.hostname}:${connection.hostport}`
							}).then((res) => {
								if (res.ok) { return res.json(); }
								throw res;
							}).then((data) => {
								window.Module.Term.connectToSSH(dom, data.identifier, token);
							});
						} else {
							window.Module.Term.closeByException("지원하지 않는 연결 형식 입니다");
							throw "(module.term.connect) could not support connection type";
						}
					});
				} else {
					window.location.replace("/guacamole/api/ext/openid/login");
				}
			}
		};

		window.Module.Term.connectToSSH = (dom, id, token) => {
			let guac = new Guacamole.Client(new Guacamole.WebSocketTunnel('/guacamole/websocket-tunnel'));
			let guacDisp = guac.getDisplay().getElement();
			dom.appendChild(guacDisp);

			let options = `token=${token}&GUAC_ID=${id}&GUAC_DATA_SOURCE=quickconnect&GUAC_TYPE=c`;
			options += `&GUAC_WIDTH=${Math.round(window.innerWidth)}&GUAC_HEIGHT=${Math.round(window.innerHeight)}&GUAC_DPI=96`;
			options += "&GUAC_AUDIO=audio/L8&GUAC_AUDIO=audio/L16&GUAC_IMAGE=image/jpeg&GUAC_IMAGE=image/png&GUAC_IMAGE=image/webp&GUAC_TIMEZONE=Asia/Seoul";

			guac.connect(options);
			guac.onerror = (error) => {
				console.error(error);
				window.Module.Term.closeByException("문제가 발생하여 연결하지 못했습니다");
			};
			guac.onstatechange = (state) => {
				switch (state) {
					case 3: console.log("connected"); break;
					case 4: console.log("logout"); break;
					case 5: console.log("disconnected"); window.close(); break;
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

		window.Module.Term.closeByException = (message) => {
			window.alert(message);
			window.close();
		};

		console.log("(Module.Term) ready");
	}
};