// javascript here

window.opera = window.opera || {};
window.opera.login = (mainHandler) => {

	function Deployment() {
		this.print = () => { console.log(this); }
	};

	function Deployments() {
		this.readById = (id) => {
			this.forEach((content) => { if (id == content.id) { return content; } });
			return None
		};
		this.searchByName = (name) => {
			let result = [];
			this.forEach((content) => { if (content.name.indexOf(name) > -1) { result.push(content); } });
			return Object.assign(new Projects(), result)
		};
		this.searchByField = (field, value) => {
			let result = [];
			this.forEach((content) => { if (value == content[field]) { result.push(content); } });
			return Object.assign(new Projects(), result)
		}
		this.ascBy = (field) => {
			this.sort(function(a, b) { return a[field] - b[field]; });
		};
		this.descBy = (field) => {
			this.sort(function(a, b) { return b[field] - a[field]; });
		};
	};

	function Catalog() {
		this.print = () => { console.log(this); }
	};

	function Catalogs() {
		this.readById = (id) => {
			this.forEach((content) => { if (id == content.id) { return content; } });
			return None
		};
		this.searchByName = (name) => {
			let result = [];
			this.forEach((content) => { if (content.name.indexOf(name) > -1) { result.push(content); } });
			return Object.assign(new Projects(), result)
		};
		this.searchByField = (field, value) => {
			let result = [];
			this.forEach((content) => { if (value == content[field]) { result.push(content); } });
			return Object.assign(new Projects(), result)
		}
		this.ascBy = (field) => {
			this.sort(function(a, b) { return a[field] - b[field]; });
		};
		this.descBy = (field) => {
			this.sort(function(a, b) { return b[field] - a[field]; });
		};
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
					resultHandler(Object.assign(new Deployments(), result));
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
					resultHandler(Object.assign(new Catalogs(), result));
				}, errorHandler);
			}
		};

		this.print = () => { console.log(this); }
	};

	function Projects() {
		this.readById = (id) => {
			this.forEach((content) => { if (id == content.id) { return content; } });
			return None
		};
		this.searchByName = (name) => {
			let result = [];
			this.forEach((content) => { if (content.name.indexOf(name) > -1) { result.push(content); } });
			return Object.assign(new Projects(), result)
		};
		this.searchByField = (field, value) => {
			let result = [];
			this.forEach((content) => { if (value == content[field]) { result.push(content); } });
			return Object.assign(new Projects(), result)
		}
		this.ascBy = (field) => {
			this.sort(function(a, b) { return a[field] - b[field]; });
		};
		this.descBy = (field) => {
			this.sort(function(a, b) { return b[field] - a[field]; });
		};
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
					resultHandler(Object.assign(new Deployments(), result));
				}, errorHandler);
			}
		};

		this.getCatalogs = (resultHandler, errorHandler) => {
			if (resultHandler) {
				this.region.rest.get('/catalog/api/items', (data) => {
					result = [];
					data.content.forEach((content) => {
						content.region = this.region;
						result.push(Object.assign(new Catalog(), content));
					});
					resultHandler(Object.assign(new Catalogs(), result));
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
					resultHandler(Object.assign(new Projects(), result));
				}, errorHandler);
			}
		};

		this.print = () => { console.log(this); }

		this.rest = {};

		this.rest.get = (url, resultHandler, errorHandler) => {
			fetch(`/aria/aa/${url}`, {
				headers: {
					"Authorization": window.common.auth.bearerToken,
					"AA-Auth": window.opera.regions[this.hostname].accessToken,
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
					"AA-Auth": window.opera.regions[this.hostname].accessToken,
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
					"AA-Auth": window.opera.regions[this.hostname].accessToken,
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
					"AA-Auth": window.opera.regions[this.hostname].accessToken,
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
					"AA-Auth": window.opera.regions[this.hostname].accessToken,
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
		window.opera.regions.hostnames.forEach((hostname) => {
			result.push(Object.assign(new Region(), window.opera.regions[hostname]));
		});
		return result;
	};

	window.common.init(() => {
		window.common.auth.loginMiddleWare = (loginProcess) => {
			let endpointId = window.common.util.getCookie("ARIA_ENDPOINT_ID");
			if (endpointId) {
				fetch(`/uerp/v1/aria/endpoint/${endpointId}`, {
					headers: window.common.auth.headers
				}).then((res) => {
					if (res.ok) { return res.json(); }
					else {
						window.common.util.delCookie("ARIA_ENDPOINT_ID");
						window.location.replace("/aria/auth/login");
					}
				}).then((endpoint) => {
					let regions = {};
					regions.hostnames = [];
					endpoint.regions.forEach((region) => {
						regions.hostnames.push(region.hostname);
						regions[region.hostname] = region
					});
					window.opera.vidm = endpoint.vidm;
					window.opera.regions = regions;
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
