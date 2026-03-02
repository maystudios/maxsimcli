"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBackendPort = exports.isBackendRunning = exports.getBackendStatus = exports.stopBackend = exports.startBackend = exports.createBackendServer = void 0;
var server_js_1 = require("./server.js");
Object.defineProperty(exports, "createBackendServer", { enumerable: true, get: function () { return server_js_1.createBackendServer; } });
var lifecycle_js_1 = require("./lifecycle.js");
Object.defineProperty(exports, "startBackend", { enumerable: true, get: function () { return lifecycle_js_1.startBackend; } });
Object.defineProperty(exports, "stopBackend", { enumerable: true, get: function () { return lifecycle_js_1.stopBackend; } });
Object.defineProperty(exports, "getBackendStatus", { enumerable: true, get: function () { return lifecycle_js_1.getBackendStatus; } });
Object.defineProperty(exports, "isBackendRunning", { enumerable: true, get: function () { return lifecycle_js_1.isBackendRunning; } });
Object.defineProperty(exports, "findBackendPort", { enumerable: true, get: function () { return lifecycle_js_1.findBackendPort; } });
//# sourceMappingURL=index.js.map