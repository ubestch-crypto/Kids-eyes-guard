import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Tablet,
  KeyRound,
  Clock,
  Eye,
  Award,
  Zap,
  SplitSquareVertical,
  HelpCircle,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { FamilyState, ChildDevice, TemporaryPasscode } from './types';
import {
  loadFamilyState,
  saveFamilyState,
  subscribeToFamilySync,
} from './utils/storage';
import { ParentDashboard } from './components/ParentView/ParentDashboard';
import { ChildScreen } from './components/ChildView/ChildScreen';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { playTwoMinuteWarningChime } from './utils/audio';

export default function App() {
  const [state, setState] = useState<FamilyState>(() => loadFamilyState());
  const [viewMode, setViewMode] = useState<'dual' | 'parent' | 'child'>('dual');
  const [showPhilosophyModal, setShowPhilosophyModal] = useState(false);

  // Synchronize state across browser tabs/windows
  useEffect(() => {
    const unsubscribe = subscribeToFamilySync(() => {
      setState(loadFamilyState());
    });
    return () => unsubscribe();
  }, []);

  // Save state helper
  const updateStateAndPersist = (updater: (prev: FamilyState) => FamilyState) => {
    setState((prev) => {
      const next = updater(prev);
      saveFamilyState(next, true);
      return next;
    });
  };

  // Device Countdown Tick (1 second interval)
  useEffect(() => {
    const timer = setInterval(() => {
      updateStateAndPersist((prev) => {
        if (prev.device.isLocked || prev.device.remainingSeconds <= 0) {
          return prev;
        }

        const newSecs = prev.device.remainingSeconds - 1;
        const isNowLocked = newSecs <= 0;

        return {
          ...prev,
          device: {
            ...prev.device,
            remainingSeconds: newSecs,
            usedMinutesToday:
              newSecs % 60 === 0 && newSecs > 0
                ? prev.device.usedMinutesToday + 1
                : prev.device.usedMinutesToday,
            isLocked: isNowLocked,
            lockReason: isNowLocked ? '今日健康屏幕时间已用完' : prev.device.lockReason,
          },
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handler: Lock device remotely
  const handleLockDevice = (reason: string) => {
    updateStateAndPersist((prev) => ({
      ...prev,
      device: {
        ...prev.device,
        isLocked: true,
        lockReason: reason,
      },
      logs: [
        {
          id: `l_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'lock',
          title: '家长远程锁屏',
          description: `锁定原因: ${reason}`,
        },
        ...prev.logs,
      ],
    }));
  };

  // Handler: Unlock device remotely / Add minutes
  const handleUnlockDevice = (minutesToAdd: number) => {
    updateStateAndPersist((prev) => ({
      ...prev,
      device: {
        ...prev.device,
        isLocked: false,
        lockReason: '',
        remainingSeconds: prev.device.remainingSeconds + minutesToAdd * 60,
      },
      logs: [
        {
          id: `l_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'unlock',
          title: '远程解锁 / 延长时长',
          description: `增加 ${minutesToAdd} 分钟使用时长`,
        },
        ...prev.logs,
      ],
    }));
  };

  // Handler: Add generated passcode
  const handleAddPasscode = (passcode: TemporaryPasscode) => {
    updateStateAndPersist((prev) => ({
      ...prev,
      passcodes: [passcode, ...prev.passcodes],
      logs: [
        {
          id: `l_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'passcode',
          title: '生成临时密码',
          description: `密码: ${passcode.code}，时长: +${passcode.durationMinutes}分钟，事由: ${passcode.reason}`,
        },
        ...prev.logs,
      ],
    }));
  };

  // Handler: Revoke passcode
  const handleRevokePasscode = (id: string) => {
    updateStateAndPersist((prev) => ({
      ...prev,
      passcodes: prev.passcodes.map((p) =>
        p.id === id ? { ...p, status: 'revoked' as const } : p
      ),
    }));
  };

  // Handler: Child verifies passcode
  const handleVerifyPasscode = (inputCode: string) => {
    const target = state.passcodes.find(
      (p) => p.code === inputCode && p.status === 'active' && p.expiresAt > Date.now()
    );

    if (target) {
      updateStateAndPersist((prev) => ({
        ...prev,
        device: {
          ...prev.device,
          isLocked: false,
          lockReason: '',
          remainingSeconds: prev.device.remainingSeconds + target.durationMinutes * 60,
        },
        passcodes: prev.passcodes.map((p) =>
          p.id === target.id
            ? { ...p, status: 'used' as const, usedAt: Date.now() }
            : p
        ),
        logs: [
          {
            id: `l_${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'unlock',
            title: '临时密码验证成功',
            description: `孩子输入有效密码 [${target.code}]，延时 +${target.durationMinutes} 分钟生效。`,
          },
          ...prev.logs,
        ],
      }));
      return {
        success: true,
        message: `密码验证成功！已为你延长 ${target.durationMinutes} 分钟`,
        duration: target.durationMinutes,
      };
    }

    return {
      success: false,
      message: '密码无效、已被使用或已过期，请核对后重试',
    };
  };

  // Handler: Child requests extension
  const handleRequestExtension = (minutes: number, reason: string) => {
    updateStateAndPersist((prev) => ({
      ...prev,
      extensionRequests: [
        {
          id: `req_${Date.now()}`,
          childName: prev.device.childName.split(' ')[0],
          requestedMinutes: minutes,
          reason,
          createdAt: Date.now(),
          status: 'pending',
        },
        ...prev.extensionRequests,
      ],
      logs: [
        {
          id: `l_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'extension',
          title: '收到延时申请',
          description: `孩子申请延长 ${minutes} 分钟，事由: ${reason}`,
        },
        ...prev.logs,
      ],
    }));
  };

  // Handler: Parent resolves extension request
  const handleResolveExtension = (id: string, approved: boolean, minutes = 15) => {
    updateStateAndPersist((prev) => ({
      ...prev,
      extensionRequests: prev.extensionRequests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: (approved ? 'approved' : 'rejected') as 'approved' | 'rejected',
              resolvedAt: Date.now(),
            }
          : r
      ),
      device: approved
        ? {
            ...prev.device,
            isLocked: false,
            remainingSeconds: prev.device.remainingSeconds + minutes * 60,
          }
        : prev.device,
      logs: [
        {
          id: `l_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'extension',
          title: approved ? '已批准延时申请' : '已委婉拒绝延时申请',
          description: approved ? `已为孩子延长 ${minutes} 分钟` : '保持原有作息规律',
        },
        ...prev.logs,
      ],
    }));
  };

  // Handler: Child completes habit task
  const handleCompleteHabit = (taskId: string) => {
    updateStateAndPersist((prev) => ({
      ...prev,
      habitTasks: prev.habitTasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t
      ),
    }));
  };

  // Handler: Parent verifies habit task and rewards time
  const handleVerifyHabit = (taskId: string) => {
    const task = state.habitTasks.find((t) => t.id === taskId);
    if (!task) return;

    updateStateAndPersist((prev) => ({
      ...prev,
      habitTasks: prev.habitTasks.map((t) =>
        t.id === taskId ? { ...t, verifiedByParent: true } : t
      ),
      device: {
        ...prev.device,
        isLocked: false,
        remainingSeconds: prev.device.remainingSeconds + task.rewardMinutes * 60,
      },
      logs: [
        {
          id: `l_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'unlock',
          title: '好习惯奖励发放',
          description: `孩子完成「${task.title}」，奖励 +${task.rewardMinutes} 分钟屏幕时间！`,
        },
        ...prev.logs,
      ],
    }));
  };

  // Handler: Trigger 2-minute pre-lock demo (sets remaining time to 125 seconds)
  const handleTriggerTwoMinuteDemo = () => {
    updateStateAndPersist((prev) => ({
      ...prev,
      device: {
        ...prev.device,
        isLocked: false,
        remainingSeconds: 125, // 2 mins 05 secs, will cross 120s in 5s!
      },
      logs: [
        {
          id: `l_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'warning',
          title: '快速体验2分钟锁屏预警',
          description: '剩余时间已调至 125 秒，即将自动弹出 2 分钟倒计时锁屏预警。',
        },
        ...prev.logs,
      ],
    }));
    playTwoMinuteWarningChime();
  };

  // Handler: Update device settings
  const handleUpdateDeviceSettings = (updates: Partial<ChildDevice>) => {
    updateStateAndPersist((prev) => ({
      ...prev,
      device: {
        ...prev.device,
        ...updates,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Offline Status */}
      <OfflineIndicator />

      {/* Humanized Design Philosophy Modal */}
      {showPhilosophyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 font-bold">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    童护守望 · 人性化设计与使用场景思考
                  </h3>
                  <p className="text-xs text-slate-500">
                    从“冰冷强制封禁”转向“亲子自律契约与视力守护”
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPhilosophyModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                <h4 className="font-bold text-amber-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  1. 临近 2 分钟温和预警，尊重孩子的沉浸体验
                </h4>
                <p className="mt-1 text-slate-600 text-xs">
                  突然强制切断屏幕极易引发孩子的愤怒与亲子抗拒。应用提前 2 分钟在桌面弹出温和倒计时与语音提示，给孩子从容保存作业进度、结束游戏关卡或发送告别消息的心理过渡期。
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/80">
                <h4 className="font-bold text-teal-900 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-teal-600" />
                  2. 动态临时通行码，打破空间限制的弹性远程信任
                </h4>
                <p className="mt-1 text-slate-600 text-xs">
                  当家长在上班或外出，孩子需要查阅资料或补交作业时，家长可在手机上一键生成带有有效期的 6 位随机临时密码并告知孩子，无需透露主管理密码，用后自动失效，既安全又灵活。
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" />
                  3. 好习惯激励经济，以正向驱动代替单纯惩罚
                </h4>
                <p className="mt-1 text-slate-600 text-xs">
                  将屏幕时间转化为自律契约：跳绳 300 次、户外运动 30 分钟、整理书桌均可向家长申请打卡并兑换屏幕时长，培养孩子自主规划时间的主人翁意识。
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80">
                <h4 className="font-bold text-sky-900 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-sky-600" />
                  4. 20-20-20 科学护眼操与亲情紧急通话
                </h4>
                <p className="mt-1 text-slate-600 text-xs">
                  锁屏不是黑屏！锁屏后提供舒缓视力操引导（远眺 20 秒），同时始终保持直拨爸爸妈妈的亲情紧急热线，保障孩子独处时的安全连接。
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPhilosophyModal(false)}
              className="mt-6 w-full rounded-2xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 transition"
            >
              了解完毕，开始体验
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-sm shadow-teal-700/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  童护守望
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full border border-teal-200">
                  设备管控与视力守护管家
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                支持家长远程管控、动态临时码解锁、2分钟前置倒计时提醒
              </p>
            </div>
          </div>

          {/* Device & Mode Selector Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <button
                id="btn-switch-dual-view"
                onClick={() => setViewMode('dual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'dual'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="同屏查看家长端与孩子端实时联动效果"
              >
                <SplitSquareVertical className="h-3.5 w-3.5" />
                <span className="hidden md:inline">双机联动演示</span>
              </button>

              <button
                id="btn-switch-parent-view"
                onClick={() => setViewMode('parent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'parent'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5 text-teal-600" />
                <span>家长管控端</span>
              </button>

              <button
                id="btn-switch-child-view"
                onClick={() => setViewMode('child')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'child'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tablet className="h-3.5 w-3.5 text-sky-600" />
                <span>孩子设备端</span>
              </button>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Thoughtful explanation button */}
            <button
              onClick={() => setShowPhilosophyModal(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              title="设计思路与人性化功能解析"
            >
              <HelpCircle className="h-4 w-4 text-teal-600" />
            </button>
          </div>
        </div>
      </header>

      {/* QUICK SIMULATION ACTION STRIP */}
      <div className="bg-teal-900 text-teal-100 text-xs px-4 py-2 border-b border-teal-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-white">跨端实时守护在线</span>
            <span className="text-teal-300 hidden sm:inline">
              | 支持手机/平板浏览器打开，或安装到桌面直接作为全屏独立管家应用使用
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerTwoMinuteDemo}
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-sm transition active:scale-95 cursor-pointer"
              title="将倒计时设为 125 秒，5秒后自动弹出 2 分钟倒计时桌面锁屏预警"
            >
              <Zap className="h-3.5 w-3.5 fill-slate-950" />
              <span>⚡ 立即体验 2 分钟倒计时锁屏预警</span>
            </button>

            {state.device.isLocked ? (
              <button
                onClick={() => handleUnlockDevice(15)}
                className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-1 rounded-lg font-bold text-[11px] transition"
              >
                <Unlock className="h-3 w-3" /> 解除锁屏
              </button>
            ) : (
              <button
                onClick={() => handleLockDevice('测试即刻锁屏')}
                className="inline-flex items-center gap-1 bg-rose-500/80 hover:bg-rose-500 text-white px-2 py-1 rounded-lg font-medium text-[11px] transition"
              >
                <Lock className="h-3 w-3" /> 立即锁屏
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* VIEW 1: DUAL DEVICE VIEW (SIDE-BY-SIDE INTERACTIVE DEMO) */}
        {viewMode === 'dual' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Parent Phone Control Console (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                  <h2 className="text-sm font-bold text-slate-800">
                    家长端控制台 · 远程管控与策略下发
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  实时联动生效中 (已同步)
                </span>
              </div>

              <ParentDashboard
                device={state.device}
                passcodes={state.passcodes}
                extensionRequests={state.extensionRequests}
                habitTasks={state.habitTasks}
                logs={state.logs}
                onUpdateDeviceSettings={handleUpdateDeviceSettings}
                onLockDevice={handleLockDevice}
                onUnlockDevice={handleUnlockDevice}
                onAddPasscode={handleAddPasscode}
                onRevokePasscode={handleRevokePasscode}
                onResolveExtension={handleResolveExtension}
                onVerifyHabit={handleVerifyHabit}
                onTriggerTwoMinuteDemo={handleTriggerTwoMinuteDemo}
              />
            </div>

            {/* Right: Child Tablet / Phone Live View (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  <h2 className="text-sm font-bold text-slate-800">
                    孩子设备端实况 · {state.device.name}
                  </h2>
                </div>
                <span className="text-xs text-teal-700 font-semibold">
                  {state.device.isLocked ? '🔒 锁屏中' : '🟢 正常使用中'}
                </span>
              </div>

              {/* Tablet Frame */}
              <div className="relative mx-auto w-full max-w-md rounded-[36px] bg-slate-950 p-3 shadow-2xl ring-8 ring-slate-800">
                {/* Simulated Camera notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 h-3.5 w-20 rounded-full bg-slate-900 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-slate-800" />
                </div>

                <div className="mt-2 h-[680px] overflow-hidden rounded-[26px]">
                  <ChildScreen
                    device={state.device}
                    habitTasks={state.habitTasks}
                    onVerifyPasscode={handleVerifyPasscode}
                    onRequestExtension={handleRequestExtension}
                    onCompleteHabit={handleCompleteHabit}
                    onTriggerSelfLock={() => handleLockDevice('孩子自觉选择休息眼睛')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PARENT ONLY VIEW */}
        {viewMode === 'parent' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="rounded-2xl bg-teal-50 border border-teal-200 p-4 text-xs text-teal-800 flex items-center justify-between">
              <span>
                📱 当前处于<strong>家长端专属模式</strong>。您可以在此设置时间限额、生成临时密码、审批孩子的延时请求与好习惯打卡。
              </span>
              <button
                onClick={() => setViewMode('child')}
                className="ml-3 underline font-semibold shrink-0"
              >
                切换至孩子端
              </button>
            </div>

            <ParentDashboard
              device={state.device}
              passcodes={state.passcodes}
              extensionRequests={state.extensionRequests}
              habitTasks={state.habitTasks}
              logs={state.logs}
              onUpdateDeviceSettings={handleUpdateDeviceSettings}
              onLockDevice={handleLockDevice}
              onUnlockDevice={handleUnlockDevice}
              onAddPasscode={handleAddPasscode}
              onRevokePasscode={handleRevokePasscode}
              onResolveExtension={handleResolveExtension}
              onVerifyHabit={handleVerifyHabit}
              onTriggerTwoMinuteDemo={handleTriggerTwoMinuteDemo}
            />
          </div>
        )}

        {/* VIEW 3: CHILD ONLY VIEW */}
        {viewMode === 'child' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 rounded-2xl bg-sky-50 border border-sky-200 p-3.5 text-xs text-sky-900 flex items-center justify-between">
              <span>
                👶 当前处于<strong>孩子平板/手机端实景模式</strong>。您可以测试 2 分钟倒计时预警、输入临时密码解锁、进行护眼操。
              </span>
              <button
                onClick={() => setViewMode('parent')}
                className="ml-3 underline font-semibold shrink-0"
              >
                返回家长端
              </button>
            </div>

            <div className="h-[740px] rounded-[32px] overflow-hidden shadow-2xl border-4 border-slate-800">
              <ChildScreen
                device={state.device}
                habitTasks={state.habitTasks}
                onVerifyPasscode={handleVerifyPasscode}
                onRequestExtension={handleRequestExtension}
                onCompleteHabit={handleCompleteHabit}
                onTriggerSelfLock={() => handleLockDevice('孩子自觉选择休息眼睛')}
              />
            </div>
          </div>
        )}
      </main>

      {/* FOOTER SUMMARY */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            童护守望 © 2026 · 守护儿童身心健康与视力发展 · 支持 PWA 离线运行与多设备实时联动
          </p>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>2分钟锁屏预警</span>
            <span>·</span>
            <span>动态临时密码</span>
            <span>·</span>
            <span>20-20-20 护眼操</span>
            <span>·</span>
            <span>自律激励打卡</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
