;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("mqtt-regex/index.js", function(exports, require, module){
/*
	The MIT License (MIT)

	Copyright (c) 2014 RangerMauve

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

module.exports = parse;

/**
 * Parses topic string with parameters
 * @param topic Topic string with optional params
 @ @returns {Object} Compiles a regex for matching topics, getParams for getting params, and exec for doing both
 */
function parse(topic) {
	var tokens = tokenize(topic).map(process_token);
	var result = {
		regex: make_regex(tokens),
		getParams: make_pram_getter(tokens),
	};
	result.exec = exec.bind(result);
	return result;
};

/**
 * Matches regex against topic, returns params if successful
 * @param topic Topic to match
 */
function exec(topic) {
	var regex = this.regex;
	var getParams = this.getParams;
	var match = regex.exec(topic);
	if (match) return getParams(match);
}

// Split the topic into consumable tokens
function tokenize(topic) {
	return topic.split("/");
}

// Processes token and determines if it's a `single`, `multi` or `raw` token
// Each token contains the type, an optional parameter name, and a piece of the regex
// The piece can have a different syntax for when it is last
function process_token(token, index, tokens) {
	var last = (index === (tokens.length - 1));
	if (token[0] === "+") return process_single(token, last);
	else if (token[0] === "#") return process_multi(token, last);
	else return process_raw(token, last);
}

// Processes a token for single paths (prefixed with a +)
function process_single(token) {
	var name = token.slice(1);
	return {
		type: "single",
		name: name,
		piece: "([\\d\\w]+/)",
		last: "([\\d\\w]+/?)"
	};
}

// Processes a token for multiple paths (prefixed with a #)
function process_multi(token, last) {
	if (!last) throw new Error("# wildcard must be at the end of the pattern");
	var name = token.slice(1);
	return {
		type: "multi",
		name: name,
		piece: "((?:[\\d\\w]+/)*)",
		last: "((?:[\\d\\w]+/?)*)"
	}
}

// Processes a raw string for the path, no special logic is expected
function process_raw(token) {
	return {
		type: "raw",
		piece: token + "/",
		last: token + "/?"
	};
}

// Generates the RegExp object from the tokens
function make_regex(tokens) {
	var str = tokens.reduce(function(res, token, index) {
			var is_last = (index == (tokens.length - 1));
			var before_multi = (index === (tokens.length - 2)) && (last(tokens).type == "multi");
			return res + ((is_last || before_multi) ? token.last : token.piece);
		},
		"");
	return new RegExp("^" + str + "$");
}

// Generates the function for getting the params object from the regex results
function make_pram_getter(tokens) {
	return function(results) {
		// Get only the capturing tokens
		var capture_tokens = remove_raw(tokens);
		var res = {};

		// If the regex didn't actually match, just return an empty object
		if (!results) return res;

		// Remove the first item and iterate through the capture groups
		results.slice(1).forEach(function(capture, index) {
			// Retreive the token description for the capture group
			var token = capture_tokens[index];
			var param = capture;
			// If the token doesn't have a name, continue to next group
			if (!token.name) return;

			// If the token is `multi`, split the capture along `/`, remove empty items
			if (token.type === "multi") {
				param = capture.split("/");
				if (!last(param))
					param = remove_last(param);
				// Otherwise, remove any trailing `/`
			} else if (last(capture) === "/")
				param = remove_last(capture);
			// Set the param on the result object
			res[token.name] = param;
		});
		return res;
	}
}

// Removes any tokens of type `raw`
function remove_raw(tokens) {
	return tokens.filter(function(token) {
		return (token.type !== "raw");
	})
}

// Gets the last item or character
function last(items) {
	return items[items.length - 1];
}

// Returns everything but the last item or character
function remove_last(items) {
	return items.slice(0, items.length - 1);
}

});
require.alias("mqtt-regex/index.js", "mqtt-regex/index.js");if (typeof exports == "object") {
  module.exports = require("mqtt-regex");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("mqtt-regex"); });
} else {
  this["mqtt_regex"] = require("mqtt-regex");
}})();