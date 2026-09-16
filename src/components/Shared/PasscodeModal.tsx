import React, { useState } from 'react';
import { KeyRound, Check, Copy, AlertCircle, Sparkles, X, ShieldCheck } from 'lucide-react';
import { TemporaryPasscode } from '../../types';
import { generateRandomPin } from '../../utils/storage';
import { playUnlockChime } from '../../utils/audio';

interface PasscodeModalProps {
  mode: 'input' | 'generate';
  isOpen: boolean;
  onClose: () => void;
  // If mode === 'input'
  onVerifyPasscode?: (code: string) => { success: boolean; message: string; duration?: number };
  // If mode === 'generate'
  onPasscodeGenerated?: (passcode: TemporaryPasscode) => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  mode,
  isOpen,
  onClose,
  onVerifyPasscode,
  onPasscodeGenerated,
}) => {
  // Input mode states
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<string>('');

  // Generate mode states
  const [duration, setDuration] = useState<number>(30);
  const [reason, setReason] = useState<string>('完成口算打卡奖励');
  const [generatedCode, setGeneratedCode] = useState<TemporaryPasscode | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMessage('');
      if (nextPin.length === 6) {
        verifyCode(nextPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const verifyCode = (code: string) => {
    if (!onVerifyPasscode) return;
    const result = onVerifyPasscode(code);
    if (result.success) {
      playUnlockChime();
      setSuccessInfo(result.message);
      setTimeout(() => {
        onClose();
        setEnteredPin('');
        setSuccessInfo('');
      }, 1200);
    } else {
      setErrorMessage(result.message);
      setEnteredPin('');
    }
  };

  const handleGenerate = () => {
    const code = generateRandomPin();
    const newPasscode: TemporaryPasscode = {
      id: `pwd_${Date.now()}`,
      code,
      durationMinutes: duration,
      reason,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h validity before usage
      status: 'active',
    };
    setGeneratedCode(newPasscode);
    if (onPasscodeGenerated) {
      onPasscodeGenerated(newPasscode);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {mode === 'input' ? (
          <div>
            <div className="text-center mb-5">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                输入家长临时密码
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                请输入家长端生成的 6 位动态临时密码解锁
              </p>
            </div>

            {/* PIN Dots display */}
            <div className="my-4 flex justify-center gap-3">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isFilled = enteredPin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`h-4 w-4 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-teal-600 scale-110 shadow-sm shadow-teal-500/50'
                        : 'bg-slate-200 border border-slate-300'
                    }`}
                  />
                );
              })}
            </div>

            {errorMessage && (
              <div className="mb-3 flex items-center justify-center gap-1.5 text-xs text-rose-500 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successInfo && (
              <div className="mb-3 flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>{successInfo}</span>
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="flex h-12 items-center justify-center rounded-2xl bg-slate-50 text-lg font-bold text-slate-800 hover:bg-slate-100 active:scale-95 transition"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => setEnteredPin('')}
                className="flex h-12 items-center justify-center rounded-2xl bg-slate-50 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                清空
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="flex h-12 items-center justify-center rounded-2xl bg-slate-50 text-lg font-bold text-slate-800 hover:bg-slate-100 active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleDeleteDigit}
                className="flex h-12 items-center justify-center rounded-2xl bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95"
              >
                删除
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Generate Mode */}
            <div className="text-center mb-4">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                生成动态临时密码
              </h3>
              <p className="text-xs text-slate-500">
                孩子输入此密码可临时解锁使用，用后自动失效
              </p>
            </div>

            {!generatedCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    延长时长
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setDuration(mins)}
                        className={`rounded-xl py-2 text-xs font-semibold border transition ${
                          duration === mins
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        +{mins}分钟
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    延时事由 / 奖励项目
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      '完成口算打卡奖励',
                      '学校英语听力作业',
                      '周末查阅资料',
                      '跳绳达标奖励',
                    ].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setReason(tag)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] transition ${
                          reason === tag
                            ? 'bg-teal-50 text-teal-700 border border-teal-200 font-medium'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="输入具体事由备注..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <button
                  id="btn-confirm-generate-code"
                  onClick={handleGenerate}
                  className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-700 transition active:scale-98 cursor-pointer"
                >
                  立即生成 6 位临时密码
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="rounded-2xl bg-teal-50/80 p-4 border border-teal-100">
                  <div className="text-[11px] font-medium text-teal-700 mb-1">
                    一次性动态临时密码 (时长 +{generatedCode.durationMinutes}分钟)
                  </div>
                  <div className="text-3xl font-mono font-black tracking-widest text-teal-800 my-1">
                    {generatedCode.code}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    备注: {generatedCode.reason}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">已复制密码</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>复制密码</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setGeneratedCode(null);
                      onClose();
                    }}
                    className="flex-1 rounded-xl bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
                  >
                    完成
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
