/**
 * Artefakte — CRUD operations for project-level artefakte files
 *
 * Manages DECISIONS.md, ACCEPTANCE-CRITERIA.md, and NO-GOS.md
 * at both project level (.planning/) and phase level (.planning/phases/<phase>/).
 */
export declare function cmdArtefakteRead(cwd: string, type: string | undefined, phase: string | undefined, raw: boolean): void;
export declare function cmdArtefakteWrite(cwd: string, type: string | undefined, content: string | undefined, phase: string | undefined, raw: boolean): void;
export declare function cmdArtefakteAppend(cwd: string, type: string | undefined, entry: string | undefined, phase: string | undefined, raw: boolean): void;
export declare function cmdArtefakteList(cwd: string, phase: string | undefined, raw: boolean): void;
//# sourceMappingURL=artefakte.d.ts.map