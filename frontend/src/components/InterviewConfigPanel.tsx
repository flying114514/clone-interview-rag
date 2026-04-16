import {AnimatePresence, motion} from 'framer-motion';
import type {InterviewSession} from '../types/interview';

interface InterviewConfigPanelProps {
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  onStart: () => void;
  isCreating: boolean;
  checkingUnfinished: boolean;
  unfinishedSession: InterviewSession | null;
  onContinueUnfinished: () => void;
  onStartNew: () => void;
  resumeText: string;
  onBack: () => void;
  error?: string;
}

export default function InterviewConfigPanel({
  questionCount,
  onQuestionCountChange,
  onStart,
  isCreating,
  checkingUnfinished,
  unfinishedSession,
  onContinueUnfinished,
  onStartNew,
  resumeText,
  onBack,
  error
}: InterviewConfigPanelProps) {
  const questionCounts = [6, 8, 10, 12, 15];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 text-white sm:px-10 sm:py-12">
      <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{duration: 0.25}}>
        <header className="mb-10">
          <h1 className="text-[28px] font-black tracking-tight text-ds-fg dark:text-neutral-50">开始一场模拟面试</h1>
          <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ds-fg-muted dark:text-neutral-400">
            选择题目数量后，系统会基于你的简历生成结构化问答。界面采用「文档式」阅读体验，便于长时间作答。
          </p>
        </header>

        <AnimatePresence>
          {checkingUnfinished && (
            <motion.div
              initial={{opacity: 0, y: -8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -8}}
              className="mb-8 rounded-[24px] border border-white/12 bg-white/[0.06] px-4 py-4 text-center text-[13px] text-white/68 shadow-[0_18px_42px_rgba(2,6,23,0.32)] backdrop-blur-[18px]"
            >
              正在检查是否有未完成的面试…
            </motion.div>
          )}

          {unfinishedSession && !checkingUnfinished && (
            <motion.div
              initial={{opacity: 0, y: -8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -8}}
              className="mb-8 rounded-[24px] border border-white/12 bg-white/[0.06] px-5 py-5 shadow-[0_18px_42px_rgba(2,6,23,0.32)] backdrop-blur-[18px]"
            >
              <p className="text-[15px] font-bold text-white">检测到未完成的模拟面试</p>
              <p className="mt-1 text-[13px] text-white/62">
                已完成 {unfinishedSession.currentQuestionIndex} / {unfinishedSession.totalQuestions} 题
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onContinueUnfinished}
                  className="inline-flex flex-1 items-center justify-center rounded-pill border border-white/12 bg-white px-5 py-3 text-[14px] font-bold text-slate-950 transition hover:bg-white/92"
                >
                  继续完成
                </button>
                <button
                  type="button"
                  onClick={onStartNew}
                  className="inline-flex flex-1 items-center justify-center rounded-pill border border-white/12 bg-black/20 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-black/28"
                >
                  开始新的
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="space-y-10">
          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ds-fg-muted dark:text-neutral-500">题目数量</p>
            <div className="flex flex-wrap gap-2">
              {questionCounts.map(count => {
                const active = questionCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onQuestionCountChange(count)}
                    className={`min-w-[3.25rem] rounded-pill px-4 py-2.5 text-[14px] font-bold transition ${
                      active
                        ? 'bg-white text-slate-950 shadow-[0_12px_24px_rgba(255,255,255,0.16)]'
                        : 'border border-white/12 bg-black/18 text-white/68 hover:bg-black/26'
                    }`}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ds-fg-muted dark:text-neutral-500">简历预览（前 500 字）</p>
            <div className="rounded-[24px] border border-white/12 bg-white/[0.06] p-4 shadow-[0_18px_42px_rgba(2,6,23,0.32)] backdrop-blur-[18px]">
              <p className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/68">
                {resumeText.substring(0, 500)}
                {resumeText.length > 500 ? '…' : ''}
              </p>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-ds-fg-muted dark:text-neutral-400">
            题目分布：项目经历(20%) + MySQL(20%) + Redis(20%) + Java基础/集合/并发(30%) + Spring(10%)
          </p>

          <AnimatePresence>
            {error ? (
              <motion.div
                initial={{opacity: 0, y: -8}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -8}}
                className="rounded-[22px] border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-[13px] text-amber-100 shadow-[0_12px_28px_rgba(245,158,11,0.08)]"
              >
                {error}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center rounded-pill border border-white/12 bg-black/20 px-6 py-3 text-[14px] font-bold text-white transition hover:bg-black/28"
            >
              返回
            </button>
            <button
              type="button"
              onClick={onStart}
              disabled={isCreating}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-pill border border-white/12 bg-white px-8 py-3 text-[14px] font-black text-slate-950 transition hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
            >
              {isCreating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ds-bg/30 border-t-ds-bg dark:border-neutral-950/30 dark:border-t-neutral-950" />
                  正在生成题目…
                </>
              ) : (
                <>开始面试</>
              )}
            </button>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
