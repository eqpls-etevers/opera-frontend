window.Module = window.Module || {};
window.Module.Data = window.Module.Data || {
	init: () => {
		window.Module.Data.isAutoLogin = true;
		console.log("(Module.Data) start");
		window.Module.Data.login = () => {
			fetch("/minio/api/v1/login").then((res) => {
				if (res.ok) { return res.json(); }
				throw res;
			}).then((data) => {
				fetch(data.redirectRules[0].redirect).then((res) => {
					if (res.ok) { return res.json(); }
					throw res;
				}).then((data) => {
					data.state = decodeURIComponent(data.state);
					fetch("/minio/api/v1/login/oauth2/auth", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(data)
					}).then((res) => {
						if (res.ok) {
							window.Module.Data.getBuckets = async () => {
								let groupBuckets = [];
								let userBuckets = [];
								let groups = Common.Rest.get(`${Common.uerpUrl}/common/data/group/bucket`);
								let users = Common.Rest.get(`${Common.uerpUrl}/common/data/user/bucket`);
								groups = await groups;
								users = await users;
								for (let i = 0; i < groups.length; i++) { groupBuckets.push(new Bucket(await groups[i])) }
								for (let i = 0; i < users.length; i++) { userBuckets.push(new Bucket(await users[i])) }
								return {
									group: Common.Util.setArrayFunctions(groupBuckets),
									user: Common.Util.setArrayFunctions(userBuckets)
								};
							};
							window.Module.Data.createUserBucket = async (name, quota) => {
								if (!name) { throw "(module.data.createBucket) name parameter is required"; }
								return new Bucket(await Common.Rest.post(`${Common.uerpUrl}/common/data/user/bucket`, {
									name: name,
									quota: quota ? parseInt(quota) : 0
								}));
							};
							window.Module.Data.createGroupBucket = async (group, name, quota) => {
								if (!name) { throw "(module.data.createBucket) name parameter is required"; }
								return new Bucket(await Common.Rest.post(`${Common.uerpUrl}/common/data/group/bucket?$group=${group.id}`, {
									name: name,
									quota: quota ? parseInt(quota) : 0
								}));
							};
							window.Module.Data.getAccessKeys = async () => {
								return fetch("/minio/api/v1/service-accounts").then((res) => {
									if (res.ok) { return res.json(); }
									throw res;
								}).then((data) => {
									let result = [];
									data.forEach((content) => {
										content.policy = content.policy || "";
										content.expiry = content.expiry || null;
										content.status = content.accountStatus;
										result.push(new AccessKey(content));
									});
									return Common.Util.setArrayFunctions(result);
								});
							};
							window.Module.Data.createAccessKey = async (name, description, policy, expiry, status) => {
								if (!name) { throw "(module.data.createAccessKey) parameter is required"; }
								description = description || "";
								policy = policy || "";
								expiry = expiry || null;
								status = status || "on";
								return fetch("/minio/api/v1/service-account-credentials", {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({
										name: name,
										description: description,
										policy: policy,
										expiry: expiry,
										status: status,
										accessKey: Common.Util.getRandomString(20),
										secretKey: Common.Util.getRandomString(40)
									})
								}).then((res) => {
									if (res.ok) { return res.json(); }
									throw res;
								})
							};
						} else { throw res; }
					});
				});
			});
		};

		function AccessKey(content) {
			if (content) { Object.assign(this, content); }
			this.update = async () => {
				return fetch(`/minio/api/v1/service-accounts/${Common.Util.utoa(this.accessKey)}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: this.name,
						description: this.description,
						policy: this.policy,
						expiry: this.expiry,
						status: this.status
					})
				}).then((res) => {
					if (res.ok) {
						return fetch(`/minio/api/v1/service-accounts/${Common.Util.utoa(this.accessKey)}`).then((res) => {
							if (res.ok) { return res.json(); }
							throw res;
						}).then((content) => {
							Object.assign(this, content)
							return this
						});
					}
					throw res;
				});
			};
			this.delete = async () => {
				return fetch(`/minio/api/v1/service-accounts/${Common.Util.utoa(this.accessKey)}`, {
					method: "DELETE"
				}).then((res) => {
					if (res.ok) { return true; }
					throw res;
				});
			};
		};

		function Bucket(content) {
			if (content) { Object.assign(this, content); }
			this.getNodes = async () => {
				return fetch(`/minio/api/v1/buckets/${this.externalId}/objects`).then((res) => {
					if (res.ok) { return res.json(); }
					throw res;
				}).then((data) => {
					let folders = [];
					let files = [];
					if (data.objects) {
						data.objects.forEach((content) => {
							content.bucket = this;
							content.parent = this;
							if (content.etag) { files.push(new File(content)); }
							else { folders.push(new Folder(content)); }
						});
					}
					return {
						folders: Common.Util.setArrayFunctions(folders),
						files: Common.Util.setArrayFunctions(files)
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
						coros.push(fetch(`/minio/api/v1/buckets/${this.bucket.externalId}/objects/upload?prefix=${Common.Util.utoa(file.name)}`, {
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
				if (window.Common.Util.checkUUID(this.owner)) {
					return await Common.Rest.delete(`${Common.uerpUrl}/common/data/group/bucket/${this.id}`);
				} else {
					return await Common.Rest.delete(`${Common.uerpUrl}/common/data/user/bucket/${this.id}`);
				}
			};
			this.print = () => { console.log(this); };
		};

		function Folder(content) {
			if (content) { Object.assign(this, content); }
			this.getNodes = async () => {
				return fetch(`/minio/api/v1/buckets/${this.bucket.externalId}/objects?prefix=${Common.Util.utoa(this.name)}`).then((res) => {
					if (res.ok) { return res.json(); }
					throw res;
				}).then((data) => {
					let folders = [];
					let files = [];
					if (data.objects) {
						data.objects.forEach((content) => {
							content.bucket = this.bucket;
							content.parent = this;
							if (content.etag) { files.push(new File(content)); }
							else { folders.push(new Folder(content)); }
						});
					}
					return {
						folders: Common.Util.setArrayFunctions(folders),
						files: Common.Util.setArrayFunctions(files)
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
						coros.push(fetch(`/minio/api/v1/buckets/${this.bucket.externalId}/objects/upload?prefix=${Common.Util.utoa(prefix)}`, {
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
				return fetch(`/minio/api/v1/buckets/${this.bucket.externalId}/objects?prefix=${Common.Util.utoa(this.name)}&recursive=true`, {
					method: "DELETE"
				}).then((res) => {
					if (res.ok) { return true; }
					throw res;
				});
			};
			this.print = () => { console.log(this); };
		};

		function File(content) {
			if (content) { Object.assign(this, content); }
			this.getParent = async () => { return this.parent; };
			this.load = async () => {
				let data = await Common.DB.Blob.index.read(this.etag)
				if (data) { return data.blob; }
				blob = await fetch(`/minio/api/v1/buckets/${this.bucket.externalId}/objects/download?prefix=${Common.Util.utoa(this.name)}`).then((res) => {
					if (res.ok) { return res.blob(); }
					throw res;
				});
				await Common.DB.Blob.index.write(this.etag, { blob: blob });
				return blob;
			};
			this.download = async () => {
				let blob = await this.load();
				let dom = document.createElement("a");
				let fileName = this.name.split("/");
				let url = URL.createObjectURL(blob);
				dom.href = url;
				dom.download = fileName[fileName.length - 1];
				dom.click();
				dom.remove();
				URL.revokeObjectURL(url);
				return blob;
			};
			this.delete = async () => {
				await Common.DB.Blob.index.delete(this.etag);
				return fetch(`/minio/api/v1/buckets/${this.bucket.externalId}/objects?prefix=${Common.Util.utoa(this.name)}`, {
					method: "DELETE"
				}).then((res) => {
					if (res.ok) { return true; }
					throw res;
				});
			};
			this.print = () => { console.log(this); };
		};

		console.log("(Module.Data) ready");
		return window.Module.Data;
	}
};
