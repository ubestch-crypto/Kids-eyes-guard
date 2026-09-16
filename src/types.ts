export type DevicePlatform = 'tablet' | 'phone';

export interface ChildDevice {
  id: string;
  name: string;
  childName: string;
  avatar: string;
  platform: DevicePlatform;
  batteryLevel: number;
  isOnline: boolean;
  currentApp: string;
  isLocked: boolean;
  lockReason?: string;
  dailyLimitMinutes: number; // e.g. 90 mins
  usedMinutesToday: number; // e.g. 45 mins
  sessionLimitMinutes: number; // rest required after e.g. 30 mins
  currentSessionMinutes: number;
  remainingSeconds: number; // live countdown in active session
  curfewStart: string; // e.g. "21:30"
  curfewEnd: string; // e.g. "07:00"
  eyeProtectionMode: boolean; // night/warm light
  distanceAlertEnabled: boolean; // screen distance warning
}

export interface TemporaryPasscode {
  id: string;
  code: string; // 6 digits
  durationMinutes: number; // e.g. 15, 30, 60
  reason: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  status: 'active' | 'used' | 'expired' | 'revoked';
}

export interface ExtensionRequest {
  id: string;
  childName: string;
  requestedMinutes: number;
  reason: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: number;
}

export interface HabitTask {
  id: string;
  title: string;
  rewardMinutes: number;
  icon: string;
  completed: boolean;
  verifiedByParent: boolean;
}

export interface UsageLog {
  id: string;
  time: string;
  type: 'unlock' | 'lock' | 'extension' | 'warning' | 'passcode';
  title: string;
  description: string;
}

export interface FamilyState {
  device: ChildDevice;
  passcodes: TemporaryPasscode[];
  extensionRequests: ExtensionRequest[];
  habitTasks: HabitTask[];
  logs: UsageLog[];
  parentPin: string; // PIN to enter parent mode
}
