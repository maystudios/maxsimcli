#!/usr/bin/env node
const require_cli = require('./cli.cjs');
let node_fs = require("node:fs");
node_fs = require_cli.__toESM(node_fs);
let node_path = require("node:path");
node_path = require_cli.__toESM(node_path);
let node_os = require("node:os");
node_os = require_cli.__toESM(node_os);
let node_http = require("node:http");
let express = require("express");
express = require_cli.__toESM(express);
let ws = require("ws");
let _modelcontextprotocol_sdk_server_mcp_js = require("@modelcontextprotocol/sdk/server/mcp.js");
let _modelcontextprotocol_sdk_server_streamableHttp_js = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
let detect_port = require("detect-port");
detect_port = require_cli.__toESM(detect_port);
let zod = require("zod");

//#region src/mcp/utils.ts
/**
* MCP Utilities — Shared helpers for MCP tools
*
* CRITICAL: Never import output() or error() from core — they call process.exit().
* CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
*/
/**
* Walk up from startDir to find a directory containing `.planning/`.
* Returns the directory containing `.planning/` or null if not found.
*/
let _cachedRoot;
function detectProjectRoot(startDir) {
	if (startDir === void 0 && _cachedRoot !== void 0) return _cachedRoot;
	let dir = startDir || process.cwd();
	for (let i = 0; i < 100; i++) {
		const planningDir = node_path.default.join(dir, ".planning");
		try {
			if (node_fs.default.statSync(planningDir).isDirectory()) {
				if (startDir === void 0) _cachedRoot = dir;
				return dir;
			}
		} catch {}
		const parent = node_path.default.dirname(dir);
		if (parent === dir) {
			if (startDir === void 0) _cachedRoot = null;
			return null;
		}
		dir = parent;
	}
	if (startDir === void 0) _cachedRoot = null;
	return null;
}
/**
* Return a structured MCP success response.
*/
function mcpSuccess(data, summary) {
	return { content: [{
		type: "text",
		text: JSON.stringify({
			success: true,
			data,
			summary
		}, null, 2)
	}] };
}
/**
* Return a structured MCP error response.
*/
function mcpError(error, summary) {
	return {
		content: [{
			type: "text",
			text: JSON.stringify({
				success: false,
				error,
				summary
			}, null, 2)
		}],
		isError: true
	};
}

