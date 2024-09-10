window.module = window.module || {};
window.module.data = window.module.data || {
	init: () => {
		window.module.data.isAutoLogin = true;
		console.log("(window.module.data) start");
		window.module.data.login = () => {
			fetch("/minio/ui/api/v1/login").then((res) => {
				if (res.ok) { return res.json(); }
				throw res;
			}).then((data) => {
				fetch(data.redirectRules[0].redirect).then((res) => {
					if (res.ok) { return res.json(); }
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
								throw res;
							}).then((data) => {
								window.module.data.accessToken = data.token;
								window.module.data.getBuckets = async () => {
									return fetch("/minio/ui/api/v1/buckets").then((res) => {
										if (res.ok) { return res.json(); }
										throw res;
									}).then((data) => {
										let result = [];
										data.buckets.forEach((content) => {
											let sname = content.name.split(".");
											content.owner = sname[0];
											content.displayName = sname[1];
											content.personal = content.owner == window.common.auth.username ? true : false;
											result.push(new Bucket(content));
										});
										return window.common.util.setArrayFunctions(result, Bucket);
									});
								};
							});
						} else { throw res; }
					});
				});
			});
		};

		function Bucket(content) {
			this.getNodes = async () => {
				return fetch(`/minio/ui/api/v1/buckets/${this.name}/objects`).then((res) => {
					if (res.ok) { return res.json(); }
					throw res;
				}).then((data) => {
					let folders = [];
					let files = [];
					data.objects.forEach((content) => {
						content.bucket = this;
						content.parent = this;
						if (content.etag) { files.push(new File(content)); }
						else { folders.push(new Folder(content)); }
					});
					return {
						folders: window.common.util.setArrayFunctions(folders, Folder),
						files: window.common.util.setArrayFunctions(files, File)
					};
				});
			};
			this.upload = async (files) => {
				let results = [];
				if (files.length > 0) {
					let coros = [];
					for (let i = 0; i < files.length; i++) {
						let file = files[i];
						let form = new FormData();
						form.append(file.size, file);
						coros.push(fetch(`/minio/ui/api/v1/buckets/${this.bucket.name}/objects/upload?prefix=${btoa(file.name)}`, {
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
			this.print = () => { console.log(this); };
		};

		function Folder(content) {
			this.getNodes = async () => {
				return fetch(`/minio/ui/api/v1/buckets/${this.bucket.name}/objects?prefix=${btoa(this.name)}`).then((res) => {
					if (res.ok) { return res.json(); }
					throw res;
				}).then((data) => {
					let folders = [];
					let files = [];
					data.objects.forEach((content) => {
						content.bucket = this.bucket;
						content.parent = this;
						if (content.etag) { files.push(new File(content)); }
						else { folders.push(new Folder(content)); }
					});
					return {
						folders: window.common.util.setArrayFunctions(folders, Folder),
						files: window.common.util.setArrayFunctions(files, File)
					};
				});
			};
			this.getParent = async () => { return this.parent; };
			this.createFolder = async (name) => {
				return new Folder({
					last_modified: "",
					name: `${this.name}${name}/`,
					bucket: this.bucket
				});
			};
			this.upload = async (files) => {
				let results = [];
				if (files.length > 0) {
					let coros = [];
					for (let i = 0; i < files.length; i++) {
						let file = files[i];
						let prefix = `${this.name}${file.name}`;
						let form = new FormData();
						form.append(file.size, file);
						coros.push(fetch(`/minio/ui/api/v1/buckets/${this.bucket.name}/objects/upload?prefix=${btoa(prefix)}`, {
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
			this.delete = async () => {
				return fetch(`/minio/ui/api/v1/buckets/${this.bucket.name}/objects?prefix=${btoa(this.name)}&recursive=true`, {
					method: "DELETE"
				}).then((res) => {
					if (res.ok) { return true; }
					throw res;
				});
			};
			this.print = () => { console.log(this); };
		};

		function File(content) {
			this.getParent = async () => { return this.parent; };
			this.download = async () => {
				return fetch(`/minio/ui/api/v1/buckets/${this.bucket.name}/objects/download?prefix=${file.name}`).then((res) => {
					if (res.ok) { return res.blob(); }
					throw res;
				});
			};
			this.delete = async () => {
				return fetch(`/minio/ui/api/v1/buckets/${this.bucket.name}/objects?prefix=${btoa(this.name)}`, {
					method: "DELETE"
				}).then((res) => {
					if (res.ok) { return true; }
					throw res;
				});
			};
			this.print = () => { console.log(this); };
		};

		console.log("(window.module.data) ready");
	}
};
