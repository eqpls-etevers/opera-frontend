// javascript here

function main() {
	document.getElementById("opera-username").innerText = window.common.auth.username;
	document.getElementById("opera-userinfo").innerText = JSON.stringify(window.common.auth.userInfo);
	document.getElementById("opera-access-token").innerText = window.common.auth.accessToken;
	document.getElementById("vidm-access-token").innerText = window.opera.vidm.accessToken;

	let regionsDom = document.getElementById("regions-access-tokens");
	window.opera.regions.hostnames.forEach((hostname) => {
		let region = window.opera.regions[hostname];
		let dom = document.createElement('p');
		dom.innerText = `${hostname}: ${region.accessToken}`;
		regionsDom.appendChild(dom);
	});

	let regions = window.opera.getRegions();
	regions.forEach((region) => {
		region.print();
		region.getProjects((projects) => {
			projects.forEach((project) => {
				project.print();
				project.getCatalogs((catalogs) => {
					catalogs.sortDescBy('name');
					catalogs.forEach((catalog) => {
						catalog.print();
					});
				});
				project.getDeployments((deployments) => {
					deployments.sortDescBy('name');
					deployments.forEach((deployment) => {
						deployment.print();
					})
				});
			});
		});
	});
};

window.opera.login(main);