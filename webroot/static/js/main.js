// javascript here

function main() {
	document.getElementById("opera-username").innerText = window.common.auth.username;
	document.getElementById("opera-userinfo").innerText = JSON.stringify(window.common.auth.userInfo);
	document.getElementById("opera-access-token").innerText = window.common.auth.accessToken;
	document.getElementById("vidm-access-token").innerText = window.opera.vidm.accessToken;

	let aaDom = document.getElementById("aa-access-tokens");
	window.opera.aa.hostnames.forEach((hostname) => {
		let aa = window.opera.aa[hostname];
		let dom = document.createElement('p');
		dom.innerText = `${hostname}: ${aa.accessToken}`;
		aaDom.appendChild(dom);
	});

	let regions = window.opera.getRegions();
	regions.forEach((region) => {
		region.print();
		region.getProject((projects) => {
			projects.forEach((project) => {
				project.print();
				project.getCatalogs((catalogs) => {
					catalogs.forEach((catalog) => {
						catalog.print();
					});
				});
			});
		});
	});
};

window.opera.login(main);