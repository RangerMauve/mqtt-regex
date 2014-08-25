var mqtt_regex = require("../index.js");

var tests = {
	basic: {
		pattern: "foo/bar/baz",
		tests: ["foo/bar/baz", "foo/bar"]
	},
	single_1: {
		pattern: "foo/+bar/baz",
		tests: ["foo/bar/baz", "foo/bar"]
	},
	single_2: {
		pattern: "foo/bar/+baz",
		tests: ["foo/bar/baz", "foo/bar"]
	},
	multi_1: {
		pattern: "foo/#bar",
		tests: ["foo/bar/baz", "foo/bar", "foo"]
	},
	multi_2: {
		pattern: "foo/bar/#baz",
		tests: ["foo/bar/baz", "foo/bar/fizz/baz", "foo/baz"]
	},
	complex_1: {
		pattern: "foo/+baz/#bar",
		tests: ["foo/bar/baz", "foo/bar/baz/fizz", "foo/bar"]
	}
}

Object.keys(tests).forEach(function(name) {
	var test = tests[name];
	var pattern = test.pattern;
	var cases = test.tests;
	console.log("Processing test", name, "\n");
	var compiled = mqtt_regex(pattern);
	console.log("Compiled", pattern, "to:", compiled.regex, "\n");
	console.log("Running test cases:");
	cases.forEach(function(topic, index) {
		console.log("Running #" + index + ":", topic);

		var matches = compiled.regex.exec(topic);
		if (matches) console.log("\tMatched:\t", matches.slice(1));
		else return console.log("\tFailed\n");

		var params = compiled.getParams(matches);
		console.log("\tGot params:\t", params);
		console.log();
	})
})
