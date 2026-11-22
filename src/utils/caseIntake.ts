import { INVESTIGATION_SCHEMA_VERSION } from "@/src/config";
import type { TranslationDictionary } from "@/src/i18n/en";
import type { Investigation, Lang } from "@/src/types";

export interface CaseIntakeValues {
  code: string;
  error: string;
  expectedBehavior: string;
  actualOutput: string;
  sampleInput: string;
  noTraceback: boolean;
}

export type IntakeFieldKey =
  | "code"
  | "error"
  | "expectedBehavior"
  | "actualOutput"
  | "sampleInput";

export type IntakeCheckIssueKind =
  | "code_missing"
  | "logic_error_details_needed"
  | "expected_behavior_missing"
  | "mismatch_function"
  | "mismatch_line"
  | "mismatch_name";

export interface IntakeCheckIssue {
  id: string;
  kind: IntakeCheckIssueKind;
  severity: "warning" | "conflict";
  field: IntakeFieldKey;
  relatedFields: IntakeFieldKey[];
  title: string;
  explanation: string;
}

export type BuiltInExampleId = "syntax" | "runtime" | "logic";

export interface BuiltInExampleMeta {
  id: BuiltInExampleId;
  code: string;
  error: string;
  sampleInput: string;
  actualOutput: string;
  noTraceback: boolean;
}

export const EXAMPLE_CASE_CODE = `def calculate_averages(data):
    totals = []
    for i in range(len(data) + 1):
        row = data[i]
        totals.append(sum(row) / len(row))
    return totals

scores = [[80, 90], [75, 85], [92, 88]]
print(calculate_averages(scores))`;

export const EXAMPLE_CASE_TRACEBACK = `Traceback (most recent call last):
  File "averages.py", line 9, in <module>
    print(calculate_averages(scores))
  File "averages.py", line 4, in calculate_averages
    row = data[i]
IndexError: list index out of range`;

export const EXAMPLE_CASE_SAMPLE_INPUT = `[[80, 90], [75, 85], [92, 88]]`;

export const SYNTAX_EXAMPLE_CODE = `def check_passing(score):
    if score >= 60
        return "Pass"
    return "Fail"

print(check_passing(75))`;

export const SYNTAX_EXAMPLE_TRACEBACK = `  File "grading.py", line 2
    if score >= 60
                  ^
SyntaxError: expected ':'`;

export const LOGIC_EXAMPLE_CODE = `def apply_discount(price, percent):
    discount = price * percent
    return price - discount

print(apply_discount(100, 20))`;

export const BUILT_IN_EXAMPLES: Record<BuiltInExampleId, BuiltInExampleMeta> = {
  syntax: {
    id: "syntax",
    code: SYNTAX_EXAMPLE_CODE,
    error: SYNTAX_EXAMPLE_TRACEBACK,
    sampleInput: "score = 75",
    actualOutput: "",
    noTraceback: false,
  },
  runtime: {
    id: "runtime",
    code: EXAMPLE_CASE_CODE,
    error: EXAMPLE_CASE_TRACEBACK,
    sampleInput: EXAMPLE_CASE_SAMPLE_INPUT,
    actualOutput: "",
    noTraceback: false,
  },
  logic: {
    id: "logic",
    code: LOGIC_EXAMPLE_CODE,
    error: "",
    sampleInput: "price = 100, percent = 20",
    actualOutput: "-1900",
    noTraceback: true,
  },
};

export function isBuiltInExampleId(
  value: string | null | undefined
): value is BuiltInExampleId {
  return value === "syntax" || value === "runtime" || value === "logic";
}

export function buildBuiltInExampleValues(
  exampleId: BuiltInExampleId,
  t: TranslationDictionary
): CaseIntakeValues {
  const item = BUILT_IN_EXAMPLES[exampleId];
  const expectedBehavior =
    exampleId === "syntax"
      ? t.help.exampleSyntaxExpected
      : exampleId === "logic"
        ? t.help.exampleLogicExpected
        : t.intake.exampleExpectedBehavior;

  return {
    code: item.code,
    error: item.error,
    expectedBehavior,
    actualOutput: item.actualOutput,
    sampleInput: item.sampleInput,
    noTraceback: item.noTraceback,
  };
}

