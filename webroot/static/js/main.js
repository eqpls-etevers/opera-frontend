// javascript here

var main = () => {
	document.getElementById("opera-access-token").innerText = window.common.auth.accessToken;
	document.getElementById("vidm-access-token").innerText = window.common.vidm.accessToken;

	let aaDom = document.getElementById("aa-access-tokens");
	window.common.aa.hostnames.forEach((hostname) => {
		let aa = window.common.aa[hostname];
		let dom = document.createElement('p');
		dom.innerText = `${hostname}: ${aa.accessToken}`;
		aaDom.appendChild(dom);
	});
};

var loginAria = () => {
	let aaEndpointId = window.common.util.getCookie("ARIA_ENDPOINT_ID");
	if (aaEndpointId) {
		fetch(`/uerp/v1/aria/endpoint/${aaEndpointId}`, {
			headers: window.common.auth.headers
		}).then((res) => {
			if (res.ok) { return res.json(); }
			if (errorHandler) { errorHandler(res); }
			throw res
		}).then((endpoint) => {
			window.common.vidm = endpoint.vidm;
			window.common.aa = {}
			window.common.aa.hostnames = []
			endpoint.aa.forEach((aa) => {
				window.common.aa.hostnames.push(aa.hostname);
				window.common.aa[aa.hostname] = {
					accessToken: aa.accessToken,
					headers: {
						"Authorization": `Bearer ${aa.accessToken}`
					}
				};
			});
		});
	} else {
		window.location.replace("/aria/auth/login");
	}
};

var logoutAria = () => {
	window.common.util.delCookie("ARIA_ENDPOINT_ID");
};

window.common.init(() => {
	window.common.auth.loginMiddleWare = loginAria;
	window.common.auth.logoutMiddleWare = logoutAria;
	window.common.auth.login(
		"/", // redirect url
		main, // login success
		() => { // login failed
			console.error("login error");
		}
	);
});
