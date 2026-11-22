export interface TranslationDictionary {
  app: {
    name: string;
    tagline: string;
    skipToContent: string;
  };
  nav: {
    home: string;
    newInvestigation: string;
    myInvestigations: string;
    helpExamples: string;
    openMenu: string;
    closeMenu: string;
    primaryNavLabel: string;
    mobileNavLabel: string;
  };
  controls: {
    themeToggleToDark: string;
    themeToggleToLight: string;
    themeLabelLight: string;
    themeLabelDark: string;
    languageLabel: string;
    switchToArabic: string;
    switchToEnglish: string;
    backToHome: string;
  };
  demo: {
    badgeText: string;
    badgeHint: string;
  };
  home: {
    kicker: string;
    heroTitle: string;
    heroDescription: string;
    primaryCta: string;
    secondaryCta: string;
    principlesHeading: string;
    principle1Title: string;
    principle1Body: string;
    principle2Title: string;
    principle2Body: string;
    principle3Title: string;
    principle3Body: string;
    quickActionsHeading: string;
    quickActionNewTitle: string;
    quickActionNewBody: string;
    quickActionNewAction: string;
    quickActionListTitle: string;
    quickActionListBody: string;
    quickActionListAction: string;
    quickActionHelpTitle: string;
    quickActionHelpBody: string;
    quickActionHelpAction: string;
    levelsHeading: string;
    levelsSubheading: string;
    level1Title: string;
    level1Desc: string;
    level2Title: string;
    level2Desc: string;
    level3Title: string;
    level3Desc: string;
    level4Title: string;
    level4Desc: string;
    previewHeading: string;
    previewSubheading: string;
    previewCodeLabel: string;
    previewTracebackLabel: string;
    previewMentorLabel: string;
    previewLevelLabel: string;
    previewNextQuestionLabel: string;
    previewRefreshButton: string;
  };
  placeholders: {
    foundationNoticeTitle: string;
    foundationNoticeBody: string;
    newInvestigationTitle: string;
    newInvestigationSubtitle: string;
    myInvestigationsTitle: string;
    myInvestigationsSubtitle: string;
    helpExamplesTitle: string;
    helpExamplesSubtitle: string;
    investigationDetailTitle: string;
    investigationDetailSubtitle: string;
    investigationIdLabel: string;
  };
  footer: {
    philosophyNote: string;
    apiModeLabel: string;
    apiModeMock: string;
    apiModeHttp: string;
  };
  intake: {
    title: string;
    subtitle: string;
    quickActionsLabel: string;
    actionUseExample: string;
    actionPasteCode: string;
    actionAddTraceback: string;
    actionAddExpected: string;
    clipboardUnavailable: string;
    codeLabel: string;
    codeHint: string;
    codePlaceholder: string;
    noTracebackToggle: string;
    noTracebackHelper: string;
    tracebackLabel: string;
    tracebackHint: string;
    tracebackPlaceholder: string;
    expectedLabel: string;
    expectedHint: string;
    expectedPlaceholder: string;
    runtimeSectionTitle: string;
    runtimeSectionProminentTitle: string;
    runtimeSectionHint: string;
    sampleInputLabel: string;
    sampleInputPlaceholder: string;
    actualOutputLabel: string;
    actualOutputPlaceholder: string;
    submitContinue: string;
    cancelToHome: string;
    inputCheckTitle: string;
    inputCheckSubtitle: string;
    inputCheckLimitedNotice: string;
    issueCodeMissingTitle: string;
    issueCodeMissingWhy: string;
    issueLogicDetailsTitle: string;
    issueLogicDetailsWhy: string;
    issueExpectedMissingTitle: string;
    issueExpectedMissingWhy: string;
    issueMismatchFunctionTitle: string;
    issueMismatchFunctionWhy: string;
    issueMismatchLineTitle: string;
    issueMismatchLineWhy: string;
    issueMismatchNameTitle: string;
    issueMismatchNameWhy: string;
    btnContinueAnyway: string;
    btnAddMissingDetails: string;
    btnCancelCheck: string;
    exampleExpectedBehavior: string;
    untitledInvestigation: string;
    logicCaseSuffix: string;
    editTitle: string;
    editSubtitle: string;
    saveChanges: string;
    cancelEdit: string;
    linesCountLabel: string;
    showRuntimeDetails: string;
    hideRuntimeDetails: string;
  };
  workspace: {
    notFoundTitle: string;
    notFoundBody: string;
    startNewAction: string;
    statusOpen: string;
    statusResolved: string;
    statusUnresolved: string;
    statusHandedOver: string;
    caseSummaryHeading: string;
    editDetails: string;
    codeFieldLabel: string;
    noCodeProvided: string;
    showCode: string;
    hideCode: string;
    errorFieldLabel: string;
    noTracebackRecorded: string;
    expectedFieldLabel: string;
    notProvided: string;
    sampleInputFieldLabel: string;
    actualOutputFieldLabel: string;
    selectedHypothesisLabel: string;
    noHypothesisSelected: string;
    probesTriedLabel: string;
    noProbesTried: string;
    pathSelectorHeading: string;
    pathSelectorSubtitle: string;
    pathSwitchLabel: string;
    pathConversationTitle: string;
    pathConversationSummary: string;
    pathConversationDesc: string;
    pathConversationSelectBtn: string;
    pathHypothesisTitle: string;
    pathHypothesisSummary: string;
    pathHypothesisDesc: string;
    pathHypothesisSelectBtn: string;
    levelsHeading: string;
    levelsAgencyRule: string;
    currentLevelLabel: string;
    levelPrefix: string;
    givesLabel: string;
    withholdsLabel: string;
    level1Name: string;
    level1Gives: string;
    level1Withholds: string;
    level2Name: string;
    level2Gives: string;
    level2Withholds: string;
    level3Name: string;
    level3Gives: string;
    level3Withholds: string;
    level4Name: string;
    level4Gives: string;
    level4Withholds: string;
    confirmLevel4Title: string;
    confirmLevel4Body: string;
    confirmLevel4Continue: string;
    confirmLevel4Cancel: string;
    conversationPlaceholderTitle: string;
    conversationPlaceholderBody: string;
    hypothesisPlaceholderTitle: string;
    hypothesisPlaceholderBody: string;
    activePathStatusLabel: string;
    historyHeading: string;
    historyEmpty: string;
    systemNoteChosePath: string;
    systemNoteSwitchedPath: string;
    systemNoteSwitchedLevel: string;
  };
  conversation: {
    title: string;
    subtitle: string;
    loading: string;
    errorTitle: string;
    retryButton: string;
    mentorRoleLabel: string;
    studentRoleLabel: string;
    systemRoleLabel: string;
    focusedQuestionLabel: string;
    clarificationHeading: string;
    replyLabel: string;
    replyPlaceholder: string;
    sendReply: string;
    quickRepliesLabel: string;
    quickReplyAnswer: string;
    quickReplyHint: string;
    quickReplyMoreDetail: string;
    quickReplySwitchBoard: string;
    offerLevel2Body: string;
    offerLevel3Body: string;
    offerAcceptBtn: string;
    offerIgnoreBtn: string;
    askAtCurrentLevelBtn: string;
    emptyPrompt: string;
    startDiagnosisBtn: string;
    internalHintPrompt: string;
    internalMoreDetailPrompt: string;
  };
  hypothesisBoard: {
    title: string;
    subtitle: string;
    loading: string;
    errorTitle: string;
    retryButton: string;
    refreshBoardBtn: string;
    clarificationTitle: string;
    clarificationNote: string;
    unconfirmedLabel: string;
    userAddedLabel: string;
    activeDirectionLabel: string;
    evidenceLabel: string;
    probeLabel: string;
    investigateBtn: string;
    investigatingActiveBtn: string;
    rejectBtn: string;
    restoreBtn: string;
    rejectedSectionTitle: string;
    addMyHypothesisBtn: string;
    addFormTitle: string;
    addTitleLabel: string;
    addTitlePlaceholder: string;
    addExplanationLabel: string;
    addExplanationPlaceholder: string;
    addEvidenceLabel: string;
    addEvidencePlaceholder: string;
    addProbeLabel: string;
    addProbePlaceholder: string;
    addSubmitBtn: string;
    addCancelBtn: string;
    addTitleRequired: string;
    defaultUserExplanation: string;
    defaultUserEvidence: string;
    defaultUserProbe: string;
    selectedProbePanelTitle: string;
    selectedProbeLoading: string;
    selectedProbeError: string;
    switchToConversationBtn: string;
    emptyBoardNote: string;
  };
  feedback: {
    title: string;
    subtitle: string;
    btnWorked: string;
    btnStillFailing: string;
    btnDifferentResult: string;
    btnNeedMoreHelp: string;
    newOutputHeadingFailing: string;
    newOutputHeadingDifferent: string;
    newOutputHint: string;
    newOutputLabel: string;
    newOutputPlaceholder: string;
    newOutputNoteLabel: string;
    newOutputNotePlaceholder: string;
    newOutputRequired: string;
    submitNewOutput: string;
    cancelNewOutput: string;
    workedNoticeTitle: string;
    workedNoticeBody: string;
    openClosureFromWorked: string;
    needHelpTitle: string;
    needHelpBody: string;
    needHelpRaiseLevel: string;
    needHelpSwitchPath: string;
    needHelpHandover: string;
    needHelpMaxLevelNote: string;
    recentFeedbackHeading: string;
    systemNoteWorked: string;
    systemNoteNewEvidence: string;
    systemNoteNeedHelp: string;
  };
  fallback: {
    simulateTimeoutBtn: string;
    retryingNotice: string;
    retryingGeneralNotice: string;
    timeoutTitle: string;
    timeoutMessage: string;
    authErrorTitle: string;
    authErrorMessage: string;
    validationErrorTitle: string;
    validationErrorMessage: string;
    badGatewayTitle: string;
    badGatewayMessage: string;
    actionTryAgain: string;
    actionOpenDocs: string;
    actionAskInstructor: string;
    insufficientTitle: string;
    knownHeading: string;
    unknownHeading: string;
    knownCodePresent: string;
    knownErrorPresent: string;
    knownExpectedPresent: string;
    knownOutputPresent: string;
    unknownRuntimeFallback: string;
    insufficientNoGuessNote: string;
    recommendHandoverBtn: string;
  };
  handover: {
    title: string;
    subtitle: string;
    referralInstructorTitle: string;
    referralInstructorBody: string;
    referralDocsTitle: string;
    referralDocsBody: string;
    openPythonDocsBtn: string;
    nothingSentNotice: string;
    summaryPreviewHeading: string;
    copySummaryBtn: string;
    copiedSuccess: string;
    copyFailedNotice: string;
    markHandedOverBtn: string;
    summaryHeaderTitle: string;
    summaryLabelTitle: string;
    summaryLabelCode: string;
    summaryLabelError: string;
    summaryLabelActualOutput: string;
    summaryLabelExpected: string;
    summaryLabelStepsTried: string;
    summaryLabelUncertainty: string;
    summaryNoStepsYet: string;
    summaryUncertaintyText: string;
    summarySelectedHypothesis: string;
    summaryProbePrefix: string;
    summaryFeedbackPrefix: string;
    summaryHypothesisInvestigating: string;
    summaryHypothesisRejected: string;
  };
  closure: {
    panelTitle: string;
    panelSubtitle: string;
    openClosureBtn: string;
    reopenCaseBtn: string;
    statusSelectLabel: string;
    statusOptionResolved: string;
    statusOptionUnresolved: string;
    statusOptionHandedOver: string;
    reportedProblemLabel: string;
    confirmedCauseLabel: string;
    confirmedCausePlaceholder: string;
    unresolvedValue: string;
    evidenceLabel: string;
    appliedFixLabel: string;
    appliedFixPlaceholder: string;
    verificationResultLabel: string;
    verificationResultPlaceholder: string;
    reflectionLabel: string;
    reflectionPlaceholder: string;
    btnFinishCase: string;
    btnTryAnotherTest: string;
    btnNewInvestigation: string;
    savedSummaryHeading: string;
    systemNoteClosed: string;
    systemNoteReopened: string;
  };
  investigations: {
    title: string;
    subtitle: string;
    countLabel: string;
    startNewBtn: string;
    searchLabel: string;
    searchPlaceholder: string;
    filterStatusLabel: string;
    filterAll: string;
    loading: string;
    emptyTitle: string;
    emptyBody: string;
    emptyBrowseHelpBtn: string;
    noMatchesTitle: string;
    noMatchesBody: string;
    resetFiltersBtn: string;
    corruptNotice: string;
    pathLabel: string;
    pathNotChosen: string;
    levelLabel: string;
    updatedLabel: string;
    actionContinue: string;
    actionOpen: string;
    actionRename: string;
    actionExportJson: string;
    actionDelete: string;
    renameInputLabel: string;
    renameSaveBtn: string;
    renameCancelBtn: string;
    renameRequiredError: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    deleteConfirmBtn: string;
    deleteCancelBtn: string;
    exportSuccessNotice: string;
    renamedAnnouncement: string;
    deletedAnnouncement: string;
    storageNote: string;
  };
  help: {
    title: string;
    subtitle: string;
    examplesHeading: string;
    examplesSubtitle: string;
    loadExampleBtn: string;
    exampleCodeLabel: string;
    exampleTracebackLabel: string;
    exampleLogicEvidenceLabel: string;
    exampleExpectedLabel: string;
    exampleSyntaxBadge: string;
    exampleSyntaxTitle: string;
    exampleSyntaxDesc: string;
    exampleSyntaxExpected: string;
    exampleRuntimeBadge: string;
    exampleRuntimeTitle: string;
    exampleRuntimeDesc: string;
    exampleLogicBadge: string;
    exampleLogicTitle: string;
    exampleLogicDesc: string;
    exampleLogicExpected: string;
    levelsAndPathsHeading: string;
    levelsHeading: string;
    levelsNote: string;
    pathsHeading: string;
    pathsNote: string;
    limitsHeading: string;
    limitsSubtitle: string;
    limit1Title: string;
    limit1Body: string;
    limit2Title: string;
    limit2Body: string;
    limit3Title: string;
    limit3Body: string;
    handoverHeading: string;
    handoverBody: string;
    handoverRule1Title: string;
    handoverRule1Body: string;
    handoverRule2Title: string;
    handoverRule2Body: string;
    handoverRule3Title: string;
    handoverRule3Body: string;
    openPythonDocsBtn: string;
    startBlankBtn: string;
  };
}

