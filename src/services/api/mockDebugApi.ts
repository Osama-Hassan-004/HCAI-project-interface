import type {
  AssistanceLevel,
  DebugRequest,
  DebugResponse,
  Hypothesis,
} from "@/src/types";
import type { DebugApiClient } from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCalculateAveragesExample(request: DebugRequest): boolean {
  return (
    request.code.includes("calculate_averages") &&
    /range\s*\(\s*len\s*\(\s*data\s*\)\s*\+\s*1\s*\)/.test(request.code)
  );
}

function firstNonEmptyLine(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[0] ?? "";
}

function lastNonEmptyLine(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[lines.length - 1] ?? "";
}

function extractMatchingCodeLine(code: string, pattern: RegExp): string | null {
  const match = code
    .split("\n")
    .map((line) => line.trim())
    .find((line) => pattern.test(line));
  return match ?? null;
}

function isInsufficientObservationMessage(message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  return (
    trimmed === "not sure" ||
    trimmed === "i don't know" ||
    trimmed === "idk" ||
    trimmed.includes("don't have the output") ||
    trimmed.includes("no output") ||
    trimmed.includes("لا أعرف") ||
    trimmed.includes("غير متأكد")
  );
}

function buildExampleHypotheses(request: DebugRequest): Hypothesis[] {
  const isAr = request.language === "ar";
  const level = request.level;

  const rangeLine =
    extractMatchingCodeLine(request.code, /range\s*\(/) ??
    "for i in range(len(data) + 1):";
  const indexLine =
    extractMatchingCodeLine(request.code, /data\s*\[\s*i\s*\]/) ??
    "row = data[i]";
  const divLine =
    extractMatchingCodeLine(request.code, /len\s*\(\s*row\s*\)/) ??
    "totals.append(sum(row) / len(row))";
  const errorTail =
    lastNonEmptyLine(request.error) || "IndexError: list index out of range";

  const probeForBound = (lvl: AssistanceLevel): string => {
    if (isAr) {
      switch (lvl) {
        case 1:
          return "أضف print(i, len(data)) قبل السطر row = data[i] وشاهد آخر قيمة يطبعها البرنامج.";
        case 2:
          return "تذكّر أن range(n) في Python تتوقف عند n - 1؛ فاحسب آخر قيمة ناتجة عن range(len(data) + 1).";
        case 3:
          return "خطوة منطقية: اجعل حد الحلقة يتوقف عند len(data) بدلاً من تجاوزه ثم قارن الفهارس.";
        case 4:
          return "استبدل range(len(data) + 1) بـ range(len(data)) وتحقّق من المخرجات على scores.";
      }
    }
    switch (lvl) {
      case 1:
        return "Add print(i, len(data)) right before row = data[i] and check the last printed pair.";
      case 2:
        return "Check what range(n) produces in Python: when n is len(data) + 1, what is the final value of i?";
      case 3:
        return "Structural check: limit the loop counter so i stays strictly less than the length of data.";
      case 4:
        return "Change range(len(data) + 1) to range(len(data)) and re-run with scores.";
    }
  };

  const probeForEmptyRow = (lvl: AssistanceLevel): string => {
    if (isAr) {
      switch (lvl) {
        case 1:
          return "اطبع len(row) داخل الحلقة للتحقق مما إذا كانت أي قائمة فرعية فارغة.";
        case 2:
          return "في Python، القسمة على len(row) عندما تكون القائمة فارغة تطلق ZeroDivisionError.";
        case 3:
          return "أضف شرطاً يتحقق من أن len(row) > 0 قبل حساب sum(row) / len(row).";
        case 4:
          return "اختبر الدالة مع مدخل يحتوي على قائمة فرعية فارغة مثل [[80, 90], []] وأضف حارس طول.";
      }
    }
    switch (lvl) {
      case 1:
        return "Print len(row) inside the loop to see whether any inner sublist is empty.";
      case 2:
        return "Dividing by len(row) when row is empty would trigger ZeroDivisionError in Python.";
      case 3:
        return "Guard the division step by checking whether len(row) > 0 before dividing.";
      case 4:
        return "Test with an empty inner list like [[80, 90], []] and handle len(row) == 0 explicitly.";
    }
  };

  const probeForInputShape = (lvl: AssistanceLevel): string => {
    if (isAr) {
      switch (lvl) {
        case 1:
          return "اطبع type(data) و type(row) في أول دورة للتأكد من بنية المدخلات.";
        case 2:
          return "الدالة sum(row) تتطلب أن يكون row كائناً قابلاً للتكرار من أرقام، وليس عدداً مفرداً.";
        case 3:
          return "تحقق في البداية من أن كل عنصر داخل data عبارة عن قائمة غير فارغة.";
        case 4:
          return "تأكد أن الاستدعاء يمرر قائمة قوائم مثل [[80, 90], [75, 85]] وليس قائمة أرقام مسطّحة.";
      }
    }
    switch (lvl) {
      case 1:
        return "Print type(data) and type(row) on the first iteration to verify the nested structure.";
      case 2:
        return "Python's sum(row) and len(row) assume each item in data is itself a sequence, not a single number.";
      case 3:
        return "Verify the input contract before looping so each element in data is a list or tuple.";
      case 4:
        return "Confirm the caller passes a list of lists like [[80, 90], [75, 85]] rather than a flat list.";
    }
  };

  return [
    {
      id: "hyp_calc_range_bound",
      title: isAr
        ? "تجاوز حد الفهرسة في range(len(data) + 1)"
        : "Loop range stops one index past the end of data",
      explanation: isAr
        ? "استخدام len(data) + 1 يجعل المتغير i يصل إلى قيمة مساوية لطول القائمة، وهو فهرس غير موجود."
        : "Using len(data) + 1 lets i reach len(data), which is outside valid 0-based list indices.",
      evidence: [rangeLine, indexLine, errorTail],
      probe: probeForBound(level),
      status: "proposed",
    },
    {
      id: "hyp_calc_empty_row",
      title: isAr
        ? "احتمال وجود قائمة فرعية فارغة عند القسمة"
        : "Possible empty sublist before dividing by len(row)",
      explanation: isAr
        ? "إذا احتوت data على قائمة فرعية فارغة، فستصبح قيمة len(row) صفراً عند حساب المتوسط."
        : "If any element in data is an empty list, len(row) evaluates to 0 during average calculation.",
      evidence: [divLine, indexLine],
      probe: probeForEmptyRow(level),
      status: "proposed",
    },
    {
      id: "hyp_calc_input_shape",
      title: isAr
        ? "احتمال اختلاف بنية المدخل data عمّا تتوقعه الدالة"
        : "Input data shape might not match a list of lists",
      explanation: isAr
        ? "تفترض الدالة أن كل عنصر data[i] هو قائمة أرقام؛ وأي عنصر غير ذلك يغيّر سلوك الحلقة."
        : "The loop expects every data[i] element to be a numeric sublist rather than a scalar value.",
      evidence: [
        indexLine,
        request.expected_behavior ||
          (isAr ? "متوقع إرجاع قائمة متوسطات" : "Expected list of averages"),
      ],
      probe: probeForInputShape(level),
      status: "proposed",
    },
  ];
}

function buildFeedbackFollowUpResponse(request: DebugRequest): DebugResponse | null {
  const msg = (request.message ?? "").trim();
  const lower = msg.toLowerCase();
  const isAr = request.language === "ar";
  const isStillFailing =
    lower.startsWith("[feedback:still_failing]") ||
    lower.startsWith("[feedback:different_result]");

  if (!isStillFailing) {
    return null;
  }

  const isDifferent = lower.startsWith("[feedback:different_result]");
  const newOutputText = msg.replace(/^\[feedback:(still_failing|different_result)\]\s*/i, "").trim();

  if (!newOutputText || isInsufficientObservationMessage(newOutputText)) {
    return {
      status: "insufficient_evidence",
      provider: "local-mock",
      is_demo: true,
      level_applied: request.level,
      missing_info: isAr
        ? [
            "المخرج أو رسالة traceback الجديدة بعد التجربة",
            "المدخل الدقيق الذي استخدمته في الاختبار الأخير",
          ]
        : [
            "Exact new output or traceback produced after your test",
            "Exact sample input used in the latest run",
          ],
      message: isAr
        ? "لا توجد أدلة جديدة كافية للمتابعة بعد هذه المحاولة دون تخمين. نعرف الشيفرة الأصلية والسلوك المتوقع، لكننا لا نعرف المخرج الجديد بعد تعديلك الأخير."
        : "There is not enough new runtime evidence after this test to diagnose further without guessing. We know your original code and expected behavior, but we do not know the exact output from your latest run.",
      next_question: isAr
        ? "إذا تعذّر تشغيل اختبار إضافي أو الحصول على المخرج الجديد، يُنصح بإحالة الحالة إلى مدرسك أو المعيد مع ملخص الأدلة."
        : "If you cannot capture the new output right now, consider handing this case over to your instructor or TA.",
      hypotheses:
        request.path === "hypothesis_board"
          ? buildExampleHypotheses(request)
          : undefined,
    };
  }

  if (isAr) {
    return {
      status: "ok",
      provider: "local-mock",
      is_demo: true,
      level_applied: request.level,
      message: isDifferent
        ? `شكراً لتسجيل المخرج المختلف الجديد («${newOutputText}»). هذا الدليل يغيّر مسار الفحص، لذا لن نكرر الاقتراح السابق كأنه نجح.`
        : `شكراً لتسجيل أن الحالة ما زالت تفشل مع المخرج الجديد («${newOutputText}»). لن نعيد الاقتراح السابق؛ دعنا نقارن السطر الذي غيّرته بالمخرج الجديد.`,
      next_question:
        "بمقارنة هذا المخرج الجديد بالسلوك المتوقع، أي سطر ما زال ينفّذ قيمة غير متوقعة؟",
    };
  }

  return {
    status: "ok",
    provider: "local-mock",
    is_demo: true,
    level_applied: request.level,
    message: isDifferent
      ? `Recorded your different result ("${newOutputText}") as new evidence. Since the behavior changed, we will inspect this new symptom instead of repeating the previous suggestion.`
      : `Recorded that the case is still failing with new output ("${newOutputText}"). We will not repeat the previous step—let us trace what changed between your latest edit and this output.`,
    next_question:
      "Comparing this new output against your expected behavior, which variable or line produced the unexpected value?",
  };
}

function buildExampleConversationTurn(request: DebugRequest): DebugResponse {
  const feedbackFollowUp = buildFeedbackFollowUpResponse(request);
  if (feedbackFollowUp) {
    return feedbackFollowUp;
  }

  const isAr = request.language === "ar";
  const userMessage = (request.message ?? "").trim();
  const userLower = userMessage.toLowerCase();
  const isHintRequest =
    userLower.includes("hint") || userMessage.includes("تلميح");
  const isDetailRequest =
    userLower.includes("detail") || userMessage.includes("تفصيل");
  const hasPriorTurns = request.history.length > 0;

  if (userMessage && isInsufficientObservationMessage(userMessage)) {
    return {
      status: "insufficient_evidence",
      provider: "local-mock",
      is_demo: true,
      level_applied: request.level,
      missing_info: isAr
        ? ["القيم الفعلية لمتغير الفهرس i أو مخرج التشغيل"]
        : ["Observed runtime values of i or actual test output"],
      message: isAr
        ? "المعطيات الحالية غير كافية لتأكيد السبب دون تخمين. نعرف الشيفرة المدخلة ورسالة IndexError، لكن تنقصنا نتيجة المراقبة أثناء التنفيذ."
        : "Evidence is currently insufficient to confirm the next step without guessing. We know your submitted snippet and IndexError, but we are missing the runtime output from your check.",
      next_question: isAr
        ? "يمكنك مشاركة مخرج جملة print() أو إحالة الملخص إلى مدرسك للمراجعة."
        : "Share the output of a quick print check, or use Human Handover if you are stuck.",
    };
  }

  switch (request.level) {
    case 1: {
      if (isHintRequest) {
        return isAr
          ? {
              status: "ok",
              provider: "local-mock",
              is_demo: true,
              level_applied: 1,
              message:
                "أنت ما زلت عند المستوى ١ (أسئلة تشخيصية)، لذلك لن أكشف المفهوم النظري بعد. جرّب طباعة i و len(data) قبل السطر row = data[i].",
              next_question:
                "عند تشغيل الدالة على 3 قوائم فرعية، ما القيم التي تتوقع أن يأخذها i من البداية حتى التوقف؟",
            }
          : {
              status: "ok",
              provider: "local-mock",
              is_demo: true,
              level_applied: 1,
              message:
                "Staying at Level 1 (Diagnostic Probes), here is a small observation experiment: insert print('i =', i, 'len =', len(data)) right above row = data[i].",
              next_question:
                "When data has 3 sublists, what is the last value of i printed right before the IndexError?",
            };
      }

      if (isDetailRequest) {
        return isAr
          ? {
              status: "ok",
              provider: "local-mock",
              is_demo: true,
              level_applied: 1,
              message:
                "لنتتبع سطر الحلقة تحديداً: for i in range(len(data) + 1). عندما يكون طول data يساوي 3، فإن التعبير len(data) + 1 يساوي 4.",
              next_question:
                "ما هي الفهارس الصالحة داخل قائمة طولها 3 في Python؟",
            }
          : {
              status: "ok",
              provider: "local-mock",
              is_demo: true,
              level_applied: 1,
              message:
                "Look closely at the loop header: for i in range(len(data) + 1). When data has 3 elements, len(data) + 1 evaluates to 4.",
              next_question:
                "Which index numbers actually exist in a 3-element Python list?",
            };
      }

      if (hasPriorTurns && userMessage) {
        return isAr
          ? {
              status: "ok",
              provider: "local-mock",
              is_demo: true,
              level_applied: 1,
              message:
                "ملاحظة ممتازة. عند مقارنة قيم i بطول القائمة، نرى أن الوصول إلى data[i] يفشل في اللحظة التي يتجاوز فيها الفهرس آخر عنصر.",
              next_question:
                "ما التغيير في تعبير range(...) الذي يجعل الحلقة تتوقف عند الفهرس 2 بدلاً من الوصول إلى 3؟",
            }
          : {
              status: "ok",
              provider: "local-mock",
              is_demo: true,
              level_applied: 1,
              message:
                "Good observation. Comparing i against len(data) shows the crash happens at the exact iteration where i reaches len(data).",
              next_question:
                "If valid indices for 3 elements are 0, 1, and 2, what argument should range(...) receive so it stops after 2?",
            };
      }

      return isAr
        ? {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: 1,
            message:
              "تشير رسالة traceback إلى السطر 4 داخل الدالة calculate_averages عند تنفيذ row = data[i] مع الخطأ IndexError.",
            next_question:
              "إذا كانت scores تحتوي على 3 قوائم فرعية، فما أعلى قيمة يصل إليها المتغير i في range(len(data) + 1)؟",
          }
        : {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: 1,
            message:
              "The traceback points to line 4 inside calculate_averages at row = data[i], raising IndexError: list index out of range.",
            next_question:
              "When scores has 3 sublists, what values does range(len(data) + 1) produce for i?",
          };
    }

    case 2:
      return isAr
        ? {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: 2,
            message:
              "في Python، فهارس القوائم تبدأ من 0 وتنتهي عند len(data) - 1. كما أن الدالة range(n) تولّد الأعداد من 0 حتى n - 1 وتستبعد n نفسها. لذلك استخدام range(len(data) + 1) يضمّ القيمة len(data) غير الموجودة في القائمة.",
            next_question:
              "بناءً على هذه القاعدة، لماذا كانت إضافة + 1 داخل range(...) سبباً للوصول خارج الحدود؟",
          }
        : {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: 2,
            message:
              "In Python, list indices are 0-based (0 to len(data) - 1), and range(n) already stops at n - 1. Passing len(data) + 1 makes range include len(data), which is one step past the last valid index.",
            next_question:
              "Using this rule, why does removing or keeping + 1 change the final index passed to data[i]?",
          };

    case 3:
      return isAr
        ? {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: 3,
            message:
              "الهيكل المقترح للإصلاح (بدون شيفرة Python):\n1. ابدأ قائمة فارغة لتخزين المتوسطات.\n2. كرّر على فهارس العناصر من 0 حتى طول القائمة ناقص 1 (أو مرّ مباشرة على كل قائمة فرعية).\n3. تأكد أن القائمة الفرعية ليست فارغة قبل القسمة، ثم أضف المتوسط وأعد القائمة.",
            next_question:
              "كيف تكتب الخطوة 2 بصياغة Python صحيحة في سطر الحلقة؟",
          }
        : {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: 3,
            message:
              "Pseudocode skeleton (without writing the exact Python edit):\n1. Initialize an empty results list.\n2. Loop over valid indices from 0 up to length(data) - 1 (or iterate directly over each sublist).\n3. Guard against an empty sublist before dividing sum by length, append the average, and return results.",
            next_question:
              "How would you rewrite your loop line in Python to match step 2?",
          };

    case 4:
      return isAr
        ? {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: 4,
            message:
              "بما أنك أكّدت اختيار المستوى ٤ (كشف الحل)، إليك التصحيح:\n```python\ndef calculate_averages(data):\n    totals = []\n    for i in range(len(data)):\n        row = data[i]\n        if len(row) > 0:\n            totals.append(sum(row) / len(row))\n    return totals\n```\nاستخدام range(len(data)) يولّد الفهارس 0 و1 و2 فقط دون تجاوز الحدود.",
            next_question:
              "تأمل الحل: لماذا كان len(data) كافياً وحده داخل range(...) مقارنةً بـ len(data) + 1؟",
          }
        : {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: 4,
            message:
              "Since you confirmed Level 4 (Reveal Solution), here is the corrected Python function:\n```python\ndef calculate_averages(data):\n    totals = []\n    for i in range(len(data)):\n        row = data[i]\n        if len(row) > 0:\n            totals.append(sum(row) / len(row))\n    return totals\n```\nBecause range(len(data)) stops at len(data) - 1, every data[i] lookup stays inside valid bounds.",
            next_question:
              "Reflection check: in your own words, why does range(len(data)) prevent the IndexError without skipping the last sublist?",
          };
  }
}

function buildExampleSelectedHypothesisTurn(
  request: DebugRequest
): DebugResponse {
  const feedbackFollowUp = buildFeedbackFollowUpResponse(request);
  if (feedbackFollowUp) {
    return {
      ...feedbackFollowUp,
      hypotheses: buildExampleHypotheses(request),
    };
  }

  const isAr = request.language === "ar";
  const allHyps = buildExampleHypotheses(request);
  const selected = allHyps.find((h) => h.id === request.selected_hypothesis_id);

  if (!selected) {
    if (request.user_hypothesis) {
      return isAr
        ? {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: request.level,
            message: `تم تحديد فرضيتك الخاصة «${request.user_hypothesis}» كاتجاه الفحص الحالي عند المستوى ${request.level}.`,
            next_question:
              "ما المخرج أو القيمة التي تتوقع ملاحظتها عند تشغيل الفحص المرتبط بهذه الفرضية؟",
            hypotheses: allHyps,
          }
        : {
            status: "ok",
            provider: "local-mock",
            is_demo: true,
            level_applied: request.level,
            message: `Your custom hypothesis "${request.user_hypothesis}" is active at Level ${request.level}.`,
            next_question:
              "What concrete output or variable value would either support or rule out this hypothesis?",
            hypotheses: allHyps,
          };
    }

    return {
      status: "ok",
      provider: "local-mock",
      is_demo: true,
      level_applied: request.level,
      message: isAr
        ? "هذه البطاقات غير مؤكدة بعد ومرتبطة بأدلة من شيفرتك. اختر واحدة لتجربة الفحص التشخيصي."
        : "These unconfirmed suspect causes are tied to quotes from your code and traceback. Select one to run its probe.",
      hypotheses: allHyps,
    };
  }

  return {
    status: "ok",
    provider: "local-mock",
    is_demo: true,
    level_applied: request.level,
    message: isAr
      ? `الفرضية النشطة (غير مؤكدة): «${selected.title}».\nالفحص عند المستوى ${request.level}: ${selected.probe}`
      : `Active unconfirmed hypothesis: "${selected.title}".\nLevel ${request.level} probe: ${selected.probe}`,
    next_question: isAr
      ? "جرّب هذا الفحص ثم قرّر هل الأدلة تؤيد هذه الفرضية أم تستبعدها."
      : "Run this probe on your code and decide whether the evidence supports or rules out this hypothesis.",
    hypotheses: allHyps,
  };
}

function buildGenericMockResponse(request: DebugRequest): DebugResponse {
  const feedbackFollowUp = buildFeedbackFollowUpResponse(request);
  if (feedbackFollowUp) {
    return feedbackFollowUp;
  }

  const isAr = request.language === "ar";
  const hasCode = request.code.trim().length > 0;
  const hasError = request.error.trim().length > 0;
  const hasExpected = request.expected_behavior.trim().length > 0;
  const msg = (request.message ?? "").trim();

  if (msg && isInsufficientObservationMessage(msg)) {
    return {
      status: "insufficient_evidence",
      provider: "local-mock",
      is_demo: true,
      level_applied: request.level,
      missing_info: isAr
        ? [
            "المخرج الفعلي أو قيم المتغيرات وقت التشغيل",
            "مدخل اختبار صغير قابل للتكرار",
          ]
        : [
            "Observed runtime output or variable values",
            "Small reproducible sample input",
          ],
      message: isAr
        ? "الأدلة غير كافية في وضع المحاكاة للمتابعة دون تخمين. لدينا نص الشيفرة المدخلة، لكننا لا نعرف المخرجات الفعلية أثناء التشغيل."
        : "Insufficient evidence to proceed without guessing. We have your submitted text, but the runtime observation is missing.",
      next_question: isAr
        ? "نوصي بإحالة الحالة إلى مدرسك أو المعيد مع ملخص الأدلة المتوفرة."
        : "We recommend handing this case over to your instructor or TA with the collected case summary.",
      hypotheses: request.path === "hypothesis_board" ? [] : undefined,
    };
  }

  // Weak or missing evidence -> return needs_clarification, never invent a diagnosis or pad cards
  if (!hasCode || (!hasError && !hasExpected)) {
    const missing: string[] = [];
    if (!hasCode) {
      missing.push(isAr ? "شيفرة Python" : "Python code snippet");
    }
    if (!hasError) {
      missing.push(
        isAr
          ? "رسالة traceback أو المخرجات الفعلية"
          : "Observed traceback or actual output"
      );
    }
    if (!hasExpected) {
      missing.push(isAr ? "السلوك المتوقع" : "Expected behavior");
    }

    return {
      status: "needs_clarification",
      provider: "local-mock",
      is_demo: true,
      level_applied: request.level,
      missing_info: missing,
      message: isAr
        ? "عنصر نائب تجريبي (استجابة محاكاة عامة): المعلومات الحالية ناقصة؛ لا يمكن للمحاكاة المحلية اقتراح تشخيص أو فرضيات موثوقة دون شيفرة Python وتوضيح العرض أو السلوك المتوقع."
        : "Generic demo placeholder (needs clarification): Required case details are missing, so the local mock cannot propose a reliable probe or suspect card without inventing a guess.",
      next_question: isAr
        ? "هل يمكنك إضافة الجزء الناقص عبر «تعديل التفاصيل» لنتمكن من البدء بأدلة واضحة؟"
        : "Could you add the missing details via Edit details so we have concrete evidence to inspect?",
      hypotheses: request.path === "hypothesis_board" ? [] : undefined,
    };
  }

  const codeQuote =
    firstNonEmptyLine(request.code) ||
    (isAr ? "سطر من شيفرتك" : "Submitted Python snippet");
  const errorQuote =
    lastNonEmptyLine(request.error) || request.expected_behavior.trim();

  if (request.path === "hypothesis_board") {
    const genericHypotheses: Hypothesis[] = hasError
      ? [
          {
            id: "hyp_generic_trace_point",
            title: isAr
              ? "فرضية عامة (محاكاة): مراجعة السطر المرتبط بالخطأ"
              : "Generic demo placeholder: inspect the line linked to the reported error",
            explanation: isAr
              ? "هذا قالب تجريبي عام وليس تشخيصاً فعلياً بالذكاء الاصطناعي؛ راجع القيم عند السطر المذكور في الخطأ."
              : "This is a generic demo placeholder rather than a real AI diagnosis; inspect runtime values around the reported error.",
            evidence: [codeQuote, errorQuote],
            probe: isAr
              ? `عند المستوى ${request.level}: اطبع قيم المتغيرات وأنواعها قبل النقطة التي يظهر فيها الخطأ.`
              : `At Level ${request.level}: print the variable values and types immediately before the failing operation.`,
            status: "proposed",
          },
        ]
      : [];

    if (genericHypotheses.length === 0) {
      return {
        status: "insufficient_evidence",
        provider: "local-mock",
        is_demo: true,
        level_applied: request.level,
        missing_info: [
          isAr
            ? "رسالة traceback أو مقارنة بين المدخلات والمخرجات الفعلية"
            : "Traceback or actual vs expected output comparison",
        ],
        message: isAr
          ? "الأدلة غير كافية لاقتراح فرضيات موثوقة دون تخمين: لا توجد رسالة traceback، ولا تتوفر أدلة تشغيل إضافية."
          : "Insufficient evidence to propose hypothesis cards without guessing: no traceback was provided and runtime evidence is incomplete.",
        next_question: isAr
          ? "شارك مدخل اختبار والمخرج الفعلي أو أحِل الحالة إلى مدرسك."
          : "Share a sample input and actual output, or hand this case over to your instructor/TA.",
        hypotheses: [],
      };
    }

    return {
      status: "ok",
      provider: "local-mock",
      is_demo: true,
      level_applied: request.level,
      message: isAr
        ? `استجابة محاكاة عامة (عنصر نائب تجريبي للمستوى ${request.level}): لم تُحلَّل شيفرتك المخصصة بواسطة نموذج ذكاء اصطناعي.`
        : `Generic demo placeholder (Level ${request.level}): Your custom snippet was not analyzed by an AI model.`,
      next_question: isAr
        ? "اختر بطاقة لمراجعة فحصها أو أضف فرضيتك الخاصة من ملاحظاتك."
        : "Select the placeholder card to review its check or add your own hypothesis from your observations.",
      hypotheses: genericHypotheses,
    };
  }

  const levelText = (() => {
    if (isAr) {
      switch (request.level) {
        case 1:
          return "عنصر نائب تجريبي للمستوى ١ (أسئلة تشخيصية): هذه استجابة محاكاة عامة وليست تشخيصاً حقيقياً لشيفرتك المخصصة. حدّد السطر الأقرب للخطأ وضع جملة print() لفحص قيم المتغيرات قبله.";
        case 2:
          return "عنصر نائب تجريبي للمستوى ٢ (تلميح مفاهيمي): هذه استجابة محاكاة عامة وليست تشخيصاً حقيقياً لشيفرتك. راجع أنواع البيانات وشروط الحدود في Python حول موضع العرض.";
        case 3:
          return "عنصر نائب تجريبي للمستوى ٣ (هيكل عام): هذه استجابة محاكاة عامة. 1) تحقّق من صحة المدخلات. 2) تتبّع المتغير الرئيسي خطوة بخطوة. 3) اختبر أصغر حالة ممكنة.";
        case 4:
          return "عنصر نائب تجريبي للمستوى ٤: لأن هذا وضع المحاكاة المحلي دون ذكاء اصطناعي فعلي، لا يُولَّد إصلاح مخصص لشيفرتك خارج حالة المثال المدمجة.";
      }
    }
    switch (request.level) {
      case 1:
        return "Generic demo placeholder (Level 1 · Diagnostic Probes): This local mock does not run real AI analysis on custom code. Locate the line closest to the symptom and print the variables evaluated there.";
      case 2:
        return "Generic demo placeholder (Level 2 · Conceptual Hint): This local mock does not run real AI analysis on custom code. Check Python data types, indexing bounds, or loop conditions near the symptom.";
      case 3:
        return "Generic demo placeholder (Level 3 · Pseudocode Skeleton): Generic debugging outline — 1) Validate inputs, 2) Trace state changes before the failing line, 3) Test with a minimal sample input.";
      case 4:
        return "Generic demo placeholder (Level 4 · Reveal Solution): Because local mock mode does not invoke a real AI model, custom solution code is only prewritten for the built-in example case.";
    }
  })();

  return {
    status: "ok",
    provider: "local-mock",
    is_demo: true,
    level_applied: request.level,
    message: levelText,
    next_question: isAr
      ? "ما القيم التي ظهرت عند فحص السطر المشتبه به؟"
      : "What values did you observe when checking the suspected line?",
  };
}

export class MockDebugApi implements DebugApiClient {
  async submitDebugTurn(request: DebugRequest): Promise<DebugResponse> {
    await sleep(220);

    if (isCalculateAveragesExample(request)) {
      if (request.path === "hypothesis_board") {
        return buildExampleSelectedHypothesisTurn(request);
      }
      return buildExampleConversationTurn(request);
    }

    return buildGenericMockResponse(request);
  }
}
