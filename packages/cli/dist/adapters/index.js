"use strict";
/**
 * @maxsim/adapters — Runtime adapter registry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSettings = exports.readSettings = exports.buildHookCommand = exports.processAttribution = exports.extractFrontmatterAndBody = exports.expandTilde = exports.installClaude = exports.claudeAdapter = void 0;
// Re-export adapters
var claude_js_1 = require("./claude.js");
Object.defineProperty(exports, "claudeAdapter", { enumerable: true, get: function () { return claude_js_1.claudeAdapter; } });
var claude_js_2 = require("./claude.js");
Object.defineProperty(exports, "installClaude", { enumerable: true, get: function () { return claude_js_2.installClaude; } });
// Re-export base utilities
var base_js_1 = require("./base.js");
Object.defineProperty(exports, "expandTilde", { enumerable: true, get: function () { return base_js_1.expandTilde; } });
Object.defineProperty(exports, "extractFrontmatterAndBody", { enumerable: true, get: function () { return base_js_1.extractFrontmatterAndBody; } });
Object.defineProperty(exports, "processAttribution", { enumerable: true, get: function () { return base_js_1.processAttribution; } });
Object.defineProperty(exports, "buildHookCommand", { enumerable: true, get: function () { return base_js_1.buildHookCommand; } });
Object.defineProperty(exports, "readSettings", { enumerable: true, get: function () { return base_js_1.readSettings; } });
Object.defineProperty(exports, "writeSettings", { enumerable: true, get: function () { return base_js_1.writeSettings; } });
//# sourceMappingURL=index.js.map