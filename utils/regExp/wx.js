export default function(value) {
	let reg = /^[a-zA-Z]([-_a-zA-Z0-9]{5,19})+$/;
	return reg.test(value);
}