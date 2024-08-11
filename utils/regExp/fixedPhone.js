export default function(value) {
	let reg = /^(0\d{2,3})-?(\d{7,8})$/;
	return reg.test(value);
}