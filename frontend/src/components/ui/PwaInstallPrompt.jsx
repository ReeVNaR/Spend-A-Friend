import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles, Check } from 'lucide-react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if user previously dismissed prompt in this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Check for iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Capture Chrome/Android/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // If already installed or dismissed, do not show
  if (isStandalone || isDismissed) {
    return null;
  }

  // Only show if we have an install prompt (Android/Chrome/Edge) or on iOS Safari
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Pill */}
      <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-3.5 rounded-3xl bg-white/95 backdrop-blur-xl border border-blue-200/80 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.14)] text-slate-900 flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-3 min-w-0">
            {/* App Icon */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 p-1.5">
              <img
                src="/icon-192.png"
                alt="Spend-A-Friend"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5 truncate">
                <span>Install Spend-A-Friend</span>
                <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded-md">
                  App
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                {isIOS
                  ? 'Add to home screen for native experience'
                  : 'Fast 1-tap launch & instant offline access'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-slate-900 shadow-2xl border border-slate-100 space-y-4 animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  📲
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    2 simple steps to add to Home Screen
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    Tap the Share Button in Safari
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                    <span>Look for</span>
                    <Share className="w-3.5 h-3.5 inline text-blue-600" />
                    <span>in your browser menu bar below.</span>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    Select &quot;Add to Home Screen&quot;
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                    <span>Scroll down and tap</span>
                    <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />
                    <span><strong>Add to Home Screen</strong>.</span>
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs active:scale-95 transition-all shadow-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
