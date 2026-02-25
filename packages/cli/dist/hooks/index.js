"use strict";
/**
 * @maxsim/hooks — Re-exports for unit testing.
 * Do NOT import this module at runtime; hooks run as standalone CJS bundles.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatStatusline = exports.DEBOUNCE_CALLS = exports.STALE_SECONDS = exports.CRITICAL_THRESHOLD = exports.WARNING_THRESHOLD = exports.processContextMonitor = exports.checkForUpdate = void 0;
var maxsim_check_update_1 = require("./maxsim-check-update");
Object.defineProperty(exports, "checkForUpdate", { enumerable: true, get: function () { return maxsim_check_update_1.checkForUpdate; } });
var maxsim_context_monitor_1 = require("./maxsim-context-monitor");
Object.defineProperty(exports, "processContextMonitor", { enumerable: true, get: function () { return maxsim_context_monitor_1.processContextMonitor; } });
Object.defineProperty(exports, "WARNING_THRESHOLD", { enumerable: true, get: function () { return maxsim_context_monitor_1.WARNING_THRESHOLD; } });
Object.defineProperty(exports, "CRITICAL_THRESHOLD", { enumerable: true, get: function () { return maxsim_context_monitor_1.CRITICAL_THRESHOLD; } });
Object.defineProperty(exports, "STALE_SECONDS", { enumerable: true, get: function () { return maxsim_context_monitor_1.STALE_SECONDS; } });
Object.defineProperty(exports, "DEBOUNCE_CALLS", { enumerable: true, get: function () { return maxsim_context_monitor_1.DEBOUNCE_CALLS; } });
var maxsim_statusline_1 = require("./maxsim-statusline");
Object.defineProperty(exports, "formatStatusline", { enumerable: true, get: function () { return maxsim_statusline_1.formatStatusline; } });
//# sourceMappingURL=index.js.map