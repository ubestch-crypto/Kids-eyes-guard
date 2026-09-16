import React, { useState } from 'react';
import {
  Shield,
  Clock,
  KeyRound,
  Lock,
  Unlock,
  AlertCircle,
  Bell,
  Smartphone,
  Eye,
  Award,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Zap,
} from 'lucide-react';
import { ChildDevice, TemporaryPasscode, ExtensionRequest, HabitTask, UsageLog } from '../../types';
import { PasscodeModal } from '../Shared/PasscodeModal';
import { playUnlockChime } from '../../utils/audio';

interface ParentDashboardProps {
  device: ChildDevice;
  passcodes: TemporaryPasscode[];
  extensionRequests: ExtensionRequest[];
  habitTasks: HabitTask[];
  logs: UsageLog[];
  onUpdateDeviceSettings: (updates: Partial<ChildDevice>) => void;
  onLockDevice: (reason: string) => void;
  onUnlockDevice: (minutesToAdd: number) => void;
  onAddPasscode: (passcode: TemporaryPasscode) => void;
  onRevokePasscode: (id: string) => void;
  onResolveExtension: (id: string, approved: boolean, minutes?: number) => void;
  onVerifyHabit: (taskId: string) => void;
  onTriggerTwoMinuteDemo: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  device,
  passcodes,
  extensionRequests,
  habitTasks,
  logs,
  onUpdateDeviceSettings,
  onLockDevice,
  onUnlockDevice,
  onAddPasscode,
  onRevokePasscode,
  onResolveExtension,
  onVerifyHabit,
  onTriggerTwoMinuteDemo,
}) => {
  // Navigation tabs inside Parent Dashboard
  const [activeTab, setActiveTab] = useState<'control' | 'passcodes' | 'rules' | 'habits' | 'logs'>('control');

  // Passcode generator modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Lock reason modal
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [lockReason, setLockReason] = useState('该吃晚饭了，请放下平板');

  // Custom time adjustment modal
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempDailyLimit, setTempDailyLimit] = useState(device.dailyLimitMinutes);

  const pendingRequests = extensionRequests.filter((r) => r.status === 'pending');
  const activePasscodes = passcodes.filter((p) => p.status === 'active' && p.expiresAt > Date.now());

  const remainingMinutes = Math.max(0, Math.floor(device.remainingSeconds / 60));
  const remainingSecondsRem = Math.max(0, device.remainingSeconds % 60);

  const handleQuickAdd15 = () => {
    onUnlockDevice(15);
    playUnlockChime();
  };

  return (
    <div className="space-y-6">
      {/* Passcode Generator Modal */}
      <PasscodeModal
        mode="generate"
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onPasscodeGenerated={(code) => {
          onAddPasscode(code);
        }}
      />

      {/* Lock Prompt Modal */}
      {showLockPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Lock className="h-5 w-5 text-rose-600" />
              远程立即锁屏
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              孩子设备将立即进入健康锁屏界面，并播报提醒。
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                锁屏提醒语 / 原因
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['该吃晚饭了，请放下平板', '到睡觉作息时间了', '先去完成纸质作业', '连续用眼过长，休息一下'].map(
                  (txt) => (
                    <button
                      key={txt}
                      onClick={() => setLockReason(txt)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition ${
                        lockReason === txt
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-medium'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {txt}
                    </button>
                  )
                )}
              </div>
              <input
                type="text"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-teal-500"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowLockPrompt(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onLockDevice(lockReason);
                  setShowLockPrompt(false);
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
              >
                确认立即锁定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Limit Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-teal-600" />
              调整今日屏幕可用时长
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              设置孩子今日总共允许使用的设备时间上限
            </p>

            <div className="mt-5 text-center">
              <div className="text-3xl font-black text-teal-700 font-mono">
                {tempDailyLimit} <span className="text-sm font-normal">分钟</span>
              </div>
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={tempDailyLimit}
                onChange={(e) => setTempDailyLimit(Number(e.target.value))}
                className="w-full mt-4 accent-teal-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>15分钟</span>
                <span>60分钟</span>
                <span>120分钟</span>
                <span>180分钟</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowTimeModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-600"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const addedSecs = (tempDailyLimit - device.dailyLimitMinutes) * 60;
                  onUpdateDeviceSettings({
                    dailyLimitMinutes: tempDailyLimit,
                    remainingSeconds: Math.max(0, device.remainingSeconds + addedSecs),
                    isLocked: false,
                  });
                  setShowTimeModal(false);
                }}
                className="flex-1 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-700"
              >
                保存并生效
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PENDING NOTIFICATION BANNER (IF CHILD REQUESTS EXTENSION) */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-400 p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold animate-bounce">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {pendingRequests[0].childName} 正在申请延长使用时间 (+{pendingRequests[0].requestedMinutes}分钟)
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  申请理由：<strong>“{pendingRequests[0].reason}”</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-amber-200">
            <button
              onClick={() => onResolveExtension(pendingRequests[0].id, true, 15)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-3 shadow-sm transition"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              同意延长 15 分钟
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-semibold py-2 px-3 hover:bg-amber-50 transition"
            >
              <KeyRound className="h-3.5 w-3.5" />
              生成临时码
            </button>
            <button
              onClick={() => onResolveExtension(pendingRequests[0].id, false)}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold py-2 px-3 hover:bg-slate-200 transition"
            >
              <XCircle className="h-3.5 w-3.5" />
              温和拒绝
            </button>
          </div>
        </div>
      )}

      {/* TOP LIVE DEVICE STATUS CARD */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 text-2xl shadow-inner">
              {device.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  {device.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    device.isLocked
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      device.isLocked ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  {device.isLocked ? '已锁定保护' : '正常守护中'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                守护对象：<span className="font-semibold text-slate-700">{device.childName}</span> · 当前正在运行: <span className="text-teal-700 font-medium">{device.currentApp}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                电量状态
              </div>
              <div className="text-sm font-bold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                <span>🔋</span> {device.batteryLevel}%
              </div>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                今日剩余时长
              </div>
              <div
                className={`text-base font-black font-mono mt-0.5 ${
                  device.remainingSeconds <= 120 ? 'text-amber-600' : 'text-teal-700'
                }`}
              >
                {remainingMinutes}m {remainingSecondsRem}s
              </div>
            </div>
          </div>
        </div>

        {/* Screen Time Progress Visualizer */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600">
              今日累计使用：<strong className="text-slate-800">{device.usedMinutesToday} 分钟</strong>
            </span>
            <span className="text-slate-500">
              允许额度：<strong className="text-teal-700">{device.dailyLimitMinutes} 分钟</strong>
              <button
                onClick={() => setShowTimeModal(true)}
                className="ml-2 text-teal-600 hover:underline font-semibold"
              >
                调整
              </button>
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                device.isLocked
                  ? 'bg-rose-500'
                  : device.remainingSeconds <= 120
                  ? 'bg-amber-500'
                  : 'bg-teal-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (device.usedMinutesToday / Math.max(1, device.dailyLimitMinutes)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* REMOTE CONTROL ACTION BUTTONS */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Action 1: Instant Lock */}
          {device.isLocked ? (
            <button
              id="btn-parent-unlock"
              onClick={() => onUnlockDevice(15)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-3 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Unlock className="h-4 w-4" />
              <span>一键解除锁屏 (+15m)</span>
            </button>
          ) : (
            <button
              id="btn-parent-instant-lock"
              onClick={() => setShowLockPrompt(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-3 px-3 transition active:scale-95 cursor-pointer"
            >
              <Lock className="h-4 w-4 text-rose-600" />
              <span>立即强制锁屏</span>
            </button>
          )}

          {/* Action 2: Quick Add 15 mins */}
          <button
            id="btn-parent-quick-add-15"
            onClick={handleQuickAdd15}
            className="flex items-center justify-center gap-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold py-3 px-3 transition active:scale-95 cursor-pointer"
          >
            <Clock className="h-4 w-4 text-teal-600" />
            <span>远程加时 15 分钟</span>
          </button>

          {/* Action 3: Generate Dynamic Passcode */}
          <button
            id="btn-parent-generate-passcode"
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-3 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span>生成临时密码</span>
          </button>

          {/* Action 4: Trigger 2-Minute Pre-lock Demo */}
          <button
            id="btn-parent-demo-2min"
            onClick={onTriggerTwoMinuteDemo}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold py-3 px-3 transition active:scale-95 cursor-pointer"
            title="将倒计时快速调整至 125 秒，立即查看孩子端桌面 2 分钟倒计时锁屏预警弹窗效果！"
          >
            <Zap className="h-4 w-4 text-amber-600 fill-amber-500" />
            <span>⚡ 模拟2分钟预警</span>
          </button>
        </div>
      </div>

      {/* PARENT DASHBOARD SUB-TABS */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('control')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'control'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          临时密码管理 ({activePasscodes.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'rules'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          时段与防沉迷规则
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'habits'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          好习惯激励体系 ({habitTasks.filter((t) => t.completed && !t.verifiedByParent).length}待审)
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          健康守护日志
        </button>
      </div>

      {/* TAB 1: PASSCODES LIST */}
      {activeTab === 'control' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                动态临时通行密码列表
              </h4>
              <p className="text-xs text-slate-500">
                生成的一次性 6 位密码，孩子在平板端输入即可临时获得延时，用完即失效。
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              生成新密码
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {passcodes.map((item) => {
              const isExpired = item.expiresAt < Date.now() || item.status === 'expired';
              const isUsed = item.status === 'used';
              const isActive = item.status === 'active' && !isExpired;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 border transition ${
                    isActive
                      ? 'bg-teal-50/40 border-teal-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-black text-slate-800 tracking-wider">
                          {item.code}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isUsed
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isActive ? '可使用' : isUsed ? '已被孩子使用' : '已作废/过期'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 mt-1">
                        延长时间：<strong className="text-teal-700">+{item.durationMinutes} 分钟</strong>
                      </p>
                    </div>

                    {isActive && (
                      <button
                        onClick={() => onRevokePasscode(item.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 p-1 font-semibold"
                        title="立即作废此密码"
                      >
                        作废
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>备注: {item.reason}</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RULES CONFIGURATION */}
      {activeTab === 'rules' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              智能时间管控与护眼防沉迷策略
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              规则自动同步至所有绑定的手机与平板设备
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-700">
            {/* Daily Quota */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600" />
                工作日每日限额
              </div>
              <p className="text-slate-500">
                达到该额度后自动全屏锁屏，提前 2 分钟在桌面弹出倒计时提醒。
              </p>
              <div className="flex items-center gap-2 pt-1">
                {[30, 45, 60, 90].map((m) => (
                  <button
                    key={m}
                    onClick={() => onUpdateDeviceSettings({ dailyLimitMinutes: m })}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                      device.dailyLimitMinutes === m
                        ? 'bg-teal-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {m}分钟
                  </button>
                ))}
              </div>
            </div>

            {/* Rest intervals */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-600" />
                单次连续用眼防疲劳
              </div>
              <p className="text-slate-500">
                连续使用达到上限时强制弹出 20-20-20 视力操引导。
              </p>
              <div className="flex items-center gap-2 pt-1">
                {[20, 25, 30].map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateDeviceSettings({ sessionLimitMinutes: s })}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                      device.sessionLimitMinutes === s
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    每{s}分钟休息
                  </button>
                ))}
              </div>
            </div>

            {/* Curfew times */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600" />
                夜晚睡眠宵禁封锁
              </div>
              <p className="text-slate-500">
                晚间设定时段内设备自动进入睡眠免打扰模式，禁止开启娱乐类应用。
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  {device.curfewStart} 至 次日 {device.curfewEnd}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  ✓ 已启用
                </span>
              </div>
            </div>

            {/* Health switches */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                视力与坐姿保护传感器
              </div>
              <div className="space-y-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={device.eyeProtectionMode}
                    onChange={(e) =>
                      onUpdateDeviceSettings({ eyeProtectionMode: e.target.checked })
                    }
                    className="accent-teal-600 h-4 w-4 rounded"
                  />
                  <span>全程智能滤蓝光护眼底色</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={device.distanceAlertEnabled}
                    onChange={(e) =>
                      onUpdateDeviceSettings({ distanceAlertEnabled: e.target.checked })
                    }
                    className="accent-teal-600 h-4 w-4 rounded"
                  />
                  <span>眼睛距离屏幕近于 30cm 时震动预警</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POSITIVE HABIT ECONOMY (拓展思维：以自律换时间的正向激励) */}
      {activeTab === 'habits' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-300 p-4">
            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              正向自律机制 · 让孩子通过好习惯“赚取”屏幕额度
            </h4>
            <p className="text-xs text-amber-800 mt-1">
              摒弃冰冷的单一封禁！鼓励孩子完成户外运动、课外阅读或分担家务。孩子在设备端打卡后，家长在此一键确认并赠送奖励密码。
            </p>
          </div>

          <div className="space-y-2.5">
            {habitTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{task.icon}</span>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                      {task.title}
                    </h5>
                    <p className="text-xs text-amber-600 font-semibold mt-0.5">
                      奖励：+{task.rewardMinutes} 分钟屏幕时长
                    </p>
                  </div>
                </div>

                <div>
                  {task.verifiedByParent ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> 家长已发放
                    </span>
                  ) : task.completed ? (
                    <button
                      onClick={() => onVerifyHabit(task.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 shadow-sm transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      确认并奖励 +{task.rewardMinutes}m
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">孩子尚未打卡</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USAGE AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 space-y-3">
          <h4 className="text-sm font-bold text-slate-800">实时守护事件与安全审计</h4>
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-start gap-3 text-xs">
                <span className="font-mono text-slate-400 shrink-0 font-semibold">
                  {log.time}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{log.title}</div>
                  <div className="text-slate-500 mt-0.5">{log.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
