const mqtt_regex = require("../index.js")

const pattern = '+foo/bar/#baz'
const expected = '1/bar/2/3'

const formatter = mqtt_regex(pattern).format
const formatted = formatter({
	foo: 1, baz: [2,3]
})

console.log({
	pattern,
	formatted,
	expected
})
