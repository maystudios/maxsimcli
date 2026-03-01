/** Check whether the current process is running with admin/root privileges. */
export declare function isElevated(): boolean;
/**
 * Add a firewall rule to allow inbound traffic on the given port.
 * Handles Windows (netsh), Linux (ufw / iptables), and macOS (no rule needed).
 */
export declare function applyFirewallRule(port: number): void;
/**
 * Walk up from cwd to find the MAXSIM monorepo root (has packages/dashboard/src/server.ts)
 */
export declare function findMonorepoRoot(startDir: string): string | null;
/**
 * Handle the `dashboard` subcommand — refresh assets, install node-pty, launch server
 */
export declare function runDashboardSubcommand(argv: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=dashboard.d.ts.map