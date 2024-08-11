export default function(value) {
	let reg = /^[1-9][0-9]\d{4,9}$/;
	return reg.test(value);
}