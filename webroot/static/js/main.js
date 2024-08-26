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
	
	fetch(`/vra/csp/gateway/am/api/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({
			domain: "sddc.lab"
		})
	}).then((res)=> {
		if (res.ok) { return res.json(); }
		console.error(res);
		throw res
	}).then((data)=> {
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
