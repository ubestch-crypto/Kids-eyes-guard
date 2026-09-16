import React, { useState, useEffect } from 'react';
import { Sparkles, Eye, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EyeExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const EyeExerciseModal: React.FC<EyeExerciseModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(20);
      setStep(0);
      setIsFinished(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          if (onComplete) onComplete();
          return 0;
        }
        // Change steps based on time
        if (prev === 15) setStep(1);
        if (prev === 8) setStep(2);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const stepsData = [
    {
      title: '第一步：轻闭双眼，深呼吸',
      desc: '暂时放下手头的事情，轻轻闭上眼睛，深呼吸 3 次，感受眼部肌肉的舒展。',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      title: '第二步：远眺窗外 6 米以上景物',
      desc: '睁开眼睛，寻找窗外最远的一棵树或一朵云，目光在远景与鼻尖之间缓慢交替。',
      color: 'from-sky-500 to-blue-500',
    },
    {
      title: '第三步：手心搓热，温润双眸',
      desc: '双手手掌相互摩擦搓热，呈杯状轻覆在闭合的双眼上，温热滋润，放松神经。',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-teal-100">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Eye className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                20-20-20 科学护眼操
              </h3>
              <p className="text-[11px] text-slate-500">
                每用眼 20 分钟 · 远眺 20 秒 · 呵护视力
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center">
          {!isFinished ? (
            <div>
              {/* Animated Orbit / Eye Target */}
              <div className="relative mx-auto my-4 flex h-36 w-36 items-center justify-center rounded-full bg-teal-50 border-4 border-dashed border-teal-200">
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute h-8 w-8 rounded-full bg-teal-500 shadow-lg shadow-teal-500/30 flex items-center justify-center text-white text-xs"
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>

                <div className="z-10">
                  <span className="text-3xl font-black text-teal-700">
                    {secondsLeft}
                  </span>
                  <span className="text-xs text-teal-600 block font-medium">
                    秒
                  </span>
                </div>
              </div>

              {/* Step info */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4"
                >
                  <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800 mb-2">
                    {stepsData[step].title}
                  </span>
                  <p className="text-xs leading-relaxed text-slate-600 px-4">
                    {stepsData[step].desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="mt-6 flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === step
                        ? 'w-6 bg-teal-600'
                        : i < step
                        ? 'w-2 bg-teal-300'
                        : 'w-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4"
              >
                <CheckCircle2 className="h-10 w-10" />
              </motion.div>
              <h4 className="text-base font-bold text-slate-800">
                太棒了！护眼操完成
              </h4>
              <p className="mt-1.5 text-xs text-slate-500">
                双眼得到了充分滋润与休息，视力健康度 +5 分！
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full rounded-2xl bg-teal-600 py-3 text-sm font-medium text-white shadow-md hover:bg-teal-700 transition"
              >
                返回继续
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
