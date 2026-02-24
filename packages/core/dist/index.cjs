Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
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
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_os = require("node:os");
node_os = __toESM(node_os);
let node_child_process = require("node:child_process");

//#region src/types.ts
function phaseNumber(value) {
	if (!value.match(/^\d+[A-Z]?(\.\d+)?$/i)) throw new Error(`Invalid phase number: ${value}`);
	return value;
}
function phasePath(value) {
	if (!value || typeof value !== "string") throw new Error(`Invalid phase path: ${value}`);
	return value;
}
function phaseSlug(value) {
	if (!value || typeof value !== "string") throw new Error(`Invalid phase slug: ${value}`);
	return value;
}
function ok(data) {
	return {
		success: true,
		data
	};
}
function err(error) {
	return {
		success: false,
		error
	};
}
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
//#region src/core.ts
/**
* Core — Shared utilities, constants, and internal helpers
*
* Ported from maxsim/bin/lib/core.cjs
*/
const MODEL_PROFILES = {
	"maxsim-planner": {
		quality: "opus",
		balanced: "opus",
		budget: "sonnet"
	},
	"maxsim-roadmapper": {
		quality: "opus",
		balanced: "sonnet",
		budget: "sonnet"
	},
	"maxsim-executor": {
		quality: "opus",
		balanced: "sonnet",
		budget: "sonnet"
	},
	"maxsim-phase-researcher": {
		quality: "opus",
		balanced: "sonnet",
		budget: "haiku"
	},
	"maxsim-project-researcher": {
		quality: "opus",
		balanced: "sonnet",
		budget: "haiku"
	},
	"maxsim-research-synthesizer": {
		quality: "sonnet",
		balanced: "sonnet",
		budget: "haiku"
	},
	"maxsim-debugger": {
		quality: "opus",
		balanced: "sonnet",
		budget: "sonnet"
	},
	"maxsim-codebase-mapper": {
		quality: "sonnet",
		balanced: "haiku",
		budget: "haiku"
	},
	"maxsim-verifier": {
		quality: "sonnet",
		balanced: "sonnet",
		budget: "haiku"
	},
	"maxsim-plan-checker": {
		quality: "sonnet",
		balanced: "sonnet",
		budget: "haiku"
	},
	"maxsim-integration-checker": {
		quality: "sonnet",
		balanced: "sonnet",
		budget: "haiku"
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
function isGitIgnored(cwd, targetPath) {
	try {
		(0, node_child_process.execSync)("git check-ignore -q -- " + targetPath.replace(/[^a-zA-Z0-9._\-/]/g, ""), {
			cwd,
			stdio: "pipe"
		});
		return true;
	} catch {
		return false;
	}
}
function execGit(cwd, args) {
	try {
		return {
			exitCode: 0,
			stdout: (0, node_child_process.execSync)("git " + args.map((a) => {
				if (/^[a-zA-Z0-9._\-/=:@]+$/.test(a)) return a;
				return "'" + a.replace(/'/g, "'\\''") + "'";
			}).join(" "), {
				cwd,
				stdio: "pipe",
				encoding: "utf-8"
			}).trim(),
			stderr: ""
		};
	} catch (thrown) {
		const err = thrown;
		return {
			exitCode: err.status ?? 1,
			stdout: (err.stdout ?? "").toString().trim(),
			stderr: (err.stderr ?? "").toString().trim()
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
	} catch {}
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
	} catch {}
	return results;
}
function getRoadmapPhaseInternal(cwd, phaseNum) {
	if (!phaseNum) return null;
	const roadmapPath = node_path.default.join(cwd, ".planning", "ROADMAP.md");
	if (!node_fs.default.existsSync(roadmapPath)) return null;
	try {
		const content = node_fs.default.readFileSync(roadmapPath, "utf-8");
		const escapedPhase = phaseNum.toString().replace(/\./g, "\\.");
		const phasePattern = new RegExp(`#{2,4}\\s*Phase\\s+${escapedPhase}:\\s*([^\\n]+)`, "i");
		const headerMatch = content.match(phasePattern);
		if (!headerMatch) return null;
		const phaseName = headerMatch[1].trim();
		const headerIndex = headerMatch.index;
		const nextHeaderMatch = content.slice(headerIndex).match(/\n#{2,4}\s+Phase\s+\d/i);
		const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index : content.length;
		const section = content.slice(headerIndex, sectionEnd).trim();
		const goalMatch = section.match(/\*\*Goal:\*\*\s*([^\n]+)/i);
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
	return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
//#region src/frontmatter.ts
/**
* Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
*
* Ported from maxsim/bin/lib/frontmatter.cjs
*/
/**
* Extract YAML frontmatter from markdown content into a typed object.
*/
function extractFrontmatter(content) {
	const frontmatter = {};
	const match = content.match(/^---\n([\s\S]+?)\n---/);
	if (!match) return frontmatter;
	const lines = match[1].split("\n");
	const stack = [{
		obj: frontmatter,
		key: null,
		indent: -1
	}];
	for (const line of lines) {
		if (line.trim() === "") continue;
		const indentMatch = line.match(/^(\s*)/);
		const indent = indentMatch ? indentMatch[1].length : 0;
		while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
		const current = stack[stack.length - 1];
		const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+):\s*(.*)/);
		if (keyMatch) {
			const key = keyMatch[2];
			const value = keyMatch[3].trim();
			if (value === "" || value === "[") {
				const newObj = value === "[" ? [] : {};
				current.obj[key] = newObj;
				current.key = null;
				stack.push({
					obj: newObj,
					key: null,
					indent
				});
			} else if (value.startsWith("[") && value.endsWith("]")) {
				current.obj[key] = value.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
				current.key = null;
			} else {
				current.obj[key] = value.replace(/^["']|["']$/g, "");
				current.key = null;
			}
		} else if (line.trim().startsWith("- ")) {
			const itemValue = line.trim().slice(2).replace(/^["']|["']$/g, "");
			if (typeof current.obj === "object" && !Array.isArray(current.obj) && Object.keys(current.obj).length === 0) {
				const parent = stack.length > 1 ? stack[stack.length - 2] : null;
				if (parent && !Array.isArray(parent.obj)) {
					for (const k of Object.keys(parent.obj)) if (parent.obj[k] === current.obj) {
						const arr = [itemValue];
						parent.obj[k] = arr;
						current.obj = arr;
						break;
					}
				}
			} else if (Array.isArray(current.obj)) current.obj.push(itemValue);
		}
	}
	return frontmatter;
}
/**
* Reconstruct YAML frontmatter string from an object.
*/
function reconstructFrontmatter(obj) {
	const lines = [];
	for (const [key, value] of Object.entries(obj)) {
		if (value === null || value === void 0) continue;
		if (Array.isArray(value)) formatArray(lines, key, value, 0);
		else if (typeof value === "object") {
			lines.push(`${key}:`);
			for (const [subkey, subval] of Object.entries(value)) {
				if (subval === null || subval === void 0) continue;
				if (Array.isArray(subval)) formatArray(lines, subkey, subval, 2);
				else if (typeof subval === "object") {
					lines.push(`  ${subkey}:`);
					for (const [subsubkey, subsubval] of Object.entries(subval)) {
						if (subsubval === null || subsubval === void 0) continue;
						if (Array.isArray(subsubval)) if (subsubval.length === 0) lines.push(`    ${subsubkey}: []`);
						else {
							lines.push(`    ${subsubkey}:`);
							for (const item of subsubval) lines.push(`      - ${item}`);
						}
						else lines.push(`    ${subsubkey}: ${subsubval}`);
					}
				} else {
					const sv = String(subval);
					lines.push(`  ${subkey}: ${sv.includes(":") || sv.includes("#") ? `"${sv}"` : sv}`);
				}
			}
		} else {
			const sv = String(value);
			if (sv.includes(":") || sv.includes("#") || sv.startsWith("[") || sv.startsWith("{")) lines.push(`${key}: "${sv}"`);
			else lines.push(`${key}: ${sv}`);
		}
	}
	return lines.join("\n");
}
function formatArray(lines, key, value, indentLevel) {
	const prefix = " ".repeat(indentLevel);
	if (value.length === 0) lines.push(`${prefix}${key}: []`);
	else if (value.every((v) => typeof v === "string") && value.length <= 3 && value.join(", ").length < 60) lines.push(`${prefix}${key}: [${value.join(", ")}]`);
	else {
		lines.push(`${prefix}${key}:`);
		for (const item of value) {
			const itemStr = String(item);
			lines.push(`${prefix}  - ${typeof item === "string" && (itemStr.includes(":") || itemStr.includes("#")) ? `"${itemStr}"` : itemStr}`);
		}
	}
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
* Parse a specific block from must_haves in raw frontmatter YAML.
*/
function parseMustHavesBlock(content, blockName) {
	const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
	if (!fmMatch) return [];
	const yaml = fmMatch[1];
	const blockPattern = new RegExp(`^\\s{4}${blockName}:\\s*$`, "m");
	const blockStart = yaml.search(blockPattern);
	if (blockStart === -1) return [];
	const blockLines = yaml.slice(blockStart).split("\n").slice(1);
	const items = [];
	let current = null;
	for (const line of blockLines) {
		if (line.trim() === "") continue;
		if (line.match(/^(\s*)/)[1].length <= 4 && line.trim() !== "") break;
		if (line.match(/^\s{6}-\s+/)) {
			if (current !== null) items.push(current);
			current = {};
			const simpleMatch = line.match(/^\s{6}-\s+"?([^"]+)"?\s*$/);
			if (simpleMatch && !line.includes(":")) current = simpleMatch[1];
			else {
				const kvMatch = line.match(/^\s{6}-\s+(\w+):\s*"?([^"]*)"?\s*$/);
				if (kvMatch) current = { [kvMatch[1]]: kvMatch[2] };
			}
		} else if (current !== null && typeof current === "object") {
			const kvMatch = line.match(/^\s{8,}(\w+):\s*"?([^"]*)"?\s*$/);
			if (kvMatch) {
				const val = kvMatch[2];
				current[kvMatch[1]] = /^\d+$/.test(val) ? parseInt(val, 10) : val;
			}
			const arrMatch = line.match(/^\s{10,}-\s+"?([^"]+)"?\s*$/);
			if (arrMatch) {
				const keys = Object.keys(current);
				const lastKey = keys[keys.length - 1];
				if (lastKey && !Array.isArray(current[lastKey])) current[lastKey] = current[lastKey] ? [String(current[lastKey])] : [];
				if (lastKey) current[lastKey].push(arrMatch[1]);
			}
		}
	}
	if (current !== null) items.push(current);
	return items;
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
//#region src/config.ts
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
//#region src/state.ts
/**
* State — STATE.md operations and progression engine
*
* Ported from maxsim/bin/lib/state.cjs
*/
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function stateExtractField(content, fieldName) {
	const pattern = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+)`, "i");
	const match = content.match(pattern);
	return match ? match[1].trim() : null;
}
function stateReplaceField(content, fieldName, newValue) {
	const escaped = escapeRegex(fieldName);
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
	} catch {}
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
		const fieldEscaped = escapeRegex(section);
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
			const fieldEscaped = escapeRegex(field);
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
		const fieldEscaped = escapeRegex(field);
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
//#region src/roadmap.ts
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
		const phasePattern = new RegExp(`#{2,4}\\s*Phase\\s+${escapedPhase}:\\s*([^\\n]+)`, "i");
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
		const goalMatch = section.match(/\*\*Goal:\*\*\s*([^\n]+)/i);
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
	const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:\s*([^\n]+)/gi;
	const phases = [];
	let match;
	while ((match = phasePattern.exec(content)) !== null) {
		const phaseNum = match[1];
		const phaseName = match[2].replace(/\(INSERTED\)/i, "").trim();
		const sectionStart = match.index;
		const nextHeader = content.slice(sectionStart).match(/\n#{2,4}\s+Phase\s+\d/i);
		const sectionEnd = nextHeader ? sectionStart + nextHeader.index : content.length;
		const section = content.slice(sectionStart, sectionEnd);
		const goalMatch = section.match(/\*\*Goal:\*\*\s*([^\n]+)/i);
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
//#region src/milestone.ts
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
			} catch {}
		}
	} catch {}
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
	} catch {}
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
//#region src/commands.ts
/**
* Commands — Standalone utility commands
*
* Ported from maxsim/bin/lib/commands.cjs
*/
function cmdGenerateSlug(text, raw) {
	if (!text) error("text required for slug generation");
	const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
		} catch {}
	} catch {}
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
	} catch {}
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
			} catch {}
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
function cmdCommit(cwd, message, files, raw, amend) {
	if (!message && !amend) error("commit message required");
	if (!loadConfig(cwd).commit_docs) {
		output({
			committed: false,
			hash: null,
			reason: "skipped_commit_docs_false"
		}, raw, "skipped");
		return;
	}
	if (isGitIgnored(cwd, ".planning")) {
		output({
			committed: false,
			hash: null,
			reason: "skipped_gitignored"
		}, raw, "skipped");
		return;
	}
	const filesToStage = files && files.length > 0 ? files : [".planning/"];
	for (const file of filesToStage) execGit(cwd, ["add", file]);
	const commitResult = execGit(cwd, amend ? [
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
	const hashResult = execGit(cwd, [
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
	} catch {}
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
//#region src/verify.ts
/**
* Verify — Verification suite, consistency, and health validation
*
* Ported from maxsim/bin/lib/verify.cjs
*/
function cmdVerifySummary(cwd, summaryPath, checkFileCount, raw) {
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
		const result = execGit(cwd, [
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
function cmdVerifyCommits(cwd, hashes, raw) {
	if (!hashes || hashes.length === 0) error("At least one commit hash required");
	const valid = [];
	const invalid = [];
	for (const hash of hashes) {
		const result = execGit(cwd, [
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
	const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:/gi;
	let m;
	while ((m = phasePattern.exec(roadmapContent)) !== null) roadmapPhases.add(m[1]);
	const diskPhases = /* @__PURE__ */ new Set();
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		for (const dir of dirs) {
			const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)?)/i);
			if (dm) diskPhases.add(dm[1]);
		}
	} catch {}
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
	} catch {}
	try {
		const dirs = node_fs.default.readdirSync(phasesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
		for (const dir of dirs) {
			const plans = node_fs.default.readdirSync(node_path.default.join(phasesDir, dir)).filter((f) => f.endsWith("-PLAN.md"));
			for (const plan of plans) if (!extractFrontmatter(node_fs.default.readFileSync(node_path.default.join(phasesDir, dir, plan), "utf-8")).wave) warnings.push(`${dir}/${plan}: missing 'wave' in frontmatter`);
		}
	} catch {}
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
		} catch {}
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
			"budget"
		];
		if (parsed.model_profile && !validProfiles.includes(parsed.model_profile)) addIssue("warning", "W004", `config.json: invalid model_profile "${parsed.model_profile}"`, `Valid values: ${validProfiles.join(", ")}`);
	} catch (thrown) {
		addIssue("error", "E005", `config.json: JSON parse error - ${thrown.message}`, "Run /maxsim:health --repair to reset to defaults", true);
		repairs.push("resetConfig");
	}
	try {
		const entries = node_fs.default.readdirSync(phasesDir, { withFileTypes: true });
		for (const e of entries) if (e.isDirectory() && !e.name.match(/^\d{2}(?:\.\d+)?-[\w-]+$/)) addIssue("warning", "W005", `Phase directory "${e.name}" doesn't follow NN-name format`, "Rename to match pattern (e.g., 01-setup)");
	} catch {}
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
	} catch {}
	if (node_fs.default.existsSync(roadmapPath)) {
		const roadmapContent = node_fs.default.readFileSync(roadmapPath, "utf-8");
		const roadmapPhases = /* @__PURE__ */ new Set();
		const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)?)\s*:/gi;
		let m;
		while ((m = phasePattern.exec(roadmapContent)) !== null) roadmapPhases.add(m[1]);
		const diskPhases = /* @__PURE__ */ new Set();
		try {
			const entries = node_fs.default.readdirSync(phasesDir, { withFileTypes: true });
			for (const e of entries) if (e.isDirectory()) {
				const dm = e.name.match(/^(\d+[A-Z]?(?:\.\d+)?)/i);
				if (dm) diskPhases.add(dm[1]);
			}
		} catch {}
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
//#region src/phase.ts
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
	} catch {}
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
	const phasePattern = /#{2,4}\s*Phase\s+(\d+)[A-Z]?(?:\.\d+)?:/gi;
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
	const afterPhaseEscaped = normalizePhaseName(afterPhase).replace(/^0+/, "").replace(/\./g, "\\.");
	if (!new RegExp(`#{2,4}\\s*Phase\\s+0*${afterPhaseEscaped}:`, "i").test(content)) error(`Phase ${afterPhase} not found in ROADMAP.md`);
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
	} catch {}
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
	} catch {}
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
		} catch {}
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
		} catch {}
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
	} catch {}
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
//#region src/template.ts
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
//#region src/init.ts
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
	} catch {}
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
	} catch {}
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
	} catch {}
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
	} catch {}
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
		} catch {}
	} catch {}
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
		} catch {}
	} catch {}
	const archiveDir = node_path.default.join(cwd, ".planning", "archive");
	let archivedMilestones = [];
	try {
		archivedMilestones = node_fs.default.readdirSync(archiveDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
	} catch {}
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
	} catch {}
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
	} catch {}
	let pausedAt = null;
	try {
		const pauseMatch = node_fs.default.readFileSync(node_path.default.join(cwd, ".planning", "STATE.md"), "utf-8").match(/\*\*Paused At:\*\*\s*(.+)/);
		if (pauseMatch) pausedAt = pauseMatch[1].trim();
	} catch {}
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
exports.FRONTMATTER_SCHEMAS = FRONTMATTER_SCHEMAS;
exports.MODEL_PROFILES = MODEL_PROFILES;
exports.PLANNING_CONFIG_DEFAULTS = PLANNING_CONFIG_DEFAULTS;
exports.cmdCommit = cmdCommit;
exports.cmdConfigEnsureSection = cmdConfigEnsureSection;
exports.cmdConfigGet = cmdConfigGet;
exports.cmdConfigSet = cmdConfigSet;
exports.cmdCurrentTimestamp = cmdCurrentTimestamp;
exports.cmdFindPhase = cmdFindPhase;
exports.cmdFrontmatterGet = cmdFrontmatterGet;
exports.cmdFrontmatterMerge = cmdFrontmatterMerge;
exports.cmdFrontmatterSet = cmdFrontmatterSet;
exports.cmdFrontmatterValidate = cmdFrontmatterValidate;
exports.cmdGenerateSlug = cmdGenerateSlug;
exports.cmdHistoryDigest = cmdHistoryDigest;
exports.cmdInitExecutePhase = cmdInitExecutePhase;
exports.cmdInitMapCodebase = cmdInitMapCodebase;
exports.cmdInitMilestoneOp = cmdInitMilestoneOp;
exports.cmdInitNewMilestone = cmdInitNewMilestone;
exports.cmdInitNewProject = cmdInitNewProject;
exports.cmdInitPhaseOp = cmdInitPhaseOp;
exports.cmdInitPlanPhase = cmdInitPlanPhase;
exports.cmdInitProgress = cmdInitProgress;
exports.cmdInitQuick = cmdInitQuick;
exports.cmdInitResume = cmdInitResume;
exports.cmdInitTodos = cmdInitTodos;
exports.cmdInitVerifyWork = cmdInitVerifyWork;
exports.cmdListTodos = cmdListTodos;
exports.cmdMilestoneComplete = cmdMilestoneComplete;
exports.cmdPhaseAdd = cmdPhaseAdd;
exports.cmdPhaseComplete = cmdPhaseComplete;
exports.cmdPhaseInsert = cmdPhaseInsert;
exports.cmdPhaseNextDecimal = cmdPhaseNextDecimal;
exports.cmdPhasePlanIndex = cmdPhasePlanIndex;
exports.cmdPhaseRemove = cmdPhaseRemove;
exports.cmdPhasesList = cmdPhasesList;
exports.cmdProgressRender = cmdProgressRender;
exports.cmdRequirementsMarkComplete = cmdRequirementsMarkComplete;
exports.cmdResolveModel = cmdResolveModel;
exports.cmdRoadmapAnalyze = cmdRoadmapAnalyze;
exports.cmdRoadmapGetPhase = cmdRoadmapGetPhase;
exports.cmdRoadmapUpdatePlanProgress = cmdRoadmapUpdatePlanProgress;
exports.cmdScaffold = cmdScaffold;
exports.cmdStateAddBlocker = cmdStateAddBlocker;
exports.cmdStateAddDecision = cmdStateAddDecision;
exports.cmdStateAdvancePlan = cmdStateAdvancePlan;
exports.cmdStateGet = cmdStateGet;
exports.cmdStateLoad = cmdStateLoad;
exports.cmdStatePatch = cmdStatePatch;
exports.cmdStateRecordMetric = cmdStateRecordMetric;
exports.cmdStateRecordSession = cmdStateRecordSession;
exports.cmdStateResolveBlocker = cmdStateResolveBlocker;
exports.cmdStateSnapshot = cmdStateSnapshot;
exports.cmdStateUpdate = cmdStateUpdate;
exports.cmdStateUpdateProgress = cmdStateUpdateProgress;
exports.cmdSummaryExtract = cmdSummaryExtract;
exports.cmdTemplateFill = cmdTemplateFill;
exports.cmdTemplateSelect = cmdTemplateSelect;
exports.cmdTodoComplete = cmdTodoComplete;
exports.cmdValidateConsistency = cmdValidateConsistency;
exports.cmdValidateHealth = cmdValidateHealth;
exports.cmdVerifyArtifacts = cmdVerifyArtifacts;
exports.cmdVerifyCommits = cmdVerifyCommits;
exports.cmdVerifyKeyLinks = cmdVerifyKeyLinks;
exports.cmdVerifyPathExists = cmdVerifyPathExists;
exports.cmdVerifyPhaseCompleteness = cmdVerifyPhaseCompleteness;
exports.cmdVerifyPlanStructure = cmdVerifyPlanStructure;
exports.cmdVerifyReferences = cmdVerifyReferences;
exports.cmdVerifySummary = cmdVerifySummary;
exports.cmdWebsearch = cmdWebsearch;
exports.comparePhaseNum = comparePhaseNum;
exports.err = err;
exports.error = error;
exports.execGit = execGit;
exports.extractFrontmatter = extractFrontmatter;
exports.findPhaseInternal = findPhaseInternal;
exports.generateSlugInternal = generateSlugInternal;
exports.getArchivedPhaseDirs = getArchivedPhaseDirs;
exports.getMilestoneInfo = getMilestoneInfo;
exports.getRoadmapPhaseInternal = getRoadmapPhaseInternal;
exports.isGitIgnored = isGitIgnored;
exports.loadConfig = loadConfig;
exports.normalizePhaseName = normalizePhaseName;
exports.ok = ok;
exports.output = output;
exports.parseMustHavesBlock = parseMustHavesBlock;
exports.pathExistsInternal = pathExistsInternal;
exports.phaseNumber = phaseNumber;
exports.phasePath = phasePath;
exports.phaseSlug = phaseSlug;
exports.reconstructFrontmatter = reconstructFrontmatter;
exports.resolveModelInternal = resolveModelInternal;
exports.safeReadFile = safeReadFile;
exports.spliceFrontmatter = spliceFrontmatter;
exports.stateExtractField = stateExtractField;
exports.stateReplaceField = stateReplaceField;
//# sourceMappingURL=index.cjs.map