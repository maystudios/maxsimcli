//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_os = require("node:os");
node_os = __toESM(node_os);
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);

//#region src/base.ts
/**
* @maxsim/adapters — Shared base utilities extracted from bin/install.js
*/
/**
* Expand ~ to home directory (shell doesn't expand in env vars passed to node)
*/
function expandTilde(filePath) {
	if (filePath && filePath.startsWith("~/")) return node_path.join(node_os.homedir(), filePath.slice(2));
	return filePath;
}
/**
* Extract YAML frontmatter and body from markdown content.
* Returns null frontmatter if content doesn't start with ---.
*/
function extractFrontmatterAndBody(content) {
	if (!content.startsWith("---")) return {
		frontmatter: null,
		body: content
	};
	const endIndex = content.indexOf("---", 3);
	if (endIndex === -1) return {
		frontmatter: null,
		body: content
	};
	return {
		frontmatter: content.substring(3, endIndex).trim(),
		body: content.substring(endIndex + 3)
	};
}
/**
* Process Co-Authored-By lines based on attribution setting.
* @param content - File content to process
* @param attribution - null=remove, undefined=keep default, string=replace
*/
function processAttribution(content, attribution) {
	if (attribution === null) return content.replace(/(\r?\n){2}Co-Authored-By:.*$/gim, "");
	if (attribution === void 0) return content;
	const safeAttribution = attribution.replace(/\$/g, "$$$$");
	return content.replace(/Co-Authored-By:.*$/gim, `Co-Authored-By: ${safeAttribution}`);
}
/**
* Build a hook command path using forward slashes for cross-platform compatibility.
*/
function buildHookCommand(configDir, hookName) {
	return `node "${configDir.replace(/\\/g, "/") + "/hooks/" + hookName}"`;
}
/**
* Read and parse settings.json, returning empty object if it doesn't exist.
*/
function readSettings(settingsPath) {
	if (node_fs.existsSync(settingsPath)) try {
		return JSON.parse(node_fs.readFileSync(settingsPath, "utf8"));
	} catch {
		return {};
	}
	return {};
}
/**
* Write settings.json with proper formatting.
*/
function writeSettings(settingsPath, settings) {
	node_fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

//#endregion
Object.defineProperty(exports, '__toESM', {
  enumerable: true,
  get: function () {
    return __toESM;
  }
});
Object.defineProperty(exports, 'buildHookCommand', {
  enumerable: true,
  get: function () {
    return buildHookCommand;
  }
});
Object.defineProperty(exports, 'expandTilde', {
  enumerable: true,
  get: function () {
    return expandTilde;
  }
});
Object.defineProperty(exports, 'extractFrontmatterAndBody', {
  enumerable: true,
  get: function () {
    return extractFrontmatterAndBody;
  }
});
Object.defineProperty(exports, 'processAttribution', {
  enumerable: true,
  get: function () {
    return processAttribution;
  }
});
Object.defineProperty(exports, 'readSettings', {
  enumerable: true,
  get: function () {
    return readSettings;
  }
});
Object.defineProperty(exports, 'writeSettings', {
  enumerable: true,
  get: function () {
    return writeSettings;
  }
});
//# sourceMappingURL=base-BYHjQPHa.cjs.map