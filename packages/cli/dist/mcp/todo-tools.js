"use strict";
/**
 * Todo CRUD MCP Tools — Todo operations exposed as MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 * CRITICAL: Never call process.exit() — the server must stay alive after every tool call.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTodoTools = registerTodoTools;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const core_js_1 = require("../core/core.js");
const commands_js_1 = require("../core/commands.js");
const utils_js_1 = require("./utils.js");
/**
 * Register all todo CRUD tools on the MCP server.
 */
function registerTodoTools(server) {
    // ── mcp_add_todo ────────────────────────────────────────────────────────────
    server.tool('mcp_add_todo', 'Create a new todo item in .planning/todos/pending/ with frontmatter metadata.', {
        title: zod_1.z.string().describe('Title of the todo item'),
        description: zod_1.z.string().optional().describe('Optional description body'),
        area: zod_1.z.string().optional().default('general').describe('Area/category (default: general)'),
        phase: zod_1.z.string().optional().describe('Associated phase number'),
    }, async ({ title, description, area, phase }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const pendingDir = (0, core_js_1.planningPath)(cwd, 'todos', 'pending');
            node_fs_1.default.mkdirSync(pendingDir, { recursive: true });
            const today = (0, core_js_1.todayISO)();
            const slug = (0, core_js_1.generateSlugInternal)(title) || 'untitled';
            const timestamp = Date.now();
            const filename = `${timestamp}-${slug}.md`;
            const filePath = node_path_1.default.join(pendingDir, filename);
            const content = `---\ncreated: ${today}\ntitle: ${title}\narea: ${area || 'general'}\nphase: ${phase || 'unassigned'}\n---\n${description || ''}\n`;
            node_fs_1.default.writeFileSync(filePath, content, 'utf-8');
            return (0, utils_js_1.mcpSuccess)({
                file: filename,
                path: `.planning/todos/pending/${filename}`,
                title,
                area: area || 'general',
            }, `Todo created: ${title}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_complete_todo ───────────────────────────────────────────────────────
    server.tool('mcp_complete_todo', 'Mark a pending todo as completed by moving it from pending/ to completed/ with a completion timestamp.', {
        todo_id: zod_1.z.string().describe('Filename of the todo (e.g., 1234567890-my-task.md)'),
    }, async ({ todo_id }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const pendingDir = (0, core_js_1.planningPath)(cwd, 'todos', 'pending');
            const completedDir = (0, core_js_1.planningPath)(cwd, 'todos', 'completed');
            const sourcePath = node_path_1.default.join(pendingDir, todo_id);
            if (!node_fs_1.default.existsSync(sourcePath)) {
                return (0, utils_js_1.mcpError)(`Todo not found in pending: ${todo_id}`, 'Todo not found');
            }
            node_fs_1.default.mkdirSync(completedDir, { recursive: true });
            let content = node_fs_1.default.readFileSync(sourcePath, 'utf-8');
            const today = (0, core_js_1.todayISO)();
            content = `completed: ${today}\n` + content;
            node_fs_1.default.writeFileSync(node_path_1.default.join(completedDir, todo_id), content, 'utf-8');
            node_fs_1.default.unlinkSync(sourcePath);
            return (0, utils_js_1.mcpSuccess)({ completed: true, file: todo_id, date: today }, `Todo completed: ${todo_id}`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
    // ── mcp_list_todos ──────────────────────────────────────────────────────────
    server.tool('mcp_list_todos', 'List todo items, optionally filtered by area and status (pending, completed, or all).', {
        area: zod_1.z.string().optional().describe('Filter by area/category'),
        status: zod_1.z
            .enum(['pending', 'completed', 'all'])
            .optional()
            .default('pending')
            .describe('Which todos to list (default: pending)'),
    }, async ({ area, status }) => {
        try {
            const cwd = (0, utils_js_1.detectProjectRoot)();
            if (!cwd) {
                return (0, utils_js_1.mcpError)('No .planning/ directory found', 'Project not detected');
            }
            const todosBase = (0, core_js_1.planningPath)(cwd, 'todos');
            const dirs = [];
            if (status === 'pending' || status === 'all') {
                dirs.push(node_path_1.default.join(todosBase, 'pending'));
            }
            if (status === 'completed' || status === 'all') {
                dirs.push(node_path_1.default.join(todosBase, 'completed'));
            }
            const todos = [];
            for (const dir of dirs) {
                const dirStatus = dir.endsWith('pending') ? 'pending' : 'completed';
                let files = [];
                try {
                    files = node_fs_1.default.readdirSync(dir).filter((f) => f.endsWith('.md'));
                }
                catch {
                    // Directory may not exist
                    continue;
                }
                for (const file of files) {
                    try {
                        const content = node_fs_1.default.readFileSync(node_path_1.default.join(dir, file), 'utf-8');
                        const fm = (0, commands_js_1.parseTodoFrontmatter)(content);
                        if (area && fm.area !== area)
                            continue;
                        todos.push({
                            file,
                            created: fm.created,
                            title: fm.title,
                            area: fm.area,
                            status: dirStatus,
                            path: `.planning/todos/${dirStatus}/${file}`,
                        });
                    }
                    catch {
                        // Skip unreadable files
                    }
                }
            }
            return (0, utils_js_1.mcpSuccess)({ count: todos.length, todos }, `${todos.length} todos found`);
        }
        catch (e) {
            return (0, utils_js_1.mcpError)(e.message, 'Operation failed');
        }
    });
}
//# sourceMappingURL=todo-tools.js.map