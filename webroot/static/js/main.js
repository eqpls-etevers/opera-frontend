// javascript here

var main = () => {
	document.getElementById("opera-access-token").innerText = window.common.auth.accessToken;
	document.getElementById("vidm-access-token").innerText = window.common.vidm.accessToken;
	
	document.getElementById("aa-hostname-list").innerText = window.common.aa.hostnames.join(', ');
	let aaDom = document.getElementById("aa-access-tokens");
	window.common.aa.hostnames.forEach((hostname) => {
		let aa = window.common.aa[hostname];
		let dom = document.createElement('p');
		dom.innerText = `${hostname}: ${aa.accessToken}`;
		aaDom.appendChild(dom);
	});
};

window.common.init(() => {
	window.common.auth.login(
		"/", // redirect url
		main, // login success
		() => { // login failed
			console.error("login error");
		}
	);
});
