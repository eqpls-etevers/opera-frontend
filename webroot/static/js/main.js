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
	let region = regions[0];

	region.getProjects().then((projects) => {
		projects.print();
	});
	
	region.getDeployments().then((deployments) => {
		deployments.print();
	});
	
	
	

	/*
	regions.print();
	regions.forEach((region) => {
		region.getProjects((projects) => {
			projects.print();
			projects.forEach((project) => {
				project.getCatalogs((catalogs) => {
					catalogs.print();
					catalogs.forEach((catalog) => {
						catalog.getRequestForm((form) => {
							form.print();
						});
					});
				});
				project.getDeployments((deployments) => {
					deployments.print();
					deployments.forEach((deployment) => {
						deployment.getResources((resources) => {
							resources.print();
							resources.forEach((resource) => {
								resource.getActions((actions) => {
									actions.sortAscBy("displayName");
									actions.print();
								});
							});
						});
					});
				});
			});
		});
	});
	*/
};

window.opera.login(main);