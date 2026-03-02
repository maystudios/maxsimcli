/**
 * Start — Orchestrates Dashboard launch + browser open
 *
 * Provides a unified `maxsimcli start` entry point that:
 * 1. Checks for a running dashboard
 * 2. Starts the dashboard if needed
 * 3. Opens the browser
 * 4. Reports status
 */
export declare function cmdStart(cwd: string, options: {
    noBrowser?: boolean;
    networkMode?: boolean;
}, raw: boolean): Promise<void>;
//# sourceMappingURL=start.d.ts.map