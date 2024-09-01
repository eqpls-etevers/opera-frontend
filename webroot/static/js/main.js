// javascript here

async function main() {
	document.getElementById("opera-username").innerText = window.common.auth.username;
	document.getElementById("opera-userinfo").innerText = JSON.stringify(window.common.auth.userInfo);
	document.getElementById("opera-access-token").innerText = window.common.auth.accessToken;
	document.getElementById("vidm-access-token").innerText = window.opera.vidm.accessToken;

	let regionsDom = document.getElementById("regions-access-tokens");

	let regions = await window.opera.getRegions(); // get region list by "await" async code format
	for (let i = 0; i < regions.len(); i++) {
		let region = regions[i];
		let dom = document.createElement('p');
		dom.innerText = `${region.hostname}: ${region.accessToken}`;
		regionsDom.appendChild(dom);
	}

	let region = regions[0]; // set first region

	let projects = await region.getProjects(); // get project list by "await" async code format
	projects.print(); // print project list to console
	projects.forEach(async (project) => { // iterate project list by ".forEach(async (item) => { ... })" code format
		let catalogs = await project.getCatalogs(); // get catalog list by "await" async code format from a project
		catalogs.print(); // print catalog list to console
		catalogs.forEach(async (catalog) => { // iterate catalog list by ".forEach(async (item) => { ... }" code format
			let form = await catalog.getRequestForm(); // get a request form by "await" async code format from a catalog
			form.print(); // print request form to console
		});

		project.getDeployments().then((deployments) => { // get deployment list by ".then((items) => { ... })" async code format from a project
			deployments.print(); // print deployment list to console
			for (let i = 0; i < deployments.len(); i++) { // iterate deployment list by "for" code format
				let deployment = deployments[i]; // set a deployment
				deployment.getResources().then((resources) => { // get resource list by ".then((items) => { ...})" async code format from a deployment
					resources.print(); // print resource list to console
					resources.forEach(async (resource) => { // iterate resource list by ".forEach(async (item) => { ... })" code format
						let actions = await resource.getActions(); // get action list by "await" async code format from resource
						actions.print(); // print action list to console
						actions.forEach(async (action) => { // iterate action list by ".forEach(async (item) => { ... })" code format
							let form = await action.getRequestForm(); // get a request form by "await" async code format from a action
							form.print(); // print request form to console
						});
					});
				});
			}
		});
	});
};

window.opera.login(main);