// javascript here

var setCookie = function(name, value, exp) {
	var date = new Date();
	date.setTime(date.getTime() + exp * 60 * 60 * 1000);
	document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
};

// 쿠키로드
var getCookie = function(name) {
	var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
	return value ? value[2] : null;
}

// 쿠키연장
var extendCookie = function(name, exp) {
	var cookie_value = getCookie(name);
	if (cookie_value) setCookie(name, cookie_value, exp);
}

// 쿠키삭제
var deleteCookie = function(name) {
	document.cookie = name + '=; expires=Thu, 01 Jan 1999 00:00:10 GMT;';
}


var main = () => {
	document.getElementById("eqpls-access-token").innerText = window.common.auth.accessToken;

	let aaAccessToken = getCookie("AA_ACCESS_TOKEN");
	if (aaAccessToken) {
		console.log(aaAccessToken);
	} else {
		window.location.replace("/aria/auth/login");
	}
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
