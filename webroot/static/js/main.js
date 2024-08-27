// javascript here

var main = () => {
	document.getElementById("portal-access-token").innerText = window.common.auth.accessToken;
	document.getElementById("aa-access-token").innerText = window.common.aa.accessToken;
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
