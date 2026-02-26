#!/usr/bin/env node
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames$1 = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __copyProps$1 = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames$1(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp$1.call(to, key) && key !== except) {
				__defProp$1(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc$1(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps$1(isNodeMode || !mod || !mod.__esModule ? __defProp$1(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_os = require("node:os");
node_os = __toESM(node_os);
let node_child_process = require("node:child_process");
let node_module = require("node:module");
let node_buffer = require("node:buffer");
let child_process = require("child_process");
let node_events = require("node:events");
let node_process = require("node:process");
node_process = __toESM(node_process);
let node_tty = require("node:tty");
node_tty = __toESM(node_tty);

//#region src/core/types.ts
const PLANNING_CONFIG_DEFAULTS = {
	model_profile: "balanced",
	commit_docs: true,
	search_gitignored: false,
	branching_strategy: "none",
	phase_branch_template: "maxsim/phase-{phase}-{slug}",
	milestone_branch_template: "maxsim/{milestone}-{slug}",
	workflow: {
		research: true,
		plan_check: true,
		verifier: true,
		nyquist_validation: false
	},
	parallelization: true,
	brave_search: false
};

//#endregion
//#region ../../node_modules/ms/index.js
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
}));

//#endregion
//#region ../../node_modules/debug/src/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*/
	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = require_ms();
		createDebug.destroy = destroy;
		Object.keys(env).forEach((key) => {
			createDebug[key] = env[key];
		});
		/**
		* The currently active debug mode names, and names to skip.
		*/
		createDebug.names = [];
		createDebug.skips = [];
		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};
		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;
			for (let i = 0; i < namespace.length; i++) {
				hash = (hash << 5) - hash + namespace.charCodeAt(i);
				hash |= 0;
			}
			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;
		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;
			function debug(...args) {
				if (!debug.enabled) return;
				const self = debug;
				const curr = Number(/* @__PURE__ */ new Date());
				self.diff = curr - (prevTime || curr);
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;
				args[0] = createDebug.coerce(args[0]);
				if (typeof args[0] !== "string") args.unshift("%O");
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					if (match === "%%") return "%";
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === "function") {
						const val = args[index];
						match = formatter.call(self, val);
						args.splice(index, 1);
						index--;
					}
					return match;
				});
				createDebug.formatArgs.call(self, args);
				(self.log || createDebug.log).apply(self, args);
			}
			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy;
			Object.defineProperty(debug, "enabled", {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) return enableOverride;
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}
					return enabledCache;
				},
				set: (v) => {
					enableOverride = v;
				}
			});
			if (typeof createDebug.init === "function") createDebug.init(debug);
			return debug;
		}
		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}
		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;
			createDebug.names = [];
			createDebug.skips = [];
			const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
			else createDebug.names.push(ns);
		}
		/**
		* Checks if the given string matches a namespace template, honoring
		* asterisks as wildcards.
		*
		* @param {String} search
		* @param {String} template
		* @return {Boolean}
		*/
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;
			while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) if (template[templateIndex] === "*") {
				starIndex = templateIndex;
				matchIndex = searchIndex;
				templateIndex++;
			} else {
				searchIndex++;
				templateIndex++;
			}
			else if (starIndex !== -1) {
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else return false;
			while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
			return templateIndex === template.length;
		}
		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
			createDebug.enable("");
			return namespaces;
		}
		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
			for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
			return false;
		}
		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) return val.stack || val.message;
			return val;
		}
		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		createDebug.enable(createDebug.load());
		return createDebug;
	}
	module.exports = setup;
}));

//#endregion
//#region ../../node_modules/debug/src/browser.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*/
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;
		return () => {
			if (!warned) {
				warned = true;
				console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
			}
		};
	})();
	/**
	* Colors.
	*/
	exports.colors = [
		"#0000CC",
		"#0000FF",
		"#0033CC",
		"#0033FF",
		"#0066CC",
		"#0066FF",
		"#0099CC",
		"#0099FF",
		"#00CC00",
		"#00CC33",
		"#00CC66",
		"#00CC99",
		"#00CCCC",
		"#00CCFF",
		"#3300CC",
		"#3300FF",
		"#3333CC",
		"#3333FF",
		"#3366CC",
		"#3366FF",
		"#3399CC",
		"#3399FF",
		"#33CC00",
		"#33CC33",
		"#33CC66",
		"#33CC99",
		"#33CCCC",
		"#33CCFF",
		"#6600CC",
		"#6600FF",
		"#6633CC",
		"#6633FF",
		"#66CC00",
		"#66CC33",
		"#9900CC",
		"#9900FF",
		"#9933CC",
		"#9933FF",
		"#99CC00",
		"#99CC33",
		"#CC0000",
		"#CC0033",
		"#CC0066",
		"#CC0099",
		"#CC00CC",
		"#CC00FF",
		"#CC3300",
		"#CC3333",
		"#CC3366",
		"#CC3399",
		"#CC33CC",
		"#CC33FF",
		"#CC6600",
		"#CC6633",
		"#CC9900",
		"#CC9933",
		"#CCCC00",
		"#CCCC33",
		"#FF0000",
		"#FF0033",
		"#FF0066",
		"#FF0099",
		"#FF00CC",
		"#FF00FF",
		"#FF3300",
		"#FF3333",
		"#FF3366",
		"#FF3399",
		"#FF33CC",
		"#FF33FF",
		"#FF6600",
		"#FF6633",
		"#FF9900",
		"#FF9933",
		"#FFCC00",
		"#FFCC33"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return true;
		if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
		let m;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
		if (!this.useColors) return;
		const c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, (match) => {
			if (match === "%%") return;
			index++;
			if (match === "%c") lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.debug()` when available.
	* No-op when `console.debug` is not a "function".
	* If `console.debug` is not available, falls back
	* to `console.log`.
	*
	* @api public
	*/
	exports.log = console.debug || console.log || (() => {});
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (namespaces) exports.storage.setItem("debug", namespaces);
			else exports.storage.removeItem("debug");
		} catch (error) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		let r;
		try {
			r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
		} catch (error) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return localStorage;
		} catch (error) {}
	}
	module.exports = require_common()(exports);
	const { formatters } = module.exports;
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return "[UnexpectedJSONParseError]: " + error.message;
		}
	};
}));

//#endregion
//#region ../../node_modules/has-flag/index.js
var require_has_flag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = (flag, argv = process.argv) => {
		const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf("--");
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
}));

//#endregion
//#region ../../node_modules/supports-color/index.js
var require_supports_color = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const os$4 = require("os");
	const tty$2 = require("tty");
	const hasFlag = require_has_flag();
	const { env } = process;
	let forceColor;
	if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) forceColor = 0;
	else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) forceColor = 1;
	if ("FORCE_COLOR" in env) if (env.FORCE_COLOR === "true") forceColor = 1;
	else if (env.FORCE_COLOR === "false") forceColor = 0;
	else forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	function translateLevel(level) {
		if (level === 0) return false;
		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}
	function supportsColor(haveStream, streamIsTTY) {
		if (forceColor === 0) return 0;
		if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) return 3;
		if (hasFlag("color=256")) return 2;
		if (haveStream && !streamIsTTY && forceColor === void 0) return 0;
		const min = forceColor || 0;
		if (env.TERM === "dumb") return min;
		if (process.platform === "win32") {
			const osRelease = os$4.release().split(".");
			if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
			return 1;
		}
		if ("CI" in env) {
			if ([
				"TRAVIS",
				"CIRCLECI",
				"APPVEYOR",
				"GITLAB_CI",
				"GITHUB_ACTIONS",
				"BUILDKITE"
			].some((sign) => sign in env) || env.CI_NAME === "codeship") return 1;
			return min;
		}
		if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		if (env.COLORTERM === "truecolor") return 3;
		if ("TERM_PROGRAM" in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
			switch (env.TERM_PROGRAM) {
				case "iTerm.app": return version >= 3 ? 3 : 2;
				case "Apple_Terminal": return 2;
			}
		}
		if (/-256(color)?$/i.test(env.TERM)) return 2;
		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
		if ("COLORTERM" in env) return 1;
		return min;
	}
	function getSupportLevel(stream) {
		return translateLevel(supportsColor(stream, stream && stream.isTTY));
	}
	module.exports = {
		supportsColor: getSupportLevel,
		stdout: translateLevel(supportsColor(true, tty$2.isatty(1))),
		stderr: translateLevel(supportsColor(true, tty$2.isatty(2)))
	};
}));

//#endregion
//#region ../../node_modules/debug/src/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	const tty$1 = require("tty");
	const util = require("util");
	/**
	* This is the Node.js implementation of `debug()`.
	*/
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
	/**
	* Colors.
	*/
	exports.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		const supportsColor = require_supports_color();
		if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	} catch (error) {}
	/**
	* Build up the default `inspectOpts` object from the environment variables.
	*
	*   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	*/
	exports.inspectOpts = Object.keys(process.env).filter((key) => {
		return /^debug_/i.test(key);
	}).reduce((obj, key) => {
		const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});
		let val = process.env[key];
		if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
		else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
		else if (val === "null") val = null;
		else val = Number(val);
		obj[prop] = val;
		return obj;
	}, {});
	/**
	* Is stdout a TTY? Colored output is enabled when `true`.
	*/
	function useColors() {
		return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty$1.isatty(process.stderr.fd);
	}
	/**
	* Adds ANSI color escape codes if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		const { namespace: name, useColors } = this;
		if (useColors) {
			const c = this.color;
			const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
			const prefix = `  ${colorCode};1m${name} \u001B[0m`;
			args[0] = prefix + args[0].split("\n").join("\n" + prefix);
			args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
		} else args[0] = getDate() + name + " " + args[0];
	}
	function getDate() {
		if (exports.inspectOpts.hideDate) return "";
		return (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	/**
	* Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
	*/
	function log(...args) {
		return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
	}
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		if (namespaces) process.env.DEBUG = namespaces;
		else delete process.env.DEBUG;
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		return process.env.DEBUG;
	}
	/**
	* Init logic for `debug` instances.
	*
	* Create a new `inspectOpts` object in case `useColors` is set
	* differently for a particular `debug` instance.
	*/
	function init(debug) {
		debug.inspectOpts = {};
		const keys = Object.keys(exports.inspectOpts);
		for (let i = 0; i < keys.length; i++) debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
	module.exports = require_common()(exports);
	const { formatters } = module.exports;
	/**
	* Map %o to `util.inspect()`, all on a single line.
	*/
	formatters.o = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
	};
	/**
	* Map %O to `util.inspect()`, allowing multiple lines if needed.
	*/
	formatters.O = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts);
	};
}));

//#endregion
//#region ../../node_modules/debug/src/index.js
var require_src$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Detect Electron renderer / nwjs process, which is node, but we should
	* treat as a browser.
	*/
	if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) module.exports = require_browser();
	else module.exports = require_node();
}));

//#endregion
//#region ../../node_modules/@kwsites/file-exists/dist/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	const fs_1 = require("fs");
	const log = __importDefault(require_src$1()).default("@kwsites/file-exists");
	function check(path, isFile, isDirectory) {
		log(`checking %s`, path);
		try {
			const stat = fs_1.statSync(path);
			if (stat.isFile() && isFile) {
				log(`[OK] path represents a file`);
				return true;
			}
			if (stat.isDirectory() && isDirectory) {
				log(`[OK] path represents a directory`);
				return true;
			}
			log(`[FAIL] path represents something other than a file or directory`);
			return false;
		} catch (e) {
			if (e.code === "ENOENT") {
				log(`[FAIL] path is not accessible: %o`, e);
				return false;
			}
			log(`[FATAL] %o`, e);
			throw e;
		}
	}
	/**
	* Synchronous validation of a path existing either as a file or as a directory.
	*
	* @param {string} path The path to check
	* @param {number} type One or both of the exported numeric constants
	*/
	function exists(path, type = exports.READABLE) {
		return check(path, (type & exports.FILE) > 0, (type & exports.FOLDER) > 0);
	}
	exports.exists = exists;
	/**
	* Constant representing a file
	*/
	exports.FILE = 1;
	/**
	* Constant representing a folder
	*/
	exports.FOLDER = 2;
	/**
	* Constant representing either a file or a folder
	*/
	exports.READABLE = exports.FILE + exports.FOLDER;
}));

//#endregion
//#region ../../node_modules/@kwsites/file-exists/dist/index.js
var require_dist$2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	function __export(m) {
		for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	__export(require_src());
}));

//#endregion
//#region ../../node_modules/@kwsites/promise-deferred/dist/index.js
var require_dist$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createDeferred = exports.deferred = void 0;
	/**
	* Creates a new `DeferredPromise`
	*
	* ```typescript
	import {deferred} from '@kwsites/promise-deferred`;
	```
	*/
	function deferred() {
		let done;
		let fail;
		let status = "pending";
		return {
			promise: new Promise((_done, _fail) => {
				done = _done;
				fail = _fail;
			}),
			done(result) {
				if (status === "pending") {
					status = "resolved";
					done(result);
				}
			},
			fail(error) {
				if (status === "pending") {
					status = "rejected";
					fail(error);
				}
			},
			get fulfilled() {
				return status !== "pending";
			},
			get status() {
				return status;
			}
		};
	}
	exports.deferred = deferred;
	/**
	* Alias of the exported `deferred` function, to help consumers wanting to use `deferred` as the
	* local variable name rather than the factory import name, without needing to rename on import.
	*
	* ```typescript
	import {createDeferred} from '@kwsites/promise-deferred`;
	```
	*/
	exports.createDeferred = deferred;
}));

//#endregion
//#region ../../node_modules/simple-git/dist/esm/index.js
var import_dist$1 = require_dist$2();
var import_src = /* @__PURE__ */ __toESM(require_src$1(), 1);
var import_dist$2 = require_dist$1();
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
	return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: () => from[key],
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
function pathspec(...paths) {
	const key = new String(paths);
	cache.set(key, paths);
	return key;
}
function isPathSpec(path) {
	return path instanceof String && cache.has(path);
}
function toPaths(pathSpec) {
	return cache.get(pathSpec) || [];
}
var cache;
var init_pathspec = __esm({ "src/lib/args/pathspec.ts"() {
	"use strict";
	cache = /* @__PURE__ */ new WeakMap();
} });
var GitError;
var init_git_error = __esm({ "src/lib/errors/git-error.ts"() {
	"use strict";
	GitError = class extends Error {
		constructor(task, message) {
			super(message);
			this.task = task;
			Object.setPrototypeOf(this, new.target.prototype);
		}
	};
} });
var GitResponseError;
var init_git_response_error = __esm({ "src/lib/errors/git-response-error.ts"() {
	"use strict";
	init_git_error();
	GitResponseError = class extends GitError {
		constructor(git, message) {
			super(void 0, message || String(git));
			this.git = git;
		}
	};
} });
var TaskConfigurationError;
var init_task_configuration_error = __esm({ "src/lib/errors/task-configuration-error.ts"() {
	"use strict";
	init_git_error();
	TaskConfigurationError = class extends GitError {
		constructor(message) {
			super(void 0, message);
		}
	};
} });
function asFunction(source) {
	if (typeof source !== "function") return NOOP;
	return source;
}
function isUserFunction(source) {
	return typeof source === "function" && source !== NOOP;
}
function splitOn(input, char) {
	const index = input.indexOf(char);
	if (index <= 0) return [input, ""];
	return [input.substr(0, index), input.substr(index + 1)];
}
function first(input, offset = 0) {
	return isArrayLike(input) && input.length > offset ? input[offset] : void 0;
}
function last(input, offset = 0) {
	if (isArrayLike(input) && input.length > offset) return input[input.length - 1 - offset];
}
function isArrayLike(input) {
	return filterHasLength(input);
}
function toLinesWithContent(input = "", trimmed2 = true, separator = "\n") {
	return input.split(separator).reduce((output, line) => {
		const lineContent = trimmed2 ? line.trim() : line;
		if (lineContent) output.push(lineContent);
		return output;
	}, []);
}
function forEachLineWithContent(input, callback) {
	return toLinesWithContent(input, true).map((line) => callback(line));
}
function folderExists(path) {
	return (0, import_dist$1.exists)(path, import_dist$1.FOLDER);
}
function append(target, item) {
	if (Array.isArray(target)) {
		if (!target.includes(item)) target.push(item);
	} else target.add(item);
	return item;
}
function including(target, item) {
	if (Array.isArray(target) && !target.includes(item)) target.push(item);
	return target;
}
function remove(target, item) {
	if (Array.isArray(target)) {
		const index = target.indexOf(item);
		if (index >= 0) target.splice(index, 1);
	} else target.delete(item);
	return item;
}
function asArray(source) {
	return Array.isArray(source) ? source : [source];
}
function asCamelCase(str) {
	return str.replace(/[\s-]+(.)/g, (_all, chr) => {
		return chr.toUpperCase();
	});
}
function asStringArray(source) {
	return asArray(source).map((item) => {
		return item instanceof String ? item : String(item);
	});
}
function asNumber(source, onNaN = 0) {
	if (source == null) return onNaN;
	const num = parseInt(source, 10);
	return Number.isNaN(num) ? onNaN : num;
}
function prefixedArray(input, prefix) {
	const output = [];
	for (let i = 0, max = input.length; i < max; i++) output.push(prefix, input[i]);
	return output;
}
function bufferToString(input) {
	return (Array.isArray(input) ? node_buffer.Buffer.concat(input) : input).toString("utf-8");
}
function pick(source, properties) {
	const out = {};
	properties.forEach((key) => {
		if (source[key] !== void 0) out[key] = source[key];
	});
	return out;
}
function delay(duration = 0) {
	return new Promise((done) => setTimeout(done, duration));
}
function orVoid(input) {
	if (input === false) return;
	return input;
}
var NULL, NOOP, objectToString;
var init_util = __esm({ "src/lib/utils/util.ts"() {
	"use strict";
	init_argument_filters();
	NULL = "\0";
	NOOP = () => {};
	objectToString = Object.prototype.toString.call.bind(Object.prototype.toString);
} });
function filterType(input, filter, def) {
	if (filter(input)) return input;
	return arguments.length > 2 ? def : void 0;
}
function filterPrimitives(input, omit) {
	const type = isPathSpec(input) ? "string" : typeof input;
	return /number|string|boolean/.test(type) && (!omit || !omit.includes(type));
}
function filterPlainObject(input) {
	return !!input && objectToString(input) === "[object Object]";
}
function filterFunction(input) {
	return typeof input === "function";
}
var filterArray, filterNumber, filterString, filterStringOrStringArray, filterHasLength;
var init_argument_filters = __esm({ "src/lib/utils/argument-filters.ts"() {
	"use strict";
	init_pathspec();
	init_util();
	filterArray = (input) => {
		return Array.isArray(input);
	};
	filterNumber = (input) => {
		return typeof input === "number";
	};
	filterString = (input) => {
		return typeof input === "string";
	};
	filterStringOrStringArray = (input) => {
		return filterString(input) || Array.isArray(input) && input.every(filterString);
	};
	filterHasLength = (input) => {
		if (input == null || "number|boolean|function".includes(typeof input)) return false;
		return typeof input.length === "number";
	};
} });
var ExitCodes;
var init_exit_codes = __esm({ "src/lib/utils/exit-codes.ts"() {
	"use strict";
	ExitCodes = /* @__PURE__ */ ((ExitCodes2) => {
		ExitCodes2[ExitCodes2["SUCCESS"] = 0] = "SUCCESS";
		ExitCodes2[ExitCodes2["ERROR"] = 1] = "ERROR";
		ExitCodes2[ExitCodes2["NOT_FOUND"] = -2] = "NOT_FOUND";
		ExitCodes2[ExitCodes2["UNCLEAN"] = 128] = "UNCLEAN";
		return ExitCodes2;
	})(ExitCodes || {});
} });
var GitOutputStreams;
var init_git_output_streams = __esm({ "src/lib/utils/git-output-streams.ts"() {
	"use strict";
	GitOutputStreams = class _GitOutputStreams {
		constructor(stdOut, stdErr) {
			this.stdOut = stdOut;
			this.stdErr = stdErr;
		}
		asStrings() {
			return new _GitOutputStreams(this.stdOut.toString("utf8"), this.stdErr.toString("utf8"));
		}
	};
} });
function useMatchesDefault() {
	throw new Error(`LineParser:useMatches not implemented`);
}
var LineParser, RemoteLineParser;
var init_line_parser = __esm({ "src/lib/utils/line-parser.ts"() {
	"use strict";
	LineParser = class {
		constructor(regExp, useMatches) {
			this.matches = [];
			this.useMatches = useMatchesDefault;
			this.parse = (line, target) => {
				this.resetMatches();
				if (!this._regExp.every((reg, index) => this.addMatch(reg, index, line(index)))) return false;
				return this.useMatches(target, this.prepareMatches()) !== false;
			};
			this._regExp = Array.isArray(regExp) ? regExp : [regExp];
			if (useMatches) this.useMatches = useMatches;
		}
		resetMatches() {
			this.matches.length = 0;
		}
		prepareMatches() {
			return this.matches;
		}
		addMatch(reg, index, line) {
			const matched = line && reg.exec(line);
			if (matched) this.pushMatch(index, matched);
			return !!matched;
		}
		pushMatch(_index, matched) {
			this.matches.push(...matched.slice(1));
		}
	};
	RemoteLineParser = class extends LineParser {
		addMatch(reg, index, line) {
			return /^remote:\s/.test(String(line)) && super.addMatch(reg, index, line);
		}
		pushMatch(index, matched) {
			if (index > 0 || matched.length > 1) super.pushMatch(index, matched);
		}
	};
} });
function createInstanceConfig(...options) {
	const baseDir = process.cwd();
	const config = Object.assign({
		baseDir,
		...defaultOptions
	}, ...options.filter((o) => typeof o === "object" && o));
	config.baseDir = config.baseDir || baseDir;
	config.trimmed = config.trimmed === true;
	return config;
}
var defaultOptions;
var init_simple_git_options = __esm({ "src/lib/utils/simple-git-options.ts"() {
	"use strict";
	defaultOptions = {
		binary: "git",
		maxConcurrentProcesses: 5,
		config: [],
		trimmed: false
	};
} });
function appendTaskOptions(options, commands = []) {
	if (!filterPlainObject(options)) return commands;
	return Object.keys(options).reduce((commands2, key) => {
		const value = options[key];
		if (isPathSpec(value)) commands2.push(value);
		else if (filterPrimitives(value, ["boolean"])) commands2.push(key + "=" + value);
		else if (Array.isArray(value)) {
			for (const v of value) if (!filterPrimitives(v, ["string", "number"])) commands2.push(key + "=" + v);
		} else commands2.push(key);
		return commands2;
	}, commands);
}
function getTrailingOptions(args, initialPrimitive = 0, objectOnly = false) {
	const command = [];
	for (let i = 0, max = initialPrimitive < 0 ? args.length : initialPrimitive; i < max; i++) if ("string|number".includes(typeof args[i])) command.push(String(args[i]));
	appendTaskOptions(trailingOptionsArgument(args), command);
	if (!objectOnly) command.push(...trailingArrayArgument(args));
	return command;
}
function trailingArrayArgument(args) {
	return asStringArray(filterType(last(args, typeof last(args) === "function" ? 1 : 0), filterArray, []));
}
function trailingOptionsArgument(args) {
	return filterType(last(args, filterFunction(last(args)) ? 1 : 0), filterPlainObject);
}
function trailingFunctionArgument(args, includeNoop = true) {
	const callback = asFunction(last(args));
	return includeNoop || isUserFunction(callback) ? callback : void 0;
}
var init_task_options = __esm({ "src/lib/utils/task-options.ts"() {
	"use strict";
	init_argument_filters();
	init_util();
	init_pathspec();
} });
function callTaskParser(parser4, streams) {
	return parser4(streams.stdOut, streams.stdErr);
}
function parseStringResponse(result, parsers12, texts, trim = true) {
	asArray(texts).forEach((text) => {
		for (let lines = toLinesWithContent(text, trim), i = 0, max = lines.length; i < max; i++) {
			const line = (offset = 0) => {
				if (i + offset >= max) return;
				return lines[i + offset];
			};
			parsers12.some(({ parse }) => parse(line, result));
		}
	});
	return result;
}
var init_task_parser = __esm({ "src/lib/utils/task-parser.ts"() {
	"use strict";
	init_util();
} });
var utils_exports = {};
__export(utils_exports, {
	ExitCodes: () => ExitCodes,
	GitOutputStreams: () => GitOutputStreams,
	LineParser: () => LineParser,
	NOOP: () => NOOP,
	NULL: () => NULL,
	RemoteLineParser: () => RemoteLineParser,
	append: () => append,
	appendTaskOptions: () => appendTaskOptions,
	asArray: () => asArray,
	asCamelCase: () => asCamelCase,
	asFunction: () => asFunction,
	asNumber: () => asNumber,
	asStringArray: () => asStringArray,
	bufferToString: () => bufferToString,
	callTaskParser: () => callTaskParser,
	createInstanceConfig: () => createInstanceConfig,
	delay: () => delay,
	filterArray: () => filterArray,
	filterFunction: () => filterFunction,
	filterHasLength: () => filterHasLength,
	filterNumber: () => filterNumber,
	filterPlainObject: () => filterPlainObject,
	filterPrimitives: () => filterPrimitives,
	filterString: () => filterString,
	filterStringOrStringArray: () => filterStringOrStringArray,
	filterType: () => filterType,
	first: () => first,
	folderExists: () => folderExists,
	forEachLineWithContent: () => forEachLineWithContent,
	getTrailingOptions: () => getTrailingOptions,
	including: () => including,
	isUserFunction: () => isUserFunction,
	last: () => last,
	objectToString: () => objectToString,
	orVoid: () => orVoid,
	parseStringResponse: () => parseStringResponse,
	pick: () => pick,
	prefixedArray: () => prefixedArray,
	remove: () => remove,
	splitOn: () => splitOn,
	toLinesWithContent: () => toLinesWithContent,
	trailingFunctionArgument: () => trailingFunctionArgument,
	trailingOptionsArgument: () => trailingOptionsArgument
});
var init_utils = __esm({ "src/lib/utils/index.ts"() {
	"use strict";
	init_argument_filters();
	init_exit_codes();
	init_git_output_streams();
	init_line_parser();
	init_simple_git_options();
	init_task_options();
	init_task_parser();
	init_util();
} });
var check_is_repo_exports = {};
__export(check_is_repo_exports, {
	CheckRepoActions: () => CheckRepoActions,
	checkIsBareRepoTask: () => checkIsBareRepoTask,
	checkIsRepoRootTask: () => checkIsRepoRootTask,
	checkIsRepoTask: () => checkIsRepoTask
});
function checkIsRepoTask(action) {
	switch (action) {
		case "bare": return checkIsBareRepoTask();
		case "root": return checkIsRepoRootTask();
	}
	return {
		commands: ["rev-parse", "--is-inside-work-tree"],
		format: "utf-8",
		onError,
		parser
	};
}
function checkIsRepoRootTask() {
	return {
		commands: ["rev-parse", "--git-dir"],
		format: "utf-8",
		onError,
		parser(path) {
			return /^\.(git)?$/.test(path.trim());
		}
	};
}
function checkIsBareRepoTask() {
	return {
		commands: ["rev-parse", "--is-bare-repository"],
		format: "utf-8",
		onError,
		parser
	};
}
function isNotRepoMessage(error) {
	return /(Not a git repository|Kein Git-Repository)/i.test(String(error));
}
var CheckRepoActions, onError, parser;
var init_check_is_repo = __esm({ "src/lib/tasks/check-is-repo.ts"() {
	"use strict";
	init_utils();
	CheckRepoActions = /* @__PURE__ */ ((CheckRepoActions2) => {
		CheckRepoActions2["BARE"] = "bare";
		CheckRepoActions2["IN_TREE"] = "tree";
		CheckRepoActions2["IS_REPO_ROOT"] = "root";
		return CheckRepoActions2;
	})(CheckRepoActions || {});
	onError = ({ exitCode }, error, done, fail) => {
		if (exitCode === 128 && isNotRepoMessage(error)) return done(Buffer.from("false"));
		fail(error);
	};
	parser = (text) => {
		return text.trim() === "true";
	};
} });
function cleanSummaryParser(dryRun, text) {
	const summary = new CleanResponse(dryRun);
	const regexp = dryRun ? dryRunRemovalRegexp : removalRegexp;
	toLinesWithContent(text).forEach((line) => {
		const removed = line.replace(regexp, "");
		summary.paths.push(removed);
		(isFolderRegexp.test(removed) ? summary.folders : summary.files).push(removed);
	});
	return summary;
}
var CleanResponse, removalRegexp, dryRunRemovalRegexp, isFolderRegexp;
var init_CleanSummary = __esm({ "src/lib/responses/CleanSummary.ts"() {
	"use strict";
	init_utils();
	CleanResponse = class {
		constructor(dryRun) {
			this.dryRun = dryRun;
			this.paths = [];
			this.files = [];
			this.folders = [];
		}
	};
	removalRegexp = /^[a-z]+\s*/i;
	dryRunRemovalRegexp = /^[a-z]+\s+[a-z]+\s*/i;
	isFolderRegexp = /\/$/;
} });
var task_exports = {};
__export(task_exports, {
	EMPTY_COMMANDS: () => EMPTY_COMMANDS,
	adhocExecTask: () => adhocExecTask,
	configurationErrorTask: () => configurationErrorTask,
	isBufferTask: () => isBufferTask,
	isEmptyTask: () => isEmptyTask,
	straightThroughBufferTask: () => straightThroughBufferTask,
	straightThroughStringTask: () => straightThroughStringTask
});
function adhocExecTask(parser4) {
	return {
		commands: EMPTY_COMMANDS,
		format: "empty",
		parser: parser4
	};
}
function configurationErrorTask(error) {
	return {
		commands: EMPTY_COMMANDS,
		format: "empty",
		parser() {
			throw typeof error === "string" ? new TaskConfigurationError(error) : error;
		}
	};
}
function straightThroughStringTask(commands, trimmed2 = false) {
	return {
		commands,
		format: "utf-8",
		parser(text) {
			return trimmed2 ? String(text).trim() : text;
		}
	};
}
function straightThroughBufferTask(commands) {
	return {
		commands,
		format: "buffer",
		parser(buffer) {
			return buffer;
		}
	};
}
function isBufferTask(task) {
	return task.format === "buffer";
}
function isEmptyTask(task) {
	return task.format === "empty" || !task.commands.length;
}
var EMPTY_COMMANDS;
var init_task = __esm({ "src/lib/tasks/task.ts"() {
	"use strict";
	init_task_configuration_error();
	EMPTY_COMMANDS = [];
} });
var clean_exports = {};
__export(clean_exports, {
	CONFIG_ERROR_INTERACTIVE_MODE: () => CONFIG_ERROR_INTERACTIVE_MODE,
	CONFIG_ERROR_MODE_REQUIRED: () => CONFIG_ERROR_MODE_REQUIRED,
	CONFIG_ERROR_UNKNOWN_OPTION: () => CONFIG_ERROR_UNKNOWN_OPTION,
	CleanOptions: () => CleanOptions,
	cleanTask: () => cleanTask,
	cleanWithOptionsTask: () => cleanWithOptionsTask,
	isCleanOptionsArray: () => isCleanOptionsArray
});
function cleanWithOptionsTask(mode, customArgs) {
	const { cleanMode, options, valid } = getCleanOptions(mode);
	if (!cleanMode) return configurationErrorTask(CONFIG_ERROR_MODE_REQUIRED);
	if (!valid.options) return configurationErrorTask(CONFIG_ERROR_UNKNOWN_OPTION + JSON.stringify(mode));
	options.push(...customArgs);
	if (options.some(isInteractiveMode)) return configurationErrorTask(CONFIG_ERROR_INTERACTIVE_MODE);
	return cleanTask(cleanMode, options);
}
function cleanTask(mode, customArgs) {
	return {
		commands: [
			"clean",
			`-${mode}`,
			...customArgs
		],
		format: "utf-8",
		parser(text) {
			return cleanSummaryParser(mode === "n", text);
		}
	};
}
function isCleanOptionsArray(input) {
	return Array.isArray(input) && input.every((test) => CleanOptionValues.has(test));
}
function getCleanOptions(input) {
	let cleanMode;
	let options = [];
	let valid = {
		cleanMode: false,
		options: true
	};
	input.replace(/[^a-z]i/g, "").split("").forEach((char) => {
		if (isCleanMode(char)) {
			cleanMode = char;
			valid.cleanMode = true;
		} else valid.options = valid.options && isKnownOption(options[options.length] = `-${char}`);
	});
	return {
		cleanMode,
		options,
		valid
	};
}
function isCleanMode(cleanMode) {
	return cleanMode === "f" || cleanMode === "n";
}
function isKnownOption(option) {
	return /^-[a-z]$/i.test(option) && CleanOptionValues.has(option.charAt(1));
}
function isInteractiveMode(option) {
	if (/^-[^\-]/.test(option)) return option.indexOf("i") > 0;
	return option === "--interactive";
}
var CONFIG_ERROR_INTERACTIVE_MODE, CONFIG_ERROR_MODE_REQUIRED, CONFIG_ERROR_UNKNOWN_OPTION, CleanOptions, CleanOptionValues;
var init_clean = __esm({ "src/lib/tasks/clean.ts"() {
	"use strict";
	init_CleanSummary();
	init_utils();
	init_task();
	CONFIG_ERROR_INTERACTIVE_MODE = "Git clean interactive mode is not supported";
	CONFIG_ERROR_MODE_REQUIRED = "Git clean mode parameter (\"n\" or \"f\") is required";
	CONFIG_ERROR_UNKNOWN_OPTION = "Git clean unknown option found in: ";
	CleanOptions = /* @__PURE__ */ ((CleanOptions2) => {
		CleanOptions2["DRY_RUN"] = "n";
		CleanOptions2["FORCE"] = "f";
		CleanOptions2["IGNORED_INCLUDED"] = "x";
		CleanOptions2["IGNORED_ONLY"] = "X";
		CleanOptions2["EXCLUDING"] = "e";
		CleanOptions2["QUIET"] = "q";
		CleanOptions2["RECURSIVE"] = "d";
		return CleanOptions2;
	})(CleanOptions || {});
	CleanOptionValues = /* @__PURE__ */ new Set(["i", ...asStringArray(Object.values(CleanOptions))]);
} });
function configListParser(text) {
	const config = new ConfigList();
	for (const item of configParser(text)) config.addValue(item.file, String(item.key), item.value);
	return config;
}
function configGetParser(text, key) {
	let value = null;
	const values = [];
	const scopes = /* @__PURE__ */ new Map();
	for (const item of configParser(text, key)) {
		if (item.key !== key) continue;
		values.push(value = item.value);
		if (!scopes.has(item.file)) scopes.set(item.file, []);
		scopes.get(item.file).push(value);
	}
	return {
		key,
		paths: Array.from(scopes.keys()),
		scopes,
		value,
		values
	};
}
function configFilePath(filePath) {
	return filePath.replace(/^(file):/, "");
}
function* configParser(text, requestedKey = null) {
	const lines = text.split("\0");
	for (let i = 0, max = lines.length - 1; i < max;) {
		const file = configFilePath(lines[i++]);
		let value = lines[i++];
		let key = requestedKey;
		if (value.includes("\n")) {
			const line = splitOn(value, "\n");
			key = line[0];
			value = line[1];
		}
		yield {
			file,
			key,
			value
		};
	}
}
var ConfigList;
var init_ConfigList = __esm({ "src/lib/responses/ConfigList.ts"() {
	"use strict";
	init_utils();
	ConfigList = class {
		constructor() {
			this.files = [];
			this.values = /* @__PURE__ */ Object.create(null);
		}
		get all() {
			if (!this._all) this._all = this.files.reduce((all, file) => {
				return Object.assign(all, this.values[file]);
			}, {});
			return this._all;
		}
		addFile(file) {
			if (!(file in this.values)) {
				const latest = last(this.files);
				this.values[file] = latest ? Object.create(this.values[latest]) : {};
				this.files.push(file);
			}
			return this.values[file];
		}
		addValue(file, key, value) {
			const values = this.addFile(file);
			if (!Object.hasOwn(values, key)) values[key] = value;
			else if (Array.isArray(values[key])) values[key].push(value);
			else values[key] = [values[key], value];
			this._all = void 0;
		}
	};
} });
function asConfigScope(scope, fallback) {
	if (typeof scope === "string" && Object.hasOwn(GitConfigScope, scope)) return scope;
	return fallback;
}
function addConfigTask(key, value, append2, scope) {
	const commands = ["config", `--${scope}`];
	if (append2) commands.push("--add");
	commands.push(key, value);
	return {
		commands,
		format: "utf-8",
		parser(text) {
			return text;
		}
	};
}
function getConfigTask(key, scope) {
	const commands = [
		"config",
		"--null",
		"--show-origin",
		"--get-all",
		key
	];
	if (scope) commands.splice(1, 0, `--${scope}`);
	return {
		commands,
		format: "utf-8",
		parser(text) {
			return configGetParser(text, key);
		}
	};
}
function listConfigTask(scope) {
	const commands = [
		"config",
		"--list",
		"--show-origin",
		"--null"
	];
	if (scope) commands.push(`--${scope}`);
	return {
		commands,
		format: "utf-8",
		parser(text) {
			return configListParser(text);
		}
	};
}
function config_default() {
	return {
		addConfig(key, value, ...rest) {
			return this._runTask(addConfigTask(key, value, rest[0] === true, asConfigScope(rest[1], "local")), trailingFunctionArgument(arguments));
		},
		getConfig(key, scope) {
			return this._runTask(getConfigTask(key, asConfigScope(scope, void 0)), trailingFunctionArgument(arguments));
		},
		listConfig(...rest) {
			return this._runTask(listConfigTask(asConfigScope(rest[0], void 0)), trailingFunctionArgument(arguments));
		}
	};
}
var GitConfigScope;
var init_config = __esm({ "src/lib/tasks/config.ts"() {
	"use strict";
	init_ConfigList();
	init_utils();
	GitConfigScope = /* @__PURE__ */ ((GitConfigScope2) => {
		GitConfigScope2["system"] = "system";
		GitConfigScope2["global"] = "global";
		GitConfigScope2["local"] = "local";
		GitConfigScope2["worktree"] = "worktree";
		return GitConfigScope2;
	})(GitConfigScope || {});
} });
function isDiffNameStatus(input) {
	return diffNameStatus.has(input);
}
var DiffNameStatus, diffNameStatus;
var init_diff_name_status = __esm({ "src/lib/tasks/diff-name-status.ts"() {
	"use strict";
	DiffNameStatus = /* @__PURE__ */ ((DiffNameStatus2) => {
		DiffNameStatus2["ADDED"] = "A";
		DiffNameStatus2["COPIED"] = "C";
		DiffNameStatus2["DELETED"] = "D";
		DiffNameStatus2["MODIFIED"] = "M";
		DiffNameStatus2["RENAMED"] = "R";
		DiffNameStatus2["CHANGED"] = "T";
		DiffNameStatus2["UNMERGED"] = "U";
		DiffNameStatus2["UNKNOWN"] = "X";
		DiffNameStatus2["BROKEN"] = "B";
		return DiffNameStatus2;
	})(DiffNameStatus || {});
	diffNameStatus = new Set(Object.values(DiffNameStatus));
} });
function grepQueryBuilder(...params) {
	return new GrepQuery().param(...params);
}
function parseGrep(grep) {
	const paths = /* @__PURE__ */ new Set();
	const results = {};
	forEachLineWithContent(grep, (input) => {
		const [path, line, preview] = input.split(NULL);
		paths.add(path);
		(results[path] = results[path] || []).push({
			line: asNumber(line),
			path,
			preview
		});
	});
	return {
		paths,
		results
	};
}
function grep_default() {
	return { grep(searchTerm) {
		const then = trailingFunctionArgument(arguments);
		const options = getTrailingOptions(arguments);
		for (const option of disallowedOptions) if (options.includes(option)) return this._runTask(configurationErrorTask(`git.grep: use of "${option}" is not supported.`), then);
		if (typeof searchTerm === "string") searchTerm = grepQueryBuilder().param(searchTerm);
		const commands = [
			"grep",
			"--null",
			"-n",
			"--full-name",
			...options,
			...searchTerm
		];
		return this._runTask({
			commands,
			format: "utf-8",
			parser(stdOut) {
				return parseGrep(stdOut);
			}
		}, then);
	} };
}
var disallowedOptions, Query, _a, GrepQuery;
var init_grep = __esm({ "src/lib/tasks/grep.ts"() {
	"use strict";
	init_utils();
	init_task();
	disallowedOptions = ["-h"];
	Query = Symbol("grepQuery");
	GrepQuery = class {
		constructor() {
			this[_a] = [];
		}
		*[(_a = Query, Symbol.iterator)]() {
			for (const query of this[Query]) yield query;
		}
		and(...and) {
			and.length && this[Query].push("--and", "(", ...prefixedArray(and, "-e"), ")");
			return this;
		}
		param(...param) {
			this[Query].push(...prefixedArray(param, "-e"));
			return this;
		}
	};
} });
var reset_exports = {};
__export(reset_exports, {
	ResetMode: () => ResetMode,
	getResetMode: () => getResetMode,
	resetTask: () => resetTask
});
function resetTask(mode, customArgs) {
	const commands = ["reset"];
	if (isValidResetMode(mode)) commands.push(`--${mode}`);
	commands.push(...customArgs);
	return straightThroughStringTask(commands);
}
function getResetMode(mode) {
	if (isValidResetMode(mode)) return mode;
	switch (typeof mode) {
		case "string":
		case "undefined": return "soft";
	}
}
function isValidResetMode(mode) {
	return typeof mode === "string" && validResetModes.includes(mode);
}
var ResetMode, validResetModes;
var init_reset = __esm({ "src/lib/tasks/reset.ts"() {
	"use strict";
	init_utils();
	init_task();
	ResetMode = /* @__PURE__ */ ((ResetMode2) => {
		ResetMode2["MIXED"] = "mixed";
		ResetMode2["SOFT"] = "soft";
		ResetMode2["HARD"] = "hard";
		ResetMode2["MERGE"] = "merge";
		ResetMode2["KEEP"] = "keep";
		return ResetMode2;
	})(ResetMode || {});
	validResetModes = asStringArray(Object.values(ResetMode));
} });
function createLog() {
	return (0, import_src.default)("simple-git");
}
function prefixedLogger(to, prefix, forward) {
	if (!prefix || !String(prefix).replace(/\s*/, "")) return !forward ? to : (message, ...args) => {
		to(message, ...args);
		forward(message, ...args);
	};
	return (message, ...args) => {
		to(`%s ${message}`, prefix, ...args);
		if (forward) forward(message, ...args);
	};
}
function childLoggerName(name, childDebugger, { namespace: parentNamespace }) {
	if (typeof name === "string") return name;
	const childNamespace = childDebugger && childDebugger.namespace || "";
	if (childNamespace.startsWith(parentNamespace)) return childNamespace.substr(parentNamespace.length + 1);
	return childNamespace || parentNamespace;
}
function createLogger(label, verbose, initialStep, infoDebugger = createLog()) {
	const labelPrefix = label && `[${label}]` || "";
	const spawned = [];
	const debugDebugger = typeof verbose === "string" ? infoDebugger.extend(verbose) : verbose;
	const key = childLoggerName(filterType(verbose, filterString), debugDebugger, infoDebugger);
	return step(initialStep);
	function sibling(name, initial) {
		return append(spawned, createLogger(label, key.replace(/^[^:]+/, name), initial, infoDebugger));
	}
	function step(phase) {
		const stepPrefix = phase && `[${phase}]` || "";
		const debug2 = debugDebugger && prefixedLogger(debugDebugger, stepPrefix) || NOOP;
		const info = prefixedLogger(infoDebugger, `${labelPrefix} ${stepPrefix}`, debug2);
		return Object.assign(debugDebugger ? debug2 : info, {
			label,
			sibling,
			info,
			step
		});
	}
}
var init_git_logger = __esm({ "src/lib/git-logger.ts"() {
	"use strict";
	init_utils();
	import_src.default.formatters.L = (value) => String(filterHasLength(value) ? value.length : "-");
	import_src.default.formatters.B = (value) => {
		if (Buffer.isBuffer(value)) return value.toString("utf8");
		return objectToString(value);
	};
} });
var TasksPendingQueue;
var init_tasks_pending_queue = __esm({ "src/lib/runners/tasks-pending-queue.ts"() {
	"use strict";
	init_git_error();
	init_git_logger();
	TasksPendingQueue = class _TasksPendingQueue {
		constructor(logLabel = "GitExecutor") {
			this.logLabel = logLabel;
			this._queue = /* @__PURE__ */ new Map();
		}
		withProgress(task) {
			return this._queue.get(task);
		}
		createProgress(task) {
			const name = _TasksPendingQueue.getName(task.commands[0]);
			return {
				task,
				logger: createLogger(this.logLabel, name),
				name
			};
		}
		push(task) {
			const progress = this.createProgress(task);
			progress.logger("Adding task to the queue, commands = %o", task.commands);
			this._queue.set(task, progress);
			return progress;
		}
		fatal(err) {
			for (const [task, { logger }] of Array.from(this._queue.entries())) {
				if (task === err.task) {
					logger.info(`Failed %o`, err);
					logger(`Fatal exception, any as-yet un-started tasks run through this executor will not be attempted`);
				} else logger.info(`A fatal exception occurred in a previous task, the queue has been purged: %o`, err.message);
				this.complete(task);
			}
			if (this._queue.size !== 0) throw new Error(`Queue size should be zero after fatal: ${this._queue.size}`);
		}
		complete(task) {
			if (this.withProgress(task)) this._queue.delete(task);
		}
		attempt(task) {
			const progress = this.withProgress(task);
			if (!progress) throw new GitError(void 0, "TasksPendingQueue: attempt called for an unknown task");
			progress.logger("Starting task");
			return progress;
		}
		static getName(name = "empty") {
			return `task:${name}:${++_TasksPendingQueue.counter}`;
		}
		static {
			this.counter = 0;
		}
	};
} });
function pluginContext(task, commands) {
	return {
		method: first(task.commands) || "",
		commands
	};
}
function onErrorReceived(target, logger) {
	return (err) => {
		logger(`[ERROR] child process exception %o`, err);
		target.push(Buffer.from(String(err.stack), "ascii"));
	};
}
function onDataReceived(target, name, logger, output) {
	return (buffer) => {
		logger(`%s received %L bytes`, name, buffer);
		output(`%B`, buffer);
		target.push(buffer);
	};
}
var GitExecutorChain;
var init_git_executor_chain = __esm({ "src/lib/runners/git-executor-chain.ts"() {
	"use strict";
	init_git_error();
	init_task();
	init_utils();
	init_tasks_pending_queue();
	GitExecutorChain = class {
		constructor(_executor, _scheduler, _plugins) {
			this._executor = _executor;
			this._scheduler = _scheduler;
			this._plugins = _plugins;
			this._chain = Promise.resolve();
			this._queue = new TasksPendingQueue();
		}
		get cwd() {
			return this._cwd || this._executor.cwd;
		}
		set cwd(cwd) {
			this._cwd = cwd;
		}
		get env() {
			return this._executor.env;
		}
		get outputHandler() {
			return this._executor.outputHandler;
		}
		chain() {
			return this;
		}
		push(task) {
			this._queue.push(task);
			return this._chain = this._chain.then(() => this.attemptTask(task));
		}
		async attemptTask(task) {
			const onScheduleComplete = await this._scheduler.next();
			const onQueueComplete = () => this._queue.complete(task);
			try {
				const { logger } = this._queue.attempt(task);
				return await (isEmptyTask(task) ? this.attemptEmptyTask(task, logger) : this.attemptRemoteTask(task, logger));
			} catch (e) {
				throw this.onFatalException(task, e);
			} finally {
				onQueueComplete();
				onScheduleComplete();
			}
		}
		onFatalException(task, e) {
			const gitError = e instanceof GitError ? Object.assign(e, { task }) : new GitError(task, e && String(e));
			this._chain = Promise.resolve();
			this._queue.fatal(gitError);
			return gitError;
		}
		async attemptRemoteTask(task, logger) {
			const binary = this._plugins.exec("spawn.binary", "", pluginContext(task, task.commands));
			const args = this._plugins.exec("spawn.args", [...task.commands], pluginContext(task, task.commands));
			const raw = await this.gitResponse(task, binary, args, this.outputHandler, logger.step("SPAWN"));
			const outputStreams = await this.handleTaskData(task, args, raw, logger.step("HANDLE"));
			logger(`passing response to task's parser as a %s`, task.format);
			if (isBufferTask(task)) return callTaskParser(task.parser, outputStreams);
			return callTaskParser(task.parser, outputStreams.asStrings());
		}
		async attemptEmptyTask(task, logger) {
			logger(`empty task bypassing child process to call to task's parser`);
			return task.parser(this);
		}
		handleTaskData(task, args, result, logger) {
			const { exitCode, rejection, stdOut, stdErr } = result;
			return new Promise((done, fail) => {
				logger(`Preparing to handle process response exitCode=%d stdOut=`, exitCode);
				const { error } = this._plugins.exec("task.error", { error: rejection }, {
					...pluginContext(task, args),
					...result
				});
				if (error && task.onError) {
					logger.info(`exitCode=%s handling with custom error handler`);
					return task.onError(result, error, (newStdOut) => {
						logger.info(`custom error handler treated as success`);
						logger(`custom error returned a %s`, objectToString(newStdOut));
						done(new GitOutputStreams(Array.isArray(newStdOut) ? Buffer.concat(newStdOut) : newStdOut, Buffer.concat(stdErr)));
					}, fail);
				}
				if (error) {
					logger.info(`handling as error: exitCode=%s stdErr=%s rejection=%o`, exitCode, stdErr.length, rejection);
					return fail(error);
				}
				logger.info(`retrieving task output complete`);
				done(new GitOutputStreams(Buffer.concat(stdOut), Buffer.concat(stdErr)));
			});
		}
		async gitResponse(task, command, args, outputHandler, logger) {
			const outputLogger = logger.sibling("output");
			const spawnOptions = this._plugins.exec("spawn.options", {
				cwd: this.cwd,
				env: this.env,
				windowsHide: true
			}, pluginContext(task, task.commands));
			return new Promise((done) => {
				const stdOut = [];
				const stdErr = [];
				logger.info(`%s %o`, command, args);
				logger("%O", spawnOptions);
				let rejection = this._beforeSpawn(task, args);
				if (rejection) return done({
					stdOut,
					stdErr,
					exitCode: 9901,
					rejection
				});
				this._plugins.exec("spawn.before", void 0, {
					...pluginContext(task, args),
					kill(reason) {
						rejection = reason || rejection;
					}
				});
				const spawned = (0, child_process.spawn)(command, args, spawnOptions);
				spawned.stdout.on("data", onDataReceived(stdOut, "stdOut", logger, outputLogger.step("stdOut")));
				spawned.stderr.on("data", onDataReceived(stdErr, "stdErr", logger, outputLogger.step("stdErr")));
				spawned.on("error", onErrorReceived(stdErr, logger));
				if (outputHandler) {
					logger(`Passing child process stdOut/stdErr to custom outputHandler`);
					outputHandler(command, spawned.stdout, spawned.stderr, [...args]);
				}
				this._plugins.exec("spawn.after", void 0, {
					...pluginContext(task, args),
					spawned,
					close(exitCode, reason) {
						done({
							stdOut,
							stdErr,
							exitCode,
							rejection: rejection || reason
						});
					},
					kill(reason) {
						if (spawned.killed) return;
						rejection = reason;
						spawned.kill("SIGINT");
					}
				});
			});
		}
		_beforeSpawn(task, args) {
			let rejection;
			this._plugins.exec("spawn.before", void 0, {
				...pluginContext(task, args),
				kill(reason) {
					rejection = reason || rejection;
				}
			});
			return rejection;
		}
	};
} });
var git_executor_exports = {};
__export(git_executor_exports, { GitExecutor: () => GitExecutor });
var GitExecutor;
var init_git_executor = __esm({ "src/lib/runners/git-executor.ts"() {
	"use strict";
	init_git_executor_chain();
	GitExecutor = class {
		constructor(cwd, _scheduler, _plugins) {
			this.cwd = cwd;
			this._scheduler = _scheduler;
			this._plugins = _plugins;
			this._chain = new GitExecutorChain(this, this._scheduler, this._plugins);
		}
		chain() {
			return new GitExecutorChain(this, this._scheduler, this._plugins);
		}
		push(task) {
			return this._chain.push(task);
		}
	};
} });
function taskCallback(task, response, callback = NOOP) {
	const onSuccess = (data) => {
		callback(null, data);
	};
	const onError2 = (err) => {
		if (err?.task === task) callback(err instanceof GitResponseError ? addDeprecationNoticeToError(err) : err, void 0);
	};
	response.then(onSuccess, onError2);
}
function addDeprecationNoticeToError(err) {
	let log = (name) => {
		console.warn(`simple-git deprecation notice: accessing GitResponseError.${name} should be GitResponseError.git.${name}, this will no longer be available in version 3`);
		log = NOOP;
	};
	return Object.create(err, Object.getOwnPropertyNames(err.git).reduce(descriptorReducer, {}));
	function descriptorReducer(all, name) {
		if (name in err) return all;
		all[name] = {
			enumerable: false,
			configurable: false,
			get() {
				log(name);
				return err.git[name];
			}
		};
		return all;
	}
}
var init_task_callback = __esm({ "src/lib/task-callback.ts"() {
	"use strict";
	init_git_response_error();
	init_utils();
} });
function changeWorkingDirectoryTask(directory, root) {
	return adhocExecTask((instance) => {
		if (!folderExists(directory)) throw new Error(`Git.cwd: cannot change to non-directory "${directory}"`);
		return (root || instance).cwd = directory;
	});
}
var init_change_working_directory = __esm({ "src/lib/tasks/change-working-directory.ts"() {
	"use strict";
	init_utils();
	init_task();
} });
function checkoutTask(args) {
	const commands = ["checkout", ...args];
	if (commands[1] === "-b" && commands.includes("-B")) commands[1] = remove(commands, "-B");
	return straightThroughStringTask(commands);
}
function checkout_default() {
	return {
		checkout() {
			return this._runTask(checkoutTask(getTrailingOptions(arguments, 1)), trailingFunctionArgument(arguments));
		},
		checkoutBranch(branchName, startPoint) {
			return this._runTask(checkoutTask([
				"-b",
				branchName,
				startPoint,
				...getTrailingOptions(arguments)
			]), trailingFunctionArgument(arguments));
		},
		checkoutLocalBranch(branchName) {
			return this._runTask(checkoutTask([
				"-b",
				branchName,
				...getTrailingOptions(arguments)
			]), trailingFunctionArgument(arguments));
		}
	};
}
var init_checkout = __esm({ "src/lib/tasks/checkout.ts"() {
	"use strict";
	init_utils();
	init_task();
} });
function countObjectsResponse() {
	return {
		count: 0,
		garbage: 0,
		inPack: 0,
		packs: 0,
		prunePackable: 0,
		size: 0,
		sizeGarbage: 0,
		sizePack: 0
	};
}
function count_objects_default() {
	return { countObjects() {
		return this._runTask({
			commands: ["count-objects", "--verbose"],
			format: "utf-8",
			parser(stdOut) {
				return parseStringResponse(countObjectsResponse(), [parser2], stdOut);
			}
		});
	} };
}
var parser2;
var init_count_objects = __esm({ "src/lib/tasks/count-objects.ts"() {
	"use strict";
	init_utils();
	parser2 = new LineParser(/([a-z-]+): (\d+)$/, (result, [key, value]) => {
		const property = asCamelCase(key);
		if (Object.hasOwn(result, property)) result[property] = asNumber(value);
	});
} });
function parseCommitResult(stdOut) {
	return parseStringResponse({
		author: null,
		branch: "",
		commit: "",
		root: false,
		summary: {
			changes: 0,
			insertions: 0,
			deletions: 0
		}
	}, parsers, stdOut);
}
var parsers;
var init_parse_commit = __esm({ "src/lib/parsers/parse-commit.ts"() {
	"use strict";
	init_utils();
	parsers = [
		new LineParser(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (result, [branch, root, commit]) => {
			result.branch = branch;
			result.commit = commit;
			result.root = !!root;
		}),
		new LineParser(/\s*Author:\s(.+)/i, (result, [author]) => {
			const parts = author.split("<");
			const email = parts.pop();
			if (!email || !email.includes("@")) return;
			result.author = {
				email: email.substr(0, email.length - 1),
				name: parts.join("<").trim()
			};
		}),
		new LineParser(/(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g, (result, [changes, insertions, deletions]) => {
			result.summary.changes = parseInt(changes, 10) || 0;
			result.summary.insertions = parseInt(insertions, 10) || 0;
			result.summary.deletions = parseInt(deletions, 10) || 0;
		}),
		new LineParser(/^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/, (result, [changes, lines, direction]) => {
			result.summary.changes = parseInt(changes, 10) || 0;
			const count = parseInt(lines, 10) || 0;
			if (direction === "-") result.summary.deletions = count;
			else if (direction === "+") result.summary.insertions = count;
		})
	];
} });
function commitTask(message, files, customArgs) {
	return {
		commands: [
			"-c",
			"core.abbrev=40",
			"commit",
			...prefixedArray(message, "-m"),
			...files,
			...customArgs
		],
		format: "utf-8",
		parser: parseCommitResult
	};
}
function commit_default() {
	return { commit(message, ...rest) {
		const next = trailingFunctionArgument(arguments);
		const task = rejectDeprecatedSignatures(message) || commitTask(asArray(message), asArray(filterType(rest[0], filterStringOrStringArray, [])), [...asStringArray(filterType(rest[1], filterArray, [])), ...getTrailingOptions(arguments, 0, true)]);
		return this._runTask(task, next);
	} };
	function rejectDeprecatedSignatures(message) {
		return !filterStringOrStringArray(message) && configurationErrorTask(`git.commit: requires the commit message to be supplied as a string/string[]`);
	}
}
var init_commit = __esm({ "src/lib/tasks/commit.ts"() {
	"use strict";
	init_parse_commit();
	init_utils();
	init_task();
} });
function first_commit_default() {
	return { firstCommit() {
		return this._runTask(straightThroughStringTask([
			"rev-list",
			"--max-parents=0",
			"HEAD"
		], true), trailingFunctionArgument(arguments));
	} };
}
var init_first_commit = __esm({ "src/lib/tasks/first-commit.ts"() {
	"use strict";
	init_utils();
	init_task();
} });
function hashObjectTask(filePath, write) {
	const commands = ["hash-object", filePath];
	if (write) commands.push("-w");
	return straightThroughStringTask(commands, true);
}
var init_hash_object = __esm({ "src/lib/tasks/hash-object.ts"() {
	"use strict";
	init_task();
} });
function parseInit(bare, path, text) {
	const response = String(text).trim();
	let result;
	if (result = initResponseRegex.exec(response)) return new InitSummary(bare, path, false, result[1]);
	if (result = reInitResponseRegex.exec(response)) return new InitSummary(bare, path, true, result[1]);
	let gitDir = "";
	const tokens = response.split(" ");
	while (tokens.length) if (tokens.shift() === "in") {
		gitDir = tokens.join(" ");
		break;
	}
	return new InitSummary(bare, path, /^re/i.test(response), gitDir);
}
var InitSummary, initResponseRegex, reInitResponseRegex;
var init_InitSummary = __esm({ "src/lib/responses/InitSummary.ts"() {
	"use strict";
	InitSummary = class {
		constructor(bare, path, existing, gitDir) {
			this.bare = bare;
			this.path = path;
			this.existing = existing;
			this.gitDir = gitDir;
		}
	};
	initResponseRegex = /^Init.+ repository in (.+)$/;
	reInitResponseRegex = /^Rein.+ in (.+)$/;
} });
function hasBareCommand(command) {
	return command.includes(bareCommand);
}
function initTask(bare = false, path, customArgs) {
	const commands = ["init", ...customArgs];
	if (bare && !hasBareCommand(commands)) commands.splice(1, 0, bareCommand);
	return {
		commands,
		format: "utf-8",
		parser(text) {
			return parseInit(commands.includes("--bare"), path, text);
		}
	};
}
var bareCommand;
var init_init = __esm({ "src/lib/tasks/init.ts"() {
	"use strict";
	init_InitSummary();
	bareCommand = "--bare";
} });
function logFormatFromCommand(customArgs) {
	for (let i = 0; i < customArgs.length; i++) {
		const format = logFormatRegex.exec(customArgs[i]);
		if (format) return `--${format[1]}`;
	}
	return "";
}
function isLogFormat(customArg) {
	return logFormatRegex.test(customArg);
}
var logFormatRegex;
var init_log_format = __esm({ "src/lib/args/log-format.ts"() {
	"use strict";
	logFormatRegex = /^--(stat|numstat|name-only|name-status)(=|$)/;
} });
var DiffSummary;
var init_DiffSummary = __esm({ "src/lib/responses/DiffSummary.ts"() {
	"use strict";
	DiffSummary = class {
		constructor() {
			this.changed = 0;
			this.deletions = 0;
			this.insertions = 0;
			this.files = [];
		}
	};
} });
function getDiffParser(format = "") {
	const parser4 = diffSummaryParsers[format];
	return (stdOut) => parseStringResponse(new DiffSummary(), parser4, stdOut, false);
}
var statParser, numStatParser, nameOnlyParser, nameStatusParser, diffSummaryParsers;
var init_parse_diff_summary = __esm({ "src/lib/parsers/parse-diff-summary.ts"() {
	"use strict";
	init_log_format();
	init_DiffSummary();
	init_diff_name_status();
	init_utils();
	statParser = [
		new LineParser(/^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/, (result, [file, changes, alterations = ""]) => {
			result.files.push({
				file: file.trim(),
				changes: asNumber(changes),
				insertions: alterations.replace(/[^+]/g, "").length,
				deletions: alterations.replace(/[^-]/g, "").length,
				binary: false
			});
		}),
		new LineParser(/^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/, (result, [file, before, after]) => {
			result.files.push({
				file: file.trim(),
				before: asNumber(before),
				after: asNumber(after),
				binary: true
			});
		}),
		new LineParser(/(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/, (result, [changed, summary]) => {
			const inserted = /(\d+) i/.exec(summary);
			const deleted = /(\d+) d/.exec(summary);
			result.changed = asNumber(changed);
			result.insertions = asNumber(inserted?.[1]);
			result.deletions = asNumber(deleted?.[1]);
		})
	];
	numStatParser = [new LineParser(/(\d+)\t(\d+)\t(.+)$/, (result, [changesInsert, changesDelete, file]) => {
		const insertions = asNumber(changesInsert);
		const deletions = asNumber(changesDelete);
		result.changed++;
		result.insertions += insertions;
		result.deletions += deletions;
		result.files.push({
			file,
			changes: insertions + deletions,
			insertions,
			deletions,
			binary: false
		});
	}), new LineParser(/-\t-\t(.+)$/, (result, [file]) => {
		result.changed++;
		result.files.push({
			file,
			after: 0,
			before: 0,
			binary: true
		});
	})];
	nameOnlyParser = [new LineParser(/(.+)$/, (result, [file]) => {
		result.changed++;
		result.files.push({
			file,
			changes: 0,
			insertions: 0,
			deletions: 0,
			binary: false
		});
	})];
	nameStatusParser = [new LineParser(/([ACDMRTUXB])([0-9]{0,3})\t(.[^\t]*)(\t(.[^\t]*))?$/, (result, [status, similarity, from, _to, to]) => {
		result.changed++;
		result.files.push({
			file: to ?? from,
			changes: 0,
			insertions: 0,
			deletions: 0,
			binary: false,
			status: orVoid(isDiffNameStatus(status) && status),
			from: orVoid(!!to && from !== to && from),
			similarity: asNumber(similarity)
		});
	})];
	diffSummaryParsers = {
		[""]: statParser,
		["--stat"]: statParser,
		["--numstat"]: numStatParser,
		["--name-status"]: nameStatusParser,
		["--name-only"]: nameOnlyParser
	};
} });
function lineBuilder(tokens, fields) {
	return fields.reduce((line, field, index) => {
		line[field] = tokens[index] || "";
		return line;
	}, /* @__PURE__ */ Object.create({ diff: null }));
}
function createListLogSummaryParser(splitter = SPLITTER, fields = defaultFieldNames, logFormat = "") {
	const parseDiffResult = getDiffParser(logFormat);
	return function(stdOut) {
		const all = toLinesWithContent(stdOut.trim(), false, START_BOUNDARY).map(function(item) {
			const lineDetail = item.split(COMMIT_BOUNDARY);
			const listLogLine = lineBuilder(lineDetail[0].split(splitter), fields);
			if (lineDetail.length > 1 && !!lineDetail[1].trim()) listLogLine.diff = parseDiffResult(lineDetail[1]);
			return listLogLine;
		});
		return {
			all,
			latest: all.length && all[0] || null,
			total: all.length
		};
	};
}
var START_BOUNDARY, COMMIT_BOUNDARY, SPLITTER, defaultFieldNames;
var init_parse_list_log_summary = __esm({ "src/lib/parsers/parse-list-log-summary.ts"() {
	"use strict";
	init_utils();
	init_parse_diff_summary();
	init_log_format();
	START_BOUNDARY = "òòòòòò ";
	COMMIT_BOUNDARY = " òò";
	SPLITTER = " ò ";
	defaultFieldNames = [
		"hash",
		"date",
		"message",
		"refs",
		"author_name",
		"author_email"
	];
} });
var diff_exports = {};
__export(diff_exports, {
	diffSummaryTask: () => diffSummaryTask,
	validateLogFormatConfig: () => validateLogFormatConfig
});
function diffSummaryTask(customArgs) {
	let logFormat = logFormatFromCommand(customArgs);
	const commands = ["diff"];
	if (logFormat === "") {
		logFormat = "--stat";
		commands.push("--stat=4096");
	}
	commands.push(...customArgs);
	return validateLogFormatConfig(commands) || {
		commands,
		format: "utf-8",
		parser: getDiffParser(logFormat)
	};
}
function validateLogFormatConfig(customArgs) {
	const flags = customArgs.filter(isLogFormat);
	if (flags.length > 1) return configurationErrorTask(`Summary flags are mutually exclusive - pick one of ${flags.join(",")}`);
	if (flags.length && customArgs.includes("-z")) return configurationErrorTask(`Summary flag ${flags} parsing is not compatible with null termination option '-z'`);
}
var init_diff = __esm({ "src/lib/tasks/diff.ts"() {
	"use strict";
	init_log_format();
	init_parse_diff_summary();
	init_task();
} });
function prettyFormat(format, splitter) {
	const fields = [];
	const formatStr = [];
	Object.keys(format).forEach((field) => {
		fields.push(field);
		formatStr.push(String(format[field]));
	});
	return [fields, formatStr.join(splitter)];
}
function userOptions(input) {
	return Object.keys(input).reduce((out, key) => {
		if (!(key in excludeOptions)) out[key] = input[key];
		return out;
	}, {});
}
function parseLogOptions(opt = {}, customArgs = []) {
	const splitter = filterType(opt.splitter, filterString, SPLITTER);
	const [fields, formatStr] = prettyFormat(filterPlainObject(opt.format) ? opt.format : {
		hash: "%H",
		date: opt.strictDate === false ? "%ai" : "%aI",
		message: "%s",
		refs: "%D",
		body: opt.multiLine ? "%B" : "%b",
		author_name: opt.mailMap !== false ? "%aN" : "%an",
		author_email: opt.mailMap !== false ? "%aE" : "%ae"
	}, splitter);
	const suffix = [];
	const command = [`--pretty=format:${START_BOUNDARY}${formatStr}${COMMIT_BOUNDARY}`, ...customArgs];
	const maxCount = opt.n || opt["max-count"] || opt.maxCount;
	if (maxCount) command.push(`--max-count=${maxCount}`);
	if (opt.from || opt.to) {
		const rangeOperator = opt.symmetric !== false ? "..." : "..";
		suffix.push(`${opt.from || ""}${rangeOperator}${opt.to || ""}`);
	}
	if (filterString(opt.file)) command.push("--follow", pathspec(opt.file));
	appendTaskOptions(userOptions(opt), command);
	return {
		fields,
		splitter,
		commands: [...command, ...suffix]
	};
}
function logTask(splitter, fields, customArgs) {
	const parser4 = createListLogSummaryParser(splitter, fields, logFormatFromCommand(customArgs));
	return {
		commands: ["log", ...customArgs],
		format: "utf-8",
		parser: parser4
	};
}
function log_default() {
	return { log(...rest) {
		const next = trailingFunctionArgument(arguments);
		const options = parseLogOptions(trailingOptionsArgument(arguments), asStringArray(filterType(arguments[0], filterArray, [])));
		const task = rejectDeprecatedSignatures(...rest) || validateLogFormatConfig(options.commands) || createLogTask(options);
		return this._runTask(task, next);
	} };
	function createLogTask(options) {
		return logTask(options.splitter, options.fields, options.commands);
	}
	function rejectDeprecatedSignatures(from, to) {
		return filterString(from) && filterString(to) && configurationErrorTask(`git.log(string, string) should be replaced with git.log({ from: string, to: string })`);
	}
}
var excludeOptions;
var init_log = __esm({ "src/lib/tasks/log.ts"() {
	"use strict";
	init_log_format();
	init_pathspec();
	init_parse_list_log_summary();
	init_utils();
	init_task();
	init_diff();
	excludeOptions = /* @__PURE__ */ ((excludeOptions2) => {
		excludeOptions2[excludeOptions2["--pretty"] = 0] = "--pretty";
		excludeOptions2[excludeOptions2["max-count"] = 1] = "max-count";
		excludeOptions2[excludeOptions2["maxCount"] = 2] = "maxCount";
		excludeOptions2[excludeOptions2["n"] = 3] = "n";
		excludeOptions2[excludeOptions2["file"] = 4] = "file";
		excludeOptions2[excludeOptions2["format"] = 5] = "format";
		excludeOptions2[excludeOptions2["from"] = 6] = "from";
		excludeOptions2[excludeOptions2["to"] = 7] = "to";
		excludeOptions2[excludeOptions2["splitter"] = 8] = "splitter";
		excludeOptions2[excludeOptions2["symmetric"] = 9] = "symmetric";
		excludeOptions2[excludeOptions2["mailMap"] = 10] = "mailMap";
		excludeOptions2[excludeOptions2["multiLine"] = 11] = "multiLine";
		excludeOptions2[excludeOptions2["strictDate"] = 12] = "strictDate";
		return excludeOptions2;
	})(excludeOptions || {});
} });
var MergeSummaryConflict, MergeSummaryDetail;
var init_MergeSummary = __esm({ "src/lib/responses/MergeSummary.ts"() {
	"use strict";
	MergeSummaryConflict = class {
		constructor(reason, file = null, meta) {
			this.reason = reason;
			this.file = file;
			this.meta = meta;
		}
		toString() {
			return `${this.file}:${this.reason}`;
		}
	};
	MergeSummaryDetail = class {
		constructor() {
			this.conflicts = [];
			this.merges = [];
			this.result = "success";
		}
		get failed() {
			return this.conflicts.length > 0;
		}
		get reason() {
			return this.result;
		}
		toString() {
			if (this.conflicts.length) return `CONFLICTS: ${this.conflicts.join(", ")}`;
			return "OK";
		}
	};
} });
var PullSummary, PullFailedSummary;
var init_PullSummary = __esm({ "src/lib/responses/PullSummary.ts"() {
	"use strict";
	PullSummary = class {
		constructor() {
			this.remoteMessages = { all: [] };
			this.created = [];
			this.deleted = [];
			this.files = [];
			this.deletions = {};
			this.insertions = {};
			this.summary = {
				changes: 0,
				deletions: 0,
				insertions: 0
			};
		}
	};
	PullFailedSummary = class {
		constructor() {
			this.remote = "";
			this.hash = {
				local: "",
				remote: ""
			};
			this.branch = {
				local: "",
				remote: ""
			};
			this.message = "";
		}
		toString() {
			return this.message;
		}
	};
} });
function objectEnumerationResult(remoteMessages) {
	return remoteMessages.objects = remoteMessages.objects || {
		compressing: 0,
		counting: 0,
		enumerating: 0,
		packReused: 0,
		reused: {
			count: 0,
			delta: 0
		},
		total: {
			count: 0,
			delta: 0
		}
	};
}
function asObjectCount(source) {
	const count = /^\s*(\d+)/.exec(source);
	const delta = /delta (\d+)/i.exec(source);
	return {
		count: asNumber(count && count[1] || "0"),
		delta: asNumber(delta && delta[1] || "0")
	};
}
var remoteMessagesObjectParsers;
var init_parse_remote_objects = __esm({ "src/lib/parsers/parse-remote-objects.ts"() {
	"use strict";
	init_utils();
	remoteMessagesObjectParsers = [
		new RemoteLineParser(/^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i, (result, [action, count]) => {
			const key = action.toLowerCase();
			const enumeration = objectEnumerationResult(result.remoteMessages);
			Object.assign(enumeration, { [key]: asNumber(count) });
		}),
		new RemoteLineParser(/^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i, (result, [action, count]) => {
			const key = action.toLowerCase();
			const enumeration = objectEnumerationResult(result.remoteMessages);
			Object.assign(enumeration, { [key]: asNumber(count) });
		}),
		new RemoteLineParser(/total ([^,]+), reused ([^,]+), pack-reused (\d+)/i, (result, [total, reused, packReused]) => {
			const objects = objectEnumerationResult(result.remoteMessages);
			objects.total = asObjectCount(total);
			objects.reused = asObjectCount(reused);
			objects.packReused = asNumber(packReused);
		})
	];
} });
function parseRemoteMessages(_stdOut, stdErr) {
	return parseStringResponse({ remoteMessages: new RemoteMessageSummary() }, parsers2, stdErr);
}
var parsers2, RemoteMessageSummary;
var init_parse_remote_messages = __esm({ "src/lib/parsers/parse-remote-messages.ts"() {
	"use strict";
	init_utils();
	init_parse_remote_objects();
	parsers2 = [
		new RemoteLineParser(/^remote:\s*(.+)$/, (result, [text]) => {
			result.remoteMessages.all.push(text.trim());
			return false;
		}),
		...remoteMessagesObjectParsers,
		new RemoteLineParser([/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/], (result, [pullRequestUrl]) => {
			result.remoteMessages.pullRequestUrl = pullRequestUrl;
		}),
		new RemoteLineParser([/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/], (result, [count, summary, url]) => {
			result.remoteMessages.vulnerabilities = {
				count: asNumber(count),
				summary,
				url
			};
		})
	];
	RemoteMessageSummary = class {
		constructor() {
			this.all = [];
		}
	};
} });
function parsePullErrorResult(stdOut, stdErr) {
	const pullError = parseStringResponse(new PullFailedSummary(), errorParsers, [stdOut, stdErr]);
	return pullError.message && pullError;
}
var FILE_UPDATE_REGEX, SUMMARY_REGEX, ACTION_REGEX, parsers3, errorParsers, parsePullDetail, parsePullResult;
var init_parse_pull = __esm({ "src/lib/parsers/parse-pull.ts"() {
	"use strict";
	init_PullSummary();
	init_utils();
	init_parse_remote_messages();
	FILE_UPDATE_REGEX = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/;
	SUMMARY_REGEX = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/;
	ACTION_REGEX = /^(create|delete) mode \d+ (.+)/;
	parsers3 = [
		new LineParser(FILE_UPDATE_REGEX, (result, [file, insertions, deletions]) => {
			result.files.push(file);
			if (insertions) result.insertions[file] = insertions.length;
			if (deletions) result.deletions[file] = deletions.length;
		}),
		new LineParser(SUMMARY_REGEX, (result, [changes, , insertions, , deletions]) => {
			if (insertions !== void 0 || deletions !== void 0) {
				result.summary.changes = +changes || 0;
				result.summary.insertions = +insertions || 0;
				result.summary.deletions = +deletions || 0;
				return true;
			}
			return false;
		}),
		new LineParser(ACTION_REGEX, (result, [action, file]) => {
			append(result.files, file);
			append(action === "create" ? result.created : result.deleted, file);
		})
	];
	errorParsers = [
		new LineParser(/^from\s(.+)$/i, (result, [remote]) => void (result.remote = remote)),
		new LineParser(/^fatal:\s(.+)$/, (result, [message]) => void (result.message = message)),
		new LineParser(/([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/, (result, [hashLocal, hashRemote, branchLocal, branchRemote]) => {
			result.branch.local = branchLocal;
			result.hash.local = hashLocal;
			result.branch.remote = branchRemote;
			result.hash.remote = hashRemote;
		})
	];
	parsePullDetail = (stdOut, stdErr) => {
		return parseStringResponse(new PullSummary(), parsers3, [stdOut, stdErr]);
	};
	parsePullResult = (stdOut, stdErr) => {
		return Object.assign(new PullSummary(), parsePullDetail(stdOut, stdErr), parseRemoteMessages(stdOut, stdErr));
	};
} });
var parsers4, parseMergeResult, parseMergeDetail;
var init_parse_merge = __esm({ "src/lib/parsers/parse-merge.ts"() {
	"use strict";
	init_MergeSummary();
	init_utils();
	init_parse_pull();
	parsers4 = [
		new LineParser(/^Auto-merging\s+(.+)$/, (summary, [autoMerge]) => {
			summary.merges.push(autoMerge);
		}),
		new LineParser(/^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/, (summary, [reason, file]) => {
			summary.conflicts.push(new MergeSummaryConflict(reason, file));
		}),
		new LineParser(/^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/, (summary, [reason, file, deleteRef]) => {
			summary.conflicts.push(new MergeSummaryConflict(reason, file, { deleteRef }));
		}),
		new LineParser(/^CONFLICT\s+\((.+)\):/, (summary, [reason]) => {
			summary.conflicts.push(new MergeSummaryConflict(reason, null));
		}),
		new LineParser(/^Automatic merge failed;\s+(.+)$/, (summary, [result]) => {
			summary.result = result;
		})
	];
	parseMergeResult = (stdOut, stdErr) => {
		return Object.assign(parseMergeDetail(stdOut, stdErr), parsePullResult(stdOut, stdErr));
	};
	parseMergeDetail = (stdOut) => {
		return parseStringResponse(new MergeSummaryDetail(), parsers4, stdOut);
	};
} });
function mergeTask(customArgs) {
	if (!customArgs.length) return configurationErrorTask("Git.merge requires at least one option");
	return {
		commands: ["merge", ...customArgs],
		format: "utf-8",
		parser(stdOut, stdErr) {
			const merge = parseMergeResult(stdOut, stdErr);
			if (merge.failed) throw new GitResponseError(merge);
			return merge;
		}
	};
}
var init_merge = __esm({ "src/lib/tasks/merge.ts"() {
	"use strict";
	init_git_response_error();
	init_parse_merge();
	init_task();
} });
function pushResultPushedItem(local, remote, status) {
	const deleted = status.includes("deleted");
	const tag = status.includes("tag") || /^refs\/tags/.test(local);
	const alreadyUpdated = !status.includes("new");
	return {
		deleted,
		tag,
		branch: !tag,
		new: !alreadyUpdated,
		alreadyUpdated,
		local,
		remote
	};
}
var parsers5, parsePushResult, parsePushDetail;
var init_parse_push = __esm({ "src/lib/parsers/parse-push.ts"() {
	"use strict";
	init_utils();
	init_parse_remote_messages();
	parsers5 = [
		new LineParser(/^Pushing to (.+)$/, (result, [repo]) => {
			result.repo = repo;
		}),
		new LineParser(/^updating local tracking ref '(.+)'/, (result, [local]) => {
			result.ref = {
				...result.ref || {},
				local
			};
		}),
		new LineParser(/^[=*-]\s+([^:]+):(\S+)\s+\[(.+)]$/, (result, [local, remote, type]) => {
			result.pushed.push(pushResultPushedItem(local, remote, type));
		}),
		new LineParser(/^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/, (result, [local, remote, remoteName]) => {
			result.branch = {
				...result.branch || {},
				local,
				remote,
				remoteName
			};
		}),
		new LineParser(/^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/, (result, [local, remote, from, to]) => {
			result.update = {
				head: {
					local,
					remote
				},
				hash: {
					from,
					to
				}
			};
		})
	];
	parsePushResult = (stdOut, stdErr) => {
		const pushDetail = parsePushDetail(stdOut, stdErr);
		const responseDetail = parseRemoteMessages(stdOut, stdErr);
		return {
			...pushDetail,
			...responseDetail
		};
	};
	parsePushDetail = (stdOut, stdErr) => {
		return parseStringResponse({ pushed: [] }, parsers5, [stdOut, stdErr]);
	};
} });
var push_exports = {};
__export(push_exports, {
	pushTagsTask: () => pushTagsTask,
	pushTask: () => pushTask
});
function pushTagsTask(ref = {}, customArgs) {
	append(customArgs, "--tags");
	return pushTask(ref, customArgs);
}
function pushTask(ref = {}, customArgs) {
	const commands = ["push", ...customArgs];
	if (ref.branch) commands.splice(1, 0, ref.branch);
	if (ref.remote) commands.splice(1, 0, ref.remote);
	remove(commands, "-v");
	append(commands, "--verbose");
	append(commands, "--porcelain");
	return {
		commands,
		format: "utf-8",
		parser: parsePushResult
	};
}
var init_push = __esm({ "src/lib/tasks/push.ts"() {
	"use strict";
	init_parse_push();
	init_utils();
} });
function show_default() {
	return {
		showBuffer() {
			const commands = ["show", ...getTrailingOptions(arguments, 1)];
			if (!commands.includes("--binary")) commands.splice(1, 0, "--binary");
			return this._runTask(straightThroughBufferTask(commands), trailingFunctionArgument(arguments));
		},
		show() {
			const commands = ["show", ...getTrailingOptions(arguments, 1)];
			return this._runTask(straightThroughStringTask(commands), trailingFunctionArgument(arguments));
		}
	};
}
var init_show = __esm({ "src/lib/tasks/show.ts"() {
	"use strict";
	init_utils();
	init_task();
} });
var fromPathRegex, FileStatusSummary;
var init_FileStatusSummary = __esm({ "src/lib/responses/FileStatusSummary.ts"() {
	"use strict";
	fromPathRegex = /^(.+)\0(.+)$/;
	FileStatusSummary = class {
		constructor(path, index, working_dir) {
			this.path = path;
			this.index = index;
			this.working_dir = working_dir;
			if (index === "R" || working_dir === "R") {
				const detail = fromPathRegex.exec(path) || [
					null,
					path,
					path
				];
				this.from = detail[2] || "";
				this.path = detail[1] || "";
			}
		}
	};
} });
function renamedFile(line) {
	const [to, from] = line.split(NULL);
	return {
		from: from || to,
		to
	};
}
function parser3(indexX, indexY, handler) {
	return [`${indexX}${indexY}`, handler];
}
function conflicts(indexX, ...indexY) {
	return indexY.map((y) => parser3(indexX, y, (result, file) => result.conflicted.push(file)));
}
function splitLine(result, lineStr) {
	const trimmed2 = lineStr.trim();
	switch (" ") {
		case trimmed2.charAt(2): return data(trimmed2.charAt(0), trimmed2.charAt(1), trimmed2.slice(3));
		case trimmed2.charAt(1): return data(" ", trimmed2.charAt(0), trimmed2.slice(2));
		default: return;
	}
	function data(index, workingDir, path) {
		const raw = `${index}${workingDir}`;
		const handler = parsers6.get(raw);
		if (handler) handler(result, path);
		if (raw !== "##" && raw !== "!!") result.files.push(new FileStatusSummary(path, index, workingDir));
	}
}
var StatusSummary, parsers6, parseStatusSummary;
var init_StatusSummary = __esm({ "src/lib/responses/StatusSummary.ts"() {
	"use strict";
	init_utils();
	init_FileStatusSummary();
	StatusSummary = class {
		constructor() {
			this.not_added = [];
			this.conflicted = [];
			this.created = [];
			this.deleted = [];
			this.ignored = void 0;
			this.modified = [];
			this.renamed = [];
			this.files = [];
			this.staged = [];
			this.ahead = 0;
			this.behind = 0;
			this.current = null;
			this.tracking = null;
			this.detached = false;
			this.isClean = () => {
				return !this.files.length;
			};
		}
	};
	parsers6 = new Map([
		parser3(" ", "A", (result, file) => result.created.push(file)),
		parser3(" ", "D", (result, file) => result.deleted.push(file)),
		parser3(" ", "M", (result, file) => result.modified.push(file)),
		parser3("A", " ", (result, file) => {
			result.created.push(file);
			result.staged.push(file);
		}),
		parser3("A", "M", (result, file) => {
			result.created.push(file);
			result.staged.push(file);
			result.modified.push(file);
		}),
		parser3("D", " ", (result, file) => {
			result.deleted.push(file);
			result.staged.push(file);
		}),
		parser3("M", " ", (result, file) => {
			result.modified.push(file);
			result.staged.push(file);
		}),
		parser3("M", "M", (result, file) => {
			result.modified.push(file);
			result.staged.push(file);
		}),
		parser3("R", " ", (result, file) => {
			result.renamed.push(renamedFile(file));
		}),
		parser3("R", "M", (result, file) => {
			const renamed = renamedFile(file);
			result.renamed.push(renamed);
			result.modified.push(renamed.to);
		}),
		parser3("!", "!", (_result, _file) => {
			(_result.ignored = _result.ignored || []).push(_file);
		}),
		parser3("?", "?", (result, file) => result.not_added.push(file)),
		...conflicts("A", "A", "U"),
		...conflicts("D", "D", "U"),
		...conflicts("U", "A", "D", "U"),
		["##", (result, line) => {
			const aheadReg = /ahead (\d+)/;
			const behindReg = /behind (\d+)/;
			const currentReg = /^(.+?(?=(?:\.{3}|\s|$)))/;
			const trackingReg = /\.{3}(\S*)/;
			const onEmptyBranchReg = /\son\s(\S+?)(?=\.{3}|$)/;
			let regexResult = aheadReg.exec(line);
			result.ahead = regexResult && +regexResult[1] || 0;
			regexResult = behindReg.exec(line);
			result.behind = regexResult && +regexResult[1] || 0;
			regexResult = currentReg.exec(line);
			result.current = filterType(regexResult?.[1], filterString, null);
			regexResult = trackingReg.exec(line);
			result.tracking = filterType(regexResult?.[1], filterString, null);
			regexResult = onEmptyBranchReg.exec(line);
			if (regexResult) result.current = filterType(regexResult?.[1], filterString, result.current);
			result.detached = /\(no branch\)/.test(line);
		}]
	]);
	parseStatusSummary = function(text) {
		const lines = text.split(NULL);
		const status = new StatusSummary();
		for (let i = 0, l = lines.length; i < l;) {
			let line = lines[i++].trim();
			if (!line) continue;
			if (line.charAt(0) === "R") line += NULL + (lines[i++] || "");
			splitLine(status, line);
		}
		return status;
	};
} });
function statusTask(customArgs) {
	return {
		format: "utf-8",
		commands: [
			"status",
			"--porcelain",
			"-b",
			"-u",
			"--null",
			...customArgs.filter((arg) => !ignoredOptions.includes(arg))
		],
		parser(text) {
			return parseStatusSummary(text);
		}
	};
}
var ignoredOptions;
var init_status = __esm({ "src/lib/tasks/status.ts"() {
	"use strict";
	init_StatusSummary();
	ignoredOptions = ["--null", "-z"];
} });
function versionResponse(major = 0, minor = 0, patch = 0, agent = "", installed = true) {
	return Object.defineProperty({
		major,
		minor,
		patch,
		agent,
		installed
	}, "toString", {
		value() {
			return `${this.major}.${this.minor}.${this.patch}`;
		},
		configurable: false,
		enumerable: false
	});
}
function notInstalledResponse() {
	return versionResponse(0, 0, 0, "", false);
}
function version_default() {
	return { version() {
		return this._runTask({
			commands: ["--version"],
			format: "utf-8",
			parser: versionParser,
			onError(result, error, done, fail) {
				if (result.exitCode === -2) return done(Buffer.from(NOT_INSTALLED));
				fail(error);
			}
		});
	} };
}
function versionParser(stdOut) {
	if (stdOut === NOT_INSTALLED) return notInstalledResponse();
	return parseStringResponse(versionResponse(0, 0, 0, stdOut), parsers7, stdOut);
}
var NOT_INSTALLED, parsers7;
var init_version = __esm({ "src/lib/tasks/version.ts"() {
	"use strict";
	init_utils();
	NOT_INSTALLED = "installed=false";
	parsers7 = [new LineParser(/version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/, (result, [major, minor, patch, agent = ""]) => {
		Object.assign(result, versionResponse(asNumber(major), asNumber(minor), asNumber(patch), agent));
	}), new LineParser(/version (\d+)\.(\d+)\.(\D+)(.+)?$/, (result, [major, minor, patch, agent = ""]) => {
		Object.assign(result, versionResponse(asNumber(major), asNumber(minor), patch, agent));
	})];
} });
var simple_git_api_exports = {};
__export(simple_git_api_exports, { SimpleGitApi: () => SimpleGitApi });
var SimpleGitApi;
var init_simple_git_api = __esm({ "src/lib/simple-git-api.ts"() {
	"use strict";
	init_task_callback();
	init_change_working_directory();
	init_checkout();
	init_count_objects();
	init_commit();
	init_config();
	init_first_commit();
	init_grep();
	init_hash_object();
	init_init();
	init_log();
	init_merge();
	init_push();
	init_show();
	init_status();
	init_task();
	init_version();
	init_utils();
	SimpleGitApi = class {
		constructor(_executor) {
			this._executor = _executor;
		}
		_runTask(task, then) {
			const chain = this._executor.chain();
			const promise = chain.push(task);
			if (then) taskCallback(task, promise, then);
			return Object.create(this, {
				then: { value: promise.then.bind(promise) },
				catch: { value: promise.catch.bind(promise) },
				_executor: { value: chain }
			});
		}
		add(files) {
			return this._runTask(straightThroughStringTask(["add", ...asArray(files)]), trailingFunctionArgument(arguments));
		}
		cwd(directory) {
			const next = trailingFunctionArgument(arguments);
			if (typeof directory === "string") return this._runTask(changeWorkingDirectoryTask(directory, this._executor), next);
			if (typeof directory?.path === "string") return this._runTask(changeWorkingDirectoryTask(directory.path, directory.root && this._executor || void 0), next);
			return this._runTask(configurationErrorTask("Git.cwd: workingDirectory must be supplied as a string"), next);
		}
		hashObject(path, write) {
			return this._runTask(hashObjectTask(path, write === true), trailingFunctionArgument(arguments));
		}
		init(bare) {
			return this._runTask(initTask(bare === true, this._executor.cwd, getTrailingOptions(arguments)), trailingFunctionArgument(arguments));
		}
		merge() {
			return this._runTask(mergeTask(getTrailingOptions(arguments)), trailingFunctionArgument(arguments));
		}
		mergeFromTo(remote, branch) {
			if (!(filterString(remote) && filterString(branch))) return this._runTask(configurationErrorTask(`Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings`));
			return this._runTask(mergeTask([
				remote,
				branch,
				...getTrailingOptions(arguments)
			]), trailingFunctionArgument(arguments, false));
		}
		outputHandler(handler) {
			this._executor.outputHandler = handler;
			return this;
		}
		push() {
			const task = pushTask({
				remote: filterType(arguments[0], filterString),
				branch: filterType(arguments[1], filterString)
			}, getTrailingOptions(arguments));
			return this._runTask(task, trailingFunctionArgument(arguments));
		}
		stash() {
			return this._runTask(straightThroughStringTask(["stash", ...getTrailingOptions(arguments)]), trailingFunctionArgument(arguments));
		}
		status() {
			return this._runTask(statusTask(getTrailingOptions(arguments)), trailingFunctionArgument(arguments));
		}
	};
	Object.assign(SimpleGitApi.prototype, checkout_default(), commit_default(), config_default(), count_objects_default(), first_commit_default(), grep_default(), log_default(), show_default(), version_default());
} });
var scheduler_exports = {};
__export(scheduler_exports, { Scheduler: () => Scheduler });
var createScheduledTask, Scheduler;
var init_scheduler = __esm({ "src/lib/runners/scheduler.ts"() {
	"use strict";
	init_utils();
	init_git_logger();
	createScheduledTask = /* @__PURE__ */ (() => {
		let id = 0;
		return () => {
			id++;
			const { promise, done } = (0, import_dist$2.createDeferred)();
			return {
				promise,
				done,
				id
			};
		};
	})();
	Scheduler = class {
		constructor(concurrency = 2) {
			this.concurrency = concurrency;
			this.logger = createLogger("", "scheduler");
			this.pending = [];
			this.running = [];
			this.logger(`Constructed, concurrency=%s`, concurrency);
		}
		schedule() {
			if (!this.pending.length || this.running.length >= this.concurrency) {
				this.logger(`Schedule attempt ignored, pending=%s running=%s concurrency=%s`, this.pending.length, this.running.length, this.concurrency);
				return;
			}
			const task = append(this.running, this.pending.shift());
			this.logger(`Attempting id=%s`, task.id);
			task.done(() => {
				this.logger(`Completing id=`, task.id);
				remove(this.running, task);
				this.schedule();
			});
		}
		next() {
			const { promise, id } = append(this.pending, createScheduledTask());
			this.logger(`Scheduling id=%s`, id);
			this.schedule();
			return promise;
		}
	};
} });
var apply_patch_exports = {};
__export(apply_patch_exports, { applyPatchTask: () => applyPatchTask });
function applyPatchTask(patches, customArgs) {
	return straightThroughStringTask([
		"apply",
		...customArgs,
		...patches
	]);
}
var init_apply_patch = __esm({ "src/lib/tasks/apply-patch.ts"() {
	"use strict";
	init_task();
} });
function branchDeletionSuccess(branch, hash) {
	return {
		branch,
		hash,
		success: true
	};
}
function branchDeletionFailure(branch) {
	return {
		branch,
		hash: null,
		success: false
	};
}
var BranchDeletionBatch;
var init_BranchDeleteSummary = __esm({ "src/lib/responses/BranchDeleteSummary.ts"() {
	"use strict";
	BranchDeletionBatch = class {
		constructor() {
			this.all = [];
			this.branches = {};
			this.errors = [];
		}
		get success() {
			return !this.errors.length;
		}
	};
} });
function hasBranchDeletionError(data, processExitCode) {
	return processExitCode === 1 && deleteErrorRegex.test(data);
}
var deleteSuccessRegex, deleteErrorRegex, parsers8, parseBranchDeletions;
var init_parse_branch_delete = __esm({ "src/lib/parsers/parse-branch-delete.ts"() {
	"use strict";
	init_BranchDeleteSummary();
	init_utils();
	deleteSuccessRegex = /(\S+)\s+\(\S+\s([^)]+)\)/;
	deleteErrorRegex = /^error[^']+'([^']+)'/m;
	parsers8 = [new LineParser(deleteSuccessRegex, (result, [branch, hash]) => {
		const deletion = branchDeletionSuccess(branch, hash);
		result.all.push(deletion);
		result.branches[branch] = deletion;
	}), new LineParser(deleteErrorRegex, (result, [branch]) => {
		const deletion = branchDeletionFailure(branch);
		result.errors.push(deletion);
		result.all.push(deletion);
		result.branches[branch] = deletion;
	})];
	parseBranchDeletions = (stdOut, stdErr) => {
		return parseStringResponse(new BranchDeletionBatch(), parsers8, [stdOut, stdErr]);
	};
} });
var BranchSummaryResult;
var init_BranchSummary = __esm({ "src/lib/responses/BranchSummary.ts"() {
	"use strict";
	BranchSummaryResult = class {
		constructor() {
			this.all = [];
			this.branches = {};
			this.current = "";
			this.detached = false;
		}
		push(status, detached, name, commit, label) {
			if (status === "*") {
				this.detached = detached;
				this.current = name;
			}
			this.all.push(name);
			this.branches[name] = {
				current: status === "*",
				linkedWorkTree: status === "+",
				name,
				commit,
				label
			};
		}
	};
} });
function branchStatus(input) {
	return input ? input.charAt(0) : "";
}
function parseBranchSummary(stdOut, currentOnly = false) {
	return parseStringResponse(new BranchSummaryResult(), currentOnly ? [currentBranchParser] : parsers9, stdOut);
}
var parsers9, currentBranchParser;
var init_parse_branch = __esm({ "src/lib/parsers/parse-branch.ts"() {
	"use strict";
	init_BranchSummary();
	init_utils();
	parsers9 = [new LineParser(/^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/, (result, [current, name, commit, label]) => {
		result.push(branchStatus(current), true, name, commit, label);
	}), new LineParser(/^([*+]\s)?(\S+)\s+([a-z0-9]+)\s?(.*)$/s, (result, [current, name, commit, label]) => {
		result.push(branchStatus(current), false, name, commit, label);
	})];
	currentBranchParser = new LineParser(/^(\S+)$/s, (result, [name]) => {
		result.push("*", false, name, "", "");
	});
} });
var branch_exports = {};
__export(branch_exports, {
	branchLocalTask: () => branchLocalTask,
	branchTask: () => branchTask,
	containsDeleteBranchCommand: () => containsDeleteBranchCommand,
	deleteBranchTask: () => deleteBranchTask,
	deleteBranchesTask: () => deleteBranchesTask
});
function containsDeleteBranchCommand(commands) {
	const deleteCommands = [
		"-d",
		"-D",
		"--delete"
	];
	return commands.some((command) => deleteCommands.includes(command));
}
function branchTask(customArgs) {
	const isDelete = containsDeleteBranchCommand(customArgs);
	const isCurrentOnly = customArgs.includes("--show-current");
	const commands = ["branch", ...customArgs];
	if (commands.length === 1) commands.push("-a");
	if (!commands.includes("-v")) commands.splice(1, 0, "-v");
	return {
		format: "utf-8",
		commands,
		parser(stdOut, stdErr) {
			if (isDelete) return parseBranchDeletions(stdOut, stdErr).all[0];
			return parseBranchSummary(stdOut, isCurrentOnly);
		}
	};
}
function branchLocalTask() {
	return {
		format: "utf-8",
		commands: ["branch", "-v"],
		parser(stdOut) {
			return parseBranchSummary(stdOut);
		}
	};
}
function deleteBranchesTask(branches, forceDelete = false) {
	return {
		format: "utf-8",
		commands: [
			"branch",
			"-v",
			forceDelete ? "-D" : "-d",
			...branches
		],
		parser(stdOut, stdErr) {
			return parseBranchDeletions(stdOut, stdErr);
		},
		onError({ exitCode, stdOut }, error, done, fail) {
			if (!hasBranchDeletionError(String(error), exitCode)) return fail(error);
			done(stdOut);
		}
	};
}
function deleteBranchTask(branch, forceDelete = false) {
	const task = {
		format: "utf-8",
		commands: [
			"branch",
			"-v",
			forceDelete ? "-D" : "-d",
			branch
		],
		parser(stdOut, stdErr) {
			return parseBranchDeletions(stdOut, stdErr).branches[branch];
		},
		onError({ exitCode, stdErr, stdOut }, error, _, fail) {
			if (!hasBranchDeletionError(String(error), exitCode)) return fail(error);
			throw new GitResponseError(task.parser(bufferToString(stdOut), bufferToString(stdErr)), String(error));
		}
	};
	return task;
}
var init_branch = __esm({ "src/lib/tasks/branch.ts"() {
	"use strict";
	init_git_response_error();
	init_parse_branch_delete();
	init_parse_branch();
	init_utils();
} });
function toPath(input) {
	const path = input.trim().replace(/^["']|["']$/g, "");
	return path && (0, node_path.normalize)(path);
}
var parseCheckIgnore;
var init_CheckIgnore = __esm({ "src/lib/responses/CheckIgnore.ts"() {
	"use strict";
	parseCheckIgnore = (text) => {
		return text.split(/\n/g).map(toPath).filter(Boolean);
	};
} });
var check_ignore_exports = {};
__export(check_ignore_exports, { checkIgnoreTask: () => checkIgnoreTask });
function checkIgnoreTask(paths) {
	return {
		commands: ["check-ignore", ...paths],
		format: "utf-8",
		parser: parseCheckIgnore
	};
}
var init_check_ignore = __esm({ "src/lib/tasks/check-ignore.ts"() {
	"use strict";
	init_CheckIgnore();
} });
var clone_exports = {};
__export(clone_exports, {
	cloneMirrorTask: () => cloneMirrorTask,
	cloneTask: () => cloneTask
});
function disallowedCommand(command) {
	return /^--upload-pack(=|$)/.test(command);
}
function cloneTask(repo, directory, customArgs) {
	const commands = ["clone", ...customArgs];
	filterString(repo) && commands.push(repo);
	filterString(directory) && commands.push(directory);
	if (commands.find(disallowedCommand)) return configurationErrorTask(`git.fetch: potential exploit argument blocked.`);
	return straightThroughStringTask(commands);
}
function cloneMirrorTask(repo, directory, customArgs) {
	append(customArgs, "--mirror");
	return cloneTask(repo, directory, customArgs);
}
var init_clone = __esm({ "src/lib/tasks/clone.ts"() {
	"use strict";
	init_task();
	init_utils();
} });
function parseFetchResult(stdOut, stdErr) {
	return parseStringResponse({
		raw: stdOut,
		remote: null,
		branches: [],
		tags: [],
		updated: [],
		deleted: []
	}, parsers10, [stdOut, stdErr]);
}
var parsers10;
var init_parse_fetch = __esm({ "src/lib/parsers/parse-fetch.ts"() {
	"use strict";
	init_utils();
	parsers10 = [
		new LineParser(/From (.+)$/, (result, [remote]) => {
			result.remote = remote;
		}),
		new LineParser(/\* \[new branch]\s+(\S+)\s*-> (.+)$/, (result, [name, tracking]) => {
			result.branches.push({
				name,
				tracking
			});
		}),
		new LineParser(/\* \[new tag]\s+(\S+)\s*-> (.+)$/, (result, [name, tracking]) => {
			result.tags.push({
				name,
				tracking
			});
		}),
		new LineParser(/- \[deleted]\s+\S+\s*-> (.+)$/, (result, [tracking]) => {
			result.deleted.push({ tracking });
		}),
		new LineParser(/\s*([^.]+)\.\.(\S+)\s+(\S+)\s*-> (.+)$/, (result, [from, to, name, tracking]) => {
			result.updated.push({
				name,
				tracking,
				to,
				from
			});
		})
	];
} });
var fetch_exports = {};
__export(fetch_exports, { fetchTask: () => fetchTask });
function disallowedCommand2(command) {
	return /^--upload-pack(=|$)/.test(command);
}
function fetchTask(remote, branch, customArgs) {
	const commands = ["fetch", ...customArgs];
	if (remote && branch) commands.push(remote, branch);
	if (commands.find(disallowedCommand2)) return configurationErrorTask(`git.fetch: potential exploit argument blocked.`);
	return {
		commands,
		format: "utf-8",
		parser: parseFetchResult
	};
}
var init_fetch = __esm({ "src/lib/tasks/fetch.ts"() {
	"use strict";
	init_parse_fetch();
	init_task();
} });
function parseMoveResult(stdOut) {
	return parseStringResponse({ moves: [] }, parsers11, stdOut);
}
var parsers11;
var init_parse_move = __esm({ "src/lib/parsers/parse-move.ts"() {
	"use strict";
	init_utils();
	parsers11 = [new LineParser(/^Renaming (.+) to (.+)$/, (result, [from, to]) => {
		result.moves.push({
			from,
			to
		});
	})];
} });
var move_exports = {};
__export(move_exports, { moveTask: () => moveTask });
function moveTask(from, to) {
	return {
		commands: [
			"mv",
			"-v",
			...asArray(from),
			to
		],
		format: "utf-8",
		parser: parseMoveResult
	};
}
var init_move = __esm({ "src/lib/tasks/move.ts"() {
	"use strict";
	init_parse_move();
	init_utils();
} });
var pull_exports = {};
__export(pull_exports, { pullTask: () => pullTask });
function pullTask(remote, branch, customArgs) {
	const commands = ["pull", ...customArgs];
	if (remote && branch) commands.splice(1, 0, remote, branch);
	return {
		commands,
		format: "utf-8",
		parser(stdOut, stdErr) {
			return parsePullResult(stdOut, stdErr);
		},
		onError(result, _error, _done, fail) {
			const pullError = parsePullErrorResult(bufferToString(result.stdOut), bufferToString(result.stdErr));
			if (pullError) return fail(new GitResponseError(pullError));
			fail(_error);
		}
	};
}
var init_pull = __esm({ "src/lib/tasks/pull.ts"() {
	"use strict";
	init_git_response_error();
	init_parse_pull();
	init_utils();
} });
function parseGetRemotes(text) {
	const remotes = {};
	forEach(text, ([name]) => remotes[name] = { name });
	return Object.values(remotes);
}
function parseGetRemotesVerbose(text) {
	const remotes = {};
	forEach(text, ([name, url, purpose]) => {
		if (!Object.hasOwn(remotes, name)) remotes[name] = {
			name,
			refs: {
				fetch: "",
				push: ""
			}
		};
		if (purpose && url) remotes[name].refs[purpose.replace(/[^a-z]/g, "")] = url;
	});
	return Object.values(remotes);
}
function forEach(text, handler) {
	forEachLineWithContent(text, (line) => handler(line.split(/\s+/)));
}
var init_GetRemoteSummary = __esm({ "src/lib/responses/GetRemoteSummary.ts"() {
	"use strict";
	init_utils();
} });
var remote_exports = {};
__export(remote_exports, {
	addRemoteTask: () => addRemoteTask,
	getRemotesTask: () => getRemotesTask,
	listRemotesTask: () => listRemotesTask,
	remoteTask: () => remoteTask,
	removeRemoteTask: () => removeRemoteTask
});
function addRemoteTask(remoteName, remoteRepo, customArgs) {
	return straightThroughStringTask([
		"remote",
		"add",
		...customArgs,
		remoteName,
		remoteRepo
	]);
}
function getRemotesTask(verbose) {
	const commands = ["remote"];
	if (verbose) commands.push("-v");
	return {
		commands,
		format: "utf-8",
		parser: verbose ? parseGetRemotesVerbose : parseGetRemotes
	};
}
function listRemotesTask(customArgs) {
	const commands = [...customArgs];
	if (commands[0] !== "ls-remote") commands.unshift("ls-remote");
	return straightThroughStringTask(commands);
}
function remoteTask(customArgs) {
	const commands = [...customArgs];
	if (commands[0] !== "remote") commands.unshift("remote");
	return straightThroughStringTask(commands);
}
function removeRemoteTask(remoteName) {
	return straightThroughStringTask([
		"remote",
		"remove",
		remoteName
	]);
}
var init_remote = __esm({ "src/lib/tasks/remote.ts"() {
	"use strict";
	init_GetRemoteSummary();
	init_task();
} });
var stash_list_exports = {};
__export(stash_list_exports, { stashListTask: () => stashListTask });
function stashListTask(opt = {}, customArgs) {
	const options = parseLogOptions(opt);
	const commands = [
		"stash",
		"list",
		...options.commands,
		...customArgs
	];
	const parser4 = createListLogSummaryParser(options.splitter, options.fields, logFormatFromCommand(commands));
	return validateLogFormatConfig(commands) || {
		commands,
		format: "utf-8",
		parser: parser4
	};
}
var init_stash_list = __esm({ "src/lib/tasks/stash-list.ts"() {
	"use strict";
	init_log_format();
	init_parse_list_log_summary();
	init_diff();
	init_log();
} });
var sub_module_exports = {};
__export(sub_module_exports, {
	addSubModuleTask: () => addSubModuleTask,
	initSubModuleTask: () => initSubModuleTask,
	subModuleTask: () => subModuleTask,
	updateSubModuleTask: () => updateSubModuleTask
});
function addSubModuleTask(repo, path) {
	return subModuleTask([
		"add",
		repo,
		path
	]);
}
function initSubModuleTask(customArgs) {
	return subModuleTask(["init", ...customArgs]);
}
function subModuleTask(customArgs) {
	const commands = [...customArgs];
	if (commands[0] !== "submodule") commands.unshift("submodule");
	return straightThroughStringTask(commands);
}
function updateSubModuleTask(customArgs) {
	return subModuleTask(["update", ...customArgs]);
}
var init_sub_module = __esm({ "src/lib/tasks/sub-module.ts"() {
	"use strict";
	init_task();
} });
function singleSorted(a, b) {
	const aIsNum = Number.isNaN(a);
	if (aIsNum !== Number.isNaN(b)) return aIsNum ? 1 : -1;
	return aIsNum ? sorted(a, b) : 0;
}
function sorted(a, b) {
	return a === b ? 0 : a > b ? 1 : -1;
}
function trimmed(input) {
	return input.trim();
}
function toNumber(input) {
	if (typeof input === "string") return parseInt(input.replace(/^\D+/g, ""), 10) || 0;
	return 0;
}
var TagList, parseTagList;
var init_TagList = __esm({ "src/lib/responses/TagList.ts"() {
	"use strict";
	TagList = class {
		constructor(all, latest) {
			this.all = all;
			this.latest = latest;
		}
	};
	parseTagList = function(data, customSort = false) {
		const tags = data.split("\n").map(trimmed).filter(Boolean);
		if (!customSort) tags.sort(function(tagA, tagB) {
			const partsA = tagA.split(".");
			const partsB = tagB.split(".");
			if (partsA.length === 1 || partsB.length === 1) return singleSorted(toNumber(partsA[0]), toNumber(partsB[0]));
			for (let i = 0, l = Math.max(partsA.length, partsB.length); i < l; i++) {
				const diff = sorted(toNumber(partsA[i]), toNumber(partsB[i]));
				if (diff) return diff;
			}
			return 0;
		});
		const latest = customSort ? tags[0] : [...tags].reverse().find((tag) => tag.indexOf(".") >= 0);
		return new TagList(tags, latest);
	};
} });
var tag_exports = {};
__export(tag_exports, {
	addAnnotatedTagTask: () => addAnnotatedTagTask,
	addTagTask: () => addTagTask,
	tagListTask: () => tagListTask
});
function tagListTask(customArgs = []) {
	const hasCustomSort = customArgs.some((option) => /^--sort=/.test(option));
	return {
		format: "utf-8",
		commands: [
			"tag",
			"-l",
			...customArgs
		],
		parser(text) {
			return parseTagList(text, hasCustomSort);
		}
	};
}
function addTagTask(name) {
	return {
		format: "utf-8",
		commands: ["tag", name],
		parser() {
			return { name };
		}
	};
}
function addAnnotatedTagTask(name, tagMessage) {
	return {
		format: "utf-8",
		commands: [
			"tag",
			"-a",
			"-m",
			tagMessage,
			name
		],
		parser() {
			return { name };
		}
	};
}
var init_tag = __esm({ "src/lib/tasks/tag.ts"() {
	"use strict";
	init_TagList();
} });
var require_git = __commonJS({ "src/git.js"(exports, module) {
	"use strict";
	var { GitExecutor: GitExecutor2 } = (init_git_executor(), __toCommonJS(git_executor_exports));
	var { SimpleGitApi: SimpleGitApi2 } = (init_simple_git_api(), __toCommonJS(simple_git_api_exports));
	var { Scheduler: Scheduler2 } = (init_scheduler(), __toCommonJS(scheduler_exports));
	var { adhocExecTask: adhocExecTask2, configurationErrorTask: configurationErrorTask2 } = (init_task(), __toCommonJS(task_exports));
	var { asArray: asArray2, filterArray: filterArray2, filterPrimitives: filterPrimitives2, filterString: filterString2, filterStringOrStringArray: filterStringOrStringArray2, filterType: filterType2, getTrailingOptions: getTrailingOptions2, trailingFunctionArgument: trailingFunctionArgument2, trailingOptionsArgument: trailingOptionsArgument2 } = (init_utils(), __toCommonJS(utils_exports));
	var { applyPatchTask: applyPatchTask2 } = (init_apply_patch(), __toCommonJS(apply_patch_exports));
	var { branchTask: branchTask2, branchLocalTask: branchLocalTask2, deleteBranchesTask: deleteBranchesTask2, deleteBranchTask: deleteBranchTask2 } = (init_branch(), __toCommonJS(branch_exports));
	var { checkIgnoreTask: checkIgnoreTask2 } = (init_check_ignore(), __toCommonJS(check_ignore_exports));
	var { checkIsRepoTask: checkIsRepoTask2 } = (init_check_is_repo(), __toCommonJS(check_is_repo_exports));
	var { cloneTask: cloneTask2, cloneMirrorTask: cloneMirrorTask2 } = (init_clone(), __toCommonJS(clone_exports));
	var { cleanWithOptionsTask: cleanWithOptionsTask2, isCleanOptionsArray: isCleanOptionsArray2 } = (init_clean(), __toCommonJS(clean_exports));
	var { diffSummaryTask: diffSummaryTask2 } = (init_diff(), __toCommonJS(diff_exports));
	var { fetchTask: fetchTask2 } = (init_fetch(), __toCommonJS(fetch_exports));
	var { moveTask: moveTask2 } = (init_move(), __toCommonJS(move_exports));
	var { pullTask: pullTask2 } = (init_pull(), __toCommonJS(pull_exports));
	var { pushTagsTask: pushTagsTask2 } = (init_push(), __toCommonJS(push_exports));
	var { addRemoteTask: addRemoteTask2, getRemotesTask: getRemotesTask2, listRemotesTask: listRemotesTask2, remoteTask: remoteTask2, removeRemoteTask: removeRemoteTask2 } = (init_remote(), __toCommonJS(remote_exports));
	var { getResetMode: getResetMode2, resetTask: resetTask2 } = (init_reset(), __toCommonJS(reset_exports));
	var { stashListTask: stashListTask2 } = (init_stash_list(), __toCommonJS(stash_list_exports));
	var { addSubModuleTask: addSubModuleTask2, initSubModuleTask: initSubModuleTask2, subModuleTask: subModuleTask2, updateSubModuleTask: updateSubModuleTask2 } = (init_sub_module(), __toCommonJS(sub_module_exports));
	var { addAnnotatedTagTask: addAnnotatedTagTask2, addTagTask: addTagTask2, tagListTask: tagListTask2 } = (init_tag(), __toCommonJS(tag_exports));
	var { straightThroughBufferTask: straightThroughBufferTask2, straightThroughStringTask: straightThroughStringTask2 } = (init_task(), __toCommonJS(task_exports));
	function Git2(options, plugins) {
		this._plugins = plugins;
		this._executor = new GitExecutor2(options.baseDir, new Scheduler2(options.maxConcurrentProcesses), plugins);
		this._trimmed = options.trimmed;
	}
	(Git2.prototype = Object.create(SimpleGitApi2.prototype)).constructor = Git2;
	Git2.prototype.customBinary = function(command) {
		this._plugins.reconfigure("binary", command);
		return this;
	};
	Git2.prototype.env = function(name, value) {
		if (arguments.length === 1 && typeof name === "object") this._executor.env = name;
		else (this._executor.env = this._executor.env || {})[name] = value;
		return this;
	};
	Git2.prototype.stashList = function(options) {
		return this._runTask(stashListTask2(trailingOptionsArgument2(arguments) || {}, filterArray2(options) && options || []), trailingFunctionArgument2(arguments));
	};
	function createCloneTask(api, task, repoPath, localPath) {
		if (typeof repoPath !== "string") return configurationErrorTask2(`git.${api}() requires a string 'repoPath'`);
		return task(repoPath, filterType2(localPath, filterString2), getTrailingOptions2(arguments));
	}
	Git2.prototype.clone = function() {
		return this._runTask(createCloneTask("clone", cloneTask2, ...arguments), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.mirror = function() {
		return this._runTask(createCloneTask("mirror", cloneMirrorTask2, ...arguments), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.mv = function(from, to) {
		return this._runTask(moveTask2(from, to), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.checkoutLatestTag = function(then) {
		var git = this;
		return this.pull(function() {
			git.tags(function(err, tags) {
				git.checkout(tags.latest, then);
			});
		});
	};
	Git2.prototype.pull = function(remote, branch, options, then) {
		return this._runTask(pullTask2(filterType2(remote, filterString2), filterType2(branch, filterString2), getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.fetch = function(remote, branch) {
		return this._runTask(fetchTask2(filterType2(remote, filterString2), filterType2(branch, filterString2), getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.silent = function(silence) {
		return this._runTask(adhocExecTask2(() => console.warn("simple-git deprecation notice: git.silent: logging should be configured using the `debug` library / `DEBUG` environment variable, this method will be removed.")));
	};
	Git2.prototype.tags = function(options, then) {
		return this._runTask(tagListTask2(getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.rebase = function() {
		return this._runTask(straightThroughStringTask2(["rebase", ...getTrailingOptions2(arguments)]), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.reset = function(mode) {
		return this._runTask(resetTask2(getResetMode2(mode), getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.revert = function(commit) {
		const next = trailingFunctionArgument2(arguments);
		if (typeof commit !== "string") return this._runTask(configurationErrorTask2("Commit must be a string"), next);
		return this._runTask(straightThroughStringTask2([
			"revert",
			...getTrailingOptions2(arguments, 0, true),
			commit
		]), next);
	};
	Git2.prototype.addTag = function(name) {
		const task = typeof name === "string" ? addTagTask2(name) : configurationErrorTask2("Git.addTag requires a tag name");
		return this._runTask(task, trailingFunctionArgument2(arguments));
	};
	Git2.prototype.addAnnotatedTag = function(tagName, tagMessage) {
		return this._runTask(addAnnotatedTagTask2(tagName, tagMessage), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.deleteLocalBranch = function(branchName, forceDelete, then) {
		return this._runTask(deleteBranchTask2(branchName, typeof forceDelete === "boolean" ? forceDelete : false), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.deleteLocalBranches = function(branchNames, forceDelete, then) {
		return this._runTask(deleteBranchesTask2(branchNames, typeof forceDelete === "boolean" ? forceDelete : false), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.branch = function(options, then) {
		return this._runTask(branchTask2(getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.branchLocal = function(then) {
		return this._runTask(branchLocalTask2(), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.raw = function(commands) {
		const createRestCommands = !Array.isArray(commands);
		const command = [].slice.call(createRestCommands ? arguments : commands, 0);
		for (let i = 0; i < command.length && createRestCommands; i++) if (!filterPrimitives2(command[i])) {
			command.splice(i, command.length - i);
			break;
		}
		command.push(...getTrailingOptions2(arguments, 0, true));
		var next = trailingFunctionArgument2(arguments);
		if (!command.length) return this._runTask(configurationErrorTask2("Raw: must supply one or more command to execute"), next);
		return this._runTask(straightThroughStringTask2(command, this._trimmed), next);
	};
	Git2.prototype.submoduleAdd = function(repo, path, then) {
		return this._runTask(addSubModuleTask2(repo, path), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.submoduleUpdate = function(args, then) {
		return this._runTask(updateSubModuleTask2(getTrailingOptions2(arguments, true)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.submoduleInit = function(args, then) {
		return this._runTask(initSubModuleTask2(getTrailingOptions2(arguments, true)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.subModule = function(options, then) {
		return this._runTask(subModuleTask2(getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.listRemote = function() {
		return this._runTask(listRemotesTask2(getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.addRemote = function(remoteName, remoteRepo, then) {
		return this._runTask(addRemoteTask2(remoteName, remoteRepo, getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.removeRemote = function(remoteName, then) {
		return this._runTask(removeRemoteTask2(remoteName), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.getRemotes = function(verbose, then) {
		return this._runTask(getRemotesTask2(verbose === true), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.remote = function(options, then) {
		return this._runTask(remoteTask2(getTrailingOptions2(arguments)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.tag = function(options, then) {
		const command = getTrailingOptions2(arguments);
		if (command[0] !== "tag") command.unshift("tag");
		return this._runTask(straightThroughStringTask2(command), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.updateServerInfo = function(then) {
		return this._runTask(straightThroughStringTask2(["update-server-info"]), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.pushTags = function(remote, then) {
		const task = pushTagsTask2({ remote: filterType2(remote, filterString2) }, getTrailingOptions2(arguments));
		return this._runTask(task, trailingFunctionArgument2(arguments));
	};
	Git2.prototype.rm = function(files) {
		return this._runTask(straightThroughStringTask2([
			"rm",
			"-f",
			...asArray2(files)
		]), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.rmKeepLocal = function(files) {
		return this._runTask(straightThroughStringTask2([
			"rm",
			"--cached",
			...asArray2(files)
		]), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.catFile = function(options, then) {
		return this._catFile("utf-8", arguments);
	};
	Git2.prototype.binaryCatFile = function() {
		return this._catFile("buffer", arguments);
	};
	Git2.prototype._catFile = function(format, args) {
		var handler = trailingFunctionArgument2(args);
		var command = ["cat-file"];
		var options = args[0];
		if (typeof options === "string") return this._runTask(configurationErrorTask2("Git.catFile: options must be supplied as an array of strings"), handler);
		if (Array.isArray(options)) command.push.apply(command, options);
		const task = format === "buffer" ? straightThroughBufferTask2(command) : straightThroughStringTask2(command);
		return this._runTask(task, handler);
	};
	Git2.prototype.diff = function(options, then) {
		const task = filterString2(options) ? configurationErrorTask2("git.diff: supplying options as a single string is no longer supported, switch to an array of strings") : straightThroughStringTask2(["diff", ...getTrailingOptions2(arguments)]);
		return this._runTask(task, trailingFunctionArgument2(arguments));
	};
	Git2.prototype.diffSummary = function() {
		return this._runTask(diffSummaryTask2(getTrailingOptions2(arguments, 1)), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.applyPatch = function(patches) {
		const task = !filterStringOrStringArray2(patches) ? configurationErrorTask2(`git.applyPatch requires one or more string patches as the first argument`) : applyPatchTask2(asArray2(patches), getTrailingOptions2([].slice.call(arguments, 1)));
		return this._runTask(task, trailingFunctionArgument2(arguments));
	};
	Git2.prototype.revparse = function() {
		const commands = ["rev-parse", ...getTrailingOptions2(arguments, true)];
		return this._runTask(straightThroughStringTask2(commands, true), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.clean = function(mode, options, then) {
		const usingCleanOptionsArray = isCleanOptionsArray2(mode);
		const cleanMode = usingCleanOptionsArray && mode.join("") || filterType2(mode, filterString2) || "";
		const customArgs = getTrailingOptions2([].slice.call(arguments, usingCleanOptionsArray ? 1 : 0));
		return this._runTask(cleanWithOptionsTask2(cleanMode, customArgs), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.exec = function(then) {
		return this._runTask({
			commands: [],
			format: "utf-8",
			parser() {
				if (typeof then === "function") then();
			}
		});
	};
	Git2.prototype.clearQueue = function() {
		return this._runTask(adhocExecTask2(() => console.warn("simple-git deprecation notice: clearQueue() is deprecated and will be removed, switch to using the abortPlugin instead.")));
	};
	Git2.prototype.checkIgnore = function(pathnames, then) {
		return this._runTask(checkIgnoreTask2(asArray2(filterType2(pathnames, filterStringOrStringArray2, []))), trailingFunctionArgument2(arguments));
	};
	Git2.prototype.checkIsRepo = function(checkType, then) {
		return this._runTask(checkIsRepoTask2(filterType2(checkType, filterString2)), trailingFunctionArgument2(arguments));
	};
	module.exports = Git2;
} });
init_pathspec();
init_git_error();
var GitConstructError = class extends GitError {
	constructor(config, message) {
		super(void 0, message);
		this.config = config;
	}
};
init_git_error();
init_git_error();
var GitPluginError = class extends GitError {
	constructor(task, plugin, message) {
		super(task, message);
		this.task = task;
		this.plugin = plugin;
		Object.setPrototypeOf(this, new.target.prototype);
	}
};
init_git_response_error();
init_task_configuration_error();
init_check_is_repo();
init_clean();
init_config();
init_diff_name_status();
init_grep();
init_reset();
function abortPlugin(signal) {
	if (!signal) return;
	return [{
		type: "spawn.before",
		action(_data, context) {
			if (signal.aborted) context.kill(new GitPluginError(void 0, "abort", "Abort already signaled"));
		}
	}, {
		type: "spawn.after",
		action(_data, context) {
			function kill() {
				context.kill(new GitPluginError(void 0, "abort", "Abort signal received"));
			}
			signal.addEventListener("abort", kill);
			context.spawned.on("close", () => signal.removeEventListener("abort", kill));
		}
	}];
}
function isConfigSwitch(arg) {
	return typeof arg === "string" && arg.trim().toLowerCase() === "-c";
}
function isCloneSwitch(char, arg) {
	if (typeof arg !== "string" || !arg.includes(char)) return false;
	const token = arg.replace(/\0g/, "").replace(/^(--no)?-{1,2}/, "");
	return /^[\dlsqvnobucj]+\b/.test(token);
}
function preventProtocolOverride(arg, next) {
	if (!isConfigSwitch(arg)) return;
	if (!/^\s*protocol(.[a-z]+)?.allow/.test(next)) return;
	throw new GitPluginError(void 0, "unsafe", "Configuring protocol.allow is not permitted without enabling allowUnsafeExtProtocol");
}
function preventUploadPack(arg, method) {
	if (/^\s*--(upload|receive)-pack/.test(arg)) throw new GitPluginError(void 0, "unsafe", `Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack`);
	if (method === "clone" && isCloneSwitch("u", arg)) throw new GitPluginError(void 0, "unsafe", `Use of clone with option -u is not permitted without enabling allowUnsafePack`);
	if (method === "push" && /^\s*--exec\b/.test(arg)) throw new GitPluginError(void 0, "unsafe", `Use of push with option --exec is not permitted without enabling allowUnsafePack`);
}
function blockUnsafeOperationsPlugin({ allowUnsafeProtocolOverride = false, allowUnsafePack = false } = {}) {
	return {
		type: "spawn.args",
		action(args, context) {
			args.forEach((current, index) => {
				const next = index < args.length ? args[index + 1] : "";
				allowUnsafeProtocolOverride || preventProtocolOverride(current, next);
				allowUnsafePack || preventUploadPack(current, context.method);
			});
			return args;
		}
	};
}
init_utils();
function commandConfigPrefixingPlugin(configuration) {
	const prefix = prefixedArray(configuration, "-c");
	return {
		type: "spawn.args",
		action(data) {
			return [...prefix, ...data];
		}
	};
}
init_utils();
var never = (0, import_dist$2.deferred)().promise;
function completionDetectionPlugin({ onClose = true, onExit = 50 } = {}) {
	function createEvents() {
		let exitCode = -1;
		const events = {
			close: (0, import_dist$2.deferred)(),
			closeTimeout: (0, import_dist$2.deferred)(),
			exit: (0, import_dist$2.deferred)(),
			exitTimeout: (0, import_dist$2.deferred)()
		};
		const result = Promise.race([onClose === false ? never : events.closeTimeout.promise, onExit === false ? never : events.exitTimeout.promise]);
		configureTimeout(onClose, events.close, events.closeTimeout);
		configureTimeout(onExit, events.exit, events.exitTimeout);
		return {
			close(code) {
				exitCode = code;
				events.close.done();
			},
			exit(code) {
				exitCode = code;
				events.exit.done();
			},
			get exitCode() {
				return exitCode;
			},
			result
		};
	}
	function configureTimeout(flag, event, timeout) {
		if (flag === false) return;
		(flag === true ? event.promise : event.promise.then(() => delay(flag))).then(timeout.done);
	}
	return {
		type: "spawn.after",
		async action(_data, { spawned, close }) {
			const events = createEvents();
			let deferClose = true;
			let quickClose = () => void (deferClose = false);
			spawned.stdout?.on("data", quickClose);
			spawned.stderr?.on("data", quickClose);
			spawned.on("error", quickClose);
			spawned.on("close", (code) => events.close(code));
			spawned.on("exit", (code) => events.exit(code));
			try {
				await events.result;
				if (deferClose) await delay(50);
				close(events.exitCode);
			} catch (err) {
				close(events.exitCode, err);
			}
		}
	};
}
init_utils();
var WRONG_NUMBER_ERR = `Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings`;
var WRONG_CHARS_ERR = `Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option`;
function isBadArgument(arg) {
	return !arg || !/^([a-z]:)?([a-z0-9/.\\_~-]+)$/i.test(arg);
}
function toBinaryConfig(input, allowUnsafe) {
	if (input.length < 1 || input.length > 2) throw new GitPluginError(void 0, "binary", WRONG_NUMBER_ERR);
	if (input.some(isBadArgument)) if (allowUnsafe) console.warn(WRONG_CHARS_ERR);
	else throw new GitPluginError(void 0, "binary", WRONG_CHARS_ERR);
	const [binary, prefix] = input;
	return {
		binary,
		prefix
	};
}
function customBinaryPlugin(plugins, input = ["git"], allowUnsafe = false) {
	let config = toBinaryConfig(asArray(input), allowUnsafe);
	plugins.on("binary", (input2) => {
		config = toBinaryConfig(asArray(input2), allowUnsafe);
	});
	plugins.append("spawn.binary", () => {
		return config.binary;
	});
	plugins.append("spawn.args", (data) => {
		return config.prefix ? [config.prefix, ...data] : data;
	});
}
init_git_error();
function isTaskError(result) {
	return !!(result.exitCode && result.stdErr.length);
}
function getErrorMessage(result) {
	return Buffer.concat([...result.stdOut, ...result.stdErr]);
}
function errorDetectionHandler(overwrite = false, isError = isTaskError, errorMessage = getErrorMessage) {
	return (error, result) => {
		if (!overwrite && error || !isError(result)) return error;
		return errorMessage(result);
	};
}
function errorDetectionPlugin(config) {
	return {
		type: "task.error",
		action(data, context) {
			const error = config(data.error, {
				stdErr: context.stdErr,
				stdOut: context.stdOut,
				exitCode: context.exitCode
			});
			if (Buffer.isBuffer(error)) return { error: new GitError(void 0, error.toString("utf-8")) };
			return { error };
		}
	};
}
init_utils();
var PluginStore = class {
	constructor() {
		this.plugins = /* @__PURE__ */ new Set();
		this.events = new node_events.EventEmitter();
	}
	on(type, listener) {
		this.events.on(type, listener);
	}
	reconfigure(type, data) {
		this.events.emit(type, data);
	}
	append(type, action) {
		const plugin = append(this.plugins, {
			type,
			action
		});
		return () => this.plugins.delete(plugin);
	}
	add(plugin) {
		const plugins = [];
		asArray(plugin).forEach((plugin2) => plugin2 && this.plugins.add(append(plugins, plugin2)));
		return () => {
			plugins.forEach((plugin2) => this.plugins.delete(plugin2));
		};
	}
	exec(type, data, context) {
		let output = data;
		const contextual = Object.freeze(Object.create(context));
		for (const plugin of this.plugins) if (plugin.type === type) output = plugin.action(output, contextual);
		return output;
	}
};
init_utils();
function progressMonitorPlugin(progress) {
	const progressCommand = "--progress";
	const progressMethods = [
		"checkout",
		"clone",
		"fetch",
		"pull",
		"push"
	];
	return [{
		type: "spawn.args",
		action(args, context) {
			if (!progressMethods.includes(context.method)) return args;
			return including(args, progressCommand);
		}
	}, {
		type: "spawn.after",
		action(_data, context) {
			if (!context.commands.includes(progressCommand)) return;
			context.spawned.stderr?.on("data", (chunk) => {
				const message = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(chunk.toString("utf8"));
				if (!message) return;
				progress({
					method: context.method,
					stage: progressEventStage(message[1]),
					progress: asNumber(message[2]),
					processed: asNumber(message[3]),
					total: asNumber(message[4])
				});
			});
		}
	}];
}
function progressEventStage(input) {
	return String(input.toLowerCase().split(" ", 1)) || "unknown";
}
init_utils();
function spawnOptionsPlugin(spawnOptions) {
	const options = pick(spawnOptions, ["uid", "gid"]);
	return {
		type: "spawn.options",
		action(data) {
			return {
				...options,
				...data
			};
		}
	};
}
function timeoutPlugin({ block, stdErr = true, stdOut = true }) {
	if (block > 0) return {
		type: "spawn.after",
		action(_data, context) {
			let timeout;
			function wait() {
				timeout && clearTimeout(timeout);
				timeout = setTimeout(kill, block);
			}
			function stop() {
				context.spawned.stdout?.off("data", wait);
				context.spawned.stderr?.off("data", wait);
				context.spawned.off("exit", stop);
				context.spawned.off("close", stop);
				timeout && clearTimeout(timeout);
			}
			function kill() {
				stop();
				context.kill(new GitPluginError(void 0, "timeout", `block timeout reached`));
			}
			stdOut && context.spawned.stdout?.on("data", wait);
			stdErr && context.spawned.stderr?.on("data", wait);
			context.spawned.on("exit", stop);
			context.spawned.on("close", stop);
			wait();
		}
	};
}
init_pathspec();
function suffixPathsPlugin() {
	return {
		type: "spawn.args",
		action(data) {
			const prefix = [];
			let suffix;
			function append2(args) {
				(suffix = suffix || []).push(...args);
			}
			for (let i = 0; i < data.length; i++) {
				const param = data[i];
				if (isPathSpec(param)) {
					append2(toPaths(param));
					continue;
				}
				if (param === "--") {
					append2(data.slice(i + 1).flatMap((item) => isPathSpec(item) && toPaths(item) || item));
					break;
				}
				prefix.push(param);
			}
			return !suffix ? prefix : [
				...prefix,
				"--",
				...suffix.map(String)
			];
		}
	};
}
init_utils();
var Git = require_git();
function gitInstanceFactory(baseDir, options) {
	const plugins = new PluginStore();
	const config = createInstanceConfig(baseDir && (typeof baseDir === "string" ? { baseDir } : baseDir) || {}, options);
	if (!folderExists(config.baseDir)) throw new GitConstructError(config, `Cannot use simple-git on a directory that does not exist`);
	if (Array.isArray(config.config)) plugins.add(commandConfigPrefixingPlugin(config.config));
	plugins.add(blockUnsafeOperationsPlugin(config.unsafe));
	plugins.add(suffixPathsPlugin());
	plugins.add(completionDetectionPlugin(config.completion));
	config.abort && plugins.add(abortPlugin(config.abort));
	config.progress && plugins.add(progressMonitorPlugin(config.progress));
	config.timeout && plugins.add(timeoutPlugin(config.timeout));
	config.spawnOptions && plugins.add(spawnOptionsPlugin(config.spawnOptions));
	plugins.add(errorDetectionPlugin(errorDetectionHandler(true)));
	config.errors && plugins.add(errorDetectionPlugin(config.errors));
	customBinaryPlugin(plugins, config.binary, config.unsafe?.allowUnsafeCustomBinary);
	return new Git(config, plugins);
}
init_git_response_error();
var simpleGit = gitInstanceFactory;

//#endregion
//#region ../../node_modules/slugify/slugify.js
var require_slugify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(name, root, factory) {
		if (typeof exports === "object") {
			module.exports = factory();
			module.exports["default"] = factory();
		} else if (typeof define === "function" && define.amd) define(factory);
		else root[name] = factory();
	})("slugify", exports, function() {
		var charMap = JSON.parse("{\"$\":\"dollar\",\"%\":\"percent\",\"&\":\"and\",\"<\":\"less\",\">\":\"greater\",\"|\":\"or\",\"¢\":\"cent\",\"£\":\"pound\",\"¤\":\"currency\",\"¥\":\"yen\",\"©\":\"(c)\",\"ª\":\"a\",\"®\":\"(r)\",\"º\":\"o\",\"À\":\"A\",\"Á\":\"A\",\"Â\":\"A\",\"Ã\":\"A\",\"Ä\":\"A\",\"Å\":\"A\",\"Æ\":\"AE\",\"Ç\":\"C\",\"È\":\"E\",\"É\":\"E\",\"Ê\":\"E\",\"Ë\":\"E\",\"Ì\":\"I\",\"Í\":\"I\",\"Î\":\"I\",\"Ï\":\"I\",\"Ð\":\"D\",\"Ñ\":\"N\",\"Ò\":\"O\",\"Ó\":\"O\",\"Ô\":\"O\",\"Õ\":\"O\",\"Ö\":\"O\",\"Ø\":\"O\",\"Ù\":\"U\",\"Ú\":\"U\",\"Û\":\"U\",\"Ü\":\"U\",\"Ý\":\"Y\",\"Þ\":\"TH\",\"ß\":\"ss\",\"à\":\"a\",\"á\":\"a\",\"â\":\"a\",\"ã\":\"a\",\"ä\":\"a\",\"å\":\"a\",\"æ\":\"ae\",\"ç\":\"c\",\"è\":\"e\",\"é\":\"e\",\"ê\":\"e\",\"ë\":\"e\",\"ì\":\"i\",\"í\":\"i\",\"î\":\"i\",\"ï\":\"i\",\"ð\":\"d\",\"ñ\":\"n\",\"ò\":\"o\",\"ó\":\"o\",\"ô\":\"o\",\"õ\":\"o\",\"ö\":\"o\",\"ø\":\"o\",\"ù\":\"u\",\"ú\":\"u\",\"û\":\"u\",\"ü\":\"u\",\"ý\":\"y\",\"þ\":\"th\",\"ÿ\":\"y\",\"Ā\":\"A\",\"ā\":\"a\",\"Ă\":\"A\",\"ă\":\"a\",\"Ą\":\"A\",\"ą\":\"a\",\"Ć\":\"C\",\"ć\":\"c\",\"Č\":\"C\",\"č\":\"c\",\"Ď\":\"D\",\"ď\":\"d\",\"Đ\":\"DJ\",\"đ\":\"dj\",\"Ē\":\"E\",\"ē\":\"e\",\"Ė\":\"E\",\"ė\":\"e\",\"Ę\":\"e\",\"ę\":\"e\",\"Ě\":\"E\",\"ě\":\"e\",\"Ğ\":\"G\",\"ğ\":\"g\",\"Ģ\":\"G\",\"ģ\":\"g\",\"Ĩ\":\"I\",\"ĩ\":\"i\",\"Ī\":\"i\",\"ī\":\"i\",\"Į\":\"I\",\"į\":\"i\",\"İ\":\"I\",\"ı\":\"i\",\"Ķ\":\"k\",\"ķ\":\"k\",\"Ļ\":\"L\",\"ļ\":\"l\",\"Ľ\":\"L\",\"ľ\":\"l\",\"Ł\":\"L\",\"ł\":\"l\",\"Ń\":\"N\",\"ń\":\"n\",\"Ņ\":\"N\",\"ņ\":\"n\",\"Ň\":\"N\",\"ň\":\"n\",\"Ō\":\"O\",\"ō\":\"o\",\"Ő\":\"O\",\"ő\":\"o\",\"Œ\":\"OE\",\"œ\":\"oe\",\"Ŕ\":\"R\",\"ŕ\":\"r\",\"Ř\":\"R\",\"ř\":\"r\",\"Ś\":\"S\",\"ś\":\"s\",\"Ş\":\"S\",\"ş\":\"s\",\"Š\":\"S\",\"š\":\"s\",\"Ţ\":\"T\",\"ţ\":\"t\",\"Ť\":\"T\",\"ť\":\"t\",\"Ũ\":\"U\",\"ũ\":\"u\",\"Ū\":\"u\",\"ū\":\"u\",\"Ů\":\"U\",\"ů\":\"u\",\"Ű\":\"U\",\"ű\":\"u\",\"Ų\":\"U\",\"ų\":\"u\",\"Ŵ\":\"W\",\"ŵ\":\"w\",\"Ŷ\":\"Y\",\"ŷ\":\"y\",\"Ÿ\":\"Y\",\"Ź\":\"Z\",\"ź\":\"z\",\"Ż\":\"Z\",\"ż\":\"z\",\"Ž\":\"Z\",\"ž\":\"z\",\"Ə\":\"E\",\"ƒ\":\"f\",\"Ơ\":\"O\",\"ơ\":\"o\",\"Ư\":\"U\",\"ư\":\"u\",\"ǈ\":\"LJ\",\"ǉ\":\"lj\",\"ǋ\":\"NJ\",\"ǌ\":\"nj\",\"Ș\":\"S\",\"ș\":\"s\",\"Ț\":\"T\",\"ț\":\"t\",\"ə\":\"e\",\"˚\":\"o\",\"Ά\":\"A\",\"Έ\":\"E\",\"Ή\":\"H\",\"Ί\":\"I\",\"Ό\":\"O\",\"Ύ\":\"Y\",\"Ώ\":\"W\",\"ΐ\":\"i\",\"Α\":\"A\",\"Β\":\"B\",\"Γ\":\"G\",\"Δ\":\"D\",\"Ε\":\"E\",\"Ζ\":\"Z\",\"Η\":\"H\",\"Θ\":\"8\",\"Ι\":\"I\",\"Κ\":\"K\",\"Λ\":\"L\",\"Μ\":\"M\",\"Ν\":\"N\",\"Ξ\":\"3\",\"Ο\":\"O\",\"Π\":\"P\",\"Ρ\":\"R\",\"Σ\":\"S\",\"Τ\":\"T\",\"Υ\":\"Y\",\"Φ\":\"F\",\"Χ\":\"X\",\"Ψ\":\"PS\",\"Ω\":\"W\",\"Ϊ\":\"I\",\"Ϋ\":\"Y\",\"ά\":\"a\",\"έ\":\"e\",\"ή\":\"h\",\"ί\":\"i\",\"ΰ\":\"y\",\"α\":\"a\",\"β\":\"b\",\"γ\":\"g\",\"δ\":\"d\",\"ε\":\"e\",\"ζ\":\"z\",\"η\":\"h\",\"θ\":\"8\",\"ι\":\"i\",\"κ\":\"k\",\"λ\":\"l\",\"μ\":\"m\",\"ν\":\"n\",\"ξ\":\"3\",\"ο\":\"o\",\"π\":\"p\",\"ρ\":\"r\",\"ς\":\"s\",\"σ\":\"s\",\"τ\":\"t\",\"υ\":\"y\",\"φ\":\"f\",\"χ\":\"x\",\"ψ\":\"ps\",\"ω\":\"w\",\"ϊ\":\"i\",\"ϋ\":\"y\",\"ό\":\"o\",\"ύ\":\"y\",\"ώ\":\"w\",\"Ё\":\"Yo\",\"Ђ\":\"DJ\",\"Є\":\"Ye\",\"І\":\"I\",\"Ї\":\"Yi\",\"Ј\":\"J\",\"Љ\":\"LJ\",\"Њ\":\"NJ\",\"Ћ\":\"C\",\"Џ\":\"DZ\",\"А\":\"A\",\"Б\":\"B\",\"В\":\"V\",\"Г\":\"G\",\"Д\":\"D\",\"Е\":\"E\",\"Ж\":\"Zh\",\"З\":\"Z\",\"И\":\"I\",\"Й\":\"J\",\"К\":\"K\",\"Л\":\"L\",\"М\":\"M\",\"Н\":\"N\",\"О\":\"O\",\"П\":\"P\",\"Р\":\"R\",\"С\":\"S\",\"Т\":\"T\",\"У\":\"U\",\"Ф\":\"F\",\"Х\":\"H\",\"Ц\":\"C\",\"Ч\":\"Ch\",\"Ш\":\"Sh\",\"Щ\":\"Sh\",\"Ъ\":\"U\",\"Ы\":\"Y\",\"Ь\":\"\",\"Э\":\"E\",\"Ю\":\"Yu\",\"Я\":\"Ya\",\"а\":\"a\",\"б\":\"b\",\"в\":\"v\",\"г\":\"g\",\"д\":\"d\",\"е\":\"e\",\"ж\":\"zh\",\"з\":\"z\",\"и\":\"i\",\"й\":\"j\",\"к\":\"k\",\"л\":\"l\",\"м\":\"m\",\"н\":\"n\",\"о\":\"o\",\"п\":\"p\",\"р\":\"r\",\"с\":\"s\",\"т\":\"t\",\"у\":\"u\",\"ф\":\"f\",\"х\":\"h\",\"ц\":\"c\",\"ч\":\"ch\",\"ш\":\"sh\",\"щ\":\"sh\",\"ъ\":\"u\",\"ы\":\"y\",\"ь\":\"\",\"э\":\"e\",\"ю\":\"yu\",\"я\":\"ya\",\"ё\":\"yo\",\"ђ\":\"dj\",\"є\":\"ye\",\"і\":\"i\",\"ї\":\"yi\",\"ј\":\"j\",\"љ\":\"lj\",\"њ\":\"nj\",\"ћ\":\"c\",\"ѝ\":\"u\",\"џ\":\"dz\",\"Ґ\":\"G\",\"ґ\":\"g\",\"Ғ\":\"GH\",\"ғ\":\"gh\",\"Қ\":\"KH\",\"қ\":\"kh\",\"Ң\":\"NG\",\"ң\":\"ng\",\"Ү\":\"UE\",\"ү\":\"ue\",\"Ұ\":\"U\",\"ұ\":\"u\",\"Һ\":\"H\",\"һ\":\"h\",\"Ә\":\"AE\",\"ә\":\"ae\",\"Ө\":\"OE\",\"ө\":\"oe\",\"Ա\":\"A\",\"Բ\":\"B\",\"Գ\":\"G\",\"Դ\":\"D\",\"Ե\":\"E\",\"Զ\":\"Z\",\"Է\":\"E'\",\"Ը\":\"Y'\",\"Թ\":\"T'\",\"Ժ\":\"JH\",\"Ի\":\"I\",\"Լ\":\"L\",\"Խ\":\"X\",\"Ծ\":\"C'\",\"Կ\":\"K\",\"Հ\":\"H\",\"Ձ\":\"D'\",\"Ղ\":\"GH\",\"Ճ\":\"TW\",\"Մ\":\"M\",\"Յ\":\"Y\",\"Ն\":\"N\",\"Շ\":\"SH\",\"Չ\":\"CH\",\"Պ\":\"P\",\"Ջ\":\"J\",\"Ռ\":\"R'\",\"Ս\":\"S\",\"Վ\":\"V\",\"Տ\":\"T\",\"Ր\":\"R\",\"Ց\":\"C\",\"Փ\":\"P'\",\"Ք\":\"Q'\",\"Օ\":\"O''\",\"Ֆ\":\"F\",\"և\":\"EV\",\"ء\":\"a\",\"آ\":\"aa\",\"أ\":\"a\",\"ؤ\":\"u\",\"إ\":\"i\",\"ئ\":\"e\",\"ا\":\"a\",\"ب\":\"b\",\"ة\":\"h\",\"ت\":\"t\",\"ث\":\"th\",\"ج\":\"j\",\"ح\":\"h\",\"خ\":\"kh\",\"د\":\"d\",\"ذ\":\"th\",\"ر\":\"r\",\"ز\":\"z\",\"س\":\"s\",\"ش\":\"sh\",\"ص\":\"s\",\"ض\":\"dh\",\"ط\":\"t\",\"ظ\":\"z\",\"ع\":\"a\",\"غ\":\"gh\",\"ف\":\"f\",\"ق\":\"q\",\"ك\":\"k\",\"ل\":\"l\",\"م\":\"m\",\"ن\":\"n\",\"ه\":\"h\",\"و\":\"w\",\"ى\":\"a\",\"ي\":\"y\",\"ً\":\"an\",\"ٌ\":\"on\",\"ٍ\":\"en\",\"َ\":\"a\",\"ُ\":\"u\",\"ِ\":\"e\",\"ْ\":\"\",\"٠\":\"0\",\"١\":\"1\",\"٢\":\"2\",\"٣\":\"3\",\"٤\":\"4\",\"٥\":\"5\",\"٦\":\"6\",\"٧\":\"7\",\"٨\":\"8\",\"٩\":\"9\",\"پ\":\"p\",\"چ\":\"ch\",\"ژ\":\"zh\",\"ک\":\"k\",\"گ\":\"g\",\"ی\":\"y\",\"۰\":\"0\",\"۱\":\"1\",\"۲\":\"2\",\"۳\":\"3\",\"۴\":\"4\",\"۵\":\"5\",\"۶\":\"6\",\"۷\":\"7\",\"۸\":\"8\",\"۹\":\"9\",\"฿\":\"baht\",\"ა\":\"a\",\"ბ\":\"b\",\"გ\":\"g\",\"დ\":\"d\",\"ე\":\"e\",\"ვ\":\"v\",\"ზ\":\"z\",\"თ\":\"t\",\"ი\":\"i\",\"კ\":\"k\",\"ლ\":\"l\",\"მ\":\"m\",\"ნ\":\"n\",\"ო\":\"o\",\"პ\":\"p\",\"ჟ\":\"zh\",\"რ\":\"r\",\"ს\":\"s\",\"ტ\":\"t\",\"უ\":\"u\",\"ფ\":\"f\",\"ქ\":\"k\",\"ღ\":\"gh\",\"ყ\":\"q\",\"შ\":\"sh\",\"ჩ\":\"ch\",\"ც\":\"ts\",\"ძ\":\"dz\",\"წ\":\"ts\",\"ჭ\":\"ch\",\"ხ\":\"kh\",\"ჯ\":\"j\",\"ჰ\":\"h\",\"Ṣ\":\"S\",\"ṣ\":\"s\",\"Ẁ\":\"W\",\"ẁ\":\"w\",\"Ẃ\":\"W\",\"ẃ\":\"w\",\"Ẅ\":\"W\",\"ẅ\":\"w\",\"ẞ\":\"SS\",\"Ạ\":\"A\",\"ạ\":\"a\",\"Ả\":\"A\",\"ả\":\"a\",\"Ấ\":\"A\",\"ấ\":\"a\",\"Ầ\":\"A\",\"ầ\":\"a\",\"Ẩ\":\"A\",\"ẩ\":\"a\",\"Ẫ\":\"A\",\"ẫ\":\"a\",\"Ậ\":\"A\",\"ậ\":\"a\",\"Ắ\":\"A\",\"ắ\":\"a\",\"Ằ\":\"A\",\"ằ\":\"a\",\"Ẳ\":\"A\",\"ẳ\":\"a\",\"Ẵ\":\"A\",\"ẵ\":\"a\",\"Ặ\":\"A\",\"ặ\":\"a\",\"Ẹ\":\"E\",\"ẹ\":\"e\",\"Ẻ\":\"E\",\"ẻ\":\"e\",\"Ẽ\":\"E\",\"ẽ\":\"e\",\"Ế\":\"E\",\"ế\":\"e\",\"Ề\":\"E\",\"ề\":\"e\",\"Ể\":\"E\",\"ể\":\"e\",\"Ễ\":\"E\",\"ễ\":\"e\",\"Ệ\":\"E\",\"ệ\":\"e\",\"Ỉ\":\"I\",\"ỉ\":\"i\",\"Ị\":\"I\",\"ị\":\"i\",\"Ọ\":\"O\",\"ọ\":\"o\",\"Ỏ\":\"O\",\"ỏ\":\"o\",\"Ố\":\"O\",\"ố\":\"o\",\"Ồ\":\"O\",\"ồ\":\"o\",\"Ổ\":\"O\",\"ổ\":\"o\",\"Ỗ\":\"O\",\"ỗ\":\"o\",\"Ộ\":\"O\",\"ộ\":\"o\",\"Ớ\":\"O\",\"ớ\":\"o\",\"Ờ\":\"O\",\"ờ\":\"o\",\"Ở\":\"O\",\"ở\":\"o\",\"Ỡ\":\"O\",\"ỡ\":\"o\",\"Ợ\":\"O\",\"ợ\":\"o\",\"Ụ\":\"U\",\"ụ\":\"u\",\"Ủ\":\"U\",\"ủ\":\"u\",\"Ứ\":\"U\",\"ứ\":\"u\",\"Ừ\":\"U\",\"ừ\":\"u\",\"Ử\":\"U\",\"ử\":\"u\",\"Ữ\":\"U\",\"ữ\":\"u\",\"Ự\":\"U\",\"ự\":\"u\",\"Ỳ\":\"Y\",\"ỳ\":\"y\",\"Ỵ\":\"Y\",\"ỵ\":\"y\",\"Ỷ\":\"Y\",\"ỷ\":\"y\",\"Ỹ\":\"Y\",\"ỹ\":\"y\",\"–\":\"-\",\"‘\":\"'\",\"’\":\"'\",\"“\":\"\\\"\",\"”\":\"\\\"\",\"„\":\"\\\"\",\"†\":\"+\",\"•\":\"*\",\"…\":\"...\",\"₠\":\"ecu\",\"₢\":\"cruzeiro\",\"₣\":\"french franc\",\"₤\":\"lira\",\"₥\":\"mill\",\"₦\":\"naira\",\"₧\":\"peseta\",\"₨\":\"rupee\",\"₩\":\"won\",\"₪\":\"new shequel\",\"₫\":\"dong\",\"€\":\"euro\",\"₭\":\"kip\",\"₮\":\"tugrik\",\"₯\":\"drachma\",\"₰\":\"penny\",\"₱\":\"peso\",\"₲\":\"guarani\",\"₳\":\"austral\",\"₴\":\"hryvnia\",\"₵\":\"cedi\",\"₸\":\"kazakhstani tenge\",\"₹\":\"indian rupee\",\"₺\":\"turkish lira\",\"₽\":\"russian ruble\",\"₿\":\"bitcoin\",\"℠\":\"sm\",\"™\":\"tm\",\"∂\":\"d\",\"∆\":\"delta\",\"∑\":\"sum\",\"∞\":\"infinity\",\"♥\":\"love\",\"元\":\"yuan\",\"円\":\"yen\",\"﷼\":\"rial\",\"ﻵ\":\"laa\",\"ﻷ\":\"laa\",\"ﻹ\":\"lai\",\"ﻻ\":\"la\"}");
		var locales = JSON.parse("{\"bg\":{\"Й\":\"Y\",\"Ц\":\"Ts\",\"Щ\":\"Sht\",\"Ъ\":\"A\",\"Ь\":\"Y\",\"й\":\"y\",\"ц\":\"ts\",\"щ\":\"sht\",\"ъ\":\"a\",\"ь\":\"y\"},\"de\":{\"Ä\":\"AE\",\"ä\":\"ae\",\"Ö\":\"OE\",\"ö\":\"oe\",\"Ü\":\"UE\",\"ü\":\"ue\",\"ß\":\"ss\",\"%\":\"prozent\",\"&\":\"und\",\"|\":\"oder\",\"∑\":\"summe\",\"∞\":\"unendlich\",\"♥\":\"liebe\"},\"es\":{\"%\":\"por ciento\",\"&\":\"y\",\"<\":\"menor que\",\">\":\"mayor que\",\"|\":\"o\",\"¢\":\"centavos\",\"£\":\"libras\",\"¤\":\"moneda\",\"₣\":\"francos\",\"∑\":\"suma\",\"∞\":\"infinito\",\"♥\":\"amor\"},\"fr\":{\"%\":\"pourcent\",\"&\":\"et\",\"<\":\"plus petit\",\">\":\"plus grand\",\"|\":\"ou\",\"¢\":\"centime\",\"£\":\"livre\",\"¤\":\"devise\",\"₣\":\"franc\",\"∑\":\"somme\",\"∞\":\"infini\",\"♥\":\"amour\"},\"pt\":{\"%\":\"porcento\",\"&\":\"e\",\"<\":\"menor\",\">\":\"maior\",\"|\":\"ou\",\"¢\":\"centavo\",\"∑\":\"soma\",\"£\":\"libra\",\"∞\":\"infinito\",\"♥\":\"amor\"},\"uk\":{\"И\":\"Y\",\"и\":\"y\",\"Й\":\"Y\",\"й\":\"y\",\"Ц\":\"Ts\",\"ц\":\"ts\",\"Х\":\"Kh\",\"х\":\"kh\",\"Щ\":\"Shch\",\"щ\":\"shch\",\"Г\":\"H\",\"г\":\"h\"},\"vi\":{\"Đ\":\"D\",\"đ\":\"d\"},\"da\":{\"Ø\":\"OE\",\"ø\":\"oe\",\"Å\":\"AA\",\"å\":\"aa\",\"%\":\"procent\",\"&\":\"og\",\"|\":\"eller\",\"$\":\"dollar\",\"<\":\"mindre end\",\">\":\"større end\"},\"nb\":{\"&\":\"og\",\"Å\":\"AA\",\"Æ\":\"AE\",\"Ø\":\"OE\",\"å\":\"aa\",\"æ\":\"ae\",\"ø\":\"oe\"},\"it\":{\"&\":\"e\"},\"nl\":{\"&\":\"en\"},\"sv\":{\"&\":\"och\",\"Å\":\"AA\",\"Ä\":\"AE\",\"Ö\":\"OE\",\"å\":\"aa\",\"ä\":\"ae\",\"ö\":\"oe\"}}");
		function replace(string, options) {
			if (typeof string !== "string") throw new Error("slugify: string argument expected");
			options = typeof options === "string" ? { replacement: options } : options || {};
			var locale = locales[options.locale] || {};
			var replacement = options.replacement === void 0 ? "-" : options.replacement;
			var trim = options.trim === void 0 ? true : options.trim;
			var slug = string.normalize().split("").reduce(function(result, ch) {
				var appendChar = locale[ch];
				if (appendChar === void 0) appendChar = charMap[ch];
				if (appendChar === void 0) appendChar = ch;
				if (appendChar === replacement) appendChar = " ";
				return result + appendChar.replace(options.remove || /[^\w\s$*_+~.()'"!\-:@]+/g, "");
			}, "");
			if (options.strict) slug = slug.replace(/[^A-Za-z0-9\s]/g, "");
			if (trim) slug = slug.trim();
			slug = slug.replace(/\s+/g, replacement);
			if (options.lower) slug = slug.toLowerCase();
			return slug;
		}
		replace.extend = function(customMap) {
			Object.assign(charMap, customMap);
		};
		return replace;
	});
}));

//#endregion
//#region src/core/core.ts
/**
* Core — Shared utilities, constants, and internal helpers
*
* Ported from maxsim/bin/lib/core.cjs
*/
var import_slugify = /* @__PURE__ */ __toESM(require_slugify());
const MODEL_PROFILES = {
	"maxsim-planner": {
		quality: "opus",
		balanced: "opus",
		budget: "sonnet",
		tokenburner: "opus"
	},
	"maxsim-roadmapper": {
		quality: "opus",
		balanced: "sonnet",
		budget: "sonnet",
		tokenburner: "opus"
	},
	"maxsim-executor": {
		quality: "opus",
		balanced: "sonnet",
		budget: "sonnet",
		tokenburner: "opus"
	},
	"maxsim-phase-researcher": {
		quality: "opus",
		balanced: "sonnet",
		budget: "haiku",
		tokenburner: "opus"
	},
	"maxsim-project-researcher": {
		quality: "opus",
		balanced: "sonnet",
		budget: "haiku",
		tokenburner: "opus"
	},
	"maxsim-research-synthesizer": {
		quality: "sonnet",
		balanced: "sonnet",
		budget: "haiku",
		tokenburner: "opus"
	},
	"maxsim-debugger": {
		quality: "opus",
		balanced: "sonnet",
		budget: "sonnet",
		tokenburner: "opus"
	},
	"maxsim-codebase-mapper": {
		quality: "sonnet",
		balanced: "haiku",
		budget: "haiku",
		tokenburner: "opus"
	},
	"maxsim-verifier": {
		quality: "sonnet",
		balanced: "sonnet",
		budget: "haiku",
		tokenburner: "opus"
	},
	"maxsim-plan-checker": {
		quality: "sonnet",
		balanced: "sonnet",
		budget: "haiku",
		tokenburner: "opus"
	},
	"maxsim-integration-checker": {
		quality: "sonnet",
		balanced: "sonnet",
		budget: "haiku",
		tokenburner: "opus"
	}
};
function output(result, raw, rawValue) {
	if (raw && rawValue !== void 0) process.stdout.write(String(rawValue));
	else {
		const json = JSON.stringify(result, null, 2);
		if (json.length > 5e4) {
			const tmpPath = node_path.default.join(node_os.default.tmpdir(), `maxsim-${Date.now()}.json`);
			node_fs.default.writeFileSync(tmpPath, json, "utf-8");
			process.stdout.write("@file:" + tmpPath);
		} else process.stdout.write(json);
	}
	process.exit(0);
}
function error(message) {
	process.stderr.write("Error: " + message + "\n");
	process.exit(1);
}
function safeReadFile(filePath) {
	try {
		return node_fs.default.readFileSync(filePath, "utf-8");
	} catch {
		return null;
	}
}
function loadConfig(cwd) {
	const configPath = node_path.default.join(cwd, ".planning", "config.json");
	const defaults = {
		model_profile: "balanced",
		commit_docs: true,
		search_gitignored: false,
		branching_strategy: "none",
		phase_branch_template: "maxsim/phase-{phase}-{slug}",
		milestone_branch_template: "maxsim/{milestone}-{slug}",
		research: true,
		plan_checker: true,
		verifier: true,
		parallelization: true,
		brave_search: false
	};
	try {
		const raw = node_fs.default.readFileSync(configPath, "utf-8");
		const parsed = JSON.parse(raw);
		const get = (key, nested) => {
			if (parsed[key] !== void 0) return parsed[key];
			if (nested) {
				const section = parsed[nested.section];
				if (section && typeof section === "object" && section !== null && nested.field in section) return section[nested.field];
			}
		};
		const parallelization = (() => {
			const val = get("parallelization");
			if (typeof val === "boolean") return val;
			if (typeof val === "object" && val !== null && "enabled" in val) return val.enabled;
			return defaults.parallelization;
		})();
		return {
			model_profile: get("model_profile") ?? defaults.model_profile,
			commit_docs: get("commit_docs", {
				section: "planning",
				field: "commit_docs"
			}) ?? defaults.commit_docs,
			search_gitignored: get("search_gitignored", {
				section: "planning",
				field: "search_gitignored"
			}) ?? defaults.search_gitignored,
			branching_strategy: get("branching_strategy", {
				section: "git",
				field: "branching_strategy"
			}) ?? defaults.branching_strategy,
			phase_branch_template: get("phase_branch_template", {
				section: "git",
				field: "phase_branch_template"
			}) ?? defaults.phase_branch_template,
			milestone_branch_template: get("milestone_branch_template", {
				section: "git",
				field: "milestone_branch_template"
			}) ?? defaults.milestone_branch_template,
			research: get("research", {
				section: "workflow",
				field: "research"
			}) ?? defaults.research,
			plan_checker: get("plan_checker", {
				section: "workflow",
				field: "plan_check"
			}) ?? defaults.plan_checker,
			verifier: get("verifier", {
				section: "workflow",
				field: "verifier"
			}) ?? defaults.verifier,
			parallelization,
			brave_search: get("brave_search") ?? defaults.brave_search,
			model_overrides: parsed["model_overrides"]
		};
	} catch {
		return defaults;
	}
}
async function isGitIgnored(cwd, targetPath) {
	try {
		return (await simpleGit(cwd).checkIgnore(targetPath)).length > 0;
	} catch {
		return false;
	}
}
async function execGit(cwd, args) {
	try {
		return {
			exitCode: 0,
			stdout: (await simpleGit(cwd).raw(args) ?? "").trim(),
			stderr: ""
		};
	} catch (thrown) {
		return {
			exitCode: 1,
			stdout: "",
			stderr: thrown.message ?? ""
		};
	}
}
function normalizePhaseName(phase) {
	const match = phase.match(/^(\d+)([A-Z])?(\.\d+)?/i);
	if (!match) return phase;
	const padded = match[1].padStart(2, "0");
	const letter = match[2] ? match[2].toUpperCase() : "";
	const decimal = match[3] || "";
	return padded + letter + decimal;
}
function comparePhaseNum(a, b) {
	const pa = String(a).match(/^(\d+)([A-Z])?(\.\d+)?/i);
	const pb = String(b).match(/^(\d+)([A-Z])?(\.\d+)?/i);
	if (!pa || !pb) return String(a).localeCompare(String(b));
	const intDiff = parseInt(pa[1], 10) - parseInt(pb[1], 10);
	if (intDiff !== 0) return intDiff;
	const la = (pa[2] || "").toUpperCase();
	const lb = (pb[2] || "").toUpperCase();
	if (la !== lb) {
		if (!la) return -1;
		if (!lb) return 1;
		return la < lb ? -1 : 1;
	}
	return (pa[3] ? parseFloat(pa[3]) : -1) - (pb[3] ? parseFloat(pb[3]) : -1);
}
/**
* Returns the canonical regex for matching Phase heading lines in ROADMAP.md.
*
* General form (no escapedPhaseNum):
*   Matches: ## Phase 03: Name Here
*   Group 1: phase number string (e.g. "03", "3A", "2.1")
*   Group 2: phase name string (e.g. "Name Here")
*
* Specific form (with escapedPhaseNum):
*   Matches: ## Phase 03: Name Here
*   Group 1: phase name string only
*
* @param escapedPhaseNum - regex-escaped phase number string to match a specific phase
* @param flags - regex flags (default: 'gi')
*/
function getPhasePattern(escapedPhaseNum, flags = "gim") {
	if (escapedPhaseNum) return new RegExp(`^#{2,4}\\s*Phase\\s+${escapedPhaseNum}:\\s*([^\\n]+)`, flags);
	return new RegExp(`^#{2,4}\\s*Phase\\s+(\\d+[A-Z]?(?:\\.\\d+)?)\\s*:\\s*([^\\n]+)`, flags);
}
function searchPhaseInDir(baseDir, relBase, normalized) {
	try {
		const match = node_fs.default.readdirSync(baseDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => comparePhaseNum(a, b)).find((d) => d.startsWith(normalized));
		if (!match) return null;
		const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
		const phaseNumber = dirMatch ? dirMatch[1] : normalized;
		const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
		const phaseDir = node_path.default.join(baseDir, match);
		const phaseFiles = node_fs.default.readdirSync(phaseDir);
		const plans = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md").sort();
		const summaries = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md").sort();
		const hasResearch = phaseFiles.some((f) => f.endsWith("-RESEARCH.md") || f === "RESEARCH.md");
		const hasContext = phaseFiles.some((f) => f.endsWith("-CONTEXT.md") || f === "CONTEXT.md");
		const hasVerification = phaseFiles.some((f) => f.endsWith("-VERIFICATION.md") || f === "VERIFICATION.md");
		const completedPlanIds = new Set(summaries.map((s) => s.replace("-SUMMARY.md", "").replace("SUMMARY.md", "")));
		const incompletePlans = plans.filter((p) => {
			const planId = p.replace("-PLAN.md", "").replace("PLAN.md", "");
			return !completedPlanIds.has(planId);
		});
		return {
			found: true,
			directory: node_path.default.join(relBase, match),
			phase_number: phaseNumber,
			phase_name: phaseName,
			phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : null,
			plans,
			summaries,
			incomplete_plans: incompletePlans,
			has_research: hasResearch,
			has_context: hasContext,
			has_verification: hasVerification
		};
	} catch {
		return null;
	}
}
function findPhaseInternal(cwd, phase) {
	if (!phase) return null;
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const normalized = normalizePhaseName(phase);
	const current = searchPhaseInDir(phasesDir, node_path.default.join(".planning", "phases"), normalized);
	if (current) return current;
	const milestonesDir = node_path.default.join(cwd, ".planning", "milestones");
	if (!node_fs.default.existsSync(milestonesDir)) return null;
	try {
		const archiveDirs = node_fs.default.readdirSync(milestonesDir, { withFileTypes: true }).filter((e) => e.isDirectory() && /^v[\d.]+-phases$/.test(e.name)).map((e) => e.name).sort().reverse();
		for (const archiveName of archiveDirs) {
			const versionMatch = archiveName.match(/^(v[\d.]+)-phases$/);
			if (!versionMatch) continue;
			const version = versionMatch[1];
			const result = searchPhaseInDir(node_path.default.join(milestonesDir, archiveName), node_path.default.join(".planning", "milestones", archiveName), normalized);
			if (result) {
				result.archived = version;
				return result;
			}
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	return null;
}
function getArchivedPhaseDirs(cwd) {
	const milestonesDir = node_path.default.join(cwd, ".planning", "milestones");
	const results = [];
	if (!node_fs.default.existsSync(milestonesDir)) return results;
	try {
		const phaseDirs = node_fs.default.readdirSync(milestonesDir, { withFileTypes: true }).filter((e) => e.isDirectory() && /^v[\d.]+-phases$/.test(e.name)).map((e) => e.name).sort().reverse();
		for (const archiveName of phaseDirs) {
			const versionMatch = archiveName.match(/^(v[\d.]+)-phases$/);
			if (!versionMatch) continue;
			const version = versionMatch[1];
			const archivePath = node_path.default.join(milestonesDir, archiveName);
			const dirs = node_fs.default.readdirSync(archivePath, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => comparePhaseNum(a, b));
			for (const dir of dirs) results.push({
				name: dir,
				milestone: version,
				basePath: node_path.default.join(".planning", "milestones", archiveName),
				fullPath: node_path.default.join(archivePath, dir)
			});
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	return results;
}
function getRoadmapPhaseInternal(cwd, phaseNum) {
	if (!phaseNum) return null;
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	if (!node_fs.default.existsSync(roadmapPath)) return null;
	try {
		const content = node_fs.default.readFileSync(roadmapPath, "utf-8");
		const phasePattern = getPhasePattern(phaseNum.toString().replace(/\./g, "\\."), "i");
		const headerMatch = content.match(phasePattern);
		if (!headerMatch) return null;
		const phaseName = headerMatch[1].trim();
		const headerIndex = headerMatch.index;
		const nextHeaderMatch = content.slice(headerIndex).match(/\n#{2,4}\s+Phase\s+\d/i);
		const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index : content.length;
		const section = content.slice(headerIndex, sectionEnd).trim();
		const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
		const goal = goalMatch ? goalMatch[1].trim() : null;
		return {
			found: true,
			phase_number: phaseNum.toString(),
			phase_name: phaseName,
			goal,
			section
		};
	} catch {
		return null;
	}
}
function resolveModelInternal(cwd, agentType) {
	const config = loadConfig(cwd);
	const override = config.model_overrides?.[agentType];
	if (override) return override === "opus" ? "inherit" : override;
	const profile = config.model_profile || "balanced";
	const agentModels = MODEL_PROFILES[agentType];
	if (!agentModels) return "sonnet";
	const resolved = agentModels[profile] || agentModels["balanced"] || "sonnet";
	return resolved === "opus" ? "inherit" : resolved;
}
function pathExistsInternal(cwd, targetPath) {
	const fullPath = node_path.default.isAbsolute(targetPath) ? targetPath : node_path.default.join(cwd, targetPath);
	try {
		node_fs.default.statSync(fullPath);
		return true;
	} catch {
		return false;
	}
}
function generateSlugInternal(text) {
	if (!text) return null;
	return (0, import_slugify.default)(text, {
		lower: true,
		strict: true
	});
}
function getMilestoneInfo(cwd) {
	try {
		const roadmap = node_fs.default.readFileSync(node_path.default.join(cwd, ".planning", "ROADMAP.md"), "utf-8");
		const versionMatch = roadmap.match(/v(\d+\.\d+)/);
		const nameMatch = roadmap.match(/## .*v\d+\.\d+[:\s]+([^\n(]+)/);
		return {
			version: versionMatch ? versionMatch[0] : "v1.0",
			name: nameMatch ? nameMatch[1].trim() : "milestone"
		};
	} catch {
		return {
			version: "v1.0",
			name: "milestone"
		};
	}
}

//#endregion
//#region ../../node_modules/yaml/dist/nodes/identity.js
var require_identity = /* @__PURE__ */ __commonJSMin(((exports) => {
	const ALIAS = Symbol.for("yaml.alias");
	const DOC = Symbol.for("yaml.document");
	const MAP = Symbol.for("yaml.map");
	const PAIR = Symbol.for("yaml.pair");
	const SCALAR = Symbol.for("yaml.scalar");
	const SEQ = Symbol.for("yaml.seq");
	const NODE_TYPE = Symbol.for("yaml.node.type");
	const isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
	const isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
	const isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
	const isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
	const isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
	const isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
	function isCollection(node) {
		if (node && typeof node === "object") switch (node[NODE_TYPE]) {
			case MAP:
			case SEQ: return true;
		}
		return false;
	}
	function isNode(node) {
		if (node && typeof node === "object") switch (node[NODE_TYPE]) {
			case ALIAS:
			case MAP:
			case SCALAR:
			case SEQ: return true;
		}
		return false;
	}
	const hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
	exports.ALIAS = ALIAS;
	exports.DOC = DOC;
	exports.MAP = MAP;
	exports.NODE_TYPE = NODE_TYPE;
	exports.PAIR = PAIR;
	exports.SCALAR = SCALAR;
	exports.SEQ = SEQ;
	exports.hasAnchor = hasAnchor;
	exports.isAlias = isAlias;
	exports.isCollection = isCollection;
	exports.isDocument = isDocument;
	exports.isMap = isMap;
	exports.isNode = isNode;
	exports.isPair = isPair;
	exports.isScalar = isScalar;
	exports.isSeq = isSeq;
}));

//#endregion
//#region ../../node_modules/yaml/dist/visit.js
var require_visit = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	const BREAK = Symbol("break visit");
	const SKIP = Symbol("skip children");
	const REMOVE = Symbol("remove node");
	/**
	* Apply a visitor to an AST node or document.
	*
	* Walks through the tree (depth-first) starting from `node`, calling a
	* `visitor` function with three arguments:
	*   - `key`: For sequence values and map `Pair`, the node's index in the
	*     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
	*     `null` for the root node.
	*   - `node`: The current node.
	*   - `path`: The ancestry of the current node.
	*
	* The return value of the visitor may be used to control the traversal:
	*   - `undefined` (default): Do nothing and continue
	*   - `visit.SKIP`: Do not visit the children of this node, continue with next
	*     sibling
	*   - `visit.BREAK`: Terminate traversal completely
	*   - `visit.REMOVE`: Remove the current node, then continue with the next one
	*   - `Node`: Replace the current node, then continue by visiting it
	*   - `number`: While iterating the items of a sequence or map, set the index
	*     of the next step. This is useful especially if the index of the current
	*     node has changed.
	*
	* If `visitor` is a single function, it will be called with all values
	* encountered in the tree, including e.g. `null` values. Alternatively,
	* separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
	* `Alias` and `Scalar` node. To define the same visitor function for more than
	* one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
	* and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
	* specific defined one will be used for each node.
	*/
	function visit(node, visitor) {
		const visitor_ = initVisitor(visitor);
		if (identity.isDocument(node)) {
			if (visit_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE) node.contents = null;
		} else visit_(null, node, visitor_, Object.freeze([]));
	}
	/** Terminate visit traversal completely */
	visit.BREAK = BREAK;
	/** Do not visit the children of the current node */
	visit.SKIP = SKIP;
	/** Remove the current node */
	visit.REMOVE = REMOVE;
	function visit_(key, node, visitor, path) {
		const ctrl = callVisitor(key, node, visitor, path);
		if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
			replaceNode(key, path, ctrl);
			return visit_(key, ctrl, visitor, path);
		}
		if (typeof ctrl !== "symbol") {
			if (identity.isCollection(node)) {
				path = Object.freeze(path.concat(node));
				for (let i = 0; i < node.items.length; ++i) {
					const ci = visit_(i, node.items[i], visitor, path);
					if (typeof ci === "number") i = ci - 1;
					else if (ci === BREAK) return BREAK;
					else if (ci === REMOVE) {
						node.items.splice(i, 1);
						i -= 1;
					}
				}
			} else if (identity.isPair(node)) {
				path = Object.freeze(path.concat(node));
				const ck = visit_("key", node.key, visitor, path);
				if (ck === BREAK) return BREAK;
				else if (ck === REMOVE) node.key = null;
				const cv = visit_("value", node.value, visitor, path);
				if (cv === BREAK) return BREAK;
				else if (cv === REMOVE) node.value = null;
			}
		}
		return ctrl;
	}
	/**
	* Apply an async visitor to an AST node or document.
	*
	* Walks through the tree (depth-first) starting from `node`, calling a
	* `visitor` function with three arguments:
	*   - `key`: For sequence values and map `Pair`, the node's index in the
	*     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
	*     `null` for the root node.
	*   - `node`: The current node.
	*   - `path`: The ancestry of the current node.
	*
	* The return value of the visitor may be used to control the traversal:
	*   - `Promise`: Must resolve to one of the following values
	*   - `undefined` (default): Do nothing and continue
	*   - `visit.SKIP`: Do not visit the children of this node, continue with next
	*     sibling
	*   - `visit.BREAK`: Terminate traversal completely
	*   - `visit.REMOVE`: Remove the current node, then continue with the next one
	*   - `Node`: Replace the current node, then continue by visiting it
	*   - `number`: While iterating the items of a sequence or map, set the index
	*     of the next step. This is useful especially if the index of the current
	*     node has changed.
	*
	* If `visitor` is a single function, it will be called with all values
	* encountered in the tree, including e.g. `null` values. Alternatively,
	* separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
	* `Alias` and `Scalar` node. To define the same visitor function for more than
	* one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
	* and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
	* specific defined one will be used for each node.
	*/
	async function visitAsync(node, visitor) {
		const visitor_ = initVisitor(visitor);
		if (identity.isDocument(node)) {
			if (await visitAsync_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE) node.contents = null;
		} else await visitAsync_(null, node, visitor_, Object.freeze([]));
	}
	/** Terminate visit traversal completely */
	visitAsync.BREAK = BREAK;
	/** Do not visit the children of the current node */
	visitAsync.SKIP = SKIP;
	/** Remove the current node */
	visitAsync.REMOVE = REMOVE;
	async function visitAsync_(key, node, visitor, path) {
		const ctrl = await callVisitor(key, node, visitor, path);
		if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
			replaceNode(key, path, ctrl);
			return visitAsync_(key, ctrl, visitor, path);
		}
		if (typeof ctrl !== "symbol") {
			if (identity.isCollection(node)) {
				path = Object.freeze(path.concat(node));
				for (let i = 0; i < node.items.length; ++i) {
					const ci = await visitAsync_(i, node.items[i], visitor, path);
					if (typeof ci === "number") i = ci - 1;
					else if (ci === BREAK) return BREAK;
					else if (ci === REMOVE) {
						node.items.splice(i, 1);
						i -= 1;
					}
				}
			} else if (identity.isPair(node)) {
				path = Object.freeze(path.concat(node));
				const ck = await visitAsync_("key", node.key, visitor, path);
				if (ck === BREAK) return BREAK;
				else if (ck === REMOVE) node.key = null;
				const cv = await visitAsync_("value", node.value, visitor, path);
				if (cv === BREAK) return BREAK;
				else if (cv === REMOVE) node.value = null;
			}
		}
		return ctrl;
	}
	function initVisitor(visitor) {
		if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) return Object.assign({
			Alias: visitor.Node,
			Map: visitor.Node,
			Scalar: visitor.Node,
			Seq: visitor.Node
		}, visitor.Value && {
			Map: visitor.Value,
			Scalar: visitor.Value,
			Seq: visitor.Value
		}, visitor.Collection && {
			Map: visitor.Collection,
			Seq: visitor.Collection
		}, visitor);
		return visitor;
	}
	function callVisitor(key, node, visitor, path) {
		if (typeof visitor === "function") return visitor(key, node, path);
		if (identity.isMap(node)) return visitor.Map?.(key, node, path);
		if (identity.isSeq(node)) return visitor.Seq?.(key, node, path);
		if (identity.isPair(node)) return visitor.Pair?.(key, node, path);
		if (identity.isScalar(node)) return visitor.Scalar?.(key, node, path);
		if (identity.isAlias(node)) return visitor.Alias?.(key, node, path);
	}
	function replaceNode(key, path, node) {
		const parent = path[path.length - 1];
		if (identity.isCollection(parent)) parent.items[key] = node;
		else if (identity.isPair(parent)) if (key === "key") parent.key = node;
		else parent.value = node;
		else if (identity.isDocument(parent)) parent.contents = node;
		else {
			const pt = identity.isAlias(parent) ? "alias" : "scalar";
			throw new Error(`Cannot replace node with ${pt} parent`);
		}
	}
	exports.visit = visit;
	exports.visitAsync = visitAsync;
}));

//#endregion
//#region ../../node_modules/yaml/dist/doc/directives.js
var require_directives = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var visit = require_visit();
	const escapeChars = {
		"!": "%21",
		",": "%2C",
		"[": "%5B",
		"]": "%5D",
		"{": "%7B",
		"}": "%7D"
	};
	const escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
	var Directives = class Directives {
		constructor(yaml, tags) {
			/**
			* The directives-end/doc-start marker `---`. If `null`, a marker may still be
			* included in the document's stringified representation.
			*/
			this.docStart = null;
			/** The doc-end marker `...`.  */
			this.docEnd = false;
			this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
			this.tags = Object.assign({}, Directives.defaultTags, tags);
		}
		clone() {
			const copy = new Directives(this.yaml, this.tags);
			copy.docStart = this.docStart;
			return copy;
		}
		/**
		* During parsing, get a Directives instance for the current document and
		* update the stream state according to the current version's spec.
		*/
		atDocument() {
			const res = new Directives(this.yaml, this.tags);
			switch (this.yaml.version) {
				case "1.1":
					this.atNextDocument = true;
					break;
				case "1.2":
					this.atNextDocument = false;
					this.yaml = {
						explicit: Directives.defaultYaml.explicit,
						version: "1.2"
					};
					this.tags = Object.assign({}, Directives.defaultTags);
					break;
			}
			return res;
		}
		/**
		* @param onError - May be called even if the action was successful
		* @returns `true` on success
		*/
		add(line, onError) {
			if (this.atNextDocument) {
				this.yaml = {
					explicit: Directives.defaultYaml.explicit,
					version: "1.1"
				};
				this.tags = Object.assign({}, Directives.defaultTags);
				this.atNextDocument = false;
			}
			const parts = line.trim().split(/[ \t]+/);
			const name = parts.shift();
			switch (name) {
				case "%TAG": {
					if (parts.length !== 2) {
						onError(0, "%TAG directive should contain exactly two parts");
						if (parts.length < 2) return false;
					}
					const [handle, prefix] = parts;
					this.tags[handle] = prefix;
					return true;
				}
				case "%YAML": {
					this.yaml.explicit = true;
					if (parts.length !== 1) {
						onError(0, "%YAML directive should contain exactly one part");
						return false;
					}
					const [version] = parts;
					if (version === "1.1" || version === "1.2") {
						this.yaml.version = version;
						return true;
					} else {
						const isValid = /^\d+\.\d+$/.test(version);
						onError(6, `Unsupported YAML version ${version}`, isValid);
						return false;
					}
				}
				default:
					onError(0, `Unknown directive ${name}`, true);
					return false;
			}
		}
		/**
		* Resolves a tag, matching handles to those defined in %TAG directives.
		*
		* @returns Resolved tag, which may also be the non-specific tag `'!'` or a
		*   `'!local'` tag, or `null` if unresolvable.
		*/
		tagName(source, onError) {
			if (source === "!") return "!";
			if (source[0] !== "!") {
				onError(`Not a valid tag: ${source}`);
				return null;
			}
			if (source[1] === "<") {
				const verbatim = source.slice(2, -1);
				if (verbatim === "!" || verbatim === "!!") {
					onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
					return null;
				}
				if (source[source.length - 1] !== ">") onError("Verbatim tags must end with a >");
				return verbatim;
			}
			const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
			if (!suffix) onError(`The ${source} tag has no suffix`);
			const prefix = this.tags[handle];
			if (prefix) try {
				return prefix + decodeURIComponent(suffix);
			} catch (error) {
				onError(String(error));
				return null;
			}
			if (handle === "!") return source;
			onError(`Could not resolve tag: ${source}`);
			return null;
		}
		/**
		* Given a fully resolved tag, returns its printable string form,
		* taking into account current tag prefixes and defaults.
		*/
		tagString(tag) {
			for (const [handle, prefix] of Object.entries(this.tags)) if (tag.startsWith(prefix)) return handle + escapeTagName(tag.substring(prefix.length));
			return tag[0] === "!" ? tag : `!<${tag}>`;
		}
		toString(doc) {
			const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
			const tagEntries = Object.entries(this.tags);
			let tagNames;
			if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
				const tags = {};
				visit.visit(doc.contents, (_key, node) => {
					if (identity.isNode(node) && node.tag) tags[node.tag] = true;
				});
				tagNames = Object.keys(tags);
			} else tagNames = [];
			for (const [handle, prefix] of tagEntries) {
				if (handle === "!!" && prefix === "tag:yaml.org,2002:") continue;
				if (!doc || tagNames.some((tn) => tn.startsWith(prefix))) lines.push(`%TAG ${handle} ${prefix}`);
			}
			return lines.join("\n");
		}
	};
	Directives.defaultYaml = {
		explicit: false,
		version: "1.2"
	};
	Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
	exports.Directives = Directives;
}));

//#endregion
//#region ../../node_modules/yaml/dist/doc/anchors.js
var require_anchors = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var visit = require_visit();
	/**
	* Verify that the input string is a valid anchor.
	*
	* Will throw on errors.
	*/
	function anchorIsValid(anchor) {
		if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
			const msg = `Anchor must not contain whitespace or control characters: ${JSON.stringify(anchor)}`;
			throw new Error(msg);
		}
		return true;
	}
	function anchorNames(root) {
		const anchors = /* @__PURE__ */ new Set();
		visit.visit(root, { Value(_key, node) {
			if (node.anchor) anchors.add(node.anchor);
		} });
		return anchors;
	}
	/** Find a new anchor name with the given `prefix` and a one-indexed suffix. */
	function findNewAnchor(prefix, exclude) {
		for (let i = 1;; ++i) {
			const name = `${prefix}${i}`;
			if (!exclude.has(name)) return name;
		}
	}
	function createNodeAnchors(doc, prefix) {
		const aliasObjects = [];
		const sourceObjects = /* @__PURE__ */ new Map();
		let prevAnchors = null;
		return {
			onAnchor: (source) => {
				aliasObjects.push(source);
				prevAnchors ?? (prevAnchors = anchorNames(doc));
				const anchor = findNewAnchor(prefix, prevAnchors);
				prevAnchors.add(anchor);
				return anchor;
			},
			setAnchors: () => {
				for (const source of aliasObjects) {
					const ref = sourceObjects.get(source);
					if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) ref.node.anchor = ref.anchor;
					else {
						const error = /* @__PURE__ */ new Error("Failed to resolve repeated object (this should not happen)");
						error.source = source;
						throw error;
					}
				}
			},
			sourceObjects
		};
	}
	exports.anchorIsValid = anchorIsValid;
	exports.anchorNames = anchorNames;
	exports.createNodeAnchors = createNodeAnchors;
	exports.findNewAnchor = findNewAnchor;
}));

//#endregion
//#region ../../node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Applies the JSON.parse reviver algorithm as defined in the ECMA-262 spec,
	* in section 24.5.1.1 "Runtime Semantics: InternalizeJSONProperty" of the
	* 2021 edition: https://tc39.es/ecma262/#sec-json.parse
	*
	* Includes extensions for handling Map and Set objects.
	*/
	function applyReviver(reviver, obj, key, val) {
		if (val && typeof val === "object") if (Array.isArray(val)) for (let i = 0, len = val.length; i < len; ++i) {
			const v0 = val[i];
			const v1 = applyReviver(reviver, val, String(i), v0);
			if (v1 === void 0) delete val[i];
			else if (v1 !== v0) val[i] = v1;
		}
		else if (val instanceof Map) for (const k of Array.from(val.keys())) {
			const v0 = val.get(k);
			const v1 = applyReviver(reviver, val, k, v0);
			if (v1 === void 0) val.delete(k);
			else if (v1 !== v0) val.set(k, v1);
		}
		else if (val instanceof Set) for (const v0 of Array.from(val)) {
			const v1 = applyReviver(reviver, val, v0, v0);
			if (v1 === void 0) val.delete(v0);
			else if (v1 !== v0) {
				val.delete(v0);
				val.add(v1);
			}
		}
		else for (const [k, v0] of Object.entries(val)) {
			const v1 = applyReviver(reviver, val, k, v0);
			if (v1 === void 0) delete val[k];
			else if (v1 !== v0) val[k] = v1;
		}
		return reviver.call(obj, key, val);
	}
	exports.applyReviver = applyReviver;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/toJS.js
var require_toJS = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	/**
	* Recursively convert any node or its contents to native JavaScript
	*
	* @param value - The input value
	* @param arg - If `value` defines a `toJSON()` method, use this
	*   as its first argument
	* @param ctx - Conversion context, originally set in Document#toJS(). If
	*   `{ keep: true }` is not set, output should be suitable for JSON
	*   stringification.
	*/
	function toJS(value, arg, ctx) {
		if (Array.isArray(value)) return value.map((v, i) => toJS(v, String(i), ctx));
		if (value && typeof value.toJSON === "function") {
			if (!ctx || !identity.hasAnchor(value)) return value.toJSON(arg, ctx);
			const data = {
				aliasCount: 0,
				count: 1,
				res: void 0
			};
			ctx.anchors.set(value, data);
			ctx.onCreate = (res) => {
				data.res = res;
				delete ctx.onCreate;
			};
			const res = value.toJSON(arg, ctx);
			if (ctx.onCreate) ctx.onCreate(res);
			return res;
		}
		if (typeof value === "bigint" && !ctx?.keep) return Number(value);
		return value;
	}
	exports.toJS = toJS;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/Node.js
var require_Node = /* @__PURE__ */ __commonJSMin(((exports) => {
	var applyReviver = require_applyReviver();
	var identity = require_identity();
	var toJS = require_toJS();
	var NodeBase = class {
		constructor(type) {
			Object.defineProperty(this, identity.NODE_TYPE, { value: type });
		}
		/** Create a copy of this node.  */
		clone() {
			const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
			if (this.range) copy.range = this.range.slice();
			return copy;
		}
		/** A plain JavaScript representation of this node. */
		toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
			if (!identity.isDocument(doc)) throw new TypeError("A document argument is required");
			const ctx = {
				anchors: /* @__PURE__ */ new Map(),
				doc,
				keep: true,
				mapAsMap: mapAsMap === true,
				mapKeyWarned: false,
				maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
			};
			const res = toJS.toJS(this, "", ctx);
			if (typeof onAnchor === "function") for (const { count, res } of ctx.anchors.values()) onAnchor(res, count);
			return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
		}
	};
	exports.NodeBase = NodeBase;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/Alias.js
var require_Alias = /* @__PURE__ */ __commonJSMin(((exports) => {
	var anchors = require_anchors();
	var visit = require_visit();
	var identity = require_identity();
	var Node = require_Node();
	var toJS = require_toJS();
	var Alias = class extends Node.NodeBase {
		constructor(source) {
			super(identity.ALIAS);
			this.source = source;
			Object.defineProperty(this, "tag", { set() {
				throw new Error("Alias nodes cannot have tags");
			} });
		}
		/**
		* Resolve the value of this alias within `doc`, finding the last
		* instance of the `source` anchor before this node.
		*/
		resolve(doc, ctx) {
			let nodes;
			if (ctx?.aliasResolveCache) nodes = ctx.aliasResolveCache;
			else {
				nodes = [];
				visit.visit(doc, { Node: (_key, node) => {
					if (identity.isAlias(node) || identity.hasAnchor(node)) nodes.push(node);
				} });
				if (ctx) ctx.aliasResolveCache = nodes;
			}
			let found = void 0;
			for (const node of nodes) {
				if (node === this) break;
				if (node.anchor === this.source) found = node;
			}
			return found;
		}
		toJSON(_arg, ctx) {
			if (!ctx) return { source: this.source };
			const { anchors, doc, maxAliasCount } = ctx;
			const source = this.resolve(doc, ctx);
			if (!source) {
				const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
				throw new ReferenceError(msg);
			}
			let data = anchors.get(source);
			if (!data) {
				toJS.toJS(source, null, ctx);
				data = anchors.get(source);
			}
			/* istanbul ignore if */
			if (data?.res === void 0) throw new ReferenceError("This should not happen: Alias anchor was not resolved?");
			if (maxAliasCount >= 0) {
				data.count += 1;
				if (data.aliasCount === 0) data.aliasCount = getAliasCount(doc, source, anchors);
				if (data.count * data.aliasCount > maxAliasCount) throw new ReferenceError("Excessive alias count indicates a resource exhaustion attack");
			}
			return data.res;
		}
		toString(ctx, _onComment, _onChompKeep) {
			const src = `*${this.source}`;
			if (ctx) {
				anchors.anchorIsValid(this.source);
				if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
					const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
					throw new Error(msg);
				}
				if (ctx.implicitKey) return `${src} `;
			}
			return src;
		}
	};
	function getAliasCount(doc, node, anchors) {
		if (identity.isAlias(node)) {
			const source = node.resolve(doc);
			const anchor = anchors && source && anchors.get(source);
			return anchor ? anchor.count * anchor.aliasCount : 0;
		} else if (identity.isCollection(node)) {
			let count = 0;
			for (const item of node.items) {
				const c = getAliasCount(doc, item, anchors);
				if (c > count) count = c;
			}
			return count;
		} else if (identity.isPair(node)) {
			const kc = getAliasCount(doc, node.key, anchors);
			const vc = getAliasCount(doc, node.value, anchors);
			return Math.max(kc, vc);
		}
		return 1;
	}
	exports.Alias = Alias;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var Node = require_Node();
	var toJS = require_toJS();
	const isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
	var Scalar = class extends Node.NodeBase {
		constructor(value) {
			super(identity.SCALAR);
			this.value = value;
		}
		toJSON(arg, ctx) {
			return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
		}
		toString() {
			return String(this.value);
		}
	};
	Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
	Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
	Scalar.PLAIN = "PLAIN";
	Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
	Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
	exports.Scalar = Scalar;
	exports.isScalarValue = isScalarValue;
}));

//#endregion
//#region ../../node_modules/yaml/dist/doc/createNode.js
var require_createNode = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Alias = require_Alias();
	var identity = require_identity();
	var Scalar = require_Scalar();
	const defaultTagPrefix = "tag:yaml.org,2002:";
	function findTagObject(value, tagName, tags) {
		if (tagName) {
			const match = tags.filter((t) => t.tag === tagName);
			const tagObj = match.find((t) => !t.format) ?? match[0];
			if (!tagObj) throw new Error(`Tag ${tagName} not found`);
			return tagObj;
		}
		return tags.find((t) => t.identify?.(value) && !t.format);
	}
	function createNode(value, tagName, ctx) {
		if (identity.isDocument(value)) value = value.contents;
		if (identity.isNode(value)) return value;
		if (identity.isPair(value)) {
			const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
			map.items.push(value);
			return map;
		}
		if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) value = value.valueOf();
		const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
		let ref = void 0;
		if (aliasDuplicateObjects && value && typeof value === "object") {
			ref = sourceObjects.get(value);
			if (ref) {
				ref.anchor ?? (ref.anchor = onAnchor(value));
				return new Alias.Alias(ref.anchor);
			} else {
				ref = {
					anchor: null,
					node: null
				};
				sourceObjects.set(value, ref);
			}
		}
		if (tagName?.startsWith("!!")) tagName = defaultTagPrefix + tagName.slice(2);
		let tagObj = findTagObject(value, tagName, schema.tags);
		if (!tagObj) {
			if (value && typeof value.toJSON === "function") value = value.toJSON();
			if (!value || typeof value !== "object") {
				const node = new Scalar.Scalar(value);
				if (ref) ref.node = node;
				return node;
			}
			tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
		}
		if (onTagObj) {
			onTagObj(tagObj);
			delete ctx.onTagObj;
		}
		const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
		if (tagName) node.tag = tagName;
		else if (!tagObj.default) node.tag = tagObj.tag;
		if (ref) ref.node = node;
		return node;
	}
	exports.createNode = createNode;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/Collection.js
var require_Collection = /* @__PURE__ */ __commonJSMin(((exports) => {
	var createNode = require_createNode();
	var identity = require_identity();
	var Node = require_Node();
	function collectionFromPath(schema, path, value) {
		let v = value;
		for (let i = path.length - 1; i >= 0; --i) {
			const k = path[i];
			if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
				const a = [];
				a[k] = v;
				v = a;
			} else v = new Map([[k, v]]);
		}
		return createNode.createNode(v, void 0, {
			aliasDuplicateObjects: false,
			keepUndefined: false,
			onAnchor: () => {
				throw new Error("This should not happen, please report a bug.");
			},
			schema,
			sourceObjects: /* @__PURE__ */ new Map()
		});
	}
	const isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
	var Collection = class extends Node.NodeBase {
		constructor(type, schema) {
			super(type);
			Object.defineProperty(this, "schema", {
				value: schema,
				configurable: true,
				enumerable: false,
				writable: true
			});
		}
		/**
		* Create a copy of this collection.
		*
		* @param schema - If defined, overwrites the original's schema
		*/
		clone(schema) {
			const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
			if (schema) copy.schema = schema;
			copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
			if (this.range) copy.range = this.range.slice();
			return copy;
		}
		/**
		* Adds a value to the collection. For `!!map` and `!!omap` the value must
		* be a Pair instance or a `{ key, value }` object, which may not have a key
		* that already exists in the map.
		*/
		addIn(path, value) {
			if (isEmptyPath(path)) this.add(value);
			else {
				const [key, ...rest] = path;
				const node = this.get(key, true);
				if (identity.isCollection(node)) node.addIn(rest, value);
				else if (node === void 0 && this.schema) this.set(key, collectionFromPath(this.schema, rest, value));
				else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
			}
		}
		/**
		* Removes a value from the collection.
		* @returns `true` if the item was found and removed.
		*/
		deleteIn(path) {
			const [key, ...rest] = path;
			if (rest.length === 0) return this.delete(key);
			const node = this.get(key, true);
			if (identity.isCollection(node)) return node.deleteIn(rest);
			else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
		}
		/**
		* Returns item at `key`, or `undefined` if not found. By default unwraps
		* scalar values from their surrounding node; to disable set `keepScalar` to
		* `true` (collections are always returned intact).
		*/
		getIn(path, keepScalar) {
			const [key, ...rest] = path;
			const node = this.get(key, true);
			if (rest.length === 0) return !keepScalar && identity.isScalar(node) ? node.value : node;
			else return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
		}
		hasAllNullValues(allowScalar) {
			return this.items.every((node) => {
				if (!identity.isPair(node)) return false;
				const n = node.value;
				return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
			});
		}
		/**
		* Checks if the collection includes a value with the key `key`.
		*/
		hasIn(path) {
			const [key, ...rest] = path;
			if (rest.length === 0) return this.has(key);
			const node = this.get(key, true);
			return identity.isCollection(node) ? node.hasIn(rest) : false;
		}
		/**
		* Sets a value in this collection. For `!!set`, `value` needs to be a
		* boolean to add/remove the item from the set.
		*/
		setIn(path, value) {
			const [key, ...rest] = path;
			if (rest.length === 0) this.set(key, value);
			else {
				const node = this.get(key, true);
				if (identity.isCollection(node)) node.setIn(rest, value);
				else if (node === void 0 && this.schema) this.set(key, collectionFromPath(this.schema, rest, value));
				else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
			}
		}
	};
	exports.Collection = Collection;
	exports.collectionFromPath = collectionFromPath;
	exports.isEmptyPath = isEmptyPath;
}));

//#endregion
//#region ../../node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Stringifies a comment.
	*
	* Empty comment lines are left empty,
	* lines consisting of a single space are replaced by `#`,
	* and all other lines are prefixed with a `#`.
	*/
	const stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
	function indentComment(comment, indent) {
		if (/^\n+$/.test(comment)) return comment.substring(1);
		return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
	}
	const lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
	exports.indentComment = indentComment;
	exports.lineComment = lineComment;
	exports.stringifyComment = stringifyComment;
}));

//#endregion
//#region ../../node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = /* @__PURE__ */ __commonJSMin(((exports) => {
	const FOLD_FLOW = "flow";
	const FOLD_BLOCK = "block";
	const FOLD_QUOTED = "quoted";
	/**
	* Tries to keep input at up to `lineWidth` characters, splitting only on spaces
	* not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
	* terminated with `\n` and started with `indent`.
	*/
	function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
		if (!lineWidth || lineWidth < 0) return text;
		if (lineWidth < minContentWidth) minContentWidth = 0;
		const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
		if (text.length <= endStep) return text;
		const folds = [];
		const escapedFolds = {};
		let end = lineWidth - indent.length;
		if (typeof indentAtStart === "number") if (indentAtStart > lineWidth - Math.max(2, minContentWidth)) folds.push(0);
		else end = lineWidth - indentAtStart;
		let split = void 0;
		let prev = void 0;
		let overflow = false;
		let i = -1;
		let escStart = -1;
		let escEnd = -1;
		if (mode === FOLD_BLOCK) {
			i = consumeMoreIndentedLines(text, i, indent.length);
			if (i !== -1) end = i + endStep;
		}
		for (let ch; ch = text[i += 1];) {
			if (mode === FOLD_QUOTED && ch === "\\") {
				escStart = i;
				switch (text[i + 1]) {
					case "x":
						i += 3;
						break;
					case "u":
						i += 5;
						break;
					case "U":
						i += 9;
						break;
					default: i += 1;
				}
				escEnd = i;
			}
			if (ch === "\n") {
				if (mode === FOLD_BLOCK) i = consumeMoreIndentedLines(text, i, indent.length);
				end = i + indent.length + endStep;
				split = void 0;
			} else {
				if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
					const next = text[i + 1];
					if (next && next !== " " && next !== "\n" && next !== "	") split = i;
				}
				if (i >= end) if (split) {
					folds.push(split);
					end = split + endStep;
					split = void 0;
				} else if (mode === FOLD_QUOTED) {
					while (prev === " " || prev === "	") {
						prev = ch;
						ch = text[i += 1];
						overflow = true;
					}
					const j = i > escEnd + 1 ? i - 2 : escStart - 1;
					if (escapedFolds[j]) return text;
					folds.push(j);
					escapedFolds[j] = true;
					end = j + endStep;
					split = void 0;
				} else overflow = true;
			}
			prev = ch;
		}
		if (overflow && onOverflow) onOverflow();
		if (folds.length === 0) return text;
		if (onFold) onFold();
		let res = text.slice(0, folds[0]);
		for (let i = 0; i < folds.length; ++i) {
			const fold = folds[i];
			const end = folds[i + 1] || text.length;
			if (fold === 0) res = `\n${indent}${text.slice(0, end)}`;
			else {
				if (mode === FOLD_QUOTED && escapedFolds[fold]) res += `${text[fold]}\\`;
				res += `\n${indent}${text.slice(fold + 1, end)}`;
			}
		}
		return res;
	}
	/**
	* Presumes `i + 1` is at the start of a line
	* @returns index of last newline in more-indented block
	*/
	function consumeMoreIndentedLines(text, i, indent) {
		let end = i;
		let start = i + 1;
		let ch = text[start];
		while (ch === " " || ch === "	") if (i < start + indent) ch = text[++i];
		else {
			do
				ch = text[++i];
			while (ch && ch !== "\n");
			end = i;
			start = i + 1;
			ch = text[start];
		}
		return end;
	}
	exports.FOLD_BLOCK = FOLD_BLOCK;
	exports.FOLD_FLOW = FOLD_FLOW;
	exports.FOLD_QUOTED = FOLD_QUOTED;
	exports.foldFlowLines = foldFlowLines;
}));

//#endregion
//#region ../../node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	var foldFlowLines = require_foldFlowLines();
	const getFoldOptions = (ctx, isBlock) => ({
		indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
		lineWidth: ctx.options.lineWidth,
		minContentWidth: ctx.options.minContentWidth
	});
	const containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
	function lineLengthOverLimit(str, lineWidth, indentLength) {
		if (!lineWidth || lineWidth < 0) return false;
		const limit = lineWidth - indentLength;
		const strLen = str.length;
		if (strLen <= limit) return false;
		for (let i = 0, start = 0; i < strLen; ++i) if (str[i] === "\n") {
			if (i - start > limit) return true;
			start = i + 1;
			if (strLen - start <= limit) return false;
		}
		return true;
	}
	function doubleQuotedString(value, ctx) {
		const json = JSON.stringify(value);
		if (ctx.options.doubleQuotedAsJSON) return json;
		const { implicitKey } = ctx;
		const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
		const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
		let str = "";
		let start = 0;
		for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
			if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
				str += json.slice(start, i) + "\\ ";
				i += 1;
				start = i;
				ch = "\\";
			}
			if (ch === "\\") switch (json[i + 1]) {
				case "u":
					{
						str += json.slice(start, i);
						const code = json.substr(i + 2, 4);
						switch (code) {
							case "0000":
								str += "\\0";
								break;
							case "0007":
								str += "\\a";
								break;
							case "000b":
								str += "\\v";
								break;
							case "001b":
								str += "\\e";
								break;
							case "0085":
								str += "\\N";
								break;
							case "00a0":
								str += "\\_";
								break;
							case "2028":
								str += "\\L";
								break;
							case "2029":
								str += "\\P";
								break;
							default: if (code.substr(0, 2) === "00") str += "\\x" + code.substr(2);
							else str += json.substr(i, 6);
						}
						i += 5;
						start = i + 1;
					}
					break;
				case "n":
					if (implicitKey || json[i + 2] === "\"" || json.length < minMultiLineLength) i += 1;
					else {
						str += json.slice(start, i) + "\n\n";
						while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== "\"") {
							str += "\n";
							i += 2;
						}
						str += indent;
						if (json[i + 2] === " ") str += "\\";
						i += 1;
						start = i + 1;
					}
					break;
				default: i += 1;
			}
		}
		str = start ? str + json.slice(start) : json;
		return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
	}
	function singleQuotedString(value, ctx) {
		if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, ctx);
		const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
		const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
		return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
	}
	function quotedString(value, ctx) {
		const { singleQuote } = ctx.options;
		let qs;
		if (singleQuote === false) qs = doubleQuotedString;
		else {
			const hasDouble = value.includes("\"");
			const hasSingle = value.includes("'");
			if (hasDouble && !hasSingle) qs = singleQuotedString;
			else if (hasSingle && !hasDouble) qs = doubleQuotedString;
			else qs = singleQuote ? singleQuotedString : doubleQuotedString;
		}
		return qs(value, ctx);
	}
	let blockEndNewlines;
	try {
		blockEndNewlines = /* @__PURE__ */ new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
	} catch {
		blockEndNewlines = /\n+(?!\n|$)/g;
	}
	function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
		const { blockQuote, commentString, lineWidth } = ctx.options;
		if (!blockQuote || /\n[\t ]+$/.test(value)) return quotedString(value, ctx);
		const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
		const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
		if (!value) return literal ? "|\n" : ">\n";
		let chomp;
		let endStart;
		for (endStart = value.length; endStart > 0; --endStart) {
			const ch = value[endStart - 1];
			if (ch !== "\n" && ch !== "	" && ch !== " ") break;
		}
		let end = value.substring(endStart);
		const endNlPos = end.indexOf("\n");
		if (endNlPos === -1) chomp = "-";
		else if (value === end || endNlPos !== end.length - 1) {
			chomp = "+";
			if (onChompKeep) onChompKeep();
		} else chomp = "";
		if (end) {
			value = value.slice(0, -end.length);
			if (end[end.length - 1] === "\n") end = end.slice(0, -1);
			end = end.replace(blockEndNewlines, `$&${indent}`);
		}
		let startWithSpace = false;
		let startEnd;
		let startNlPos = -1;
		for (startEnd = 0; startEnd < value.length; ++startEnd) {
			const ch = value[startEnd];
			if (ch === " ") startWithSpace = true;
			else if (ch === "\n") startNlPos = startEnd;
			else break;
		}
		let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
		if (start) {
			value = value.substring(start.length);
			start = start.replace(/\n+/g, `$&${indent}`);
		}
		let header = (startWithSpace ? indent ? "2" : "1" : "") + chomp;
		if (comment) {
			header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
			if (onComment) onComment();
		}
		if (!literal) {
			const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
			let literalFallback = false;
			const foldOptions = getFoldOptions(ctx, true);
			if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) foldOptions.onOverflow = () => {
				literalFallback = true;
			};
			const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
			if (!literalFallback) return `>${header}\n${indent}${body}`;
		}
		value = value.replace(/\n+/g, `$&${indent}`);
		return `|${header}\n${indent}${start}${value}${end}`;
	}
	function plainString(item, ctx, onComment, onChompKeep) {
		const { type, value } = item;
		const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
		if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) return quotedString(value, ctx);
		if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
		if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) return blockString(item, ctx, onComment, onChompKeep);
		if (containsDocumentMarker(value)) {
			if (indent === "") {
				ctx.forceBlockIndent = true;
				return blockString(item, ctx, onComment, onChompKeep);
			} else if (implicitKey && indent === indentStep) return quotedString(value, ctx);
		}
		const str = value.replace(/\n+/g, `$&\n${indent}`);
		if (actualString) {
			const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
			const { compat, tags } = ctx.doc.schema;
			if (tags.some(test) || compat?.some(test)) return quotedString(value, ctx);
		}
		return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
	}
	function stringifyString(item, ctx, onComment, onChompKeep) {
		const { implicitKey, inFlow } = ctx;
		const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
		let { type } = item;
		if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
			if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value)) type = Scalar.Scalar.QUOTE_DOUBLE;
		}
		const _stringify = (_type) => {
			switch (_type) {
				case Scalar.Scalar.BLOCK_FOLDED:
				case Scalar.Scalar.BLOCK_LITERAL: return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
				case Scalar.Scalar.QUOTE_DOUBLE: return doubleQuotedString(ss.value, ctx);
				case Scalar.Scalar.QUOTE_SINGLE: return singleQuotedString(ss.value, ctx);
				case Scalar.Scalar.PLAIN: return plainString(ss, ctx, onComment, onChompKeep);
				default: return null;
			}
		};
		let res = _stringify(type);
		if (res === null) {
			const { defaultKeyType, defaultStringType } = ctx.options;
			const t = implicitKey && defaultKeyType || defaultStringType;
			res = _stringify(t);
			if (res === null) throw new Error(`Unsupported default string type ${t}`);
		}
		return res;
	}
	exports.stringifyString = stringifyString;
}));

//#endregion
//#region ../../node_modules/yaml/dist/stringify/stringify.js
var require_stringify = /* @__PURE__ */ __commonJSMin(((exports) => {
	var anchors = require_anchors();
	var identity = require_identity();
	var stringifyComment = require_stringifyComment();
	var stringifyString = require_stringifyString();
	function createStringifyContext(doc, options) {
		const opt = Object.assign({
			blockQuote: true,
			commentString: stringifyComment.stringifyComment,
			defaultKeyType: null,
			defaultStringType: "PLAIN",
			directives: null,
			doubleQuotedAsJSON: false,
			doubleQuotedMinMultiLineLength: 40,
			falseStr: "false",
			flowCollectionPadding: true,
			indentSeq: true,
			lineWidth: 80,
			minContentWidth: 20,
			nullStr: "null",
			simpleKeys: false,
			singleQuote: null,
			trueStr: "true",
			verifyAliasOrder: true
		}, doc.schema.toStringOptions, options);
		let inFlow;
		switch (opt.collectionStyle) {
			case "block":
				inFlow = false;
				break;
			case "flow":
				inFlow = true;
				break;
			default: inFlow = null;
		}
		return {
			anchors: /* @__PURE__ */ new Set(),
			doc,
			flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
			indent: "",
			indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
			inFlow,
			options: opt
		};
	}
	function getTagObject(tags, item) {
		if (item.tag) {
			const match = tags.filter((t) => t.tag === item.tag);
			if (match.length > 0) return match.find((t) => t.format === item.format) ?? match[0];
		}
		let tagObj = void 0;
		let obj;
		if (identity.isScalar(item)) {
			obj = item.value;
			let match = tags.filter((t) => t.identify?.(obj));
			if (match.length > 1) {
				const testMatch = match.filter((t) => t.test);
				if (testMatch.length > 0) match = testMatch;
			}
			tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
		} else {
			obj = item;
			tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
		}
		if (!tagObj) {
			const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
			throw new Error(`Tag not resolved for ${name} value`);
		}
		return tagObj;
	}
	function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
		if (!doc.directives) return "";
		const props = [];
		const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
		if (anchor && anchors.anchorIsValid(anchor)) {
			anchors$1.add(anchor);
			props.push(`&${anchor}`);
		}
		const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
		if (tag) props.push(doc.directives.tagString(tag));
		return props.join(" ");
	}
	function stringify(item, ctx, onComment, onChompKeep) {
		if (identity.isPair(item)) return item.toString(ctx, onComment, onChompKeep);
		if (identity.isAlias(item)) {
			if (ctx.doc.directives) return item.toString(ctx);
			if (ctx.resolvedAliases?.has(item)) throw new TypeError(`Cannot stringify circular structure without alias nodes`);
			else {
				if (ctx.resolvedAliases) ctx.resolvedAliases.add(item);
				else ctx.resolvedAliases = new Set([item]);
				item = item.resolve(ctx.doc);
			}
		}
		let tagObj = void 0;
		const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
		tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
		const props = stringifyProps(node, tagObj, ctx);
		if (props.length > 0) ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
		const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
		if (!props) return str;
		return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}\n${ctx.indent}${str}`;
	}
	exports.createStringifyContext = createStringifyContext;
	exports.stringify = stringify;
}));

//#endregion
//#region ../../node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var Scalar = require_Scalar();
	var stringify = require_stringify();
	var stringifyComment = require_stringifyComment();
	function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
		const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
		let keyComment = identity.isNode(key) && key.comment || null;
		if (simpleKeys) {
			if (keyComment) throw new Error("With simple keys, key nodes cannot have comments");
			if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") throw new Error("With simple keys, collection cannot be used as a key value");
		}
		let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
		ctx = Object.assign({}, ctx, {
			allNullValues: false,
			implicitKey: !explicitKey && (simpleKeys || !allNullValues),
			indent: indent + indentStep
		});
		let keyCommentDone = false;
		let chompKeep = false;
		let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
		if (!explicitKey && !ctx.inFlow && str.length > 1024) {
			if (simpleKeys) throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
			explicitKey = true;
		}
		if (ctx.inFlow) {
			if (allNullValues || value == null) {
				if (keyCommentDone && onComment) onComment();
				return str === "" ? "?" : explicitKey ? `? ${str}` : str;
			}
		} else if (allNullValues && !simpleKeys || value == null && explicitKey) {
			str = `? ${str}`;
			if (keyComment && !keyCommentDone) str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
			else if (chompKeep && onChompKeep) onChompKeep();
			return str;
		}
		if (keyCommentDone) keyComment = null;
		if (explicitKey) {
			if (keyComment) str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
			str = `? ${str}\n${indent}:`;
		} else {
			str = `${str}:`;
			if (keyComment) str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
		}
		let vsb, vcb, valueComment;
		if (identity.isNode(value)) {
			vsb = !!value.spaceBefore;
			vcb = value.commentBefore;
			valueComment = value.comment;
		} else {
			vsb = false;
			vcb = null;
			valueComment = null;
			if (value && typeof value === "object") value = doc.createNode(value);
		}
		ctx.implicitKey = false;
		if (!explicitKey && !keyComment && identity.isScalar(value)) ctx.indentAtStart = str.length + 1;
		chompKeep = false;
		if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) ctx.indent = ctx.indent.substring(2);
		let valueCommentDone = false;
		const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
		let ws = " ";
		if (keyComment || vsb || vcb) {
			ws = vsb ? "\n" : "";
			if (vcb) {
				const cs = commentString(vcb);
				ws += `\n${stringifyComment.indentComment(cs, ctx.indent)}`;
			}
			if (valueStr === "" && !ctx.inFlow) {
				if (ws === "\n" && valueComment) ws = "\n\n";
			} else ws += `\n${ctx.indent}`;
		} else if (!explicitKey && identity.isCollection(value)) {
			const vs0 = valueStr[0];
			const nl0 = valueStr.indexOf("\n");
			const hasNewline = nl0 !== -1;
			const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
			if (hasNewline || !flow) {
				let hasPropsLine = false;
				if (hasNewline && (vs0 === "&" || vs0 === "!")) {
					let sp0 = valueStr.indexOf(" ");
					if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") sp0 = valueStr.indexOf(" ", sp0 + 1);
					if (sp0 === -1 || nl0 < sp0) hasPropsLine = true;
				}
				if (!hasPropsLine) ws = `\n${ctx.indent}`;
			}
		} else if (valueStr === "" || valueStr[0] === "\n") ws = "";
		str += ws + valueStr;
		if (ctx.inFlow) {
			if (valueCommentDone && onComment) onComment();
		} else if (valueComment && !valueCommentDone) str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
		else if (chompKeep && onChompKeep) onChompKeep();
		return str;
	}
	exports.stringifyPair = stringifyPair;
}));

//#endregion
//#region ../../node_modules/yaml/dist/log.js
var require_log = /* @__PURE__ */ __commonJSMin(((exports) => {
	var node_process$3 = require("process");
	function debug(logLevel, ...messages) {
		if (logLevel === "debug") console.log(...messages);
	}
	function warn(logLevel, warning) {
		if (logLevel === "debug" || logLevel === "warn") if (typeof node_process$3.emitWarning === "function") node_process$3.emitWarning(warning);
		else console.warn(warning);
	}
	exports.debug = debug;
	exports.warn = warn;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var Scalar = require_Scalar();
	const MERGE_KEY = "<<";
	const merge = {
		identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
		default: "key",
		tag: "tag:yaml.org,2002:merge",
		test: /^<<$/,
		resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), { addToJSMap: addMergeToJSMap }),
		stringify: () => MERGE_KEY
	};
	const isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
	function addMergeToJSMap(ctx, map, value) {
		value = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
		if (identity.isSeq(value)) for (const it of value.items) mergeValue(ctx, map, it);
		else if (Array.isArray(value)) for (const it of value) mergeValue(ctx, map, it);
		else mergeValue(ctx, map, value);
	}
	function mergeValue(ctx, map, value) {
		const source = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
		if (!identity.isMap(source)) throw new Error("Merge sources must be maps or map aliases");
		const srcMap = source.toJSON(null, ctx, Map);
		for (const [key, value] of srcMap) if (map instanceof Map) {
			if (!map.has(key)) map.set(key, value);
		} else if (map instanceof Set) map.add(key);
		else if (!Object.prototype.hasOwnProperty.call(map, key)) Object.defineProperty(map, key, {
			value,
			writable: true,
			enumerable: true,
			configurable: true
		});
		return map;
	}
	exports.addMergeToJSMap = addMergeToJSMap;
	exports.isMergeKey = isMergeKey;
	exports.merge = merge;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = /* @__PURE__ */ __commonJSMin(((exports) => {
	var log = require_log();
	var merge = require_merge();
	var stringify = require_stringify();
	var identity = require_identity();
	var toJS = require_toJS();
	function addPairToJSMap(ctx, map, { key, value }) {
		if (identity.isNode(key) && key.addToJSMap) key.addToJSMap(ctx, map, value);
		else if (merge.isMergeKey(ctx, key)) merge.addMergeToJSMap(ctx, map, value);
		else {
			const jsKey = toJS.toJS(key, "", ctx);
			if (map instanceof Map) map.set(jsKey, toJS.toJS(value, jsKey, ctx));
			else if (map instanceof Set) map.add(jsKey);
			else {
				const stringKey = stringifyKey(key, jsKey, ctx);
				const jsValue = toJS.toJS(value, stringKey, ctx);
				if (stringKey in map) Object.defineProperty(map, stringKey, {
					value: jsValue,
					writable: true,
					enumerable: true,
					configurable: true
				});
				else map[stringKey] = jsValue;
			}
		}
		return map;
	}
	function stringifyKey(key, jsKey, ctx) {
		if (jsKey === null) return "";
		if (typeof jsKey !== "object") return String(jsKey);
		if (identity.isNode(key) && ctx?.doc) {
			const strCtx = stringify.createStringifyContext(ctx.doc, {});
			strCtx.anchors = /* @__PURE__ */ new Set();
			for (const node of ctx.anchors.keys()) strCtx.anchors.add(node.anchor);
			strCtx.inFlow = true;
			strCtx.inStringifyKey = true;
			const strKey = key.toString(strCtx);
			if (!ctx.mapKeyWarned) {
				let jsonStr = JSON.stringify(strKey);
				if (jsonStr.length > 40) jsonStr = jsonStr.substring(0, 36) + "...\"";
				log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
				ctx.mapKeyWarned = true;
			}
			return strKey;
		}
		return JSON.stringify(jsKey);
	}
	exports.addPairToJSMap = addPairToJSMap;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/Pair.js
var require_Pair = /* @__PURE__ */ __commonJSMin(((exports) => {
	var createNode = require_createNode();
	var stringifyPair = require_stringifyPair();
	var addPairToJSMap = require_addPairToJSMap();
	var identity = require_identity();
	function createPair(key, value, ctx) {
		return new Pair(createNode.createNode(key, void 0, ctx), createNode.createNode(value, void 0, ctx));
	}
	var Pair = class Pair {
		constructor(key, value = null) {
			Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
			this.key = key;
			this.value = value;
		}
		clone(schema) {
			let { key, value } = this;
			if (identity.isNode(key)) key = key.clone(schema);
			if (identity.isNode(value)) value = value.clone(schema);
			return new Pair(key, value);
		}
		toJSON(_, ctx) {
			const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
			return addPairToJSMap.addPairToJSMap(ctx, pair, this);
		}
		toString(ctx, onComment, onChompKeep) {
			return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
		}
	};
	exports.Pair = Pair;
	exports.createPair = createPair;
}));

//#endregion
//#region ../../node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var stringify = require_stringify();
	var stringifyComment = require_stringifyComment();
	function stringifyCollection(collection, ctx, options) {
		return (ctx.inFlow ?? collection.flow ? stringifyFlowCollection : stringifyBlockCollection)(collection, ctx, options);
	}
	function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
		const { indent, options: { commentString } } = ctx;
		const itemCtx = Object.assign({}, ctx, {
			indent: itemIndent,
			type: null
		});
		let chompKeep = false;
		const lines = [];
		for (let i = 0; i < items.length; ++i) {
			const item = items[i];
			let comment = null;
			if (identity.isNode(item)) {
				if (!chompKeep && item.spaceBefore) lines.push("");
				addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
				if (item.comment) comment = item.comment;
			} else if (identity.isPair(item)) {
				const ik = identity.isNode(item.key) ? item.key : null;
				if (ik) {
					if (!chompKeep && ik.spaceBefore) lines.push("");
					addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
				}
			}
			chompKeep = false;
			let str = stringify.stringify(item, itemCtx, () => comment = null, () => chompKeep = true);
			if (comment) str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
			if (chompKeep && comment) chompKeep = false;
			lines.push(blockItemPrefix + str);
		}
		let str;
		if (lines.length === 0) str = flowChars.start + flowChars.end;
		else {
			str = lines[0];
			for (let i = 1; i < lines.length; ++i) {
				const line = lines[i];
				str += line ? `\n${indent}${line}` : "\n";
			}
		}
		if (comment) {
			str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
			if (onComment) onComment();
		} else if (chompKeep && onChompKeep) onChompKeep();
		return str;
	}
	function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
		const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
		itemIndent += indentStep;
		const itemCtx = Object.assign({}, ctx, {
			indent: itemIndent,
			inFlow: true,
			type: null
		});
		let reqNewline = false;
		let linesAtValue = 0;
		const lines = [];
		for (let i = 0; i < items.length; ++i) {
			const item = items[i];
			let comment = null;
			if (identity.isNode(item)) {
				if (item.spaceBefore) lines.push("");
				addCommentBefore(ctx, lines, item.commentBefore, false);
				if (item.comment) comment = item.comment;
			} else if (identity.isPair(item)) {
				const ik = identity.isNode(item.key) ? item.key : null;
				if (ik) {
					if (ik.spaceBefore) lines.push("");
					addCommentBefore(ctx, lines, ik.commentBefore, false);
					if (ik.comment) reqNewline = true;
				}
				const iv = identity.isNode(item.value) ? item.value : null;
				if (iv) {
					if (iv.comment) comment = iv.comment;
					if (iv.commentBefore) reqNewline = true;
				} else if (item.value == null && ik?.comment) comment = ik.comment;
			}
			if (comment) reqNewline = true;
			let str = stringify.stringify(item, itemCtx, () => comment = null);
			if (i < items.length - 1) str += ",";
			if (comment) str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
			if (!reqNewline && (lines.length > linesAtValue || str.includes("\n"))) reqNewline = true;
			lines.push(str);
			linesAtValue = lines.length;
		}
		const { start, end } = flowChars;
		if (lines.length === 0) return start + end;
		else {
			if (!reqNewline) {
				const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
				reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
			}
			if (reqNewline) {
				let str = start;
				for (const line of lines) str += line ? `\n${indentStep}${indent}${line}` : "\n";
				return `${str}\n${indent}${end}`;
			} else return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
		}
	}
	function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
		if (comment && chompKeep) comment = comment.replace(/^\n+/, "");
		if (comment) {
			const ic = stringifyComment.indentComment(commentString(comment), indent);
			lines.push(ic.trimStart());
		}
	}
	exports.stringifyCollection = stringifyCollection;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = /* @__PURE__ */ __commonJSMin(((exports) => {
	var stringifyCollection = require_stringifyCollection();
	var addPairToJSMap = require_addPairToJSMap();
	var Collection = require_Collection();
	var identity = require_identity();
	var Pair = require_Pair();
	var Scalar = require_Scalar();
	function findPair(items, key) {
		const k = identity.isScalar(key) ? key.value : key;
		for (const it of items) if (identity.isPair(it)) {
			if (it.key === key || it.key === k) return it;
			if (identity.isScalar(it.key) && it.key.value === k) return it;
		}
	}
	var YAMLMap = class extends Collection.Collection {
		static get tagName() {
			return "tag:yaml.org,2002:map";
		}
		constructor(schema) {
			super(identity.MAP, schema);
			this.items = [];
		}
		/**
		* A generic collection parsing method that can be extended
		* to other node classes that inherit from YAMLMap
		*/
		static from(schema, obj, ctx) {
			const { keepUndefined, replacer } = ctx;
			const map = new this(schema);
			const add = (key, value) => {
				if (typeof replacer === "function") value = replacer.call(obj, key, value);
				else if (Array.isArray(replacer) && !replacer.includes(key)) return;
				if (value !== void 0 || keepUndefined) map.items.push(Pair.createPair(key, value, ctx));
			};
			if (obj instanceof Map) for (const [key, value] of obj) add(key, value);
			else if (obj && typeof obj === "object") for (const key of Object.keys(obj)) add(key, obj[key]);
			if (typeof schema.sortMapEntries === "function") map.items.sort(schema.sortMapEntries);
			return map;
		}
		/**
		* Adds a value to the collection.
		*
		* @param overwrite - If not set `true`, using a key that is already in the
		*   collection will throw. Otherwise, overwrites the previous value.
		*/
		add(pair, overwrite) {
			let _pair;
			if (identity.isPair(pair)) _pair = pair;
			else if (!pair || typeof pair !== "object" || !("key" in pair)) _pair = new Pair.Pair(pair, pair?.value);
			else _pair = new Pair.Pair(pair.key, pair.value);
			const prev = findPair(this.items, _pair.key);
			const sortEntries = this.schema?.sortMapEntries;
			if (prev) {
				if (!overwrite) throw new Error(`Key ${_pair.key} already set`);
				if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value)) prev.value.value = _pair.value;
				else prev.value = _pair.value;
			} else if (sortEntries) {
				const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
				if (i === -1) this.items.push(_pair);
				else this.items.splice(i, 0, _pair);
			} else this.items.push(_pair);
		}
		delete(key) {
			const it = findPair(this.items, key);
			if (!it) return false;
			return this.items.splice(this.items.indexOf(it), 1).length > 0;
		}
		get(key, keepScalar) {
			const node = findPair(this.items, key)?.value;
			return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
		}
		has(key) {
			return !!findPair(this.items, key);
		}
		set(key, value) {
			this.add(new Pair.Pair(key, value), true);
		}
		/**
		* @param ctx - Conversion context, originally set in Document#toJS()
		* @param {Class} Type - If set, forces the returned collection type
		* @returns Instance of Type, Map, or Object
		*/
		toJSON(_, ctx, Type) {
			const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
			if (ctx?.onCreate) ctx.onCreate(map);
			for (const item of this.items) addPairToJSMap.addPairToJSMap(ctx, map, item);
			return map;
		}
		toString(ctx, onComment, onChompKeep) {
			if (!ctx) return JSON.stringify(this);
			for (const item of this.items) if (!identity.isPair(item)) throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
			if (!ctx.allNullValues && this.hasAllNullValues(false)) ctx = Object.assign({}, ctx, { allNullValues: true });
			return stringifyCollection.stringifyCollection(this, ctx, {
				blockItemPrefix: "",
				flowChars: {
					start: "{",
					end: "}"
				},
				itemIndent: ctx.indent || "",
				onChompKeep,
				onComment
			});
		}
	};
	exports.YAMLMap = YAMLMap;
	exports.findPair = findPair;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/common/map.js
var require_map = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var YAMLMap = require_YAMLMap();
	const map = {
		collection: "map",
		default: true,
		nodeClass: YAMLMap.YAMLMap,
		tag: "tag:yaml.org,2002:map",
		resolve(map, onError) {
			if (!identity.isMap(map)) onError("Expected a mapping for this tag");
			return map;
		},
		createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
	};
	exports.map = map;
}));

//#endregion
//#region ../../node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = /* @__PURE__ */ __commonJSMin(((exports) => {
	var createNode = require_createNode();
	var stringifyCollection = require_stringifyCollection();
	var Collection = require_Collection();
	var identity = require_identity();
	var Scalar = require_Scalar();
	var toJS = require_toJS();
	var YAMLSeq = class extends Collection.Collection {
		static get tagName() {
			return "tag:yaml.org,2002:seq";
		}
		constructor(schema) {
			super(identity.SEQ, schema);
			this.items = [];
		}
		add(value) {
			this.items.push(value);
		}
		/**
		* Removes a value from the collection.
		*
		* `key` must contain a representation of an integer for this to succeed.
		* It may be wrapped in a `Scalar`.
		*
		* @returns `true` if the item was found and removed.
		*/
		delete(key) {
			const idx = asItemIndex(key);
			if (typeof idx !== "number") return false;
			return this.items.splice(idx, 1).length > 0;
		}
		get(key, keepScalar) {
			const idx = asItemIndex(key);
			if (typeof idx !== "number") return void 0;
			const it = this.items[idx];
			return !keepScalar && identity.isScalar(it) ? it.value : it;
		}
		/**
		* Checks if the collection includes a value with the key `key`.
		*
		* `key` must contain a representation of an integer for this to succeed.
		* It may be wrapped in a `Scalar`.
		*/
		has(key) {
			const idx = asItemIndex(key);
			return typeof idx === "number" && idx < this.items.length;
		}
		/**
		* Sets a value in this collection. For `!!set`, `value` needs to be a
		* boolean to add/remove the item from the set.
		*
		* If `key` does not contain a representation of an integer, this will throw.
		* It may be wrapped in a `Scalar`.
		*/
		set(key, value) {
			const idx = asItemIndex(key);
			if (typeof idx !== "number") throw new Error(`Expected a valid index, not ${key}.`);
			const prev = this.items[idx];
			if (identity.isScalar(prev) && Scalar.isScalarValue(value)) prev.value = value;
			else this.items[idx] = value;
		}
		toJSON(_, ctx) {
			const seq = [];
			if (ctx?.onCreate) ctx.onCreate(seq);
			let i = 0;
			for (const item of this.items) seq.push(toJS.toJS(item, String(i++), ctx));
			return seq;
		}
		toString(ctx, onComment, onChompKeep) {
			if (!ctx) return JSON.stringify(this);
			return stringifyCollection.stringifyCollection(this, ctx, {
				blockItemPrefix: "- ",
				flowChars: {
					start: "[",
					end: "]"
				},
				itemIndent: (ctx.indent || "") + "  ",
				onChompKeep,
				onComment
			});
		}
		static from(schema, obj, ctx) {
			const { replacer } = ctx;
			const seq = new this(schema);
			if (obj && Symbol.iterator in Object(obj)) {
				let i = 0;
				for (let it of obj) {
					if (typeof replacer === "function") {
						const key = obj instanceof Set ? it : String(i++);
						it = replacer.call(obj, key, it);
					}
					seq.items.push(createNode.createNode(it, void 0, ctx));
				}
			}
			return seq;
		}
	};
	function asItemIndex(key) {
		let idx = identity.isScalar(key) ? key.value : key;
		if (idx && typeof idx === "string") idx = Number(idx);
		return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
	}
	exports.YAMLSeq = YAMLSeq;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/common/seq.js
var require_seq = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var YAMLSeq = require_YAMLSeq();
	const seq = {
		collection: "seq",
		default: true,
		nodeClass: YAMLSeq.YAMLSeq,
		tag: "tag:yaml.org,2002:seq",
		resolve(seq, onError) {
			if (!identity.isSeq(seq)) onError("Expected a sequence for this tag");
			return seq;
		},
		createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
	};
	exports.seq = seq;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/common/string.js
var require_string = /* @__PURE__ */ __commonJSMin(((exports) => {
	var stringifyString = require_stringifyString();
	const string = {
		identify: (value) => typeof value === "string",
		default: true,
		tag: "tag:yaml.org,2002:str",
		resolve: (str) => str,
		stringify(item, ctx, onComment, onChompKeep) {
			ctx = Object.assign({ actualString: true }, ctx);
			return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
		}
	};
	exports.string = string;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/common/null.js
var require_null = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	const nullTag = {
		identify: (value) => value == null,
		createNode: () => new Scalar.Scalar(null),
		default: true,
		tag: "tag:yaml.org,2002:null",
		test: /^(?:~|[Nn]ull|NULL)?$/,
		resolve: () => new Scalar.Scalar(null),
		stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
	};
	exports.nullTag = nullTag;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/core/bool.js
var require_bool$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	const boolTag = {
		identify: (value) => typeof value === "boolean",
		default: true,
		tag: "tag:yaml.org,2002:bool",
		test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
		resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
		stringify({ source, value }, ctx) {
			if (source && boolTag.test.test(source)) {
				if (value === (source[0] === "t" || source[0] === "T")) return source;
			}
			return value ? ctx.options.trueStr : ctx.options.falseStr;
		}
	};
	exports.boolTag = boolTag;
}));

//#endregion
//#region ../../node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = /* @__PURE__ */ __commonJSMin(((exports) => {
	function stringifyNumber({ format, minFractionDigits, tag, value }) {
		if (typeof value === "bigint") return String(value);
		const num = typeof value === "number" ? value : Number(value);
		if (!isFinite(num)) return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
		let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
		if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^\d/.test(n)) {
			let i = n.indexOf(".");
			if (i < 0) {
				i = n.length;
				n += ".";
			}
			let d = minFractionDigits - (n.length - i - 1);
			while (d-- > 0) n += "0";
		}
		return n;
	}
	exports.stringifyNumber = stringifyNumber;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/core/float.js
var require_float$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	var stringifyNumber = require_stringifyNumber();
	const floatNaN = {
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
		resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
		stringify: stringifyNumber.stringifyNumber
	};
	const floatExp = {
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		format: "EXP",
		test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
		resolve: (str) => parseFloat(str),
		stringify(node) {
			const num = Number(node.value);
			return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
		}
	};
	const float = {
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
		resolve(str) {
			const node = new Scalar.Scalar(parseFloat(str));
			const dot = str.indexOf(".");
			if (dot !== -1 && str[str.length - 1] === "0") node.minFractionDigits = str.length - dot - 1;
			return node;
		},
		stringify: stringifyNumber.stringifyNumber
	};
	exports.float = float;
	exports.floatExp = floatExp;
	exports.floatNaN = floatNaN;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/core/int.js
var require_int$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var stringifyNumber = require_stringifyNumber();
	const intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
	const intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
	function intStringify(node, radix, prefix) {
		const { value } = node;
		if (intIdentify(value) && value >= 0) return prefix + value.toString(radix);
		return stringifyNumber.stringifyNumber(node);
	}
	const intOct = {
		identify: (value) => intIdentify(value) && value >= 0,
		default: true,
		tag: "tag:yaml.org,2002:int",
		format: "OCT",
		test: /^0o[0-7]+$/,
		resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
		stringify: (node) => intStringify(node, 8, "0o")
	};
	const int = {
		identify: intIdentify,
		default: true,
		tag: "tag:yaml.org,2002:int",
		test: /^[-+]?[0-9]+$/,
		resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
		stringify: stringifyNumber.stringifyNumber
	};
	const intHex = {
		identify: (value) => intIdentify(value) && value >= 0,
		default: true,
		tag: "tag:yaml.org,2002:int",
		format: "HEX",
		test: /^0x[0-9a-fA-F]+$/,
		resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
		stringify: (node) => intStringify(node, 16, "0x")
	};
	exports.int = int;
	exports.intHex = intHex;
	exports.intOct = intOct;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/core/schema.js
var require_schema$2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var map = require_map();
	var _null = require_null();
	var seq = require_seq();
	var string = require_string();
	var bool = require_bool$1();
	var float = require_float$1();
	var int = require_int$1();
	const schema = [
		map.map,
		seq.seq,
		string.string,
		_null.nullTag,
		bool.boolTag,
		int.intOct,
		int.int,
		int.intHex,
		float.floatNaN,
		float.floatExp,
		float.float
	];
	exports.schema = schema;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/json/schema.js
var require_schema$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	var map = require_map();
	var seq = require_seq();
	function intIdentify(value) {
		return typeof value === "bigint" || Number.isInteger(value);
	}
	const stringifyJSON = ({ value }) => JSON.stringify(value);
	const jsonScalars = [
		{
			identify: (value) => typeof value === "string",
			default: true,
			tag: "tag:yaml.org,2002:str",
			resolve: (str) => str,
			stringify: stringifyJSON
		},
		{
			identify: (value) => value == null,
			createNode: () => new Scalar.Scalar(null),
			default: true,
			tag: "tag:yaml.org,2002:null",
			test: /^null$/,
			resolve: () => null,
			stringify: stringifyJSON
		},
		{
			identify: (value) => typeof value === "boolean",
			default: true,
			tag: "tag:yaml.org,2002:bool",
			test: /^true$|^false$/,
			resolve: (str) => str === "true",
			stringify: stringifyJSON
		},
		{
			identify: intIdentify,
			default: true,
			tag: "tag:yaml.org,2002:int",
			test: /^-?(?:0|[1-9][0-9]*)$/,
			resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
			stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
		},
		{
			identify: (value) => typeof value === "number",
			default: true,
			tag: "tag:yaml.org,2002:float",
			test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
			resolve: (str) => parseFloat(str),
			stringify: stringifyJSON
		}
	];
	const schema = [map.map, seq.seq].concat(jsonScalars, {
		default: true,
		tag: "",
		test: /^/,
		resolve(str, onError) {
			onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
			return str;
		}
	});
	exports.schema = schema;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = /* @__PURE__ */ __commonJSMin(((exports) => {
	var node_buffer$1 = require("buffer");
	var Scalar = require_Scalar();
	var stringifyString = require_stringifyString();
	const binary = {
		identify: (value) => value instanceof Uint8Array,
		default: false,
		tag: "tag:yaml.org,2002:binary",
		resolve(src, onError) {
			if (typeof node_buffer$1.Buffer === "function") return node_buffer$1.Buffer.from(src, "base64");
			else if (typeof atob === "function") {
				const str = atob(src.replace(/[\n\r]/g, ""));
				const buffer = new Uint8Array(str.length);
				for (let i = 0; i < str.length; ++i) buffer[i] = str.charCodeAt(i);
				return buffer;
			} else {
				onError("This environment does not support reading binary tags; either Buffer or atob is required");
				return src;
			}
		},
		stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
			if (!value) return "";
			const buf = value;
			let str;
			if (typeof node_buffer$1.Buffer === "function") str = buf instanceof node_buffer$1.Buffer ? buf.toString("base64") : node_buffer$1.Buffer.from(buf.buffer).toString("base64");
			else if (typeof btoa === "function") {
				let s = "";
				for (let i = 0; i < buf.length; ++i) s += String.fromCharCode(buf[i]);
				str = btoa(s);
			} else throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
			type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
			if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
				const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
				const n = Math.ceil(str.length / lineWidth);
				const lines = new Array(n);
				for (let i = 0, o = 0; i < n; ++i, o += lineWidth) lines[i] = str.substr(o, lineWidth);
				str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
			}
			return stringifyString.stringifyString({
				comment,
				type,
				value: str
			}, ctx, onComment, onChompKeep);
		}
	};
	exports.binary = binary;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var Pair = require_Pair();
	var Scalar = require_Scalar();
	var YAMLSeq = require_YAMLSeq();
	function resolvePairs(seq, onError) {
		if (identity.isSeq(seq)) for (let i = 0; i < seq.items.length; ++i) {
			let item = seq.items[i];
			if (identity.isPair(item)) continue;
			else if (identity.isMap(item)) {
				if (item.items.length > 1) onError("Each pair must have its own sequence indicator");
				const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
				if (item.commentBefore) pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}\n${pair.key.commentBefore}` : item.commentBefore;
				if (item.comment) {
					const cn = pair.value ?? pair.key;
					cn.comment = cn.comment ? `${item.comment}\n${cn.comment}` : item.comment;
				}
				item = pair;
			}
			seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
		}
		else onError("Expected a sequence for this tag");
		return seq;
	}
	function createPairs(schema, iterable, ctx) {
		const { replacer } = ctx;
		const pairs = new YAMLSeq.YAMLSeq(schema);
		pairs.tag = "tag:yaml.org,2002:pairs";
		let i = 0;
		if (iterable && Symbol.iterator in Object(iterable)) for (let it of iterable) {
			if (typeof replacer === "function") it = replacer.call(iterable, String(i++), it);
			let key, value;
			if (Array.isArray(it)) if (it.length === 2) {
				key = it[0];
				value = it[1];
			} else throw new TypeError(`Expected [key, value] tuple: ${it}`);
			else if (it && it instanceof Object) {
				const keys = Object.keys(it);
				if (keys.length === 1) {
					key = keys[0];
					value = it[key];
				} else throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
			} else key = it;
			pairs.items.push(Pair.createPair(key, value, ctx));
		}
		return pairs;
	}
	const pairs = {
		collection: "seq",
		default: false,
		tag: "tag:yaml.org,2002:pairs",
		resolve: resolvePairs,
		createNode: createPairs
	};
	exports.createPairs = createPairs;
	exports.pairs = pairs;
	exports.resolvePairs = resolvePairs;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var toJS = require_toJS();
	var YAMLMap = require_YAMLMap();
	var YAMLSeq = require_YAMLSeq();
	var pairs = require_pairs();
	var YAMLOMap = class YAMLOMap extends YAMLSeq.YAMLSeq {
		constructor() {
			super();
			this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
			this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
			this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
			this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
			this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
			this.tag = YAMLOMap.tag;
		}
		/**
		* If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
		* but TypeScript won't allow widening the signature of a child method.
		*/
		toJSON(_, ctx) {
			if (!ctx) return super.toJSON(_);
			const map = /* @__PURE__ */ new Map();
			if (ctx?.onCreate) ctx.onCreate(map);
			for (const pair of this.items) {
				let key, value;
				if (identity.isPair(pair)) {
					key = toJS.toJS(pair.key, "", ctx);
					value = toJS.toJS(pair.value, key, ctx);
				} else key = toJS.toJS(pair, "", ctx);
				if (map.has(key)) throw new Error("Ordered maps must not include duplicate keys");
				map.set(key, value);
			}
			return map;
		}
		static from(schema, iterable, ctx) {
			const pairs$1 = pairs.createPairs(schema, iterable, ctx);
			const omap = new this();
			omap.items = pairs$1.items;
			return omap;
		}
	};
	YAMLOMap.tag = "tag:yaml.org,2002:omap";
	const omap = {
		collection: "seq",
		identify: (value) => value instanceof Map,
		nodeClass: YAMLOMap,
		default: false,
		tag: "tag:yaml.org,2002:omap",
		resolve(seq, onError) {
			const pairs$1 = pairs.resolvePairs(seq, onError);
			const seenKeys = [];
			for (const { key } of pairs$1.items) if (identity.isScalar(key)) if (seenKeys.includes(key.value)) onError(`Ordered maps must not include duplicate keys: ${key.value}`);
			else seenKeys.push(key.value);
			return Object.assign(new YAMLOMap(), pairs$1);
		},
		createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
	};
	exports.YAMLOMap = YAMLOMap;
	exports.omap = omap;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	function boolStringify({ value, source }, ctx) {
		if (source && (value ? trueTag : falseTag).test.test(source)) return source;
		return value ? ctx.options.trueStr : ctx.options.falseStr;
	}
	const trueTag = {
		identify: (value) => value === true,
		default: true,
		tag: "tag:yaml.org,2002:bool",
		test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
		resolve: () => new Scalar.Scalar(true),
		stringify: boolStringify
	};
	const falseTag = {
		identify: (value) => value === false,
		default: true,
		tag: "tag:yaml.org,2002:bool",
		test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
		resolve: () => new Scalar.Scalar(false),
		stringify: boolStringify
	};
	exports.falseTag = falseTag;
	exports.trueTag = trueTag;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	var stringifyNumber = require_stringifyNumber();
	const floatNaN = {
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
		resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
		stringify: stringifyNumber.stringifyNumber
	};
	const floatExp = {
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		format: "EXP",
		test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
		resolve: (str) => parseFloat(str.replace(/_/g, "")),
		stringify(node) {
			const num = Number(node.value);
			return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
		}
	};
	const float = {
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
		resolve(str) {
			const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
			const dot = str.indexOf(".");
			if (dot !== -1) {
				const f = str.substring(dot + 1).replace(/_/g, "");
				if (f[f.length - 1] === "0") node.minFractionDigits = f.length;
			}
			return node;
		},
		stringify: stringifyNumber.stringifyNumber
	};
	exports.float = float;
	exports.floatExp = floatExp;
	exports.floatNaN = floatNaN;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int = /* @__PURE__ */ __commonJSMin(((exports) => {
	var stringifyNumber = require_stringifyNumber();
	const intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
	function intResolve(str, offset, radix, { intAsBigInt }) {
		const sign = str[0];
		if (sign === "-" || sign === "+") offset += 1;
		str = str.substring(offset).replace(/_/g, "");
		if (intAsBigInt) {
			switch (radix) {
				case 2:
					str = `0b${str}`;
					break;
				case 8:
					str = `0o${str}`;
					break;
				case 16:
					str = `0x${str}`;
					break;
			}
			const n = BigInt(str);
			return sign === "-" ? BigInt(-1) * n : n;
		}
		const n = parseInt(str, radix);
		return sign === "-" ? -1 * n : n;
	}
	function intStringify(node, radix, prefix) {
		const { value } = node;
		if (intIdentify(value)) {
			const str = value.toString(radix);
			return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
		}
		return stringifyNumber.stringifyNumber(node);
	}
	const intBin = {
		identify: intIdentify,
		default: true,
		tag: "tag:yaml.org,2002:int",
		format: "BIN",
		test: /^[-+]?0b[0-1_]+$/,
		resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
		stringify: (node) => intStringify(node, 2, "0b")
	};
	const intOct = {
		identify: intIdentify,
		default: true,
		tag: "tag:yaml.org,2002:int",
		format: "OCT",
		test: /^[-+]?0[0-7_]+$/,
		resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
		stringify: (node) => intStringify(node, 8, "0")
	};
	const int = {
		identify: intIdentify,
		default: true,
		tag: "tag:yaml.org,2002:int",
		test: /^[-+]?[0-9][0-9_]*$/,
		resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
		stringify: stringifyNumber.stringifyNumber
	};
	const intHex = {
		identify: intIdentify,
		default: true,
		tag: "tag:yaml.org,2002:int",
		format: "HEX",
		test: /^[-+]?0x[0-9a-fA-F_]+$/,
		resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
		stringify: (node) => intStringify(node, 16, "0x")
	};
	exports.int = int;
	exports.intBin = intBin;
	exports.intHex = intHex;
	exports.intOct = intOct;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var Pair = require_Pair();
	var YAMLMap = require_YAMLMap();
	var YAMLSet = class YAMLSet extends YAMLMap.YAMLMap {
		constructor(schema) {
			super(schema);
			this.tag = YAMLSet.tag;
		}
		add(key) {
			let pair;
			if (identity.isPair(key)) pair = key;
			else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null) pair = new Pair.Pair(key.key, null);
			else pair = new Pair.Pair(key, null);
			if (!YAMLMap.findPair(this.items, pair.key)) this.items.push(pair);
		}
		/**
		* If `keepPair` is `true`, returns the Pair matching `key`.
		* Otherwise, returns the value of that Pair's key.
		*/
		get(key, keepPair) {
			const pair = YAMLMap.findPair(this.items, key);
			return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
		}
		set(key, value) {
			if (typeof value !== "boolean") throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
			const prev = YAMLMap.findPair(this.items, key);
			if (prev && !value) this.items.splice(this.items.indexOf(prev), 1);
			else if (!prev && value) this.items.push(new Pair.Pair(key));
		}
		toJSON(_, ctx) {
			return super.toJSON(_, ctx, Set);
		}
		toString(ctx, onComment, onChompKeep) {
			if (!ctx) return JSON.stringify(this);
			if (this.hasAllNullValues(true)) return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
			else throw new Error("Set items must all have null values");
		}
		static from(schema, iterable, ctx) {
			const { replacer } = ctx;
			const set = new this(schema);
			if (iterable && Symbol.iterator in Object(iterable)) for (let value of iterable) {
				if (typeof replacer === "function") value = replacer.call(iterable, value, value);
				set.items.push(Pair.createPair(value, null, ctx));
			}
			return set;
		}
	};
	YAMLSet.tag = "tag:yaml.org,2002:set";
	const set = {
		collection: "map",
		identify: (value) => value instanceof Set,
		nodeClass: YAMLSet,
		default: false,
		tag: "tag:yaml.org,2002:set",
		createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
		resolve(map, onError) {
			if (identity.isMap(map)) if (map.hasAllNullValues(true)) return Object.assign(new YAMLSet(), map);
			else onError("Set items must all have null values");
			else onError("Expected a mapping for this tag");
			return map;
		}
	};
	exports.YAMLSet = YAMLSet;
	exports.set = set;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = /* @__PURE__ */ __commonJSMin(((exports) => {
	var stringifyNumber = require_stringifyNumber();
	/** Internal types handle bigint as number, because TS can't figure it out. */
	function parseSexagesimal(str, asBigInt) {
		const sign = str[0];
		const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
		const num = (n) => asBigInt ? BigInt(n) : Number(n);
		const res = parts.replace(/_/g, "").split(":").reduce((res, p) => res * num(60) + num(p), num(0));
		return sign === "-" ? num(-1) * res : res;
	}
	/**
	* hhhh:mm:ss.sss
	*
	* Internal types handle bigint as number, because TS can't figure it out.
	*/
	function stringifySexagesimal(node) {
		let { value } = node;
		let num = (n) => n;
		if (typeof value === "bigint") num = (n) => BigInt(n);
		else if (isNaN(value) || !isFinite(value)) return stringifyNumber.stringifyNumber(node);
		let sign = "";
		if (value < 0) {
			sign = "-";
			value *= num(-1);
		}
		const _60 = num(60);
		const parts = [value % _60];
		if (value < 60) parts.unshift(0);
		else {
			value = (value - parts[0]) / _60;
			parts.unshift(value % _60);
			if (value >= 60) {
				value = (value - parts[0]) / _60;
				parts.unshift(value);
			}
		}
		return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
	}
	const intTime = {
		identify: (value) => typeof value === "bigint" || Number.isInteger(value),
		default: true,
		tag: "tag:yaml.org,2002:int",
		format: "TIME",
		test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
		resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
		stringify: stringifySexagesimal
	};
	const floatTime = {
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		format: "TIME",
		test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
		resolve: (str) => parseSexagesimal(str, false),
		stringify: stringifySexagesimal
	};
	const timestamp = {
		identify: (value) => value instanceof Date,
		default: true,
		tag: "tag:yaml.org,2002:timestamp",
		test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
		resolve(str) {
			const match = str.match(timestamp.test);
			if (!match) throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
			const [, year, month, day, hour, minute, second] = match.map(Number);
			const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
			let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
			const tz = match[8];
			if (tz && tz !== "Z") {
				let d = parseSexagesimal(tz, false);
				if (Math.abs(d) < 30) d *= 60;
				date -= 6e4 * d;
			}
			return new Date(date);
		},
		stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
	};
	exports.floatTime = floatTime;
	exports.intTime = intTime;
	exports.timestamp = timestamp;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema = /* @__PURE__ */ __commonJSMin(((exports) => {
	var map = require_map();
	var _null = require_null();
	var seq = require_seq();
	var string = require_string();
	var binary = require_binary();
	var bool = require_bool();
	var float = require_float();
	var int = require_int();
	var merge = require_merge();
	var omap = require_omap();
	var pairs = require_pairs();
	var set = require_set();
	var timestamp = require_timestamp();
	const schema = [
		map.map,
		seq.seq,
		string.string,
		_null.nullTag,
		bool.trueTag,
		bool.falseTag,
		int.intBin,
		int.intOct,
		int.int,
		int.intHex,
		float.floatNaN,
		float.floatExp,
		float.float,
		binary.binary,
		merge.merge,
		omap.omap,
		pairs.pairs,
		set.set,
		timestamp.intTime,
		timestamp.floatTime,
		timestamp.timestamp
	];
	exports.schema = schema;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/tags.js
var require_tags = /* @__PURE__ */ __commonJSMin(((exports) => {
	var map = require_map();
	var _null = require_null();
	var seq = require_seq();
	var string = require_string();
	var bool = require_bool$1();
	var float = require_float$1();
	var int = require_int$1();
	var schema = require_schema$2();
	var schema$1 = require_schema$1();
	var binary = require_binary();
	var merge = require_merge();
	var omap = require_omap();
	var pairs = require_pairs();
	var schema$2 = require_schema();
	var set = require_set();
	var timestamp = require_timestamp();
	const schemas = new Map([
		["core", schema.schema],
		["failsafe", [
			map.map,
			seq.seq,
			string.string
		]],
		["json", schema$1.schema],
		["yaml11", schema$2.schema],
		["yaml-1.1", schema$2.schema]
	]);
	const tagsByName = {
		binary: binary.binary,
		bool: bool.boolTag,
		float: float.float,
		floatExp: float.floatExp,
		floatNaN: float.floatNaN,
		floatTime: timestamp.floatTime,
		int: int.int,
		intHex: int.intHex,
		intOct: int.intOct,
		intTime: timestamp.intTime,
		map: map.map,
		merge: merge.merge,
		null: _null.nullTag,
		omap: omap.omap,
		pairs: pairs.pairs,
		seq: seq.seq,
		set: set.set,
		timestamp: timestamp.timestamp
	};
	const coreKnownTags = {
		"tag:yaml.org,2002:binary": binary.binary,
		"tag:yaml.org,2002:merge": merge.merge,
		"tag:yaml.org,2002:omap": omap.omap,
		"tag:yaml.org,2002:pairs": pairs.pairs,
		"tag:yaml.org,2002:set": set.set,
		"tag:yaml.org,2002:timestamp": timestamp.timestamp
	};
	function getTags(customTags, schemaName, addMergeTag) {
		const schemaTags = schemas.get(schemaName);
		if (schemaTags && !customTags) return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
		let tags = schemaTags;
		if (!tags) if (Array.isArray(customTags)) tags = [];
		else {
			const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
			throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
		}
		if (Array.isArray(customTags)) for (const tag of customTags) tags = tags.concat(tag);
		else if (typeof customTags === "function") tags = customTags(tags.slice());
		if (addMergeTag) tags = tags.concat(merge.merge);
		return tags.reduce((tags, tag) => {
			const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
			if (!tagObj) {
				const tagName = JSON.stringify(tag);
				const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
				throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
			}
			if (!tags.includes(tagObj)) tags.push(tagObj);
			return tags;
		}, []);
	}
	exports.coreKnownTags = coreKnownTags;
	exports.getTags = getTags;
}));

//#endregion
//#region ../../node_modules/yaml/dist/schema/Schema.js
var require_Schema = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var map = require_map();
	var seq = require_seq();
	var string = require_string();
	var tags = require_tags();
	const sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
	var Schema = class Schema {
		constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
			this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
			this.name = typeof schema === "string" && schema || "core";
			this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
			this.tags = tags.getTags(customTags, this.name, merge);
			this.toStringOptions = toStringDefaults ?? null;
			Object.defineProperty(this, identity.MAP, { value: map.map });
			Object.defineProperty(this, identity.SCALAR, { value: string.string });
			Object.defineProperty(this, identity.SEQ, { value: seq.seq });
			this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
		}
		clone() {
			const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
			copy.tags = this.tags.slice();
			return copy;
		}
	};
	exports.Schema = Schema;
}));

//#endregion
//#region ../../node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var stringify = require_stringify();
	var stringifyComment = require_stringifyComment();
	function stringifyDocument(doc, options) {
		const lines = [];
		let hasDirectives = options.directives === true;
		if (options.directives !== false && doc.directives) {
			const dir = doc.directives.toString(doc);
			if (dir) {
				lines.push(dir);
				hasDirectives = true;
			} else if (doc.directives.docStart) hasDirectives = true;
		}
		if (hasDirectives) lines.push("---");
		const ctx = stringify.createStringifyContext(doc, options);
		const { commentString } = ctx.options;
		if (doc.commentBefore) {
			if (lines.length !== 1) lines.unshift("");
			const cs = commentString(doc.commentBefore);
			lines.unshift(stringifyComment.indentComment(cs, ""));
		}
		let chompKeep = false;
		let contentComment = null;
		if (doc.contents) {
			if (identity.isNode(doc.contents)) {
				if (doc.contents.spaceBefore && hasDirectives) lines.push("");
				if (doc.contents.commentBefore) {
					const cs = commentString(doc.contents.commentBefore);
					lines.push(stringifyComment.indentComment(cs, ""));
				}
				ctx.forceBlockIndent = !!doc.comment;
				contentComment = doc.contents.comment;
			}
			const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
			let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
			if (contentComment) body += stringifyComment.lineComment(body, "", commentString(contentComment));
			if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") lines[lines.length - 1] = `--- ${body}`;
			else lines.push(body);
		} else lines.push(stringify.stringify(doc.contents, ctx));
		if (doc.directives?.docEnd) if (doc.comment) {
			const cs = commentString(doc.comment);
			if (cs.includes("\n")) {
				lines.push("...");
				lines.push(stringifyComment.indentComment(cs, ""));
			} else lines.push(`... ${cs}`);
		} else lines.push("...");
		else {
			let dc = doc.comment;
			if (dc && chompKeep) dc = dc.replace(/^\n+/, "");
			if (dc) {
				if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "") lines.push("");
				lines.push(stringifyComment.indentComment(commentString(dc), ""));
			}
		}
		return lines.join("\n") + "\n";
	}
	exports.stringifyDocument = stringifyDocument;
}));

//#endregion
//#region ../../node_modules/yaml/dist/doc/Document.js
var require_Document = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Alias = require_Alias();
	var Collection = require_Collection();
	var identity = require_identity();
	var Pair = require_Pair();
	var toJS = require_toJS();
	var Schema = require_Schema();
	var stringifyDocument = require_stringifyDocument();
	var anchors = require_anchors();
	var applyReviver = require_applyReviver();
	var createNode = require_createNode();
	var directives = require_directives();
	var Document = class Document {
		constructor(value, replacer, options) {
			/** A comment before this Document */
			this.commentBefore = null;
			/** A comment immediately after this Document */
			this.comment = null;
			/** Errors encountered during parsing. */
			this.errors = [];
			/** Warnings encountered during parsing. */
			this.warnings = [];
			Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
			let _replacer = null;
			if (typeof replacer === "function" || Array.isArray(replacer)) _replacer = replacer;
			else if (options === void 0 && replacer) {
				options = replacer;
				replacer = void 0;
			}
			const opt = Object.assign({
				intAsBigInt: false,
				keepSourceTokens: false,
				logLevel: "warn",
				prettyErrors: true,
				strict: true,
				stringKeys: false,
				uniqueKeys: true,
				version: "1.2"
			}, options);
			this.options = opt;
			let { version } = opt;
			if (options?._directives) {
				this.directives = options._directives.atDocument();
				if (this.directives.yaml.explicit) version = this.directives.yaml.version;
			} else this.directives = new directives.Directives({ version });
			this.setSchema(version, options);
			this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
		}
		/**
		* Create a deep copy of this Document and its contents.
		*
		* Custom Node values that inherit from `Object` still refer to their original instances.
		*/
		clone() {
			const copy = Object.create(Document.prototype, { [identity.NODE_TYPE]: { value: identity.DOC } });
			copy.commentBefore = this.commentBefore;
			copy.comment = this.comment;
			copy.errors = this.errors.slice();
			copy.warnings = this.warnings.slice();
			copy.options = Object.assign({}, this.options);
			if (this.directives) copy.directives = this.directives.clone();
			copy.schema = this.schema.clone();
			copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
			if (this.range) copy.range = this.range.slice();
			return copy;
		}
		/** Adds a value to the document. */
		add(value) {
			if (assertCollection(this.contents)) this.contents.add(value);
		}
		/** Adds a value to the document. */
		addIn(path, value) {
			if (assertCollection(this.contents)) this.contents.addIn(path, value);
		}
		/**
		* Create a new `Alias` node, ensuring that the target `node` has the required anchor.
		*
		* If `node` already has an anchor, `name` is ignored.
		* Otherwise, the `node.anchor` value will be set to `name`,
		* or if an anchor with that name is already present in the document,
		* `name` will be used as a prefix for a new unique anchor.
		* If `name` is undefined, the generated anchor will use 'a' as a prefix.
		*/
		createAlias(node, name) {
			if (!node.anchor) {
				const prev = anchors.anchorNames(this);
				node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
			}
			return new Alias.Alias(node.anchor);
		}
		createNode(value, replacer, options) {
			let _replacer = void 0;
			if (typeof replacer === "function") {
				value = replacer.call({ "": value }, "", value);
				_replacer = replacer;
			} else if (Array.isArray(replacer)) {
				const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
				const asStr = replacer.filter(keyToStr).map(String);
				if (asStr.length > 0) replacer = replacer.concat(asStr);
				_replacer = replacer;
			} else if (options === void 0 && replacer) {
				options = replacer;
				replacer = void 0;
			}
			const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
			const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, anchorPrefix || "a");
			const ctx = {
				aliasDuplicateObjects: aliasDuplicateObjects ?? true,
				keepUndefined: keepUndefined ?? false,
				onAnchor,
				onTagObj,
				replacer: _replacer,
				schema: this.schema,
				sourceObjects
			};
			const node = createNode.createNode(value, tag, ctx);
			if (flow && identity.isCollection(node)) node.flow = true;
			setAnchors();
			return node;
		}
		/**
		* Convert a key and a value into a `Pair` using the current schema,
		* recursively wrapping all values as `Scalar` or `Collection` nodes.
		*/
		createPair(key, value, options = {}) {
			const k = this.createNode(key, null, options);
			const v = this.createNode(value, null, options);
			return new Pair.Pair(k, v);
		}
		/**
		* Removes a value from the document.
		* @returns `true` if the item was found and removed.
		*/
		delete(key) {
			return assertCollection(this.contents) ? this.contents.delete(key) : false;
		}
		/**
		* Removes a value from the document.
		* @returns `true` if the item was found and removed.
		*/
		deleteIn(path) {
			if (Collection.isEmptyPath(path)) {
				if (this.contents == null) return false;
				this.contents = null;
				return true;
			}
			return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
		}
		/**
		* Returns item at `key`, or `undefined` if not found. By default unwraps
		* scalar values from their surrounding node; to disable set `keepScalar` to
		* `true` (collections are always returned intact).
		*/
		get(key, keepScalar) {
			return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
		}
		/**
		* Returns item at `path`, or `undefined` if not found. By default unwraps
		* scalar values from their surrounding node; to disable set `keepScalar` to
		* `true` (collections are always returned intact).
		*/
		getIn(path, keepScalar) {
			if (Collection.isEmptyPath(path)) return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
			return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
		}
		/**
		* Checks if the document includes a value with the key `key`.
		*/
		has(key) {
			return identity.isCollection(this.contents) ? this.contents.has(key) : false;
		}
		/**
		* Checks if the document includes a value at `path`.
		*/
		hasIn(path) {
			if (Collection.isEmptyPath(path)) return this.contents !== void 0;
			return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
		}
		/**
		* Sets a value in this document. For `!!set`, `value` needs to be a
		* boolean to add/remove the item from the set.
		*/
		set(key, value) {
			if (this.contents == null) this.contents = Collection.collectionFromPath(this.schema, [key], value);
			else if (assertCollection(this.contents)) this.contents.set(key, value);
		}
		/**
		* Sets a value in this document. For `!!set`, `value` needs to be a
		* boolean to add/remove the item from the set.
		*/
		setIn(path, value) {
			if (Collection.isEmptyPath(path)) this.contents = value;
			else if (this.contents == null) this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
			else if (assertCollection(this.contents)) this.contents.setIn(path, value);
		}
		/**
		* Change the YAML version and schema used by the document.
		* A `null` version disables support for directives, explicit tags, anchors, and aliases.
		* It also requires the `schema` option to be given as a `Schema` instance value.
		*
		* Overrides all previously set schema options.
		*/
		setSchema(version, options = {}) {
			if (typeof version === "number") version = String(version);
			let opt;
			switch (version) {
				case "1.1":
					if (this.directives) this.directives.yaml.version = "1.1";
					else this.directives = new directives.Directives({ version: "1.1" });
					opt = {
						resolveKnownTags: false,
						schema: "yaml-1.1"
					};
					break;
				case "1.2":
				case "next":
					if (this.directives) this.directives.yaml.version = version;
					else this.directives = new directives.Directives({ version });
					opt = {
						resolveKnownTags: true,
						schema: "core"
					};
					break;
				case null:
					if (this.directives) delete this.directives;
					opt = null;
					break;
				default: {
					const sv = JSON.stringify(version);
					throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
				}
			}
			if (options.schema instanceof Object) this.schema = options.schema;
			else if (opt) this.schema = new Schema.Schema(Object.assign(opt, options));
			else throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
		}
		toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
			const ctx = {
				anchors: /* @__PURE__ */ new Map(),
				doc: this,
				keep: !json,
				mapAsMap: mapAsMap === true,
				mapKeyWarned: false,
				maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
			};
			const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
			if (typeof onAnchor === "function") for (const { count, res } of ctx.anchors.values()) onAnchor(res, count);
			return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
		}
		/**
		* A JSON representation of the document `contents`.
		*
		* @param jsonArg Used by `JSON.stringify` to indicate the array index or
		*   property name.
		*/
		toJSON(jsonArg, onAnchor) {
			return this.toJS({
				json: true,
				jsonArg,
				mapAsMap: false,
				onAnchor
			});
		}
		/** A YAML representation of the document. */
		toString(options = {}) {
			if (this.errors.length > 0) throw new Error("Document with errors cannot be stringified");
			if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
				const s = JSON.stringify(options.indent);
				throw new Error(`"indent" option must be a positive integer, not ${s}`);
			}
			return stringifyDocument.stringifyDocument(this, options);
		}
	};
	function assertCollection(contents) {
		if (identity.isCollection(contents)) return true;
		throw new Error("Expected a YAML collection as document contents");
	}
	exports.Document = Document;
}));

//#endregion
//#region ../../node_modules/yaml/dist/errors.js
var require_errors = /* @__PURE__ */ __commonJSMin(((exports) => {
	var YAMLError = class extends Error {
		constructor(name, pos, code, message) {
			super();
			this.name = name;
			this.code = code;
			this.message = message;
			this.pos = pos;
		}
	};
	var YAMLParseError = class extends YAMLError {
		constructor(pos, code, message) {
			super("YAMLParseError", pos, code, message);
		}
	};
	var YAMLWarning = class extends YAMLError {
		constructor(pos, code, message) {
			super("YAMLWarning", pos, code, message);
		}
	};
	const prettifyError = (src, lc) => (error) => {
		if (error.pos[0] === -1) return;
		error.linePos = error.pos.map((pos) => lc.linePos(pos));
		const { line, col } = error.linePos[0];
		error.message += ` at line ${line}, column ${col}`;
		let ci = col - 1;
		let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
		if (ci >= 60 && lineStr.length > 80) {
			const trimStart = Math.min(ci - 39, lineStr.length - 79);
			lineStr = "…" + lineStr.substring(trimStart);
			ci -= trimStart - 1;
		}
		if (lineStr.length > 80) lineStr = lineStr.substring(0, 79) + "…";
		if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
			let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
			if (prev.length > 80) prev = prev.substring(0, 79) + "…\n";
			lineStr = prev + lineStr;
		}
		if (/[^ ]/.test(lineStr)) {
			let count = 1;
			const end = error.linePos[1];
			if (end?.line === line && end.col > col) count = Math.max(1, Math.min(end.col - col, 80 - ci));
			const pointer = " ".repeat(ci) + "^".repeat(count);
			error.message += `:\n\n${lineStr}\n${pointer}\n`;
		}
	};
	exports.YAMLError = YAMLError;
	exports.YAMLParseError = YAMLParseError;
	exports.YAMLWarning = YAMLWarning;
	exports.prettifyError = prettifyError;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = /* @__PURE__ */ __commonJSMin(((exports) => {
	function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
		let spaceBefore = false;
		let atNewline = startOnNewline;
		let hasSpace = startOnNewline;
		let comment = "";
		let commentSep = "";
		let hasNewline = false;
		let reqSpace = false;
		let tab = null;
		let anchor = null;
		let tag = null;
		let newlineAfterProp = null;
		let comma = null;
		let found = null;
		let start = null;
		for (const token of tokens) {
			if (reqSpace) {
				if (token.type !== "space" && token.type !== "newline" && token.type !== "comma") onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
				reqSpace = false;
			}
			if (tab) {
				if (atNewline && token.type !== "comment" && token.type !== "newline") onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
				tab = null;
			}
			switch (token.type) {
				case "space":
					if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) tab = token;
					hasSpace = true;
					break;
				case "comment": {
					if (!hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
					const cb = token.source.substring(1) || " ";
					if (!comment) comment = cb;
					else comment += commentSep + cb;
					commentSep = "";
					atNewline = false;
					break;
				}
				case "newline":
					if (atNewline) {
						if (comment) comment += token.source;
						else if (!found || indicator !== "seq-item-ind") spaceBefore = true;
					} else commentSep += token.source;
					atNewline = true;
					hasNewline = true;
					if (anchor || tag) newlineAfterProp = token;
					hasSpace = true;
					break;
				case "anchor":
					if (anchor) onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
					if (token.source.endsWith(":")) onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
					anchor = token;
					start ?? (start = token.offset);
					atNewline = false;
					hasSpace = false;
					reqSpace = true;
					break;
				case "tag":
					if (tag) onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
					tag = token;
					start ?? (start = token.offset);
					atNewline = false;
					hasSpace = false;
					reqSpace = true;
					break;
				case indicator:
					if (anchor || tag) onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
					if (found) onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
					found = token;
					atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
					hasSpace = false;
					break;
				case "comma": if (flow) {
					if (comma) onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
					comma = token;
					atNewline = false;
					hasSpace = false;
					break;
				}
				default:
					onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
					atNewline = false;
					hasSpace = false;
			}
		}
		const last = tokens[tokens.length - 1];
		const end = last ? last.offset + last.source.length : offset;
		if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
		if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq")) onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
		return {
			comma,
			found,
			spaceBefore,
			comment,
			hasNewline,
			anchor,
			tag,
			newlineAfterProp,
			end,
			start: start ?? end
		};
	}
	exports.resolveProps = resolveProps;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = /* @__PURE__ */ __commonJSMin(((exports) => {
	function containsNewline(key) {
		if (!key) return null;
		switch (key.type) {
			case "alias":
			case "scalar":
			case "double-quoted-scalar":
			case "single-quoted-scalar":
				if (key.source.includes("\n")) return true;
				if (key.end) {
					for (const st of key.end) if (st.type === "newline") return true;
				}
				return false;
			case "flow-collection":
				for (const it of key.items) {
					for (const st of it.start) if (st.type === "newline") return true;
					if (it.sep) {
						for (const st of it.sep) if (st.type === "newline") return true;
					}
					if (containsNewline(it.key) || containsNewline(it.value)) return true;
				}
				return false;
			default: return true;
		}
	}
	exports.containsNewline = containsNewline;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utilContainsNewline = require_util_contains_newline();
	function flowIndentCheck(indent, fc, onError) {
		if (fc?.type === "flow-collection") {
			const end = fc.end[0];
			if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) onError(end, "BAD_INDENT", "Flow end indicator should be more indented than parent", true);
		}
	}
	exports.flowIndentCheck = flowIndentCheck;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	function mapIncludes(ctx, items, search) {
		const { uniqueKeys } = ctx.options;
		if (uniqueKeys === false) return false;
		const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
		return items.some((pair) => isEqual(pair.key, search));
	}
	exports.mapIncludes = mapIncludes;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Pair = require_Pair();
	var YAMLMap = require_YAMLMap();
	var resolveProps = require_resolve_props();
	var utilContainsNewline = require_util_contains_newline();
	var utilFlowIndentCheck = require_util_flow_indent_check();
	var utilMapIncludes = require_util_map_includes();
	const startColMsg = "All mapping items must start at the same column";
	function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
		const map = new (tag?.nodeClass ?? YAMLMap.YAMLMap)(ctx.schema);
		if (ctx.atRoot) ctx.atRoot = false;
		let offset = bm.offset;
		let commentEnd = null;
		for (const collItem of bm.items) {
			const { start, key, sep, value } = collItem;
			const keyProps = resolveProps.resolveProps(start, {
				indicator: "explicit-key-ind",
				next: key ?? sep?.[0],
				offset,
				onError,
				parentIndent: bm.indent,
				startOnNewline: true
			});
			const implicitKey = !keyProps.found;
			if (implicitKey) {
				if (key) {
					if (key.type === "block-seq") onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
					else if ("indent" in key && key.indent !== bm.indent) onError(offset, "BAD_INDENT", startColMsg);
				}
				if (!keyProps.anchor && !keyProps.tag && !sep) {
					commentEnd = keyProps.end;
					if (keyProps.comment) if (map.comment) map.comment += "\n" + keyProps.comment;
					else map.comment = keyProps.comment;
					continue;
				}
				if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
			} else if (keyProps.found?.indent !== bm.indent) onError(offset, "BAD_INDENT", startColMsg);
			ctx.atKey = true;
			const keyStart = keyProps.end;
			const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
			if (ctx.schema.compat) utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
			ctx.atKey = false;
			if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode)) onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
			const valueProps = resolveProps.resolveProps(sep ?? [], {
				indicator: "map-value-ind",
				next: value,
				offset: keyNode.range[2],
				onError,
				parentIndent: bm.indent,
				startOnNewline: !key || key.type === "block-scalar"
			});
			offset = valueProps.end;
			if (valueProps.found) {
				if (implicitKey) {
					if (value?.type === "block-map" && !valueProps.hasNewline) onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
					if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024) onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
				}
				const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
				if (ctx.schema.compat) utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
				offset = valueNode.range[2];
				const pair = new Pair.Pair(keyNode, valueNode);
				if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
				map.items.push(pair);
			} else {
				if (implicitKey) onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
				if (valueProps.comment) if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
				else keyNode.comment = valueProps.comment;
				const pair = new Pair.Pair(keyNode);
				if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
				map.items.push(pair);
			}
		}
		if (commentEnd && commentEnd < offset) onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
		map.range = [
			bm.offset,
			offset,
			commentEnd ?? offset
		];
		return map;
	}
	exports.resolveBlockMap = resolveBlockMap;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = /* @__PURE__ */ __commonJSMin(((exports) => {
	var YAMLSeq = require_YAMLSeq();
	var resolveProps = require_resolve_props();
	var utilFlowIndentCheck = require_util_flow_indent_check();
	function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
		const seq = new (tag?.nodeClass ?? YAMLSeq.YAMLSeq)(ctx.schema);
		if (ctx.atRoot) ctx.atRoot = false;
		if (ctx.atKey) ctx.atKey = false;
		let offset = bs.offset;
		let commentEnd = null;
		for (const { start, value } of bs.items) {
			const props = resolveProps.resolveProps(start, {
				indicator: "seq-item-ind",
				next: value,
				offset,
				onError,
				parentIndent: bs.indent,
				startOnNewline: true
			});
			if (!props.found) if (props.anchor || props.tag || value) if (value?.type === "block-seq") onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
			else onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
			else {
				commentEnd = props.end;
				if (props.comment) seq.comment = props.comment;
				continue;
			}
			const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
			if (ctx.schema.compat) utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
			offset = node.range[2];
			seq.items.push(node);
		}
		seq.range = [
			bs.offset,
			offset,
			commentEnd ?? offset
		];
		return seq;
	}
	exports.resolveBlockSeq = resolveBlockSeq;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = /* @__PURE__ */ __commonJSMin(((exports) => {
	function resolveEnd(end, offset, reqSpace, onError) {
		let comment = "";
		if (end) {
			let hasSpace = false;
			let sep = "";
			for (const token of end) {
				const { source, type } = token;
				switch (type) {
					case "space":
						hasSpace = true;
						break;
					case "comment": {
						if (reqSpace && !hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
						const cb = source.substring(1) || " ";
						if (!comment) comment = cb;
						else comment += sep + cb;
						sep = "";
						break;
					}
					case "newline":
						if (comment) sep += source;
						hasSpace = true;
						break;
					default: onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
				}
				offset += source.length;
			}
		}
		return {
			comment,
			offset
		};
	}
	exports.resolveEnd = resolveEnd;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var Pair = require_Pair();
	var YAMLMap = require_YAMLMap();
	var YAMLSeq = require_YAMLSeq();
	var resolveEnd = require_resolve_end();
	var resolveProps = require_resolve_props();
	var utilContainsNewline = require_util_contains_newline();
	var utilMapIncludes = require_util_map_includes();
	const blockMsg = "Block collections are not allowed within flow collections";
	const isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
	function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
		const isMap = fc.start.source === "{";
		const fcName = isMap ? "flow map" : "flow sequence";
		const coll = new (tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq))(ctx.schema);
		coll.flow = true;
		const atRoot = ctx.atRoot;
		if (atRoot) ctx.atRoot = false;
		if (ctx.atKey) ctx.atKey = false;
		let offset = fc.offset + fc.start.source.length;
		for (let i = 0; i < fc.items.length; ++i) {
			const collItem = fc.items[i];
			const { start, key, sep, value } = collItem;
			const props = resolveProps.resolveProps(start, {
				flow: fcName,
				indicator: "explicit-key-ind",
				next: key ?? sep?.[0],
				offset,
				onError,
				parentIndent: fc.indent,
				startOnNewline: false
			});
			if (!props.found) {
				if (!props.anchor && !props.tag && !sep && !value) {
					if (i === 0 && props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
					else if (i < fc.items.length - 1) onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
					if (props.comment) if (coll.comment) coll.comment += "\n" + props.comment;
					else coll.comment = props.comment;
					offset = props.end;
					continue;
				}
				if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key)) onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
			}
			if (i === 0) {
				if (props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
			} else {
				if (!props.comma) onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
				if (props.comment) {
					let prevItemComment = "";
					loop: for (const st of start) switch (st.type) {
						case "comma":
						case "space": break;
						case "comment":
							prevItemComment = st.source.substring(1);
							break loop;
						default: break loop;
					}
					if (prevItemComment) {
						let prev = coll.items[coll.items.length - 1];
						if (identity.isPair(prev)) prev = prev.value ?? prev.key;
						if (prev.comment) prev.comment += "\n" + prevItemComment;
						else prev.comment = prevItemComment;
						props.comment = props.comment.substring(prevItemComment.length + 1);
					}
				}
			}
			if (!isMap && !sep && !props.found) {
				const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
				coll.items.push(valueNode);
				offset = valueNode.range[2];
				if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
			} else {
				ctx.atKey = true;
				const keyStart = props.end;
				const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
				if (isBlock(key)) onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
				ctx.atKey = false;
				const valueProps = resolveProps.resolveProps(sep ?? [], {
					flow: fcName,
					indicator: "map-value-ind",
					next: value,
					offset: keyNode.range[2],
					onError,
					parentIndent: fc.indent,
					startOnNewline: false
				});
				if (valueProps.found) {
					if (!isMap && !props.found && ctx.options.strict) {
						if (sep) for (const st of sep) {
							if (st === valueProps.found) break;
							if (st.type === "newline") {
								onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
								break;
							}
						}
						if (props.start < valueProps.found.offset - 1024) onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
					}
				} else if (value) if ("source" in value && value.source?.[0] === ":") onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
				else onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
				const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
				if (valueNode) {
					if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
				} else if (valueProps.comment) if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
				else keyNode.comment = valueProps.comment;
				const pair = new Pair.Pair(keyNode, valueNode);
				if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
				if (isMap) {
					const map = coll;
					if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode)) onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
					map.items.push(pair);
				} else {
					const map = new YAMLMap.YAMLMap(ctx.schema);
					map.flow = true;
					map.items.push(pair);
					const endRange = (valueNode ?? keyNode).range;
					map.range = [
						keyNode.range[0],
						endRange[1],
						endRange[2]
					];
					coll.items.push(map);
				}
				offset = valueNode ? valueNode.range[2] : valueProps.end;
			}
		}
		const expectedEnd = isMap ? "}" : "]";
		const [ce, ...ee] = fc.end;
		let cePos = offset;
		if (ce?.source === expectedEnd) cePos = ce.offset + ce.source.length;
		else {
			const name = fcName[0].toUpperCase() + fcName.substring(1);
			const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
			onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
			if (ce && ce.source.length !== 1) ee.unshift(ce);
		}
		if (ee.length > 0) {
			const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
			if (end.comment) if (coll.comment) coll.comment += "\n" + end.comment;
			else coll.comment = end.comment;
			coll.range = [
				fc.offset,
				cePos,
				end.offset
			];
		} else coll.range = [
			fc.offset,
			cePos,
			cePos
		];
		return coll;
	}
	exports.resolveFlowCollection = resolveFlowCollection;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var Scalar = require_Scalar();
	var YAMLMap = require_YAMLMap();
	var YAMLSeq = require_YAMLSeq();
	var resolveBlockMap = require_resolve_block_map();
	var resolveBlockSeq = require_resolve_block_seq();
	var resolveFlowCollection = require_resolve_flow_collection();
	function resolveCollection(CN, ctx, token, onError, tagName, tag) {
		const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
		const Coll = coll.constructor;
		if (tagName === "!" || tagName === Coll.tagName) {
			coll.tag = Coll.tagName;
			return coll;
		}
		if (tagName) coll.tag = tagName;
		return coll;
	}
	function composeCollection(CN, ctx, token, props, onError) {
		const tagToken = props.tag;
		const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
		if (token.type === "block-seq") {
			const { anchor, newlineAfterProp: nl } = props;
			const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
			if (lastProp && (!nl || nl.offset < lastProp.offset)) onError(lastProp, "MISSING_CHAR", "Missing newline after block sequence props");
		}
		const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
		if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") return resolveCollection(CN, ctx, token, onError, tagName);
		let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
		if (!tag) {
			const kt = ctx.schema.knownTags[tagName];
			if (kt?.collection === expType) {
				ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
				tag = kt;
			} else {
				if (kt) onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
				else onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
				return resolveCollection(CN, ctx, token, onError, tagName);
			}
		}
		const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
		const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
		const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
		node.range = coll.range;
		node.tag = tagName;
		if (tag?.format) node.format = tag.format;
		return node;
	}
	exports.composeCollection = composeCollection;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	function resolveBlockScalar(ctx, scalar, onError) {
		const start = scalar.offset;
		const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
		if (!header) return {
			value: "",
			type: null,
			comment: "",
			range: [
				start,
				start,
				start
			]
		};
		const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
		const lines = scalar.source ? splitLines(scalar.source) : [];
		let chompStart = lines.length;
		for (let i = lines.length - 1; i >= 0; --i) {
			const content = lines[i][1];
			if (content === "" || content === "\r") chompStart = i;
			else break;
		}
		if (chompStart === 0) {
			const value = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
			let end = start + header.length;
			if (scalar.source) end += scalar.source.length;
			return {
				value,
				type,
				comment: header.comment,
				range: [
					start,
					end,
					end
				]
			};
		}
		let trimIndent = scalar.indent + header.indent;
		let offset = scalar.offset + header.length;
		let contentStart = 0;
		for (let i = 0; i < chompStart; ++i) {
			const [indent, content] = lines[i];
			if (content === "" || content === "\r") {
				if (header.indent === 0 && indent.length > trimIndent) trimIndent = indent.length;
			} else {
				if (indent.length < trimIndent) onError(offset + indent.length, "MISSING_CHAR", "Block scalars with more-indented leading empty lines must use an explicit indentation indicator");
				if (header.indent === 0) trimIndent = indent.length;
				contentStart = i;
				if (trimIndent === 0 && !ctx.atRoot) onError(offset, "BAD_INDENT", "Block scalar values in collections must be indented");
				break;
			}
			offset += indent.length + content.length + 1;
		}
		for (let i = lines.length - 1; i >= chompStart; --i) if (lines[i][0].length > trimIndent) chompStart = i + 1;
		let value = "";
		let sep = "";
		let prevMoreIndented = false;
		for (let i = 0; i < contentStart; ++i) value += lines[i][0].slice(trimIndent) + "\n";
		for (let i = contentStart; i < chompStart; ++i) {
			let [indent, content] = lines[i];
			offset += indent.length + content.length + 1;
			const crlf = content[content.length - 1] === "\r";
			if (crlf) content = content.slice(0, -1);
			/* istanbul ignore if already caught in lexer */
			if (content && indent.length < trimIndent) {
				const message = `Block scalar lines must not be less indented than their ${header.indent ? "explicit indentation indicator" : "first line"}`;
				onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
				indent = "";
			}
			if (type === Scalar.Scalar.BLOCK_LITERAL) {
				value += sep + indent.slice(trimIndent) + content;
				sep = "\n";
			} else if (indent.length > trimIndent || content[0] === "	") {
				if (sep === " ") sep = "\n";
				else if (!prevMoreIndented && sep === "\n") sep = "\n\n";
				value += sep + indent.slice(trimIndent) + content;
				sep = "\n";
				prevMoreIndented = true;
			} else if (content === "") if (sep === "\n") value += "\n";
			else sep = "\n";
			else {
				value += sep + content;
				sep = " ";
				prevMoreIndented = false;
			}
		}
		switch (header.chomp) {
			case "-": break;
			case "+":
				for (let i = chompStart; i < lines.length; ++i) value += "\n" + lines[i][0].slice(trimIndent);
				if (value[value.length - 1] !== "\n") value += "\n";
				break;
			default: value += "\n";
		}
		const end = start + header.length + scalar.source.length;
		return {
			value,
			type,
			comment: header.comment,
			range: [
				start,
				end,
				end
			]
		};
	}
	function parseBlockScalarHeader({ offset, props }, strict, onError) {
		/* istanbul ignore if should not happen */
		if (props[0].type !== "block-scalar-header") {
			onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
			return null;
		}
		const { source } = props[0];
		const mode = source[0];
		let indent = 0;
		let chomp = "";
		let error = -1;
		for (let i = 1; i < source.length; ++i) {
			const ch = source[i];
			if (!chomp && (ch === "-" || ch === "+")) chomp = ch;
			else {
				const n = Number(ch);
				if (!indent && n) indent = n;
				else if (error === -1) error = offset + i;
			}
		}
		if (error !== -1) onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
		let hasSpace = false;
		let comment = "";
		let length = source.length;
		for (let i = 1; i < props.length; ++i) {
			const token = props[i];
			switch (token.type) {
				case "space": hasSpace = true;
				case "newline":
					length += token.source.length;
					break;
				case "comment":
					if (strict && !hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
					length += token.source.length;
					comment = token.source.substring(1);
					break;
				case "error":
					onError(token, "UNEXPECTED_TOKEN", token.message);
					length += token.source.length;
					break;
				default: {
					onError(token, "UNEXPECTED_TOKEN", `Unexpected token in block scalar header: ${token.type}`);
					const ts = token.source;
					if (ts && typeof ts === "string") length += ts.length;
				}
			}
		}
		return {
			mode,
			indent,
			chomp,
			comment,
			length
		};
	}
	/** @returns Array of lines split up as `[indent, content]` */
	function splitLines(source) {
		const split = source.split(/\n( *)/);
		const first = split[0];
		const m = first.match(/^( *)/);
		const lines = [m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first]];
		for (let i = 1; i < split.length; i += 2) lines.push([split[i], split[i + 1]]);
		return lines;
	}
	exports.resolveBlockScalar = resolveBlockScalar;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Scalar = require_Scalar();
	var resolveEnd = require_resolve_end();
	function resolveFlowScalar(scalar, strict, onError) {
		const { offset, type, source, end } = scalar;
		let _type;
		let value;
		const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
		switch (type) {
			case "scalar":
				_type = Scalar.Scalar.PLAIN;
				value = plainValue(source, _onError);
				break;
			case "single-quoted-scalar":
				_type = Scalar.Scalar.QUOTE_SINGLE;
				value = singleQuotedValue(source, _onError);
				break;
			case "double-quoted-scalar":
				_type = Scalar.Scalar.QUOTE_DOUBLE;
				value = doubleQuotedValue(source, _onError);
				break;
			default:
				onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
				return {
					value: "",
					type: null,
					comment: "",
					range: [
						offset,
						offset + source.length,
						offset + source.length
					]
				};
		}
		const valueEnd = offset + source.length;
		const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
		return {
			value,
			type: _type,
			comment: re.comment,
			range: [
				offset,
				valueEnd,
				re.offset
			]
		};
	}
	function plainValue(source, onError) {
		let badChar = "";
		switch (source[0]) {
			case "	":
				badChar = "a tab character";
				break;
			case ",":
				badChar = "flow indicator character ,";
				break;
			case "%":
				badChar = "directive indicator character %";
				break;
			case "|":
			case ">":
				badChar = `block scalar indicator ${source[0]}`;
				break;
			case "@":
			case "`":
				badChar = `reserved character ${source[0]}`;
				break;
		}
		if (badChar) onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
		return foldLines(source);
	}
	function singleQuotedValue(source, onError) {
		if (source[source.length - 1] !== "'" || source.length === 1) onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
		return foldLines(source.slice(1, -1)).replace(/''/g, "'");
	}
	function foldLines(source) {
		/**
		* The negative lookbehind here and in the `re` RegExp is to
		* prevent causing a polynomial search time in certain cases.
		*
		* The try-catch is for Safari, which doesn't support this yet:
		* https://caniuse.com/js-regexp-lookbehind
		*/
		let first, line;
		try {
			first = /* @__PURE__ */ new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
			line = /* @__PURE__ */ new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
		} catch {
			first = /(.*?)[ \t]*\r?\n/sy;
			line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
		}
		let match = first.exec(source);
		if (!match) return source;
		let res = match[1];
		let sep = " ";
		let pos = first.lastIndex;
		line.lastIndex = pos;
		while (match = line.exec(source)) {
			if (match[1] === "") if (sep === "\n") res += sep;
			else sep = "\n";
			else {
				res += sep + match[1];
				sep = " ";
			}
			pos = line.lastIndex;
		}
		const last = /[ \t]*(.*)/sy;
		last.lastIndex = pos;
		match = last.exec(source);
		return res + sep + (match?.[1] ?? "");
	}
	function doubleQuotedValue(source, onError) {
		let res = "";
		for (let i = 1; i < source.length - 1; ++i) {
			const ch = source[i];
			if (ch === "\r" && source[i + 1] === "\n") continue;
			if (ch === "\n") {
				const { fold, offset } = foldNewline(source, i);
				res += fold;
				i = offset;
			} else if (ch === "\\") {
				let next = source[++i];
				const cc = escapeCodes[next];
				if (cc) res += cc;
				else if (next === "\n") {
					next = source[i + 1];
					while (next === " " || next === "	") next = source[++i + 1];
				} else if (next === "\r" && source[i + 1] === "\n") {
					next = source[++i + 1];
					while (next === " " || next === "	") next = source[++i + 1];
				} else if (next === "x" || next === "u" || next === "U") {
					const length = {
						x: 2,
						u: 4,
						U: 8
					}[next];
					res += parseCharCode(source, i + 1, length, onError);
					i += length;
				} else {
					const raw = source.substr(i - 1, 2);
					onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
					res += raw;
				}
			} else if (ch === " " || ch === "	") {
				const wsStart = i;
				let next = source[i + 1];
				while (next === " " || next === "	") next = source[++i + 1];
				if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n")) res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
			} else res += ch;
		}
		if (source[source.length - 1] !== "\"" || source.length === 1) onError(source.length, "MISSING_CHAR", "Missing closing \"quote");
		return res;
	}
	/**
	* Fold a single newline into a space, multiple newlines to N - 1 newlines.
	* Presumes `source[offset] === '\n'`
	*/
	function foldNewline(source, offset) {
		let fold = "";
		let ch = source[offset + 1];
		while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
			if (ch === "\r" && source[offset + 2] !== "\n") break;
			if (ch === "\n") fold += "\n";
			offset += 1;
			ch = source[offset + 1];
		}
		if (!fold) fold = " ";
		return {
			fold,
			offset
		};
	}
	const escapeCodes = {
		"0": "\0",
		a: "\x07",
		b: "\b",
		e: "\x1B",
		f: "\f",
		n: "\n",
		r: "\r",
		t: "	",
		v: "\v",
		N: "",
		_: "\xA0",
		L: "\u2028",
		P: "\u2029",
		" ": " ",
		"\"": "\"",
		"/": "/",
		"\\": "\\",
		"	": "	"
	};
	function parseCharCode(source, offset, length, onError) {
		const cc = source.substr(offset, length);
		const code = cc.length === length && /^[0-9a-fA-F]+$/.test(cc) ? parseInt(cc, 16) : NaN;
		if (isNaN(code)) {
			const raw = source.substr(offset - 2, length + 2);
			onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
			return raw;
		}
		return String.fromCodePoint(code);
	}
	exports.resolveFlowScalar = resolveFlowScalar;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = /* @__PURE__ */ __commonJSMin(((exports) => {
	var identity = require_identity();
	var Scalar = require_Scalar();
	var resolveBlockScalar = require_resolve_block_scalar();
	var resolveFlowScalar = require_resolve_flow_scalar();
	function composeScalar(ctx, token, tagToken, onError) {
		const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
		const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
		let tag;
		if (ctx.options.stringKeys && ctx.atKey) tag = ctx.schema[identity.SCALAR];
		else if (tagName) tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
		else if (token.type === "scalar") tag = findScalarTagByTest(ctx, value, token, onError);
		else tag = ctx.schema[identity.SCALAR];
		let scalar;
		try {
			const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
			scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
			scalar = new Scalar.Scalar(value);
		}
		scalar.range = range;
		scalar.source = value;
		if (type) scalar.type = type;
		if (tagName) scalar.tag = tagName;
		if (tag.format) scalar.format = tag.format;
		if (comment) scalar.comment = comment;
		return scalar;
	}
	function findScalarTagByName(schema, value, tagName, tagToken, onError) {
		if (tagName === "!") return schema[identity.SCALAR];
		const matchWithTest = [];
		for (const tag of schema.tags) if (!tag.collection && tag.tag === tagName) if (tag.default && tag.test) matchWithTest.push(tag);
		else return tag;
		for (const tag of matchWithTest) if (tag.test?.test(value)) return tag;
		const kt = schema.knownTags[tagName];
		if (kt && !kt.collection) {
			schema.tags.push(Object.assign({}, kt, {
				default: false,
				test: void 0
			}));
			return kt;
		}
		onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
		return schema[identity.SCALAR];
	}
	function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
		const tag = schema.tags.find((tag) => (tag.default === true || atKey && tag.default === "key") && tag.test?.test(value)) || schema[identity.SCALAR];
		if (schema.compat) {
			const compat = schema.compat.find((tag) => tag.default && tag.test?.test(value)) ?? schema[identity.SCALAR];
			if (tag.tag !== compat.tag) onError(token, "TAG_RESOLVE_FAILED", `Value may be parsed as either ${directives.tagString(tag.tag)} or ${directives.tagString(compat.tag)}`, true);
		}
		return tag;
	}
	exports.composeScalar = composeScalar;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = /* @__PURE__ */ __commonJSMin(((exports) => {
	function emptyScalarPosition(offset, before, pos) {
		if (before) {
			pos ?? (pos = before.length);
			for (let i = pos - 1; i >= 0; --i) {
				let st = before[i];
				switch (st.type) {
					case "space":
					case "comment":
					case "newline":
						offset -= st.source.length;
						continue;
				}
				st = before[++i];
				while (st?.type === "space") {
					offset += st.source.length;
					st = before[++i];
				}
				break;
			}
		}
		return offset;
	}
	exports.emptyScalarPosition = emptyScalarPosition;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Alias = require_Alias();
	var identity = require_identity();
	var composeCollection = require_compose_collection();
	var composeScalar = require_compose_scalar();
	var resolveEnd = require_resolve_end();
	var utilEmptyScalarPosition = require_util_empty_scalar_position();
	const CN = {
		composeNode,
		composeEmptyNode
	};
	function composeNode(ctx, token, props, onError) {
		const atKey = ctx.atKey;
		const { spaceBefore, comment, anchor, tag } = props;
		let node;
		let isSrcToken = true;
		switch (token.type) {
			case "alias":
				node = composeAlias(ctx, token, onError);
				if (anchor || tag) onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
				break;
			case "scalar":
			case "single-quoted-scalar":
			case "double-quoted-scalar":
			case "block-scalar":
				node = composeScalar.composeScalar(ctx, token, tag, onError);
				if (anchor) node.anchor = anchor.source.substring(1);
				break;
			case "block-map":
			case "block-seq":
			case "flow-collection":
				node = composeCollection.composeCollection(CN, ctx, token, props, onError);
				if (anchor) node.anchor = anchor.source.substring(1);
				break;
			default:
				onError(token, "UNEXPECTED_TOKEN", token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`);
				node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError);
				isSrcToken = false;
		}
		if (anchor && node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
		if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) onError(tag ?? token, "NON_STRING_KEY", "With stringKeys, all keys must be strings");
		if (spaceBefore) node.spaceBefore = true;
		if (comment) if (token.type === "scalar" && token.source === "") node.comment = comment;
		else node.commentBefore = comment;
		if (ctx.options.keepSourceTokens && isSrcToken) node.srcToken = token;
		return node;
	}
	function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
		const token = {
			type: "scalar",
			offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
			indent: -1,
			source: ""
		};
		const node = composeScalar.composeScalar(ctx, token, tag, onError);
		if (anchor) {
			node.anchor = anchor.source.substring(1);
			if (node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
		}
		if (spaceBefore) node.spaceBefore = true;
		if (comment) {
			node.comment = comment;
			node.range[2] = end;
		}
		return node;
	}
	function composeAlias({ options }, { offset, source, end }, onError) {
		const alias = new Alias.Alias(source.substring(1));
		if (alias.source === "") onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
		if (alias.source.endsWith(":")) onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
		const valueEnd = offset + source.length;
		const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
		alias.range = [
			offset,
			valueEnd,
			re.offset
		];
		if (re.comment) alias.comment = re.comment;
		return alias;
	}
	exports.composeEmptyNode = composeEmptyNode;
	exports.composeNode = composeNode;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Document = require_Document();
	var composeNode = require_compose_node();
	var resolveEnd = require_resolve_end();
	var resolveProps = require_resolve_props();
	function composeDoc(options, directives, { offset, start, value, end }, onError) {
		const opts = Object.assign({ _directives: directives }, options);
		const doc = new Document.Document(void 0, opts);
		const ctx = {
			atKey: false,
			atRoot: true,
			directives: doc.directives,
			options: doc.options,
			schema: doc.schema
		};
		const props = resolveProps.resolveProps(start, {
			indicator: "doc-start",
			next: value ?? end?.[0],
			offset,
			onError,
			parentIndent: 0,
			startOnNewline: true
		});
		if (props.found) {
			doc.directives.docStart = true;
			if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline) onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
		}
		doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
		const contentEnd = doc.contents.range[2];
		const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
		if (re.comment) doc.comment = re.comment;
		doc.range = [
			offset,
			contentEnd,
			re.offset
		];
		return doc;
	}
	exports.composeDoc = composeDoc;
}));

//#endregion
//#region ../../node_modules/yaml/dist/compose/composer.js
var require_composer = /* @__PURE__ */ __commonJSMin(((exports) => {
	var node_process$2 = require("process");
	var directives = require_directives();
	var Document = require_Document();
	var errors = require_errors();
	var identity = require_identity();
	var composeDoc = require_compose_doc();
	var resolveEnd = require_resolve_end();
	function getErrorPos(src) {
		if (typeof src === "number") return [src, src + 1];
		if (Array.isArray(src)) return src.length === 2 ? src : [src[0], src[1]];
		const { offset, source } = src;
		return [offset, offset + (typeof source === "string" ? source.length : 1)];
	}
	function parsePrelude(prelude) {
		let comment = "";
		let atComment = false;
		let afterEmptyLine = false;
		for (let i = 0; i < prelude.length; ++i) {
			const source = prelude[i];
			switch (source[0]) {
				case "#":
					comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
					atComment = true;
					afterEmptyLine = false;
					break;
				case "%":
					if (prelude[i + 1]?.[0] !== "#") i += 1;
					atComment = false;
					break;
				default:
					if (!atComment) afterEmptyLine = true;
					atComment = false;
			}
		}
		return {
			comment,
			afterEmptyLine
		};
	}
	/**
	* Compose a stream of CST nodes into a stream of YAML Documents.
	*
	* ```ts
	* import { Composer, Parser } from 'yaml'
	*
	* const src: string = ...
	* const tokens = new Parser().parse(src)
	* const docs = new Composer().compose(tokens)
	* ```
	*/
	var Composer = class {
		constructor(options = {}) {
			this.doc = null;
			this.atDirectives = false;
			this.prelude = [];
			this.errors = [];
			this.warnings = [];
			this.onError = (source, code, message, warning) => {
				const pos = getErrorPos(source);
				if (warning) this.warnings.push(new errors.YAMLWarning(pos, code, message));
				else this.errors.push(new errors.YAMLParseError(pos, code, message));
			};
			this.directives = new directives.Directives({ version: options.version || "1.2" });
			this.options = options;
		}
		decorate(doc, afterDoc) {
			const { comment, afterEmptyLine } = parsePrelude(this.prelude);
			if (comment) {
				const dc = doc.contents;
				if (afterDoc) doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment;
				else if (afterEmptyLine || doc.directives.docStart || !dc) doc.commentBefore = comment;
				else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
					let it = dc.items[0];
					if (identity.isPair(it)) it = it.key;
					const cb = it.commentBefore;
					it.commentBefore = cb ? `${comment}\n${cb}` : comment;
				} else {
					const cb = dc.commentBefore;
					dc.commentBefore = cb ? `${comment}\n${cb}` : comment;
				}
			}
			if (afterDoc) {
				Array.prototype.push.apply(doc.errors, this.errors);
				Array.prototype.push.apply(doc.warnings, this.warnings);
			} else {
				doc.errors = this.errors;
				doc.warnings = this.warnings;
			}
			this.prelude = [];
			this.errors = [];
			this.warnings = [];
		}
		/**
		* Current stream status information.
		*
		* Mostly useful at the end of input for an empty stream.
		*/
		streamInfo() {
			return {
				comment: parsePrelude(this.prelude).comment,
				directives: this.directives,
				errors: this.errors,
				warnings: this.warnings
			};
		}
		/**
		* Compose tokens into documents.
		*
		* @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
		* @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
		*/
		*compose(tokens, forceDoc = false, endOffset = -1) {
			for (const token of tokens) yield* this.next(token);
			yield* this.end(forceDoc, endOffset);
		}
		/** Advance the composer by one CST token. */
		*next(token) {
			if (node_process$2.env.LOG_STREAM) console.dir(token, { depth: null });
			switch (token.type) {
				case "directive":
					this.directives.add(token.source, (offset, message, warning) => {
						const pos = getErrorPos(token);
						pos[0] += offset;
						this.onError(pos, "BAD_DIRECTIVE", message, warning);
					});
					this.prelude.push(token.source);
					this.atDirectives = true;
					break;
				case "document": {
					const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
					if (this.atDirectives && !doc.directives.docStart) this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
					this.decorate(doc, false);
					if (this.doc) yield this.doc;
					this.doc = doc;
					this.atDirectives = false;
					break;
				}
				case "byte-order-mark":
				case "space": break;
				case "comment":
				case "newline":
					this.prelude.push(token.source);
					break;
				case "error": {
					const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
					const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
					if (this.atDirectives || !this.doc) this.errors.push(error);
					else this.doc.errors.push(error);
					break;
				}
				case "doc-end": {
					if (!this.doc) {
						this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", "Unexpected doc-end without preceding document"));
						break;
					}
					this.doc.directives.docEnd = true;
					const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
					this.decorate(this.doc, true);
					if (end.comment) {
						const dc = this.doc.comment;
						this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment;
					}
					this.doc.range[2] = end.offset;
					break;
				}
				default: this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
			}
		}
		/**
		* Call at end of input to yield any remaining document.
		*
		* @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
		* @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
		*/
		*end(forceDoc = false, endOffset = -1) {
			if (this.doc) {
				this.decorate(this.doc, true);
				yield this.doc;
				this.doc = null;
			} else if (forceDoc) {
				const opts = Object.assign({ _directives: this.directives }, this.options);
				const doc = new Document.Document(void 0, opts);
				if (this.atDirectives) this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
				doc.range = [
					0,
					endOffset,
					endOffset
				];
				this.decorate(doc, false);
				yield doc;
			}
		}
	};
	exports.Composer = Composer;
}));

//#endregion
//#region ../../node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = /* @__PURE__ */ __commonJSMin(((exports) => {
	var resolveBlockScalar = require_resolve_block_scalar();
	var resolveFlowScalar = require_resolve_flow_scalar();
	var errors = require_errors();
	var stringifyString = require_stringifyString();
	function resolveAsScalar(token, strict = true, onError) {
		if (token) {
			const _onError = (pos, code, message) => {
				const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
				if (onError) onError(offset, code, message);
				else throw new errors.YAMLParseError([offset, offset + 1], code, message);
			};
			switch (token.type) {
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
				case "block-scalar": return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
			}
		}
		return null;
	}
	/**
	* Create a new scalar token with `value`
	*
	* Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
	* as this function does not support any schema operations and won't check for such conflicts.
	*
	* @param value The string representation of the value, which will have its content properly indented.
	* @param context.end Comments and whitespace after the end of the value, or after the block scalar header. If undefined, a newline will be added.
	* @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
	* @param context.indent The indent level of the token.
	* @param context.inFlow Is this scalar within a flow collection? This may affect the resolved type of the token's value.
	* @param context.offset The offset position of the token.
	* @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
	*/
	function createScalarToken(value, context) {
		const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
		const source = stringifyString.stringifyString({
			type,
			value
		}, {
			implicitKey,
			indent: indent > 0 ? " ".repeat(indent) : "",
			inFlow,
			options: {
				blockQuote: true,
				lineWidth: -1
			}
		});
		const end = context.end ?? [{
			type: "newline",
			offset: -1,
			indent,
			source: "\n"
		}];
		switch (source[0]) {
			case "|":
			case ">": {
				const he = source.indexOf("\n");
				const head = source.substring(0, he);
				const body = source.substring(he + 1) + "\n";
				const props = [{
					type: "block-scalar-header",
					offset,
					indent,
					source: head
				}];
				if (!addEndtoBlockProps(props, end)) props.push({
					type: "newline",
					offset: -1,
					indent,
					source: "\n"
				});
				return {
					type: "block-scalar",
					offset,
					indent,
					props,
					source: body
				};
			}
			case "\"": return {
				type: "double-quoted-scalar",
				offset,
				indent,
				source,
				end
			};
			case "'": return {
				type: "single-quoted-scalar",
				offset,
				indent,
				source,
				end
			};
			default: return {
				type: "scalar",
				offset,
				indent,
				source,
				end
			};
		}
	}
	/**
	* Set the value of `token` to the given string `value`, overwriting any previous contents and type that it may have.
	*
	* Best efforts are made to retain any comments previously associated with the `token`,
	* though all contents within a collection's `items` will be overwritten.
	*
	* Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
	* as this function does not support any schema operations and won't check for such conflicts.
	*
	* @param token Any token. If it does not include an `indent` value, the value will be stringified as if it were an implicit key.
	* @param value The string representation of the value, which will have its content properly indented.
	* @param context.afterKey In most cases, values after a key should have an additional level of indentation.
	* @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
	* @param context.inFlow Being within a flow collection may affect the resolved type of the token's value.
	* @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
	*/
	function setScalarValue(token, value, context = {}) {
		let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
		let indent = "indent" in token ? token.indent : null;
		if (afterKey && typeof indent === "number") indent += 2;
		if (!type) switch (token.type) {
			case "single-quoted-scalar":
				type = "QUOTE_SINGLE";
				break;
			case "double-quoted-scalar":
				type = "QUOTE_DOUBLE";
				break;
			case "block-scalar": {
				const header = token.props[0];
				if (header.type !== "block-scalar-header") throw new Error("Invalid block scalar header");
				type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
				break;
			}
			default: type = "PLAIN";
		}
		const source = stringifyString.stringifyString({
			type,
			value
		}, {
			implicitKey: implicitKey || indent === null,
			indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
			inFlow,
			options: {
				blockQuote: true,
				lineWidth: -1
			}
		});
		switch (source[0]) {
			case "|":
			case ">":
				setBlockScalarValue(token, source);
				break;
			case "\"":
				setFlowScalarValue(token, source, "double-quoted-scalar");
				break;
			case "'":
				setFlowScalarValue(token, source, "single-quoted-scalar");
				break;
			default: setFlowScalarValue(token, source, "scalar");
		}
	}
	function setBlockScalarValue(token, source) {
		const he = source.indexOf("\n");
		const head = source.substring(0, he);
		const body = source.substring(he + 1) + "\n";
		if (token.type === "block-scalar") {
			const header = token.props[0];
			if (header.type !== "block-scalar-header") throw new Error("Invalid block scalar header");
			header.source = head;
			token.source = body;
		} else {
			const { offset } = token;
			const indent = "indent" in token ? token.indent : -1;
			const props = [{
				type: "block-scalar-header",
				offset,
				indent,
				source: head
			}];
			if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0)) props.push({
				type: "newline",
				offset: -1,
				indent,
				source: "\n"
			});
			for (const key of Object.keys(token)) if (key !== "type" && key !== "offset") delete token[key];
			Object.assign(token, {
				type: "block-scalar",
				indent,
				props,
				source: body
			});
		}
	}
	/** @returns `true` if last token is a newline */
	function addEndtoBlockProps(props, end) {
		if (end) for (const st of end) switch (st.type) {
			case "space":
			case "comment":
				props.push(st);
				break;
			case "newline":
				props.push(st);
				return true;
		}
		return false;
	}
	function setFlowScalarValue(token, source, type) {
		switch (token.type) {
			case "scalar":
			case "double-quoted-scalar":
			case "single-quoted-scalar":
				token.type = type;
				token.source = source;
				break;
			case "block-scalar": {
				const end = token.props.slice(1);
				let oa = source.length;
				if (token.props[0].type === "block-scalar-header") oa -= token.props[0].source.length;
				for (const tok of end) tok.offset += oa;
				delete token.props;
				Object.assign(token, {
					type,
					source,
					end
				});
				break;
			}
			case "block-map":
			case "block-seq": {
				const nl = {
					type: "newline",
					offset: token.offset + source.length,
					indent: token.indent,
					source: "\n"
				};
				delete token.items;
				Object.assign(token, {
					type,
					source,
					end: [nl]
				});
				break;
			}
			default: {
				const indent = "indent" in token ? token.indent : -1;
				const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
				for (const key of Object.keys(token)) if (key !== "type" && key !== "offset") delete token[key];
				Object.assign(token, {
					type,
					indent,
					source,
					end
				});
			}
		}
	}
	exports.createScalarToken = createScalarToken;
	exports.resolveAsScalar = resolveAsScalar;
	exports.setScalarValue = setScalarValue;
}));

//#endregion
//#region ../../node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Stringify a CST document, token, or collection item
	*
	* Fair warning: This applies no validation whatsoever, and
	* simply concatenates the sources in their logical order.
	*/
	const stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
	function stringifyToken(token) {
		switch (token.type) {
			case "block-scalar": {
				let res = "";
				for (const tok of token.props) res += stringifyToken(tok);
				return res + token.source;
			}
			case "block-map":
			case "block-seq": {
				let res = "";
				for (const item of token.items) res += stringifyItem(item);
				return res;
			}
			case "flow-collection": {
				let res = token.start.source;
				for (const item of token.items) res += stringifyItem(item);
				for (const st of token.end) res += st.source;
				return res;
			}
			case "document": {
				let res = stringifyItem(token);
				if (token.end) for (const st of token.end) res += st.source;
				return res;
			}
			default: {
				let res = token.source;
				if ("end" in token && token.end) for (const st of token.end) res += st.source;
				return res;
			}
		}
	}
	function stringifyItem({ start, key, sep, value }) {
		let res = "";
		for (const st of start) res += st.source;
		if (key) res += stringifyToken(key);
		if (sep) for (const st of sep) res += st.source;
		if (value) res += stringifyToken(value);
		return res;
	}
	exports.stringify = stringify;
}));

//#endregion
//#region ../../node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = /* @__PURE__ */ __commonJSMin(((exports) => {
	const BREAK = Symbol("break visit");
	const SKIP = Symbol("skip children");
	const REMOVE = Symbol("remove item");
	/**
	* Apply a visitor to a CST document or item.
	*
	* Walks through the tree (depth-first) starting from the root, calling a
	* `visitor` function with two arguments when entering each item:
	*   - `item`: The current item, which included the following members:
	*     - `start: SourceToken[]` – Source tokens before the key or value,
	*       possibly including its anchor or tag.
	*     - `key?: Token | null` – Set for pair values. May then be `null`, if
	*       the key before the `:` separator is empty.
	*     - `sep?: SourceToken[]` – Source tokens between the key and the value,
	*       which should include the `:` map value indicator if `value` is set.
	*     - `value?: Token` – The value of a sequence item, or of a map pair.
	*   - `path`: The steps from the root to the current node, as an array of
	*     `['key' | 'value', number]` tuples.
	*
	* The return value of the visitor may be used to control the traversal:
	*   - `undefined` (default): Do nothing and continue
	*   - `visit.SKIP`: Do not visit the children of this token, continue with
	*      next sibling
	*   - `visit.BREAK`: Terminate traversal completely
	*   - `visit.REMOVE`: Remove the current item, then continue with the next one
	*   - `number`: Set the index of the next step. This is useful especially if
	*     the index of the current token has changed.
	*   - `function`: Define the next visitor for this item. After the original
	*     visitor is called on item entry, next visitors are called after handling
	*     a non-empty `key` and when exiting the item.
	*/
	function visit(cst, visitor) {
		if ("type" in cst && cst.type === "document") cst = {
			start: cst.start,
			value: cst.value
		};
		_visit(Object.freeze([]), cst, visitor);
	}
	/** Terminate visit traversal completely */
	visit.BREAK = BREAK;
	/** Do not visit the children of the current item */
	visit.SKIP = SKIP;
	/** Remove the current item */
	visit.REMOVE = REMOVE;
	/** Find the item at `path` from `cst` as the root */
	visit.itemAtPath = (cst, path) => {
		let item = cst;
		for (const [field, index] of path) {
			const tok = item?.[field];
			if (tok && "items" in tok) item = tok.items[index];
			else return void 0;
		}
		return item;
	};
	/**
	* Get the immediate parent collection of the item at `path` from `cst` as the root.
	*
	* Throws an error if the collection is not found, which should never happen if the item itself exists.
	*/
	visit.parentCollection = (cst, path) => {
		const parent = visit.itemAtPath(cst, path.slice(0, -1));
		const field = path[path.length - 1][0];
		const coll = parent?.[field];
		if (coll && "items" in coll) return coll;
		throw new Error("Parent collection not found");
	};
	function _visit(path, item, visitor) {
		let ctrl = visitor(item, path);
		if (typeof ctrl === "symbol") return ctrl;
		for (const field of ["key", "value"]) {
			const token = item[field];
			if (token && "items" in token) {
				for (let i = 0; i < token.items.length; ++i) {
					const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
					if (typeof ci === "number") i = ci - 1;
					else if (ci === BREAK) return BREAK;
					else if (ci === REMOVE) {
						token.items.splice(i, 1);
						i -= 1;
					}
				}
				if (typeof ctrl === "function" && field === "key") ctrl = ctrl(item, path);
			}
		}
		return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
	}
	exports.visit = visit;
}));

//#endregion
//#region ../../node_modules/yaml/dist/parse/cst.js
var require_cst = /* @__PURE__ */ __commonJSMin(((exports) => {
	var cstScalar = require_cst_scalar();
	var cstStringify = require_cst_stringify();
	var cstVisit = require_cst_visit();
	/** The byte order mark */
	const BOM = "﻿";
	/** Start of doc-mode */
	const DOCUMENT = "";
	/** Unexpected end of flow-mode */
	const FLOW_END = "";
	/** Next token is a scalar value */
	const SCALAR = "";
	/** @returns `true` if `token` is a flow or block collection */
	const isCollection = (token) => !!token && "items" in token;
	/** @returns `true` if `token` is a flow or block scalar; not an alias */
	const isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
	/* istanbul ignore next */
	/** Get a printable representation of a lexer token */
	function prettyToken(token) {
		switch (token) {
			case BOM: return "<BOM>";
			case DOCUMENT: return "<DOC>";
			case FLOW_END: return "<FLOW_END>";
			case SCALAR: return "<SCALAR>";
			default: return JSON.stringify(token);
		}
	}
	/** Identify the type of a lexer token. May return `null` for unknown tokens. */
	function tokenType(source) {
		switch (source) {
			case BOM: return "byte-order-mark";
			case DOCUMENT: return "doc-mode";
			case FLOW_END: return "flow-error-end";
			case SCALAR: return "scalar";
			case "---": return "doc-start";
			case "...": return "doc-end";
			case "":
			case "\n":
			case "\r\n": return "newline";
			case "-": return "seq-item-ind";
			case "?": return "explicit-key-ind";
			case ":": return "map-value-ind";
			case "{": return "flow-map-start";
			case "}": return "flow-map-end";
			case "[": return "flow-seq-start";
			case "]": return "flow-seq-end";
			case ",": return "comma";
		}
		switch (source[0]) {
			case " ":
			case "	": return "space";
			case "#": return "comment";
			case "%": return "directive-line";
			case "*": return "alias";
			case "&": return "anchor";
			case "!": return "tag";
			case "'": return "single-quoted-scalar";
			case "\"": return "double-quoted-scalar";
			case "|":
			case ">": return "block-scalar-header";
		}
		return null;
	}
	exports.createScalarToken = cstScalar.createScalarToken;
	exports.resolveAsScalar = cstScalar.resolveAsScalar;
	exports.setScalarValue = cstScalar.setScalarValue;
	exports.stringify = cstStringify.stringify;
	exports.visit = cstVisit.visit;
	exports.BOM = BOM;
	exports.DOCUMENT = DOCUMENT;
	exports.FLOW_END = FLOW_END;
	exports.SCALAR = SCALAR;
	exports.isCollection = isCollection;
	exports.isScalar = isScalar;
	exports.prettyToken = prettyToken;
	exports.tokenType = tokenType;
}));

//#endregion
//#region ../../node_modules/yaml/dist/parse/lexer.js
var require_lexer = /* @__PURE__ */ __commonJSMin(((exports) => {
	var cst = require_cst();
	function isEmpty(ch) {
		switch (ch) {
			case void 0:
			case " ":
			case "\n":
			case "\r":
			case "	": return true;
			default: return false;
		}
	}
	const hexDigits = /* @__PURE__ */ new Set("0123456789ABCDEFabcdef");
	const tagChars = /* @__PURE__ */ new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
	const flowIndicatorChars = /* @__PURE__ */ new Set(",[]{}");
	const invalidAnchorChars = /* @__PURE__ */ new Set(" ,[]{}\n\r	");
	const isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
	/**
	* Splits an input string into lexical tokens, i.e. smaller strings that are
	* easily identifiable by `tokens.tokenType()`.
	*
	* Lexing starts always in a "stream" context. Incomplete input may be buffered
	* until a complete token can be emitted.
	*
	* In addition to slices of the original input, the following control characters
	* may also be emitted:
	*
	* - `\x02` (Start of Text): A document starts with the next token
	* - `\x18` (Cancel): Unexpected end of flow-mode (indicates an error)
	* - `\x1f` (Unit Separator): Next token is a scalar value
	* - `\u{FEFF}` (Byte order mark): Emitted separately outside documents
	*/
	var Lexer = class {
		constructor() {
			/**
			* Flag indicating whether the end of the current buffer marks the end of
			* all input
			*/
			this.atEnd = false;
			/**
			* Explicit indent set in block scalar header, as an offset from the current
			* minimum indent, so e.g. set to 1 from a header `|2+`. Set to -1 if not
			* explicitly set.
			*/
			this.blockScalarIndent = -1;
			/**
			* Block scalars that include a + (keep) chomping indicator in their header
			* include trailing empty lines, which are otherwise excluded from the
			* scalar's contents.
			*/
			this.blockScalarKeep = false;
			/** Current input */
			this.buffer = "";
			/**
			* Flag noting whether the map value indicator : can immediately follow this
			* node within a flow context.
			*/
			this.flowKey = false;
			/** Count of surrounding flow collection levels. */
			this.flowLevel = 0;
			/**
			* Minimum level of indentation required for next lines to be parsed as a
			* part of the current scalar value.
			*/
			this.indentNext = 0;
			/** Indentation level of the current line. */
			this.indentValue = 0;
			/** Position of the next \n character. */
			this.lineEndPos = null;
			/** Stores the state of the lexer if reaching the end of incpomplete input */
			this.next = null;
			/** A pointer to `buffer`; the current position of the lexer. */
			this.pos = 0;
		}
		/**
		* Generate YAML tokens from the `source` string. If `incomplete`,
		* a part of the last line may be left as a buffer for the next call.
		*
		* @returns A generator of lexical tokens
		*/
		*lex(source, incomplete = false) {
			if (source) {
				if (typeof source !== "string") throw TypeError("source is not a string");
				this.buffer = this.buffer ? this.buffer + source : source;
				this.lineEndPos = null;
			}
			this.atEnd = !incomplete;
			let next = this.next ?? "stream";
			while (next && (incomplete || this.hasChars(1))) next = yield* this.parseNext(next);
		}
		atLineEnd() {
			let i = this.pos;
			let ch = this.buffer[i];
			while (ch === " " || ch === "	") ch = this.buffer[++i];
			if (!ch || ch === "#" || ch === "\n") return true;
			if (ch === "\r") return this.buffer[i + 1] === "\n";
			return false;
		}
		charAt(n) {
			return this.buffer[this.pos + n];
		}
		continueScalar(offset) {
			let ch = this.buffer[offset];
			if (this.indentNext > 0) {
				let indent = 0;
				while (ch === " ") ch = this.buffer[++indent + offset];
				if (ch === "\r") {
					const next = this.buffer[indent + offset + 1];
					if (next === "\n" || !next && !this.atEnd) return offset + indent + 1;
				}
				return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
			}
			if (ch === "-" || ch === ".") {
				const dt = this.buffer.substr(offset, 3);
				if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3])) return -1;
			}
			return offset;
		}
		getLine() {
			let end = this.lineEndPos;
			if (typeof end !== "number" || end !== -1 && end < this.pos) {
				end = this.buffer.indexOf("\n", this.pos);
				this.lineEndPos = end;
			}
			if (end === -1) return this.atEnd ? this.buffer.substring(this.pos) : null;
			if (this.buffer[end - 1] === "\r") end -= 1;
			return this.buffer.substring(this.pos, end);
		}
		hasChars(n) {
			return this.pos + n <= this.buffer.length;
		}
		setNext(state) {
			this.buffer = this.buffer.substring(this.pos);
			this.pos = 0;
			this.lineEndPos = null;
			this.next = state;
			return null;
		}
		peek(n) {
			return this.buffer.substr(this.pos, n);
		}
		*parseNext(next) {
			switch (next) {
				case "stream": return yield* this.parseStream();
				case "line-start": return yield* this.parseLineStart();
				case "block-start": return yield* this.parseBlockStart();
				case "doc": return yield* this.parseDocument();
				case "flow": return yield* this.parseFlowCollection();
				case "quoted-scalar": return yield* this.parseQuotedScalar();
				case "block-scalar": return yield* this.parseBlockScalar();
				case "plain-scalar": return yield* this.parsePlainScalar();
			}
		}
		*parseStream() {
			let line = this.getLine();
			if (line === null) return this.setNext("stream");
			if (line[0] === cst.BOM) {
				yield* this.pushCount(1);
				line = line.substring(1);
			}
			if (line[0] === "%") {
				let dirEnd = line.length;
				let cs = line.indexOf("#");
				while (cs !== -1) {
					const ch = line[cs - 1];
					if (ch === " " || ch === "	") {
						dirEnd = cs - 1;
						break;
					} else cs = line.indexOf("#", cs + 1);
				}
				while (true) {
					const ch = line[dirEnd - 1];
					if (ch === " " || ch === "	") dirEnd -= 1;
					else break;
				}
				const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
				yield* this.pushCount(line.length - n);
				this.pushNewline();
				return "stream";
			}
			if (this.atLineEnd()) {
				const sp = yield* this.pushSpaces(true);
				yield* this.pushCount(line.length - sp);
				yield* this.pushNewline();
				return "stream";
			}
			yield cst.DOCUMENT;
			return yield* this.parseLineStart();
		}
		*parseLineStart() {
			const ch = this.charAt(0);
			if (!ch && !this.atEnd) return this.setNext("line-start");
			if (ch === "-" || ch === ".") {
				if (!this.atEnd && !this.hasChars(4)) return this.setNext("line-start");
				const s = this.peek(3);
				if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
					yield* this.pushCount(3);
					this.indentValue = 0;
					this.indentNext = 0;
					return s === "---" ? "doc" : "stream";
				}
			}
			this.indentValue = yield* this.pushSpaces(false);
			if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1))) this.indentNext = this.indentValue;
			return yield* this.parseBlockStart();
		}
		*parseBlockStart() {
			const [ch0, ch1] = this.peek(2);
			if (!ch1 && !this.atEnd) return this.setNext("block-start");
			if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
				const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
				this.indentNext = this.indentValue + 1;
				this.indentValue += n;
				return yield* this.parseBlockStart();
			}
			return "doc";
		}
		*parseDocument() {
			yield* this.pushSpaces(true);
			const line = this.getLine();
			if (line === null) return this.setNext("doc");
			let n = yield* this.pushIndicators();
			switch (line[n]) {
				case "#": yield* this.pushCount(line.length - n);
				case void 0:
					yield* this.pushNewline();
					return yield* this.parseLineStart();
				case "{":
				case "[":
					yield* this.pushCount(1);
					this.flowKey = false;
					this.flowLevel = 1;
					return "flow";
				case "}":
				case "]":
					yield* this.pushCount(1);
					return "doc";
				case "*":
					yield* this.pushUntil(isNotAnchorChar);
					return "doc";
				case "\"":
				case "'": return yield* this.parseQuotedScalar();
				case "|":
				case ">":
					n += yield* this.parseBlockScalarHeader();
					n += yield* this.pushSpaces(true);
					yield* this.pushCount(line.length - n);
					yield* this.pushNewline();
					return yield* this.parseBlockScalar();
				default: return yield* this.parsePlainScalar();
			}
		}
		*parseFlowCollection() {
			let nl, sp;
			let indent = -1;
			do {
				nl = yield* this.pushNewline();
				if (nl > 0) {
					sp = yield* this.pushSpaces(false);
					this.indentValue = indent = sp;
				} else sp = 0;
				sp += yield* this.pushSpaces(true);
			} while (nl + sp > 0);
			const line = this.getLine();
			if (line === null) return this.setNext("flow");
			if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
				if (!(indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}"))) {
					this.flowLevel = 0;
					yield cst.FLOW_END;
					return yield* this.parseLineStart();
				}
			}
			let n = 0;
			while (line[n] === ",") {
				n += yield* this.pushCount(1);
				n += yield* this.pushSpaces(true);
				this.flowKey = false;
			}
			n += yield* this.pushIndicators();
			switch (line[n]) {
				case void 0: return "flow";
				case "#":
					yield* this.pushCount(line.length - n);
					return "flow";
				case "{":
				case "[":
					yield* this.pushCount(1);
					this.flowKey = false;
					this.flowLevel += 1;
					return "flow";
				case "}":
				case "]":
					yield* this.pushCount(1);
					this.flowKey = true;
					this.flowLevel -= 1;
					return this.flowLevel ? "flow" : "doc";
				case "*":
					yield* this.pushUntil(isNotAnchorChar);
					return "flow";
				case "\"":
				case "'":
					this.flowKey = true;
					return yield* this.parseQuotedScalar();
				case ":": {
					const next = this.charAt(1);
					if (this.flowKey || isEmpty(next) || next === ",") {
						this.flowKey = false;
						yield* this.pushCount(1);
						yield* this.pushSpaces(true);
						return "flow";
					}
				}
				default:
					this.flowKey = false;
					return yield* this.parsePlainScalar();
			}
		}
		*parseQuotedScalar() {
			const quote = this.charAt(0);
			let end = this.buffer.indexOf(quote, this.pos + 1);
			if (quote === "'") while (end !== -1 && this.buffer[end + 1] === "'") end = this.buffer.indexOf("'", end + 2);
			else while (end !== -1) {
				let n = 0;
				while (this.buffer[end - 1 - n] === "\\") n += 1;
				if (n % 2 === 0) break;
				end = this.buffer.indexOf("\"", end + 1);
			}
			const qb = this.buffer.substring(0, end);
			let nl = qb.indexOf("\n", this.pos);
			if (nl !== -1) {
				while (nl !== -1) {
					const cs = this.continueScalar(nl + 1);
					if (cs === -1) break;
					nl = qb.indexOf("\n", cs);
				}
				if (nl !== -1) end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
			}
			if (end === -1) {
				if (!this.atEnd) return this.setNext("quoted-scalar");
				end = this.buffer.length;
			}
			yield* this.pushToIndex(end + 1, false);
			return this.flowLevel ? "flow" : "doc";
		}
		*parseBlockScalarHeader() {
			this.blockScalarIndent = -1;
			this.blockScalarKeep = false;
			let i = this.pos;
			while (true) {
				const ch = this.buffer[++i];
				if (ch === "+") this.blockScalarKeep = true;
				else if (ch > "0" && ch <= "9") this.blockScalarIndent = Number(ch) - 1;
				else if (ch !== "-") break;
			}
			return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
		}
		*parseBlockScalar() {
			let nl = this.pos - 1;
			let indent = 0;
			let ch;
			loop: for (let i = this.pos; ch = this.buffer[i]; ++i) switch (ch) {
				case " ":
					indent += 1;
					break;
				case "\n":
					nl = i;
					indent = 0;
					break;
				case "\r": {
					const next = this.buffer[i + 1];
					if (!next && !this.atEnd) return this.setNext("block-scalar");
					if (next === "\n") break;
				}
				default: break loop;
			}
			if (!ch && !this.atEnd) return this.setNext("block-scalar");
			if (indent >= this.indentNext) {
				if (this.blockScalarIndent === -1) this.indentNext = indent;
				else this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
				do {
					const cs = this.continueScalar(nl + 1);
					if (cs === -1) break;
					nl = this.buffer.indexOf("\n", cs);
				} while (nl !== -1);
				if (nl === -1) {
					if (!this.atEnd) return this.setNext("block-scalar");
					nl = this.buffer.length;
				}
			}
			let i = nl + 1;
			ch = this.buffer[i];
			while (ch === " ") ch = this.buffer[++i];
			if (ch === "	") {
				while (ch === "	" || ch === " " || ch === "\r" || ch === "\n") ch = this.buffer[++i];
				nl = i - 1;
			} else if (!this.blockScalarKeep) do {
				let i = nl - 1;
				let ch = this.buffer[i];
				if (ch === "\r") ch = this.buffer[--i];
				const lastChar = i;
				while (ch === " ") ch = this.buffer[--i];
				if (ch === "\n" && i >= this.pos && i + 1 + indent > lastChar) nl = i;
				else break;
			} while (true);
			yield cst.SCALAR;
			yield* this.pushToIndex(nl + 1, true);
			return yield* this.parseLineStart();
		}
		*parsePlainScalar() {
			const inFlow = this.flowLevel > 0;
			let end = this.pos - 1;
			let i = this.pos - 1;
			let ch;
			while (ch = this.buffer[++i]) if (ch === ":") {
				const next = this.buffer[i + 1];
				if (isEmpty(next) || inFlow && flowIndicatorChars.has(next)) break;
				end = i;
			} else if (isEmpty(ch)) {
				let next = this.buffer[i + 1];
				if (ch === "\r") if (next === "\n") {
					i += 1;
					ch = "\n";
					next = this.buffer[i + 1];
				} else end = i;
				if (next === "#" || inFlow && flowIndicatorChars.has(next)) break;
				if (ch === "\n") {
					const cs = this.continueScalar(i + 1);
					if (cs === -1) break;
					i = Math.max(i, cs - 2);
				}
			} else {
				if (inFlow && flowIndicatorChars.has(ch)) break;
				end = i;
			}
			if (!ch && !this.atEnd) return this.setNext("plain-scalar");
			yield cst.SCALAR;
			yield* this.pushToIndex(end + 1, true);
			return inFlow ? "flow" : "doc";
		}
		*pushCount(n) {
			if (n > 0) {
				yield this.buffer.substr(this.pos, n);
				this.pos += n;
				return n;
			}
			return 0;
		}
		*pushToIndex(i, allowEmpty) {
			const s = this.buffer.slice(this.pos, i);
			if (s) {
				yield s;
				this.pos += s.length;
				return s.length;
			} else if (allowEmpty) yield "";
			return 0;
		}
		*pushIndicators() {
			switch (this.charAt(0)) {
				case "!": return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
				case "&": return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
				case "-":
				case "?":
				case ":": {
					const inFlow = this.flowLevel > 0;
					const ch1 = this.charAt(1);
					if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
						if (!inFlow) this.indentNext = this.indentValue + 1;
						else if (this.flowKey) this.flowKey = false;
						return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
					}
				}
			}
			return 0;
		}
		*pushTag() {
			if (this.charAt(1) === "<") {
				let i = this.pos + 2;
				let ch = this.buffer[i];
				while (!isEmpty(ch) && ch !== ">") ch = this.buffer[++i];
				return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
			} else {
				let i = this.pos + 1;
				let ch = this.buffer[i];
				while (ch) if (tagChars.has(ch)) ch = this.buffer[++i];
				else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) ch = this.buffer[i += 3];
				else break;
				return yield* this.pushToIndex(i, false);
			}
		}
		*pushNewline() {
			const ch = this.buffer[this.pos];
			if (ch === "\n") return yield* this.pushCount(1);
			else if (ch === "\r" && this.charAt(1) === "\n") return yield* this.pushCount(2);
			else return 0;
		}
		*pushSpaces(allowTabs) {
			let i = this.pos - 1;
			let ch;
			do
				ch = this.buffer[++i];
			while (ch === " " || allowTabs && ch === "	");
			const n = i - this.pos;
			if (n > 0) {
				yield this.buffer.substr(this.pos, n);
				this.pos = i;
			}
			return n;
		}
		*pushUntil(test) {
			let i = this.pos;
			let ch = this.buffer[i];
			while (!test(ch)) ch = this.buffer[++i];
			return yield* this.pushToIndex(i, false);
		}
	};
	exports.Lexer = Lexer;
}));

//#endregion
//#region ../../node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Tracks newlines during parsing in order to provide an efficient API for
	* determining the one-indexed `{ line, col }` position for any offset
	* within the input.
	*/
	var LineCounter = class {
		constructor() {
			this.lineStarts = [];
			/**
			* Should be called in ascending order. Otherwise, call
			* `lineCounter.lineStarts.sort()` before calling `linePos()`.
			*/
			this.addNewLine = (offset) => this.lineStarts.push(offset);
			/**
			* Performs a binary search and returns the 1-indexed { line, col }
			* position of `offset`. If `line === 0`, `addNewLine` has never been
			* called or `offset` is before the first known newline.
			*/
			this.linePos = (offset) => {
				let low = 0;
				let high = this.lineStarts.length;
				while (low < high) {
					const mid = low + high >> 1;
					if (this.lineStarts[mid] < offset) low = mid + 1;
					else high = mid;
				}
				if (this.lineStarts[low] === offset) return {
					line: low + 1,
					col: 1
				};
				if (low === 0) return {
					line: 0,
					col: offset
				};
				const start = this.lineStarts[low - 1];
				return {
					line: low,
					col: offset - start + 1
				};
			};
		}
	};
	exports.LineCounter = LineCounter;
}));

//#endregion
//#region ../../node_modules/yaml/dist/parse/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin(((exports) => {
	var node_process$1 = require("process");
	var cst = require_cst();
	var lexer = require_lexer();
	function includesToken(list, type) {
		for (let i = 0; i < list.length; ++i) if (list[i].type === type) return true;
		return false;
	}
	function findNonEmptyIndex(list) {
		for (let i = 0; i < list.length; ++i) switch (list[i].type) {
			case "space":
			case "comment":
			case "newline": break;
			default: return i;
		}
		return -1;
	}
	function isFlowToken(token) {
		switch (token?.type) {
			case "alias":
			case "scalar":
			case "single-quoted-scalar":
			case "double-quoted-scalar":
			case "flow-collection": return true;
			default: return false;
		}
	}
	function getPrevProps(parent) {
		switch (parent.type) {
			case "document": return parent.start;
			case "block-map": {
				const it = parent.items[parent.items.length - 1];
				return it.sep ?? it.start;
			}
			case "block-seq": return parent.items[parent.items.length - 1].start;
			default: return [];
		}
	}
	/** Note: May modify input array */
	function getFirstKeyStartProps(prev) {
		if (prev.length === 0) return [];
		let i = prev.length;
		loop: while (--i >= 0) switch (prev[i].type) {
			case "doc-start":
			case "explicit-key-ind":
			case "map-value-ind":
			case "seq-item-ind":
			case "newline": break loop;
		}
		while (prev[++i]?.type === "space");
		return prev.splice(i, prev.length);
	}
	function fixFlowSeqItems(fc) {
		if (fc.start.type === "flow-seq-start") {
			for (const it of fc.items) if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
				if (it.key) it.value = it.key;
				delete it.key;
				if (isFlowToken(it.value)) if (it.value.end) Array.prototype.push.apply(it.value.end, it.sep);
				else it.value.end = it.sep;
				else Array.prototype.push.apply(it.start, it.sep);
				delete it.sep;
			}
		}
	}
	/**
	* A YAML concrete syntax tree (CST) parser
	*
	* ```ts
	* const src: string = ...
	* for (const token of new Parser().parse(src)) {
	*   // token: Token
	* }
	* ```
	*
	* To use the parser with a user-provided lexer:
	*
	* ```ts
	* function* parse(source: string, lexer: Lexer) {
	*   const parser = new Parser()
	*   for (const lexeme of lexer.lex(source))
	*     yield* parser.next(lexeme)
	*   yield* parser.end()
	* }
	*
	* const src: string = ...
	* const lexer = new Lexer()
	* for (const token of parse(src, lexer)) {
	*   // token: Token
	* }
	* ```
	*/
	var Parser = class {
		/**
		* @param onNewLine - If defined, called separately with the start position of
		*   each new line (in `parse()`, including the start of input).
		*/
		constructor(onNewLine) {
			/** If true, space and sequence indicators count as indentation */
			this.atNewLine = true;
			/** If true, next token is a scalar value */
			this.atScalar = false;
			/** Current indentation level */
			this.indent = 0;
			/** Current offset since the start of parsing */
			this.offset = 0;
			/** On the same line with a block map key */
			this.onKeyLine = false;
			/** Top indicates the node that's currently being built */
			this.stack = [];
			/** The source of the current token, set in parse() */
			this.source = "";
			/** The type of the current token, set in parse() */
			this.type = "";
			this.lexer = new lexer.Lexer();
			this.onNewLine = onNewLine;
		}
		/**
		* Parse `source` as a YAML stream.
		* If `incomplete`, a part of the last line may be left as a buffer for the next call.
		*
		* Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
		*
		* @returns A generator of tokens representing each directive, document, and other structure.
		*/
		*parse(source, incomplete = false) {
			if (this.onNewLine && this.offset === 0) this.onNewLine(0);
			for (const lexeme of this.lexer.lex(source, incomplete)) yield* this.next(lexeme);
			if (!incomplete) yield* this.end();
		}
		/**
		* Advance the parser by the `source` of one lexical token.
		*/
		*next(source) {
			this.source = source;
			if (node_process$1.env.LOG_TOKENS) console.log("|", cst.prettyToken(source));
			if (this.atScalar) {
				this.atScalar = false;
				yield* this.step();
				this.offset += source.length;
				return;
			}
			const type = cst.tokenType(source);
			if (!type) {
				const message = `Not a YAML token: ${source}`;
				yield* this.pop({
					type: "error",
					offset: this.offset,
					message,
					source
				});
				this.offset += source.length;
			} else if (type === "scalar") {
				this.atNewLine = false;
				this.atScalar = true;
				this.type = "scalar";
			} else {
				this.type = type;
				yield* this.step();
				switch (type) {
					case "newline":
						this.atNewLine = true;
						this.indent = 0;
						if (this.onNewLine) this.onNewLine(this.offset + source.length);
						break;
					case "space":
						if (this.atNewLine && source[0] === " ") this.indent += source.length;
						break;
					case "explicit-key-ind":
					case "map-value-ind":
					case "seq-item-ind":
						if (this.atNewLine) this.indent += source.length;
						break;
					case "doc-mode":
					case "flow-error-end": return;
					default: this.atNewLine = false;
				}
				this.offset += source.length;
			}
		}
		/** Call at end of input to push out any remaining constructions */
		*end() {
			while (this.stack.length > 0) yield* this.pop();
		}
		get sourceToken() {
			return {
				type: this.type,
				offset: this.offset,
				indent: this.indent,
				source: this.source
			};
		}
		*step() {
			const top = this.peek(1);
			if (this.type === "doc-end" && top?.type !== "doc-end") {
				while (this.stack.length > 0) yield* this.pop();
				this.stack.push({
					type: "doc-end",
					offset: this.offset,
					source: this.source
				});
				return;
			}
			if (!top) return yield* this.stream();
			switch (top.type) {
				case "document": return yield* this.document(top);
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": return yield* this.scalar(top);
				case "block-scalar": return yield* this.blockScalar(top);
				case "block-map": return yield* this.blockMap(top);
				case "block-seq": return yield* this.blockSequence(top);
				case "flow-collection": return yield* this.flowCollection(top);
				case "doc-end": return yield* this.documentEnd(top);
			}
			/* istanbul ignore next should not happen */
			yield* this.pop();
		}
		peek(n) {
			return this.stack[this.stack.length - n];
		}
		*pop(error) {
			const token = error ?? this.stack.pop();
			/* istanbul ignore if should not happen */
			if (!token) yield {
				type: "error",
				offset: this.offset,
				source: "",
				message: "Tried to pop an empty stack"
			};
			else if (this.stack.length === 0) yield token;
			else {
				const top = this.peek(1);
				if (token.type === "block-scalar") token.indent = "indent" in top ? top.indent : 0;
				else if (token.type === "flow-collection" && top.type === "document") token.indent = 0;
				if (token.type === "flow-collection") fixFlowSeqItems(token);
				switch (top.type) {
					case "document":
						top.value = token;
						break;
					case "block-scalar":
						top.props.push(token);
						break;
					case "block-map": {
						const it = top.items[top.items.length - 1];
						if (it.value) {
							top.items.push({
								start: [],
								key: token,
								sep: []
							});
							this.onKeyLine = true;
							return;
						} else if (it.sep) it.value = token;
						else {
							Object.assign(it, {
								key: token,
								sep: []
							});
							this.onKeyLine = !it.explicitKey;
							return;
						}
						break;
					}
					case "block-seq": {
						const it = top.items[top.items.length - 1];
						if (it.value) top.items.push({
							start: [],
							value: token
						});
						else it.value = token;
						break;
					}
					case "flow-collection": {
						const it = top.items[top.items.length - 1];
						if (!it || it.value) top.items.push({
							start: [],
							key: token,
							sep: []
						});
						else if (it.sep) it.value = token;
						else Object.assign(it, {
							key: token,
							sep: []
						});
						return;
					}
					default:
						yield* this.pop();
						yield* this.pop(token);
				}
				if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
					const last = token.items[token.items.length - 1];
					if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
						if (top.type === "document") top.end = last.start;
						else top.items.push({ start: last.start });
						token.items.splice(-1, 1);
					}
				}
			}
		}
		*stream() {
			switch (this.type) {
				case "directive-line":
					yield {
						type: "directive",
						offset: this.offset,
						source: this.source
					};
					return;
				case "byte-order-mark":
				case "space":
				case "comment":
				case "newline":
					yield this.sourceToken;
					return;
				case "doc-mode":
				case "doc-start": {
					const doc = {
						type: "document",
						offset: this.offset,
						start: []
					};
					if (this.type === "doc-start") doc.start.push(this.sourceToken);
					this.stack.push(doc);
					return;
				}
			}
			yield {
				type: "error",
				offset: this.offset,
				message: `Unexpected ${this.type} token in YAML stream`,
				source: this.source
			};
		}
		*document(doc) {
			if (doc.value) return yield* this.lineEnd(doc);
			switch (this.type) {
				case "doc-start":
					if (findNonEmptyIndex(doc.start) !== -1) {
						yield* this.pop();
						yield* this.step();
					} else doc.start.push(this.sourceToken);
					return;
				case "anchor":
				case "tag":
				case "space":
				case "comment":
				case "newline":
					doc.start.push(this.sourceToken);
					return;
			}
			const bv = this.startBlockValue(doc);
			if (bv) this.stack.push(bv);
			else yield {
				type: "error",
				offset: this.offset,
				message: `Unexpected ${this.type} token in YAML document`,
				source: this.source
			};
		}
		*scalar(scalar) {
			if (this.type === "map-value-ind") {
				const start = getFirstKeyStartProps(getPrevProps(this.peek(2)));
				let sep;
				if (scalar.end) {
					sep = scalar.end;
					sep.push(this.sourceToken);
					delete scalar.end;
				} else sep = [this.sourceToken];
				const map = {
					type: "block-map",
					offset: scalar.offset,
					indent: scalar.indent,
					items: [{
						start,
						key: scalar,
						sep
					}]
				};
				this.onKeyLine = true;
				this.stack[this.stack.length - 1] = map;
			} else yield* this.lineEnd(scalar);
		}
		*blockScalar(scalar) {
			switch (this.type) {
				case "space":
				case "comment":
				case "newline":
					scalar.props.push(this.sourceToken);
					return;
				case "scalar":
					scalar.source = this.source;
					this.atNewLine = true;
					this.indent = 0;
					if (this.onNewLine) {
						let nl = this.source.indexOf("\n") + 1;
						while (nl !== 0) {
							this.onNewLine(this.offset + nl);
							nl = this.source.indexOf("\n", nl) + 1;
						}
					}
					yield* this.pop();
					break;
				default:
					yield* this.pop();
					yield* this.step();
			}
		}
		*blockMap(map) {
			const it = map.items[map.items.length - 1];
			switch (this.type) {
				case "newline":
					this.onKeyLine = false;
					if (it.value) {
						const end = "end" in it.value ? it.value.end : void 0;
						if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment") end?.push(this.sourceToken);
						else map.items.push({ start: [this.sourceToken] });
					} else if (it.sep) it.sep.push(this.sourceToken);
					else it.start.push(this.sourceToken);
					return;
				case "space":
				case "comment":
					if (it.value) map.items.push({ start: [this.sourceToken] });
					else if (it.sep) it.sep.push(this.sourceToken);
					else {
						if (this.atIndentedComment(it.start, map.indent)) {
							const end = map.items[map.items.length - 2]?.value?.end;
							if (Array.isArray(end)) {
								Array.prototype.push.apply(end, it.start);
								end.push(this.sourceToken);
								map.items.pop();
								return;
							}
						}
						it.start.push(this.sourceToken);
					}
					return;
			}
			if (this.indent >= map.indent) {
				const atMapIndent = !this.onKeyLine && this.indent === map.indent;
				const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
				let start = [];
				if (atNextItem && it.sep && !it.value) {
					const nl = [];
					for (let i = 0; i < it.sep.length; ++i) {
						const st = it.sep[i];
						switch (st.type) {
							case "newline":
								nl.push(i);
								break;
							case "space": break;
							case "comment":
								if (st.indent > map.indent) nl.length = 0;
								break;
							default: nl.length = 0;
						}
					}
					if (nl.length >= 2) start = it.sep.splice(nl[1]);
				}
				switch (this.type) {
					case "anchor":
					case "tag":
						if (atNextItem || it.value) {
							start.push(this.sourceToken);
							map.items.push({ start });
							this.onKeyLine = true;
						} else if (it.sep) it.sep.push(this.sourceToken);
						else it.start.push(this.sourceToken);
						return;
					case "explicit-key-ind":
						if (!it.sep && !it.explicitKey) {
							it.start.push(this.sourceToken);
							it.explicitKey = true;
						} else if (atNextItem || it.value) {
							start.push(this.sourceToken);
							map.items.push({
								start,
								explicitKey: true
							});
						} else this.stack.push({
							type: "block-map",
							offset: this.offset,
							indent: this.indent,
							items: [{
								start: [this.sourceToken],
								explicitKey: true
							}]
						});
						this.onKeyLine = true;
						return;
					case "map-value-ind":
						if (it.explicitKey) if (!it.sep) if (includesToken(it.start, "newline")) Object.assign(it, {
							key: null,
							sep: [this.sourceToken]
						});
						else {
							const start = getFirstKeyStartProps(it.start);
							this.stack.push({
								type: "block-map",
								offset: this.offset,
								indent: this.indent,
								items: [{
									start,
									key: null,
									sep: [this.sourceToken]
								}]
							});
						}
						else if (it.value) map.items.push({
							start: [],
							key: null,
							sep: [this.sourceToken]
						});
						else if (includesToken(it.sep, "map-value-ind")) this.stack.push({
							type: "block-map",
							offset: this.offset,
							indent: this.indent,
							items: [{
								start,
								key: null,
								sep: [this.sourceToken]
							}]
						});
						else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
							const start = getFirstKeyStartProps(it.start);
							const key = it.key;
							const sep = it.sep;
							sep.push(this.sourceToken);
							delete it.key;
							delete it.sep;
							this.stack.push({
								type: "block-map",
								offset: this.offset,
								indent: this.indent,
								items: [{
									start,
									key,
									sep
								}]
							});
						} else if (start.length > 0) it.sep = it.sep.concat(start, this.sourceToken);
						else it.sep.push(this.sourceToken);
						else if (!it.sep) Object.assign(it, {
							key: null,
							sep: [this.sourceToken]
						});
						else if (it.value || atNextItem) map.items.push({
							start,
							key: null,
							sep: [this.sourceToken]
						});
						else if (includesToken(it.sep, "map-value-ind")) this.stack.push({
							type: "block-map",
							offset: this.offset,
							indent: this.indent,
							items: [{
								start: [],
								key: null,
								sep: [this.sourceToken]
							}]
						});
						else it.sep.push(this.sourceToken);
						this.onKeyLine = true;
						return;
					case "alias":
					case "scalar":
					case "single-quoted-scalar":
					case "double-quoted-scalar": {
						const fs = this.flowScalar(this.type);
						if (atNextItem || it.value) {
							map.items.push({
								start,
								key: fs,
								sep: []
							});
							this.onKeyLine = true;
						} else if (it.sep) this.stack.push(fs);
						else {
							Object.assign(it, {
								key: fs,
								sep: []
							});
							this.onKeyLine = true;
						}
						return;
					}
					default: {
						const bv = this.startBlockValue(map);
						if (bv) {
							if (bv.type === "block-seq") {
								if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
									yield* this.pop({
										type: "error",
										offset: this.offset,
										message: "Unexpected block-seq-ind on same line with key",
										source: this.source
									});
									return;
								}
							} else if (atMapIndent) map.items.push({ start });
							this.stack.push(bv);
							return;
						}
					}
				}
			}
			yield* this.pop();
			yield* this.step();
		}
		*blockSequence(seq) {
			const it = seq.items[seq.items.length - 1];
			switch (this.type) {
				case "newline":
					if (it.value) {
						const end = "end" in it.value ? it.value.end : void 0;
						if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment") end?.push(this.sourceToken);
						else seq.items.push({ start: [this.sourceToken] });
					} else it.start.push(this.sourceToken);
					return;
				case "space":
				case "comment":
					if (it.value) seq.items.push({ start: [this.sourceToken] });
					else {
						if (this.atIndentedComment(it.start, seq.indent)) {
							const end = seq.items[seq.items.length - 2]?.value?.end;
							if (Array.isArray(end)) {
								Array.prototype.push.apply(end, it.start);
								end.push(this.sourceToken);
								seq.items.pop();
								return;
							}
						}
						it.start.push(this.sourceToken);
					}
					return;
				case "anchor":
				case "tag":
					if (it.value || this.indent <= seq.indent) break;
					it.start.push(this.sourceToken);
					return;
				case "seq-item-ind":
					if (this.indent !== seq.indent) break;
					if (it.value || includesToken(it.start, "seq-item-ind")) seq.items.push({ start: [this.sourceToken] });
					else it.start.push(this.sourceToken);
					return;
			}
			if (this.indent > seq.indent) {
				const bv = this.startBlockValue(seq);
				if (bv) {
					this.stack.push(bv);
					return;
				}
			}
			yield* this.pop();
			yield* this.step();
		}
		*flowCollection(fc) {
			const it = fc.items[fc.items.length - 1];
			if (this.type === "flow-error-end") {
				let top;
				do {
					yield* this.pop();
					top = this.peek(1);
				} while (top?.type === "flow-collection");
			} else if (fc.end.length === 0) {
				switch (this.type) {
					case "comma":
					case "explicit-key-ind":
						if (!it || it.sep) fc.items.push({ start: [this.sourceToken] });
						else it.start.push(this.sourceToken);
						return;
					case "map-value-ind":
						if (!it || it.value) fc.items.push({
							start: [],
							key: null,
							sep: [this.sourceToken]
						});
						else if (it.sep) it.sep.push(this.sourceToken);
						else Object.assign(it, {
							key: null,
							sep: [this.sourceToken]
						});
						return;
					case "space":
					case "comment":
					case "newline":
					case "anchor":
					case "tag":
						if (!it || it.value) fc.items.push({ start: [this.sourceToken] });
						else if (it.sep) it.sep.push(this.sourceToken);
						else it.start.push(this.sourceToken);
						return;
					case "alias":
					case "scalar":
					case "single-quoted-scalar":
					case "double-quoted-scalar": {
						const fs = this.flowScalar(this.type);
						if (!it || it.value) fc.items.push({
							start: [],
							key: fs,
							sep: []
						});
						else if (it.sep) this.stack.push(fs);
						else Object.assign(it, {
							key: fs,
							sep: []
						});
						return;
					}
					case "flow-map-end":
					case "flow-seq-end":
						fc.end.push(this.sourceToken);
						return;
				}
				const bv = this.startBlockValue(fc);
				/* istanbul ignore else should not happen */
				if (bv) this.stack.push(bv);
				else {
					yield* this.pop();
					yield* this.step();
				}
			} else {
				const parent = this.peek(2);
				if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
					yield* this.pop();
					yield* this.step();
				} else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
					const start = getFirstKeyStartProps(getPrevProps(parent));
					fixFlowSeqItems(fc);
					const sep = fc.end.splice(1, fc.end.length);
					sep.push(this.sourceToken);
					const map = {
						type: "block-map",
						offset: fc.offset,
						indent: fc.indent,
						items: [{
							start,
							key: fc,
							sep
						}]
					};
					this.onKeyLine = true;
					this.stack[this.stack.length - 1] = map;
				} else yield* this.lineEnd(fc);
			}
		}
		flowScalar(type) {
			if (this.onNewLine) {
				let nl = this.source.indexOf("\n") + 1;
				while (nl !== 0) {
					this.onNewLine(this.offset + nl);
					nl = this.source.indexOf("\n", nl) + 1;
				}
			}
			return {
				type,
				offset: this.offset,
				indent: this.indent,
				source: this.source
			};
		}
		startBlockValue(parent) {
			switch (this.type) {
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": return this.flowScalar(this.type);
				case "block-scalar-header": return {
					type: "block-scalar",
					offset: this.offset,
					indent: this.indent,
					props: [this.sourceToken],
					source: ""
				};
				case "flow-map-start":
				case "flow-seq-start": return {
					type: "flow-collection",
					offset: this.offset,
					indent: this.indent,
					start: this.sourceToken,
					items: [],
					end: []
				};
				case "seq-item-ind": return {
					type: "block-seq",
					offset: this.offset,
					indent: this.indent,
					items: [{ start: [this.sourceToken] }]
				};
				case "explicit-key-ind": {
					this.onKeyLine = true;
					const start = getFirstKeyStartProps(getPrevProps(parent));
					start.push(this.sourceToken);
					return {
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start,
							explicitKey: true
						}]
					};
				}
				case "map-value-ind": {
					this.onKeyLine = true;
					const start = getFirstKeyStartProps(getPrevProps(parent));
					return {
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start,
							key: null,
							sep: [this.sourceToken]
						}]
					};
				}
			}
			return null;
		}
		atIndentedComment(start, indent) {
			if (this.type !== "comment") return false;
			if (this.indent <= indent) return false;
			return start.every((st) => st.type === "newline" || st.type === "space");
		}
		*documentEnd(docEnd) {
			if (this.type !== "doc-mode") {
				if (docEnd.end) docEnd.end.push(this.sourceToken);
				else docEnd.end = [this.sourceToken];
				if (this.type === "newline") yield* this.pop();
			}
		}
		*lineEnd(token) {
			switch (this.type) {
				case "comma":
				case "doc-start":
				case "doc-end":
				case "flow-seq-end":
				case "flow-map-end":
				case "map-value-ind":
					yield* this.pop();
					yield* this.step();
					break;
				case "newline": this.onKeyLine = false;
				default:
					if (token.end) token.end.push(this.sourceToken);
					else token.end = [this.sourceToken];
					if (this.type === "newline") yield* this.pop();
			}
		}
	};
	exports.Parser = Parser;
}));

//#endregion
//#region ../../node_modules/yaml/dist/public-api.js
var require_public_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	var composer = require_composer();
	var Document = require_Document();
	var errors = require_errors();
	var log = require_log();
	var identity = require_identity();
	var lineCounter = require_line_counter();
	var parser = require_parser();
	function parseOptions(options) {
		const prettyErrors = options.prettyErrors !== false;
		return {
			lineCounter: options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null,
			prettyErrors
		};
	}
	/**
	* Parse the input as a stream of YAML documents.
	*
	* Documents should be separated from each other by `...` or `---` marker lines.
	*
	* @returns If an empty `docs` array is returned, it will be of type
	*   EmptyStream and contain additional stream information. In
	*   TypeScript, you should use `'empty' in docs` as a type guard for it.
	*/
	function parseAllDocuments(source, options = {}) {
		const { lineCounter, prettyErrors } = parseOptions(options);
		const parser$1 = new parser.Parser(lineCounter?.addNewLine);
		const composer$1 = new composer.Composer(options);
		const docs = Array.from(composer$1.compose(parser$1.parse(source)));
		if (prettyErrors && lineCounter) for (const doc of docs) {
			doc.errors.forEach(errors.prettifyError(source, lineCounter));
			doc.warnings.forEach(errors.prettifyError(source, lineCounter));
		}
		if (docs.length > 0) return docs;
		return Object.assign([], { empty: true }, composer$1.streamInfo());
	}
	/** Parse an input string into a single YAML.Document */
	function parseDocument(source, options = {}) {
		const { lineCounter, prettyErrors } = parseOptions(options);
		const parser$1 = new parser.Parser(lineCounter?.addNewLine);
		const composer$1 = new composer.Composer(options);
		let doc = null;
		for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) if (!doc) doc = _doc;
		else if (doc.options.logLevel !== "silent") {
			doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
			break;
		}
		if (prettyErrors && lineCounter) {
			doc.errors.forEach(errors.prettifyError(source, lineCounter));
			doc.warnings.forEach(errors.prettifyError(source, lineCounter));
		}
		return doc;
	}
	function parse(src, reviver, options) {
		let _reviver = void 0;
		if (typeof reviver === "function") _reviver = reviver;
		else if (options === void 0 && reviver && typeof reviver === "object") options = reviver;
		const doc = parseDocument(src, options);
		if (!doc) return null;
		doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
		if (doc.errors.length > 0) if (doc.options.logLevel !== "silent") throw doc.errors[0];
		else doc.errors = [];
		return doc.toJS(Object.assign({ reviver: _reviver }, options));
	}
	function stringify(value, replacer, options) {
		let _replacer = null;
		if (typeof replacer === "function" || Array.isArray(replacer)) _replacer = replacer;
		else if (options === void 0 && replacer) options = replacer;
		if (typeof options === "string") options = options.length;
		if (typeof options === "number") {
			const indent = Math.round(options);
			options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
		}
		if (value === void 0) {
			const { keepUndefined } = options ?? replacer ?? {};
			if (!keepUndefined) return void 0;
		}
		if (identity.isDocument(value) && !_replacer) return value.toString(options);
		return new Document.Document(value, _replacer, options).toString(options);
	}
	exports.parse = parse;
	exports.parseAllDocuments = parseAllDocuments;
	exports.parseDocument = parseDocument;
	exports.stringify = stringify;
}));

//#endregion
//#region ../../node_modules/yaml/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	var composer = require_composer();
	var Document = require_Document();
	var Schema = require_Schema();
	var errors = require_errors();
	var Alias = require_Alias();
	var identity = require_identity();
	var Pair = require_Pair();
	var Scalar = require_Scalar();
	var YAMLMap = require_YAMLMap();
	var YAMLSeq = require_YAMLSeq();
	var cst = require_cst();
	var lexer = require_lexer();
	var lineCounter = require_line_counter();
	var parser = require_parser();
	var publicApi = require_public_api();
	var visit = require_visit();
	exports.Composer = composer.Composer;
	exports.Document = Document.Document;
	exports.Schema = Schema.Schema;
	exports.YAMLError = errors.YAMLError;
	exports.YAMLParseError = errors.YAMLParseError;
	exports.YAMLWarning = errors.YAMLWarning;
	exports.Alias = Alias.Alias;
	exports.isAlias = identity.isAlias;
	exports.isCollection = identity.isCollection;
	exports.isDocument = identity.isDocument;
	exports.isMap = identity.isMap;
	exports.isNode = identity.isNode;
	exports.isPair = identity.isPair;
	exports.isScalar = identity.isScalar;
	exports.isSeq = identity.isSeq;
	exports.Pair = Pair.Pair;
	exports.Scalar = Scalar.Scalar;
	exports.YAMLMap = YAMLMap.YAMLMap;
	exports.YAMLSeq = YAMLSeq.YAMLSeq;
	exports.Lexer = lexer.Lexer;
	exports.LineCounter = lineCounter.LineCounter;
	exports.Parser = parser.Parser;
	exports.parse = publicApi.parse;
	exports.parseAllDocuments = publicApi.parseAllDocuments;
	exports.parseDocument = publicApi.parseDocument;
	exports.stringify = publicApi.stringify;
	exports.visit = visit.visit;
	exports.visitAsync = visit.visitAsync;
}));

//#endregion
//#region src/core/frontmatter.ts
/**
* Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
*
* Uses the `yaml` npm package instead of a hand-rolled parser.
*/
var import_dist = /* @__PURE__ */ __toESM(require_dist());
/**
* Extract YAML frontmatter from markdown content into a typed object.
*/
function extractFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]+?)\n---/);
	if (!match) return {};
	try {
		const parsed = import_dist.parse(match[1]);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
/**
* Reconstruct YAML frontmatter string from an object.
*/
function reconstructFrontmatter(obj) {
	const cleaned = {};
	for (const [key, value] of Object.entries(obj)) if (value !== null && value !== void 0) cleaned[key] = value;
	return import_dist.stringify(cleaned, {
		lineWidth: 0,
		defaultKeyType: "PLAIN",
		defaultStringType: "PLAIN"
	}).trimEnd();
}
/**
* Replace or insert frontmatter in markdown content.
*/
function spliceFrontmatter(content, newObj) {
	const yamlStr = reconstructFrontmatter(newObj);
	const match = content.match(/^---\n[\s\S]+?\n---/);
	if (match) return `---\n${yamlStr}\n---` + content.slice(match[0].length);
	return `---\n${yamlStr}\n---\n\n` + content;
}
/**
* Parse a specific block from must_haves in frontmatter.
* With the yaml package, this is just object traversal.
*/
function parseMustHavesBlock(content, blockName) {
	const mustHaves = extractFrontmatter(content).must_haves;
	if (!mustHaves || typeof mustHaves !== "object") return [];
	const block = mustHaves[blockName];
	if (!Array.isArray(block)) return [];
	return block;
}
const FRONTMATTER_SCHEMAS = {
	plan: { required: [
		"phase",
		"plan",
		"type",
		"wave",
		"depends_on",
		"files_modified",
		"autonomous",
		"must_haves"
	] },
	summary: { required: [
		"phase",
		"plan",
		"subsystem",
		"tags",
		"duration",
		"completed"
	] },
	verification: { required: [
		"phase",
		"verified",
		"status",
		"score"
	] }
};
function cmdFrontmatterGet(cwd, filePath, field, raw) {
	if (!filePath) error("file path required");
	const content = safeReadFile(node_path.default.isAbsolute(filePath) ? filePath : node_path.default.join(cwd, filePath));
	if (!content) {
		output({
			error: "File not found",
			path: filePath
		}, raw);
		return;
	}
	const fm = extractFrontmatter(content);
	if (field) {
		const value = fm[field];
		if (value === void 0) {
			output({
				error: "Field not found",
				field
			}, raw);
			return;
		}
		output({ [field]: value }, raw, JSON.stringify(value));
	} else output(fm, raw);
}
function cmdFrontmatterSet(cwd, filePath, field, value, raw) {
	if (!filePath || !field || value === void 0) error("file, field, and value required");
	const fullPath = node_path.default.isAbsolute(filePath) ? filePath : node_path.default.join(cwd, filePath);
	if (!node_fs.default.existsSync(fullPath)) {
		output({
			error: "File not found",
			path: filePath
		}, raw);
		return;
	}
	const content = node_fs.default.readFileSync(fullPath, "utf-8");
	const fm = extractFrontmatter(content);
	let parsedValue;
	try {
		parsedValue = JSON.parse(value);
	} catch {
		parsedValue = value;
	}
	fm[field] = parsedValue;
	const newContent = spliceFrontmatter(content, fm);
	node_fs.default.writeFileSync(fullPath, newContent, "utf-8");
	output({
		updated: true,
		field,
		value: parsedValue
	}, raw, "true");
}
function cmdFrontmatterMerge(cwd, filePath, data, raw) {
	if (!filePath || !data) error("file and data required");
	const fullPath = node_path.default.isAbsolute(filePath) ? filePath : node_path.default.join(cwd, filePath);
	if (!node_fs.default.existsSync(fullPath)) {
		output({
			error: "File not found",
			path: filePath
		}, raw);
		return;
	}
	const content = node_fs.default.readFileSync(fullPath, "utf-8");
	const fm = extractFrontmatter(content);
	let mergeData;
	try {
		mergeData = JSON.parse(data);
	} catch {
		error("Invalid JSON for --data");
		return;
	}
	Object.assign(fm, mergeData);
	const newContent = spliceFrontmatter(content, fm);
	node_fs.default.writeFileSync(fullPath, newContent, "utf-8");
	output({
		merged: true,
		fields: Object.keys(mergeData)
	}, raw, "true");
}
function cmdFrontmatterValidate(cwd, filePath, schemaName, raw) {
	if (!filePath || !schemaName) error("file and schema required");
	const schema = FRONTMATTER_SCHEMAS[schemaName];
	if (!schema) error(`Unknown schema: ${schemaName}. Available: ${Object.keys(FRONTMATTER_SCHEMAS).join(", ")}`);
	const content = safeReadFile(node_path.default.isAbsolute(filePath) ? filePath : node_path.default.join(cwd, filePath));
	if (!content) {
		output({
			error: "File not found",
			path: filePath
		}, raw);
		return;
	}
	const fm = extractFrontmatter(content);
	const missing = schema.required.filter((f) => fm[f] === void 0);
	const present = schema.required.filter((f) => fm[f] !== void 0);
	output({
		valid: missing.length === 0,
		missing,
		present,
		schema: schemaName
	}, raw, missing.length === 0 ? "valid" : "invalid");
}

//#endregion
//#region src/core/config.ts
/**
* Config — Planning config CRUD operations
*
* Ported from maxsim/bin/lib/config.cjs
*/
function cmdConfigEnsureSection(cwd, raw) {
	const configPath = node_path.default.join(cwd, ".planning", "config.json");
	const planningDir = node_path.default.join(cwd, ".planning");
	try {
		if (!node_fs.default.existsSync(planningDir)) node_fs.default.mkdirSync(planningDir, { recursive: true });
	} catch (err) {
		error("Failed to create .planning directory: " + err.message);
	}
	if (node_fs.default.existsSync(configPath)) {
		output({
			created: false,
			reason: "already_exists"
		}, raw, "exists");
		return;
	}
	const homedir = node_os.default.homedir();
	const braveKeyFile = node_path.default.join(homedir, ".maxsim", "brave_api_key");
	const hasBraveSearch = !!(process.env.BRAVE_API_KEY || node_fs.default.existsSync(braveKeyFile));
	const globalDefaultsPath = node_path.default.join(homedir, ".maxsim", "defaults.json");
	let userDefaults = {};
	try {
		if (node_fs.default.existsSync(globalDefaultsPath)) userDefaults = JSON.parse(node_fs.default.readFileSync(globalDefaultsPath, "utf-8"));
	} catch {}
	const hardcoded = {
		...PLANNING_CONFIG_DEFAULTS,
		brave_search: hasBraveSearch
	};
	const defaults = {
		...hardcoded,
		...userDefaults,
		workflow: {
			...hardcoded.workflow,
			...userDefaults.workflow || {}
		}
	};
	try {
		node_fs.default.writeFileSync(configPath, JSON.stringify(defaults, null, 2), "utf-8");
		output({
			created: true,
			path: ".planning/config.json"
		}, raw, "created");
	} catch (err) {
		error("Failed to create config.json: " + err.message);
	}
}
function cmdConfigSet(cwd, keyPath, value, raw) {
	const configPath = node_path.default.join(cwd, ".planning", "config.json");
	if (!keyPath) error("Usage: config-set <key.path> <value>");
	let parsedValue = value;
	if (value === "true") parsedValue = true;
	else if (value === "false") parsedValue = false;
	else if (value !== void 0 && !isNaN(Number(value)) && value !== "") parsedValue = Number(value);
	let config = {};
	try {
		if (node_fs.default.existsSync(configPath)) config = JSON.parse(node_fs.default.readFileSync(configPath, "utf-8"));
	} catch (err) {
		error("Failed to read config.json: " + err.message);
	}
	const keys = keyPath.split(".");
	let current = config;
	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (current[key] === void 0 || typeof current[key] !== "object") current[key] = {};
		current = current[key];
	}
	current[keys[keys.length - 1]] = parsedValue;
	try {
		node_fs.default.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
		output({
			updated: true,
			key: keyPath,
			value: parsedValue
		}, raw, `${keyPath}=${parsedValue}`);
	} catch (err) {
		error("Failed to write config.json: " + err.message);
	}
}
function cmdConfigGet(cwd, keyPath, raw) {
	const configPath = node_path.default.join(cwd, ".planning", "config.json");
	if (!keyPath) error("Usage: config-get <key.path>");
	let config = {};
	try {
		if (node_fs.default.existsSync(configPath)) config = JSON.parse(node_fs.default.readFileSync(configPath, "utf-8"));
		else error("No config.json found at " + configPath);
	} catch (err) {
		if (err.message.startsWith("No config.json")) throw err;
		error("Failed to read config.json: " + err.message);
	}
	const keys = keyPath.split(".");
	let current = config;
	for (const key of keys) {
		if (current === void 0 || current === null || typeof current !== "object") error(`Key not found: ${keyPath}`);
		current = current[key];
	}
	if (current === void 0) error(`Key not found: ${keyPath}`);
	output(current, raw, String(current));
}

//#endregion
//#region ../../node_modules/escape-string-regexp/index.js
function escapeStringRegexp(string) {
	if (typeof string !== "string") throw new TypeError("Expected a string");
	return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

//#endregion
//#region src/core/state.ts
/**
* State — STATE.md operations and progression engine
*
* Ported from maxsim/bin/lib/state.cjs
*/
function stateExtractField(content, fieldName) {
	const pattern = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+)`, "i");
	const match = content.match(pattern);
	return match ? match[1].trim() : null;
}
function stateReplaceField(content, fieldName, newValue) {
	const escaped = escapeStringRegexp(fieldName);
	const pattern = new RegExp(`(\\*\\*${escaped}:\\*\\*\\s*)(.*)`, "i");
	if (pattern.test(content)) return content.replace(pattern, (_match, prefix) => `${prefix}${newValue}`);
	return null;
}
function readTextArgOrFile(cwd, value, filePath, label) {
	if (!filePath) return value;
	const resolvedPath = node_path.default.isAbsolute(filePath) ? filePath : node_path.default.join(cwd, filePath);
	try {
		return node_fs.default.readFileSync(resolvedPath, "utf-8").trimEnd();
	} catch {
		throw new Error(`${label} file not found: ${filePath}`);
	}
}
function cmdStateLoad(cwd, raw) {
	const config = loadConfig(cwd);
	const planningDir = node_path.default.join(cwd, ".planning");
	let stateRaw = "";
	try {
		stateRaw = node_fs.default.readFileSync(node_path.default.join(planningDir, "STATE.md"), "utf-8");
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	const configExists = node_fs.default.existsSync(node_path.default.join(planningDir, "config.json"));
	const roadmapExists = node_fs.default.existsSync(node_path.default.join(planningDir, "ROADMAP.md"));
	const stateExists = stateRaw.length > 0;
	const result = {
		config,
		state_raw: stateRaw,
		state_exists: stateExists,
		roadmap_exists: roadmapExists,
		config_exists: configExists
	};
	if (raw) {
		const c = config;
		const lines = [
			`model_profile=${c.model_profile}`,
			`commit_docs=${c.commit_docs}`,
			`branching_strategy=${c.branching_strategy}`,
			`phase_branch_template=${c.phase_branch_template}`,
			`milestone_branch_template=${c.milestone_branch_template}`,
			`parallelization=${c.parallelization}`,
			`research=${c.research}`,
			`plan_checker=${c.plan_checker}`,
			`verifier=${c.verifier}`,
			`config_exists=${configExists}`,
			`roadmap_exists=${roadmapExists}`,
			`state_exists=${stateExists}`
		];
		process.stdout.write(lines.join("\n"));
		process.exit(0);
	}
	output(result);
}
function cmdStateGet(cwd, section, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	try {
		const content = node_fs.default.readFileSync(statePath, "utf-8");
		if (!section) {
			output({ content }, raw, content);
			return;
		}
		const fieldEscaped = escapeStringRegexp(section);
		const fieldPattern = new RegExp(`\\*\\*${fieldEscaped}:\\*\\*\\s*(.*)`, "i");
		const fieldMatch = content.match(fieldPattern);
		if (fieldMatch) {
			output({ [section]: fieldMatch[1].trim() }, raw, fieldMatch[1].trim());
			return;
		}
		const sectionPattern = new RegExp(`##\\s*${fieldEscaped}\\s*\n([\\s\\S]*?)(?=\\n##|$)`, "i");
		const sectionMatch = content.match(sectionPattern);
		if (sectionMatch) {
			output({ [section]: sectionMatch[1].trim() }, raw, sectionMatch[1].trim());
			return;
		}
		output({ error: `Section or field "${section}" not found` }, raw, "");
	} catch {
		error("STATE.md not found");
	}
}
function cmdStatePatch(cwd, patches, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	try {
		let content = node_fs.default.readFileSync(statePath, "utf-8");
		const results = {
			updated: [],
			failed: []
		};
		for (const [field, value] of Object.entries(patches)) {
			const fieldEscaped = escapeStringRegexp(field);
			const pattern = new RegExp(`(\\*\\*${fieldEscaped}:\\*\\*\\s*)(.*)`, "i");
			if (pattern.test(content)) {
				content = content.replace(pattern, (_match, prefix) => `${prefix}${value}`);
				results.updated.push(field);
			} else results.failed.push(field);
		}
		if (results.updated.length > 0) node_fs.default.writeFileSync(statePath, content, "utf-8");
		output(results, raw, results.updated.length > 0 ? "true" : "false");
	} catch {
		error("STATE.md not found");
	}
}
function cmdStateUpdate(cwd, field, value) {
	if (!field || value === void 0) error("field and value required for state update");
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	try {
		let content = node_fs.default.readFileSync(statePath, "utf-8");
		const fieldEscaped = escapeStringRegexp(field);
		const pattern = new RegExp(`(\\*\\*${fieldEscaped}:\\*\\*\\s*)(.*)`, "i");
		if (pattern.test(content)) {
			content = content.replace(pattern, (_match, prefix) => `${prefix}${value}`);
			node_fs.default.writeFileSync(statePath, content, "utf-8");
			output({ updated: true });
		} else output({
			updated: false,
			reason: `Field "${field}" not found in STATE.md`
		});
	} catch {
		output({
			updated: false,
			reason: "STATE.md not found"
		});
	}
}
function cmdStateAdvancePlan(cwd, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (!node_fs.default.existsSync(statePath)) {
		output({ error: "STATE.md not found" }, raw);
		return;
	}
	let content = node_fs.default.readFileSync(statePath, "utf-8");
	const currentPlan = parseInt(stateExtractField(content, "Current Plan") ?? "", 10);
	const totalPlans = parseInt(stateExtractField(content, "Total Plans in Phase") ?? "", 10);
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	if (isNaN(currentPlan) || isNaN(totalPlans)) {
		output({ error: "Cannot parse Current Plan or Total Plans in Phase from STATE.md" }, raw);
		return;
	}
	if (currentPlan >= totalPlans) {
		content = stateReplaceField(content, "Status", "Phase complete — ready for verification") || content;
		content = stateReplaceField(content, "Last Activity", today) || content;
		node_fs.default.writeFileSync(statePath, content, "utf-8");
		output({
			advanced: false,
			reason: "last_plan",
			current_plan: currentPlan,
			total_plans: totalPlans,
			status: "ready_for_verification"
		}, raw, "false");
	} else {
		const newPlan = currentPlan + 1;
		content = stateReplaceField(content, "Current Plan", String(newPlan)) || content;
		content = stateReplaceField(content, "Status", "Ready to execute") || content;
		content = stateReplaceField(content, "Last Activity", today) || content;
		node_fs.default.writeFileSync(statePath, content, "utf-8");
		output({
			advanced: true,
			previous_plan: currentPlan,
			current_plan: newPlan,
			total_plans: totalPlans
		}, raw, "true");
	}
}
function cmdStateRecordMetric(cwd, options, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (!node_fs.default.existsSync(statePath)) {
		output({ error: "STATE.md not found" }, raw);
		return;
	}
	let content = node_fs.default.readFileSync(statePath, "utf-8");
	const { phase, plan, duration, tasks, files } = options;
	if (!phase || !plan || !duration) {
		output({ error: "phase, plan, and duration required" }, raw);
		return;
	}
	const metricsPattern = /(##\s*Performance Metrics[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n)([\s\S]*?)(?=\n##|\n$|$)/i;
	const metricsMatch = content.match(metricsPattern);
	if (metricsMatch) {
		let tableBody = metricsMatch[2].trimEnd();
		const newRow = `| Phase ${phase} P${plan} | ${duration} | ${tasks || "-"} tasks | ${files || "-"} files |`;
		if (tableBody.trim() === "" || tableBody.includes("None yet")) tableBody = newRow;
		else tableBody = tableBody + "\n" + newRow;
		content = content.replace(metricsPattern, (_match, header) => `${header}${tableBody}\n`);
		node_fs.default.writeFileSync(statePath, content, "utf-8");
		output({
			recorded: true,
			phase,
			plan,
			duration
		}, raw, "true");
	} else output({
		recorded: false,
		reason: "Performance Metrics section not found in STATE.md"
	}, raw, "false");
}
function cmdStateUpdateProgress(cwd, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (!node_fs.default.existsSync(statePath)) {
		output({ error: "STATE.md not found" }, raw);
		return;
	}
	let content = node_fs.default.readFileSync(statePath, "utf-8");
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	let totalPlans = 0;
	let totalSummaries = 0;
	if (node_fs.default.existsSync(phasesDir)) {
		const phaseDirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		for (const dir of phaseDirs) {
			const files = node_fs.default.readdirSync(node_path.default.join(phasesDir, dir));
			totalPlans += files.filter((f) => f.match(/-PLAN\.md$/i)).length;
			totalSummaries += files.filter((f) => f.match(/-SUMMARY\.md$/i)).length;
		}
	}
	const percent = totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0;
	const barWidth = 10;
	const filled = Math.round(percent / 100 * barWidth);
	const progressStr = `[${"█".repeat(filled) + "░".repeat(barWidth - filled)}] ${percent}%`;
	const progressPattern = /(\*\*Progress:\*\*\s*).*/i;
	if (progressPattern.test(content)) {
		content = content.replace(progressPattern, (_match, prefix) => `${prefix}${progressStr}`);
		node_fs.default.writeFileSync(statePath, content, "utf-8");
		output({
			updated: true,
			percent,
			completed: totalSummaries,
			total: totalPlans,
			bar: progressStr
		}, raw, progressStr);
	} else output({
		updated: false,
		reason: "Progress field not found in STATE.md"
	}, raw, "false");
}
function cmdStateAddDecision(cwd, options, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (!node_fs.default.existsSync(statePath)) {
		output({ error: "STATE.md not found" }, raw);
		return;
	}
	const { phase, summary, summary_file, rationale, rationale_file } = options;
	let summaryText;
	let rationaleText = "";
	try {
		summaryText = readTextArgOrFile(cwd, summary, summary_file, "summary");
		rationaleText = readTextArgOrFile(cwd, rationale || "", rationale_file, "rationale") || "";
	} catch (thrown) {
		output({
			added: false,
			reason: thrown.message
		}, raw, "false");
		return;
	}
	if (!summaryText) {
		output({ error: "summary required" }, raw);
		return;
	}
	let content = node_fs.default.readFileSync(statePath, "utf-8");
	const entry = `- [Phase ${phase || "?"}]: ${summaryText}${rationaleText ? ` — ${rationaleText}` : ""}`;
	const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
	const match = content.match(sectionPattern);
	if (match) {
		let sectionBody = match[2];
		sectionBody = sectionBody.replace(/None yet\.?\s*\n?/gi, "").replace(/No decisions yet\.?\s*\n?/gi, "");
		sectionBody = sectionBody.trimEnd() + "\n" + entry + "\n";
		content = content.replace(sectionPattern, (_match, header) => `${header}${sectionBody}`);
		node_fs.default.writeFileSync(statePath, content, "utf-8");
		output({
			added: true,
			decision: entry
		}, raw, "true");
	} else output({
		added: false,
		reason: "Decisions section not found in STATE.md"
	}, raw, "false");
}
function cmdStateAddBlocker(cwd, text, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (!node_fs.default.existsSync(statePath)) {
		output({ error: "STATE.md not found" }, raw);
		return;
	}
	const blockerOptions = typeof text === "object" && text !== null ? text : { text };
	let blockerText;
	try {
		blockerText = readTextArgOrFile(cwd, blockerOptions.text, blockerOptions.text_file, "blocker");
	} catch (thrown) {
		output({
			added: false,
			reason: thrown.message
		}, raw, "false");
		return;
	}
	if (!blockerText) {
		output({ error: "text required" }, raw);
		return;
	}
	let content = node_fs.default.readFileSync(statePath, "utf-8");
	const entry = `- ${blockerText}`;
	const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
	const match = content.match(sectionPattern);
	if (match) {
		let sectionBody = match[2];
		sectionBody = sectionBody.replace(/None\.?\s*\n?/gi, "").replace(/None yet\.?\s*\n?/gi, "");
		sectionBody = sectionBody.trimEnd() + "\n" + entry + "\n";
		content = content.replace(sectionPattern, (_match, header) => `${header}${sectionBody}`);
		node_fs.default.writeFileSync(statePath, content, "utf-8");
		output({
			added: true,
			blocker: blockerText
		}, raw, "true");
	} else output({
		added: false,
		reason: "Blockers section not found in STATE.md"
	}, raw, "false");
}
function cmdStateResolveBlocker(cwd, text, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (!node_fs.default.existsSync(statePath)) {
		output({ error: "STATE.md not found" }, raw);
		return;
	}
	if (!text) {
		output({ error: "text required" }, raw);
		return;
	}
	let content = node_fs.default.readFileSync(statePath, "utf-8");
	const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
	const match = content.match(sectionPattern);
	if (match) {
		let newBody = match[2].split("\n").filter((line) => {
			if (!line.startsWith("- ")) return true;
			return !line.toLowerCase().includes(text.toLowerCase());
		}).join("\n");
		if (!newBody.trim() || !newBody.includes("- ")) newBody = "None\n";
		content = content.replace(sectionPattern, (_match, header) => `${header}${newBody}`);
		node_fs.default.writeFileSync(statePath, content, "utf-8");
		output({
			resolved: true,
			blocker: text
		}, raw, "true");
	} else output({
		resolved: false,
		reason: "Blockers section not found in STATE.md"
	}, raw, "false");
}
function cmdStateRecordSession(cwd, options, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (!node_fs.default.existsSync(statePath)) {
		output({ error: "STATE.md not found" }, raw);
		return;
	}
	let content = node_fs.default.readFileSync(statePath, "utf-8");
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const updated = [];
	let result = stateReplaceField(content, "Last session", now);
	if (result) {
		content = result;
		updated.push("Last session");
	}
	result = stateReplaceField(content, "Last Date", now);
	if (result) {
		content = result;
		updated.push("Last Date");
	}
	if (options.stopped_at) {
		result = stateReplaceField(content, "Stopped At", options.stopped_at);
		if (!result) result = stateReplaceField(content, "Stopped at", options.stopped_at);
		if (result) {
			content = result;
			updated.push("Stopped At");
		}
	}
	const resumeFile = options.resume_file || "None";
	result = stateReplaceField(content, "Resume File", resumeFile);
	if (!result) result = stateReplaceField(content, "Resume file", resumeFile);
	if (result) {
		content = result;
		updated.push("Resume File");
	}
	if (updated.length > 0) {
		node_fs.default.writeFileSync(statePath, content, "utf-8");
		output({
			recorded: true,
			updated
		}, raw, "true");
	} else output({
		recorded: false,
		reason: "No session fields found in STATE.md"
	}, raw, "false");
}
function cmdStateSnapshot(cwd, raw) {
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (!node_fs.default.existsSync(statePath)) {
		output({ error: "STATE.md not found" }, raw);
		return;
	}
	const content = node_fs.default.readFileSync(statePath, "utf-8");
	const extractField = (fieldName) => {
		const pattern = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+)`, "i");
		const match = content.match(pattern);
		return match ? match[1].trim() : null;
	};
	const currentPhase = extractField("Current Phase");
	const currentPhaseName = extractField("Current Phase Name");
	const totalPhasesRaw = extractField("Total Phases");
	const currentPlan = extractField("Current Plan");
	const totalPlansRaw = extractField("Total Plans in Phase");
	const status = extractField("Status");
	const progressRaw = extractField("Progress");
	const lastActivity = extractField("Last Activity");
	const lastActivityDesc = extractField("Last Activity Description");
	const pausedAt = extractField("Paused At");
	const totalPhases = totalPhasesRaw ? parseInt(totalPhasesRaw, 10) : null;
	const totalPlansInPhase = totalPlansRaw ? parseInt(totalPlansRaw, 10) : null;
	const progressPercent = progressRaw ? parseInt(progressRaw.replace("%", ""), 10) : null;
	const decisions = [];
	const decisionsMatch = content.match(/##\s*Decisions Made[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n##|\n$|$)/i);
	if (decisionsMatch) {
		const rows = decisionsMatch[1].trim().split("\n").filter((r) => r.includes("|"));
		for (const row of rows) {
			const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
			if (cells.length >= 3) decisions.push({
				phase: cells[0],
				summary: cells[1],
				rationale: cells[2]
			});
		}
	}
	const blockers = [];
	const blockersMatch = content.match(/##\s*Blockers\s*\n([\s\S]*?)(?=\n##|$)/i);
	if (blockersMatch) {
		const items = blockersMatch[1].match(/^-\s+(.+)$/gm) || [];
		for (const item of items) blockers.push(item.replace(/^-\s+/, "").trim());
	}
	const session = {
		last_date: null,
		stopped_at: null,
		resume_file: null
	};
	const sessionMatch = content.match(/##\s*Session\s*\n([\s\S]*?)(?=\n##|$)/i);
	if (sessionMatch) {
		const sessionSection = sessionMatch[1];
		const lastDateMatch = sessionSection.match(/\*\*Last Date:\*\*\s*(.+)/i);
		const stoppedAtMatch = sessionSection.match(/\*\*Stopped At:\*\*\s*(.+)/i);
		const resumeFileMatch = sessionSection.match(/\*\*Resume File:\*\*\s*(.+)/i);
		if (lastDateMatch) session.last_date = lastDateMatch[1].trim();
		if (stoppedAtMatch) session.stopped_at = stoppedAtMatch[1].trim();
		if (resumeFileMatch) session.resume_file = resumeFileMatch[1].trim();
	}
	output({
		current_phase: currentPhase,
		current_phase_name: currentPhaseName,
		total_phases: totalPhases,
		current_plan: currentPlan,
		total_plans_in_phase: totalPlansInPhase,
		status,
		progress_percent: progressPercent,
		last_activity: lastActivity,
		last_activity_desc: lastActivityDesc,
		decisions,
		blockers,
		paused_at: pausedAt,
		session
	}, raw);
}

//#endregion
//#region src/core/roadmap.ts
/**
* Roadmap — Roadmap parsing and update operations
*
* Ported from maxsim/bin/lib/roadmap.cjs
*/
function cmdRoadmapGetPhase(cwd, phaseNum, raw) {
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	if (!node_fs.default.existsSync(roadmapPath)) {
		output({
			found: false,
			error: "ROADMAP.md not found"
		}, raw, "");
		return;
	}
	try {
		const content = node_fs.default.readFileSync(roadmapPath, "utf-8");
		const escapedPhase = phaseNum.replace(/\./g, "\\.");
		const phasePattern = getPhasePattern(escapedPhase, "i");
		const headerMatch = content.match(phasePattern);
		if (!headerMatch) {
			const checklistPattern = new RegExp(`-\\s*\\[[ x]\\]\\s*\\*\\*Phase\\s+${escapedPhase}:\\s*([^*]+)\\*\\*`, "i");
			const checklistMatch = content.match(checklistPattern);
			if (checklistMatch) {
				output({
					found: false,
					phase_number: phaseNum,
					phase_name: checklistMatch[1].trim(),
					error: "malformed_roadmap",
					message: `Phase ${phaseNum} exists in summary list but missing "### Phase ${phaseNum}:" detail section. ROADMAP.md needs both formats.`
				}, raw, "");
				return;
			}
			output({
				found: false,
				phase_number: phaseNum
			}, raw, "");
			return;
		}
		const phaseName = headerMatch[1].trim();
		const headerIndex = headerMatch.index;
		const nextHeaderMatch = content.slice(headerIndex).match(/\n#{2,4}\s+Phase\s+\d/i);
		const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index : content.length;
		const section = content.slice(headerIndex, sectionEnd).trim();
		const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
		const goal = goalMatch ? goalMatch[1].trim() : null;
		const criteriaMatch = section.match(/\*\*Success Criteria\*\*[^\n]*:\s*\n((?:\s*\d+\.\s*[^\n]+\n?)+)/i);
		output({
			found: true,
			phase_number: phaseNum,
			phase_name: phaseName,
			goal,
			success_criteria: criteriaMatch ? criteriaMatch[1].trim().split("\n").map((line) => line.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean) : [],
			section
		}, raw, section);
	} catch (e) {
		error("Failed to read ROADMAP.md: " + e.message);
	}
}
function cmdRoadmapAnalyze(cwd, raw) {
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	if (!node_fs.default.existsSync(roadmapPath)) {
		output({
			error: "ROADMAP.md not found",
			milestones: [],
			phases: [],
			current_phase: null
		}, raw);
		return;
	}
	const content = node_fs.default.readFileSync(roadmapPath, "utf-8");
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const phasePattern = getPhasePattern();
	const phases = [];
	let match;
	while ((match = phasePattern.exec(content)) !== null) {
		const phaseNum = match[1];
		const phaseName = match[2].replace(/\(INSERTED\)/i, "").trim();
		const sectionStart = match.index;
		const nextHeader = content.slice(sectionStart).match(/\n#{2,4}\s+Phase\s+\d/i);
		const sectionEnd = nextHeader ? sectionStart + nextHeader.index : content.length;
		const section = content.slice(sectionStart, sectionEnd);
		const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
		const goal = goalMatch ? goalMatch[1].trim() : null;
		const dependsMatch = section.match(/\*\*Depends on:\*\*\s*([^\n]+)/i);
		const depends_on = dependsMatch ? dependsMatch[1].trim() : null;
		const normalized = normalizePhaseName(phaseNum);
		let diskStatus = "no_directory";
		let planCount = 0;
		let summaryCount = 0;
		let hasContext = false;
		let hasResearch = false;
		try {
			const dirMatch = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).find((d) => d.startsWith(normalized + "-") || d === normalized);
			if (dirMatch) {
				const phaseFiles = node_fs.default.readdirSync(node_path.default.join(phasesDir, dirMatch));
				planCount = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md").length;
				summaryCount = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md").length;
				hasContext = phaseFiles.some((f) => f.endsWith("-CONTEXT.md") || f === "CONTEXT.md");
				hasResearch = phaseFiles.some((f) => f.endsWith("-RESEARCH.md") || f === "RESEARCH.md");
				if (summaryCount >= planCount && planCount > 0) diskStatus = "complete";
				else if (summaryCount > 0) diskStatus = "partial";
				else if (planCount > 0) diskStatus = "planned";
				else if (hasResearch) diskStatus = "researched";
				else if (hasContext) diskStatus = "discussed";
				else diskStatus = "empty";
			}
		} catch (e) {
			if (process.env.MAXSIM_DEBUG) console.error(e);
		}
		const checkboxPattern = new RegExp(`-\\s*\\[(x| )\\]\\s*.*Phase\\s+${phaseNum.replace(".", "\\.")}`, "i");
		const checkboxMatch = content.match(checkboxPattern);
		const roadmapComplete = checkboxMatch ? checkboxMatch[1] === "x" : false;
		phases.push({
			number: phaseNum,
			name: phaseName,
			goal,
			depends_on,
			plan_count: planCount,
			summary_count: summaryCount,
			has_context: hasContext,
			has_research: hasResearch,
			disk_status: diskStatus,
			roadmap_complete: roadmapComplete
		});
	}
	const milestones = [];
	const milestonePattern = /##\s*(.*v(\d+\.\d+)[^(\n]*)/gi;
	let mMatch;
	while ((mMatch = milestonePattern.exec(content)) !== null) milestones.push({
		heading: mMatch[1].trim(),
		version: "v" + mMatch[2]
	});
	const currentPhase = phases.find((p) => p.disk_status === "planned" || p.disk_status === "partial") || null;
	const nextPhase = phases.find((p) => p.disk_status === "empty" || p.disk_status === "no_directory" || p.disk_status === "discussed" || p.disk_status === "researched") || null;
	const totalPlans = phases.reduce((sum, p) => sum + p.plan_count, 0);
	const totalSummaries = phases.reduce((sum, p) => sum + p.summary_count, 0);
	const completedPhases = phases.filter((p) => p.disk_status === "complete").length;
	const checklistPattern = /-\s*\[[ x]\]\s*\*\*Phase\s+(\d+[A-Z]?(?:\.\d+)?)/gi;
	const checklistPhases = /* @__PURE__ */ new Set();
	let checklistMatch;
	while ((checklistMatch = checklistPattern.exec(content)) !== null) checklistPhases.add(checklistMatch[1]);
	const detailPhases = new Set(phases.map((p) => p.number));
	const missingDetails = [...checklistPhases].filter((p) => !detailPhases.has(p));
	output({
		milestones,
		phases,
		phase_count: phases.length,
		completed_phases: completedPhases,
		total_plans: totalPlans,
		total_summaries: totalSummaries,
		progress_percent: totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0,
		current_phase: currentPhase ? currentPhase.number : null,
		next_phase: nextPhase ? nextPhase.number : null,
		missing_phase_details: missingDetails.length > 0 ? missingDetails : null
	}, raw);
}
function cmdRoadmapUpdatePlanProgress(cwd, phaseNum, raw) {
	if (!phaseNum) error("phase number required for roadmap update-plan-progress");
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	const phaseInfo = findPhaseInternal(cwd, phaseNum);
	if (!phaseInfo) error(`Phase ${phaseNum} not found`);
	const planCount = phaseInfo.plans.length;
	const summaryCount = phaseInfo.summaries.length;
	if (planCount === 0) {
		output({
			updated: false,
			reason: "No plans found",
			plan_count: 0,
			summary_count: 0
		}, raw, "no plans");
		return;
	}
	const isComplete = summaryCount >= planCount;
	const status = isComplete ? "Complete" : summaryCount > 0 ? "In Progress" : "Planned";
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	if (!node_fs.default.existsSync(roadmapPath)) {
		output({
			updated: false,
			reason: "ROADMAP.md not found",
			plan_count: planCount,
			summary_count: summaryCount
		}, raw, "no roadmap");
		return;
	}
	let roadmapContent = node_fs.default.readFileSync(roadmapPath, "utf-8");
	const phaseEscaped = phaseNum.replace(".", "\\.");
	const tablePattern = new RegExp(`(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|)[^|]*(\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`, "i");
	const dateField = isComplete ? ` ${today} ` : "  ";
	roadmapContent = roadmapContent.replace(tablePattern, `$1 ${summaryCount}/${planCount} $2 ${status.padEnd(11)}$3${dateField}$4`);
	const planCountPattern = new RegExp(`(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`, "i");
	const planCountText = isComplete ? `${summaryCount}/${planCount} plans complete` : `${summaryCount}/${planCount} plans executed`;
	roadmapContent = roadmapContent.replace(planCountPattern, `$1${planCountText}`);
	if (isComplete) {
		const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phaseEscaped}[:\\s][^\\n]*)`, "i");
		roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);
	}
	node_fs.default.writeFileSync(roadmapPath, roadmapContent, "utf-8");
	output({
		updated: true,
		phase: phaseNum,
		plan_count: planCount,
		summary_count: summaryCount,
		status,
		complete: isComplete
	}, raw, `${summaryCount}/${planCount} ${status}`);
}

//#endregion
//#region src/core/milestone.ts
/**
* Milestone — Milestone and requirements lifecycle operations
*
* Ported from maxsim/bin/lib/milestone.cjs
*/
function cmdRequirementsMarkComplete(cwd, reqIdsRaw, raw) {
	if (!reqIdsRaw || reqIdsRaw.length === 0) error("requirement IDs required. Usage: requirements mark-complete REQ-01,REQ-02 or REQ-01 REQ-02");
	const reqIds = reqIdsRaw.join(" ").replace(/[\[\]]/g, "").split(/[,\s]+/).map((r) => r.trim()).filter(Boolean);
	if (reqIds.length === 0) error("no valid requirement IDs found");
	const reqPath = node_path.default.join(cwd, ".planning", "REQUIREMENTS.md");
	if (!node_fs.default.existsSync(reqPath)) {
		output({
			updated: false,
			reason: "REQUIREMENTS.md not found",
			ids: reqIds
		}, raw, "no requirements file");
		return;
	}
	let reqContent = node_fs.default.readFileSync(reqPath, "utf-8");
	const updated = [];
	const notFound = [];
	for (const reqId of reqIds) {
		let found = false;
		const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqId}\\*\\*)`, "gi");
		if (checkboxPattern.test(reqContent)) {
			reqContent = reqContent.replace(checkboxPattern, "$1x$2");
			found = true;
		}
		if (new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, "gi").test(reqContent)) {
			reqContent = reqContent.replace(new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, "gi"), "$1 Complete $2");
			found = true;
		}
		if (found) updated.push(reqId);
		else notFound.push(reqId);
	}
	if (updated.length > 0) node_fs.default.writeFileSync(reqPath, reqContent, "utf-8");
	output({
		updated: updated.length > 0,
		marked_complete: updated,
		not_found: notFound,
		total: reqIds.length
	}, raw, `${updated.length}/${reqIds.length} requirements marked complete`);
}
function cmdMilestoneComplete(cwd, version, options, raw) {
	if (!version) error("version required for milestone complete (e.g., v1.0)");
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	const reqPath = node_path.default.join(cwd, ".planning", "REQUIREMENTS.md");
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	const milestonesPath = node_path.default.join(cwd, ".planning", "MILESTONES.md");
	const archiveDir = node_path.default.join(cwd, ".planning", "milestones");
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const milestoneName = options.name || version;
	node_fs.default.mkdirSync(archiveDir, { recursive: true });
	let phaseCount = 0;
	let totalPlans = 0;
	let totalTasks = 0;
	const accomplishments = [];
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
		for (const dir of dirs) {
			phaseCount++;
			const phaseFiles = node_fs.default.readdirSync(node_path.default.join(phasesDir, dir));
			const plans = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md");
			const summaries = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md");
			totalPlans += plans.length;
			for (const s of summaries) try {
				const content = node_fs.default.readFileSync(node_path.default.join(phasesDir, dir, s), "utf-8");
				const fm = extractFrontmatter(content);
				if (fm["one-liner"]) accomplishments.push(String(fm["one-liner"]));
				const taskMatches = content.match(/##\s*Task\s*\d+/gi) || [];
				totalTasks += taskMatches.length;
			} catch (e) {
				if (process.env.MAXSIM_DEBUG) console.error(e);
			}
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	if (node_fs.default.existsSync(roadmapPath)) {
		const roadmapContent = node_fs.default.readFileSync(roadmapPath, "utf-8");
		node_fs.default.writeFileSync(node_path.default.join(archiveDir, `${version}-ROADMAP.md`), roadmapContent, "utf-8");
	}
	if (node_fs.default.existsSync(reqPath)) {
		const reqContent = node_fs.default.readFileSync(reqPath, "utf-8");
		const archiveHeader = `# Requirements Archive: ${version} ${milestoneName}\n\n**Archived:** ${today}\n**Status:** SHIPPED\n\nFor current requirements, see \`.planning/REQUIREMENTS.md\`.\n\n---\n\n`;
		node_fs.default.writeFileSync(node_path.default.join(archiveDir, `${version}-REQUIREMENTS.md`), archiveHeader + reqContent, "utf-8");
	}
	const auditFile = node_path.default.join(cwd, ".planning", `${version}-MILESTONE-AUDIT.md`);
	if (node_fs.default.existsSync(auditFile)) node_fs.default.renameSync(auditFile, node_path.default.join(archiveDir, `${version}-MILESTONE-AUDIT.md`));
	const accomplishmentsList = accomplishments.map((a) => `- ${a}`).join("\n");
	const milestoneEntry = `## ${version} ${milestoneName} (Shipped: ${today})\n\n**Phases completed:** ${phaseCount} phases, ${totalPlans} plans, ${totalTasks} tasks\n\n**Key accomplishments:**\n${accomplishmentsList || "- (none recorded)"}\n\n---\n\n`;
	if (node_fs.default.existsSync(milestonesPath)) {
		const existing = node_fs.default.readFileSync(milestonesPath, "utf-8");
		node_fs.default.writeFileSync(milestonesPath, existing + "\n" + milestoneEntry, "utf-8");
	} else node_fs.default.writeFileSync(milestonesPath, `# Milestones\n\n${milestoneEntry}`, "utf-8");
	if (node_fs.default.existsSync(statePath)) {
		let stateContent = node_fs.default.readFileSync(statePath, "utf-8");
		stateContent = stateContent.replace(/(\*\*Status:\*\*\s*).*/, `$1${version} milestone complete`);
		stateContent = stateContent.replace(/(\*\*Last Activity:\*\*\s*).*/, `$1${today}`);
		stateContent = stateContent.replace(/(\*\*Last Activity Description:\*\*\s*).*/, `$1${version} milestone completed and archived`);
		node_fs.default.writeFileSync(statePath, stateContent, "utf-8");
	}
	let phasesArchived = false;
	if (options.archivePhases) try {
		const phaseArchiveDir = node_path.default.join(archiveDir, `${version}-phases`);
		node_fs.default.mkdirSync(phaseArchiveDir, { recursive: true });
		const phaseDirNames = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		for (const dir of phaseDirNames) node_fs.default.renameSync(node_path.default.join(phasesDir, dir), node_path.default.join(phaseArchiveDir, dir));
		phasesArchived = phaseDirNames.length > 0;
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	output({
		version,
		name: milestoneName,
		date: today,
		phases: phaseCount,
		plans: totalPlans,
		tasks: totalTasks,
		accomplishments,
		archived: {
			roadmap: node_fs.default.existsSync(node_path.default.join(archiveDir, `${version}-ROADMAP.md`)),
			requirements: node_fs.default.existsSync(node_path.default.join(archiveDir, `${version}-REQUIREMENTS.md`)),
			audit: node_fs.default.existsSync(node_path.default.join(archiveDir, `${version}-MILESTONE-AUDIT.md`)),
			phases: phasesArchived
		},
		milestones_updated: true,
		state_updated: node_fs.default.existsSync(statePath)
	}, raw);
}

//#endregion
//#region ../../node_modules/chalk/source/vendor/ansi-styles/index.js
const ANSI_BACKGROUND_OFFSET = 10;
const wrapAnsi16 = (offset = 0) => (code) => `\u001B[${code + offset}m`;
const wrapAnsi256 = (offset = 0) => (code) => `\u001B[${38 + offset};5;${code}m`;
const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\u001B[${38 + offset};2;${red};${green};${blue}m`;
const styles$1 = {
	modifier: {
		reset: [0, 0],
		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		overline: [53, 55],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29]
	},
	color: {
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],
		blackBright: [90, 39],
		gray: [90, 39],
		grey: [90, 39],
		redBright: [91, 39],
		greenBright: [92, 39],
		yellowBright: [93, 39],
		blueBright: [94, 39],
		magentaBright: [95, 39],
		cyanBright: [96, 39],
		whiteBright: [97, 39]
	},
	bgColor: {
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],
		bgBlackBright: [100, 49],
		bgGray: [100, 49],
		bgGrey: [100, 49],
		bgRedBright: [101, 49],
		bgGreenBright: [102, 49],
		bgYellowBright: [103, 49],
		bgBlueBright: [104, 49],
		bgMagentaBright: [105, 49],
		bgCyanBright: [106, 49],
		bgWhiteBright: [107, 49]
	}
};
const modifierNames = Object.keys(styles$1.modifier);
const foregroundColorNames = Object.keys(styles$1.color);
const backgroundColorNames = Object.keys(styles$1.bgColor);
const colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
	const codes = /* @__PURE__ */ new Map();
	for (const [groupName, group] of Object.entries(styles$1)) {
		for (const [styleName, style] of Object.entries(group)) {
			styles$1[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};
			group[styleName] = styles$1[styleName];
			codes.set(style[0], style[1]);
		}
		Object.defineProperty(styles$1, groupName, {
			value: group,
			enumerable: false
		});
	}
	Object.defineProperty(styles$1, "codes", {
		value: codes,
		enumerable: false
	});
	styles$1.color.close = "\x1B[39m";
	styles$1.bgColor.close = "\x1B[49m";
	styles$1.color.ansi = wrapAnsi16();
	styles$1.color.ansi256 = wrapAnsi256();
	styles$1.color.ansi16m = wrapAnsi16m();
	styles$1.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
	Object.defineProperties(styles$1, {
		rgbToAnsi256: {
			value(red, green, blue) {
				if (red === green && green === blue) {
					if (red < 8) return 16;
					if (red > 248) return 231;
					return Math.round((red - 8) / 247 * 24) + 232;
				}
				return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
			},
			enumerable: false
		},
		hexToRgb: {
			value(hex) {
				const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
				if (!matches) return [
					0,
					0,
					0
				];
				let [colorString] = matches;
				if (colorString.length === 3) colorString = [...colorString].map((character) => character + character).join("");
				const integer = Number.parseInt(colorString, 16);
				return [
					integer >> 16 & 255,
					integer >> 8 & 255,
					integer & 255
				];
			},
			enumerable: false
		},
		hexToAnsi256: {
			value: (hex) => styles$1.rgbToAnsi256(...styles$1.hexToRgb(hex)),
			enumerable: false
		},
		ansi256ToAnsi: {
			value(code) {
				if (code < 8) return 30 + code;
				if (code < 16) return 90 + (code - 8);
				let red;
				let green;
				let blue;
				if (code >= 232) {
					red = ((code - 232) * 10 + 8) / 255;
					green = red;
					blue = red;
				} else {
					code -= 16;
					const remainder = code % 36;
					red = Math.floor(code / 36) / 5;
					green = Math.floor(remainder / 6) / 5;
					blue = remainder % 6 / 5;
				}
				const value = Math.max(red, green, blue) * 2;
				if (value === 0) return 30;
				let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
				if (value === 2) result += 60;
				return result;
			},
			enumerable: false
		},
		rgbToAnsi: {
			value: (red, green, blue) => styles$1.ansi256ToAnsi(styles$1.rgbToAnsi256(red, green, blue)),
			enumerable: false
		},
		hexToAnsi: {
			value: (hex) => styles$1.ansi256ToAnsi(styles$1.hexToAnsi256(hex)),
			enumerable: false
		}
	});
	return styles$1;
}
const ansiStyles = assembleStyles();

//#endregion
//#region ../../node_modules/chalk/source/vendor/supports-color/index.js
function hasFlag$1(flag, argv = globalThis.Deno ? globalThis.Deno.args : node_process.default.argv) {
	const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf("--");
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
const { env } = node_process.default;
let flagForceColor;
if (hasFlag$1("no-color") || hasFlag$1("no-colors") || hasFlag$1("color=false") || hasFlag$1("color=never")) flagForceColor = 0;
else if (hasFlag$1("color") || hasFlag$1("colors") || hasFlag$1("color=true") || hasFlag$1("color=always")) flagForceColor = 1;
function envForceColor() {
	if ("FORCE_COLOR" in env) {
		if (env.FORCE_COLOR === "true") return 1;
		if (env.FORCE_COLOR === "false") return 0;
		return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
	}
}
function translateLevel(level) {
	if (level === 0) return false;
	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
	const noFlagForceColor = envForceColor();
	if (noFlagForceColor !== void 0) flagForceColor = noFlagForceColor;
	const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
	if (forceColor === 0) return 0;
	if (sniffFlags) {
		if (hasFlag$1("color=16m") || hasFlag$1("color=full") || hasFlag$1("color=truecolor")) return 3;
		if (hasFlag$1("color=256")) return 2;
	}
	if ("TF_BUILD" in env && "AGENT_NAME" in env) return 1;
	if (haveStream && !streamIsTTY && forceColor === void 0) return 0;
	const min = forceColor || 0;
	if (env.TERM === "dumb") return min;
	if (node_process.default.platform === "win32") {
		const osRelease = node_os.default.release().split(".");
		if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
		return 1;
	}
	if ("CI" in env) {
		if ([
			"GITHUB_ACTIONS",
			"GITEA_ACTIONS",
			"CIRCLECI"
		].some((key) => key in env)) return 3;
		if ([
			"TRAVIS",
			"APPVEYOR",
			"GITLAB_CI",
			"BUILDKITE",
			"DRONE"
		].some((sign) => sign in env) || env.CI_NAME === "codeship") return 1;
		return min;
	}
	if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	if (env.COLORTERM === "truecolor") return 3;
	if (env.TERM === "xterm-kitty") return 3;
	if (env.TERM === "xterm-ghostty") return 3;
	if (env.TERM === "wezterm") return 3;
	if ("TERM_PROGRAM" in env) {
		const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
		switch (env.TERM_PROGRAM) {
			case "iTerm.app": return version >= 3 ? 3 : 2;
			case "Apple_Terminal": return 2;
		}
	}
	if (/-256(color)?$/i.test(env.TERM)) return 2;
	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
	if ("COLORTERM" in env) return 1;
	return min;
}
function createSupportsColor(stream, options = {}) {
	return translateLevel(_supportsColor(stream, {
		streamIsTTY: stream && stream.isTTY,
		...options
	}));
}
const supportsColor = {
	stdout: createSupportsColor({ isTTY: node_tty.default.isatty(1) }),
	stderr: createSupportsColor({ isTTY: node_tty.default.isatty(2) })
};

//#endregion
//#region ../../node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
	let index = string.indexOf(substring);
	if (index === -1) return string;
	const substringLength = substring.length;
	let endIndex = 0;
	let returnValue = "";
	do {
		returnValue += string.slice(endIndex, index) + substring + replacer;
		endIndex = index + substringLength;
		index = string.indexOf(substring, endIndex);
	} while (index !== -1);
	returnValue += string.slice(endIndex);
	return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
	let endIndex = 0;
	let returnValue = "";
	do {
		const gotCR = string[index - 1] === "\r";
		returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
		endIndex = index + 1;
		index = string.indexOf("\n", endIndex);
	} while (index !== -1);
	returnValue += string.slice(endIndex);
	return returnValue;
}

//#endregion
//#region ../../node_modules/chalk/source/index.js
const { stdout: stdoutColor, stderr: stderrColor } = supportsColor;
const GENERATOR = Symbol("GENERATOR");
const STYLER = Symbol("STYLER");
const IS_EMPTY = Symbol("IS_EMPTY");
const levelMapping = [
	"ansi",
	"ansi",
	"ansi256",
	"ansi16m"
];
const styles = Object.create(null);
const applyOptions = (object, options = {}) => {
	if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) throw new Error("The `level` option should be an integer from 0 to 3");
	const colorLevel = stdoutColor ? stdoutColor.level : 0;
	object.level = options.level === void 0 ? colorLevel : options.level;
};
const chalkFactory = (options) => {
	const chalk = (...strings) => strings.join(" ");
	applyOptions(chalk, options);
	Object.setPrototypeOf(chalk, createChalk.prototype);
	return chalk;
};
function createChalk(options) {
	return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansiStyles)) styles[styleName] = { get() {
	const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
	Object.defineProperty(this, styleName, { value: builder });
	return builder;
} };
styles.visible = { get() {
	const builder = createBuilder(this, this[STYLER], true);
	Object.defineProperty(this, "visible", { value: builder });
	return builder;
} };
const getModelAnsi = (model, level, type, ...arguments_) => {
	if (model === "rgb") {
		if (level === "ansi16m") return ansiStyles[type].ansi16m(...arguments_);
		if (level === "ansi256") return ansiStyles[type].ansi256(ansiStyles.rgbToAnsi256(...arguments_));
		return ansiStyles[type].ansi(ansiStyles.rgbToAnsi(...arguments_));
	}
	if (model === "hex") return getModelAnsi("rgb", level, type, ...ansiStyles.hexToRgb(...arguments_));
	return ansiStyles[type][model](...arguments_);
};
for (const model of [
	"rgb",
	"hex",
	"ansi256"
]) {
	styles[model] = { get() {
		const { level } = this;
		return function(...arguments_) {
			const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansiStyles.color.close, this[STYLER]);
			return createBuilder(this, styler, this[IS_EMPTY]);
		};
	} };
	const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = { get() {
		const { level } = this;
		return function(...arguments_) {
			const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansiStyles.bgColor.close, this[STYLER]);
			return createBuilder(this, styler, this[IS_EMPTY]);
		};
	} };
}
const proto = Object.defineProperties(() => {}, {
	...styles,
	level: {
		enumerable: true,
		get() {
			return this[GENERATOR].level;
		},
		set(level) {
			this[GENERATOR].level = level;
		}
	}
});
const createStyler = (open, close, parent) => {
	let openAll;
	let closeAll;
	if (parent === void 0) {
		openAll = open;
		closeAll = close;
	} else {
		openAll = parent.openAll + open;
		closeAll = close + parent.closeAll;
	}
	return {
		open,
		close,
		openAll,
		closeAll,
		parent
	};
};
const createBuilder = (self, _styler, _isEmpty) => {
	const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
	Object.setPrototypeOf(builder, proto);
	builder[GENERATOR] = self;
	builder[STYLER] = _styler;
	builder[IS_EMPTY] = _isEmpty;
	return builder;
};
const applyStyle = (self, string) => {
	if (self.level <= 0 || !string) return self[IS_EMPTY] ? "" : string;
	let styler = self[STYLER];
	if (styler === void 0) return string;
	const { openAll, closeAll } = styler;
	if (string.includes("\x1B")) while (styler !== void 0) {
		string = stringReplaceAll(string, styler.close, styler.open);
		styler = styler.parent;
	}
	const lfIndex = string.indexOf("\n");
	if (lfIndex !== -1) string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
	return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles);
const chalk = createChalk();
const chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });

//#endregion
//#region src/core/commands.ts
/**
* Commands — Standalone utility commands
*
* Ported from maxsim/bin/lib/commands.cjs
*/
function cmdGenerateSlug(text, raw) {
	if (!text) error("text required for slug generation");
	const slug = (0, import_slugify.default)(text, {
		lower: true,
		strict: true
	});
	output({ slug }, raw, slug);
}
function cmdCurrentTimestamp(format, raw) {
	const now = /* @__PURE__ */ new Date();
	let result;
	switch (format) {
		case "date":
			result = now.toISOString().split("T")[0];
			break;
		case "filename":
			result = now.toISOString().replace(/:/g, "-").replace(/\..+/, "");
			break;
		default:
			result = now.toISOString();
			break;
	}
	output({ timestamp: result }, raw, result);
}
function cmdListTodos(cwd, area, raw) {
	const pendingDir = node_path.default.join(cwd, ".planning", "todos", "pending");
	let count = 0;
	const todos = [];
	try {
		const files = node_fs.default.readdirSync(pendingDir).filter((f) => f.endsWith(".md"));
		for (const file of files) try {
			const content = node_fs.default.readFileSync(node_path.default.join(pendingDir, file), "utf-8");
			const createdMatch = content.match(/^created:\s*(.+)$/m);
			const titleMatch = content.match(/^title:\s*(.+)$/m);
			const areaMatch = content.match(/^area:\s*(.+)$/m);
			const todoArea = areaMatch ? areaMatch[1].trim() : "general";
			if (area && todoArea !== area) continue;
			count++;
			todos.push({
				file,
				created: createdMatch ? createdMatch[1].trim() : "unknown",
				title: titleMatch ? titleMatch[1].trim() : "Untitled",
				area: todoArea,
				path: node_path.default.join(".planning", "todos", "pending", file)
			});
		} catch (e) {
			if (process.env.MAXSIM_DEBUG) console.error(e);
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	output({
		count,
		todos
	}, raw, count.toString());
}
function cmdVerifyPathExists(cwd, targetPath, raw) {
	if (!targetPath) error("path required for verification");
	const fullPath = node_path.default.isAbsolute(targetPath) ? targetPath : node_path.default.join(cwd, targetPath);
	try {
		const stats = node_fs.default.statSync(fullPath);
		output({
			exists: true,
			type: stats.isDirectory() ? "directory" : stats.isFile() ? "file" : "other"
		}, raw, "true");
	} catch {
		output({
			exists: false,
			type: null
		}, raw, "false");
	}
}
function cmdHistoryDigest(cwd, raw) {
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const digest = {
		phases: {},
		decisions: [],
		tech_stack: /* @__PURE__ */ new Set()
	};
	const allPhaseDirs = [];
	const archived = getArchivedPhaseDirs(cwd);
	for (const a of archived) allPhaseDirs.push({
		name: a.name,
		fullPath: a.fullPath,
		milestone: a.milestone
	});
	if (node_fs.default.existsSync(phasesDir)) try {
		const currentDirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
		for (const dir of currentDirs) allPhaseDirs.push({
			name: dir,
			fullPath: node_path.default.join(phasesDir, dir),
			milestone: null
		});
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	if (allPhaseDirs.length === 0) {
		output({
			phases: {},
			decisions: [],
			tech_stack: []
		}, raw);
		return;
	}
	try {
		for (const { name: dir, fullPath: dirPath } of allPhaseDirs) {
			const summaries = node_fs.default.readdirSync(dirPath).filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md");
			for (const summary of summaries) try {
				const fm = extractFrontmatter(node_fs.default.readFileSync(node_path.default.join(dirPath, summary), "utf-8"));
				const phaseNum = fm.phase || dir.split("-")[0];
				if (!digest.phases[phaseNum]) digest.phases[phaseNum] = {
					name: fm.name || dir.split("-").slice(1).join(" ") || "Unknown",
					provides: /* @__PURE__ */ new Set(),
					affects: /* @__PURE__ */ new Set(),
					patterns: /* @__PURE__ */ new Set()
				};
				const depGraph = fm["dependency-graph"];
				if (depGraph && depGraph.provides) depGraph.provides.forEach((p) => digest.phases[phaseNum].provides.add(p));
				else if (fm.provides) fm.provides.forEach((p) => digest.phases[phaseNum].provides.add(p));
				if (depGraph && depGraph.affects) depGraph.affects.forEach((a) => digest.phases[phaseNum].affects.add(a));
				if (fm["patterns-established"]) fm["patterns-established"].forEach((p) => digest.phases[phaseNum].patterns.add(p));
				if (fm["key-decisions"]) fm["key-decisions"].forEach((d) => {
					digest.decisions.push({
						phase: phaseNum,
						decision: d
					});
				});
				const techStack = fm["tech-stack"];
				if (techStack && techStack.added) techStack.added.forEach((t) => digest.tech_stack.add(typeof t === "string" ? t : t.name));
			} catch (e) {
				if (process.env.MAXSIM_DEBUG) console.error(e);
			}
		}
		const outputDigest = {
			phases: {},
			decisions: digest.decisions,
			tech_stack: [...digest.tech_stack]
		};
		for (const [p, data] of Object.entries(digest.phases)) outputDigest.phases[p] = {
			name: data.name,
			provides: [...data.provides],
			affects: [...data.affects],
			patterns: [...data.patterns]
		};
		output(outputDigest, raw);
	} catch (e) {
		error("Failed to generate history digest: " + e.message);
	}
}
function cmdResolveModel(cwd, agentType, raw) {
	if (!agentType) error("agent-type required");
	const profile = loadConfig(cwd).model_profile || "balanced";
	const agentModels = MODEL_PROFILES[agentType];
	if (!agentModels) {
		output({
			model: "sonnet",
			profile,
			unknown_agent: true
		}, raw, "sonnet");
		return;
	}
	const resolved = agentModels[profile] || agentModels["balanced"] || "sonnet";
	const model = resolved === "opus" ? "inherit" : resolved;
	output({
		model,
		profile
	}, raw, model);
}
async function cmdCommit(cwd, message, files, raw, amend) {
	if (!message && !amend) error("commit message required");
	if (!loadConfig(cwd).commit_docs) {
		output({
			committed: false,
			hash: null,
			reason: "skipped_commit_docs_false"
		}, raw, "skipped");
		return;
	}
	if (await isGitIgnored(cwd, ".planning")) {
		output({
			committed: false,
			hash: null,
			reason: "skipped_gitignored"
		}, raw, "skipped");
		return;
	}
	const filesToStage = files && files.length > 0 ? files : [".planning/"];
	for (const file of filesToStage) await execGit(cwd, ["add", file]);
	const commitResult = await execGit(cwd, amend ? [
		"commit",
		"--amend",
		"--no-edit"
	] : [
		"commit",
		"-m",
		message
	]);
	if (commitResult.exitCode !== 0) {
		if (commitResult.stdout.includes("nothing to commit") || commitResult.stderr.includes("nothing to commit")) {
			output({
				committed: false,
				hash: null,
				reason: "nothing_to_commit"
			}, raw, "nothing");
			return;
		}
		output({
			committed: false,
			hash: null,
			reason: "nothing_to_commit",
			error: commitResult.stderr
		}, raw, "nothing");
		return;
	}
	const hashResult = await execGit(cwd, [
		"rev-parse",
		"--short",
		"HEAD"
	]);
	const hash = hashResult.exitCode === 0 ? hashResult.stdout : null;
	output({
		committed: true,
		hash,
		reason: "committed"
	}, raw, hash || "committed");
}
function cmdSummaryExtract(cwd, summaryPath, fields, raw) {
	if (!summaryPath) error("summary-path required for summary-extract");
	const fullPath = node_path.default.join(cwd, summaryPath);
	if (!node_fs.default.existsSync(fullPath)) {
		output({
			error: "File not found",
			path: summaryPath
		}, raw);
		return;
	}
	const fm = extractFrontmatter(node_fs.default.readFileSync(fullPath, "utf-8"));
	const parseDecisions = (decisionsList) => {
		if (!decisionsList || !Array.isArray(decisionsList)) return [];
		return decisionsList.map((d) => {
			const colonIdx = d.indexOf(":");
			if (colonIdx > 0) return {
				summary: d.substring(0, colonIdx).trim(),
				rationale: d.substring(colonIdx + 1).trim()
			};
			return {
				summary: d,
				rationale: null
			};
		});
	};
	const techStack = fm["tech-stack"];
	const fullResult = {
		path: summaryPath,
		one_liner: fm["one-liner"] || null,
		key_files: fm["key-files"] || [],
		tech_added: techStack && techStack.added || [],
		patterns: fm["patterns-established"] || [],
		decisions: parseDecisions(fm["key-decisions"]),
		requirements_completed: fm["requirements-completed"] || []
	};
	if (fields && fields.length > 0) {
		const filtered = { path: summaryPath };
		for (const field of fields) if (fullResult[field] !== void 0) filtered[field] = fullResult[field];
		output(filtered, raw);
		return;
	}
	output(fullResult, raw);
}
async function cmdWebsearch(query, options, raw) {
	const apiKey = process.env.BRAVE_API_KEY;
	if (!apiKey) {
		output({
			available: false,
			reason: "BRAVE_API_KEY not set"
		}, raw, "");
		return;
	}
	if (!query) {
		output({
			available: false,
			error: "Query required"
		}, raw, "");
		return;
	}
	const params = new URLSearchParams({
		q: query,
		count: String(options.limit || 10),
		country: "us",
		search_lang: "en",
		text_decorations: "false"
	});
	if (options.freshness) params.set("freshness", options.freshness);
	try {
		const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, { headers: {
			Accept: "application/json",
			"X-Subscription-Token": apiKey
		} });
		if (!response.ok) {
			output({
				available: false,
				error: `API error: ${response.status}`
			}, raw, "");
			return;
		}
		const results = ((await response.json()).web?.results || []).map((r) => ({
			title: r.title,
			url: r.url,
			description: r.description,
			age: r.age || null
		}));
		output({
			available: true,
			query,
			count: results.length,
			results
		}, raw, results.map((r) => `${r.title}\n${r.url}\n${r.description}`).join("\n\n"));
	} catch (err) {
		output({
			available: false,
			error: err.message
		}, raw, "");
	}
}
function cmdProgressRender(cwd, format, raw) {
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const milestone = getMilestoneInfo(cwd);
	const phases = [];
	let totalPlans = 0;
	let totalSummaries = 0;
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => {
			return parseFloat(a.match(/^(\d+(?:\.\d+)?)/)?.[1] || "0") - parseFloat(b.match(/^(\d+(?:\.\d+)?)/)?.[1] || "0");
		});
		for (const dir of dirs) {
			const dm = dir.match(/^(\d+(?:\.\d+)?)-?(.*)/);
			const phaseNum = dm ? dm[1] : dir;
			const phaseName = dm && dm[2] ? dm[2].replace(/-/g, " ") : "";
			const phaseFiles = node_fs.default.readdirSync(node_path.default.join(phasesDir, dir));
			const planCount = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md").length;
			const summaryCount = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md").length;
			totalPlans += planCount;
			totalSummaries += summaryCount;
			let status;
			if (planCount === 0) status = "Pending";
			else if (summaryCount >= planCount) status = "Complete";
			else if (summaryCount > 0) status = "In Progress";
			else status = "Planned";
			phases.push({
				number: phaseNum,
				name: phaseName,
				plans: planCount,
				summaries: summaryCount,
				status
			});
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	const percent = totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0;
	if (format === "table") {
		const barWidth = 10;
		const filled = Math.round(percent / 100 * barWidth);
		const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
		let out = `# ${milestone.version} ${milestone.name}\n\n`;
		out += `**Progress:** [${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)\n\n`;
		out += `| Phase | Name | Plans | Status |\n`;
		out += `|-------|------|-------|--------|\n`;
		for (const p of phases) out += `| ${p.number} | ${p.name} | ${p.summaries}/${p.plans} | ${p.status} |\n`;
		output({ rendered: out }, raw, out);
	} else if (format === "bar") {
		const barWidth = 20;
		const filled = Math.round(percent / 100 * barWidth);
		const text = `[${"█".repeat(filled) + "░".repeat(barWidth - filled)}] ${totalSummaries}/${totalPlans} plans (${percent}%)`;
		output({
			bar: text,
			percent,
			completed: totalSummaries,
			total: totalPlans
		}, raw, text);
	} else if (format === "phase-bars") {
		const doneCount = phases.filter((p) => p.status === "Complete").length;
		const inProgressCount = phases.filter((p) => p.status === "In Progress").length;
		const totalCount = phases.length;
		const lines = [chalk.bold(`Milestone: ${milestone.name} — ${doneCount}/${totalCount} phases complete (${percent}%)`), ""];
		for (const p of phases) {
			const pPercent = p.plans > 0 ? Math.min(100, Math.round(p.summaries / p.plans * 100)) : 0;
			const barWidth = 10;
			const filled = Math.round(pPercent / 100 * barWidth);
			const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
			const phaseLabel = `Phase ${p.number.padStart(2, "0")}`;
			const statusLabel = p.status === "Complete" ? "DONE" : p.status === "In Progress" ? "IN PROGRESS" : "PLANNED";
			let line = `${phaseLabel} [${bar}] ${String(pPercent).padStart(3, " ")}% — ${statusLabel}`;
			if (p.status === "Complete") line = chalk.green(line);
			else if (p.status === "In Progress") line = chalk.yellow(line);
			else line = chalk.dim(line);
			lines.push(line);
		}
		const rendered = lines.join("\n");
		output({
			rendered,
			done: doneCount,
			in_progress: inProgressCount,
			total: totalCount,
			percent
		}, raw, rendered);
	} else output({
		milestone_version: milestone.version,
		milestone_name: milestone.name,
		phases,
		total_plans: totalPlans,
		total_summaries: totalSummaries,
		percent
	}, raw);
}
function cmdTodoComplete(cwd, filename, raw) {
	if (!filename) error("filename required for todo complete");
	const pendingDir = node_path.default.join(cwd, ".planning", "todos", "pending");
	const completedDir = node_path.default.join(cwd, ".planning", "todos", "completed");
	const sourcePath = node_path.default.join(pendingDir, filename);
	if (!node_fs.default.existsSync(sourcePath)) error(`Todo not found: ${filename}`);
	node_fs.default.mkdirSync(completedDir, { recursive: true });
	let content = node_fs.default.readFileSync(sourcePath, "utf-8");
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	content = `completed: ${today}\n` + content;
	node_fs.default.writeFileSync(node_path.default.join(completedDir, filename), content, "utf-8");
	node_fs.default.unlinkSync(sourcePath);
	output({
		completed: true,
		file: filename,
		date: today
	}, raw, "completed");
}
function cmdScaffold(cwd, type, options, raw) {
	const { phase, name } = options;
	const padded = phase ? normalizePhaseName(phase) : "00";
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const phaseInfo = phase ? findPhaseInternal(cwd, phase) : null;
	const phaseDir = phaseInfo ? node_path.default.join(cwd, phaseInfo.directory) : null;
	if (phase && !phaseDir && type !== "phase-dir") error(`Phase ${phase} directory not found`);
	let filePath;
	let content;
	switch (type) {
		case "context":
			filePath = node_path.default.join(phaseDir, `${padded}-CONTEXT.md`);
			content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || "Unnamed"}"\ncreated: ${today}\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || "Unnamed"} — Context\n\n## Decisions\n\n_Decisions will be captured during /maxsim:discuss-phase ${phase}_\n\n## Discretion Areas\n\n_Areas where the executor can use judgment_\n\n## Deferred Ideas\n\n_Ideas to consider later_\n`;
			break;
		case "uat":
			filePath = node_path.default.join(phaseDir, `${padded}-UAT.md`);
			content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || "Unnamed"}"\ncreated: ${today}\nstatus: pending\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || "Unnamed"} — User Acceptance Testing\n\n## Test Results\n\n| # | Test | Status | Notes |\n|---|------|--------|-------|\n\n## Summary\n\n_Pending UAT_\n`;
			break;
		case "verification":
			filePath = node_path.default.join(phaseDir, `${padded}-VERIFICATION.md`);
			content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || "Unnamed"}"\ncreated: ${today}\nstatus: pending\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || "Unnamed"} — Verification\n\n## Goal-Backward Verification\n\n**Phase Goal:** [From ROADMAP.md]\n\n## Checks\n\n| # | Requirement | Status | Evidence |\n|---|------------|--------|----------|\n\n## Result\n\n_Pending verification_\n`;
			break;
		case "phase-dir": {
			if (!phase || !name) error("phase and name required for phase-dir scaffold");
			const dirName = `${padded}-${generateSlugInternal(name)}`;
			const phasesParent = node_path.default.join(cwd, ".planning", "phases");
			node_fs.default.mkdirSync(phasesParent, { recursive: true });
			const dirPath = node_path.default.join(phasesParent, dirName);
			node_fs.default.mkdirSync(dirPath, { recursive: true });
			output({
				created: true,
				directory: `.planning/phases/${dirName}`,
				path: dirPath
			}, raw, dirPath);
			return;
		}
		default:
			error(`Unknown scaffold type: ${type}. Available: context, uat, verification, phase-dir`);
			return;
	}
	if (node_fs.default.existsSync(filePath)) {
		output({
			created: false,
			reason: "already_exists",
			path: filePath
		}, raw, "exists");
		return;
	}
	node_fs.default.writeFileSync(filePath, content, "utf-8");
	const relPath = node_path.default.relative(cwd, filePath);
	output({
		created: true,
		path: relPath
	}, raw, relPath);
}

//#endregion
//#region src/core/verify.ts
/**
* Verify — Verification suite, consistency, and health validation
*
* Ported from maxsim/bin/lib/verify.cjs
*/
async function cmdVerifySummary(cwd, summaryPath, checkFileCount, raw) {
	if (!summaryPath) error("summary-path required");
	const fullPath = node_path.default.join(cwd, summaryPath);
	const checkCount = checkFileCount || 2;
	if (!node_fs.default.existsSync(fullPath)) {
		output({
			passed: false,
			checks: {
				summary_exists: false,
				files_created: {
					checked: 0,
					found: 0,
					missing: []
				},
				commits_exist: false,
				self_check: "not_found"
			},
			errors: ["SUMMARY.md not found"]
		}, raw, "failed");
		return;
	}
	const content = node_fs.default.readFileSync(fullPath, "utf-8");
	const errors = [];
	const mentionedFiles = /* @__PURE__ */ new Set();
	for (const pattern of [/`([^`]+\.[a-zA-Z]+)`/g, /(?:Created|Modified|Added|Updated|Edited):\s*`?([^\s`]+\.[a-zA-Z]+)`?/gi]) {
		let m;
		while ((m = pattern.exec(content)) !== null) {
			const filePath = m[1];
			if (filePath && !filePath.startsWith("http") && filePath.includes("/")) mentionedFiles.add(filePath);
		}
	}
	const filesToCheck = Array.from(mentionedFiles).slice(0, checkCount);
	const missing = [];
	for (const file of filesToCheck) if (!node_fs.default.existsSync(node_path.default.join(cwd, file))) missing.push(file);
	const hashes = content.match(/\b[0-9a-f]{7,40}\b/g) || [];
	let commitsExist = false;
	if (hashes.length > 0) for (const hash of hashes.slice(0, 3)) {
		const result = await execGit(cwd, [
			"cat-file",
			"-t",
			hash
		]);
		if (result.exitCode === 0 && result.stdout === "commit") {
			commitsExist = true;
			break;
		}
	}
	let selfCheck = "not_found";
	const selfCheckPattern = /##\s*(?:Self[- ]?Check|Verification|Quality Check)/i;
	if (selfCheckPattern.test(content)) {
		const passPattern = /(?:all\s+)?(?:pass|✓|✅|complete|succeeded)/i;
		const failPattern = /(?:fail|✗|❌|incomplete|blocked)/i;
		const checkSection = content.slice(content.search(selfCheckPattern));
		if (failPattern.test(checkSection)) selfCheck = "failed";
		else if (passPattern.test(checkSection)) selfCheck = "passed";
	}
	if (missing.length > 0) errors.push("Missing files: " + missing.join(", "));
	if (!commitsExist && hashes.length > 0) errors.push("Referenced commit hashes not found in git history");
	if (selfCheck === "failed") errors.push("Self-check section indicates failure");
	const checks = {
		summary_exists: true,
		files_created: {
			checked: filesToCheck.length,
			found: filesToCheck.length - missing.length,
			missing
		},
		commits_exist: commitsExist,
		self_check: selfCheck
	};
	const passed = missing.length === 0 && selfCheck !== "failed";
	output({
		passed,
		checks,
		errors
	}, raw, passed ? "passed" : "failed");
}
function cmdVerifyPlanStructure(cwd, filePath, raw) {
	if (!filePath) error("file path required");
	const content = safeReadFile(node_path.default.isAbsolute(filePath) ? filePath : node_path.default.join(cwd, filePath));
	if (!content) {
		output({
			error: "File not found",
			path: filePath
		}, raw);
		return;
	}
	const fm = extractFrontmatter(content);
	const errors = [];
	const warnings = [];
	for (const field of [
		"phase",
		"plan",
		"type",
		"wave",
		"depends_on",
		"files_modified",
		"autonomous",
		"must_haves"
	]) if (fm[field] === void 0) errors.push(`Missing required frontmatter field: ${field}`);
	const taskPattern = /<task[^>]*>([\s\S]*?)<\/task>/g;
	const tasks = [];
	let taskMatch;
	while ((taskMatch = taskPattern.exec(content)) !== null) {
		const taskContent = taskMatch[1];
		const nameMatch = taskContent.match(/<name>([\s\S]*?)<\/name>/);
		const taskName = nameMatch ? nameMatch[1].trim() : "unnamed";
		const hasFiles = /<files>/.test(taskContent);
		const hasAction = /<action>/.test(taskContent);
		const hasVerify = /<verify>/.test(taskContent);
		const hasDone = /<done>/.test(taskContent);
		if (!nameMatch) errors.push("Task missing <name> element");
		if (!hasAction) errors.push(`Task '${taskName}' missing <action>`);
		if (!hasVerify) warnings.push(`Task '${taskName}' missing <verify>`);
		if (!hasDone) warnings.push(`Task '${taskName}' missing <done>`);
		if (!hasFiles) warnings.push(`Task '${taskName}' missing <files>`);
		tasks.push({
			name: taskName,
			hasFiles,
			hasAction,
			hasVerify,
			hasDone
		});
	}
	if (tasks.length === 0) warnings.push("No <task> elements found");
	if (fm.wave && parseInt(String(fm.wave)) > 1 && (!fm.depends_on || Array.isArray(fm.depends_on) && fm.depends_on.length === 0)) warnings.push("Wave > 1 but depends_on is empty");
	if (/<task\s+type=["']?checkpoint/.test(content) && fm.autonomous !== "false" && fm.autonomous !== false) errors.push("Has checkpoint tasks but autonomous is not false");
	output({
		valid: errors.length === 0,
		errors,
		warnings,
		task_count: tasks.length,
		tasks,
		frontmatter_fields: Object.keys(fm)
	}, raw, errors.length === 0 ? "valid" : "invalid");
}
function cmdVerifyPhaseCompleteness(cwd, phase, raw) {
	if (!phase) error("phase required");
	const phaseInfo = findPhaseInternal(cwd, phase);
	if (!phaseInfo) {
		output({
			error: "Phase not found",
			phase
		}, raw);
		return;
	}
	const errors = [];
	const warnings = [];
	const phaseDir = node_path.default.join(cwd, phaseInfo.directory);
	let files;
	try {
		files = node_fs.default.readdirSync(phaseDir);
	} catch {
		output({ error: "Cannot read phase directory" }, raw);
		return;
	}
	const plans = files.filter((f) => /-PLAN\.md$/i.test(f));
	const summaries = files.filter((f) => /-SUMMARY\.md$/i.test(f));
	const planIds = new Set(plans.map((p) => p.replace(/-PLAN\.md$/i, "")));
	const summaryIds = new Set(summaries.map((s) => s.replace(/-SUMMARY\.md$/i, "")));
	const incompletePlans = [...planIds].filter((id) => !summaryIds.has(id));
	if (incompletePlans.length > 0) errors.push(`Plans without summaries: ${incompletePlans.join(", ")}`);
	const orphanSummaries = [...summaryIds].filter((id) => !planIds.has(id));
	if (orphanSummaries.length > 0) warnings.push(`Summaries without plans: ${orphanSummaries.join(", ")}`);
	output({
		complete: errors.length === 0,
		phase: phaseInfo.phase_number,
		plan_count: plans.length,
		summary_count: summaries.length,
		incomplete_plans: incompletePlans,
		orphan_summaries: orphanSummaries,
		errors,
		warnings
	}, raw, errors.length === 0 ? "complete" : "incomplete");
}
function cmdVerifyReferences(cwd, filePath, raw) {
	if (!filePath) error("file path required");
	const content = safeReadFile(node_path.default.isAbsolute(filePath) ? filePath : node_path.default.join(cwd, filePath));
	if (!content) {
		output({
			error: "File not found",
			path: filePath
		}, raw);
		return;
	}
	const found = [];
	const missing = [];
	const atRefs = content.match(/@([^\s\n,)]+\/[^\s\n,)]+)/g) || [];
	for (const ref of atRefs) {
		const cleanRef = ref.slice(1);
		const resolved = cleanRef.startsWith("~/") ? node_path.default.join(process.env.HOME || "", cleanRef.slice(2)) : node_path.default.join(cwd, cleanRef);
		if (node_fs.default.existsSync(resolved)) found.push(cleanRef);
		else missing.push(cleanRef);
	}
	const backtickRefs = content.match(/`([^`]+\/[^`]+\.[a-zA-Z]{1,10})`/g) || [];
	for (const ref of backtickRefs) {
		const cleanRef = ref.slice(1, -1);
		if (cleanRef.startsWith("http") || cleanRef.includes("${") || cleanRef.includes("{{")) continue;
		if (found.includes(cleanRef) || missing.includes(cleanRef)) continue;
		const resolved = node_path.default.join(cwd, cleanRef);
		if (node_fs.default.existsSync(resolved)) found.push(cleanRef);
		else missing.push(cleanRef);
	}
	output({
		valid: missing.length === 0,
		found: found.length,
		missing,
		total: found.length + missing.length
	}, raw, missing.length === 0 ? "valid" : "invalid");
}
async function cmdVerifyCommits(cwd, hashes, raw) {
	if (!hashes || hashes.length === 0) error("At least one commit hash required");
	const valid = [];
	const invalid = [];
	for (const hash of hashes) {
		const result = await execGit(cwd, [
			"cat-file",
			"-t",
			hash
		]);
		if (result.exitCode === 0 && result.stdout.trim() === "commit") valid.push(hash);
		else invalid.push(hash);
	}
	output({
		all_valid: invalid.length === 0,
		valid,
		invalid,
		total: hashes.length
	}, raw, invalid.length === 0 ? "valid" : "invalid");
}
function cmdVerifyArtifacts(cwd, planFilePath, raw) {
	if (!planFilePath) error("plan file path required");
	const content = safeReadFile(node_path.default.isAbsolute(planFilePath) ? planFilePath : node_path.default.join(cwd, planFilePath));
	if (!content) {
		output({
			error: "File not found",
			path: planFilePath
		}, raw);
		return;
	}
	const artifacts = parseMustHavesBlock(content, "artifacts");
	if (artifacts.length === 0) {
		output({
			error: "No must_haves.artifacts found in frontmatter",
			path: planFilePath
		}, raw);
		return;
	}
	const results = [];
	for (const artifact of artifacts) {
		if (typeof artifact === "string") continue;
		const artObj = artifact;
		const artPath = artObj.path;
		if (!artPath) continue;
		const artFullPath = node_path.default.join(cwd, artPath);
		const exists = node_fs.default.existsSync(artFullPath);
		const check = {
			path: artPath,
			exists,
			issues: [],
			passed: false
		};
		if (exists) {
			const fileContent = safeReadFile(artFullPath) || "";
			const lineCount = fileContent.split("\n").length;
			if (artObj.min_lines && lineCount < artObj.min_lines) check.issues.push(`Only ${lineCount} lines, need ${artObj.min_lines}`);
			if (artObj.contains && !fileContent.includes(artObj.contains)) check.issues.push(`Missing pattern: ${artObj.contains}`);
			if (artObj.exports) {
				const exportList = Array.isArray(artObj.exports) ? artObj.exports : [artObj.exports];
				for (const exp of exportList) if (!fileContent.includes(exp)) check.issues.push(`Missing export: ${exp}`);
			}
			check.passed = check.issues.length === 0;
		} else check.issues.push("File not found");
		results.push(check);
	}
	const passed = results.filter((r) => r.passed).length;
	output({
		all_passed: passed === results.length,
		passed,
		total: results.length,
		artifacts: results
	}, raw, passed === results.length ? "valid" : "invalid");
}
function cmdVerifyKeyLinks(cwd, planFilePath, raw) {
	if (!planFilePath) error("plan file path required");
	const content = safeReadFile(node_path.default.isAbsolute(planFilePath) ? planFilePath : node_path.default.join(cwd, planFilePath));
	if (!content) {
		output({
			error: "File not found",
			path: planFilePath
		}, raw);
		return;
	}
	const keyLinks = parseMustHavesBlock(content, "key_links");
	if (keyLinks.length === 0) {
		output({
			error: "No must_haves.key_links found in frontmatter",
			path: planFilePath
		}, raw);
		return;
	}
	const results = [];
	for (const link of keyLinks) {
		if (typeof link === "string") continue;
		const linkObj = link;
		const check = {
			from: linkObj.from || "",
			to: linkObj.to || "",
			via: linkObj.via || "",
			verified: false,
			detail: ""
		};
		const sourceContent = safeReadFile(node_path.default.join(cwd, linkObj.from || ""));
		if (!sourceContent) check.detail = "Source file not found";
		else if (linkObj.pattern) try {
			const regex = new RegExp(linkObj.pattern);
			if (regex.test(sourceContent)) {
				check.verified = true;
				check.detail = "Pattern found in source";
			} else {
				const targetContent = safeReadFile(node_path.default.join(cwd, linkObj.to || ""));
				if (targetContent && regex.test(targetContent)) {
					check.verified = true;
					check.detail = "Pattern found in target";
				} else check.detail = `Pattern "${linkObj.pattern}" not found in source or target`;
			}
		} catch {
			check.detail = `Invalid regex pattern: ${linkObj.pattern}`;
		}
		else if (sourceContent.includes(linkObj.to || "")) {
			check.verified = true;
			check.detail = "Target referenced in source";
		} else check.detail = "Target not referenced in source";
		results.push(check);
	}
	const verified = results.filter((r) => r.verified).length;
	output({
		all_verified: verified === results.length,
		verified,
		total: results.length,
		links: results
	}, raw, verified === results.length ? "valid" : "invalid");
}
function cmdValidateConsistency(cwd, raw) {
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const errors = [];
	const warnings = [];
	if (!node_fs.default.existsSync(roadmapPath)) {
		errors.push("ROADMAP.md not found");
		output({
			passed: false,
			errors,
			warnings
		}, raw, "failed");
		return;
	}
	const roadmapContent = node_fs.default.readFileSync(roadmapPath, "utf-8");
	const roadmapPhases = /* @__PURE__ */ new Set();
	const phasePattern = getPhasePattern();
	let m;
	while ((m = phasePattern.exec(roadmapContent)) !== null) roadmapPhases.add(m[1]);
	const diskPhases = /* @__PURE__ */ new Set();
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		for (const dir of dirs) {
			const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)/i);
			if (dm) diskPhases.add(dm[1]);
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	for (const p of roadmapPhases) if (!diskPhases.has(p) && !diskPhases.has(normalizePhaseName(p))) warnings.push(`Phase ${p} in ROADMAP.md but no directory on disk`);
	for (const p of diskPhases) {
		const unpadded = String(parseInt(p, 10));
		if (!roadmapPhases.has(p) && !roadmapPhases.has(unpadded)) warnings.push(`Phase ${p} exists on disk but not in ROADMAP.md`);
	}
	const integerPhases = [...diskPhases].filter((p) => !p.includes(".")).map((p) => parseInt(p, 10)).sort((a, b) => a - b);
	for (let i = 1; i < integerPhases.length; i++) if (integerPhases[i] !== integerPhases[i - 1] + 1) warnings.push(`Gap in phase numbering: ${integerPhases[i - 1]} → ${integerPhases[i]}`);
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
		for (const dir of dirs) {
			const phaseFiles = node_fs.default.readdirSync(node_path.default.join(phasesDir, dir));
			const plans = phaseFiles.filter((f) => f.endsWith("-PLAN.md")).sort();
			const planNums = plans.map((p) => {
				const pm = p.match(/-(\d{2})-PLAN\.md$/);
				return pm ? parseInt(pm[1], 10) : null;
			}).filter((n) => n !== null);
			for (let i = 1; i < planNums.length; i++) if (planNums[i] !== planNums[i - 1] + 1) warnings.push(`Gap in plan numbering in ${dir}: plan ${planNums[i - 1]} → ${planNums[i]}`);
			const summaries = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md"));
			const planIdsSet = new Set(plans.map((p) => p.replace("-PLAN.md", "")));
			const summaryIdsSet = new Set(summaries.map((s) => s.replace("-SUMMARY.md", "")));
			for (const sid of summaryIdsSet) if (!planIdsSet.has(sid)) warnings.push(`Summary ${sid}-SUMMARY.md in ${dir} has no matching PLAN.md`);
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		for (const dir of dirs) {
			const plans = node_fs.default.readdirSync(node_path.default.join(phasesDir, dir)).filter((f) => f.endsWith("-PLAN.md"));
			for (const plan of plans) if (!extractFrontmatter(node_fs.default.readFileSync(node_path.default.join(phasesDir, dir, plan), "utf-8")).wave) warnings.push(`${dir}/${plan}: missing 'wave' in frontmatter`);
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	const passed = errors.length === 0;
	output({
		passed,
		errors,
		warnings,
		warning_count: warnings.length
	}, raw, passed ? "passed" : "failed");
}
function cmdValidateHealth(cwd, options, raw) {
	const planningDir = node_path.default.join(cwd, ".planning");
	const projectPath = node_path.default.join(planningDir, "PROJECT.md");
	const roadmapPath = node_path.default.join(planningDir, "ROADMAP.md");
	const statePath = node_path.default.join(planningDir, "STATE.md");
	const configPath = node_path.default.join(planningDir, "config.json");
	const phasesDir = node_path.default.join(planningDir, "phases");
	const errors = [];
	const warnings = [];
	const info = [];
	const repairs = [];
	const addIssue = (severity, code, message, fix, repairable = false) => {
		const issue = {
			code,
			message,
			fix,
			repairable
		};
		if (severity === "error") errors.push(issue);
		else if (severity === "warning") warnings.push(issue);
		else info.push(issue);
	};
	if (!node_fs.default.existsSync(planningDir)) {
		addIssue("error", "E001", ".planning/ directory not found", "Run /maxsim:new-project to initialize");
		output({
			status: "broken",
			errors,
			warnings,
			info,
			repairable_count: 0
		}, raw);
		return;
	}
	if (!node_fs.default.existsSync(projectPath)) addIssue("error", "E002", "PROJECT.md not found", "Run /maxsim:new-project to create");
	else {
		const content = node_fs.default.readFileSync(projectPath, "utf-8");
		for (const section of [
			"## What This Is",
			"## Core Value",
			"## Requirements"
		]) if (!content.includes(section)) addIssue("warning", "W001", `PROJECT.md missing section: ${section}`, "Add section manually");
	}
	if (!node_fs.default.existsSync(roadmapPath)) addIssue("error", "E003", "ROADMAP.md not found", "Run /maxsim:new-milestone to create roadmap");
	if (!node_fs.default.existsSync(statePath)) {
		addIssue("error", "E004", "STATE.md not found", "Run /maxsim:health --repair to regenerate", true);
		repairs.push("regenerateState");
	} else {
		const phaseRefs = [...node_fs.default.readFileSync(statePath, "utf-8").matchAll(/[Pp]hase\s+(\d+(?:\.\d+)?)/g)].map((m) => m[1]);
		const diskPhases = /* @__PURE__ */ new Set();
		try {
			const entries = node_fs.default.readdirSync(phasesDir, { withFileTypes: true });
			for (const e of entries) if (e.isDirectory()) {
				const dm = e.name.match(/^(\d+(?:\.\d+)?)/);
				if (dm) diskPhases.add(dm[1]);
			}
		} catch (e) {
			if (process.env.MAXSIM_DEBUG) console.error(e);
		}
		for (const ref of phaseRefs) {
			const normalizedRef = String(parseInt(ref, 10)).padStart(2, "0");
			if (!diskPhases.has(ref) && !diskPhases.has(normalizedRef) && !diskPhases.has(String(parseInt(ref, 10)))) {
				if (diskPhases.size > 0) {
					addIssue("warning", "W002", `STATE.md references phase ${ref}, but only phases ${[...diskPhases].sort().join(", ")} exist`, "Run /maxsim:health --repair to regenerate STATE.md", true);
					if (!repairs.includes("regenerateState")) repairs.push("regenerateState");
				}
			}
		}
	}
	if (!node_fs.default.existsSync(configPath)) {
		addIssue("warning", "W003", "config.json not found", "Run /maxsim:health --repair to create with defaults", true);
		repairs.push("createConfig");
	} else try {
		const rawContent = node_fs.default.readFileSync(configPath, "utf-8");
		const parsed = JSON.parse(rawContent);
		const validProfiles = [
			"quality",
			"balanced",
			"budget",
			"tokenburner"
		];
		if (parsed.model_profile && !validProfiles.includes(parsed.model_profile)) addIssue("warning", "W004", `config.json: invalid model_profile "${parsed.model_profile}"`, `Valid values: ${validProfiles.join(", ")}`);
	} catch (thrown) {
		addIssue("error", "E005", `config.json: JSON parse error - ${thrown.message}`, "Run /maxsim:health --repair to reset to defaults", true);
		repairs.push("resetConfig");
	}
	try {
		const entries = node_fs.default.readdirSync(phasesDir, { withFileTypes: true });
		for (const e of entries) if (e.isDirectory() && !e.name.match(/^\d{2}(?:\.\d+)?-[\w-]+$/)) addIssue("warning", "W005", `Phase directory "${e.name}" doesn't follow NN-name format`, "Rename to match pattern (e.g., 01-setup)");
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	try {
		const entries = node_fs.default.readdirSync(phasesDir, { withFileTypes: true });
		for (const e of entries) {
			if (!e.isDirectory()) continue;
			const phaseFiles = node_fs.default.readdirSync(node_path.default.join(phasesDir, e.name));
			const plans = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md");
			const summaries = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md");
			const summaryBases = new Set(summaries.map((s) => s.replace("-SUMMARY.md", "").replace("SUMMARY.md", "")));
			for (const plan of plans) {
				const planBase = plan.replace("-PLAN.md", "").replace("PLAN.md", "");
				if (!summaryBases.has(planBase)) addIssue("info", "I001", `${e.name}/${plan} has no SUMMARY.md`, "May be in progress");
			}
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	if (node_fs.default.existsSync(roadmapPath)) {
		const roadmapContent = node_fs.default.readFileSync(roadmapPath, "utf-8");
		const roadmapPhases = /* @__PURE__ */ new Set();
		const phasePattern = getPhasePattern();
		let m;
		while ((m = phasePattern.exec(roadmapContent)) !== null) roadmapPhases.add(m[1]);
		const diskPhases = /* @__PURE__ */ new Set();
		try {
			const entries = node_fs.default.readdirSync(phasesDir, { withFileTypes: true });
			for (const e of entries) if (e.isDirectory()) {
				const dm = e.name.match(/^(\d+[A-Z]?(?:\.\d+)?)/i);
				if (dm) diskPhases.add(dm[1]);
			}
		} catch (e) {
			if (process.env.MAXSIM_DEBUG) console.error(e);
		}
		for (const p of roadmapPhases) {
			const padded = String(parseInt(p, 10)).padStart(2, "0");
			if (!diskPhases.has(p) && !diskPhases.has(padded)) addIssue("warning", "W006", `Phase ${p} in ROADMAP.md but no directory on disk`, "Create phase directory or remove from roadmap");
		}
		for (const p of diskPhases) {
			const unpadded = String(parseInt(p, 10));
			if (!roadmapPhases.has(p) && !roadmapPhases.has(unpadded)) addIssue("warning", "W007", `Phase ${p} exists on disk but not in ROADMAP.md`, "Add to roadmap or remove directory");
		}
	}
	const repairActions = [];
	if (options.repair && repairs.length > 0) for (const repair of repairs) try {
		switch (repair) {
			case "createConfig":
			case "resetConfig":
				node_fs.default.writeFileSync(configPath, JSON.stringify({
					model_profile: "balanced",
					commit_docs: true,
					search_gitignored: false,
					branching_strategy: "none",
					research: true,
					plan_checker: true,
					verifier: true,
					parallelization: true
				}, null, 2), "utf-8");
				repairActions.push({
					action: repair,
					success: true,
					path: "config.json"
				});
				break;
			case "regenerateState": {
				if (node_fs.default.existsSync(statePath)) {
					const backupPath = `${statePath}.bak-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
					node_fs.default.copyFileSync(statePath, backupPath);
					repairActions.push({
						action: "backupState",
						success: true,
						path: backupPath
					});
				}
				const milestone = getMilestoneInfo(cwd);
				let stateContent = `# Session State\n\n`;
				stateContent += `## Project Reference\n\n`;
				stateContent += `See: .planning/PROJECT.md\n\n`;
				stateContent += `## Position\n\n`;
				stateContent += `**Milestone:** ${milestone.version} ${milestone.name}\n`;
				stateContent += `**Current phase:** (determining...)\n`;
				stateContent += `**Status:** Resuming\n\n`;
				stateContent += `## Session Log\n\n`;
				stateContent += `- ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}: STATE.md regenerated by /maxsim:health --repair\n`;
				node_fs.default.writeFileSync(statePath, stateContent, "utf-8");
				repairActions.push({
					action: repair,
					success: true,
					path: "STATE.md"
				});
				break;
			}
		}
	} catch (thrown) {
		const repairErr = thrown;
		repairActions.push({
			action: repair,
			success: false,
			error: repairErr.message
		});
	}
	let status;
	if (errors.length > 0) status = "broken";
	else if (warnings.length > 0) status = "degraded";
	else status = "healthy";
	const repairableCount = errors.filter((e) => e.repairable).length + warnings.filter((w) => w.repairable).length;
	output({
		status,
		errors,
		warnings,
		info,
		repairable_count: repairableCount,
		repairs_performed: repairActions.length > 0 ? repairActions : void 0
	}, raw);
}

//#endregion
//#region src/core/phase.ts
/**
* Phase — Phase CRUD, query, and lifecycle operations
*
* Ported from maxsim/bin/lib/phase.cjs
*/
function cmdPhasesList(cwd, options, raw) {
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const { type, phase, includeArchived } = options;
	if (!node_fs.default.existsSync(phasesDir)) {
		if (type) output({
			files: [],
			count: 0
		}, raw, "");
		else output({
			directories: [],
			count: 0
		}, raw, "");
		return;
	}
	try {
		let dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		if (includeArchived) {
			const archived = getArchivedPhaseDirs(cwd);
			for (const a of archived) dirs.push(`${a.name} [${a.milestone}]`);
		}
		dirs.sort((a, b) => comparePhaseNum(a, b));
		if (phase) {
			const normalized = normalizePhaseName(phase);
			const match = dirs.find((d) => d.startsWith(normalized));
			if (!match) {
				output({
					files: [],
					count: 0,
					phase_dir: null,
					error: "Phase not found"
				}, raw, "");
				return;
			}
			dirs = [match];
		}
		if (type) {
			const files = [];
			for (const dir of dirs) {
				const dirPath = node_path.default.join(phasesDir, dir);
				const dirFiles = node_fs.default.readdirSync(dirPath);
				let filtered;
				if (type === "plans") filtered = dirFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md");
				else if (type === "summaries") filtered = dirFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md");
				else filtered = dirFiles;
				files.push(...filtered.sort());
			}
			output({
				files,
				count: files.length,
				phase_dir: phase ? dirs[0].replace(/^\d+(?:\.\d+)?-?/, "") : null
			}, raw, files.join("\n"));
			return;
		}
		output({
			directories: dirs,
			count: dirs.length
		}, raw, dirs.join("\n"));
	} catch (e) {
		error("Failed to list phases: " + e.message);
	}
}
function cmdPhaseNextDecimal(cwd, basePhase, raw) {
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const normalized = normalizePhaseName(basePhase);
	if (!node_fs.default.existsSync(phasesDir)) {
		output({
			found: false,
			base_phase: normalized,
			next: `${normalized}.1`,
			existing: []
		}, raw, `${normalized}.1`);
		return;
	}
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		const baseExists = dirs.some((d) => d.startsWith(normalized + "-") || d === normalized);
		const decimalPattern = new RegExp(`^${normalized}\\.(\\d+)`);
		const existingDecimals = [];
		for (const dir of dirs) {
			const match = dir.match(decimalPattern);
			if (match) existingDecimals.push(`${normalized}.${match[1]}`);
		}
		existingDecimals.sort((a, b) => {
			return parseFloat(a) - parseFloat(b);
		});
		let nextDecimal;
		if (existingDecimals.length === 0) nextDecimal = `${normalized}.1`;
		else {
			const lastDecimal = existingDecimals[existingDecimals.length - 1];
			nextDecimal = `${normalized}.${parseInt(lastDecimal.split(".")[1], 10) + 1}`;
		}
		output({
			found: baseExists,
			base_phase: normalized,
			next: nextDecimal,
			existing: existingDecimals
		}, raw, nextDecimal);
	} catch (e) {
		error("Failed to calculate next decimal phase: " + e.message);
	}
}
function cmdFindPhase(cwd, phase, raw) {
	if (!phase) error("phase identifier required");
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const normalized = normalizePhaseName(phase);
	const notFound = {
		found: false,
		directory: null,
		phase_number: null,
		phase_name: null,
		plans: [],
		summaries: []
	};
	try {
		const match = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => comparePhaseNum(a, b)).find((d) => d.startsWith(normalized));
		if (!match) {
			output(notFound, raw, "");
			return;
		}
		const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
		const phaseNumber = dirMatch ? dirMatch[1] : normalized;
		const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
		const phaseDir = node_path.default.join(phasesDir, match);
		const phaseFiles = node_fs.default.readdirSync(phaseDir);
		const plans = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md").sort();
		const summaries = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md").sort();
		const result = {
			found: true,
			directory: node_path.default.join(".planning", "phases", match),
			phase_number: phaseNumber,
			phase_name: phaseName,
			plans,
			summaries
		};
		output(result, raw, result.directory);
	} catch {
		output(notFound, raw, "");
	}
}
function cmdPhasePlanIndex(cwd, phase, raw) {
	if (!phase) error("phase required for phase-plan-index");
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const normalized = normalizePhaseName(phase);
	let phaseDir = null;
	try {
		const match = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => comparePhaseNum(a, b)).find((d) => d.startsWith(normalized));
		if (match) phaseDir = node_path.default.join(phasesDir, match);
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	if (!phaseDir) {
		output({
			phase: normalized,
			error: "Phase not found",
			plans: [],
			waves: {},
			incomplete: [],
			has_checkpoints: false
		}, raw);
		return;
	}
	const phaseFiles = node_fs.default.readdirSync(phaseDir);
	const planFiles = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md").sort();
	const summaryFiles = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md");
	const completedPlanIds = new Set(summaryFiles.map((s) => s.replace("-SUMMARY.md", "").replace("SUMMARY.md", "")));
	const plans = [];
	const waves = {};
	const incomplete = [];
	let hasCheckpoints = false;
	for (const planFile of planFiles) {
		const planId = planFile.replace("-PLAN.md", "").replace("PLAN.md", "");
		const planPath = node_path.default.join(phaseDir, planFile);
		const content = node_fs.default.readFileSync(planPath, "utf-8");
		const fm = extractFrontmatter(content);
		const taskCount = (content.match(/##\s*Task\s*\d+/gi) || []).length;
		const wave = parseInt(fm.wave, 10) || 1;
		let autonomous = true;
		if (fm.autonomous !== void 0) autonomous = fm.autonomous === "true" || fm.autonomous === true;
		if (!autonomous) hasCheckpoints = true;
		let filesModified = [];
		if (fm["files-modified"]) filesModified = Array.isArray(fm["files-modified"]) ? fm["files-modified"] : [fm["files-modified"]];
		const hasSummary = completedPlanIds.has(planId);
		if (!hasSummary) incomplete.push(planId);
		const plan = {
			id: planId,
			wave,
			autonomous,
			objective: fm.objective || null,
			files_modified: filesModified,
			task_count: taskCount,
			has_summary: hasSummary
		};
		plans.push(plan);
		const waveKey = String(wave);
		if (!waves[waveKey]) waves[waveKey] = [];
		waves[waveKey].push(planId);
	}
	output({
		phase: normalized,
		plans,
		waves,
		incomplete,
		has_checkpoints: hasCheckpoints
	}, raw);
}
function cmdPhaseAdd(cwd, description, raw) {
	if (!description) error("description required for phase add");
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	if (!node_fs.default.existsSync(roadmapPath)) error("ROADMAP.md not found");
	const content = node_fs.default.readFileSync(roadmapPath, "utf-8");
	const slug = generateSlugInternal(description);
	const phasePattern = getPhasePattern();
	let maxPhase = 0;
	let m;
	while ((m = phasePattern.exec(content)) !== null) {
		const num = parseInt(m[1], 10);
		if (num > maxPhase) maxPhase = num;
	}
	const newPhaseNum = maxPhase + 1;
	const paddedNum = String(newPhaseNum).padStart(2, "0");
	const dirName = `${paddedNum}-${slug}`;
	const dirPath = node_path.default.join(cwd, ".planning", "phases", dirName);
	node_fs.default.mkdirSync(dirPath, { recursive: true });
	node_fs.default.writeFileSync(node_path.default.join(dirPath, ".gitkeep"), "");
	const phaseEntry = `\n### Phase ${newPhaseNum}: ${description}\n\n**Goal:** [To be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${maxPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${newPhaseNum} to break down)\n`;
	let updatedContent;
	const lastSeparator = content.lastIndexOf("\n---");
	if (lastSeparator > 0) updatedContent = content.slice(0, lastSeparator) + phaseEntry + content.slice(lastSeparator);
	else updatedContent = content + phaseEntry;
	node_fs.default.writeFileSync(roadmapPath, updatedContent, "utf-8");
	output({
		phase_number: newPhaseNum,
		padded: paddedNum,
		name: description,
		slug,
		directory: `.planning/phases/${dirName}`
	}, raw, paddedNum);
}
function cmdPhaseInsert(cwd, afterPhase, description, raw) {
	if (!afterPhase || !description) error("after-phase and description required for phase insert");
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	if (!node_fs.default.existsSync(roadmapPath)) error("ROADMAP.md not found");
	const content = node_fs.default.readFileSync(roadmapPath, "utf-8");
	const slug = generateSlugInternal(description);
	const afterPhaseEscaped = "0*" + normalizePhaseName(afterPhase).replace(/^0+/, "").replace(/\./g, "\\.");
	if (!getPhasePattern(afterPhaseEscaped, "i").test(content)) error(`Phase ${afterPhase} not found in ROADMAP.md`);
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const normalizedBase = normalizePhaseName(afterPhase);
	const existingDecimals = [];
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		const decimalPattern = new RegExp(`^${normalizedBase}\\.(\\d+)`);
		for (const dir of dirs) {
			const dm = dir.match(decimalPattern);
			if (dm) existingDecimals.push(parseInt(dm[1], 10));
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	const decimalPhase = `${normalizedBase}.${existingDecimals.length === 0 ? 1 : Math.max(...existingDecimals) + 1}`;
	const dirName = `${decimalPhase}-${slug}`;
	const dirPath = node_path.default.join(cwd, ".planning", "phases", dirName);
	node_fs.default.mkdirSync(dirPath, { recursive: true });
	node_fs.default.writeFileSync(node_path.default.join(dirPath, ".gitkeep"), "");
	const phaseEntry = `\n### Phase ${decimalPhase}: ${description} (INSERTED)\n\n**Goal:** [Urgent work - to be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${afterPhase}\n**Plans:** 0 plans\n\nPlans:\n- [ ] TBD (run /maxsim:plan-phase ${decimalPhase} to break down)\n`;
	const headerPattern = new RegExp(`(#{2,4}\\s*Phase\\s+0*${afterPhaseEscaped}:[^\\n]*\\n)`, "i");
	const headerMatch = content.match(headerPattern);
	if (!headerMatch) error(`Could not find Phase ${afterPhase} header`);
	const headerIdx = content.indexOf(headerMatch[0]);
	const nextPhaseMatch = content.slice(headerIdx + headerMatch[0].length).match(/\n#{2,4}\s+Phase\s+\d/i);
	let insertIdx;
	if (nextPhaseMatch) insertIdx = headerIdx + headerMatch[0].length + nextPhaseMatch.index;
	else insertIdx = content.length;
	const updatedContent = content.slice(0, insertIdx) + phaseEntry + content.slice(insertIdx);
	node_fs.default.writeFileSync(roadmapPath, updatedContent, "utf-8");
	output({
		phase_number: decimalPhase,
		after_phase: afterPhase,
		name: description,
		slug,
		directory: `.planning/phases/${dirName}`
	}, raw, decimalPhase);
}
function cmdPhaseRemove(cwd, targetPhase, options, raw) {
	if (!targetPhase) error("phase number required for phase remove");
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const force = options.force || false;
	if (!node_fs.default.existsSync(roadmapPath)) error("ROADMAP.md not found");
	const normalized = normalizePhaseName(targetPhase);
	const isDecimal = targetPhase.includes(".");
	let targetDir = null;
	try {
		targetDir = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => comparePhaseNum(a, b)).find((d) => d.startsWith(normalized + "-") || d === normalized) || null;
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	if (targetDir && !force) {
		const targetPath = node_path.default.join(phasesDir, targetDir);
		const summaries = node_fs.default.readdirSync(targetPath).filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md");
		if (summaries.length > 0) error(`Phase ${targetPhase} has ${summaries.length} executed plan(s). Use --force to remove anyway.`);
	}
	if (targetDir) node_fs.default.rmSync(node_path.default.join(phasesDir, targetDir), {
		recursive: true,
		force: true
	});
	const renamedDirs = [];
	const renamedFiles = [];
	if (isDecimal) {
		const baseParts = normalized.split(".");
		const baseInt = baseParts[0];
		const removedDecimal = parseInt(baseParts[1], 10);
		try {
			const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => comparePhaseNum(a, b));
			const decPattern = new RegExp(`^${baseInt}\\.(\\d+)-(.+)$`);
			const toRename = [];
			for (const dir of dirs) {
				const dm = dir.match(decPattern);
				if (dm && parseInt(dm[1], 10) > removedDecimal) toRename.push({
					dir,
					oldDecimal: parseInt(dm[1], 10),
					slug: dm[2]
				});
			}
			toRename.sort((a, b) => b.oldDecimal - a.oldDecimal);
			for (const item of toRename) {
				const newDecimal = item.oldDecimal - 1;
				const oldPhaseId = `${baseInt}.${item.oldDecimal}`;
				const newPhaseId = `${baseInt}.${newDecimal}`;
				const newDirName = `${baseInt}.${newDecimal}-${item.slug}`;
				node_fs.default.renameSync(node_path.default.join(phasesDir, item.dir), node_path.default.join(phasesDir, newDirName));
				renamedDirs.push({
					from: item.dir,
					to: newDirName
				});
				const dirFiles = node_fs.default.readdirSync(node_path.default.join(phasesDir, newDirName));
				for (const f of dirFiles) if (f.includes(oldPhaseId)) {
					const newFileName = f.replace(oldPhaseId, newPhaseId);
					node_fs.default.renameSync(node_path.default.join(phasesDir, newDirName, f), node_path.default.join(phasesDir, newDirName, newFileName));
					renamedFiles.push({
						from: f,
						to: newFileName
					});
				}
			}
		} catch (e) {
			if (process.env.MAXSIM_DEBUG) console.error(e);
		}
	} else {
		const removedInt = parseInt(normalized, 10);
		try {
			const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => comparePhaseNum(a, b));
			const toRename = [];
			for (const dir of dirs) {
				const dm = dir.match(/^(\d+)([A-Z])?(?:\.(\d+))?-(.+)$/i);
				if (!dm) continue;
				const dirInt = parseInt(dm[1], 10);
				if (dirInt > removedInt) toRename.push({
					dir,
					oldInt: dirInt,
					letter: dm[2] ? dm[2].toUpperCase() : "",
					decimal: dm[3] ? parseInt(dm[3], 10) : null,
					slug: dm[4]
				});
			}
			toRename.sort((a, b) => {
				if (a.oldInt !== b.oldInt) return b.oldInt - a.oldInt;
				return (b.decimal || 0) - (a.decimal || 0);
			});
			for (const item of toRename) {
				const newInt = item.oldInt - 1;
				const newPadded = String(newInt).padStart(2, "0");
				const oldPadded = String(item.oldInt).padStart(2, "0");
				const letterSuffix = item.letter || "";
				const decimalSuffix = item.decimal !== null ? `.${item.decimal}` : "";
				const oldPrefix = `${oldPadded}${letterSuffix}${decimalSuffix}`;
				const newPrefix = `${newPadded}${letterSuffix}${decimalSuffix}`;
				const newDirName = `${newPrefix}-${item.slug}`;
				node_fs.default.renameSync(node_path.default.join(phasesDir, item.dir), node_path.default.join(phasesDir, newDirName));
				renamedDirs.push({
					from: item.dir,
					to: newDirName
				});
				const dirFiles = node_fs.default.readdirSync(node_path.default.join(phasesDir, newDirName));
				for (const f of dirFiles) if (f.startsWith(oldPrefix)) {
					const newFileName = newPrefix + f.slice(oldPrefix.length);
					node_fs.default.renameSync(node_path.default.join(phasesDir, newDirName, f), node_path.default.join(phasesDir, newDirName, newFileName));
					renamedFiles.push({
						from: f,
						to: newFileName
					});
				}
			}
		} catch (e) {
			if (process.env.MAXSIM_DEBUG) console.error(e);
		}
	}
	let roadmapContent = node_fs.default.readFileSync(roadmapPath, "utf-8");
	const targetEscaped = targetPhase.replace(/\./g, "\\.");
	const sectionPattern = new RegExp(`\\n?#{2,4}\\s*Phase\\s+${targetEscaped}\\s*:[\\s\\S]*?(?=\\n#{2,4}\\s+Phase\\s+\\d|$)`, "i");
	roadmapContent = roadmapContent.replace(sectionPattern, "");
	const checkboxPattern = new RegExp(`\\n?-\\s*\\[[ x]\\]\\s*.*Phase\\s+${targetEscaped}[:\\s][^\\n]*`, "gi");
	roadmapContent = roadmapContent.replace(checkboxPattern, "");
	const tableRowPattern = new RegExp(`\\n?\\|\\s*${targetEscaped}\\.?\\s[^|]*\\|[^\\n]*`, "gi");
	roadmapContent = roadmapContent.replace(tableRowPattern, "");
	if (!isDecimal) {
		const removedInt = parseInt(normalized, 10);
		for (let oldNum = 99; oldNum > removedInt; oldNum--) {
			const newNum = oldNum - 1;
			const oldStr = String(oldNum);
			const newStr = String(newNum);
			const oldPad = oldStr.padStart(2, "0");
			const newPad = newStr.padStart(2, "0");
			roadmapContent = roadmapContent.replace(new RegExp(`(#{2,4}\\s*Phase\\s+)${oldStr}(\\s*:)`, "gi"), `$1${newStr}$2`);
			roadmapContent = roadmapContent.replace(new RegExp(`(Phase\\s+)${oldStr}([:\\s])`, "g"), `$1${newStr}$2`);
			roadmapContent = roadmapContent.replace(new RegExp(`${oldPad}-(\\d{2})`, "g"), `${newPad}-$1`);
			roadmapContent = roadmapContent.replace(new RegExp(`(\\|\\s*)${oldStr}\\.\\s`, "g"), `$1${newStr}. `);
			roadmapContent = roadmapContent.replace(new RegExp(`(Depends on:\\*\\*\\s*Phase\\s+)${oldStr}\\b`, "gi"), `$1${newStr}`);
		}
	}
	node_fs.default.writeFileSync(roadmapPath, roadmapContent, "utf-8");
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	if (node_fs.default.existsSync(statePath)) {
		let stateContent = node_fs.default.readFileSync(statePath, "utf-8");
		const totalPattern = /(\*\*Total Phases:\*\*\s*)(\d+)/;
		const totalMatch = stateContent.match(totalPattern);
		if (totalMatch) {
			const oldTotal = parseInt(totalMatch[2], 10);
			stateContent = stateContent.replace(totalPattern, `$1${oldTotal - 1}`);
		}
		const ofPattern = /(\bof\s+)(\d+)(\s*(?:\(|phases?))/i;
		const ofMatch = stateContent.match(ofPattern);
		if (ofMatch) {
			const oldTotal = parseInt(ofMatch[2], 10);
			stateContent = stateContent.replace(ofPattern, `$1${oldTotal - 1}$3`);
		}
		node_fs.default.writeFileSync(statePath, stateContent, "utf-8");
	}
	output({
		removed: targetPhase,
		directory_deleted: targetDir || null,
		renamed_directories: renamedDirs,
		renamed_files: renamedFiles,
		roadmap_updated: true,
		state_updated: node_fs.default.existsSync(statePath)
	}, raw);
}
function cmdPhaseComplete(cwd, phaseNum, raw) {
	if (!phaseNum) error("phase number required for phase complete");
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	const statePath = node_path.default.join(cwd, ".planning", "STATE.md");
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	normalizePhaseName(phaseNum);
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const phaseInfo = findPhaseInternal(cwd, phaseNum);
	if (!phaseInfo) error(`Phase ${phaseNum} not found`);
	const planCount = phaseInfo.plans.length;
	const summaryCount = phaseInfo.summaries.length;
	if (node_fs.default.existsSync(roadmapPath)) {
		let roadmapContent = node_fs.default.readFileSync(roadmapPath, "utf-8");
		const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phaseNum.replace(".", "\\.")}[:\\s][^\\n]*)`, "i");
		roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);
		const phaseEscaped = phaseNum.replace(".", "\\.");
		const tablePattern = new RegExp(`(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|[^|]*\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`, "i");
		roadmapContent = roadmapContent.replace(tablePattern, `$1 Complete    $2 ${today} $3`);
		const planCountPattern = new RegExp(`(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`, "i");
		roadmapContent = roadmapContent.replace(planCountPattern, `$1${summaryCount}/${planCount} plans complete`);
		node_fs.default.writeFileSync(roadmapPath, roadmapContent, "utf-8");
		const reqPath = node_path.default.join(cwd, ".planning", "REQUIREMENTS.md");
		if (node_fs.default.existsSync(reqPath)) {
			const reqMatch = roadmapContent.match(new RegExp(`Phase\\s+${phaseNum.replace(".", "\\.")}[\\s\\S]*?\\*\\*Requirements:\\*\\*\\s*([^\\n]+)`, "i"));
			if (reqMatch) {
				const reqIds = reqMatch[1].replace(/[\[\]]/g, "").split(/[,\s]+/).map((r) => r.trim()).filter(Boolean);
				let reqContent = node_fs.default.readFileSync(reqPath, "utf-8");
				for (const reqId of reqIds) {
					reqContent = reqContent.replace(new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqId}\\*\\*)`, "gi"), "$1x$2");
					reqContent = reqContent.replace(new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, "gi"), "$1 Complete $2");
				}
				node_fs.default.writeFileSync(reqPath, reqContent, "utf-8");
			}
		}
	}
	let nextPhaseNum = null;
	let nextPhaseName = null;
	let isLastPhase = true;
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => comparePhaseNum(a, b));
		for (const dir of dirs) {
			const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
			if (dm) {
				if (comparePhaseNum(dm[1], phaseNum) > 0) {
					nextPhaseNum = dm[1];
					nextPhaseName = dm[2] || null;
					isLastPhase = false;
					break;
				}
			}
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	if (node_fs.default.existsSync(statePath)) {
		let stateContent = node_fs.default.readFileSync(statePath, "utf-8");
		stateContent = stateContent.replace(/(\*\*Current Phase:\*\*\s*).*/, `$1${nextPhaseNum || phaseNum}`);
		if (nextPhaseName) stateContent = stateContent.replace(/(\*\*Current Phase Name:\*\*\s*).*/, `$1${nextPhaseName.replace(/-/g, " ")}`);
		stateContent = stateContent.replace(/(\*\*Status:\*\*\s*).*/, `$1${isLastPhase ? "Milestone complete" : "Ready to plan"}`);
		stateContent = stateContent.replace(/(\*\*Current Plan:\*\*\s*).*/, `$1Not started`);
		stateContent = stateContent.replace(/(\*\*Last Activity:\*\*\s*).*/, `$1${today}`);
		stateContent = stateContent.replace(/(\*\*Last Activity Description:\*\*\s*).*/, `$1Phase ${phaseNum} complete${nextPhaseNum ? `, transitioned to Phase ${nextPhaseNum}` : ""}`);
		node_fs.default.writeFileSync(statePath, stateContent, "utf-8");
	}
	output({
		completed_phase: phaseNum,
		phase_name: phaseInfo.phase_name,
		plans_executed: `${summaryCount}/${planCount}`,
		next_phase: nextPhaseNum,
		next_phase_name: nextPhaseName,
		is_last_phase: isLastPhase,
		date: today,
		roadmap_updated: node_fs.default.existsSync(roadmapPath),
		state_updated: node_fs.default.existsSync(statePath)
	}, raw);
}

//#endregion
//#region src/core/template.ts
/**
* Template — Template selection and fill operations
*
* Ported from maxsim/bin/lib/template.cjs
*/
function cmdTemplateSelect(cwd, planPath, raw) {
	if (!planPath) error("plan-path required");
	try {
		const fullPath = node_path.default.join(cwd, planPath);
		const content = node_fs.default.readFileSync(fullPath, "utf-8");
		const taskCount = (content.match(/###\s*Task\s*\d+/g) || []).length;
		const hasDecisions = (content.match(/decision/gi) || []).length > 0;
		const fileMentions = /* @__PURE__ */ new Set();
		const filePattern = /`([^`]+\.[a-zA-Z]+)`/g;
		let m;
		while ((m = filePattern.exec(content)) !== null) if (m[1].includes("/") && !m[1].startsWith("http")) fileMentions.add(m[1]);
		const fileCount = fileMentions.size;
		let template = "templates/summary-standard.md";
		let type = "standard";
		if (taskCount <= 2 && fileCount <= 3 && !hasDecisions) {
			template = "templates/summary-minimal.md";
			type = "minimal";
		} else if (hasDecisions || fileCount > 6 || taskCount > 5) {
			template = "templates/summary-complex.md";
			type = "complex";
		}
		output({
			template,
			type,
			taskCount,
			fileCount,
			hasDecisions
		}, raw, template);
	} catch (thrown) {
		output({
			template: "templates/summary-standard.md",
			type: "standard",
			error: thrown.message
		}, raw, "templates/summary-standard.md");
	}
}
function cmdTemplateFill(cwd, templateType, options, raw) {
	if (!templateType) error("template type required: summary, plan, or verification");
	if (!options.phase) error("--phase required");
	const phaseInfo = findPhaseInternal(cwd, options.phase);
	if (!phaseInfo) {
		output({
			error: "Phase not found",
			phase: options.phase
		}, raw);
		return;
	}
	const padded = normalizePhaseName(options.phase);
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const phaseName = options.name || phaseInfo.phase_name || "Unnamed";
	const phaseId = `${padded}-${phaseInfo.phase_slug || generateSlugInternal(phaseName)}`;
	const planNum = (options.plan || "01").padStart(2, "0");
	const fields = options.fields || {};
	let frontmatter;
	let body;
	let fileName;
	switch (templateType) {
		case "summary":
			frontmatter = {
				phase: phaseId,
				plan: planNum,
				subsystem: "[primary category]",
				tags: [],
				provides: [],
				affects: [],
				"tech-stack": {
					added: [],
					patterns: []
				},
				"key-files": {
					created: [],
					modified: []
				},
				"key-decisions": [],
				"patterns-established": [],
				duration: "[X]min",
				completed: today,
				...fields
			};
			body = [
				`# Phase ${options.phase}: ${phaseName} Summary`,
				"",
				"**[Substantive one-liner describing outcome]**",
				"",
				"## Performance",
				"- **Duration:** [time]",
				"- **Tasks:** [count completed]",
				"- **Files modified:** [count]",
				"",
				"## Accomplishments",
				"- [Key outcome 1]",
				"- [Key outcome 2]",
				"",
				"## Task Commits",
				"1. **Task 1: [task name]** - `hash`",
				"",
				"## Files Created/Modified",
				"- `path/to/file.ts` - What it does",
				"",
				"## Decisions & Deviations",
				"[Key decisions or \"None - followed plan as specified\"]",
				"",
				"## Next Phase Readiness",
				"[What's ready for next phase]"
			].join("\n");
			fileName = `${padded}-${planNum}-SUMMARY.md`;
			break;
		case "plan":
			frontmatter = {
				phase: phaseId,
				plan: planNum,
				type: options.type || "execute",
				wave: parseInt(options.wave || "1") || 1,
				depends_on: [],
				files_modified: [],
				autonomous: true,
				user_setup: [],
				must_haves: {
					truths: [],
					artifacts: [],
					key_links: []
				},
				...fields
			};
			body = [
				`# Phase ${options.phase} Plan ${planNum}: [Title]`,
				"",
				"## Objective",
				"- **What:** [What this plan builds]",
				"- **Why:** [Why it matters for the phase goal]",
				"- **Output:** [Concrete deliverable]",
				"",
				"## Context",
				"@.planning/PROJECT.md",
				"@.planning/ROADMAP.md",
				"@.planning/STATE.md",
				"",
				"## Tasks",
				"",
				"<task type=\"code\">",
				"  <name>[Task name]</name>",
				"  <files>[file paths]</files>",
				"  <action>[What to do]</action>",
				"  <verify>[How to verify]</verify>",
				"  <done>[Definition of done]</done>",
				"</task>",
				"",
				"## Verification",
				"[How to verify this plan achieved its objective]",
				"",
				"## Success Criteria",
				"- [ ] [Criterion 1]",
				"- [ ] [Criterion 2]"
			].join("\n");
			fileName = `${padded}-${planNum}-PLAN.md`;
			break;
		case "verification":
			frontmatter = {
				phase: phaseId,
				verified: (/* @__PURE__ */ new Date()).toISOString(),
				status: "pending",
				score: "0/0 must-haves verified",
				...fields
			};
			body = [
				`# Phase ${options.phase}: ${phaseName} — Verification`,
				"",
				"## Observable Truths",
				"| # | Truth | Status | Evidence |",
				"|---|-------|--------|----------|",
				"| 1 | [Truth] | pending | |",
				"",
				"## Required Artifacts",
				"| Artifact | Expected | Status | Details |",
				"|----------|----------|--------|---------|",
				"| [path] | [what] | pending | |",
				"",
				"## Key Link Verification",
				"| From | To | Via | Status | Details |",
				"|------|----|----|--------|---------|",
				"| [source] | [target] | [connection] | pending | |",
				"",
				"## Requirements Coverage",
				"| Requirement | Status | Blocking Issue |",
				"|-------------|--------|----------------|",
				"| [req] | pending | |",
				"",
				"## Result",
				"[Pending verification]"
			].join("\n");
			fileName = `${padded}-VERIFICATION.md`;
			break;
		default:
			error(`Unknown template type: ${templateType}. Available: summary, plan, verification`);
			return;
	}
	const fullContent = `---\n${reconstructFrontmatter(frontmatter)}\n---\n\n${body}\n`;
	const outPath = node_path.default.join(cwd, phaseInfo.directory, fileName);
	if (node_fs.default.existsSync(outPath)) {
		output({
			error: "File already exists",
			path: node_path.default.relative(cwd, outPath)
		}, raw);
		return;
	}
	node_fs.default.writeFileSync(outPath, fullContent, "utf-8");
	const relPath = node_path.default.relative(cwd, outPath);
	output({
		created: true,
		path: relPath,
		template: templateType
	}, raw, relPath);
}

//#endregion
//#region src/core/init.ts
/**
* Init — Compound init commands for workflow bootstrapping
*
* Ported from maxsim/bin/lib/init.cjs
*/
function extractReqIds(cwd, phase) {
	const reqMatch = getRoadmapPhaseInternal(cwd, phase)?.section?.match(/^\*\*Requirements\*\*:[^\S\n]*([^\n]*)$/m);
	const reqExtracted = reqMatch ? reqMatch[1].replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean).join(", ") : null;
	return reqExtracted && reqExtracted !== "TBD" ? reqExtracted : null;
}
function scanPhaseArtifacts(cwd, phaseDirectory) {
	const result = {};
	const phaseDirFull = node_path.default.join(cwd, phaseDirectory);
	try {
		const files = node_fs.default.readdirSync(phaseDirFull);
		const contextFile = files.find((f) => f.endsWith("-CONTEXT.md") || f === "CONTEXT.md");
		if (contextFile) result.context_path = node_path.default.join(phaseDirectory, contextFile);
		const researchFile = files.find((f) => f.endsWith("-RESEARCH.md") || f === "RESEARCH.md");
		if (researchFile) result.research_path = node_path.default.join(phaseDirectory, researchFile);
		const verificationFile = files.find((f) => f.endsWith("-VERIFICATION.md") || f === "VERIFICATION.md");
		if (verificationFile) result.verification_path = node_path.default.join(phaseDirectory, verificationFile);
		const uatFile = files.find((f) => f.endsWith("-UAT.md") || f === "UAT.md");
		if (uatFile) result.uat_path = node_path.default.join(phaseDirectory, uatFile);
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	return result;
}
function cmdInitExecutePhase(cwd, phase, raw) {
	if (!phase) error("phase required for init execute-phase");
	const config = loadConfig(cwd);
	const phaseInfo = findPhaseInternal(cwd, phase);
	const milestone = getMilestoneInfo(cwd);
	const phase_req_ids = extractReqIds(cwd, phase);
	output({
		executor_model: resolveModelInternal(cwd, "maxsim-executor"),
		verifier_model: resolveModelInternal(cwd, "maxsim-verifier"),
		commit_docs: config.commit_docs,
		parallelization: config.parallelization,
		branching_strategy: config.branching_strategy,
		phase_branch_template: config.phase_branch_template,
		milestone_branch_template: config.milestone_branch_template,
		verifier_enabled: config.verifier,
		phase_found: !!phaseInfo,
		phase_dir: phaseInfo?.directory ?? null,
		phase_number: phaseInfo?.phase_number ?? null,
		phase_name: phaseInfo?.phase_name ?? null,
		phase_slug: phaseInfo?.phase_slug ?? null,
		phase_req_ids,
		plans: phaseInfo?.plans ?? [],
		summaries: phaseInfo?.summaries ?? [],
		incomplete_plans: phaseInfo?.incomplete_plans ?? [],
		plan_count: phaseInfo?.plans?.length ?? 0,
		incomplete_count: phaseInfo?.incomplete_plans?.length ?? 0,
		branch_name: config.branching_strategy === "phase" && phaseInfo ? config.phase_branch_template.replace("{phase}", phaseInfo.phase_number).replace("{slug}", phaseInfo.phase_slug || "phase") : config.branching_strategy === "milestone" ? config.milestone_branch_template.replace("{milestone}", milestone.version).replace("{slug}", generateSlugInternal(milestone.name) || "milestone") : null,
		milestone_version: milestone.version,
		milestone_name: milestone.name,
		milestone_slug: generateSlugInternal(milestone.name),
		state_exists: pathExistsInternal(cwd, ".planning/STATE.md"),
		roadmap_exists: pathExistsInternal(cwd, ".planning/ROADMAP.md"),
		config_exists: pathExistsInternal(cwd, ".planning/config.json"),
		state_path: ".planning/STATE.md",
		roadmap_path: ".planning/ROADMAP.md",
		config_path: ".planning/config.json"
	}, raw);
}
function cmdInitPlanPhase(cwd, phase, raw) {
	if (!phase) error("phase required for init plan-phase");
	const config = loadConfig(cwd);
	const phaseInfo = findPhaseInternal(cwd, phase);
	const phase_req_ids = extractReqIds(cwd, phase);
	const result = {
		researcher_model: resolveModelInternal(cwd, "maxsim-phase-researcher"),
		planner_model: resolveModelInternal(cwd, "maxsim-planner"),
		checker_model: resolveModelInternal(cwd, "maxsim-plan-checker"),
		research_enabled: config.research,
		plan_checker_enabled: config.plan_checker,
		nyquist_validation_enabled: false,
		commit_docs: config.commit_docs,
		phase_found: !!phaseInfo,
		phase_dir: phaseInfo?.directory ?? null,
		phase_number: phaseInfo?.phase_number ?? null,
		phase_name: phaseInfo?.phase_name ?? null,
		phase_slug: phaseInfo?.phase_slug ?? null,
		padded_phase: phaseInfo?.phase_number?.padStart(2, "0") ?? null,
		phase_req_ids,
		has_research: phaseInfo?.has_research ?? false,
		has_context: phaseInfo?.has_context ?? false,
		has_plans: (phaseInfo?.plans?.length ?? 0) > 0,
		plan_count: phaseInfo?.plans?.length ?? 0,
		planning_exists: pathExistsInternal(cwd, ".planning"),
		roadmap_exists: pathExistsInternal(cwd, ".planning/ROADMAP.md"),
		state_path: ".planning/STATE.md",
		roadmap_path: ".planning/ROADMAP.md",
		requirements_path: ".planning/REQUIREMENTS.md"
	};
	if (phaseInfo?.directory) {
		const artifacts = scanPhaseArtifacts(cwd, phaseInfo.directory);
		if (artifacts.context_path) result.context_path = artifacts.context_path;
		if (artifacts.research_path) result.research_path = artifacts.research_path;
		if (artifacts.verification_path) result.verification_path = artifacts.verification_path;
		if (artifacts.uat_path) result.uat_path = artifacts.uat_path;
	}
	output(result, raw);
}
function cmdInitNewProject(cwd, raw) {
	const config = loadConfig(cwd);
	const homedir = node_os.default.homedir();
	const braveKeyFile = node_path.default.join(homedir, ".maxsim", "brave_api_key");
	const hasBraveSearch = !!(process.env.BRAVE_API_KEY || node_fs.default.existsSync(braveKeyFile));
	let hasCode = false;
	let hasPackageFile = false;
	try {
		hasCode = (0, node_child_process.execSync)("find . -maxdepth 3 \\( -name \"*.ts\" -o -name \"*.js\" -o -name \"*.py\" -o -name \"*.go\" -o -name \"*.rs\" -o -name \"*.swift\" -o -name \"*.java\" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5", {
			cwd,
			encoding: "utf-8",
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		}).trim().length > 0;
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	hasPackageFile = pathExistsInternal(cwd, "package.json") || pathExistsInternal(cwd, "requirements.txt") || pathExistsInternal(cwd, "Cargo.toml") || pathExistsInternal(cwd, "go.mod") || pathExistsInternal(cwd, "Package.swift");
	output({
		researcher_model: resolveModelInternal(cwd, "maxsim-project-researcher"),
		synthesizer_model: resolveModelInternal(cwd, "maxsim-research-synthesizer"),
		roadmapper_model: resolveModelInternal(cwd, "maxsim-roadmapper"),
		commit_docs: config.commit_docs,
		project_exists: pathExistsInternal(cwd, ".planning/PROJECT.md"),
		has_codebase_map: pathExistsInternal(cwd, ".planning/codebase"),
		planning_exists: pathExistsInternal(cwd, ".planning"),
		has_existing_code: hasCode,
		has_package_file: hasPackageFile,
		is_brownfield: hasCode || hasPackageFile,
		needs_codebase_map: (hasCode || hasPackageFile) && !pathExistsInternal(cwd, ".planning/codebase"),
		has_git: pathExistsInternal(cwd, ".git"),
		brave_search_available: hasBraveSearch,
		project_path: ".planning/PROJECT.md"
	}, raw);
}
function cmdInitNewMilestone(cwd, raw) {
	const config = loadConfig(cwd);
	const milestone = getMilestoneInfo(cwd);
	output({
		researcher_model: resolveModelInternal(cwd, "maxsim-project-researcher"),
		synthesizer_model: resolveModelInternal(cwd, "maxsim-research-synthesizer"),
		roadmapper_model: resolveModelInternal(cwd, "maxsim-roadmapper"),
		commit_docs: config.commit_docs,
		research_enabled: config.research,
		current_milestone: milestone.version,
		current_milestone_name: milestone.name,
		project_exists: pathExistsInternal(cwd, ".planning/PROJECT.md"),
		roadmap_exists: pathExistsInternal(cwd, ".planning/ROADMAP.md"),
		state_exists: pathExistsInternal(cwd, ".planning/STATE.md"),
		project_path: ".planning/PROJECT.md",
		roadmap_path: ".planning/ROADMAP.md",
		state_path: ".planning/STATE.md"
	}, raw);
}
function cmdInitQuick(cwd, description, raw) {
	const config = loadConfig(cwd);
	const now = /* @__PURE__ */ new Date();
	const slug = description ? generateSlugInternal(description)?.substring(0, 40) ?? null : null;
	const quickDir = node_path.default.join(cwd, ".planning", "quick");
	let nextNum = 1;
	try {
		const existing = node_fs.default.readdirSync(quickDir).filter((f) => /^\d+-/.test(f)).map((f) => parseInt(f.split("-")[0], 10)).filter((n) => !isNaN(n));
		if (existing.length > 0) nextNum = Math.max(...existing) + 1;
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	output({
		planner_model: resolveModelInternal(cwd, "maxsim-planner"),
		executor_model: resolveModelInternal(cwd, "maxsim-executor"),
		checker_model: resolveModelInternal(cwd, "maxsim-plan-checker"),
		verifier_model: resolveModelInternal(cwd, "maxsim-verifier"),
		commit_docs: config.commit_docs,
		next_num: nextNum,
		slug,
		description: description ?? null,
		date: now.toISOString().split("T")[0],
		timestamp: now.toISOString(),
		quick_dir: ".planning/quick",
		task_dir: slug ? `.planning/quick/${nextNum}-${slug}` : null,
		roadmap_exists: pathExistsInternal(cwd, ".planning/ROADMAP.md"),
		planning_exists: pathExistsInternal(cwd, ".planning")
	}, raw);
}
function cmdInitResume(cwd, raw) {
	const config = loadConfig(cwd);
	let interruptedAgentId = null;
	try {
		interruptedAgentId = node_fs.default.readFileSync(node_path.default.join(cwd, ".planning", "current-agent-id.txt"), "utf-8").trim();
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	output({
		state_exists: pathExistsInternal(cwd, ".planning/STATE.md"),
		roadmap_exists: pathExistsInternal(cwd, ".planning/ROADMAP.md"),
		project_exists: pathExistsInternal(cwd, ".planning/PROJECT.md"),
		planning_exists: pathExistsInternal(cwd, ".planning"),
		state_path: ".planning/STATE.md",
		roadmap_path: ".planning/ROADMAP.md",
		project_path: ".planning/PROJECT.md",
		has_interrupted_agent: !!interruptedAgentId,
		interrupted_agent_id: interruptedAgentId,
		commit_docs: config.commit_docs
	}, raw);
}
function cmdInitVerifyWork(cwd, phase, raw) {
	if (!phase) error("phase required for init verify-work");
	const config = loadConfig(cwd);
	const phaseInfo = findPhaseInternal(cwd, phase);
	output({
		planner_model: resolveModelInternal(cwd, "maxsim-planner"),
		checker_model: resolveModelInternal(cwd, "maxsim-plan-checker"),
		commit_docs: config.commit_docs,
		phase_found: !!phaseInfo,
		phase_dir: phaseInfo?.directory ?? null,
		phase_number: phaseInfo?.phase_number ?? null,
		phase_name: phaseInfo?.phase_name ?? null,
		has_verification: phaseInfo?.has_verification ?? false
	}, raw);
}
function cmdInitPhaseOp(cwd, phase, raw) {
	const config = loadConfig(cwd);
	let phaseInfo = findPhaseInternal(cwd, phase ?? "");
	if (!phaseInfo) {
		const roadmapPhase = getRoadmapPhaseInternal(cwd, phase ?? "");
		if (roadmapPhase?.found) {
			const phaseName = roadmapPhase.phase_name;
			phaseInfo = {
				found: true,
				directory: "",
				phase_number: roadmapPhase.phase_number,
				phase_name: phaseName,
				phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : null,
				plans: [],
				summaries: [],
				incomplete_plans: [],
				has_research: false,
				has_context: false,
				has_verification: false
			};
		}
	}
	const result = {
		commit_docs: config.commit_docs,
		brave_search: config.brave_search,
		phase_found: !!phaseInfo,
		phase_dir: phaseInfo?.directory || null,
		phase_number: phaseInfo?.phase_number ?? null,
		phase_name: phaseInfo?.phase_name ?? null,
		phase_slug: phaseInfo?.phase_slug ?? null,
		padded_phase: phaseInfo?.phase_number?.padStart(2, "0") ?? null,
		has_research: phaseInfo?.has_research ?? false,
		has_context: phaseInfo?.has_context ?? false,
		has_plans: (phaseInfo?.plans?.length ?? 0) > 0,
		has_verification: phaseInfo?.has_verification ?? false,
		plan_count: phaseInfo?.plans?.length ?? 0,
		roadmap_exists: pathExistsInternal(cwd, ".planning/ROADMAP.md"),
		planning_exists: pathExistsInternal(cwd, ".planning"),
		state_path: ".planning/STATE.md",
		roadmap_path: ".planning/ROADMAP.md",
		requirements_path: ".planning/REQUIREMENTS.md"
	};
	if (phaseInfo?.directory) {
		const artifacts = scanPhaseArtifacts(cwd, phaseInfo.directory);
		if (artifacts.context_path) result.context_path = artifacts.context_path;
		if (artifacts.research_path) result.research_path = artifacts.research_path;
		if (artifacts.verification_path) result.verification_path = artifacts.verification_path;
		if (artifacts.uat_path) result.uat_path = artifacts.uat_path;
	}
	output(result, raw);
}
function cmdInitTodos(cwd, area, raw) {
	const config = loadConfig(cwd);
	const now = /* @__PURE__ */ new Date();
	const pendingDir = node_path.default.join(cwd, ".planning", "todos", "pending");
	let count = 0;
	const todos = [];
	try {
		const files = node_fs.default.readdirSync(pendingDir).filter((f) => f.endsWith(".md"));
		for (const file of files) try {
			const content = node_fs.default.readFileSync(node_path.default.join(pendingDir, file), "utf-8");
			const createdMatch = content.match(/^created:\s*(.+)$/m);
			const titleMatch = content.match(/^title:\s*(.+)$/m);
			const areaMatch = content.match(/^area:\s*(.+)$/m);
			const todoArea = areaMatch ? areaMatch[1].trim() : "general";
			if (area && todoArea !== area) continue;
			count++;
			todos.push({
				file,
				created: createdMatch ? createdMatch[1].trim() : "unknown",
				title: titleMatch ? titleMatch[1].trim() : "Untitled",
				area: todoArea,
				path: node_path.default.join(".planning", "todos", "pending", file)
			});
		} catch (e) {
			if (process.env.MAXSIM_DEBUG) console.error(e);
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	output({
		commit_docs: config.commit_docs,
		date: now.toISOString().split("T")[0],
		timestamp: now.toISOString(),
		todo_count: count,
		todos,
		area_filter: area ?? null,
		pending_dir: ".planning/todos/pending",
		completed_dir: ".planning/todos/completed",
		planning_exists: pathExistsInternal(cwd, ".planning"),
		todos_dir_exists: pathExistsInternal(cwd, ".planning/todos"),
		pending_dir_exists: pathExistsInternal(cwd, ".planning/todos/pending")
	}, raw);
}
function cmdInitMilestoneOp(cwd, raw) {
	const config = loadConfig(cwd);
	const milestone = getMilestoneInfo(cwd);
	let phaseCount = 0;
	let completedPhases = 0;
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		phaseCount = dirs.length;
		for (const dir of dirs) try {
			if (node_fs.default.readdirSync(node_path.default.join(phasesDir, dir)).some((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md")) completedPhases++;
		} catch (e) {
			if (process.env.MAXSIM_DEBUG) console.error(e);
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	const archiveDir = node_path.default.join(cwd, ".planning", "archive");
	let archivedMilestones = [];
	try {
		archivedMilestones = node_fs.default.readdirSync(archiveDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	output({
		commit_docs: config.commit_docs,
		milestone_version: milestone.version,
		milestone_name: milestone.name,
		milestone_slug: generateSlugInternal(milestone.name),
		phase_count: phaseCount,
		completed_phases: completedPhases,
		all_phases_complete: phaseCount > 0 && phaseCount === completedPhases,
		archived_milestones: archivedMilestones,
		archive_count: archivedMilestones.length,
		project_exists: pathExistsInternal(cwd, ".planning/PROJECT.md"),
		roadmap_exists: pathExistsInternal(cwd, ".planning/ROADMAP.md"),
		state_exists: pathExistsInternal(cwd, ".planning/STATE.md"),
		archive_exists: pathExistsInternal(cwd, ".planning/archive"),
		phases_dir_exists: pathExistsInternal(cwd, ".planning/phases")
	}, raw);
}
function cmdInitMapCodebase(cwd, raw) {
	const config = loadConfig(cwd);
	const codebaseDir = node_path.default.join(cwd, ".planning", "codebase");
	let existingMaps = [];
	try {
		existingMaps = node_fs.default.readdirSync(codebaseDir).filter((f) => f.endsWith(".md"));
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	output({
		mapper_model: resolveModelInternal(cwd, "maxsim-codebase-mapper"),
		commit_docs: config.commit_docs,
		search_gitignored: config.search_gitignored,
		parallelization: config.parallelization,
		codebase_dir: ".planning/codebase",
		existing_maps: existingMaps,
		has_maps: existingMaps.length > 0,
		planning_exists: pathExistsInternal(cwd, ".planning"),
		codebase_dir_exists: pathExistsInternal(cwd, ".planning/codebase")
	}, raw);
}
function cmdInitProgress(cwd, raw) {
	const config = loadConfig(cwd);
	const milestone = getMilestoneInfo(cwd);
	const phasesDir = node_path.default.join(cwd, ".planning", "phases");
	const phases = [];
	let currentPhase = null;
	let nextPhase = null;
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
		for (const dir of dirs) {
			const match = dir.match(/^(\d+(?:\.\d+)?)-?(.*)/);
			const phaseNumber = match ? match[1] : dir;
			const phaseName = match && match[2] ? match[2] : null;
			const phasePath = node_path.default.join(phasesDir, dir);
			const phaseFiles = node_fs.default.readdirSync(phasePath);
			const plans = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md");
			const summaries = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md");
			const hasResearch = phaseFiles.some((f) => f.endsWith("-RESEARCH.md") || f === "RESEARCH.md");
			const status = summaries.length >= plans.length && plans.length > 0 ? "complete" : plans.length > 0 ? "in_progress" : hasResearch ? "researched" : "pending";
			const phaseInfo = {
				number: phaseNumber,
				name: phaseName,
				directory: node_path.default.join(".planning", "phases", dir),
				status,
				plan_count: plans.length,
				summary_count: summaries.length,
				has_research: hasResearch
			};
			phases.push(phaseInfo);
			if (!currentPhase && (status === "in_progress" || status === "researched")) currentPhase = phaseInfo;
			if (!nextPhase && status === "pending") nextPhase = phaseInfo;
		}
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	let pausedAt = null;
	try {
		const pauseMatch = node_fs.default.readFileSync(node_path.default.join(cwd, ".planning", "STATE.md"), "utf-8").match(/\*\*Paused At:\*\*\s*(.+)/);
		if (pauseMatch) pausedAt = pauseMatch[1].trim();
	} catch (e) {
		if (process.env.MAXSIM_DEBUG) console.error(e);
	}
	output({
		executor_model: resolveModelInternal(cwd, "maxsim-executor"),
		planner_model: resolveModelInternal(cwd, "maxsim-planner"),
		commit_docs: config.commit_docs,
		milestone_version: milestone.version,
		milestone_name: milestone.name,
		phases,
		phase_count: phases.length,
		completed_count: phases.filter((p) => p.status === "complete").length,
		in_progress_count: phases.filter((p) => p.status === "in_progress").length,
		current_phase: currentPhase,
		next_phase: nextPhase,
		paused_at: pausedAt,
		has_work_in_progress: !!currentPhase,
		project_exists: pathExistsInternal(cwd, ".planning/PROJECT.md"),
		roadmap_exists: pathExistsInternal(cwd, ".planning/ROADMAP.md"),
		state_exists: pathExistsInternal(cwd, ".planning/STATE.md"),
		state_path: ".planning/STATE.md",
		roadmap_path: ".planning/ROADMAP.md",
		project_path: ".planning/PROJECT.md",
		config_path: ".planning/config.json"
	}, raw);
}

//#endregion
//#region src/cli.ts
/**
* MAXSIM Tools — CLI utility for MAXSIM workflow operations
*
* Usage: node maxsim-tools.cjs <command> [args] [--raw]
*/
/** Extract a single named flag's value from args */
function getFlag(args, flag) {
	const idx = args.indexOf(flag);
	return idx !== -1 ? args[idx + 1] ?? null : null;
}
/** Extract multiple named flags at once. Keys are flag names without -- prefix. */
function getFlags(args, ...flags) {
	const result = {};
	for (const flag of flags) {
		const idx = args.indexOf(`--${flag}`);
		result[flag] = idx !== -1 ? args[idx + 1] ?? null : null;
	}
	return result;
}
/** Check if a boolean flag is present */
function hasFlag(args, flag) {
	return args.includes(`--${flag}`);
}
const handleState = (args, cwd, raw) => {
	const sub = args[1];
	const handler = sub ? {
		"update": () => cmdStateUpdate(cwd, args[2], args[3]),
		"get": () => cmdStateGet(cwd, args[2], raw),
		"patch": () => {
			const patches = {};
			for (let i = 2; i < args.length; i += 2) {
				const key = args[i].replace(/^--/, "");
				const value = args[i + 1];
				if (key && value !== void 0) patches[key] = value;
			}
			cmdStatePatch(cwd, patches, raw);
		},
		"advance-plan": () => cmdStateAdvancePlan(cwd, raw),
		"record-metric": () => {
			const f = getFlags(args, "phase", "plan", "duration", "tasks", "files");
			cmdStateRecordMetric(cwd, {
				phase: f.phase ?? "",
				plan: f.plan ?? "",
				duration: f.duration ?? "",
				tasks: f.tasks ?? void 0,
				files: f.files ?? void 0
			}, raw);
		},
		"update-progress": () => cmdStateUpdateProgress(cwd, raw),
		"add-decision": () => {
			const f = getFlags(args, "phase", "summary", "summary-file", "rationale", "rationale-file");
			cmdStateAddDecision(cwd, {
				phase: f.phase ?? void 0,
				summary: f.summary ?? void 0,
				summary_file: f["summary-file"] ?? void 0,
				rationale: f.rationale ?? "",
				rationale_file: f["rationale-file"] ?? void 0
			}, raw);
		},
		"add-blocker": () => {
			const f = getFlags(args, "text", "text-file");
			cmdStateAddBlocker(cwd, {
				text: f.text ?? void 0,
				text_file: f["text-file"] ?? void 0
			}, raw);
		},
		"resolve-blocker": () => cmdStateResolveBlocker(cwd, getFlag(args, "--text"), raw),
		"record-session": () => {
			const f = getFlags(args, "stopped-at", "resume-file");
			cmdStateRecordSession(cwd, {
				stopped_at: f["stopped-at"] ?? void 0,
				resume_file: f["resume-file"] ?? "None"
			}, raw);
		}
	}[sub] : void 0;
	if (handler) return handler();
	cmdStateLoad(cwd, raw);
};
const handleTemplate = (args, cwd, raw) => {
	const sub = args[1];
	if (sub === "select") cmdTemplateSelect(cwd, args[2], raw);
	else if (sub === "fill") {
		const f = getFlags(args, "phase", "plan", "name", "type", "wave", "fields");
		cmdTemplateFill(cwd, args[2], {
			phase: f.phase ?? "",
			plan: f.plan ?? void 0,
			name: f.name ?? void 0,
			type: f.type ?? "execute",
			wave: f.wave ?? "1",
			fields: f.fields ? JSON.parse(f.fields) : {}
		}, raw);
	} else error("Unknown template subcommand. Available: select, fill");
};
const handleFrontmatter = (args, cwd, raw) => {
	const sub = args[1];
	const file = args[2];
	const handler = sub ? {
		"get": () => cmdFrontmatterGet(cwd, file, getFlag(args, "--field"), raw),
		"set": () => cmdFrontmatterSet(cwd, file, getFlag(args, "--field"), getFlag(args, "--value") ?? void 0, raw),
		"merge": () => cmdFrontmatterMerge(cwd, file, getFlag(args, "--data"), raw),
		"validate": () => cmdFrontmatterValidate(cwd, file, getFlag(args, "--schema"), raw)
	}[sub] : void 0;
	if (handler) return handler();
	error("Unknown frontmatter subcommand. Available: get, set, merge, validate");
};
const handleVerify = async (args, cwd, raw) => {
	const sub = args[1];
	const handler = sub ? {
		"plan-structure": () => cmdVerifyPlanStructure(cwd, args[2], raw),
		"phase-completeness": () => cmdVerifyPhaseCompleteness(cwd, args[2], raw),
		"references": () => cmdVerifyReferences(cwd, args[2], raw),
		"commits": () => cmdVerifyCommits(cwd, args.slice(2), raw),
		"artifacts": () => cmdVerifyArtifacts(cwd, args[2], raw),
		"key-links": () => cmdVerifyKeyLinks(cwd, args[2], raw)
	}[sub] : void 0;
	if (handler) return handler();
	error("Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links");
};
const handlePhases = (args, cwd, raw) => {
	if (args[1] === "list") {
		const f = getFlags(args, "type", "phase");
		cmdPhasesList(cwd, {
			type: f.type,
			phase: f.phase,
			includeArchived: hasFlag(args, "include-archived")
		}, raw);
	} else error("Unknown phases subcommand. Available: list");
};
const handleRoadmap = (args, cwd, raw) => {
	const sub = args[1];
	const handler = sub ? {
		"get-phase": () => cmdRoadmapGetPhase(cwd, args[2], raw),
		"analyze": () => cmdRoadmapAnalyze(cwd, raw),
		"update-plan-progress": () => cmdRoadmapUpdatePlanProgress(cwd, args[2], raw)
	}[sub] : void 0;
	if (handler) return handler();
	error("Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress");
};
const handlePhase = (args, cwd, raw) => {
	const sub = args[1];
	const handler = sub ? {
		"next-decimal": () => cmdPhaseNextDecimal(cwd, args[2], raw),
		"add": () => cmdPhaseAdd(cwd, args.slice(2).join(" "), raw),
		"insert": () => cmdPhaseInsert(cwd, args[2], args.slice(3).join(" "), raw),
		"remove": () => cmdPhaseRemove(cwd, args[2], { force: hasFlag(args, "force") }, raw),
		"complete": () => cmdPhaseComplete(cwd, args[2], raw)
	}[sub] : void 0;
	if (handler) return handler();
	error("Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete");
};
const handleMilestone = (args, cwd, raw) => {
	if (args[1] === "complete") {
		const nameIndex = args.indexOf("--name");
		let milestoneName = null;
		if (nameIndex !== -1) {
			const nameArgs = [];
			for (let i = nameIndex + 1; i < args.length; i++) {
				if (args[i].startsWith("--")) break;
				nameArgs.push(args[i]);
			}
			milestoneName = nameArgs.join(" ") || null;
		}
		cmdMilestoneComplete(cwd, args[2], {
			name: milestoneName ?? void 0,
			archivePhases: hasFlag(args, "archive-phases")
		}, raw);
	} else error("Unknown milestone subcommand. Available: complete");
};
const handleValidate = (args, cwd, raw) => {
	const sub = args[1];
	const handler = sub ? {
		"consistency": () => cmdValidateConsistency(cwd, raw),
		"health": () => cmdValidateHealth(cwd, { repair: hasFlag(args, "repair") }, raw)
	}[sub] : void 0;
	if (handler) return handler();
	error("Unknown validate subcommand. Available: consistency, health");
};
const handleInit = (args, cwd, raw) => {
	const workflow = args[1];
	const handler = workflow ? {
		"execute-phase": () => cmdInitExecutePhase(cwd, args[2], raw),
		"plan-phase": () => cmdInitPlanPhase(cwd, args[2], raw),
		"new-project": () => cmdInitNewProject(cwd, raw),
		"new-milestone": () => cmdInitNewMilestone(cwd, raw),
		"quick": () => cmdInitQuick(cwd, args.slice(2).join(" "), raw),
		"resume": () => cmdInitResume(cwd, raw),
		"verify-work": () => cmdInitVerifyWork(cwd, args[2], raw),
		"phase-op": () => cmdInitPhaseOp(cwd, args[2], raw),
		"todos": () => cmdInitTodos(cwd, args[2], raw),
		"milestone-op": () => cmdInitMilestoneOp(cwd, raw),
		"map-codebase": () => cmdInitMapCodebase(cwd, raw),
		"progress": () => cmdInitProgress(cwd, raw)
	}[workflow] : void 0;
	if (handler) return handler();
	error(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, progress`);
};
const COMMANDS = {
	"state": handleState,
	"resolve-model": (args, cwd, raw) => cmdResolveModel(cwd, args[1], raw),
	"find-phase": (args, cwd, raw) => cmdFindPhase(cwd, args[1], raw),
	"commit": async (args, cwd, raw) => {
		const files = args.indexOf("--files") !== -1 ? args.slice(args.indexOf("--files") + 1).filter((a) => !a.startsWith("--")) : [];
		await cmdCommit(cwd, args[1], files, raw, hasFlag(args, "amend"));
	},
	"verify-summary": async (args, cwd, raw) => {
		const countIndex = args.indexOf("--check-count");
		const checkCount = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 2;
		await cmdVerifySummary(cwd, args[1], checkCount, raw);
	},
	"template": handleTemplate,
	"frontmatter": handleFrontmatter,
	"verify": handleVerify,
	"generate-slug": (args, _cwd, raw) => cmdGenerateSlug(args[1], raw),
	"current-timestamp": (args, _cwd, raw) => cmdCurrentTimestamp(args[1] || "full", raw),
	"list-todos": (args, cwd, raw) => cmdListTodos(cwd, args[1], raw),
	"verify-path-exists": (args, cwd, raw) => cmdVerifyPathExists(cwd, args[1], raw),
	"config-ensure-section": (_args, cwd, raw) => cmdConfigEnsureSection(cwd, raw),
	"config-set": (args, cwd, raw) => cmdConfigSet(cwd, args[1], args[2], raw),
	"config-get": (args, cwd, raw) => cmdConfigGet(cwd, args[1], raw),
	"history-digest": (_args, cwd, raw) => cmdHistoryDigest(cwd, raw),
	"phases": handlePhases,
	"roadmap": handleRoadmap,
	"requirements": (args, cwd, raw) => {
		if (args[1] === "mark-complete") cmdRequirementsMarkComplete(cwd, args.slice(2), raw);
		else error("Unknown requirements subcommand. Available: mark-complete");
	},
	"phase": handlePhase,
	"milestone": handleMilestone,
	"validate": handleValidate,
	"progress": (args, cwd, raw) => cmdProgressRender(cwd, args[1] || "json", raw),
	"todo": (args, cwd, raw) => {
		if (args[1] === "complete") cmdTodoComplete(cwd, args[2], raw);
		else error("Unknown todo subcommand. Available: complete");
	},
	"scaffold": (args, cwd, raw) => {
		const f = getFlags(args, "phase", "name");
		cmdScaffold(cwd, args[1], {
			phase: f.phase,
			name: f.name ? args.slice(args.indexOf("--name") + 1).join(" ") : null
		}, raw);
	},
	"init": handleInit,
	"phase-plan-index": (args, cwd, raw) => cmdPhasePlanIndex(cwd, args[1], raw),
	"state-snapshot": (_args, cwd, raw) => cmdStateSnapshot(cwd, raw),
	"summary-extract": (args, cwd, raw) => {
		const fieldsIndex = args.indexOf("--fields");
		const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(",") : null;
		cmdSummaryExtract(cwd, args[1], fields, raw);
	},
	"websearch": async (args, _cwd, raw) => {
		const f = getFlags(args, "limit", "freshness");
		await cmdWebsearch(args[1], {
			limit: f.limit ? parseInt(f.limit, 10) : 10,
			freshness: f.freshness ?? void 0
		}, raw);
	},
	"dashboard": (args) => handleDashboard(args.slice(1))
};
async function main() {
	const args = process.argv.slice(2);
	let cwd = process.cwd();
	const cwdEqArg = args.find((arg) => arg.startsWith("--cwd="));
	const cwdIdx = args.indexOf("--cwd");
	if (cwdEqArg) {
		const value = cwdEqArg.slice(6).trim();
		if (!value) error("Missing value for --cwd");
		args.splice(args.indexOf(cwdEqArg), 1);
		cwd = node_path.resolve(value);
	} else if (cwdIdx !== -1) {
		const value = args[cwdIdx + 1];
		if (!value || value.startsWith("--")) error("Missing value for --cwd");
		args.splice(cwdIdx, 2);
		cwd = node_path.resolve(value);
	}
	if (!node_fs.existsSync(cwd) || !node_fs.statSync(cwd).isDirectory()) error(`Invalid --cwd: ${cwd}`);
	const rawIndex = args.indexOf("--raw");
	const raw = rawIndex !== -1;
	if (rawIndex !== -1) args.splice(rawIndex, 1);
	const command = args[0];
	if (!command) error(`Usage: maxsim-tools <command> [args] [--raw] [--cwd <path>]\nCommands: ${Object.keys(COMMANDS).join(", ")}`);
	const handler = COMMANDS[command];
	if (!handler) error(`Unknown command: ${command}`);
	await handler(args, cwd, raw);
}
/**
* Dashboard launch command.
*
* Spawns the dashboard as a detached subprocess with MAXSIM_PROJECT_CWD set.
* If the dashboard is already running (detected via /api/health), prints the URL.
* Supports --stop to kill a running instance.
*/
async function handleDashboard(args) {
	const DEFAULT_PORT = 3333;
	const PORT_RANGE_END = 3343;
	const HEALTH_TIMEOUT_MS = 1500;
	const networkMode = args.includes("--network");
	if (args.includes("--stop")) {
		for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) if (await checkHealth(port, HEALTH_TIMEOUT_MS)) {
			console.log(`Dashboard found on port ${port} — sending shutdown...`);
			console.log(`Dashboard at http://localhost:${port} is running.`);
			console.log(`To stop it, close the browser tab or kill the process on port ${port}.`);
			try {
				if (process.platform === "win32") {
					const lines = (0, node_child_process.execSync)(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: "utf-8" }).trim().split("\n");
					const pids = /* @__PURE__ */ new Set();
					for (const line of lines) {
						const parts = line.trim().split(/\s+/);
						const pid = parts[parts.length - 1];
						if (pid && pid !== "0") pids.add(pid);
					}
					for (const pid of pids) try {
						(0, node_child_process.execSync)(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
						console.log(`Killed process ${pid}`);
					} catch {}
				} else (0, node_child_process.execSync)(`lsof -i :${port} -t | xargs kill -SIGTERM 2>/dev/null`, { stdio: "ignore" });
				console.log("Dashboard stopped.");
			} catch {
				console.log("Could not automatically stop the dashboard. Kill the process manually.");
			}
			return;
		}
		console.log("No running dashboard found.");
		return;
	}
	for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) if (await checkHealth(port, HEALTH_TIMEOUT_MS)) {
		console.log(`Dashboard already running at http://localhost:${port}`);
		return;
	}
	const serverPath = resolveDashboardServer();
	if (!serverPath) {
		console.error("Could not find @maxsim/dashboard server entry point.");
		console.error("Ensure @maxsim/dashboard is installed and built.");
		process.exit(1);
	}
	const isTsFile = serverPath.endsWith(".ts");
	const runner = "node";
	const runnerArgs = isTsFile ? [
		"--import",
		"tsx",
		serverPath
	] : [serverPath];
	const serverDir = node_path.dirname(serverPath);
	let projectCwd = process.cwd();
	const dashboardConfigPath = node_path.join(node_path.dirname(serverDir), "dashboard.json");
	if (node_fs.existsSync(dashboardConfigPath)) try {
		const config = JSON.parse(node_fs.readFileSync(dashboardConfigPath, "utf8"));
		if (config.projectCwd) projectCwd = config.projectCwd;
	} catch {}
	const ptyModulePath = node_path.join(serverDir, "node_modules", "node-pty");
	if (!node_fs.existsSync(ptyModulePath)) {
		console.log("Installing node-pty for terminal support...");
		try {
			(0, node_child_process.execSync)("npm install node-pty --save-optional --no-audit --no-fund --loglevel=error", {
				cwd: serverDir,
				stdio: "inherit",
				timeout: 12e4
			});
		} catch {
			console.warn("node-pty installation failed — terminal will be unavailable.");
		}
	}
	console.log("Dashboard starting...");
	const child = (0, node_child_process.spawn)(runner, runnerArgs, {
		cwd: serverDir,
		detached: true,
		stdio: "ignore",
		env: {
			...process.env,
			MAXSIM_PROJECT_CWD: projectCwd,
			NODE_ENV: isTsFile ? "development" : "production",
			...networkMode ? { MAXSIM_NETWORK_MODE: "1" } : {}
		},
		...process.platform === "win32" ? { shell: true } : {}
	});
	child.unref();
	await new Promise((resolve) => setTimeout(resolve, 3e3));
	for (let port = DEFAULT_PORT; port <= PORT_RANGE_END; port++) if (await checkHealth(port, HEALTH_TIMEOUT_MS)) {
		console.log(`Dashboard ready at http://localhost:${port}`);
		return;
	}
	console.log(`Dashboard spawned (PID ${child.pid}). It may take a moment to start.`);
	console.log(`Check http://localhost:${DEFAULT_PORT} once ready.`);
}
/**
* Check if a dashboard health endpoint is responding on the given port.
*/
async function checkHealth(port, timeoutMs) {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		const res = await fetch(`http://localhost:${port}/api/health`, { signal: controller.signal });
		clearTimeout(timer);
		if (res.ok) return (await res.json()).status === "ok";
		return false;
	} catch {
		return false;
	}
}
/**
* Resolve the dashboard server entry point path.
* Tries: built server.js first, then source server.ts for dev mode.
*/
function resolveDashboardServer() {
	const localDashboard = node_path.join(process.cwd(), ".claude", "dashboard", "server.js");
	if (node_fs.existsSync(localDashboard)) return localDashboard;
	const globalDashboard = node_path.join(node_os.homedir(), ".claude", "dashboard", "server.js");
	if (node_fs.existsSync(globalDashboard)) return globalDashboard;
	try {
		const pkgPath = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href).resolve("@maxsim/dashboard/package.json");
		const pkgDir = node_path.dirname(pkgPath);
		const serverJs = node_path.join(pkgDir, "server.js");
		if (node_fs.existsSync(serverJs)) return serverJs;
		const serverTs = node_path.join(pkgDir, "server.ts");
		if (node_fs.existsSync(serverTs)) return serverTs;
	} catch {}
	try {
		let dir = node_path.dirname(new URL(require("url").pathToFileURL(__filename).href).pathname);
		if (process.platform === "win32" && dir.startsWith("/")) dir = dir.slice(1);
		for (let i = 0; i < 5; i++) {
			const candidate = node_path.join(dir, "packages", "dashboard", "server.ts");
			if (node_fs.existsSync(candidate)) return candidate;
			const candidateJs = node_path.join(dir, "packages", "dashboard", "server.js");
			if (node_fs.existsSync(candidateJs)) return candidateJs;
			dir = node_path.dirname(dir);
		}
	} catch {}
	return null;
}
main();

//#endregion
//# sourceMappingURL=cli.cjs.map