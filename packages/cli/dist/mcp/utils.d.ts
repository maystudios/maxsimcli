/**
 * MCP Utilities — Shared helpers for MCP tools
 *
 * CRITICAL: Never import output() or error() from core — they call process.exit().
 * CRITICAL: Never write to stdout — it is reserved for MCP JSON-RPC protocol.
 */
export declare function detectProjectRoot(startDir?: string): string | null;
/**
 * Return a structured MCP success response.
 */
export declare function mcpSuccess(data: Record<string, unknown>, summary: string): {
    content: {
        type: "text";
        text: string;
    }[];
};
/**
 * Return a structured MCP error response.
 */
export declare function mcpError(error: string, summary: string): {
    content: {
        type: "text";
        text: string;
    }[];
    isError: true;
};
//# sourceMappingURL=utils.d.ts.map