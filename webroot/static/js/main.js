// javascript here

async function main() {
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

	let regions = await window.opera.getRegions();
	let region = regions[0];

	//region.getProjects().then((projects) => { projects.print(); });

	let projects = await region.getProjects();
	projects.print();
	projects.forEach(async (project) => {
		let catalogs = await project.getCatalogs();
		catalogs.print();
		catalogs.forEach(async (catalog) => {
			let form = await catalog.getRequestForm();
			form.print();
		});

		let deployments = await project.getDeployments();
		deployments.print();
		for (let i = 0; i < deployments.len(); i++) {
			let deployment = deployments[i];
			let resources = await deployment.getResources();
			resources.print();
			resources.forEach(async (resource) => {
				let actions = await resource.getActions();
				actions.print();
				actions.forEach(async (action) => {
					let form = await action.getRequestForm();
					form.print();
				});
			});
		}
	});


	/*
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
	*/
};

window.opera.login(main);