export function buildExampleCaseValues(
  t: TranslationDictionary
): CaseIntakeValues {
  return buildBuiltInExampleValues("runtime", t);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsIdentifier(code: string, identifier: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(identifier)}\\b`);
  return pattern.test(code);
}

const TRACEBACK_BUILTIN_FRAMES = new Set([
  "<module>",
  "<listcomp>",
  "<dictcomp>",
  "<setcomp>",
  "<genexpr>",
  "<lambda>",
]);

export function analyzeCaseInput(
  values: CaseIntakeValues,
  t: TranslationDictionary
): IntakeCheckIssue[] {
  const issues: IntakeCheckIssue[] = [];
  const code = values.code.trim();
  const error = values.error.trim();
  const expected = values.expectedBehavior.trim();
  const actual = values.actualOutput.trim();

  // 1. Code missing
  if (!code) {
    issues.push({
      id: "issue-code-missing",
      kind: "code_missing",
      severity: "warning",
      field: "code",
      relatedFields: ["code"],
      title: t.intake.issueCodeMissingTitle,
      explanation: t.intake.issueCodeMissingWhy,
    });
  }

  // 2. No traceback and no actual output -> treat as possible logic error (not a system failure)
  const effectiveError = values.noTraceback ? "" : error;
  if (!effectiveError && !actual) {
    issues.push({
      id: "issue-logic-details",
      kind: "logic_error_details_needed",
      severity: "warning",
      field: "actualOutput",
      relatedFields: ["sampleInput", "expectedBehavior", "actualOutput"],
      title: t.intake.issueLogicDetailsTitle,
      explanation: t.intake.issueLogicDetailsWhy,
    });
  }

  // 3. Expected behavior missing (when not already covered or as explicit reminder)
  if (!expected) {
    issues.push({
      id: "issue-expected-missing",
      kind: "expected_behavior_missing",
      severity: "warning",
      field: "expectedBehavior",
      relatedFields: ["expectedBehavior"],
      title: t.intake.issueExpectedMissingTitle,
      explanation: t.intake.issueExpectedMissingWhy,
    });
  }

  // 4. Obvious inconsistencies between code and error/traceback
  if (code && effectiveError) {
    // Check function name(s) mentioned in Python traceback frames: File "...", line N, in func_name
    const frameMatches = Array.from(
      effectiveError.matchAll(/File\s+"[^"]+",\s+line\s+(\d+),\s+in\s+([^\s\r\n]+)/g)
    );

    for (const match of frameMatches) {
      const lineNumber = Number.parseInt(match[1], 10);
      const frameSymbol = match[2];

      if (
        frameSymbol &&
        !TRACEBACK_BUILTIN_FRAMES.has(frameSymbol) &&
        !containsIdentifier(code, frameSymbol)
      ) {
        issues.push({
          id: `issue-mismatch-fn-${frameSymbol}`,
          kind: "mismatch_function",
          severity: "conflict",
          field: "error",
          relatedFields: ["code", "error"],
          title: t.intake.issueMismatchFunctionTitle,
          explanation: t.intake.issueMismatchFunctionWhy.replace(
            "{symbol}",
            frameSymbol
          ),
        });
        break;
      }

      const totalLines = values.code.split("\n").length;
      if (Number.isFinite(lineNumber) && lineNumber > totalLines) {
        issues.push({
          id: `issue-mismatch-line-${lineNumber}`,
          kind: "mismatch_line",
          severity: "conflict",
          field: "error",
          relatedFields: ["code", "error"],
          title: t.intake.issueMismatchLineTitle,
          explanation: t.intake.issueMismatchLineWhy
            .replace("{line}", String(lineNumber))
            .replace("{totalLines}", String(totalLines)),
        });
        break;
      }
    }

    // Check NameError symbol against entered code
    const nameErrorMatch = effectiveError.match(
      /NameError:\s+name\s+['"]([^'"]+)['"]\s+is not defined/
    );
    if (nameErrorMatch) {
      const missingName = nameErrorMatch[1];
      if (missingName && !containsIdentifier(code, missingName)) {
        issues.push({
          id: `issue-mismatch-name-${missingName}`,
          kind: "mismatch_name",
          severity: "conflict",
          field: "error",
          relatedFields: ["code", "error"],
          title: t.intake.issueMismatchNameTitle,
          explanation: t.intake.issueMismatchNameWhy.replace(
            "{symbol}",
            missingName
          ),
        });
      }
    }
  }

  return issues;
}

function generateInvestigationId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `inv_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function deriveInvestigationTitle(
  values: CaseIntakeValues,
  t: TranslationDictionary
): string {
  const defMatch = values.code.match(/^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/m);
  const funcName = defMatch?.[1];

  const errorText = values.noTraceback ? "" : values.error.trim();
  const errorLines = errorText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lastErrorLine = errorLines[errorLines.length - 1] ?? "";
  const errorTypeMatch = lastErrorLine.match(/^([A-Za-z_][A-Za-z0-9_]*(?:Error|Exception|Warning))/);
  const errorType = errorTypeMatch?.[1];

  if (funcName && errorType) {
    return `${funcName} · ${errorType}`;
  }
  if (funcName && values.noTraceback) {
    return `${funcName} · ${t.intake.logicCaseSuffix}`;
  }
  if (funcName) {
    return funcName;
  }
  if (errorType) {
    return errorType;
  }
  return t.intake.untitledInvestigation;
}

export function buildInvestigationFromIntake(
  values: CaseIntakeValues,
  lang: Lang,
  t: TranslationDictionary
): Investigation {
  const now = new Date().toISOString();
  const trimmedActual = values.actualOutput.trim();
  const trimmedSample = values.sampleInput.trim();

  return {
    id: generateInvestigationId(),
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
    title: deriveInvestigationTitle(values, t),
    createdAt: now,
    updatedAt: now,
    status: "open",
    language: lang,
    case: {
      code: values.code,
      error: values.noTraceback ? "" : values.error.trim(),
      expectedBehavior: values.expectedBehavior.trim(),
      ...(trimmedActual ? { actualOutput: trimmedActual } : {}),
      ...(trimmedSample ? { sampleInput: trimmedSample } : {}),
    },
    path: undefined,
    level: 1,
    turns: [],
    hypotheses: [],
    feedback: [],
  };
}

export function valuesFromInvestigation(
  investigation: Investigation
): CaseIntakeValues {
  const hasError = investigation.case.error.trim().length > 0;
  const hasActual = Boolean(investigation.case.actualOutput?.trim());
  return {
    code: investigation.case.code,
    error: investigation.case.error,
    expectedBehavior: investigation.case.expectedBehavior,
    actualOutput: investigation.case.actualOutput ?? "",
    sampleInput: investigation.case.sampleInput ?? "",
    noTraceback: !hasError && hasActual,
  };
}

export function updateInvestigationFromIntake(
  existing: Investigation,
  values: CaseIntakeValues,
  t: TranslationDictionary
): Investigation {
  const trimmedActual = values.actualOutput.trim();
  const trimmedSample = values.sampleInput.trim();

  return {
    ...existing,
    title: deriveInvestigationTitle(values, t),
    updatedAt: new Date().toISOString(),
    case: {
      code: values.code,
      error: values.noTraceback ? "" : values.error.trim(),
      expectedBehavior: values.expectedBehavior.trim(),
      ...(trimmedActual ? { actualOutput: trimmedActual } : {}),
      ...(trimmedSample ? { sampleInput: trimmedSample } : {}),
    },
  };
}
