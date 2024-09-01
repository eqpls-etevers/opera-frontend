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

	region.getProjects().then((projects) => { projects.print(); });
	region.getCatalogs().then((catalogs) => { catalogs.print(); });
	region.getDeployments().then((deployments) => { deployments.print(); });
	region.getResources().then((resources) => { resources.print(); });

	region.getProjects().then((projects) => {
		projects.print();
		projects.forEach((project) => {
			project.getCatalogs().then((catalogs) => {
				catalogs.print();
				catalogs.forEach((catalog) => {
					catalog.getRequestForm().then((form) => {
						form.print();
					});
				});
			});
			project.getDeployments().then((deployments) => {
				deployments.print();
				deployments.forEach((deployment) => {
					deployment.getResources().then((resources) => {
						resources.print();
						resources.forEach((resource) => {
							resource.getActions().then((actions) => {
								actions.print();
								actions.forEach((action) => {
									action.getRequestForm().then((form) => {
										form.print();
									});
								});
							});
						});
					});
				});
			});
		});
	});
};

window.opera.login(main);