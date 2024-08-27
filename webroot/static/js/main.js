// javascript here

var main = () => {
	document.getElementById("eqpls-access-token").innerText = window.common.auth.accessToken;

	window.common.wsock.connect(
		"/router/websocket",
		(socket, data) => {
			console.log(data);
		}, (socket) => {
			socket.sendData("hello", "world");
		}
	);


	fetch(`/aria/auth/authorize`, {
		headers: window.common.auth.apiHeader
	}).then((res) => {
		if (res.ok) { return res.json(); }
		console.error(res);
		throw res
	}).then((data) => {
		console.log(data);
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
