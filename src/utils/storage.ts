import { FamilyState, TemporaryPasscode, ExtensionRequest, HabitTask, UsageLog } from '../types';

const STORAGE_KEY = 'timeguard_family_state_v1';
const CHANNEL_NAME = 'timeguard_sync_channel';

export const DEFAULT_INITIAL_STATE: FamilyState = {
  parentPin: '8888',
  device: {
    id: 'dev_ipad_lele',
    name: '乐乐的 iPad Pro 11寸',
    childName: '乐乐 (8岁)',
    avatar: '👦',
    platform: 'tablet',
    batteryLevel: 86,
    isOnline: true,
    currentApp: '悟空识字 & 妙笔书法',
    isLocked: false,
    lockReason: '',
    dailyLimitMinutes: 60,
    usedMinutesToday: 35,
    sessionLimitMinutes: 25,
    currentSessionMinutes: 20,
    remainingSeconds: 300, // 5 minutes remaining by default (or user can test 125s for 2-min warning)
    curfewStart: '21:00',
    curfewEnd: '07:30',
    eyeProtectionMode: true,
    distanceAlertEnabled: true,
  },
  passcodes: [
    {
      id: 'pwd_1',
      code: '582914',
      durationMinutes: 30,
      reason: '完成今日口算打卡奖励',
      createdAt: Date.now() - 3600000,
      expiresAt: Date.now() + 86400000,
      status: 'active',
    },
    {
      id: 'pwd_2',
      code: '816302',
      durationMinutes: 15,
      reason: '周末查阅百科书籍资料',
      createdAt: Date.now() - 7200000,
      expiresAt: Date.now() - 1000000,
      usedAt: Date.now() - 2000000,
      status: 'used',
    },
  ],
  extensionRequests: [
    {
      id: 'req_1',
      childName: '乐乐',
      requestedMinutes: 15,
      reason: '英语绘本还有最后2页就读完了，想听完配音~',
      createdAt: Date.now() - 300000,
      status: 'pending',
    },
  ],
  habitTasks: [
    {
      id: 't_1',
      title: '跳绳 300 次或户外运动 30 分钟',
      rewardMinutes: 20,
      icon: '🏃‍♂️',
      completed: true,
      verifiedByParent: false,
    },
    {
      id: 't_2',
      title: '背诵一首古诗或朗读课文',
      rewardMinutes: 15,
      icon: '📖',
      completed: false,
      verifiedByParent: false,
    },
    {
      id: 't_3',
      title: '饭后整理书桌与玩具收纳',
      rewardMinutes: 10,
      icon: '🧸',
      completed: true,
      verifiedByParent: true,
    },
    {
      id: 't_4',
      title: '协助倒垃圾或给阳台花草浇水',
      rewardMinutes: 10,
      icon: '🪴',
      completed: false,
      verifiedByParent: false,
    },
  ],
  logs: [
    {
      id: 'l_1',
      time: '19:15',
      type: 'warning',
      title: '2分钟智能锁屏预警触发',
      description: '设备提前向乐乐推送桌面倒计时提醒，引导保存进度。',
    },
    {
      id: 'l_2',
      time: '18:40',
      type: 'passcode',
      title: '家长生成临时密码',
      description: '生成 30 分钟奖励密码 [582914]，备注：完成今日口算打卡。',
    },
    {
      id: 'l_3',
      time: '17:30',
      type: 'unlock',
      title: '开始课后学习使用',
      description: '开启「悟空识字」应用，护眼模式与坐姿距离监测已启用。',
    },
  ],
};

let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

export function loadFamilyState(): FamilyState {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveFamilyState(DEFAULT_INITIAL_STATE, false);
      return DEFAULT_INITIAL_STATE;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error('Failed to load family state:', e);
    return DEFAULT_INITIAL_STATE;
  }
}

export function saveFamilyState(state: FamilyState, broadcast = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
    }
  } catch (e) {
    console.error('Failed to save family state:', e);
  }
}

export function subscribeToFamilySync(callback: () => void): () => void {
  if (!syncChannel) {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const handleMessage = () => {
    callback();
  };

  syncChannel.addEventListener('message', handleMessage);
  return () => {
    syncChannel?.removeEventListener('message', handleMessage);
  };
}

export function generateRandomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