export const en: TranslationDictionary = {
  app: {
    name: "Debugging Detective",
    tagline: "Guided Python Diagnostic Mentor",
    skipToContent: "Skip to main content",
  },
  nav: {
    home: "Home",
    newInvestigation: "New Investigation",
    myInvestigations: "My Investigations",
    helpExamples: "Help & Examples",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    primaryNavLabel: "Primary navigation",
    mobileNavLabel: "Mobile navigation",
  },
  controls: {
    themeToggleToDark: "Switch to dark theme",
    themeToggleToLight: "Switch to light theme",
    themeLabelLight: "Light",
    themeLabelDark: "Dark",
    languageLabel: "Language",
    switchToArabic: "العربية",
    switchToEnglish: "English",
    backToHome: "Back to Home",
  },
  demo: {
    badgeText: "Demo response: not generated by AI",
    badgeHint: "Simulated mentor output from the local mock service.",
  },
  home: {
    kicker: "Student-Controlled Python Mentoring",
    heroTitle: "Solve Python bugs by thinking like an investigator",
    heroDescription:
      "Debugging Detective helps you read tracebacks, test hypotheses, and trace variables step by step. You stay in complete control of the investigation path, assistance level, and when to finish.",
    primaryCta: "Start New Investigation",
    secondaryCta: "Explore Help & Examples",
    principlesHeading: "Built for student agency",
    principle1Title: "No automatic level jumps",
    principle1Body:
      "The mentor never escalates hints on its own. You decide whether to stay at diagnostic questions or request deeper support.",
    principle2Title: "Two investigation paths",
    principle2Body:
      "Work through a guided Socratic conversation or organize competing causes on a structured hypothesis board.",
    principle3Title: "Protected solution gate",
    principle3Body:
      "Corrected Python code stays hidden unless you explicitly choose Level 4, keeping the learning in your hands.",
    quickActionsHeading: "Where would you like to begin?",
    quickActionNewTitle: "New Investigation",
    quickActionNewBody:
      "Submit your Python snippet, traceback, and expected behavior to open a new diagnostic case.",
    quickActionNewAction: "Open intake",
    quickActionListTitle: "My Investigations",
    quickActionListBody:
      "Resume an open case, review confirmed causes, or revisit closure summaries saved on this device.",
    quickActionListAction: "View cases",
    quickActionHelpTitle: "Help & Examples",
    quickActionHelpBody:
      "Learn how to read a Python traceback, inspect common error types, and practice with sample cases.",
    quickActionHelpAction: "Read guide",
    levelsHeading: "Four assistance levels under your control",
    levelsSubheading:
      "Choose only the level of scaffolding you want for each turn of your investigation.",
    level1Title: "1. Diagnostic Probes",
    level1Desc: "Targeted questions that help you inspect values, types, and execution flow.",
    level2Title: "2. Conceptual Hint",
    level2Desc: "Explains the underlying Python concept or rule behind the symptom without giving away the edit.",
    level3Title: "3. Pseudocode / Skeleton",
    level3Desc: "Outlines the structural logic needed to fix the bug while leaving Python implementation to you.",
    level4Title: "4. Reveal Solution",
    level4Desc: "Explicitly unlocked only when you choose it—shows a verified fix and explains why it works.",
    previewHeading: "Sample Level 1 diagnostic exchange",
    previewSubheading:
      "Preview how the mock API contract structures a Python bug probe before you open an investigation.",
    previewCodeLabel: "student_average.py",
    previewTracebackLabel: "Python traceback",
    previewMentorLabel: "Mentor Guidance",
    previewLevelLabel: "Level 1 · Diagnostic Probes",
    previewNextQuestionLabel: "Suggested next check",
    previewRefreshButton: "Test Level 1 Mock Probe",
  },
  placeholders: {
    foundationNoticeTitle: "Foundation placeholder screen",
    foundationNoticeBody:
      "This route is wired into the application shell, theme tokens, and bilingual router. Full interactive workflows will be added in the next build phase.",
    newInvestigationTitle: "New Investigation",
    newInvestigationSubtitle:
      "This screen will host the Python case intake form (code, traceback, expected behavior, and sample input).",
    myInvestigationsTitle: "My Investigations",
    myInvestigationsSubtitle:
      "This screen will list your locally saved debugging cases, status filters, and closure summaries.",
    helpExamplesTitle: "Help & Examples",
    helpExamplesSubtitle:
      "This screen will provide traceback reading guides and starter Python debugging examples.",
    investigationDetailTitle: "Investigation Workspace",
    investigationDetailSubtitle:
      "This screen will host the student-controlled conversation and hypothesis board workspace.",
    investigationIdLabel: "Investigation ID",
  },
  footer: {
    philosophyNote:
      "Debugging Detective · Designed for independent Python reasoning and student control.",
    apiModeLabel: "API Adapter",
    apiModeMock: "Local Mock",
    apiModeHttp: "Server Proxy",
  },
  intake: {
    title: "New Investigation",
    subtitle:
      "Describe the Python case you want to investigate. Your case starts at Level 1 (Diagnostic Probes), and you choose the investigation path next.",
    quickActionsLabel: "Quick actions",
    actionUseExample: "Use example case",
    actionPasteCode: "Paste code",
    actionAddTraceback: "Add traceback",
    actionAddExpected: "Add expected output",
    clipboardUnavailable:
      "Clipboard access was blocked by the browser. Click inside the Python code box and paste manually.",
    codeLabel: "Python code snippet",
    codeHint: "Paste the exact function or script you ran (kept left-to-right).",
    codePlaceholder: "def calculate_averages(data):\n    ...",
    noTracebackToggle: "No traceback: the result is wrong",
    noTracebackHelper:
      "Select this when Python finishes without crashing, so you can record the sample input and actual output instead.",
    tracebackLabel: "Observed error / traceback",
    tracebackHint:
      "Paste the full Python traceback or error message if Python raised an exception.",
    tracebackPlaceholder:
      "Traceback (most recent call last):\n  File \"main.py\", line 4, in ...\nIndexError: list index out of range",
    expectedLabel: "Expected behavior",
    expectedHint:
      "Explain what the code should return or print. This is especially important for logic errors.",
    expectedPlaceholder:
      "For example: Should return [85.0, 80.0, 90.0] without raising an error.",
    runtimeSectionTitle: "Optional runtime details (Actual output & Sample input)",
    runtimeSectionProminentTitle: "Logic error evidence (Sample input & Actual output)",
    runtimeSectionHint:
      "Providing the exact input and observed output helps compare what happened against what you expected.",
    sampleInputLabel: "Sample input (optional)",
    sampleInputPlaceholder: "scores = [[80, 90], [75, 85], [92, 88]]",
    actualOutputLabel: "Actual output (optional)",
    actualOutputPlaceholder: "[] or wrong numeric value printed by your script",
    submitContinue: "Continue",
    cancelToHome: "Cancel",
    inputCheckTitle: "Input Check before starting",
    inputCheckSubtitle:
      "Review these missing or conflicting details before opening the investigation. Everything you entered is preserved.",
    inputCheckLimitedNotice:
      "You can still choose Continue anyway, though the mentor's diagnosis may be limited until these details are available.",
    issueCodeMissingTitle: "Python code snippet is missing",
    issueCodeMissingWhy:
      "Why it is needed: Without the Python code itself, line numbers, variable names, and loop bounds cannot be inspected.",
    issueLogicDetailsTitle: "No traceback and no actual output provided",
    issueLogicDetailsWhy:
      "This is not a system failure—it looks like a possible logic error. To investigate a wrong result without a traceback, please share the sample input used, the expected behavior/output, and the actual output produced.",
    issueExpectedMissingTitle: "Expected behavior is missing",
    issueExpectedMissingWhy:
      "Why it is needed: Knowing what you expected the code to produce lets you and the mentor tell the difference between a crash symptom and your actual goal.",
    issueMismatchFunctionTitle: "Code and traceback appear inconsistent (function mismatch)",
    issueMismatchFunctionWhy:
      "The traceback names function \"{symbol}\", which does not appear in your pasted Python code. Please check which file or version produced this error.",
    issueMismatchLineTitle: "Code and traceback appear inconsistent (line number mismatch)",
    issueMismatchLineWhy:
      "The traceback points to line {line}, while your pasted code only has {totalLines} lines. Please verify whether part of the file is missing or from another version.",
    issueMismatchNameTitle: "Code and error appear inconsistent (symbol mismatch)",
    issueMismatchNameWhy:
      "The error reports NameError for \"{symbol}\", which does not appear anywhere in your pasted Python code. Please check which version produced this error.",
    btnContinueAnyway: "Continue anyway",
    btnAddMissingDetails: "Add missing details",
    btnCancelCheck: "Cancel",
    exampleExpectedBehavior:
      "Return a list containing the average of each sublist in data, such as [85.0, 80.0, 90.0].",
    untitledInvestigation: "Untitled Python investigation",
    logicCaseSuffix: "Logic check",
    editTitle: "Edit Case Details",
    editSubtitle:
      "Update your Python code, traceback, or expected behavior. Your investigation path, assistance level, and history will be preserved.",
    saveChanges: "Save details",
    cancelEdit: "Back to investigation",
    linesCountLabel: "{count} ln",
    showRuntimeDetails: "Show optional runtime details",
    hideRuntimeDetails: "Hide optional runtime details",
  },
  workspace: {
    notFoundTitle: "Investigation not found",
    notFoundBody:
      "This investigation could not be found in this browser's local storage. It may have been cleared or opened from another device.",
    startNewAction: "Start New Investigation",
    statusOpen: "Open",
    statusResolved: "Resolved",
    statusUnresolved: "Unresolved",
    statusHandedOver: "Handed Over",
    caseSummaryHeading: "Case Summary",
    editDetails: "Edit details",
    codeFieldLabel: "Python code",
    noCodeProvided: "No Python code snippet provided yet.",
    showCode: "Show code",
    hideCode: "Hide code",
    errorFieldLabel: "Observed error / traceback",
    noTracebackRecorded: "No traceback recorded (possible logic error).",
    expectedFieldLabel: "Expected behavior",
    notProvided: "Not provided yet.",
    sampleInputFieldLabel: "Sample input",
    actualOutputFieldLabel: "Actual output",
    selectedHypothesisLabel: "Selected hypothesis",
    noHypothesisSelected: "None selected yet.",
    probesTriedLabel: "Probes already tried",
    noProbesTried: "No diagnostic probes tried yet.",
    pathSelectorHeading: "Choose your investigation path",
    pathSelectorSubtitle:
      "Decide how you want to investigate this case. You can switch between paths at any time without losing your case or history.",
    pathSwitchLabel: "Investigation path",
    pathConversationTitle: "Conversational Diagnosis",
    pathConversationSummary: "One focused question at a time",
    pathConversationDesc:
      "Work step by step with a guided Socratic prompt that asks one focused question at a time based on what you observe.",
    pathConversationSelectBtn: "Choose Conversational Diagnosis",
    pathHypothesisTitle: "Hypothesis Board",
    pathHypothesisSummary:
      "Plausible causes tied to the evidence, each with a diagnostic probe",
    pathHypothesisDesc:
      "Compare candidate causes side by side, inspect supporting evidence, and test targeted diagnostic probes or add your own hypothesis.",
    pathHypothesisSelectBtn: "Choose Hypothesis Board",
    levelsHeading: "Assistance Level",
    levelsAgencyRule:
      "Only your direct click changes the level. The app never raises or lowers it automatically.",
    currentLevelLabel: "Current level",
    levelPrefix: "Level",
    givesLabel: "What it gives",
    withholdsLabel: "What it does not give",
    level1Name: "Diagnostic Probes",
    level1Gives: "Guiding questions or small debugging experiments.",
    level1Withholds: "Does not explain the underlying fix or show code.",
    level2Name: "Conceptual Hint",
    level2Gives: "Explains the relevant Python concept without giving the fix.",
    level2Withholds: "Does not write pseudocode or corrected Python lines.",
    level3Name: "Pseudocode / Skeleton",
    level3Gives: "Outlines the structural logic without full Python code.",
    level3Withholds: "Leaves exact Python syntax and implementation to you.",
    level4Name: "Reveal Solution",
    level4Gives: "Direct correction followed by a reflection prompt.",
    level4Withholds: "Requires your explicit confirmation before revealing.",
    confirmLevel4Title: "Confirm Level 4: Reveal Solution",
    confirmLevel4Body: "This will reveal a full solution. Continue?",
    confirmLevel4Continue: "Continue to Level 4",
    confirmLevel4Cancel: "Cancel",
    conversationPlaceholderTitle: "Conversational Diagnosis Workspace",
    conversationPlaceholderBody:
      "Active path is set to Conversational Diagnosis. Interactive mentor turns and student replies will appear here in the next step.",
    hypothesisPlaceholderTitle: "Hypothesis Board Workspace",
    hypothesisPlaceholderBody:
      "Active path is set to Hypothesis Board. Plausible causes, evidence checks, and diagnostic probes will appear here in the next step.",
    activePathStatusLabel: "Investigating at",
    historyHeading: "Investigation History",
    historyEmpty: "Path selections and assistance level changes will be recorded here.",
    systemNoteChosePath: "You chose {path}.",
    systemNoteSwitchedPath: "You switched to {path}.",
    systemNoteSwitchedLevel: "You switched to Level {level}: {levelName}.",
  },
  conversation: {
    title: "Conversational Diagnosis",
    subtitle:
      "One focused question or step at a time, strictly matching your selected assistance level.",
    loading: "Requesting demo mentor response...",
    errorTitle: "Could not load mentor response",
    retryButton: "Retry",
    mentorRoleLabel: "Mentor",
    studentRoleLabel: "You",
    systemRoleLabel: "System note",
    focusedQuestionLabel: "Focused question",
    clarificationHeading: "Details requested to clarify",
    replyLabel: "Your observation or answer",
    replyPlaceholder:
      "Describe what you checked, what values you saw, or answer the question above...",
    sendReply: "Send reply",
    quickRepliesLabel: "Quick replies",
    quickReplyAnswer: "Answer the question",
    quickReplyHint: "Show a hint",
    quickReplyMoreDetail: "More detail",
    quickReplySwitchBoard: "Switch to Hypothesis Board",
    offerLevel2Body: "A Level 2 hint is available. Switch?",
    offerLevel3Body: "A Level 3 pseudocode skeleton is available. Switch?",
    offerAcceptBtn: "Switch to Level {level}",
    offerIgnoreBtn: "Keep Level {level}",
    askAtCurrentLevelBtn: "Get guidance for Level {level}",
    emptyPrompt: "No conversation turns yet. Start the first diagnostic step at your current level.",
    startDiagnosisBtn: "Start Conversational Diagnosis",
    internalHintPrompt: "Show a hint at my current level",
    internalMoreDetailPrompt: "More detail at my current level",
  },
  hypothesisBoard: {
    title: "Hypothesis Board",
    subtitle:
      "Inspect unconfirmed suspect causes tied to your code and error, test a probe, or add your own hypothesis.",
    loading: "Loading candidate hypotheses...",
    errorTitle: "Could not load hypotheses",
    retryButton: "Retry",
    refreshBoardBtn: "Refresh probes for Level {level}",
    clarificationTitle: "Clarifying question before proposing hypotheses",
    clarificationNote:
      "Evidence is currently too limited to propose reliable suspect causes without guessing.",
    unconfirmedLabel: "Hypothesis: not confirmed",
    userAddedLabel: "Added by you",
    activeDirectionLabel: "Current direction",
    evidenceLabel: "Supporting evidence from your case",
    probeLabel: "Diagnostic probe",
    investigateBtn: "Investigate this",
    investigatingActiveBtn: "Investigating",
    rejectBtn: "Reject",
    restoreBtn: "Restore",
    rejectedSectionTitle: "Rejected hypotheses",
    addMyHypothesisBtn: "Add my hypothesis",
    addFormTitle: "Add your own hypothesis",
    addTitleLabel: "Suspect cause title",
    addTitlePlaceholder: "For example: Off-by-one stop value in loop range",
    addExplanationLabel: "Why might this happen? (optional)",
    addExplanationPlaceholder: "Describe how this could explain the symptom...",
    addEvidenceLabel: "Quoted code or error evidence (optional)",
    addEvidencePlaceholder: "Copy a line from your code or traceback...",
    addProbeLabel: "Diagnostic probe to test it (optional)",
    addProbePlaceholder: "What small print or input check will test this?",
    addSubmitBtn: "Add to board",
    addCancelBtn: "Cancel",
    addTitleRequired: "Please enter a short title for your hypothesis.",
    defaultUserExplanation: "Student-proposed hypothesis under investigation.",
    defaultUserEvidence: "Added directly from student observation.",
    defaultUserProbe: "Test this hypothesis with a small print check or sample input.",
    selectedProbePanelTitle: "Active probe guidance",
    selectedProbeLoading: "Preparing probe guidance...",
    selectedProbeError: "Could not load probe guidance for this hypothesis.",
    switchToConversationBtn: "Switch to Conversational Diagnosis",
    emptyBoardNote: "No active suspect cards on the board yet.",
  },
  feedback: {
    title: "Test & Review",
    subtitle:
      "After testing a probe or hint on your Python code, tell the workspace what happened.",
    btnWorked: "It worked",
    btnStillFailing: "Still failing",
    btnDifferentResult: "Different result",
    btnNeedMoreHelp: "I need more help",
    newOutputHeadingFailing: "Record the output from your failing test",
    newOutputHeadingDifferent: "Record the different result you observed",
    newOutputHint:
      "Your new output is saved as new evidence and reopens the diagnosis so the mentor will not repeat the same suggestion.",
    newOutputLabel: "New output or traceback",
    newOutputPlaceholder: "Paste the new traceback or printed output here...",
    newOutputNoteLabel: "What did you change or test? (optional)",
    newOutputNotePlaceholder: "For example: Changed loop bound to len(data) and re-ran...",
    newOutputRequired: "Please paste the new output or describe what happened before continuing.",
    submitNewOutput: "Save evidence & reopen diagnosis",
    cancelNewOutput: "Cancel",
    workedNoticeTitle: "Test succeeded — your case stays open until you finish it",
    workedNoticeBody:
      "The app never marks an investigation solved automatically. Review your evidence and click Finish case when you are ready to close.",
    openClosureFromWorked: "Review & Finish case",
    needHelpTitle: "Choose how you want more help",
    needHelpBody:
      "Clicking I need more help never raises your assistance level on its own. Pick an option below:",
    needHelpRaiseLevel: "Switch to Level {level}",
    needHelpSwitchPath: "Switch to {path}",
    needHelpHandover: "Hand over to a human (Instructor / TA)",
    needHelpMaxLevelNote:
      "You are already at Level 4. Consider switching investigation paths or using Human Handover.",
    recentFeedbackHeading: "Recorded test results",
    systemNoteWorked: "You reported that the latest test worked (case stays open until you finish it).",
    systemNoteNewEvidence: "Recorded new test evidence ({type}); diagnosis reopened.",
    systemNoteNeedHelp: "Requested additional help options without changing assistance level.",
  },
  fallback: {
    simulateTimeoutBtn: "Simulate service timeout",
    retryingNotice: "Connection timed out. Retrying once automatically...",
    retryingGeneralNotice: "Request failed. Retrying once automatically...",
    timeoutTitle: "Debugging service unreachable",
    timeoutMessage:
      "I can't reach the debugging service right now. Your case details are still here.",
    authErrorTitle: "Debugging service authorization failed",
    authErrorMessage:
      "The debugging service rejected the server credentials (HTTP 401). Your case details are still here.",
    validationErrorTitle: "Debugging request could not be processed",
    validationErrorMessage:
      "The debugging service could not validate the submitted request (HTTP 422). Your case details are still here.",
    badGatewayTitle: "Debugging service temporarily unavailable",
    badGatewayMessage:
      "The upstream debugging service returned an error (HTTP 502). Your case details are still here.",
    actionTryAgain: "Try again",
    actionOpenDocs: "Open official Python documentation",
    actionAskInstructor: "Ask my instructor/TA",
    insufficientTitle: "Insufficient evidence to diagnose reliably",
    knownHeading: "What is known",
    unknownHeading: "What is unknown",
    knownCodePresent: "Python code snippet is recorded in your Case Summary.",
    knownErrorPresent: "Observed traceback / error message is recorded.",
    knownExpectedPresent: "Expected behavior is recorded.",
    knownOutputPresent: "Actual runtime output is recorded.",
    unknownRuntimeFallback: "Exact runtime output or sample input from your latest check.",
    insufficientNoGuessNote:
      "The mentor will not guess a cause without missing runtime evidence. Add more details or hand this case over to your instructor/TA.",
    recommendHandoverBtn: "Open Human Handover",
  },
  handover: {
    title: "Human Handover & External Help",
    subtitle:
      "Prepare a complete summary to get help from a person or official documentation.",
    referralInstructorTitle: "Ask your instructor or TA",
    referralInstructorBody:
      "Reach out to your course instructor or teaching assistant for assignment-specific requirements, grading rules, or logic guidance.",
    referralDocsTitle: "Official Python documentation",
    referralDocsBody:
      "Consult the official Python 3 documentation for built-in functions, exception types, and standard library behavior.",
    openPythonDocsBtn: "Open official Python documentation",
    nothingSentNotice:
      "Nothing has been sent automatically. This summary stays private on your device until you copy and share it yourself.",
    summaryPreviewHeading: "Handover summary preview",
    copySummaryBtn: "Copy handover summary",
    copiedSuccess: "Handover summary copied to clipboard.",
    copyFailedNotice:
      "Clipboard access was blocked. Select the summary box below and copy it manually.",
    markHandedOverBtn: "Finish as Handed Over",
    summaryHeaderTitle: "Handover Summary",
    summaryLabelTitle: "Title",
    summaryLabelCode: "Python Code",
    summaryLabelError: "Full Error / Traceback",
    summaryLabelActualOutput: "Observed Output / New Test Results",
    summaryLabelExpected: "Expected Behavior",
    summaryLabelStepsTried: "Steps & Probes Already Tried",
    summaryLabelUncertainty: "Uncertainty Note",
    summaryNoStepsYet: "No diagnostic probes or feedback events recorded yet.",
    summaryUncertaintyText:
      "Root cause remains unconfirmed in Debugging Detective; human review is requested.",
    summarySelectedHypothesis: "Selected hypothesis (unconfirmed)",
    summaryProbePrefix: "Probe",
    summaryFeedbackPrefix: "Feedback",
    summaryHypothesisInvestigating: "Investigating",
    summaryHypothesisRejected: "Rejected",
  },
  closure: {
    panelTitle: "Case Closure",
    panelSubtitle:
      "You decide when an investigation is finished. Save your final status and diagnostic summary below.",
    openClosureBtn: "Finish case",
    reopenCaseBtn: "Reopen investigation",
    statusSelectLabel: "Final case status",
    statusOptionResolved: "Resolved",
    statusOptionUnresolved: "Unresolved",
    statusOptionHandedOver: "Handed Over",
    reportedProblemLabel: "Reported problem",
    confirmedCauseLabel: "Confirmed cause",
    confirmedCausePlaceholder: "Describe the confirmed root cause (or leave as Unresolved)...",
    unresolvedValue: "Unresolved",
    evidenceLabel: "Supporting evidence",
    appliedFixLabel: "Applied fix or attempted change",
    appliedFixPlaceholder: "Describe the change you applied or tested...",
    verificationResultLabel: "Verification result",
    verificationResultPlaceholder: "What happened when you tested with sample inputs?",
    reflectionLabel: "Reflection (optional)",
    reflectionPlaceholder: "What clue or check would help you spot this faster next time?",
    btnFinishCase: "Finish case",
    btnTryAnotherTest: "Try another test",
    btnNewInvestigation: "New investigation",
    savedSummaryHeading: "Saved Closure Summary",
    systemNoteClosed: "Case finished with status: {status}.",
    systemNoteReopened: "Case reopened for further testing.",
  },
  investigations: {
    title: "My Investigations",
    subtitle:
      "Resume saved debugging cases where you left off, rename or export them, or start a new investigation.",
    countLabel: "{count} saved",
    startNewBtn: "Start New Investigation",
    searchLabel: "Search investigations",
    searchPlaceholder: "Search by title, Python code, error, or ID...",
    filterStatusLabel: "Filter by status",
    filterAll: "All",
    loading: "Loading saved investigations...",
    emptyTitle: "No saved investigations yet",
    emptyBody:
      "Start a new investigation or load one of the built-in Python example cases to begin practicing.",
    emptyBrowseHelpBtn: "Browse Help & Examples",
    noMatchesTitle: "No matching investigations",
    noMatchesBody:
      "No saved cases matched your current search or status filter.",
    resetFiltersBtn: "Reset filters",
    corruptNotice:
      "{count} unreadable saved item(s) were safely skipped during storage recovery.",
    pathLabel: "Path",
    pathNotChosen: "Not chosen yet",
    levelLabel: "Level",
    updatedLabel: "Last updated",
    actionContinue: "Continue",
    actionOpen: "Open",
    actionRename: "Rename",
    actionExportJson: "Export JSON",
    actionDelete: "Delete",
    renameInputLabel: "New investigation title",
    renameSaveBtn: "Save",
    renameCancelBtn: "Cancel",
    renameRequiredError: "Please enter a title before saving.",
    deleteConfirmTitle: "Delete investigation?",
    deleteConfirmBody:
      "Are you sure you want to delete \"{title}\"? This removes it from local storage and cannot be undone.",
    deleteConfirmBtn: "Delete investigation",
    deleteCancelBtn: "Cancel",
    exportSuccessNotice: "Exported \"{title}\" as JSON.",
    renamedAnnouncement: "Investigation renamed to \"{title}\".",
    deletedAnnouncement: "Investigation \"{title}\" deleted.",
    storageNote:
      "Stored locally via the async investigation repository and autosaved on every change.",
  },
  help: {
    title: "Help & Examples",
    subtitle:
      "Load starter Python debugging cases, review how assistance levels and paths work, and see the tool's limits and handover policy.",
    examplesHeading: "Built-in example cases",
    examplesSubtitle:
      "Load any of these three starter cases directly into New Investigation to practice diagnosing different error types.",
    loadExampleBtn: "Load into New Investigation",
    exampleCodeLabel: "Python code",
    exampleTracebackLabel: "Traceback",
    exampleLogicEvidenceLabel: "Sample input & actual output (no traceback)",
    exampleExpectedLabel: "Expected behavior",
    exampleSyntaxBadge: "Syntax Error",
    exampleSyntaxTitle: "Missing colon in an if statement",
    exampleSyntaxDesc:
      "Python stops before executing the function because the conditional header is missing a trailing colon (:).",
    exampleSyntaxExpected:
      "Return \"Pass\" when score is 60 or higher, and \"Fail\" otherwise.",
    exampleRuntimeBadge: "Runtime Error",
    exampleRuntimeTitle: "List index out of range in calculate_averages",
    exampleRuntimeDesc:
      "Built-in demo case with full prewritten responses across all four assistance levels and both investigation paths.",
    exampleLogicBadge: "Logic Error · No Traceback",
    exampleLogicTitle: "Percentage discount math produces a negative price",
    exampleLogicDesc:
      "Python finishes without raising an exception, but multiplying by percent instead of percent / 100 prints -1900 instead of 80.0.",
    exampleLogicExpected:
      "Apply a 20% discount to 100 and return 80.0 (dividing percent by 100).",
    levelsAndPathsHeading: "Assistance levels & investigation paths",
    levelsHeading: "Four student-controlled assistance levels",
    levelsNote:
      "The app never raises or lowers your level automatically. Level 4 always requires your explicit confirmation.",
    pathsHeading: "Two investigation paths",
    pathsNote:
      "Switch freely between paths at any time during an investigation without losing your case details or history.",
    limitsHeading: "Limits of Debugging Detective",
    limitsSubtitle:
      "Remember these boundaries whenever you evaluate mentor guidance:",
    limit1Title: "It does not run your Python code",
    limit1Body:
      "Debugging Detective inspects only the snippet, traceback, and outputs you provide. It has no Python execution sandbox and cannot verify fixes on its own.",
    limit2Title: "Guidance can be wrong or incomplete",
    limit2Body:
      "Both local demo guidance and future model responses can misinterpret missing context. Always test changes in your own Python environment.",
    limit3Title: "Hypotheses are not facts",
    limit3Body:
      "Every suspect card on the Hypothesis Board is an unconfirmed possibility tied to quoted evidence—never treat a hypothesis as proven until your test confirms it.",
    handoverHeading: "Human-handover policy",
    handoverBody:
      "When evidence is missing, a service is unavailable, or you remain stuck after testing probes, Debugging Detective points you to real people and official references.",
    handoverRule1Title: "Ask your instructor or TA",
    handoverRule1Body:
      "Consult your course instructor or teaching assistant for assignment specifications, grading expectations, or course-specific logic.",
    handoverRule2Title: "Consult official Python documentation",
    handoverRule2Body:
      "Use the official Python 3 documentation for authoritative syntax rules, built-in functions, and exception behavior.",
    handoverRule3Title: "Nothing is sent automatically",
    handoverRule3Body:
      "Your investigation stays private on your device. A handover summary is only copied to your clipboard when you click Copy handover summary.",
    openPythonDocsBtn: "Open official Python documentation",
    startBlankBtn: "Start blank investigation",
  },
};
