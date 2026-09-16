import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ShieldAlert,
  KeyRound,
  Eye,
  PhoneCall,
  Sparkles,
  Award,
  BookOpen,
  Palette,
  Compass,
  CheckCircle2,
  Volume2,
  Smartphone,
  AlertTriangle,
  X,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChildDevice, TemporaryPasscode, HabitTask } from '../../types';
import { playTwoMinuteWarningChime, playLockChime } from '../../utils/audio';
import { EyeExerciseModal } from '../Shared/EyeExerciseModal';
import { PasscodeModal } from '../Shared/PasscodeModal';

interface ChildScreenProps {
  device: ChildDevice;
  habitTasks: HabitTask[];
  onVerifyPasscode: (code: string) => { success: boolean; message: string; duration?: number };
  onRequestExtension: (minutes: number, reason: string) => void;
  onCompleteHabit: (taskId: string) => void;
  onTriggerSelfLock: () => void;
  isStandaloneSimulator?: boolean;
}

export const ChildScreen: React.FC<ChildScreenProps> = ({
  device,
  habitTasks,
  onVerifyPasscode,
  onRequestExtension,
  onCompleteHabit,
  onTriggerSelfLock,
  isStandaloneSimulator = false,
}) => {
  // Modal states
  const [showEyeModal, setShowEyeModal] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionReason, setExtensionReason] = useState('学校绘本作业还剩2页没听完');
  const [extensionSentSuccess, setExtensionSentSuccess] = useState(false);
  const [showEmergencyCallModal, setShowEmergencyCallModal] = useState(false);

  // Active simulated app inside child tablet
  const [activeApp, setActiveApp] = useState<string | null>(null);

  // Track warning sound played
  const hasPlayedWarningRef = useRef(false);
  const hasPlayedLockRef = useRef(false);

  const remainingSecs = device.remainingSeconds;
  const isTwoMinuteWarning = remainingSecs <= 120 && remainingSecs > 0 && !device.isLocked;
  const isLocked = device.isLocked || remainingSecs <= 0;

  // Sound triggers
  useEffect(() => {
    if (isTwoMinuteWarning && !hasPlayedWarningRef.current) {
      playTwoMinuteWarningChime();
      hasPlayedWarningRef.current = true;
    }
    if (!isTwoMinuteWarning && remainingSecs > 120) {
      hasPlayedWarningRef.current = false;
    }
  }, [isTwoMinuteWarning, remainingSecs]);

  useEffect(() => {
    if (isLocked && !hasPlayedLockRef.current) {
      playLockChime();
      hasPlayedLockRef.current = true;
    }
    if (!isLocked) {
      hasPlayedLockRef.current = false;
    }
  }, [isLocked]);

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const s = Math.max(0, totalSeconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendExtension = () => {
    onRequestExtension(15, extensionReason);
    setExtensionSentSuccess(true);
    setTimeout(() => {
      setExtensionSentSuccess(false);
      setShowExtensionModal(false);
    }, 1500);
  };

  // Safe apps available on child device
  const installedApps = [
    { name: '悟空识字', category: '汉字启蒙', icon: '🐵', color: 'from-amber-400 to-orange-500' },
    { name: '斑马少儿绘本', category: '双语分级阅读', icon: '🦓', color: 'from-sky-400 to-indigo-500' },
    { name: '妙笔小小画板', category: '艺术涂鸦', icon: '🎨', color: 'from-pink-400 to-rose-500' },
    { name: '中华诗词奇游', category: '国学吟诵', icon: '📜', color: 'from-emerald-400 to-teal-600' },
    { name: '少年探索百科', category: '自然科普', icon: '🔭', color: 'from-purple-400 to-violet-600' },
    { name: '口算达人挑战', category: '数感思维', icon: '🧮', color: 'from-blue-400 to-cyan-500' },
  ];

  return (
    <div className="relative w-full h-full min-h-[620px] rounded-3xl bg-slate-900 text-slate-100 flex flex-col overflow-hidden shadow-2xl border-4 border-slate-800 select-none">
      {/* 20-20-20 Eye Exercise Modal */}
      <EyeExerciseModal
        isOpen={showEyeModal}
        onClose={() => setShowEyeModal(false)}
        onComplete={() => setShowEyeModal(false)}
      />

      {/* Temporary Passcode Input Modal */}
      <PasscodeModal
        mode="input"
        isOpen={showPasscodeModal}
        onClose={() => setShowPasscodeModal(false)}
        onVerifyPasscode={onVerifyPasscode}
      />

      {/* Emergency Call Modal */}
      {showEmergencyCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-xs rounded-3xl bg-white p-5 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                <PhoneCall className="h-4 w-4 text-emerald-600" />
                亲情紧急呼叫
              </h4>
              <button
                onClick={() => setShowEmergencyCallModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              即使设备处于健康锁屏状态，随时可以联系爸爸妈妈：
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => alert('已模拟拨打妈妈电话：138-XXXX-5678')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs transition"
              >
                <span>👩 拨打 妈妈手机</span>
                <span className="text-[11px] font-mono text-teal-600">快捷直拨</span>
              </button>
              <button
                onClick={() => alert('已模拟拨打爸爸电话：139-XXXX-1234')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-xs transition"
              >
                <span>👨 拨打 爸爸手机</span>
                <span className="text-[11px] font-mono text-sky-600">快捷直拨</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Child Extension Request Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold flex items-center gap-2 text-teal-800">
                <Send className="h-4 w-4 text-teal-600" />
                向爸爸妈妈申请延长 15 分钟
              </h4>
              <button
                onClick={() => setShowExtensionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {extensionSentSuccess ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <p className="text-sm font-bold text-slate-800">申请已发送给家长！</p>
                <p className="text-xs text-slate-500 mt-1">
                  家长端已收到通知，请耐心等待爸爸妈妈批准~
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    选择延长事由（让家长了解你的真实需要）
                  </label>
                  <div className="space-y-1.5">
                    {[
                      '学校绘本作业还剩2页没听完',
                      '正在查阅百科资料写科学小论文',
                      '口算练习已经90%了，想完成今日闯关',
                      '需要和老师/同学发打卡语音',
                    ].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setExtensionReason(reason)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs border transition ${
                          extensionReason === reason
                            ? 'bg-teal-50 border-teal-500 text-teal-800 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  id="btn-child-send-extension-confirm"
                  onClick={handleSendExtension}
                  className="w-full rounded-2xl bg-teal-600 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition"
                >
                  发送延长申请给家长
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP SYSTEM STATUS BAR */}
      <div className="h-8 px-4 flex items-center justify-between text-[11px] font-mono bg-slate-950/80 text-slate-400 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
            {device.platform === 'tablet' ? 'iPad Pro' : 'Redmi Note'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {device.eyeProtectionMode && (
            <span className="flex items-center gap-1 text-teal-400 text-[10px]">
              <Eye className="h-3 w-3" /> 护眼滤蓝光开
            </span>
          )}
          <span className="flex items-center gap-1 text-emerald-400">
            🔋 {device.batteryLevel}%
          </span>
        </div>
      </div>

      {/* MAIN SCREEN AREA: LOCK SCREEN vs 2-MINUTE WARNING vs NORMAL HOME */}
      <div className="relative flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 p-4 sm:p-6">
        {/* ========================================================================= */}
        {/* SCENARIO 1: FULL LOCK SCREEN (倒计时归零 或 家长远程强制锁屏) */}
        {/* ========================================================================= */}
        {isLocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-auto flex flex-col items-center text-center max-w-md mx-auto py-6"
          >
            {/* Protective Glowing Shield / Moon */}
            <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-teal-500/20 to-emerald-500/30 border border-teal-500/40 shadow-xl shadow-teal-900/40">
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Eye className="h-12 w-12 text-teal-300" />
              </motion.div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold mb-3">
              <ShieldAlert className="h-3.5 w-3.5" />
              {device.lockReason || '今日健康屏幕时间已达上限'}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {device.childName.split(' ')[0]}，该让眼睛好好休息啦！
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
              远眺窗外绿树，走出房间喝杯温水，或者跟着小星做一套 20 秒科学护眼操吧~
            </p>

            {/* Lock Screen Action Grid */}
            <div className="mt-8 w-full space-y-3">
              <button
                id="btn-lockscreen-passcode-unlock"
                onClick={() => setShowPasscodeModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 px-4 text-sm shadow-lg shadow-teal-500/30 transition active:scale-98 cursor-pointer"
              >
                <KeyRound className="h-4 w-4" />
                输入家长临时密码解锁
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="btn-lockscreen-eye-gym"
                  onClick={() => setShowEyeModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold py-3 px-3 text-xs border border-slate-700 transition"
                >
                  <Sparkles className="h-4 w-4 text-teal-400" />
                  做 20 秒护眼操
                </button>

                <button
                  id="btn-lockscreen-request-extension"
                  onClick={() => setShowExtensionModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold py-3 px-3 text-xs border border-slate-700 transition"
                >
                  <Send className="h-3.5 w-3.5 text-sky-400" />
                  申请延长 15 分钟
                </button>
              </div>

              <button
                id="btn-lockscreen-emergency-call"
                onClick={() => setShowEmergencyCallModal(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-2 transition"
              >
                <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                紧急亲情电话（拨打爸爸/妈妈）
              </button>
            </div>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* SCENARIO 2: NORMAL OR PRE-LOCK STATE (CHILD DESKTOP) */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col justify-between">
            {/* CRUCIAL USER REQUIREMENT: 2-MINUTE PRE-LOCK WARNING MODAL/BANNER */}
            <AnimatePresence>
              {isTwoMinuteWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="mb-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 border-2 border-amber-400/80 p-4 shadow-xl shadow-amber-950/40 backdrop-blur-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black animate-pulse">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/40">
                            2分钟智能锁屏预警
                          </span>
                          <span className="font-mono text-base font-black text-amber-200">
                            {formatTime(remainingSecs)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1">
                          距离今日健康锁屏还剩不到 2 分钟！
                        </h3>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          请及时保存正在做的作业或绘本进度，准备休息眼睛哦~
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2-Minute Alert Action Row */}
                  <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowExtensionModal(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold py-2 px-3 transition active:scale-95 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      向家长申请加时 15 分钟
                    </button>
                    <button
                      onClick={() => setShowPasscodeModal(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-semibold py-2 px-3 border border-amber-500/30 transition cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      输入临时密码
                    </button>
                    <button
                      onClick={onTriggerSelfLock}
                      className="rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-300 text-xs py-2 px-3 border border-slate-700 transition"
                      title="自觉休息"
                    >
                      准备休息
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Child Header Widget */}
            <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 backdrop-blur-xs mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-500/40 text-xl">
                  {device.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {device.childName}
                    </span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                      学习护航中
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    当前应用：{activeApp || device.currentApp}
                  </p>
                </div>
              </div>

              {/* Time pill */}
              <div className="text-right">
                <div className="text-[10px] text-slate-400">剩余可用时长</div>
                <div
                  className={`font-mono text-base font-black ${
                    remainingSecs <= 120 ? 'text-amber-400 animate-pulse' : 'text-teal-400'
                  }`}
                >
                  {formatTime(remainingSecs)}
                </div>
              </div>
            </div>

            {/* SAFE CHILD APPS GRID */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs font-bold text-slate-300">
                  家长允许的应用列表 (白名单)
                </span>
                <span className="text-[11px] text-teal-400 font-medium">
                  {installedApps.length} 款受保护应用
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {installedApps.map((app) => {
                  const isCurrent = (activeApp || device.currentApp) === app.name;
                  return (
                    <button
                      key={app.name}
                      onClick={() => setActiveApp(app.name)}
                      className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-950/40 border-teal-500 shadow-md shadow-teal-950'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${app.color} flex items-center justify-center text-xl shadow-md mb-2`}
                      >
                        {app.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {app.name}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {app.category}
                      </span>
                      {isCurrent && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-teal-400 ring-2 ring-teal-400/40" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HUMANIZED FEATURE: POSITIVE HABIT REWARDS (自律换时间) */}
            <div className="mt-4 rounded-2xl bg-slate-800/40 p-3.5 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-400" />
                  好习惯赚时间 · 积极打卡
                </span>
                <span className="text-[10px] text-slate-400">
                  完成好习惯，家长审核后赠送时长
                </span>
              </div>

              <div className="space-y-1.5">
                {habitTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>{task.icon}</span>
                      <span
                        className={`${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-amber-400">
                        +{task.rewardMinutes}分钟
                      </span>
                      {task.completed ? (
                        <span className="text-[10px] text-teal-400 flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" /> 已打卡
                        </span>
                      ) : (
                        <button
                          onClick={() => onCompleteHabit(task.id)}
                          className="rounded-lg bg-teal-600/80 hover:bg-teal-500 text-white text-[11px] px-2 py-0.5 transition"
                        >
                          打卡
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM QUICK DOCK */}
            <div className="mt-4 flex items-center justify-around pt-3 border-t border-slate-800 text-xs text-slate-400">
              <button
                onClick={() => setShowEyeModal(true)}
                className="flex flex-col items-center gap-1 hover:text-teal-300 transition"
              >
                <Eye className="h-5 w-5 text-teal-400" />
                <span className="text-[10px]">护眼操</span>
              </button>

              <button
                onClick={() => setShowPasscodeModal(true)}
                className="flex flex-col items-center gap-1 hover:text-teal-300 transition"
              >
                <KeyRound className="h-5 w-5 text-sky-400" />
                <span className="text-[10px]">临时密码</span>
              </button>

              <button
                onClick={() => setShowExtensionModal(true)}
                className="flex flex-col items-center gap-1 hover:text-teal-300 transition"
              >
                <Send className="h-5 w-5 text-amber-400" />
                <span className="text-[10px]">申请延长</span>
              </button>

              <button
                onClick={() => setShowEmergencyCallModal(true)}
                className="flex flex-col items-center gap-1 hover:text-rose-300 transition"
              >
                <PhoneCall className="h-5 w-5 text-emerald-400" />
                <span className="text-[10px]">亲情电话</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
