window.module = window.module || {};
window.module.data = window.module.data || {
	init: () => {
		console.log("window.module.data start initialization");

		window.module.data.login = () => {
			if (window.common.env.modules.data) {
				fetch("/minio/ui/api/v1/login").then((res) => {
					if (res.ok) { return res.json(); }
					throw res;
				}).then((data) => {
					console.log(data);
					fetch(data.redirectRules[0].redirect).then((res) => {
						if (res.ok) { return res.json(); }
						throw res;
					}).then((data) => {
						data.state = decodeURIComponent(data.state);
						console.log(data);
						fetch("/minio/ui/api/v1/login/oauth2/auth", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(data)
						}).then((res) => {
							if (res.ok) {
								fetch("/minio/ui/cookie_to_data").then((res) => {
									if (res.ok) { return res.json(); }
									throw res;
								}).then((data) => {
									window.module.data.accessToken = data.token;
								});
							}
							throw res;
						});
					});
				});
			} else { throw "window.module.data is not supported"; }
		};

		window.module.data.getBuckets = async () => {
			return fetch("/minio/ui/api/v1/buckets").then((res) => {
				if (res.ok) { return res.json(); }
				throw res;
			}).then((data) => {
				let result = [];
				data.buckets.forEach((content) => { result.push(Object.assign(new Bucket(), content)); });
				return __set_data_array_functions__(result, Bucket);
			});
		};

		function Bucket() {
			// print to console
			this.print = () => { console.log(this); };
		};

		function __set_data_array_functions__(arr, obj) {

			// get length
			arr.len = () => { return arr.length; };

			// check empty
			arr.empty = () => {
				if (arr.len() == 0) { return true; }
				else { return false; }
			};

			// find one object by id
			arr.findById = (id) => {
				arr.forEach((content) => { if (id == content.id) { return content; } });
				return None
			};

			// get list of name included
			arr.searchByName = (name) => {
				let result = [];
				arr.forEach((content) => { if (content.name.indexOf(name) > -1) { result.push(content); } });
				return setArrayFunctions(result, arr.obj);
			};

			// get list of match value at specific field
			arr.searchByField = (field, value) => {
				let result = [];
				arr.forEach((content) => { if (value == content[field]) { result.push(content); } });
				return setArrayFunctions(result, arr.obj);
			};

			// sort asc by field
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

			// sort desc by field
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

			// print to console
			arr.print = () => {
				if (arr.empty()) { console.log(`${arr.obj.name}s is empty array`); }
				else { console.log(`${arr.obj.name}s`, arr); }
			};

			arr.obj = obj;
			return arr;
		};

		console.log("window.module.data is ready");
	}
};

/*
window.module.data.init = () => {

	console.log("window.module.data start initialization");

	window.module.data.login = () => {
		if (window.common.env.modules.data) {
			return fetch("/minio/ui/api/v1/login").then((res) => {
				if (res.ok) { return res.json(); }
				throw res;
			}).then((data) => {
				return fetch(data.redirectRules[0].redirect).then((res) => {
					if (res.ok) { return res.json(); }
					throw res;
				}).then((data) => {
					data.state = decodeURIComponent(data.state);
					return fetch("/minio/ui/api/v1/login/oauth2/auth", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(data)
					}).then((res) => {
						if (res.ok) {
							return fetch("/minio/ui/cookie_to_data").then((res) => {
								if (res.ok) { return res.json(); }
								throw res;
							}).then((data) => {
								window.module.data.accessToken = data.token;
							});
						}
						throw res;
					});
				});
			});
		} else if (resultHandler) { resultHandler(); }
	};

	window.module.data.getBuckets = async () => {
		return fetch("/minio/ui/api/v1/buckets").then((res) => {
			if (res.ok) { return res.json(); }
			throw res;
		}).then((data) => {
			let result = [];
			data.buckets.forEach((content) => { result.push(Object.assign(new Bucket(), content)); });
			return __set_data_array_functions__(result, Bucket);
		});
	};

	function Bucket() {
		// print to console
		this.print = () => { console.log(this); };
	};







	function __set_data_array_functions__(arr, obj) {

		// get length
		arr.len = () => { return arr.length; };

		// check empty
		arr.empty = () => {
			if (arr.len() == 0) { return true; }
			else { return false; }
		};

		// find one object by id
		arr.findById = (id) => {
			arr.forEach((content) => { if (id == content.id) { return content; } });
			return None
		};

		// get list of name included
		arr.searchByName = (name) => {
			let result = [];
			arr.forEach((content) => { if (content.name.indexOf(name) > -1) { result.push(content); } });
			return setArrayFunctions(result, arr.obj);
		};

		// get list of match value at specific field
		arr.searchByField = (field, value) => {
			let result = [];
			arr.forEach((content) => { if (value == content[field]) { result.push(content); } });
			return setArrayFunctions(result, arr.obj);
		};

		// sort asc by field
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

		// sort desc by field
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

		// print to console
		arr.print = () => {
			if (arr.empty()) { console.log(`${arr.obj.name}s is empty array`); }
			else { console.log(`${arr.obj.name}s`, arr); }
		};

		arr.obj = obj;
		return arr;
	};

	console.log("window.module.data is ready");

	window.module.data.action = {};

	window.module.data.action.upload = async (bucket, path, files) => {
		let results = [];
		if (files.length > 0) {
			let basePath = path.split("/").filter((item) => { return item; }).join("/");
			let coros = [];
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
				coro.then((res) => { results[i] = res; });
			}
		}
		return results;
	};

	function Folder() {
		this.upload = async (files) => {
			return fetch(`/minio/ui/api/v1/buckets/${this.bucket}/objects/download?prefix=${prefix}`).then((res) => {
				if (res.ok) { return res.blob(); }
				throw res;
			});
		};

		// print to console
		this.print = () => { console.log(this); };
	};

	function File() {
		this.download = async () => {
			return fetch(`/minio/ui/api/v1/buckets/${this.bucket}/objects/download?prefix=${prefix}`).then((res) => {
				if (res.ok) { return res.blob(); }
				throw res;
			});
		};

		// print to console
		this.print = () => { console.log(this); };
	};





























	window.module.data.action.download = async (url) => {
		return fetch(`/minio/ui/api/v1${url}`).then((res) => {
			if (res.ok) { return res.blob(); }
			throw res;
		});
	};

	function File() {
		this.download = async () => {
			return fetch(`/minio/ui/api/v1/buckets/${this.bucket}/objects/download?prefix=${prefix}`).then((res) => {
				if (res.ok) { return res.blob(); }
				throw res;
			});
		}
	};

	window.common.data.action.setObjectMethods = (bucket, object) => {
		let prefix = btoa(object.name);
		if (object.etag) {
			object.url = `/minio/ui/api/v1/buckets/${bucket}/objects?prefix=${prefix}`;
			object.downloadUrl = `/minio/ui/api/v1/buckets/${bucket}/objects/download?prefix=${prefix}`;
			object.dir = false;
			object.download = async () => {
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

};

*/