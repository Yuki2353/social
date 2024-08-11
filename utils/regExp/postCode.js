export default function(value) {
	let reg = /^[1-9]\d{5}$/;
	return reg.test(value);
}