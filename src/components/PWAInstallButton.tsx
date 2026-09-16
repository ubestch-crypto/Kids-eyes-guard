import React, { useState } from 'react';
import { Download, Share2, Smartphone, CheckCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        已安装到设备桌面
      </span>
    );
  }

  return (
    <>
      {isInstallable ? (
        <button
          id="btn-pwa-install-native"
          onClick={install}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>安装到设备桌面 (PWA)</span>
        </button>
      ) : (
        <button
          id="btn-pwa-install-guide"
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium px-3 py-1.5 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-600" />
          <span>安装/发布说明</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    安装到孩子手机或平板桌面
                  </h3>
                  <p className="text-xs text-slate-500">
                    免应用商店审核，即装即用，全屏沉浸锁屏
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs sm:text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="flex items-center gap-2 font-medium text-slate-800 mb-1">
                  <Share2 className="w-4 h-4 text-sky-600" />
                  苹果 iPad / iPhone (Safari 浏览器)
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                  <li>在 Safari 浏览器中打开本应用链接。</li>
                  <li>点击底栏或顶栏的「<strong>分享 (Share)</strong>」图标。</li>
                  <li>向下滑动选择「<strong>添加到主屏幕 (Add to Home Screen)</strong>」。</li>
                  <li>完成添加后，桌面上将出现带有护眼图标的独立应用！</li>
                </ol>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="flex items-center gap-2 font-medium text-slate-800 mb-1">
                  <Download className="w-4 h-4 text-teal-600" />
                  安卓平板 / 手机 (Chrome / 华为 / 小米等)
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                  <li>在浏览器右上角点击「更多/三个点」菜单。</li>
                  <li>选择「<strong>安装应用</strong>」或「<strong>添加到主屏幕</strong>」。</li>
                  <li>在系统弹窗中点击确认「添加」即可。</li>
                </ol>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs">
                💡 <strong>温馨提示：</strong>
                应用已内置离线缓存技术（Service Worker），断网时亦可正常展示健康倒计时和护眼操。
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
