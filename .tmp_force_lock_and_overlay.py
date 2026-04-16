from pathlib import Path

chat = Path(r"d:\JavaStudy\clone-interview-rag\frontend\src\components\interview\ChatArea.tsx")
text = chat.read_text(encoding="utf-8")

# Add answerLocked derived flag
if "const answerLocked" not in text:
    text = text.replace(
        "  const bookmarkBtnClass = currentQuestion.collected\n    ? 'inline-flex h-10 w-10 items-center justify-center rounded-pill bg-amber-300 text-slate-950 transition hover:bg-amber-200 disabled:opacity-50'\n    : `${toolbarIconBtn} border border-white/10`;\n",
        "  const bookmarkBtnClass = currentQuestion.collected\n    ? 'inline-flex h-10 w-10 items-center justify-center rounded-pill bg-amber-300 text-slate-950 transition hover:bg-amber-200 disabled:opacity-50'\n    : `${toolbarIconBtn} border border-white/10`;\n\n  const answerLocked = submitted || Boolean(currentQuestion.userAnswer?.trim());\n",
        1,
    )

# Keydown lock
text = text.replace("if (submitted) {", "if (answerLocked) {", 1)

# Bigger global overlay
text = text.replace(
    "<div className=\"absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#020817]/70 backdrop-blur-sm\">\n          <div className=\"h-16 w-16 animate-spin rounded-full border-4 border-cyan-200/25 border-t-cyan-200\" />\n          <p className=\"text-base font-semibold tracking-wide text-cyan-100\">正在收藏到知识库...</p>",
    "<div className=\"fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-[#020817]/75 backdrop-blur-md\">\n          <div className=\"h-24 w-24 animate-spin rounded-full border-8 border-cyan-200/25 border-t-cyan-200\" />\n          <p className=\"text-xl font-bold tracking-wide text-cyan-100\">正在收藏到知识库...</p>",
    1,
)

# Input lock
text = text.replace(
    "placeholder={submitted ? \"本题已提交，不能再次提交\" : \"写下你的回答…（Ctrl / Cmd + Enter 提交）\"}",
    "placeholder={answerLocked ? \"本题已提交，不能再次提交\" : \"写下你的回答…（Ctrl / Cmd + Enter 提交）\"}",
    1,
)
text = text.replace(
    "disabled={isSubmitting || submitted}",
    "disabled={isSubmitting || answerLocked}",
    1,
)

# Submit button lock + stronger gray style
text = text.replace(
    "disabled={!answer.trim() || isSubmitting || submitted}",
    "disabled={!answer.trim() || isSubmitting || answerLocked}",
    1,
)
text = text.replace(
    "${submitted ? 'border-slate-600 bg-slate-700 text-slate-300' : 'border-white/10 bg-white text-slate-950 hover:bg-white/92'}",
    "${answerLocked ? 'border-slate-500 bg-slate-600 text-slate-300' : 'border-white/10 bg-white text-slate-950 hover:bg-white/92'}",
    1,
)

chat.write_text(text, encoding="utf-8")

page = Path(r"d:\JavaStudy\clone-interview-rag\frontend\src\pages\InterviewPage.tsx")
ptext = page.read_text(encoding="utf-8")

# Hard guard in submit handler by existing answer
ptext = ptext.replace(
    "    const trimmedAnswer = answer.trim();\n    if (!trimmedAnswer || submittedQuestionIndexes.has(currentQuestion.questionIndex)) return;\n",
    "    const trimmedAnswer = answer.trim();\n    if (!trimmedAnswer || submittedQuestionIndexes.has(currentQuestion.questionIndex) || Boolean(currentQuestion.userAnswer?.trim())) return;\n",
    1,
)

page.write_text(ptext, encoding="utf-8")
print('patched')
