mqtt-regex
==========

Converts an MQTT topic with parameters into a regular expression.

## Example

``` javascript
var mqtt_regex = require("mqtt-regex");

var pattern = "chat/+id/+user/#path";

var room_message_info = mqtt_regex(pattern).exec;

var topic = "chat/lobby/bob/text";

var message_content = "Hello, World!";

var params = room_message_info(topic);

if(params && (params.path.indexOf("text") !== -1)) {
	chat.getRoom(params.id).sendFrom(params.user, message_content)
}
```

## Installing

With bower:

	$ bower install mqtt-regex

With npm:

	$ npm install --save mqtt-regex

You can grab `./build/build.js` for a UMD-compatible bundle (for use in script tags and the such)

## API
The API is super simple and should be easy to integrate with any project

### mqtt_regex(topic_pattern)
Takes an MQTT topic pattern, and generates a RegExp object along with a function for parsing params from the result. The results also have an `exec` function that does both.
The return looks like
``` javascript
{
	regex: "RegExp object for matching"
	getParams: function(results){
		// Processes results from RegExp.prototype.exec
		// Returns an object containing the values for each param
	},
	exec: function(topic){
		// Performs regex.exec on topic
		// If there was a match, parses parameters and returns result
	}
}
```

## How params work

MQTT defines two types of "wildcards", one for matching a single section of the path (`+`), and one for zero or more sections of the path (`#`).
Note that the `#` wildcard can only be used if it's at the end of the topic.
This library was inspired by the syntax in the routers for Express and Sinatra, and an attempt was made to have this just as simple to use.

### Examples of topic patterns:

#### user/+id/#path
This would match paths that start with `user/`, and then extract the next section as the user `id`.
Then it would get all subsequent paths and turn them into an array for the `path` param.
Here is some input/output that you can expect:

	user/bob/status/mood: {id: "bob", path:["status","mood"]
	user/bob: {id:"bob", path: []}
	user/bob/ishungry: {id: "bob", path: ["ishungry"]

#### device/+/+/component/+type/#path
Not all wildcards need to be associated with a parameter, and it could be useful to just use plain MQTT topics.
In this example you might only care about the status of some part of a device, and are willing to ignore a part of the path.
Here are some examples of what this might be used with:

	device/deviceversion/deviceidhere/component/infrared/status/active: {type:"infrared",path: ["status","active"]}
