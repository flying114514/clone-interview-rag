from pathlib import Path

chat = Path(r"d:\JavaStudy\clone-interview-rag\frontend\src\components\interview\ChatArea.tsx")
ct = chat.read_text(encoding="utf-8")

ct = ct.replace(
    "const answerLocked = submitted || Boolean(currentQuestion.userAnswer?.trim());",
    "const answerLocked = submitted;",
    1,
)

ct = ct.replace(
    "disabled:cursor-not-allowed disabled:opacity-55",
    "disabled:cursor-not-allowed disabled:opacity-85",
    1,
)

ct = ct.replace(
    "aria-label=\"提交回答\"\n            >",
    "aria-label=\"提交回答\"\n              title={answerLocked ? '本题已提交，需切题后继续' : '提交回答'}\n            >",
    1,
)

# Keep clear but not fullscreen: visible within interview area
ct = ct.replace(
    "fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-[#020817]/75 backdrop-blur-md",
    "absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#020817]/68 backdrop-blur-sm",
    1,
)
ct = ct.replace("h-24 w-24", "h-14 w-14", 1)
ct = ct.replace("border-8", "border-4", 1)
ct = ct.replace("text-xl font-bold", "text-base font-semibold", 1)
ct = ct.replace("正在收藏到知识库...", "正在收藏中...", 1)
# remove extra sub text line for concise indicator
ct = ct.replace("\n          <p className=\"text-sm text-cyan-100/80\">请稍候，马上完成</p>", "", 1)

chat.write_text(ct, encoding="utf-8")

page = Path(r"d:\JavaStudy\clone-interview-rag\frontend\src\pages\InterviewPage.tsx")
pt = page.read_text(encoding="utf-8")
pt = pt.replace(
    "if (!trimmedAnswer || submittedQuestionIndexes.has(currentQuestion.questionIndex) || Boolean(currentQuestion.userAnswer?.trim())) return;",
    "if (!trimmedAnswer || submittedQuestionIndexes.has(currentQuestion.questionIndex)) return;",
    1,
)
page.write_text(pt, encoding="utf-8")

print('patched')
