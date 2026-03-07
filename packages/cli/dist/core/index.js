"use strict";
/**
 * @maxsim/core — Shared utilities, constants, and type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdStateLoad = exports.stateReplaceField = exports.stateExtractField = exports.cmdConfigGet = exports.cmdConfigSet = exports.cmdConfigEnsureSection = exports.cmdFrontmatterValidate = exports.cmdFrontmatterMerge = exports.cmdFrontmatterSet = exports.cmdFrontmatterGet = exports.FRONTMATTER_SCHEMAS = exports.parseMustHavesBlock = exports.spliceFrontmatter = exports.reconstructFrontmatter = exports.extractFrontmatter = exports.archivePathAsync = exports.archivePath = exports.safeReadFileAsync = exports.listSubDirsAsync = exports.getMilestoneInfo = exports.generateSlugInternal = exports.pathExistsAsync = exports.pathExistsInternal = exports.resolveModelInternal = exports.getRoadmapPhaseInternal = exports.getArchivedPhaseDirs = exports.findPhaseInternalAsync = exports.findPhaseInternal = exports.getPhasePattern = exports.comparePhaseNum = exports.normalizePhaseName = exports.execGit = exports.isGitIgnored = exports.loadConfig = exports.safeReadFile = exports.writeOutput = exports.rethrowCliSignals = exports.CliError = exports.CliOutput = exports.error = exports.output = exports.MODEL_PROFILES = exports.PLANNING_CONFIG_DEFAULTS = exports.cmdErr = exports.cmdOk = exports.err = exports.ok = exports.phaseSlug = exports.phasePath = exports.phaseNumber = void 0;
exports.cmdPhaseInsert = exports.cmdPhaseAdd = exports.cmdPhasePlanIndex = exports.cmdFindPhase = exports.cmdPhaseNextDecimal = exports.cmdPhasesList = exports.cmdDriftPreviousHash = exports.cmdDriftExtractConventions = exports.cmdDriftExtractNoGos = exports.cmdDriftExtractRequirements = exports.cmdDriftWriteReport = exports.cmdDriftReadReport = exports.cmdValidateHealth = exports.cmdValidateConsistency = exports.cmdVerifyKeyLinks = exports.cmdVerifyArtifacts = exports.cmdVerifyCommits = exports.cmdVerifyReferences = exports.cmdVerifyPhaseCompleteness = exports.cmdVerifyPlanStructure = exports.cmdVerifySummary = exports.cmdScaffold = exports.cmdTodoComplete = exports.cmdProgressRender = exports.cmdWebsearch = exports.cmdSummaryExtract = exports.cmdCommit = exports.cmdResolveModel = exports.cmdHistoryDigest = exports.cmdVerifyPathExists = exports.cmdListTodos = exports.cmdCurrentTimestamp = exports.cmdGenerateSlug = exports.cmdMilestoneComplete = exports.cmdRequirementsMarkComplete = exports.cmdRoadmapUpdatePlanProgress = exports.cmdRoadmapAnalyze = exports.cmdRoadmapGetPhase = exports.cmdDetectStaleContext = exports.cmdStateSnapshot = exports.cmdStateRecordSession = exports.cmdStateResolveBlocker = exports.cmdStateAddBlocker = exports.cmdStateAddDecision = exports.cmdStateUpdateProgress = exports.cmdStateRecordMetric = exports.cmdStateAdvancePlan = exports.cmdStateUpdate = exports.cmdStatePatch = exports.cmdStateGet = void 0;
exports.listCodebaseDocs = exports.cmdInitRealign = exports.cmdInitCheckDrift = exports.cmdInitDebugger = exports.cmdInitVerifier = exports.cmdInitResearcher = exports.cmdInitPlanner = exports.cmdInitExecutor = exports.cmdInitProgress = exports.cmdInitExisting = exports.cmdInitMapCodebase = exports.cmdInitMilestoneOp = exports.cmdInitTodos = exports.cmdInitPhaseOp = exports.cmdInitVerifyWork = exports.cmdInitResume = exports.cmdInitQuick = exports.cmdInitNewMilestone = exports.cmdInitNewProject = exports.cmdInitPlanPhase = exports.cmdInitExecutePhase = exports.HEALTH_TIMEOUT_MS = exports.PORT_RANGE_END = exports.DEFAULT_PORT = exports.waitForDashboard = exports.spawnDashboard = exports.ensureNodePty = exports.readDashboardConfig = exports.resolveDashboardServer = exports.killProcessOnPort = exports.findRunningDashboard = exports.checkHealth = exports.cmdStart = exports.cmdSkillUpdate = exports.cmdSkillInstall = exports.cmdSkillList = exports.cmdContextLoad = exports.cmdArtefakteList = exports.cmdArtefakteAppend = exports.cmdArtefakteWrite = exports.cmdArtefakteRead = exports.cmdTemplateFill = exports.cmdTemplateSelect = exports.cmdGetArchivedPhase = exports.archivePhaseExecute = exports.archivePhasePreview = exports.cmdPhaseComplete = exports.cmdPhaseRemove = void 0;
// Runtime value exports from types
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "phaseNumber", { enumerable: true, get: function () { return types_js_1.phaseNumber; } });
Object.defineProperty(exports, "phasePath", { enumerable: true, get: function () { return types_js_1.phasePath; } });
Object.defineProperty(exports, "phaseSlug", { enumerable: true, get: function () { return types_js_1.phaseSlug; } });
Object.defineProperty(exports, "ok", { enumerable: true, get: function () { return types_js_1.ok; } });
Object.defineProperty(exports, "err", { enumerable: true, get: function () { return types_js_1.err; } });
Object.defineProperty(exports, "cmdOk", { enumerable: true, get: function () { return types_js_1.cmdOk; } });
Object.defineProperty(exports, "cmdErr", { enumerable: true, get: function () { return types_js_1.cmdErr; } });
Object.defineProperty(exports, "PLANNING_CONFIG_DEFAULTS", { enumerable: true, get: function () { return types_js_1.PLANNING_CONFIG_DEFAULTS; } });
// Runtime exports from core
var core_js_1 = require("./core.js");
Object.defineProperty(exports, "MODEL_PROFILES", { enumerable: true, get: function () { return core_js_1.MODEL_PROFILES; } });
Object.defineProperty(exports, "output", { enumerable: true, get: function () { return core_js_1.output; } });
Object.defineProperty(exports, "error", { enumerable: true, get: function () { return core_js_1.error; } });
Object.defineProperty(exports, "CliOutput", { enumerable: true, get: function () { return core_js_1.CliOutput; } });
Object.defineProperty(exports, "CliError", { enumerable: true, get: function () { return core_js_1.CliError; } });
Object.defineProperty(exports, "rethrowCliSignals", { enumerable: true, get: function () { return core_js_1.rethrowCliSignals; } });
Object.defineProperty(exports, "writeOutput", { enumerable: true, get: function () { return core_js_1.writeOutput; } });
Object.defineProperty(exports, "safeReadFile", { enumerable: true, get: function () { return core_js_1.safeReadFile; } });
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return core_js_1.loadConfig; } });
Object.defineProperty(exports, "isGitIgnored", { enumerable: true, get: function () { return core_js_1.isGitIgnored; } });
Object.defineProperty(exports, "execGit", { enumerable: true, get: function () { return core_js_1.execGit; } });
Object.defineProperty(exports, "normalizePhaseName", { enumerable: true, get: function () { return core_js_1.normalizePhaseName; } });
Object.defineProperty(exports, "comparePhaseNum", { enumerable: true, get: function () { return core_js_1.comparePhaseNum; } });
Object.defineProperty(exports, "getPhasePattern", { enumerable: true, get: function () { return core_js_1.getPhasePattern; } });
Object.defineProperty(exports, "findPhaseInternal", { enumerable: true, get: function () { return core_js_1.findPhaseInternal; } });
Object.defineProperty(exports, "findPhaseInternalAsync", { enumerable: true, get: function () { return core_js_1.findPhaseInternalAsync; } });
Object.defineProperty(exports, "getArchivedPhaseDirs", { enumerable: true, get: function () { return core_js_1.getArchivedPhaseDirs; } });
Object.defineProperty(exports, "getRoadmapPhaseInternal", { enumerable: true, get: function () { return core_js_1.getRoadmapPhaseInternal; } });
Object.defineProperty(exports, "resolveModelInternal", { enumerable: true, get: function () { return core_js_1.resolveModelInternal; } });
Object.defineProperty(exports, "pathExistsInternal", { enumerable: true, get: function () { return core_js_1.pathExistsInternal; } });
Object.defineProperty(exports, "pathExistsAsync", { enumerable: true, get: function () { return core_js_1.pathExistsAsync; } });
Object.defineProperty(exports, "generateSlugInternal", { enumerable: true, get: function () { return core_js_1.generateSlugInternal; } });
Object.defineProperty(exports, "getMilestoneInfo", { enumerable: true, get: function () { return core_js_1.getMilestoneInfo; } });
Object.defineProperty(exports, "listSubDirsAsync", { enumerable: true, get: function () { return core_js_1.listSubDirsAsync; } });
Object.defineProperty(exports, "safeReadFileAsync", { enumerable: true, get: function () { return core_js_1.safeReadFileAsync; } });
Object.defineProperty(exports, "archivePath", { enumerable: true, get: function () { return core_js_1.archivePath; } });
Object.defineProperty(exports, "archivePathAsync", { enumerable: true, get: function () { return core_js_1.archivePathAsync; } });
// Frontmatter exports
var frontmatter_js_1 = require("./frontmatter.js");
Object.defineProperty(exports, "extractFrontmatter", { enumerable: true, get: function () { return frontmatter_js_1.extractFrontmatter; } });
Object.defineProperty(exports, "reconstructFrontmatter", { enumerable: true, get: function () { return frontmatter_js_1.reconstructFrontmatter; } });
Object.defineProperty(exports, "spliceFrontmatter", { enumerable: true, get: function () { return frontmatter_js_1.spliceFrontmatter; } });
Object.defineProperty(exports, "parseMustHavesBlock", { enumerable: true, get: function () { return frontmatter_js_1.parseMustHavesBlock; } });
Object.defineProperty(exports, "FRONTMATTER_SCHEMAS", { enumerable: true, get: function () { return frontmatter_js_1.FRONTMATTER_SCHEMAS; } });
Object.defineProperty(exports, "cmdFrontmatterGet", { enumerable: true, get: function () { return frontmatter_js_1.cmdFrontmatterGet; } });
Object.defineProperty(exports, "cmdFrontmatterSet", { enumerable: true, get: function () { return frontmatter_js_1.cmdFrontmatterSet; } });
Object.defineProperty(exports, "cmdFrontmatterMerge", { enumerable: true, get: function () { return frontmatter_js_1.cmdFrontmatterMerge; } });
Object.defineProperty(exports, "cmdFrontmatterValidate", { enumerable: true, get: function () { return frontmatter_js_1.cmdFrontmatterValidate; } });
// Config exports
var config_js_1 = require("./config.js");
Object.defineProperty(exports, "cmdConfigEnsureSection", { enumerable: true, get: function () { return config_js_1.cmdConfigEnsureSection; } });
Object.defineProperty(exports, "cmdConfigSet", { enumerable: true, get: function () { return config_js_1.cmdConfigSet; } });
Object.defineProperty(exports, "cmdConfigGet", { enumerable: true, get: function () { return config_js_1.cmdConfigGet; } });
// State exports
var state_js_1 = require("./state.js");
Object.defineProperty(exports, "stateExtractField", { enumerable: true, get: function () { return state_js_1.stateExtractField; } });
Object.defineProperty(exports, "stateReplaceField", { enumerable: true, get: function () { return state_js_1.stateReplaceField; } });
Object.defineProperty(exports, "cmdStateLoad", { enumerable: true, get: function () { return state_js_1.cmdStateLoad; } });
Object.defineProperty(exports, "cmdStateGet", { enumerable: true, get: function () { return state_js_1.cmdStateGet; } });
Object.defineProperty(exports, "cmdStatePatch", { enumerable: true, get: function () { return state_js_1.cmdStatePatch; } });
Object.defineProperty(exports, "cmdStateUpdate", { enumerable: true, get: function () { return state_js_1.cmdStateUpdate; } });
Object.defineProperty(exports, "cmdStateAdvancePlan", { enumerable: true, get: function () { return state_js_1.cmdStateAdvancePlan; } });
Object.defineProperty(exports, "cmdStateRecordMetric", { enumerable: true, get: function () { return state_js_1.cmdStateRecordMetric; } });
Object.defineProperty(exports, "cmdStateUpdateProgress", { enumerable: true, get: function () { return state_js_1.cmdStateUpdateProgress; } });
Object.defineProperty(exports, "cmdStateAddDecision", { enumerable: true, get: function () { return state_js_1.cmdStateAddDecision; } });
Object.defineProperty(exports, "cmdStateAddBlocker", { enumerable: true, get: function () { return state_js_1.cmdStateAddBlocker; } });
Object.defineProperty(exports, "cmdStateResolveBlocker", { enumerable: true, get: function () { return state_js_1.cmdStateResolveBlocker; } });
Object.defineProperty(exports, "cmdStateRecordSession", { enumerable: true, get: function () { return state_js_1.cmdStateRecordSession; } });
Object.defineProperty(exports, "cmdStateSnapshot", { enumerable: true, get: function () { return state_js_1.cmdStateSnapshot; } });
Object.defineProperty(exports, "cmdDetectStaleContext", { enumerable: true, get: function () { return state_js_1.cmdDetectStaleContext; } });
// Roadmap exports
var roadmap_js_1 = require("./roadmap.js");
Object.defineProperty(exports, "cmdRoadmapGetPhase", { enumerable: true, get: function () { return roadmap_js_1.cmdRoadmapGetPhase; } });
Object.defineProperty(exports, "cmdRoadmapAnalyze", { enumerable: true, get: function () { return roadmap_js_1.cmdRoadmapAnalyze; } });
Object.defineProperty(exports, "cmdRoadmapUpdatePlanProgress", { enumerable: true, get: function () { return roadmap_js_1.cmdRoadmapUpdatePlanProgress; } });
// Milestone exports
var milestone_js_1 = require("./milestone.js");
Object.defineProperty(exports, "cmdRequirementsMarkComplete", { enumerable: true, get: function () { return milestone_js_1.cmdRequirementsMarkComplete; } });
Object.defineProperty(exports, "cmdMilestoneComplete", { enumerable: true, get: function () { return milestone_js_1.cmdMilestoneComplete; } });
// Commands exports
var commands_js_1 = require("./commands.js");
Object.defineProperty(exports, "cmdGenerateSlug", { enumerable: true, get: function () { return commands_js_1.cmdGenerateSlug; } });
Object.defineProperty(exports, "cmdCurrentTimestamp", { enumerable: true, get: function () { return commands_js_1.cmdCurrentTimestamp; } });
Object.defineProperty(exports, "cmdListTodos", { enumerable: true, get: function () { return commands_js_1.cmdListTodos; } });
Object.defineProperty(exports, "cmdVerifyPathExists", { enumerable: true, get: function () { return commands_js_1.cmdVerifyPathExists; } });
Object.defineProperty(exports, "cmdHistoryDigest", { enumerable: true, get: function () { return commands_js_1.cmdHistoryDigest; } });
Object.defineProperty(exports, "cmdResolveModel", { enumerable: true, get: function () { return commands_js_1.cmdResolveModel; } });
Object.defineProperty(exports, "cmdCommit", { enumerable: true, get: function () { return commands_js_1.cmdCommit; } });
Object.defineProperty(exports, "cmdSummaryExtract", { enumerable: true, get: function () { return commands_js_1.cmdSummaryExtract; } });
Object.defineProperty(exports, "cmdWebsearch", { enumerable: true, get: function () { return commands_js_1.cmdWebsearch; } });
Object.defineProperty(exports, "cmdProgressRender", { enumerable: true, get: function () { return commands_js_1.cmdProgressRender; } });
Object.defineProperty(exports, "cmdTodoComplete", { enumerable: true, get: function () { return commands_js_1.cmdTodoComplete; } });
Object.defineProperty(exports, "cmdScaffold", { enumerable: true, get: function () { return commands_js_1.cmdScaffold; } });
var verify_js_1 = require("./verify.js");
Object.defineProperty(exports, "cmdVerifySummary", { enumerable: true, get: function () { return verify_js_1.cmdVerifySummary; } });
Object.defineProperty(exports, "cmdVerifyPlanStructure", { enumerable: true, get: function () { return verify_js_1.cmdVerifyPlanStructure; } });
Object.defineProperty(exports, "cmdVerifyPhaseCompleteness", { enumerable: true, get: function () { return verify_js_1.cmdVerifyPhaseCompleteness; } });
Object.defineProperty(exports, "cmdVerifyReferences", { enumerable: true, get: function () { return verify_js_1.cmdVerifyReferences; } });
Object.defineProperty(exports, "cmdVerifyCommits", { enumerable: true, get: function () { return verify_js_1.cmdVerifyCommits; } });
Object.defineProperty(exports, "cmdVerifyArtifacts", { enumerable: true, get: function () { return verify_js_1.cmdVerifyArtifacts; } });
Object.defineProperty(exports, "cmdVerifyKeyLinks", { enumerable: true, get: function () { return verify_js_1.cmdVerifyKeyLinks; } });
Object.defineProperty(exports, "cmdValidateConsistency", { enumerable: true, get: function () { return verify_js_1.cmdValidateConsistency; } });
Object.defineProperty(exports, "cmdValidateHealth", { enumerable: true, get: function () { return verify_js_1.cmdValidateHealth; } });
// Drift exports
var drift_js_1 = require("./drift.js");
Object.defineProperty(exports, "cmdDriftReadReport", { enumerable: true, get: function () { return drift_js_1.cmdDriftReadReport; } });
Object.defineProperty(exports, "cmdDriftWriteReport", { enumerable: true, get: function () { return drift_js_1.cmdDriftWriteReport; } });
Object.defineProperty(exports, "cmdDriftExtractRequirements", { enumerable: true, get: function () { return drift_js_1.cmdDriftExtractRequirements; } });
Object.defineProperty(exports, "cmdDriftExtractNoGos", { enumerable: true, get: function () { return drift_js_1.cmdDriftExtractNoGos; } });
Object.defineProperty(exports, "cmdDriftExtractConventions", { enumerable: true, get: function () { return drift_js_1.cmdDriftExtractConventions; } });
Object.defineProperty(exports, "cmdDriftPreviousHash", { enumerable: true, get: function () { return drift_js_1.cmdDriftPreviousHash; } });
// Phase exports
var phase_js_1 = require("./phase.js");
Object.defineProperty(exports, "cmdPhasesList", { enumerable: true, get: function () { return phase_js_1.cmdPhasesList; } });
Object.defineProperty(exports, "cmdPhaseNextDecimal", { enumerable: true, get: function () { return phase_js_1.cmdPhaseNextDecimal; } });
Object.defineProperty(exports, "cmdFindPhase", { enumerable: true, get: function () { return phase_js_1.cmdFindPhase; } });
Object.defineProperty(exports, "cmdPhasePlanIndex", { enumerable: true, get: function () { return phase_js_1.cmdPhasePlanIndex; } });
Object.defineProperty(exports, "cmdPhaseAdd", { enumerable: true, get: function () { return phase_js_1.cmdPhaseAdd; } });
Object.defineProperty(exports, "cmdPhaseInsert", { enumerable: true, get: function () { return phase_js_1.cmdPhaseInsert; } });
Object.defineProperty(exports, "cmdPhaseRemove", { enumerable: true, get: function () { return phase_js_1.cmdPhaseRemove; } });
Object.defineProperty(exports, "cmdPhaseComplete", { enumerable: true, get: function () { return phase_js_1.cmdPhaseComplete; } });
Object.defineProperty(exports, "archivePhasePreview", { enumerable: true, get: function () { return phase_js_1.archivePhasePreview; } });
Object.defineProperty(exports, "archivePhaseExecute", { enumerable: true, get: function () { return phase_js_1.archivePhaseExecute; } });
Object.defineProperty(exports, "cmdGetArchivedPhase", { enumerable: true, get: function () { return phase_js_1.cmdGetArchivedPhase; } });
var template_js_1 = require("./template.js");
Object.defineProperty(exports, "cmdTemplateSelect", { enumerable: true, get: function () { return template_js_1.cmdTemplateSelect; } });
Object.defineProperty(exports, "cmdTemplateFill", { enumerable: true, get: function () { return template_js_1.cmdTemplateFill; } });
// Artefakte exports
var artefakte_js_1 = require("./artefakte.js");
Object.defineProperty(exports, "cmdArtefakteRead", { enumerable: true, get: function () { return artefakte_js_1.cmdArtefakteRead; } });
Object.defineProperty(exports, "cmdArtefakteWrite", { enumerable: true, get: function () { return artefakte_js_1.cmdArtefakteWrite; } });
Object.defineProperty(exports, "cmdArtefakteAppend", { enumerable: true, get: function () { return artefakte_js_1.cmdArtefakteAppend; } });
Object.defineProperty(exports, "cmdArtefakteList", { enumerable: true, get: function () { return artefakte_js_1.cmdArtefakteList; } });
var context_loader_js_1 = require("./context-loader.js");
Object.defineProperty(exports, "cmdContextLoad", { enumerable: true, get: function () { return context_loader_js_1.cmdContextLoad; } });
// Skills exports
var skills_js_1 = require("./skills.js");
Object.defineProperty(exports, "cmdSkillList", { enumerable: true, get: function () { return skills_js_1.cmdSkillList; } });
Object.defineProperty(exports, "cmdSkillInstall", { enumerable: true, get: function () { return skills_js_1.cmdSkillInstall; } });
Object.defineProperty(exports, "cmdSkillUpdate", { enumerable: true, get: function () { return skills_js_1.cmdSkillUpdate; } });
// Start command exports
var start_js_1 = require("./start.js");
Object.defineProperty(exports, "cmdStart", { enumerable: true, get: function () { return start_js_1.cmdStart; } });
// Dashboard launcher exports
var dashboard_launcher_js_1 = require("./dashboard-launcher.js");
Object.defineProperty(exports, "checkHealth", { enumerable: true, get: function () { return dashboard_launcher_js_1.checkHealth; } });
Object.defineProperty(exports, "findRunningDashboard", { enumerable: true, get: function () { return dashboard_launcher_js_1.findRunningDashboard; } });
Object.defineProperty(exports, "killProcessOnPort", { enumerable: true, get: function () { return dashboard_launcher_js_1.killProcessOnPort; } });
Object.defineProperty(exports, "resolveDashboardServer", { enumerable: true, get: function () { return dashboard_launcher_js_1.resolveDashboardServer; } });
Object.defineProperty(exports, "readDashboardConfig", { enumerable: true, get: function () { return dashboard_launcher_js_1.readDashboardConfig; } });
Object.defineProperty(exports, "ensureNodePty", { enumerable: true, get: function () { return dashboard_launcher_js_1.ensureNodePty; } });
Object.defineProperty(exports, "spawnDashboard", { enumerable: true, get: function () { return dashboard_launcher_js_1.spawnDashboard; } });
Object.defineProperty(exports, "waitForDashboard", { enumerable: true, get: function () { return dashboard_launcher_js_1.waitForDashboard; } });
Object.defineProperty(exports, "DEFAULT_PORT", { enumerable: true, get: function () { return dashboard_launcher_js_1.DEFAULT_PORT; } });
Object.defineProperty(exports, "PORT_RANGE_END", { enumerable: true, get: function () { return dashboard_launcher_js_1.PORT_RANGE_END; } });
Object.defineProperty(exports, "HEALTH_TIMEOUT_MS", { enumerable: true, get: function () { return dashboard_launcher_js_1.HEALTH_TIMEOUT_MS; } });
var init_js_1 = require("./init.js");
Object.defineProperty(exports, "cmdInitExecutePhase", { enumerable: true, get: function () { return init_js_1.cmdInitExecutePhase; } });
Object.defineProperty(exports, "cmdInitPlanPhase", { enumerable: true, get: function () { return init_js_1.cmdInitPlanPhase; } });
Object.defineProperty(exports, "cmdInitNewProject", { enumerable: true, get: function () { return init_js_1.cmdInitNewProject; } });
Object.defineProperty(exports, "cmdInitNewMilestone", { enumerable: true, get: function () { return init_js_1.cmdInitNewMilestone; } });
Object.defineProperty(exports, "cmdInitQuick", { enumerable: true, get: function () { return init_js_1.cmdInitQuick; } });
Object.defineProperty(exports, "cmdInitResume", { enumerable: true, get: function () { return init_js_1.cmdInitResume; } });
Object.defineProperty(exports, "cmdInitVerifyWork", { enumerable: true, get: function () { return init_js_1.cmdInitVerifyWork; } });
Object.defineProperty(exports, "cmdInitPhaseOp", { enumerable: true, get: function () { return init_js_1.cmdInitPhaseOp; } });
Object.defineProperty(exports, "cmdInitTodos", { enumerable: true, get: function () { return init_js_1.cmdInitTodos; } });
Object.defineProperty(exports, "cmdInitMilestoneOp", { enumerable: true, get: function () { return init_js_1.cmdInitMilestoneOp; } });
Object.defineProperty(exports, "cmdInitMapCodebase", { enumerable: true, get: function () { return init_js_1.cmdInitMapCodebase; } });
Object.defineProperty(exports, "cmdInitExisting", { enumerable: true, get: function () { return init_js_1.cmdInitExisting; } });
Object.defineProperty(exports, "cmdInitProgress", { enumerable: true, get: function () { return init_js_1.cmdInitProgress; } });
Object.defineProperty(exports, "cmdInitExecutor", { enumerable: true, get: function () { return init_js_1.cmdInitExecutor; } });
Object.defineProperty(exports, "cmdInitPlanner", { enumerable: true, get: function () { return init_js_1.cmdInitPlanner; } });
Object.defineProperty(exports, "cmdInitResearcher", { enumerable: true, get: function () { return init_js_1.cmdInitResearcher; } });
Object.defineProperty(exports, "cmdInitVerifier", { enumerable: true, get: function () { return init_js_1.cmdInitVerifier; } });
Object.defineProperty(exports, "cmdInitDebugger", { enumerable: true, get: function () { return init_js_1.cmdInitDebugger; } });
Object.defineProperty(exports, "cmdInitCheckDrift", { enumerable: true, get: function () { return init_js_1.cmdInitCheckDrift; } });
Object.defineProperty(exports, "cmdInitRealign", { enumerable: true, get: function () { return init_js_1.cmdInitRealign; } });
Object.defineProperty(exports, "listCodebaseDocs", { enumerable: true, get: function () { return init_js_1.listCodebaseDocs; } });
//# sourceMappingURL=index.js.map