//#endregion
//#region src/mcp/phase-tools.ts
/**
* Phase CRUD MCP Tools — Phase operations exposed as MCP tools
*
* CRITICAL: Never import output() or error() from core — they call process.exit().
* CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
* CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
*/
/**
* Register all phase CRUD tools on the MCP server.
*/
function registerPhaseTools(server) {
	server.tool("mcp_find_phase", "Find a phase directory by number or name. Returns phase details including plans, summaries, and status.", { phase: zod.z.string().describe("Phase number or name (e.g. \"01\", \"1\", \"01A\", \"1.1\")") }, async ({ phase }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const result = require_cli.findPhaseInternal(cwd, phase);
			if (!result) return mcpError(`Phase ${phase} not found`, "Phase not found");
			return mcpSuccess({
				found: result.found,
				directory: result.directory,
				phase_number: result.phase_number,
				phase_name: result.phase_name,
				phase_slug: result.phase_slug,
				plans: result.plans,
				summaries: result.summaries,
				incomplete_plans: result.incomplete_plans,
				has_research: result.has_research,
				has_context: result.has_context,
				has_verification: result.has_verification,
				archived: result.archived ?? null
			}, `Found phase ${result.phase_number}: ${result.phase_name ?? "unnamed"}`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_list_phases", "List all phase directories, sorted correctly. Optionally include archived phases from milestones.", { include_archived: zod.z.boolean().optional().default(false).describe("Include archived phases from completed milestones") }, async ({ include_archived }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const phasesDir = require_cli.phasesPath(cwd);
			if (!node_fs.default.existsSync(phasesDir)) return mcpSuccess({
				directories: [],
				count: 0
			}, "No phases directory found");
			let dirs = require_cli.listSubDirs(phasesDir);
			if (include_archived) {
				const archived = require_cli.getArchivedPhaseDirs(cwd);
				for (const a of archived) dirs.push(`${a.name} [${a.milestone}]`);
			}
			dirs.sort((a, b) => require_cli.comparePhaseNum(a, b));
			return mcpSuccess({
				directories: dirs,
				count: dirs.length
			}, `Found ${dirs.length} phase(s)`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_create_phase", "Create a new phase. Adds the next sequential phase directory and appends to ROADMAP.md.", { name: zod.z.string().describe("Phase description/name (e.g. \"Authentication System\")") }, async ({ name }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			if (!name || !name.trim()) return mcpError("Phase name must not be empty", "Validation failed");
			const result = require_cli.phaseAddCore(cwd, name, { includeStubs: true });
			return mcpSuccess({
				phase_number: result.phase_number,
				padded: result.padded,
				name: result.description,
				slug: result.slug,
				directory: result.directory
			}, `Created Phase ${result.phase_number}: ${result.description}`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_insert_phase", "Insert a decimal phase after a specified phase (e.g. 01.1 after 01). Creates directory and updates ROADMAP.md.", {
		name: zod.z.string().describe("Phase description/name"),
		after: zod.z.string().describe("Phase number to insert after (e.g. \"01\", \"1\")")
	}, async ({ name, after }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			if (!name || !name.trim()) return mcpError("Phase name must not be empty", "Validation failed");
			const result = require_cli.phaseInsertCore(cwd, after, name, { includeStubs: true });
			return mcpSuccess({
				phase_number: result.phase_number,
				after_phase: result.after_phase,
				name: result.description,
				slug: result.slug,
				directory: result.directory
			}, `Inserted Phase ${result.phase_number}: ${result.description} after Phase ${result.after_phase}`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_complete_phase", "Mark a phase as complete. Updates ROADMAP.md checkbox, progress table, plan count, STATE.md, and REQUIREMENTS.md.", { phase: zod.z.string().describe("Phase number to complete (e.g. \"01\", \"1\", \"1.1\")") }, async ({ phase }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const result = require_cli.phaseCompleteCore(cwd, phase);
			return mcpSuccess({
				completed_phase: result.completed_phase,
				phase_name: result.phase_name,
				plans_executed: result.plans_executed,
				next_phase: result.next_phase,
				next_phase_name: result.next_phase_name,
				is_last_phase: result.is_last_phase,
				date: result.date,
				roadmap_updated: result.roadmap_updated,
				state_updated: result.state_updated
			}, `Phase ${phase} marked as complete${result.next_phase ? `, next: Phase ${result.next_phase}` : ""}`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
}

//#endregion
//#region src/mcp/todo-tools.ts
/**
* Todo CRUD MCP Tools — Todo operations exposed as MCP tools
*
* CRITICAL: Never import output() or error() from core — they call process.exit().
* CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
* CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
*/
/**
* Register all todo CRUD tools on the MCP server.
*/
function registerTodoTools(server) {
	server.tool("mcp_add_todo", "Create a new todo item in .planning/todos/pending/ with frontmatter metadata.", {
		title: zod.z.string().describe("Title of the todo item"),
		description: zod.z.string().optional().describe("Optional description body"),
		area: zod.z.string().optional().default("general").describe("Area/category (default: general)"),
		phase: zod.z.string().optional().describe("Associated phase number")
	}, async ({ title, description, area, phase }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const pendingDir = require_cli.planningPath(cwd, "todos", "pending");
			node_fs.default.mkdirSync(pendingDir, { recursive: true });
			const today = require_cli.todayISO();
			const slug = require_cli.generateSlugInternal(title) || "untitled";
			const filename = `${Date.now()}-${slug}.md`;
			const filePath = node_path.default.join(pendingDir, filename);
			const content = `---\ncreated: ${today}\ntitle: ${title}\narea: ${area || "general"}\nphase: ${phase || "unassigned"}\n---\n${description || ""}\n`;
			node_fs.default.writeFileSync(filePath, content, "utf-8");
			return mcpSuccess({
				file: filename,
				path: `.planning/todos/pending/${filename}`,
				title,
				area: area || "general"
			}, `Todo created: ${title}`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_complete_todo", "Mark a pending todo as completed by moving it from pending/ to completed/ with a completion timestamp.", { todo_id: zod.z.string().describe("Filename of the todo (e.g., 1234567890-my-task.md)") }, async ({ todo_id }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const pendingDir = require_cli.planningPath(cwd, "todos", "pending");
			const completedDir = require_cli.planningPath(cwd, "todos", "completed");
			const sourcePath = node_path.default.join(pendingDir, todo_id);
			if (!node_fs.default.existsSync(sourcePath)) return mcpError(`Todo not found in pending: ${todo_id}`, "Todo not found");
			node_fs.default.mkdirSync(completedDir, { recursive: true });
			let content = node_fs.default.readFileSync(sourcePath, "utf-8");
			const today = require_cli.todayISO();
			content = `completed: ${today}\n` + content;
			node_fs.default.writeFileSync(node_path.default.join(completedDir, todo_id), content, "utf-8");
			node_fs.default.unlinkSync(sourcePath);
			return mcpSuccess({
				completed: true,
				file: todo_id,
				date: today
			}, `Todo completed: ${todo_id}`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_list_todos", "List todo items, optionally filtered by area and status (pending, completed, or all).", {
		area: zod.z.string().optional().describe("Filter by area/category"),
		status: zod.z.enum([
			"pending",
			"completed",
			"all"
		]).optional().default("pending").describe("Which todos to list (default: pending)")
	}, async ({ area, status }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const todosBase = require_cli.planningPath(cwd, "todos");
			const dirs = [];
			if (status === "pending" || status === "all") dirs.push(node_path.default.join(todosBase, "pending"));
			if (status === "completed" || status === "all") dirs.push(node_path.default.join(todosBase, "completed"));
			const todos = [];
			for (const dir of dirs) {
				const dirStatus = dir.endsWith("pending") ? "pending" : "completed";
				let files = [];
				try {
					files = node_fs.default.readdirSync(dir).filter((f) => f.endsWith(".md"));
				} catch {
					continue;
				}
				for (const file of files) try {
					const fm = require_cli.parseTodoFrontmatter(node_fs.default.readFileSync(node_path.default.join(dir, file), "utf-8"));
					if (area && fm.area !== area) continue;
					todos.push({
						file,
						created: fm.created,
						title: fm.title,
						area: fm.area,
						status: dirStatus,
						path: `.planning/todos/${dirStatus}/${file}`
					});
				} catch {}
			}
			return mcpSuccess({
				count: todos.length,
				todos
			}, `${todos.length} todos found`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
}

//#endregion
//#region src/mcp/state-tools.ts
/**
* State Management MCP Tools — STATE.md operations exposed as MCP tools
*
* CRITICAL: Never import output() or error() from core — they call process.exit().
* CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
* CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
*/
/**
* Register all state management tools on the MCP server.
*/
function registerStateTools(server) {
	server.tool("mcp_get_state", "Read STATE.md content — full file, a specific **field:** value, or a ## section.", { field: zod.z.string().optional().describe("Specific field or section name, or omit for full STATE.md") }, async ({ field }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const stPath = require_cli.statePath(cwd);
			if (!node_fs.default.existsSync(stPath)) return mcpError("STATE.md not found", "STATE.md missing");
			const content = node_fs.default.readFileSync(stPath, "utf-8");
			if (!field) return mcpSuccess({ content }, "Full STATE.md retrieved");
			const fieldValue = require_cli.stateExtractField(content, field);
			if (fieldValue) return mcpSuccess({
				content: fieldValue,
				field
			}, `State field retrieved: ${field}`);
			const fieldEscaped = require_cli.escapeStringRegexp(field);
			const sectionPattern = new RegExp(`##\\s*${fieldEscaped}\\s*\n([\\s\\S]*?)(?=\\n##|$)`, "i");
			const sectionMatch = content.match(sectionPattern);
			if (sectionMatch) return mcpSuccess({
				content: sectionMatch[1].trim(),
				field
			}, `State section retrieved: ${field}`);
			return mcpError(`Section or field "${field}" not found in STATE.md`, "Field not found");
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_update_state", "Update a **field:** value in STATE.md (e.g., \"Status\", \"Current focus\").", {
		field: zod.z.string().describe("Field name (e.g., \"Status\", \"Current focus\")"),
		value: zod.z.string().describe("New value for the field")
	}, async ({ field, value }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const stPath = require_cli.statePath(cwd);
			if (!node_fs.default.existsSync(stPath)) return mcpError("STATE.md not found", "STATE.md missing");
			const updated = require_cli.stateReplaceField(node_fs.default.readFileSync(stPath, "utf-8"), field, value);
			if (!updated) return mcpError(`Field "${field}" not found in STATE.md`, "Field not found");
			node_fs.default.writeFileSync(stPath, updated, "utf-8");
			return mcpSuccess({
				updated: true,
				field,
				value
			}, `State updated: ${field}`);
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_add_decision", "Record a decision in the Decisions section of STATE.md.", {
		summary: zod.z.string().describe("Decision summary"),
		rationale: zod.z.string().optional().describe("Optional rationale"),
		phase: zod.z.string().optional().describe("Associated phase number")
	}, async ({ summary, rationale, phase }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const stPath = require_cli.statePath(cwd);
			if (!node_fs.default.existsSync(stPath)) return mcpError("STATE.md not found", "STATE.md missing");
			const content = node_fs.default.readFileSync(stPath, "utf-8");
			const entry = `- [Phase ${phase || "?"}]: ${summary}${rationale ? ` -- ${rationale}` : ""}`;
			const updated = require_cli.appendToStateSection(content, /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i, entry, [/None yet\.?\s*\n?/gi, /No decisions yet\.?\s*\n?/gi]);
			if (!updated) return mcpError("Decisions section not found in STATE.md", "Section not found");
			node_fs.default.writeFileSync(stPath, updated, "utf-8");
			return mcpSuccess({
				added: true,
				decision: entry
			}, "Decision recorded");
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_add_blocker", "Add a blocker entry to the Blockers section of STATE.md.", { text: zod.z.string().describe("Blocker description") }, async ({ text }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const stPath = require_cli.statePath(cwd);
			if (!node_fs.default.existsSync(stPath)) return mcpError("STATE.md not found", "STATE.md missing");
			const updated = require_cli.appendToStateSection(node_fs.default.readFileSync(stPath, "utf-8"), /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i, `- ${text}`, [/None\.?\s*\n?/gi, /None yet\.?\s*\n?/gi]);
			if (!updated) return mcpError("Blockers section not found in STATE.md", "Section not found");
			node_fs.default.writeFileSync(stPath, updated, "utf-8");
			return mcpSuccess({
				added: true,
				blocker: text
			}, "Blocker added");
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
	server.tool("mcp_resolve_blocker", "Remove a blocker from STATE.md by matching text (case-insensitive partial match).", { text: zod.z.string().describe("Text to match against blocker entries (case-insensitive partial match)") }, async ({ text }) => {
		try {
			const cwd = detectProjectRoot();
			if (!cwd) return mcpError("No .planning/ directory found", "Project not detected");
			const stPath = require_cli.statePath(cwd);
			if (!node_fs.default.existsSync(stPath)) return mcpError("STATE.md not found", "STATE.md missing");
			let content = node_fs.default.readFileSync(stPath, "utf-8");
			const sectionPattern = /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
			const match = content.match(sectionPattern);
			if (!match) return mcpError("Blockers section not found in STATE.md", "Section not found");
			let newBody = match[2].split("\n").filter((line) => {
				if (!line.startsWith("- ")) return true;
				return !line.toLowerCase().includes(text.toLowerCase());
			}).join("\n");
			if (!newBody.trim() || !newBody.includes("- ")) newBody = "None\n";
			content = content.replace(sectionPattern, (_match, header) => `${header}${newBody}`);
			node_fs.default.writeFileSync(stPath, content, "utf-8");
			return mcpSuccess({
				resolved: true,
				blocker: text
			}, "Blocker resolved");
		} catch (e) {
			return mcpError(e.message, "Operation failed");
		}
	});
}

//#endregion
//#region src/mcp/index.ts
/**
* Register all MCP tools on the given server instance.
*/
function registerAllTools(server) {
	registerPhaseTools(server);
	registerTodoTools(server);
	registerStateTools(server);
}

//#endregion
//#region ../../../../../node_modules/node-pty/lib/utils.js
var require_utils = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	/**
	* Copyright (c) 2017, Daniel Imms (MIT License).
	* Copyright (c) 2018, Microsoft Corporation (MIT License).
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.loadNativeModule = exports.assign = void 0;
	function assign(target) {
		var sources = [];
		for (var _i = 1; _i < arguments.length; _i++) sources[_i - 1] = arguments[_i];
		sources.forEach(function(source) {
			return Object.keys(source).forEach(function(key) {
				return target[key] = source[key];
			});
		});
		return target;
	}
	exports.assign = assign;
	function loadNativeModule(name) {
		var dirs = [
			"build/Release",
			"build/Debug",
			"prebuilds/" + process.platform + "-" + process.arch
		];
		var relative = ["..", "."];
		var lastError;
		for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
			var d = dirs_1[_i];
			for (var _a = 0, relative_1 = relative; _a < relative_1.length; _a++) {
				var dir = relative_1[_a] + "/" + d + "/";
				try {
					return {
						dir,
						module: require(dir + "/" + name + ".node")
					};
				} catch (e) {
					lastError = e;
				}
			}
		}
		throw new Error("Failed to load native module: " + name + ".node, checked: " + dirs.join(", ") + ": " + lastError);
	}
	exports.loadNativeModule = loadNativeModule;
}));

//#endregion
//#region ../../../../../node_modules/node-pty/lib/eventEmitter2.js
var require_eventEmitter2 = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	/**
	* Copyright (c) 2019, Microsoft Corporation (MIT License).
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.EventEmitter2 = void 0;
	var EventEmitter2 = function() {
		function EventEmitter2() {
			this._listeners = [];
		}
		Object.defineProperty(EventEmitter2.prototype, "event", {
			get: function() {
				var _this = this;
				if (!this._event) this._event = function(listener) {
					_this._listeners.push(listener);
					return { dispose: function() {
						for (var i = 0; i < _this._listeners.length; i++) if (_this._listeners[i] === listener) {
							_this._listeners.splice(i, 1);
							return;
						}
					} };
				};
				return this._event;
			},
			enumerable: false,
			configurable: true
		});
		EventEmitter2.prototype.fire = function(data) {
			var queue = [];
			for (var i = 0; i < this._listeners.length; i++) queue.push(this._listeners[i]);
			for (var i = 0; i < queue.length; i++) queue[i].call(void 0, data);
		};
		return EventEmitter2;
	}();
	exports.EventEmitter2 = EventEmitter2;
}));

//#endregion
//#region ../../../../../node_modules/node-pty/lib/terminal.js
var require_terminal = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	/**
	* Copyright (c) 2012-2015, Christopher Jeffrey (MIT License)
	* Copyright (c) 2016, Daniel Imms (MIT License).
	* Copyright (c) 2018, Microsoft Corporation (MIT License).
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Terminal = exports.DEFAULT_ROWS = exports.DEFAULT_COLS = void 0;
	var events_1 = require("events");
	var eventEmitter2_1 = require_eventEmitter2();
	exports.DEFAULT_COLS = 80;
	exports.DEFAULT_ROWS = 24;
	/**
	* Default messages to indicate PAUSE/RESUME for automatic flow control.
	* To avoid conflicts with rebound XON/XOFF control codes (such as on-my-zsh),
	* the sequences can be customized in `IPtyForkOptions`.
	*/
	var FLOW_CONTROL_PAUSE = "";
	var FLOW_CONTROL_RESUME = "";
	var Terminal = function() {
		function Terminal(opt) {
			this._pid = 0;
			this._fd = 0;
			this._cols = 0;
			this._rows = 0;
			this._readable = false;
			this._writable = false;
			this._onData = new eventEmitter2_1.EventEmitter2();
			this._onExit = new eventEmitter2_1.EventEmitter2();
			this._internalee = new events_1.EventEmitter();
			this.handleFlowControl = !!(opt === null || opt === void 0 ? void 0 : opt.handleFlowControl);
			this._flowControlPause = (opt === null || opt === void 0 ? void 0 : opt.flowControlPause) || FLOW_CONTROL_PAUSE;
			this._flowControlResume = (opt === null || opt === void 0 ? void 0 : opt.flowControlResume) || FLOW_CONTROL_RESUME;
			if (!opt) return;
			this._checkType("name", opt.name ? opt.name : void 0, "string");
			this._checkType("cols", opt.cols ? opt.cols : void 0, "number");
			this._checkType("rows", opt.rows ? opt.rows : void 0, "number");
			this._checkType("cwd", opt.cwd ? opt.cwd : void 0, "string");
			this._checkType("env", opt.env ? opt.env : void 0, "object");
			this._checkType("uid", opt.uid ? opt.uid : void 0, "number");
			this._checkType("gid", opt.gid ? opt.gid : void 0, "number");
			this._checkType("encoding", opt.encoding ? opt.encoding : void 0, "string");
		}
		Object.defineProperty(Terminal.prototype, "onData", {
			get: function() {
				return this._onData.event;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(Terminal.prototype, "onExit", {
			get: function() {
				return this._onExit.event;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(Terminal.prototype, "pid", {
			get: function() {
				return this._pid;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(Terminal.prototype, "cols", {
			get: function() {
				return this._cols;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(Terminal.prototype, "rows", {
			get: function() {
				return this._rows;
			},
			enumerable: false,
			configurable: true
		});
		Terminal.prototype.write = function(data) {
			if (this.handleFlowControl) {
				if (data === this._flowControlPause) {
					this.pause();
					return;
				}
				if (data === this._flowControlResume) {
					this.resume();
					return;
				}
			}
			this._write(data);
		};
		Terminal.prototype._forwardEvents = function() {
			var _this = this;
			this.on("data", function(e) {
				return _this._onData.fire(e);
			});
			this.on("exit", function(exitCode, signal) {
				return _this._onExit.fire({
					exitCode,
					signal
				});
			});
		};
		Terminal.prototype._checkType = function(name, value, type, allowArray) {
			if (allowArray === void 0) allowArray = false;
			if (value === void 0) return;
			if (allowArray) {
				if (Array.isArray(value)) {
					value.forEach(function(v, i) {
						if (typeof v !== type) throw new Error(name + "[" + i + "] must be a " + type + " (not a " + typeof v[i] + ")");
					});
					return;
				}
			}
			if (typeof value !== type) throw new Error(name + " must be a " + type + " (not a " + typeof value + ")");
		};
		/** See net.Socket.end */
		Terminal.prototype.end = function(data) {
			this._socket.end(data);
		};
		/** See stream.Readable.pipe */
		Terminal.prototype.pipe = function(dest, options) {
			return this._socket.pipe(dest, options);
		};
		/** See net.Socket.pause */
		Terminal.prototype.pause = function() {
			return this._socket.pause();
		};
		/** See net.Socket.resume */
		Terminal.prototype.resume = function() {
			return this._socket.resume();
		};
		/** See net.Socket.setEncoding */
		Terminal.prototype.setEncoding = function(encoding) {
			if (this._socket._decoder) delete this._socket._decoder;
			if (encoding) this._socket.setEncoding(encoding);
		};
		Terminal.prototype.addListener = function(eventName, listener) {
			this.on(eventName, listener);
		};
		Terminal.prototype.on = function(eventName, listener) {
			if (eventName === "close") {
				this._internalee.on("close", listener);
				return;
			}
			this._socket.on(eventName, listener);
		};
		Terminal.prototype.emit = function(eventName) {
			var args = [];
			for (var _i = 1; _i < arguments.length; _i++) args[_i - 1] = arguments[_i];
			if (eventName === "close") return this._internalee.emit.apply(this._internalee, arguments);
			return this._socket.emit.apply(this._socket, arguments);
		};
		Terminal.prototype.listeners = function(eventName) {
			return this._socket.listeners(eventName);
		};
		Terminal.prototype.removeListener = function(eventName, listener) {
			this._socket.removeListener(eventName, listener);
		};
		Terminal.prototype.removeAllListeners = function(eventName) {
			this._socket.removeAllListeners(eventName);
		};
		Terminal.prototype.once = function(eventName, listener) {
			this._socket.once(eventName, listener);
		};
		Terminal.prototype._close = function() {
			this._socket.readable = false;
			this.write = function() {};
			this.end = function() {};
			this._writable = false;
			this._readable = false;
		};
		Terminal.prototype._parseEnv = function(env) {
			var keys = Object.keys(env || {});
			var pairs = [];
			for (var i = 0; i < keys.length; i++) {
				if (keys[i] === void 0) continue;
				pairs.push(keys[i] + "=" + env[keys[i]]);
			}
			return pairs;
		};
		return Terminal;
	}();
	exports.Terminal = Terminal;
}));

//#endregion
//#region ../../../../../node_modules/node-pty/lib/shared/conout.js
var require_conout = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	/**
	* Copyright (c) 2020, Microsoft Corporation (MIT License).
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getWorkerPipeName = void 0;
	function getWorkerPipeName(conoutPipeName) {
		return conoutPipeName + "-worker";
	}
	exports.getWorkerPipeName = getWorkerPipeName;
}));

//#endregion
//#region ../../../../../node_modules/node-pty/lib/windowsConoutConnection.js
var require_windowsConoutConnection = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	/**
	* Copyright (c) 2020, Microsoft Corporation (MIT License).
	*/
	var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var __generator = exports && exports.__generator || function(thisArg, body) {
		var _ = {
			label: 0,
			sent: function() {
				if (t[0] & 1) throw t[1];
				return t[1];
			},
			trys: [],
			ops: []
		}, f, y, t, g;
		return g = {
			next: verb(0),
			"throw": verb(1),
			"return": verb(2)
		}, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
			return this;
		}), g;
		function verb(n) {
			return function(v) {
				return step([n, v]);
			};
		}
		function step(op) {
			if (f) throw new TypeError("Generator is already executing.");
			while (_) try {
				if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
				if (y = 0, t) op = [op[0] & 2, t.value];
				switch (op[0]) {
					case 0:
					case 1:
						t = op;
						break;
					case 4:
						_.label++;
						return {
							value: op[1],
							done: false
						};
					case 5:
						_.label++;
						y = op[1];
						op = [0];
						continue;
					case 7:
						op = _.ops.pop();
						_.trys.pop();
						continue;
					default:
						if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
							_ = 0;
							continue;
						}
						if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
							_.label = op[1];
							break;
						}
						if (op[0] === 6 && _.label < t[1]) {
							_.label = t[1];
							t = op;
							break;
						}
						if (t && _.label < t[2]) {
							_.label = t[2];
							_.ops.push(op);
							break;
						}
						if (t[2]) _.ops.pop();
						_.trys.pop();
						continue;
				}
				op = body.call(thisArg, _);
			} catch (e) {
				op = [6, e];
				y = 0;
			} finally {
				f = t = 0;
			}
			if (op[0] & 5) throw op[1];
			return {
				value: op[0] ? op[1] : void 0,
				done: true
			};
		}
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ConoutConnection = void 0;
	var worker_threads_1 = require("worker_threads");
	var conout_1 = require_conout();
	var path_1 = require("path");
	var eventEmitter2_1 = require_eventEmitter2();
	/**
	* The amount of time to wait for additional data after the conpty shell process has exited before
	* shutting down the worker and sockets. The timer will be reset if a new data event comes in after
	* the timer has started.
	*/
	var FLUSH_DATA_INTERVAL = 1e3;
	/**
	* Connects to and manages the lifecycle of the conout socket. This socket must be drained on
	* another thread in order to avoid deadlocks where Conpty waits for the out socket to drain
	* when `ClosePseudoConsole` is called. This happens when data is being written to the terminal when
	* the pty is closed.
	*
	* See also:
	* - https://github.com/microsoft/node-pty/issues/375
	* - https://github.com/microsoft/vscode/issues/76548
	* - https://github.com/microsoft/terminal/issues/1810
	* - https://docs.microsoft.com/en-us/windows/console/closepseudoconsole
	*/
	var ConoutConnection = function() {
		function ConoutConnection(_conoutPipeName, _useConptyDll) {
			var _this = this;
			this._conoutPipeName = _conoutPipeName;
			this._useConptyDll = _useConptyDll;
			this._isDisposed = false;
			this._onReady = new eventEmitter2_1.EventEmitter2();
			var workerData = { conoutPipeName: _conoutPipeName };
			var scriptPath = __dirname.replace("node_modules.asar", "node_modules.asar.unpacked");
			this._worker = new worker_threads_1.Worker(path_1.join(scriptPath, "worker/conoutSocketWorker.js"), { workerData });
			this._worker.on("message", function(message) {
				switch (message) {
					case 1:
						_this._onReady.fire();
						return;
					default: console.warn("Unexpected ConoutWorkerMessage", message);
				}
			});
		}
		Object.defineProperty(ConoutConnection.prototype, "onReady", {
			get: function() {
				return this._onReady.event;
			},
			enumerable: false,
			configurable: true
		});
		ConoutConnection.prototype.dispose = function() {
			if (!this._useConptyDll && this._isDisposed) return;
			this._isDisposed = true;
			this._drainDataAndClose();
		};
		ConoutConnection.prototype.connectSocket = function(socket) {
			socket.connect(conout_1.getWorkerPipeName(this._conoutPipeName));
		};
		ConoutConnection.prototype._drainDataAndClose = function() {
			var _this = this;
			if (this._drainTimeout) clearTimeout(this._drainTimeout);
			this._drainTimeout = setTimeout(function() {
				return _this._destroySocket();
			}, FLUSH_DATA_INTERVAL);
		};
		ConoutConnection.prototype._destroySocket = function() {
			return __awaiter(this, void 0, void 0, function() {
				return __generator(this, function(_a) {
					switch (_a.label) {
						case 0: return [4, this._worker.terminate()];
						case 1:
							_a.sent();
							return [2];
					}
				});
			});
		};
		return ConoutConnection;
	}();
	exports.ConoutConnection = ConoutConnection;
}));

//#endregion
//#region ../../../../../node_modules/node-pty/lib/windowsPtyAgent.js
var require_windowsPtyAgent = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	/**
	* Copyright (c) 2012-2015, Christopher Jeffrey, Peter Sunde (MIT License)
	* Copyright (c) 2016, Daniel Imms (MIT License).
	* Copyright (c) 2018, Microsoft Corporation (MIT License).
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.argsToCommandLine = exports.WindowsPtyAgent = void 0;
	var fs$1 = require("fs");
	var os = require("os");
	var path$1 = require("path");
	var child_process_1 = require("child_process");
	var net_1 = require("net");
	var windowsConoutConnection_1 = require_windowsConoutConnection();
	var utils_1 = require_utils();
	var conptyNative;
	var winptyNative;
	/**
	* The amount of time to wait for additional data after the conpty shell process has exited before
	* shutting down the socket. The timer will be reset if a new data event comes in after the timer
	* has started.
	*/
	var FLUSH_DATA_INTERVAL = 1e3;
	/**
	* This agent sits between the WindowsTerminal class and provides a common interface for both conpty
	* and winpty.
	*/
	var WindowsPtyAgent = function() {
		function WindowsPtyAgent(file, args, env, cwd, cols, rows, debug, _useConpty, _useConptyDll, conptyInheritCursor) {
			var _this = this;
			if (_useConptyDll === void 0) _useConptyDll = false;
			if (conptyInheritCursor === void 0) conptyInheritCursor = false;
			this._useConpty = _useConpty;
			this._useConptyDll = _useConptyDll;
			this._pid = 0;
			this._innerPid = 0;
			if (this._useConpty === void 0 || this._useConpty === true) this._useConpty = this._getWindowsBuildNumber() >= 18309;
			if (this._useConpty) {
				if (!conptyNative) conptyNative = utils_1.loadNativeModule("conpty").module;
			} else if (!winptyNative) winptyNative = utils_1.loadNativeModule("pty").module;
			this._ptyNative = this._useConpty ? conptyNative : winptyNative;
			cwd = path$1.resolve(cwd);
			var commandLine = argsToCommandLine(file, args);
			var term;
			if (this._useConpty) term = this._ptyNative.startProcess(file, cols, rows, debug, this._generatePipeName(), conptyInheritCursor, this._useConptyDll);
			else {
				term = this._ptyNative.startProcess(file, commandLine, env, cwd, cols, rows, debug);
				this._pid = term.pid;
				this._innerPid = term.innerPid;
			}
			this._fd = term.fd;
			this._pty = term.pty;
			this._outSocket = new net_1.Socket();
			this._outSocket.setEncoding("utf8");
			this._conoutSocketWorker = new windowsConoutConnection_1.ConoutConnection(term.conout, this._useConptyDll);
			this._conoutSocketWorker.onReady(function() {
				_this._conoutSocketWorker.connectSocket(_this._outSocket);
			});
			this._outSocket.on("connect", function() {
				_this._outSocket.emit("ready_datapipe");
			});
			var inSocketFD = fs$1.openSync(term.conin, "w");
			this._inSocket = new net_1.Socket({
				fd: inSocketFD,
				readable: false,
				writable: true
			});
			this._inSocket.setEncoding("utf8");
			if (this._useConpty) this._innerPid = this._ptyNative.connect(this._pty, commandLine, cwd, env, this._useConptyDll, function(c) {
				return _this._$onProcessExit(c);
			}).pid;
		}
		Object.defineProperty(WindowsPtyAgent.prototype, "inSocket", {
			get: function() {
				return this._inSocket;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(WindowsPtyAgent.prototype, "outSocket", {
			get: function() {
				return this._outSocket;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(WindowsPtyAgent.prototype, "fd", {
			get: function() {
				return this._fd;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(WindowsPtyAgent.prototype, "innerPid", {
			get: function() {
				return this._innerPid;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(WindowsPtyAgent.prototype, "pty", {
			get: function() {
				return this._pty;
			},
			enumerable: false,
			configurable: true
		});
		WindowsPtyAgent.prototype.resize = function(cols, rows) {
			if (this._useConpty) {
				if (this._exitCode !== void 0) throw new Error("Cannot resize a pty that has already exited");
				this._ptyNative.resize(this._pty, cols, rows, this._useConptyDll);
				return;
			}
			this._ptyNative.resize(this._pid, cols, rows);
		};
		WindowsPtyAgent.prototype.clear = function() {
			if (this._useConpty) this._ptyNative.clear(this._pty, this._useConptyDll);
		};
		WindowsPtyAgent.prototype.kill = function() {
			var _this = this;
			if (this._useConpty) if (!this._useConptyDll) {
				this._inSocket.readable = false;
				this._outSocket.readable = false;
				this._getConsoleProcessList().then(function(consoleProcessList) {
					consoleProcessList.forEach(function(pid) {
						try {
							process.kill(pid);
						} catch (e) {}
					});
				});
				this._ptyNative.kill(this._pty, this._useConptyDll);
				this._conoutSocketWorker.dispose();
			} else {
				this._inSocket.destroy();
				this._ptyNative.kill(this._pty, this._useConptyDll);
				this._outSocket.on("data", function() {
					_this._conoutSocketWorker.dispose();
				});
			}
			else {
				var processList = this._ptyNative.getProcessList(this._pid);
				this._ptyNative.kill(this._pid, this._innerPid);
				processList.forEach(function(pid) {
					try {
						process.kill(pid);
					} catch (e) {}
				});
			}
		};
		WindowsPtyAgent.prototype._getConsoleProcessList = function() {
			var _this = this;
			return new Promise(function(resolve) {
				var agent = child_process_1.fork(path$1.join(__dirname, "conpty_console_list_agent"), [_this._innerPid.toString()]);
				agent.on("message", function(message) {
					clearTimeout(timeout);
					resolve(message.consoleProcessList);
				});
				var timeout = setTimeout(function() {
					agent.kill();
					resolve([_this._innerPid]);
				}, 5e3);
			});
		};
		Object.defineProperty(WindowsPtyAgent.prototype, "exitCode", {
			get: function() {
				if (this._useConpty) return this._exitCode;
				var winptyExitCode = this._ptyNative.getExitCode(this._innerPid);
				return winptyExitCode === -1 ? void 0 : winptyExitCode;
			},
			enumerable: false,
			configurable: true
		});
		WindowsPtyAgent.prototype._getWindowsBuildNumber = function() {
			var osVersion = /(\d+)\.(\d+)\.(\d+)/g.exec(os.release());
			var buildNumber = 0;
			if (osVersion && osVersion.length === 4) buildNumber = parseInt(osVersion[3]);
			return buildNumber;
		};
		WindowsPtyAgent.prototype._generatePipeName = function() {
			return "conpty-" + Math.random() * 1e7;
		};
		/**
		* Triggered from the native side when a contpy process exits.
		*/
		WindowsPtyAgent.prototype._$onProcessExit = function(exitCode) {
			var _this = this;
			this._exitCode = exitCode;
			if (!this._useConptyDll) {
				this._flushDataAndCleanUp();
				this._outSocket.on("data", function() {
					return _this._flushDataAndCleanUp();
				});
			}
		};
		WindowsPtyAgent.prototype._flushDataAndCleanUp = function() {
			var _this = this;
			if (this._useConptyDll) return;
			if (this._closeTimeout) clearTimeout(this._closeTimeout);
			this._closeTimeout = setTimeout(function() {
				return _this._cleanUpProcess();
			}, FLUSH_DATA_INTERVAL);
		};
		WindowsPtyAgent.prototype._cleanUpProcess = function() {
			if (this._useConptyDll) return;
			this._inSocket.readable = false;
			this._outSocket.readable = false;
			this._outSocket.destroy();
		};
		return WindowsPtyAgent;
	}();
	exports.WindowsPtyAgent = WindowsPtyAgent;
	function argsToCommandLine(file, args) {
		if (isCommandLine(args)) {
			if (args.length === 0) return file;
			return argsToCommandLine(file, []) + " " + args;
		}
		var argv = [file];
		Array.prototype.push.apply(argv, args);
		var result = "";
		for (var argIndex = 0; argIndex < argv.length; argIndex++) {
			if (argIndex > 0) result += " ";
			var arg = argv[argIndex];
			var hasLopsidedEnclosingQuote = xOr(arg[0] !== "\"", arg[arg.length - 1] !== "\"");
			var hasNoEnclosingQuotes = arg[0] !== "\"" && arg[arg.length - 1] !== "\"";
			var quote = arg === "" || (arg.indexOf(" ") !== -1 || arg.indexOf("	") !== -1) && arg.length > 1 && (hasLopsidedEnclosingQuote || hasNoEnclosingQuotes);
			if (quote) result += "\"";
			var bsCount = 0;
			for (var i = 0; i < arg.length; i++) {
				var p = arg[i];
				if (p === "\\") bsCount++;
				else if (p === "\"") {
					result += repeatText("\\", bsCount * 2 + 1);
					result += "\"";
					bsCount = 0;
				} else {
					result += repeatText("\\", bsCount);
					bsCount = 0;
					result += p;
				}
			}
			if (quote) {
				result += repeatText("\\", bsCount * 2);
				result += "\"";
			} else result += repeatText("\\", bsCount);
		}
		return result;
	}
	exports.argsToCommandLine = argsToCommandLine;
	function isCommandLine(args) {
		return typeof args === "string";
	}
	function repeatText(text, count) {
		var result = "";
		for (var i = 0; i < count; i++) result += text;
		return result;
	}
	function xOr(arg1, arg2) {
		return arg1 && !arg2 || !arg1 && arg2;
	}
}));

//#endregion
//#region ../../../../../node_modules/node-pty/lib/windowsTerminal.js
var require_windowsTerminal = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	/**
	* Copyright (c) 2012-2015, Christopher Jeffrey, Peter Sunde (MIT License)
	* Copyright (c) 2016, Daniel Imms (MIT License).
	* Copyright (c) 2018, Microsoft Corporation (MIT License).
	*/
	var __extends = exports && exports.__extends || (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.WindowsTerminal = void 0;
	var terminal_1 = require_terminal();
	var windowsPtyAgent_1 = require_windowsPtyAgent();
	var utils_1 = require_utils();
	var DEFAULT_FILE = "cmd.exe";
	var DEFAULT_NAME = "Windows Shell";
	var WindowsTerminal = function(_super) {
		__extends(WindowsTerminal, _super);
		function WindowsTerminal(file, args, opt) {
			var _this = _super.call(this, opt) || this;
			_this._checkType("args", args, "string", true);
			args = args || [];
			file = file || DEFAULT_FILE;
			opt = opt || {};
			opt.env = opt.env || process.env;
			if (opt.encoding) console.warn("Setting encoding on Windows is not supported");
			var env = utils_1.assign({}, opt.env);
			_this._cols = opt.cols || terminal_1.DEFAULT_COLS;
			_this._rows = opt.rows || terminal_1.DEFAULT_ROWS;
			var cwd = opt.cwd || process.cwd();
			var name = opt.name || env.TERM || DEFAULT_NAME;
			var parsedEnv = _this._parseEnv(env);
			_this._isReady = false;
			_this._deferreds = [];
			_this._agent = new windowsPtyAgent_1.WindowsPtyAgent(file, args, parsedEnv, cwd, _this._cols, _this._rows, false, opt.useConpty, opt.useConptyDll, opt.conptyInheritCursor);
			_this._socket = _this._agent.outSocket;
			_this._pid = _this._agent.innerPid;
			_this._fd = _this._agent.fd;
			_this._pty = _this._agent.pty;
			_this._socket.on("ready_datapipe", function() {
				_this._socket.once("data", function() {
					if (!_this._isReady) {
						_this._isReady = true;
						_this._deferreds.forEach(function(fn) {
							fn.run();
						});
						_this._deferreds = [];
					}
				});
				_this._socket.on("error", function(err) {
					_this._close();
					if (err.code) {
						if (~err.code.indexOf("errno 5") || ~err.code.indexOf("EIO")) return;
					}
					if (_this.listeners("error").length < 2) throw err;
				});
				_this._socket.on("close", function() {
					_this.emit("exit", _this._agent.exitCode);
					_this._close();
				});
			});
			_this._file = file;
			_this._name = name;
			_this._readable = true;
			_this._writable = true;
			_this._forwardEvents();
			return _this;
		}
		WindowsTerminal.prototype._write = function(data) {
			this._defer(this._doWrite, data);
		};
		WindowsTerminal.prototype._doWrite = function(data) {
			this._agent.inSocket.write(data);
		};
		/**
		* openpty
		*/
		WindowsTerminal.open = function(options) {
			throw new Error("open() not supported on windows, use Fork() instead.");
		};
		/**
		* TTY
		*/
		WindowsTerminal.prototype.resize = function(cols, rows) {
			var _this = this;
			if (cols <= 0 || rows <= 0 || isNaN(cols) || isNaN(rows) || cols === Infinity || rows === Infinity) throw new Error("resizing must be done using positive cols and rows");
			this._deferNoArgs(function() {
				_this._agent.resize(cols, rows);
				_this._cols = cols;
				_this._rows = rows;
			});
		};
		WindowsTerminal.prototype.clear = function() {
			var _this = this;
			this._deferNoArgs(function() {
				_this._agent.clear();
			});
		};
		WindowsTerminal.prototype.destroy = function() {
			var _this = this;
			this._deferNoArgs(function() {
				_this.kill();
			});
		};
		WindowsTerminal.prototype.kill = function(signal) {
			var _this = this;
			this._deferNoArgs(function() {
				if (signal) throw new Error("Signals not supported on windows.");
				_this._close();
				_this._agent.kill();
			});
		};
		WindowsTerminal.prototype._deferNoArgs = function(deferredFn) {
			var _this = this;
			if (this._isReady) {
				deferredFn.call(this);
				return;
			}
			this._deferreds.push({ run: function() {
				return deferredFn.call(_this);
			} });
		};
		WindowsTerminal.prototype._defer = function(deferredFn, arg) {
			var _this = this;
			if (this._isReady) {
				deferredFn.call(this, arg);
				return;
			}
			this._deferreds.push({ run: function() {
				return deferredFn.call(_this, arg);
			} });
		};
		Object.defineProperty(WindowsTerminal.prototype, "process", {
			get: function() {
				return this._name;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(WindowsTerminal.prototype, "master", {
			get: function() {
				throw new Error("master is not supported on Windows");
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(WindowsTerminal.prototype, "slave", {
			get: function() {
				throw new Error("slave is not supported on Windows");
			},
			enumerable: false,
			configurable: true
		});
		return WindowsTerminal;
	}(terminal_1.Terminal);
	exports.WindowsTerminal = WindowsTerminal;
}));

//#endregion
//#region ../../../../../node_modules/node-pty/lib/unixTerminal.js
var require_unixTerminal = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	var __extends = exports && exports.__extends || (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.UnixTerminal = void 0;
	/**
	* Copyright (c) 2012-2015, Christopher Jeffrey (MIT License)
	* Copyright (c) 2016, Daniel Imms (MIT License).
	* Copyright (c) 2018, Microsoft Corporation (MIT License).
	*/
	var fs = require("fs");
	var path = require("path");
	var tty = require("tty");
	var terminal_1 = require_terminal();
	var utils_1 = require_utils();
	var native = utils_1.loadNativeModule("pty");
	var pty = native.module;
	var helperPath = native.dir + "/spawn-helper";
	helperPath = path.resolve(__dirname, helperPath);
	helperPath = helperPath.replace("app.asar", "app.asar.unpacked");
	helperPath = helperPath.replace("node_modules.asar", "node_modules.asar.unpacked");
	var DEFAULT_FILE = "sh";
	var DEFAULT_NAME = "xterm";
	var DESTROY_SOCKET_TIMEOUT_MS = 200;
	var UnixTerminal = function(_super) {
		__extends(UnixTerminal, _super);
		function UnixTerminal(file, args, opt) {
			var _a, _b;
			var _this = _super.call(this, opt) || this;
			_this._boundClose = false;
			_this._emittedClose = false;
			if (typeof args === "string") throw new Error("args as a string is not supported on unix.");
			args = args || [];
			file = file || DEFAULT_FILE;
			opt = opt || {};
			opt.env = opt.env || process.env;
			_this._cols = opt.cols || terminal_1.DEFAULT_COLS;
			_this._rows = opt.rows || terminal_1.DEFAULT_ROWS;
			var uid = (_a = opt.uid) !== null && _a !== void 0 ? _a : -1;
			var gid = (_b = opt.gid) !== null && _b !== void 0 ? _b : -1;
			var env = utils_1.assign({}, opt.env);
			if (opt.env === process.env) _this._sanitizeEnv(env);
			var cwd = opt.cwd || process.cwd();
			env.PWD = cwd;
			var name = opt.name || env.TERM || DEFAULT_NAME;
			env.TERM = name;
			var parsedEnv = _this._parseEnv(env);
			var encoding = opt.encoding === void 0 ? "utf8" : opt.encoding;
			var onexit = function(code, signal) {
				if (!_this._emittedClose) {
					if (_this._boundClose) return;
					_this._boundClose = true;
					var timeout_1 = setTimeout(function() {
						timeout_1 = null;
						_this._socket.destroy();
					}, DESTROY_SOCKET_TIMEOUT_MS);
					_this.once("close", function() {
						if (timeout_1 !== null) clearTimeout(timeout_1);
						_this.emit("exit", code, signal);
					});
					return;
				}
				_this.emit("exit", code, signal);
			};
			var term = pty.fork(file, args, parsedEnv, cwd, _this._cols, _this._rows, uid, gid, encoding === "utf8", helperPath, onexit);
			_this._socket = new tty.ReadStream(term.fd);
			if (encoding !== null) _this._socket.setEncoding(encoding);
			_this._writeStream = new CustomWriteStream(term.fd, encoding || void 0);
			_this._socket.on("error", function(err) {
				if (err.code) {
					if (~err.code.indexOf("EAGAIN")) return;
				}
				_this._close();
				if (!_this._emittedClose) {
					_this._emittedClose = true;
					_this.emit("close");
				}
				if (err.code) {
					if (~err.code.indexOf("errno 5") || ~err.code.indexOf("EIO")) return;
				}
				if (_this.listeners("error").length < 2) throw err;
			});
			_this._pid = term.pid;
			_this._fd = term.fd;
			_this._pty = term.pty;
			_this._file = file;
			_this._name = name;
			_this._readable = true;
			_this._writable = true;
			_this._socket.on("close", function() {
				if (_this._emittedClose) return;
				_this._emittedClose = true;
				_this._close();
				_this.emit("close");
			});
			_this._forwardEvents();
			return _this;
		}
		Object.defineProperty(UnixTerminal.prototype, "master", {
			get: function() {
				return this._master;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(UnixTerminal.prototype, "slave", {
			get: function() {
				return this._slave;
			},
			enumerable: false,
			configurable: true
		});
		UnixTerminal.prototype._write = function(data) {
			this._writeStream.write(data);
		};
		Object.defineProperty(UnixTerminal.prototype, "fd", {
			get: function() {
				return this._fd;
			},
			enumerable: false,
			configurable: true
		});
		Object.defineProperty(UnixTerminal.prototype, "ptsName", {
			get: function() {
				return this._pty;
			},
			enumerable: false,
			configurable: true
		});
		/**
		* openpty
		*/
		UnixTerminal.open = function(opt) {
			var self = Object.create(UnixTerminal.prototype);
			opt = opt || {};
			if (arguments.length > 1) opt = {
				cols: arguments[1],
				rows: arguments[2]
			};
			var cols = opt.cols || terminal_1.DEFAULT_COLS;
			var rows = opt.rows || terminal_1.DEFAULT_ROWS;
			var encoding = opt.encoding === void 0 ? "utf8" : opt.encoding;
			var term = pty.open(cols, rows);
			self._master = new tty.ReadStream(term.master);
			if (encoding !== null) self._master.setEncoding(encoding);
			self._master.resume();
			self._slave = new tty.ReadStream(term.slave);
			if (encoding !== null) self._slave.setEncoding(encoding);
			self._slave.resume();
			self._socket = self._master;
			self._pid = -1;
			self._fd = term.master;
			self._pty = term.pty;
			self._file = process.argv[0] || "node";
			self._name = process.env.TERM || "";
			self._readable = true;
			self._writable = true;
			self._socket.on("error", function(err) {
				self._close();
				if (self.listeners("error").length < 2) throw err;
			});
			self._socket.on("close", function() {
				self._close();
			});
			return self;
		};
		UnixTerminal.prototype.destroy = function() {
			var _this = this;
			this._close();
			this._socket.once("close", function() {
				_this.kill("SIGHUP");
			});
			this._socket.destroy();
			this._writeStream.dispose();
		};
		UnixTerminal.prototype.kill = function(signal) {
			try {
				process.kill(this.pid, signal || "SIGHUP");
			} catch (e) {}
		};
		Object.defineProperty(UnixTerminal.prototype, "process", {
			get: function() {
				if (process.platform === "darwin") {
					var title = pty.process(this._fd);
					return title !== "kernel_task" ? title : this._file;
				}
				return pty.process(this._fd, this._pty) || this._file;
			},
			enumerable: false,
			configurable: true
		});
		/**
		* TTY
		*/
		UnixTerminal.prototype.resize = function(cols, rows) {
			if (cols <= 0 || rows <= 0 || isNaN(cols) || isNaN(rows) || cols === Infinity || rows === Infinity) throw new Error("resizing must be done using positive cols and rows");
			pty.resize(this._fd, cols, rows);
			this._cols = cols;
			this._rows = rows;
		};
		UnixTerminal.prototype.clear = function() {};
		UnixTerminal.prototype._sanitizeEnv = function(env) {
			delete env["TMUX"];
			delete env["TMUX_PANE"];
			delete env["STY"];
			delete env["WINDOW"];
			delete env["WINDOWID"];
			delete env["TERMCAP"];
			delete env["COLUMNS"];
			delete env["LINES"];
		};
		return UnixTerminal;
	}(terminal_1.Terminal);
	exports.UnixTerminal = UnixTerminal;
	/**
	* A custom write stream that writes directly to a file descriptor with proper
	* handling of backpressure and errors. This avoids some event loop exhaustion
	* issues that can occur when using the standard APIs in Node.
	*/
	var CustomWriteStream = function() {
		function CustomWriteStream(_fd, _encoding) {
			this._fd = _fd;
			this._encoding = _encoding;
			this._writeQueue = [];
		}
		CustomWriteStream.prototype.dispose = function() {
			clearImmediate(this._writeImmediate);
			this._writeImmediate = void 0;
		};
		CustomWriteStream.prototype.write = function(data) {
			var buffer = typeof data === "string" ? Buffer.from(data, this._encoding) : Buffer.from(data);
			if (buffer.byteLength !== 0) {
				this._writeQueue.push({
					buffer,
					offset: 0
				});
				if (this._writeQueue.length === 1) this._processWriteQueue();
			}
		};
		CustomWriteStream.prototype._processWriteQueue = function() {
			var _this = this;
			this._writeImmediate = void 0;
			if (this._writeQueue.length === 0) return;
			var task = this._writeQueue[0];
			fs.write(this._fd, task.buffer, task.offset, function(err, written) {
				if (err) {
					if ("code" in err && err.code === "EAGAIN") _this._writeImmediate = setImmediate(function() {
						return _this._processWriteQueue();
					});
					else {
						_this._writeQueue.length = 0;
						console.error("Unhandled pty write error", err);
					}
					return;
				}
				task.offset += written;
				if (task.offset >= task.buffer.byteLength) _this._writeQueue.shift();
				_this._processWriteQueue();
			});
		};
		return CustomWriteStream;
	}();
}));

//#endregion
//#region ../../../../../node_modules/node-pty/lib/index.js
var require_lib = /* @__PURE__ */ require_cli.__commonJSMin(((exports) => {
	/**
	* Copyright (c) 2012-2015, Christopher Jeffrey, Peter Sunde (MIT License)
	* Copyright (c) 2016, Daniel Imms (MIT License).
	* Copyright (c) 2018, Microsoft Corporation (MIT License).
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.native = exports.open = exports.createTerminal = exports.fork = exports.spawn = void 0;
	var utils_1 = require_utils();
	var terminalCtor;
	if (process.platform === "win32") terminalCtor = require_windowsTerminal().WindowsTerminal;
	else terminalCtor = require_unixTerminal().UnixTerminal;
	/**
	* Forks a process as a pseudoterminal.
	* @param file The file to launch.
	* @param args The file's arguments as argv (string[]) or in a pre-escaped
	* CommandLine format (string). Note that the CommandLine option is only
	* available on Windows and is expected to be escaped properly.
	* @param options The options of the terminal.
	* @throws When the file passed to spawn with does not exists.
	* @see CommandLineToArgvW https://msdn.microsoft.com/en-us/library/windows/desktop/bb776391(v=vs.85).aspx
	* @see Parsing C++ Comamnd-Line Arguments https://msdn.microsoft.com/en-us/library/17w5ykft.aspx
	* @see GetCommandLine https://msdn.microsoft.com/en-us/library/windows/desktop/ms683156.aspx
	*/
	function spawn(file, args, opt) {
		return new terminalCtor(file, args, opt);
	}
	exports.spawn = spawn;
	/** @deprecated */
	function fork(file, args, opt) {
		return new terminalCtor(file, args, opt);
	}
	exports.fork = fork;
	/** @deprecated */
	function createTerminal(file, args, opt) {
		return new terminalCtor(file, args, opt);
	}
	exports.createTerminal = createTerminal;
	function open(options) {
		return terminalCtor.open(options);
	}
	exports.open = open;
	/**
	* Expose the native API when not Windows, note that this is not public API and
	* could be removed at any time.
	*/
	exports.native = process.platform !== "win32" ? utils_1.loadNativeModule("pty").module : null;
}));

//#endregion
//#region src/backend/terminal.ts
const MAX_SCROLLBACK = 5e4;
var SessionStore = class {
	scrollback = [];
	append(data) {
		this.scrollback.push(data);
		if (this.scrollback.length > MAX_SCROLLBACK * 1.5) this.scrollback = this.scrollback.slice(-MAX_SCROLLBACK);
	}
	getAll() {
		return this.scrollback.join("");
	}
	clear() {
		this.scrollback = [];
	}
};
let pty = null;
let ptyLoadError = null;
try {
	pty = require_lib();
} catch (err) {
	ptyLoadError = err instanceof Error ? err.message : String(err);
}
const DISCONNECT_TIMEOUT_MS = 6e4;
const STATUS_INTERVAL_MS = 1e3;
const ACTIVE_THRESHOLD_MS = 2e3;
function ptyLog(level, ...args) {
	const ts = (/* @__PURE__ */ new Date()).toISOString();
	const msg = args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" ");
	console.error(`[${ts}] [${level}] [pty-manager] ${msg}`);
}
var PtyManager = class PtyManager {
	static instance = null;
	session = null;
	connectedClients = /* @__PURE__ */ new Set();
	lastOutputTime = 0;
	statusInterval = null;
	static getInstance() {
		if (!PtyManager.instance) PtyManager.instance = new PtyManager();
		return PtyManager.instance;
	}
	spawn(opts) {
		if (!pty) {
			ptyLog("ERROR", `node-pty not available: ${ptyLoadError}`);
			this.broadcastToClients({
				type: "output",
				data: `\r\n\x1b[31mTerminal unavailable: node-pty is not installed.\r\nError: ${ptyLoadError}\r\nRun: npm install node-pty\x1b[0m\r\n`
			});
			return;
		}
		if (this.session) {
			ptyLog("INFO", "Killing existing session before spawn");
			this.kill();
		}
		const isWin = process.platform === "win32";
		const shell = isWin ? "cmd.exe" : "/bin/sh";
		const claudeCmd = `claude${opts.skipPermissions ? " --dangerously-skip-permissions" : ""}`;
		const shellArgs = isWin ? ["/c", claudeCmd] : ["-c", claudeCmd];
		ptyLog("INFO", `Spawning: shell=${shell}, args=${JSON.stringify(shellArgs)}, cwd=${opts.cwd}`);
		const proc = pty.spawn(shell, shellArgs, {
			name: "xterm-256color",
			cols: opts.cols ?? 120,
			rows: opts.rows ?? 30,
			cwd: opts.cwd,
			env: process.env
		});
		ptyLog("INFO", `Process spawned with pid=${proc.pid}`);
		const store = new SessionStore();
		this.session = {
			process: proc,
			pid: proc.pid,
			startTime: Date.now(),
			cwd: opts.cwd,
			skipPermissions: opts.skipPermissions,
			disconnectTimer: null,
			store
		};
		this.lastOutputTime = Date.now();
		proc.onData((data) => {
			this.lastOutputTime = Date.now();
			store.append(data);
			if (this.session?.pid === proc.pid) this.broadcastToClients({
				type: "output",
				data
			});
		});
		proc.onExit(({ exitCode }) => {
			ptyLog("INFO", `Process exited with code=${exitCode}`);
			if (this.session?.pid !== proc.pid) {
				ptyLog("INFO", `Ignoring stale exit for old pid=${proc.pid}`);
				return;
			}
			this.broadcastToClients({
				type: "exit",
				code: exitCode
			});
			this.stopStatusBroadcast();
			this.session = null;
		});
		this.broadcastToClients({
			type: "started",
			pid: proc.pid
		});
		this.startStatusBroadcast();
	}
	write(data) {
		if (this.session) this.session.process.write(data);
	}
	resize(cols, rows) {
		if (this.session) this.session.process.resize(cols, rows);
	}
	kill() {
		if (this.session) {
			this.stopStatusBroadcast();
			try {
				this.session.process.kill();
			} catch {}
			if (this.session.disconnectTimer) clearTimeout(this.session.disconnectTimer);
			this.session = null;
		}
	}
	getStatus() {
		if (!this.session) return null;
		return {
			pid: this.session.pid,
			uptime: Math.floor((Date.now() - this.session.startTime) / 1e3),
			cwd: this.session.cwd,
			memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024 * 10) / 10,
			isActive: Date.now() - this.lastOutputTime < ACTIVE_THRESHOLD_MS,
			skipPermissions: this.session.skipPermissions,
			alive: true
		};
	}
	addClient(ws) {
		this.connectedClients.add(ws);
		if (this.session?.disconnectTimer) {
			clearTimeout(this.session.disconnectTimer);
			this.session.disconnectTimer = null;
		}
		if (this.session) {
			const scrollback = this.session.store.getAll();
			if (scrollback) ws.send(JSON.stringify({
				type: "scrollback",
				data: scrollback
			}));
			const status = this.getStatus();
			if (status) ws.send(JSON.stringify({
				type: "status",
				...status
			}));
		}
	}
	removeClient(ws) {
		this.connectedClients.delete(ws);
		if (this.connectedClients.size === 0 && this.session) this.session.disconnectTimer = setTimeout(() => {
			console.error("[pty] No clients connected for 60s, killing process");
			this.kill();
		}, DISCONNECT_TIMEOUT_MS);
	}
	isAlive() {
		return this.session !== null;
	}
	isAvailable() {
		return pty !== null;
	}
	broadcastToClients(message) {
		const data = JSON.stringify(message);
		for (const client of this.connectedClients) if (client.readyState === 1) client.send(data);
	}
	startStatusBroadcast() {
		this.stopStatusBroadcast();
		this.statusInterval = setInterval(() => {
			const status = this.getStatus();
			if (status) this.broadcastToClients({
				type: "status",
				...status
			});
		}, STATUS_INTERVAL_MS);
	}
	stopStatusBroadcast() {
		if (this.statusInterval) {
			clearInterval(this.statusInterval);
			this.statusInterval = null;
		}
	}
};

//#endregion
//#region src/backend/server.ts
/**
* MAXSIM Backend Server — Unified persistent backend service
*
* Consolidates HTTP API, WebSocket, MCP endpoint, terminal management,
* and file watching into a single per-project process.
*
* CRITICAL: Never import output() or error() from core — they call process.exit().
* CRITICAL: Never write to stdout directly — stdout may be reserved for protocol use.
* All logging must go to stderr via console.error().
*/
function log(level, tag, ...args) {
	const ts = (/* @__PURE__ */ new Date()).toISOString();
	const msg = args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" ");
	console.error(`[${ts}] [${level}] [${tag}] ${msg}`);
}
function isWithinPlanning(cwd, targetPath) {
	const planningDir = node_path.resolve(cwd, ".planning");
	return node_path.resolve(cwd, targetPath).startsWith(planningDir);
}
function normalizeFsPath(p) {
	return p.replace(/\\/g, "/");
}
function parseRoadmap(cwd) {
	const roadmapPath = node_path.join(cwd, ".planning", "ROADMAP.md");
	if (!node_fs.existsSync(roadmapPath)) return null;
	const content = node_fs.readFileSync(roadmapPath, "utf-8").replace(/\r\n/g, "\n");
	const phasesDir = node_path.join(cwd, ".planning", "phases");
	const phasePattern = require_cli.getPhasePattern();
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
		const normalized = require_cli.normalizePhaseName(phaseNum);
		let diskStatus = "no_directory";
		let planCount = 0;
		let summaryCount = 0;
		let hasContext = false;
		let hasResearch = false;
		try {
			const dirMatch = node_fs.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).find((d) => d.startsWith(normalized + "-") || d === normalized);
			if (dirMatch) {
				const phaseFiles = node_fs.readdirSync(node_path.join(phasesDir, dirMatch));
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
		} catch {}
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
	return {
		milestones,
		phases,
		phase_count: phases.length,
		completed_phases: completedPhases,
		total_plans: totalPlans,
		total_summaries: totalSummaries,
		progress_percent: totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0,
		current_phase: currentPhase ? currentPhase.number : null,
		next_phase: nextPhase ? nextPhase.number : null,
		missing_phase_details: null
	};
}
function parseState(cwd) {
	const statePath = node_path.join(cwd, ".planning", "STATE.md");
	if (!node_fs.existsSync(statePath)) return null;
	const content = node_fs.readFileSync(statePath, "utf-8").replace(/\r\n/g, "\n");
	const position = require_cli.stateExtractField(content, "Current Position") || require_cli.stateExtractField(content, "Phase");
	const lastActivity = require_cli.stateExtractField(content, "Last activity") || require_cli.stateExtractField(content, "Last Activity");
	const currentPhase = require_cli.stateExtractField(content, "Current Phase") || require_cli.stateExtractField(content, "Phase");
	const currentPlan = require_cli.stateExtractField(content, "Current Plan") || require_cli.stateExtractField(content, "Plan");
	const status = require_cli.stateExtractField(content, "Status");
	const progress = require_cli.stateExtractField(content, "Progress");
	const decisions = [];
	const decisionsMatch = content.match(/###?\s*Decisions\s*\n([\s\S]*?)(?=\n###?|\n##[^#]|$)/i);
	if (decisionsMatch) {
		const items = decisionsMatch[1].match(/^-\s+(.+)$/gm) || [];
		for (const item of items) decisions.push(item.replace(/^-\s+/, "").trim());
	}
	const blockers = [];
	const blockersMatch = content.match(/###?\s*(?:Blockers|Blockers\/Concerns)\s*\n([\s\S]*?)(?=\n###?|\n##[^#]|$)/i);
	if (blockersMatch) {
		const items = blockersMatch[1].match(/^-\s+(.+)$/gm) || [];
		for (const item of items) blockers.push(item.replace(/^-\s+/, "").trim());
	}
	return {
		position,
		lastActivity,
		currentPhase,
		currentPlan,
		status,
		progress,
		decisions,
		blockers,
		content
	};
}
function parsePhases(cwd) {
	const phasesDir = node_path.join(cwd, ".planning", "phases");
	if (!node_fs.existsSync(phasesDir)) return [];
	const phases = [];
	try {
		const dirs = node_fs.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => require_cli.comparePhaseNum(a, b));
		for (const dir of dirs) {
			const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)-?(.*)/i);
			const phaseNum = dm ? dm[1] : dir;
			const phaseName = dm && dm[2] ? dm[2].replace(/-/g, " ") : "";
			const phaseFiles = node_fs.readdirSync(node_path.join(phasesDir, dir));
			const planCount = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md").length;
			const summaryCount = phaseFiles.filter((f) => f.endsWith("-SUMMARY.md") || f === "SUMMARY.md").length;
			const hasContext = phaseFiles.some((f) => f.endsWith("-CONTEXT.md") || f === "CONTEXT.md");
			const hasResearch = phaseFiles.some((f) => f.endsWith("-RESEARCH.md") || f === "RESEARCH.md");
			let diskStatus = "no_directory";
			if (summaryCount >= planCount && planCount > 0) diskStatus = "complete";
			else if (summaryCount > 0) diskStatus = "partial";
			else if (planCount > 0) diskStatus = "planned";
			else if (hasResearch) diskStatus = "researched";
			else if (hasContext) diskStatus = "discussed";
			else diskStatus = "empty";
			phases.push({
				number: phaseNum,
				name: phaseName,
				goal: "",
				dependsOn: [],
				planCount,
				summaryCount,
				diskStatus,
				roadmapComplete: diskStatus === "complete",
				hasContext,
				hasResearch
			});
		}
	} catch {}
	return phases;
}
function parsePhaseDetail(cwd, phaseId) {
	const phasesDir = node_path.join(cwd, ".planning", "phases");
	if (!node_fs.existsSync(phasesDir)) return null;
	const normalized = require_cli.normalizePhaseName(phaseId);
	try {
		const dirMatch = node_fs.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).find((d) => d.startsWith(normalized + "-") || d === normalized);
		if (!dirMatch) return null;
		const phaseDir = node_path.join(phasesDir, dirMatch);
		const phaseFiles = node_fs.readdirSync(phaseDir);
		const planFileNames = phaseFiles.filter((f) => f.endsWith("-PLAN.md") || f === "PLAN.md").sort();
		const plans = [];
		for (const planFileName of planFileNames) {
			const planPath = node_path.join(phaseDir, planFileName);
			const content = node_fs.readFileSync(planPath, "utf-8").replace(/\r\n/g, "\n");
			const frontmatter = require_cli.extractFrontmatter(content);
			const tasks = [];
			const taskRegex = /<task\s+type="([^"]*)"[^>]*>\s*<name>([^<]+)<\/name>([\s\S]*?)<\/task>/g;
			let taskMatch;
			while ((taskMatch = taskRegex.exec(content)) !== null) {
				const taskType = taskMatch[1];
				const taskName = taskMatch[2].trim();
				const taskBody = taskMatch[3];
				const filesMatch = taskBody.match(/<files>([\s\S]*?)<\/files>/);
				const actionMatch = taskBody.match(/<action>([\s\S]*?)<\/action>/);
				const verifyMatch = taskBody.match(/<verify>([\s\S]*?)<\/verify>/);
				const doneMatch = taskBody.match(/<done>([\s\S]*?)<\/done>/);
				const files = filesMatch ? filesMatch[1].trim().split("\n").map((f) => f.trim()).filter(Boolean) : [];
				const doneText = doneMatch ? doneMatch[1].trim() : "";
				tasks.push({
					name: taskName,
					type: taskType,
					files,
					action: actionMatch ? actionMatch[1].trim() : "",
					verify: verifyMatch ? verifyMatch[1].trim() : "",
					done: doneText,
					completed: /^\[x\]/i.test(doneText)
				});
			}
			plans.push({
				path: node_path.join(".planning", "phases", dirMatch, planFileName),
				content,
				frontmatter,
				tasks
			});
		}
		let context = null;
		const contextFile = phaseFiles.find((f) => f.endsWith("-CONTEXT.md") || f === "CONTEXT.md");
		if (contextFile) context = node_fs.readFileSync(node_path.join(phaseDir, contextFile), "utf-8");
		let research = null;
		const researchFile = phaseFiles.find((f) => f.endsWith("-RESEARCH.md") || f === "RESEARCH.md");
		if (researchFile) research = node_fs.readFileSync(node_path.join(phaseDir, researchFile), "utf-8");
		return {
			plans,
			context,
			research
		};
	} catch {
		return null;
	}
}
function parseTodos(cwd) {
	const pendingDir = node_path.join(cwd, ".planning", "todos", "pending");
	const completedDir = node_path.join(cwd, ".planning", "todos", "completed");
	const pending = [];
	const completed = [];
	if (node_fs.existsSync(pendingDir)) try {
		const files = node_fs.readdirSync(pendingDir).filter((f) => f.endsWith(".md"));
		for (const file of files) try {
			const titleMatch = node_fs.readFileSync(node_path.join(pendingDir, file), "utf-8").match(/^title:\s*(.+)$/m);
			pending.push({
				text: titleMatch ? titleMatch[1].trim() : file.replace(".md", ""),
				completed: false,
				file
			});
		} catch {}
	} catch {}
	if (node_fs.existsSync(completedDir)) try {
		const files = node_fs.readdirSync(completedDir).filter((f) => f.endsWith(".md"));
		for (const file of files) try {
			const titleMatch = node_fs.readFileSync(node_path.join(completedDir, file), "utf-8").match(/^title:\s*(.+)$/m);
			completed.push({
				text: titleMatch ? titleMatch[1].trim() : file.replace(".md", ""),
				completed: true,
				file
			});
		} catch {}
	} catch {}
	return {
		pending,
		completed
	};
}
function parseProject(cwd) {
	const projectPath = node_path.join(cwd, ".planning", "PROJECT.md");
	const requirementsPath = node_path.join(cwd, ".planning", "REQUIREMENTS.md");
	return {
		project: node_fs.existsSync(projectPath) ? node_fs.readFileSync(projectPath, "utf-8") : null,
		requirements: node_fs.existsSync(requirementsPath) ? node_fs.readFileSync(requirementsPath, "utf-8") : null
	};
}
function createBackendServer(config) {
	const { projectCwd, host, enableTerminal, enableFileWatcher, enableMcp, logDir } = config;
	let resolvedPort = config.port;
	const startTime = Date.now();
	let serverReady = false;
	node_fs.mkdirSync(logDir, { recursive: true });
	const suppressedPaths = /* @__PURE__ */ new Map();
	const SUPPRESS_TTL_MS = 500;
	function suppressPath(filePath) {
		suppressedPaths.set(normalizeFsPath(filePath), Date.now());
	}
	function isSuppressed(filePath) {
		const normalized = normalizeFsPath(filePath);
		const timestamp = suppressedPaths.get(normalized);
		if (timestamp === void 0) return false;
		if (Date.now() - timestamp > SUPPRESS_TTL_MS) {
			suppressedPaths.delete(normalized);
			return false;
		}
		return true;
	}
	const cleanupInterval = setInterval(() => {
		const now = Date.now();
		for (const [p, ts] of suppressedPaths.entries()) if (now - ts > SUPPRESS_TTL_MS) suppressedPaths.delete(p);
	}, 6e4);
	cleanupInterval.unref();
	const questionQueue = [];
	const pendingAnswers = /* @__PURE__ */ new Map();
	let clientCount = 0;
	const wss = new ws.WebSocketServer({ noServer: true });
	wss.on("connection", (ws$1) => {
		clientCount++;
		log("INFO", "ws", `Client connected (${clientCount} total)`);
		ws$1.on("close", () => {
			clientCount--;
			log("INFO", "ws", `Client disconnected (${clientCount} total)`);
		});
		ws$1.on("error", (err) => {
			log("ERROR", "ws", `Client error: ${err.message}`);
		});
		ws$1.send(JSON.stringify({
			type: "connected",
			timestamp: Date.now()
		}));
		if (questionQueue.length > 0) ws$1.send(JSON.stringify({
			type: "questions-queued",
			questions: questionQueue,
			count: questionQueue.length
		}));
	});
	function broadcast(message) {
		const data = JSON.stringify(message);
		for (const client of wss.clients) if (client.readyState === ws.WebSocket.OPEN) client.send(data);
	}
	let watcher = null;
	async function setupWatcher() {
		if (!enableFileWatcher) return;
		const planningDir = node_path.join(projectCwd, ".planning");
		if (!node_fs.existsSync(planningDir)) {
			log("WARN", "watcher", `.planning/ directory not found at ${planningDir}`);
			return;
		}
		try {
			const chokidar = await import("chokidar");
			const changedPaths = /* @__PURE__ */ new Set();
			let flushTimer = null;
			function flushChanges() {
				if (changedPaths.size > 0) {
					const changes = Array.from(changedPaths);
					changedPaths.clear();
					log("INFO", "watcher", `Broadcasting ${changes.length} change(s)`);
					broadcast({
						type: "file-changes",
						changes,
						timestamp: Date.now()
					});
				}
			}
			function onFileChange(filePath) {
				const normalized = normalizeFsPath(filePath);
				if (isSuppressed(normalized)) return;
				changedPaths.add(normalized);
				if (flushTimer) clearTimeout(flushTimer);
				flushTimer = setTimeout(flushChanges, 500);
			}
			const w = chokidar.watch(planningDir, {
				persistent: true,
				ignoreInitial: true,
				depth: 5
			});
			w.on("add", onFileChange);
			w.on("change", onFileChange);
			w.on("unlink", onFileChange);
			w.on("error", (err) => {
				log("ERROR", "watcher", `Error: ${err.message}`);
			});
			watcher = w;
			log("INFO", "watcher", `Watching ${planningDir}`);
		} catch (err) {
			log("ERROR", "watcher", `Failed to start file watcher: ${err.message}`);
		}
	}
	const app = (0, express.default)();
	app.use(express.default.json());
	app.get("/api/health", (_req, res) => {
		res.json({
			status: "ok",
			ready: serverReady,
			port: resolvedPort,
			cwd: projectCwd,
			uptime: (Date.now() - startTime) / 1e3,
			pid: process.pid,
			mcpEndpoint: enableMcp ? `http://127.0.0.1:${resolvedPort}/mcp` : null,
			terminalAvailable: enableTerminal && PtyManager.getInstance().isAvailable(),
			connectedClients: clientCount
		});
	});
	app.get("/api/ready", (_req, res) => {
		if (serverReady) return res.json({
			ready: true,
			port: resolvedPort,
			cwd: projectCwd
		});
		return res.status(503).json({
			ready: false,
			message: "Server is starting up"
		});
	});
	app.get("/api/roadmap", (_req, res) => {
		try {
			const data = parseRoadmap(projectCwd);
			if (!data) return res.status(404).json({ error: "ROADMAP.md not found" });
			return res.json(data);
		} catch (err) {
			log("ERROR", "api", `GET /api/roadmap failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.patch("/api/roadmap", (req, res) => {
		try {
			const roadmapPath = node_path.join(projectCwd, ".planning", "ROADMAP.md");
			if (!node_fs.existsSync(roadmapPath)) return res.status(404).json({ error: "ROADMAP.md not found" });
			const { phaseNumber, checked } = req.body;
			if (!phaseNumber || checked === void 0) return res.status(400).json({ error: "phaseNumber and checked are required" });
			let content = node_fs.readFileSync(roadmapPath, "utf-8").replace(/\r\n/g, "\n");
			const escapedNum = phaseNumber.replace(".", "\\.");
			const pattern = new RegExp(`(-\\s*\\[)(x| )(\\]\\s*.*Phase\\s+${escapedNum})`, "i");
			if (!content.match(pattern)) return res.status(404).json({ error: `Phase ${phaseNumber} checkbox not found` });
			content = content.replace(pattern, `$1${checked ? "x" : " "}$3`);
			suppressPath(roadmapPath);
			node_fs.writeFileSync(roadmapPath, content, "utf-8");
			return res.json({
				updated: true,
				phaseNumber,
				checked
			});
		} catch (err) {
			log("ERROR", "api", `PATCH /api/roadmap failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.get("/api/state", (_req, res) => {
		try {
			const data = parseState(projectCwd);
			if (!data) return res.status(404).json({ error: "STATE.md not found" });
			return res.json(data);
		} catch (err) {
			log("ERROR", "api", `GET /api/state failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.patch("/api/state", (req, res) => {
		try {
			const statePath = node_path.join(projectCwd, ".planning", "STATE.md");
			if (!node_fs.existsSync(statePath)) return res.status(404).json({ error: "STATE.md not found" });
			const { field, value } = req.body;
			if (!field || value === void 0) return res.status(400).json({ error: "field and value are required" });
			const updated = require_cli.stateReplaceField(node_fs.readFileSync(statePath, "utf-8").replace(/\r\n/g, "\n"), field, value);
			if (!updated) return res.status(404).json({ error: `Field "${field}" not found in STATE.md` });
			suppressPath(statePath);
			node_fs.writeFileSync(statePath, updated, "utf-8");
			return res.json({
				updated: true,
				field
			});
		} catch (err) {
			log("ERROR", "api", `PATCH /api/state failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	function ensureStateMd(statePath) {
		if (node_fs.existsSync(statePath)) return;
		const planningDir = node_path.dirname(statePath);
		node_fs.mkdirSync(planningDir, { recursive: true });
		const template = `# Project State

## Current Position

Phase: 1
Status: In progress
Last activity: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]} — State file created

## Accumulated Context

### Decisions

None yet.

### Blockers/Concerns

None yet.
`;
		node_fs.writeFileSync(statePath, template, "utf-8");
	}
	function appendToStateSection(statePath, sectionPattern, entry, fallbackSection) {
		let content = node_fs.readFileSync(statePath, "utf-8").replace(/\r\n/g, "\n");
		const match = content.match(sectionPattern);
		if (match) {
			let sectionBody = match[2];
			sectionBody = sectionBody.replace(/None yet\.?\s*\n?/gi, "").replace(/No decisions yet\.?\s*\n?/gi, "").replace(/None\.?\s*\n?/gi, "");
			sectionBody = sectionBody.trimEnd() + "\n" + entry + "\n";
			content = content.replace(sectionPattern, (_m, header) => `${header}${sectionBody}`);
		} else content = content.trimEnd() + "\n\n" + fallbackSection + "\n" + entry + "\n";
		suppressPath(statePath);
		node_fs.writeFileSync(statePath, content, "utf-8");
	}
	app.post("/api/state/decision", (req, res) => {
		try {
			const statePath = node_path.join(projectCwd, ".planning", "STATE.md");
			ensureStateMd(statePath);
			const { phase, text } = req.body;
			if (!text?.trim()) return res.status(400).json({ error: "text is required" });
			const entry = `- [Phase ${phase?.trim() || "?"}]: ${text.trim()}`;
			appendToStateSection(statePath, /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i, entry, "### Decisions");
			return res.json({
				added: true,
				decision: entry
			});
		} catch (err) {
			log("ERROR", "api", `POST /api/state/decision failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.post("/api/state/blocker", (req, res) => {
		try {
			const statePath = node_path.join(projectCwd, ".planning", "STATE.md");
			ensureStateMd(statePath);
			const { text } = req.body;
			if (!text?.trim()) return res.status(400).json({ error: "text is required" });
			appendToStateSection(statePath, /(###?\s*(?:Blockers|Blockers\/Concerns|Concerns)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i, `- ${text.trim()}`, "### Blockers/Concerns");
			return res.json({
				added: true,
				blocker: text.trim()
			});
		} catch (err) {
			log("ERROR", "api", `POST /api/state/blocker failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.get("/api/phases", (_req, res) => {
		try {
			return res.json(parsePhases(projectCwd));
		} catch (err) {
			log("ERROR", "api", `GET /api/phases failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.get("/api/phase/:id", (req, res) => {
		try {
			const data = parsePhaseDetail(projectCwd, req.params.id);
			if (!data) return res.status(404).json({ error: `Phase ${req.params.id} not found` });
			return res.json(data);
		} catch (err) {
			log("ERROR", "api", `GET /api/phase/:id failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.get("/api/todos", (_req, res) => {
		try {
			return res.json(parseTodos(projectCwd));
		} catch (err) {
			log("ERROR", "api", `GET /api/todos failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.post("/api/todos", (req, res) => {
		try {
			const pendingDir = node_path.join(projectCwd, ".planning", "todos", "pending");
			const { text } = req.body;
			if (!text) return res.status(400).json({ error: "text is required" });
			node_fs.mkdirSync(pendingDir, { recursive: true });
			const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
			const filename = `${timestamp}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.md`;
			const filePath = node_path.join(pendingDir, filename);
			const content = `title: ${text}\ncreated: ${timestamp}\narea: general\n\n${text}\n`;
			suppressPath(filePath);
			node_fs.writeFileSync(filePath, content, "utf-8");
			return res.json({
				created: true,
				file: filename,
				text
			});
		} catch (err) {
			log("ERROR", "api", `POST /api/todos failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.patch("/api/todos", (req, res) => {
		try {
			const pendingDir = node_path.join(projectCwd, ".planning", "todos", "pending");
			const completedDir = node_path.join(projectCwd, ".planning", "todos", "completed");
			const { file, completed } = req.body;
			if (!file) return res.status(400).json({ error: "file is required" });
			if (file.includes("/") || file.includes("\\") || file.includes("..")) return res.status(400).json({ error: "Invalid filename" });
			if (completed) {
				const sourcePath = node_path.join(pendingDir, file);
				if (!node_fs.existsSync(sourcePath)) return res.status(404).json({ error: "Todo not found in pending" });
				node_fs.mkdirSync(completedDir, { recursive: true });
				const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
				let content = node_fs.readFileSync(sourcePath, "utf-8");
				content = `completed: ${today}\n` + content;
				const destPath = node_path.join(completedDir, file);
				suppressPath(sourcePath);
				suppressPath(destPath);
				node_fs.writeFileSync(destPath, content, "utf-8");
				node_fs.unlinkSync(sourcePath);
				return res.json({
					completed: true,
					file,
					date: today
				});
			} else {
				const sourcePath = node_path.join(completedDir, file);
				if (!node_fs.existsSync(sourcePath)) return res.status(404).json({ error: "Todo not found in completed" });
				node_fs.mkdirSync(pendingDir, { recursive: true });
				let content = node_fs.readFileSync(sourcePath, "utf-8");
				content = content.replace(/^completed:\s*.+\n/m, "");
				const destPath = node_path.join(pendingDir, file);
				suppressPath(sourcePath);
				suppressPath(destPath);
				node_fs.writeFileSync(destPath, content, "utf-8");
				node_fs.unlinkSync(sourcePath);
				return res.json({
					completed: false,
					file
				});
			}
		} catch (err) {
			log("ERROR", "api", `PATCH /api/todos failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.get("/api/project", (_req, res) => {
		try {
			return res.json(parseProject(projectCwd));
		} catch (err) {
			log("ERROR", "api", `GET /api/project failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.get("/api/plan/*", (req, res) => {
		try {
			const pathSegments = req.params["0"].split("/");
			const relativePath = node_path.join(".planning", ...pathSegments);
			if (!isWithinPlanning(projectCwd, relativePath)) return res.status(403).json({ error: "Path traversal not allowed" });
			const fullPath = node_path.join(projectCwd, relativePath);
			if (!node_fs.existsSync(fullPath)) return res.status(404).json({ error: "File not found" });
			const content = node_fs.readFileSync(fullPath, "utf-8");
			return res.json({
				path: relativePath,
				content
			});
		} catch (err) {
			log("ERROR", "api", `GET /api/plan/* failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.put("/api/plan/*", (req, res) => {
		try {
			const pathSegments = req.params["0"].split("/");
			const relativePath = node_path.join(".planning", ...pathSegments);
			if (!isWithinPlanning(projectCwd, relativePath)) return res.status(403).json({ error: "Path traversal not allowed" });
			const { content } = req.body;
			if (content === void 0) return res.status(400).json({ error: "content is required" });
			const fullPath = node_path.join(projectCwd, relativePath);
			const dir = node_path.dirname(fullPath);
			if (!node_fs.existsSync(dir)) node_fs.mkdirSync(dir, { recursive: true });
			suppressPath(fullPath);
			node_fs.writeFileSync(fullPath, content, "utf-8");
			return res.json({
				written: true,
				path: relativePath
			});
		} catch (err) {
			log("ERROR", "api", `PUT /api/plan/* failed: ${err.message}`);
			return res.status(500).json({ error: "Internal server error" });
		}
	});
	app.get("/api/server-info", (_req, res) => {
		const localNetworkIp = getLocalNetworkIp();
		return res.json({
			localUrl: `http://127.0.0.1:${resolvedPort}`,
			networkUrl: localNetworkIp ? `http://${localNetworkIp}:${resolvedPort}` : null,
			projectName: node_path.basename(projectCwd),
			projectCwd
		});
	});
	let shutdownFn = null;
	app.post("/api/shutdown", (_req, res) => {
		res.json({ shutdown: true });
		setTimeout(() => shutdownFn?.(), 100);
	});
	app.post("/api/mcp-answer", (req, res) => {
		const { questionId, answer } = req.body;
		if (!questionId || !answer) return res.status(400).json({ error: "questionId and answer are required" });
		const resolve = pendingAnswers.get(questionId);
		if (!resolve) return res.status(404).json({ error: "No pending question with that ID" });
		pendingAnswers.delete(questionId);
		resolve(answer);
		return res.json({ answered: true });
	});
	if (enableMcp) {
		app.post("/mcp", async (req, res) => {
			const mcpServer = new _modelcontextprotocol_sdk_server_mcp_js.McpServer({
				name: "maxsim-backend",
				version: "1.0.0"
			});
			registerAllTools(mcpServer);
			try {
				const transport = new _modelcontextprotocol_sdk_server_streamableHttp_js.StreamableHTTPServerTransport({ sessionIdGenerator: void 0 });
				await mcpServer.connect(transport);
				await transport.handleRequest(req, res, req.body);
				res.on("close", () => {
					transport.close();
					mcpServer.close();
				});
			} catch (error) {
				log("ERROR", "mcp", `Error handling MCP POST request: ${error}`);
				if (!res.headersSent) res.status(500).json({
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: "Internal server error"
					},
					id: null
				});
			}
		});
		app.get("/mcp", (_req, res) => {
			res.writeHead(405).end(JSON.stringify({
				jsonrpc: "2.0",
				error: {
					code: -32e3,
					message: "Method not allowed."
				},
				id: null
			}));
		});
		app.delete("/mcp", (_req, res) => {
			res.status(200).end();
		});
	}
	const terminalWss = new ws.WebSocketServer({ noServer: true });
	const ptyManager = enableTerminal ? PtyManager.getInstance() : null;
	if (ptyManager && !ptyManager.isAvailable()) log("WARN", "server", "node-pty not available — terminal features disabled");
	terminalWss.on("connection", (ws$2) => {
		if (!ptyManager) return;
		log("INFO", "terminal-ws", "Client connected");
		ptyManager.addClient(ws$2);
		if (!ptyManager.isAvailable()) ws$2.send(JSON.stringify({
			type: "unavailable",
			reason: "node-pty is not installed"
		}));
		ws$2.on("message", (raw) => {
			try {
				const msg = JSON.parse(typeof raw === "string" ? raw : raw.toString());
				switch (msg.type) {
					case "input":
						ptyManager.write(msg.data);
						break;
					case "resize":
						ptyManager.resize(msg.cols, msg.rows);
						break;
					case "spawn":
						try {
							ptyManager.spawn({
								skipPermissions: !!msg.skipPermissions,
								cwd: projectCwd,
								cols: msg.cols,
								rows: msg.rows
							});
						} catch (err) {
							const errMsg = err instanceof Error ? err.message : String(err);
							ws$2.send(JSON.stringify({
								type: "output",
								data: `\r\n\x1b[31mFailed to start terminal: ${errMsg}\x1b[0m\r\n`
							}));
						}
						break;
					case "kill":
						ptyManager.kill();
						break;
				}
			} catch (err) {
				log("ERROR", "terminal-ws", `Message handling error: ${err.message}`);
			}
		});
		ws$2.on("close", () => {
			log("INFO", "terminal-ws", "Client disconnected");
			ptyManager.removeClient(ws$2);
		});
		ws$2.on("error", (err) => {
			log("ERROR", "terminal-ws", `Client error: ${err.message}`);
		});
	});
	const server = (0, node_http.createServer)(app);
	server.on("upgrade", (req, socket, head) => {
		const url = req.url || "/";
		if (url === "/ws/terminal" || url.startsWith("/ws/terminal?")) terminalWss.handleUpgrade(req, socket, head, (ws$3) => {
			terminalWss.emit("connection", ws$3, req);
		});
		else if (url === "/api/ws" || url.startsWith("/api/ws?")) wss.handleUpgrade(req, socket, head, (ws$4) => {
			wss.emit("connection", ws$4, req);
		});
		else socket.destroy();
	});
	async function start() {
		const port = await (0, detect_port.default)(config.port);
		resolvedPort = port;
		await setupWatcher();
		return new Promise((resolve) => {
			server.listen(port, host, () => {
				serverReady = true;
				log("INFO", "server", `Backend ready on ${host}:${port} for ${projectCwd}`);
				if (enableMcp) log("INFO", "mcp", `MCP endpoint available at http://127.0.0.1:${port}/mcp`);
				resolve();
			});
		});
	}
	async function stop() {
		log("INFO", "server", "Shutting down...");
		clearInterval(cleanupInterval);
		if (ptyManager) ptyManager.kill();
		if (watcher) await watcher.close().catch(() => {});
		terminalWss.close(() => {});
		wss.close(() => {});
		return new Promise((resolve) => {
			server.close(() => {
				log("INFO", "server", "Server closed");
				resolve();
			});
		});
	}
	shutdownFn = () => {
		stop().then(() => process.exit(0)).catch(() => process.exit(1));
	};
	function getStatus() {
		return {
			status: serverReady ? "ok" : "starting",
			ready: serverReady,
			port: resolvedPort,
			cwd: projectCwd,
			uptime: (Date.now() - startTime) / 1e3,
			pid: process.pid,
			mcpEndpoint: enableMcp ? `http://127.0.0.1:${resolvedPort}/mcp` : null,
			terminalAvailable: ptyManager?.isAvailable() ?? false,
			connectedClients: clientCount
		};
	}
	function getPort() {
		return resolvedPort;
	}
	return {
		start,
		stop,
		getStatus,
		getPort
	};
}
function getLocalNetworkIp() {
	const ifaces = node_os.networkInterfaces();
	for (const iface of Object.values(ifaces)) for (const info of iface ?? []) if (info.family === "IPv4" && !info.internal) return info.address;
	return null;
}

//#endregion
exports.createBackendServer = createBackendServer;
//# sourceMappingURL=server-BFjpYgFI.cjs.map