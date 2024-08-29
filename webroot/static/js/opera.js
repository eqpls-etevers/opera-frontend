// javascript here

window.opera = window.opera || {};
window.opera.login = (mainHandler) => {

	function Deployment() {
		this.print = () => { console.log(this); }
	};

	function Catalog() {
		this.print = () => { console.log(this); }
	};

	function Project() {
		this.getDeployments = (resultHandler, errorHandler) => {
			if (resultHandler) {
				this.region.rest.get(`/deployment/api/deployments?projects=${this.id}`, (data) => {
					result = [];
					data.content.forEach((content) => {
						content.region = this;
						result.push(Object.assign(new Deployment(), content));
					});
					resultHandler(result);
				}, errorHandler);
			}
		};

		this.getCatalogs = (resultHandler, errorHandler) => {
			if (resultHandler) {
				this.region.rest.get(`/catalog/api/items?projects=${this.id}`, (data) => {
					result = [];
					data.content.forEach((content) => {
						content.region = this.region;
						result.push(Object.assign(new Catalog(), content));
					});
					resultHandler(result);
				}, errorHandler);
			}
		};

		this.print = () => { console.log(this); }
	};

	function Region() {

		this.getDeployments = (resultHandler, errorHandler) => {
			if (resultHandler) {
				this.rest.get('/deployment/api/deployments', (data) => {
					result = [];
					data.content.forEach((content) => {
						content.region = this;
						result.push(Object.assign(new Deployment(), content));
					});
					resultHandler(result);
				}, errorHandler);
			}
		};

		this.getProjects = (resultHandler, errorHandler) => {
			if (resultHandler) {
				this.rest.get('/deployment/api/deployments', (data) => {
					result = [];
					data.content.forEach((content) => {
						content.region = this;
						result.push(Object.assign(new Project(), content));
					});
					resultHandler(result);
				}, errorHandler);
			}
		};

		this.print = () => { console.log(this); }

		this.rest = {};

		this.rest.get = (url, resultHandler, errorHandler) => {
			fetch(`/aria/aa/${url}`, {
				headers: {
					"Authorization": window.common.auth.bearerToken,
					"AA-Auth": window.opera.aa[this.hostname].accessToken,
					"AA-Host": this.hostname,
					"Accept": "application/json; charset=utf-8"
				}
			}).then((res) => {
				if (res.ok) { return res.json(); }
				if (errorHandler) { errorHandler(res); }
				throw res
			}).then((data) => {
				if (resultHandler) { resultHandler(data); }
			});
		};

		this.rest.post = (url, data, resultHandler, errorHandler) => {
			fetch(`/aria/aa${url}`, {
				method: "POST",
				headers: {
					"Authorization": window.common.auth.bearerToken,
					"AA-Auth": window.opera.aa[this.hostname].accessToken,
					"AA-Host": this.hostname,
					"Content-Type": "application/json; charset=utf-8",
					"Accept": "application/json; charset=utf-8"
				},
				body: JSON.stringify(data)
			}).then((res) => {
				if (res.ok) { return res.json(); }
				if (errorHandler) { errorHandler(res); }
				throw res
			}).then((data) => {
				if (resultHandler) { resultHandler(data); }
			});
		};

		this.rest.put = (url, data, resultHandler, errorHandler) => {
			fetch(`/aria/aa${url}`, {
				method: "PUT",
				headers: {
					"Authorization": window.common.auth.bearerToken,
					"AA-Auth": window.opera.aa[this.hostname].accessToken,
					"AA-Host": this.hostname,
					"Content-Type": "application/json; charset=utf-8",
					"Accept": "application/json; charset=utf-8"
				},
				body: JSON.stringify(data)
			}).then((res) => {
				if (res.ok) { return res.json(); }
				if (errorHandler) { errorHandler(res); }
				throw res
			}).then((data) => {
				if (resultHandler) { resultHandler(data); }
			});
		};

		this.rest.patch = (url, data, resultHandler, errorHandler) => {
			fetch(`/aria/aa${url}`, {
				method: "PATCH",
				headers: {
					"Authorization": window.common.auth.bearerToken,
					"AA-Auth": window.opera.aa[this.hostname].accessToken,
					"AA-Host": this.hostname,
					"Content-Type": "application/json; charset=utf-8",
					"Accept": "application/json; charset=utf-8"
				},
				body: JSON.stringify(data)
			}).then((res) => {
				if (res.ok) { return res.json(); }
				if (errorHandler) { errorHandler(res); }
				throw res
			}).then((data) => {
				if (resultHandler) { resultHandler(data); }
			});
		};

		this.rest.delete = (url, resultHandler, errorHandler) => {
			fetch(`/aria/aa${url}`, {
				method: "DELETE",
				headers: {
					"Authorization": window.common.auth.bearerToken,
					"AA-Auth": window.opera.aa[this.hostname].accessToken,
					"AA-Host": this.hostname,
					"Accept": "application/json; charset=utf-8"
				}
			}).then((res) => {
				if (res.ok) { return res.json(); }
				if (errorHandler) { errorHandler(res); }
				throw res
			}).then((data) => {
				if (resultHandler) { resultHandler(data); }
			});
		};
	};

	window.opera.getRegions = () => {
		result = []
		window.opera.aa.hostnames.forEach((hostname) => {
			result.push(Object.assign(new Region(), {
				hostname: hostname,
				name: window.opera.aa[hostname].name,
				status: window.opera.aa[hostname].status
			}));
		});
		return result;
	};

	window.common.init(() => {
		window.common.auth.loginMiddleWare = (loginProcess) => {
			let aaEndpointId = window.common.util.getCookie("ARIA_ENDPOINT_ID");
			if (aaEndpointId) {
				fetch(`/uerp/v1/aria/endpoint/${aaEndpointId}`, {
					headers: window.common.auth.headers
				}).then((res) => {
					if (res.ok) { return res.json(); }
					else {
						window.common.util.delCookie("ARIA_ENDPOINT_ID");
						window.location.replace("/aria/auth/login");
					}
				}).then((endpoint) => {
					let aa = {};
					aa.hostnames = [];
					endpoint.aa.forEach((aaEndpoint) => {
						aa.hostnames.push(aaEndpoint.hostname);
						aa[aaEndpoint.hostname] = aaEndpoint
					});
					window.opera.vidm = endpoint.vidm;
					window.opera.aa = aa
					loginProcess();
				});
			} else {
				window.location.replace("/aria/auth/login");
			}
		};
		window.common.auth.logoutMiddleWare = () => { window.common.util.delCookie("ARIA_ENDPOINT_ID"); };
		window.common.auth.login("/", mainHandler, () => { console.error("login error"); });
	});
};
