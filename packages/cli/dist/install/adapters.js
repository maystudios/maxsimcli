"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitAttribution = getCommitAttribution;
const path = __importStar(require("node:path"));
const index_js_1 = require("../adapters/index.js");
const shared_js_1 = require("./shared.js");
// Cache for attribution settings (populated once per runtime during install)
const attributionCache = new Map();
/**
 * Get commit attribution setting for a runtime
 * @returns null = remove, undefined = keep default, string = custom
 */
function getCommitAttribution(runtime, explicitConfigDir) {
    if (attributionCache.has(runtime)) {
        return attributionCache.get(runtime);
    }
    let result;
    const settings = (0, index_js_1.readSettings)(path.join((0, shared_js_1.getGlobalDir)('claude', explicitConfigDir), 'settings.json'));
    const attr = settings.attribution;
    if (!attr || attr.commit === undefined) {
        result = undefined;
    }
    else if (attr.commit === '') {
        result = null;
    }
    else {
        result = attr.commit;
    }
    attributionCache.set(runtime, result);
    return result;
}
//# sourceMappingURL=adapters.js.map