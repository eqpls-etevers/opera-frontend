// javascript here

window.opera = window.opera || {};
window.opera.login = (mainHandler) => {

	// searchable resource type
	window.opera.resourceType = {
		"vm": "Cloud.vSphere.Machine",
		"disk": "Cloud.vSphere.Disk",
		"network": "Cloud.Network",
	};

	// only support action in list
	window.opera.resourceActions = {

		// VM
		"Cloud.vSphere.Machine.Update.Tags": "태그 수정",

		"Cloud.vSphere.Machine.PowerOn": "전원 켬",
		"Cloud.vSphere.Machine.PowerOff": "전원 끔",
		"Cloud.vSphere.Machine.Reboot": "재시작",
		"Cloud.vSphere.Machine.Suspend": "일시 정지",
		"Cloud.vSphere.Machine.Shutdown": "운영체제 종료",

		"Cloud.vSphere.Machine.Reset": "초기화",
		"Cloud.vSphere.Machine.Rebuild": "재구성",
		"Cloud.vSphere.Machine.Delete": "삭제",

		"Cloud.vSphere.Machine.Resize": "성능 조정",
		"Cloud.vSphere.Machine.Unregister": "관리 해지",

		"Cloud.vSphere.Machine.ApplySaltConfiguration": "솔트스택 설정 적용",
		"Cloud.vSphere.Machine.AttachSaltStackResource": "솔트스택 자원 연결",

		"Cloud.vSphere.Machine.Add.Disk": "디스크 추가",
		"Cloud.vSphere.Machine.Remove.Disk": "디스크 삭제",
		"Cloud.vSphere.Machine.Resize.Compute.Disk": "추가 디스크 크기 조정",
		"Cloud.vSphere.Machine.Compute.Disk.Resize": "부트 디스크 크기 조정",

		"Cloud.vSphere.Machine.Snapshot.Create": "스냅샷 생성",
		"Cloud.vSphere.Machine.Snapshot.Delete": "스냅샷 삭제",
		"Cloud.vSphere.Machine.Snapshot.Revert": "스냅샷 적용",

		"Cloud.vSphere.Machine.Remote.PrivateKey": "개인 키 다운로드",
		"Cloud.vSphere.Machine.Remote.Console": "원격 콘솔 연결",

		"Cloud.vSphere.Machine.Change.SecurityGroup": "보안 그룹 변경",

		// Disk
		"Cloud.vSphere.Disk.Disk.Change.Display.Name": "이름 변경",
		"Cloud.vSphere.Disk.Disk.Resize": "크기 조정",
		"Cloud.vSphere.Disk.Update.Tags": "태그 수정",

		// Security Group
		"Cloud.SecurityGroup.Delete": "삭제",
		"Cloud.SecurityGroup.Reconfigure.SecurityGroup": "재설정",
	};

	// function of getting region list is only sync type
	window.opera.getRegions = () => {
		let result = [];
		window.opera.regions.hostnames.forEach((hostname) => {
			result.push(Object.assign(new Region(), window.opera.regions[hostname]));
		});
		return setArrayFunctions(result);
	};

	// all functions & objects are async types which must be required result handler (function type) in params

	// Region
	function Region() {

		// get project list in region
		this.getProjects = () => {
			return this.rest.get('/iaas/api/projects').then((data) => {
				let result = [];
				data.content.forEach((content) => {
					content.region = this;
					result.push(Object.assign(new Project(), content));
				});
				return setArrayFunctions(result);
			});
		};

		// get catalog list in region
		this.getCatalogs = () => {
			return this.rest.get('/catalog/api/items').then((data) => {
				let result = [];
				data.content.forEach((content) => {
					content.region = this;
					result.push(Object.assign(new Catalog(), content));
				});
				return setArrayFunctions(result);
			});
		};

		// get deployment list in region
		this.getDeployments = (search, sort) => {
			let query = [];
			if (search) { query.push(`search=${search}`); }
			if (typeof sort == "list" && sort.length == 2) {
				let field = sort[0];
				let order = sort[1];
				if (field && (order == "asc" || order == "desc")) { query.push(`sort=${field},${order}`); }
				else { throw `"field" is required and "order" must be "asc" or "desc"`; }
			}
			if (query.length > 0) { query = `?${query.join("&")}`; }
			else { query = ""; }
			return this.rest.get(`/deployment/api/deployments${query}`).then((data) => {
				let result = [];
				data.content.forEach((content) => {
					content.region = this;
					result.push(Object.assign(new Deployment(), content));
				});
				return setArrayFunctions(result);
			});
		};

		// get resource list in region
		this.getResources = (search, type, tag, sort) => {
			let query = [];
			if (search) { query.push(`search=${search}`); }
			if (type) {
				if (type in window.opera.resourceType) { query.push(`resourceTypes=${window.opera.resourceType[type]}`); }
				else { throw `"${type}" is not support type option`; }
			}
			if (tag) { query.push(`tags=${tag}`); }
			if (typeof sort == "list" && sort.length == 2) {
				let field = sort[0];
				let order = sort[1];
				if (field && (order == "asc" || order == "desc")) { query.push(`sort=${field},${order}`); }
				else { throw `"field" is required and "order" must be "asc" or "desc"`; }
			}
			if (query.length > 0) { query = `?${query.join("&")}`; }
			else { query = ""; }
			return this.rest.get(`/deployment/api/resources${query}`).then((data) => {
				let result = [];
				data.content.forEach((content) => {
					content.region = this;
					result.push(Object.assign(new Resource(), content))
				});
				return setArrayFunctions(result);
			});
		};

		// register current region to "window.opera.Region" property
		this.checkpoint = () => { window.opera.Region = this; };

		// print to console
		this.print = () => { console.log(this); };

		// internal methods
		this.rest = {};
		this.rest.get = async (url) => {
			return fetch(`/aria/aa/${url}`, {
				headers: {
					"Authorization": window.common.auth.bearerToken,
					"AA-Auth": window.opera.regions[this.hostname].accessToken,
					"AA-Host": this.hostname,
					"Accept": "application/json; charset=utf-8"
				}
			}).then((res) => {
				if (res.ok) { return res.json(); }
				throw res
			});
		};
		this.rest.post = async (url, data) => {
			return fetch(`/aria/aa${url}`, {
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
				throw res
			});
		};
		this.rest.put = async (url, data) => {
			return fetch(`/aria/aa${url}`, {
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
				throw res
			});
		};
		this.rest.patch = async (url, data) => {
			return fetch(`/aria/aa${url}`, {
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
			});
		};
		this.rest.delete = async (url) => {
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
				throw res
			});
		};
	};

	// Project
	function Project() {

		// get catalog list in project
		this.getCatalogs = () => {
			return this.region.rest.get(`/catalog/api/items?projects=${this.id}`).then((data) => {
				let result = [];
				data.content.forEach((content) => {
					content.region = this.region;
					result.push(Object.assign(new Catalog(), content));
				});
				return setArrayFunctions(result);
			});
		};

		// get deployment list in project
		this.getDeployments = (search, sort) => {
			let query = [];
			if (search) { query.push(`search=${search}`); }
			if (typeof sort == "list" && sort.length == 2) {
				let field = sort[0];
				let order = sort[1];
				if (field && (order == "asc" || order == "desc")) { query.push(`sort=${field},${order}`); }
				else { throw `"field" is required and "order" must be "asc" or "desc"`; }
			}
			if (query.length > 0) { query = `&${query.join("&")}`; }
			else { query = ""; }
			return this.region.rest.get(`/deployment/api/deployments?projects=${this.id}${query}`).then((data) => {
				let result = [];
				data.content.forEach((content) => {
					content.region = this.region;
					result.push(Object.assign(new Deployment(), content));
				});
				return setArrayFunctions(result);
			});
		};

		// get resource list in project
		this.getResources = (search, type, tag, sort) => {
			let query = [];
			if (search) { query.push(`search=${search}`); }
			if (type) {
				if (type in window.opera.resourceType) { query.push(`resourceTypes=${window.opera.resourceType[type]}`); }
				else { throw `"${type}" is not support type option`; }
			}
			if (tag) { query.push(`tags=${tag}`); }
			if (typeof sort == "list" && sort.length == 2) {
				let field = sort[0];
				let order = sort[1];
				if (field && (order == "asc" || order == "desc")) { query.push(`sort=${field},${order}`); }
				else { throw `"field" is required and "order" must be "asc" or "desc"`; }
			}
			if (query.length > 0) { query = `&${query.join("&")}`; }
			else { query = ""; }
			return this.region.rest.get(`/deployment/api/resources?projects=${this.id}${query}`).then((data) => {
				let result = [];
				data.content.forEach((content) => {
					content.region = this.region;
					result.push(Object.assign(new Resource(), content))
				});
				return setArrayFunctions(result);
			});
		};

		// register current project to "window.opera.Project" property
		this.checkpoint = () => { window.opera.Project = this; };

		// print to console
		this.print = () => { console.log(this); };
	};

	// Catalog
	function Catalog() {

		// get request form of catalog
		this.getRequestForm = () => {
			return this.region.rest.get(`/catalog/api/items/${this.id}/versions`).then((versions) => {
				if (versions.content.length > 0) {
					let lastVersionId = versions.content[0].id
					this.region.rest.get(`/catalog/api/items/${this.id}/versions/${lastVersionId}`).then((detail) => {
						this.schema = detail.schema;
						this.formId = detail.formId;
						if (this.formId) {
							this.region.rest.post(`/form-service/api/forms/renderer/model?formType=requestForm&isUpdateAction=false&formId=${this.formId}&sourceType=com.vmw.blueprint.version&sourceId=${this.id}/${lastVersionId}`, this.schema).then((form) => {
								this.form = form.model;
								return Object.assign(new RequestForm(), {
									type: "catalog",
									caller: this,
									schema: this.schema,
									form: this.form
								});
							});
						} else {
							this.form = null;
							return Object.assign(new RequestForm(), {
								type: "catalog",
								caller: this,
								schema: this.schema,
								form: this.form
							});
						}
					});
				} else {
					this.region.rest.get(`/catalog/api/items/${this.id}`).then((detail) => {
						this.schema = detail.schema;
						this.formId = detail.formId;
						if (this.formId) {
							try {
								this.region.rest.post(`/form-service/api/forms/renderer/model?formId=${this.formId}`, {}).then((form) => {
									this.form = form.model;
									return Object.assign(new RequestForm(), {
										type: "catalog",
										caller: this,
										schema: this.schema,
										form: this.form
									});
								});
							} catch (e) {
								this.form = null;
								return Object.assign(new RequestForm(), {
									type: "catalog",
									caller: this,
									schema: this.schema,
									form: this.form
								});
							}
						} else {
							this.form = null;
							return Object.assign(new RequestForm(), {
								type: "catalog",
								caller: this,
								schema: this.schema,
								form: this.form
							});
						}
					});
				}
			});
		};

		// register current catalog to "window.opera.Catalog" property
		this.checkpoint = () => { window.opera.Catalog = this; };

		// print to console
		this.print = () => { console.log(this); };
	};

	// Request Form
	function RequestForm() {

		// submit request data
		this.submit = (inputProperties) => {
			switch (this.type) {
				case "catalog":
					return this.region.rest.post(`/catalog/api/items/${this.caller.id}/request`, inputProperties).then((data) => { return data; });
				case "action":
					inputProperties.actionId = this.caller.id;
					return this.region.rest.post(`/deployment/api/resources/${this.caller.resource.id}/requests`, inputProperties).then((data) => { return data; });
			}
			throw "unsupport type request form";
		};

		// get html data which is drawn by this.schema & this.form information
		this.draw = () => {
			return "<div>draw is not implemented now</div>";
		};

		// register current request form to "window.opera.RequestForm" property
		this.checkpoint = () => { window.opera.RequestForm = this; };

		// print to console
		this.print = () => { console.log(this); };
	};

	function Deployment() {

		// get resource list in project
		this.getResources = (search, type, tag, sort) => {
			let query = [];
			if (search) { query.push(`search=${search}`); }
			if (type) {
				if (type in window.opera.resourceType) { query.push(`resourceTypes=${window.opera.resourceType[type]}`); }
				else { throw `"${type}" is not support type option`; }
			}
			if (tag) { query.push(`tags=${tag}`); }
			if (typeof sort == "list" && sort.length == 2) {
				let field = sort[0];
				let order = sort[1];
				if (field && (order == "asc" || order == "desc")) { query.push(`sort=${field},${order}`); }
				else { throw `"field" is required and "order" must be "asc" or "desc"`; }
			}
			if (query.length > 0) { query = `&${query.join("&")}`; }
			else { query = ""; }
			return this.region.rest.get(`/deployment/api/deployments/${this.id}/resources${query}`).then((data) => {
				let result = [];
				data.content.forEach((content) => {
					content.region = this.region;
					result.push(Object.assign(new Resource(), content))
				});
				return setArrayFunctions(result);
			});
		};

		// register current deployment to "window.opera.Deployment" property
		this.checkpoint = () => { window.opera.Deployment = this; };

		// print to console
		this.print = () => { console.log(this); };
	};

	function Resource() {

		// get project of resource
		this.getProject = () => {
			if (this.properties.project) { return this.region.rest.get(`/iaas/api/projects/${this.properties.project}`).then((data) => { return Object.assign(new Project(), data); }); }
			else { throw "could not get project: this resource may be out of project scopes"; }
		};

		// get deployment of resource
		this.getDeployment = () => {
			return this.region.rest.get(`/deployment/api/resources/${this.id}}?expand=deployment`).then((data) => {
				if (data.deployment) { return this.region.rest.get(`/deployment/api/deployments/${data.deployment.id}`).then((data) => { return Object.assign(new Deployment(), data); }); }
				else { throw "could not get deployment: this resource may be out of deployment scopes"; }
			});
		};

		// get available actions of resource
		this.getActions = () => {
			return this.region.rest.get(`/deployment/api/resources/${this.id}/actions`).then((data) => {
				let result = [];
				data.forEach((content) => {
					if (content.id in window.opera.resourceActions) {
						content.region = this.region;
						content.resource = this;
						content.displayName = window.opera.resourceActions[content.id];
						result.push(Object.assign(new Action(), content));
					} else { console.warn("could not support action", content); }
				});
				return setArrayFunctions(result);
			});
		};

		// register current resource to "window.opera.Resource" property
		this.checkpoint = () => { window.opera.Resource = this; };

		// print to console
		this.print = () => { console.log(this); };
	};

	function Action() {

		// get request form of action
		this.getRequestForm = () => {
			return this.region.rest.get(`/deployment/api/resources/${this.resource.id}/actions/${this.id}`).then((data) => {
				return Object.assign(new RequestForm(), {
					type: "action",
					caller: this,
					schema: data.schema,
					form: null
				});
			});
		};

		// register current action to "window.opera.Action" property
		this.checkpoint = () => { window.opera.Action = this; };

		// print to console
		this.print = () => { console.log(this); };
	};

	// abstract of aria object array
	function setArrayFunctions(arr) {
		arr.readById = (id) => {
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
			if (arr.length > 0) {
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
			if (arr.length > 0) {
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
		arr.print = () => { console.log(arr); };
		return arr;
	};

	// internal initialize for authorization
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
