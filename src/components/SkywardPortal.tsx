import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, ArrowRight, ChevronDown, X, Lock, CheckCircle
} from 'lucide-react';
import { setSharedCookie } from '../utils/cookie';

interface SkywardPortalProps {
  onUnlock: () => void;
}

export const SkywardPortal: React.FC<SkywardPortalProps> = ({ onUnlock }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [showCookieNotice, setShowCookieNotice] = useState(true);
  const [activeCardModal, setActiveCardModal] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleUnlockCrossDomain = () => {
    try {
      setSharedCookie('wtg_unlocked', 'true');
      localStorage.setItem('wtg_unlocked', 'true');
      sessionStorage.setItem('wtg_unlocked', 'true');
    } catch {}
    onUnlock();
  };

  // Match the exact tab title seen in the user's browser tab: "Skyward | A Better SIS & ERP for K-12 School Districts"
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Skyward | A Better SIS & ERP for K-12 School Districts';

    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    const originalFavicon = link ? link.href : '';

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // Skyward exact blue/white swooshes SVG favicon
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="%2300539f" rx="4"/><path fill="white" d="M4 18c6-8 13-10 24-8-7 3-13 7-17 14-2-1-4-2-7-6z"/><path fill="%2300a8cc" d="M9 22c5-6 10-8 19-6-6 3-10 6-13 11-2-1-3-2-6-5z"/></svg>';

    return () => {
      document.title = originalTitle;
      if (link && originalFavicon) {
        link.href = originalFavicon;
      }
    };
  }, []);

  // Global keystroke listener: typing 'playgamesskib' anywhere on the page unlocks
  useEffect(() => {
    let keyBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-20);
      if (keyBuffer.includes('playgamesskib')) {
        handleUnlockCrossDomain();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stealth search submit: typing 'playgamesskib', 'lucas', or 'games' unlocks
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (q === 'playgamesskib' || q === 'lucas' || q === 'lucashendsbee' || q === 'games' || q === 'play' || q === 'wtg') {
      handleUnlockCrossDomain();
      return;
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = loginInput.trim().toLowerCase();
    if (q.includes('playgamesskib') || q.includes('lucas') || q.includes('games')) {
      handleUnlockCrossDomain();
      return;
    }
    setShowLoginModal(false);
    setLoginInput('');
  };

  return (
    <div className="min-h-screen bg-[#00549c] font-sans flex flex-col select-none overflow-x-hidden text-slate-800">
      {/* 1. TOP NAV BAR: Exact Royal Blue (#00549c) */}
      <header className="bg-[#00549c] text-white z-20 sticky top-0 shadow-sm">
        <div className="w-full px-4 sm:px-8 py-2 sm:py-2.5 flex items-center justify-between max-w-7xl mx-auto">
          {/* Exact Skyward Logo from screenshot */}
          <div 
            className="flex items-center cursor-pointer hover:opacity-95 transition-opacity" 
            onClick={() => {}}
            title="Skyward"
          >
            <img 
              src="./assets/skyward_logo.png" 
              alt="Skyward" 
              className="h-8 sm:h-10 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith('/assets/skyward_logo.png')) {
                  target.src = '/assets/skyward_logo.png';
                }
              }}
            />
          </div>

          {/* Right Action Items: Log in & Get started */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 text-white hover:text-sky-200 font-semibold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 transition-colors cursor-pointer"
            >
              <span className="text-base font-mono">⎋</span>
              <span>Log in</span>
            </button>

            <button
              onClick={() => setShowStoryModal(true)}
              className="bg-[#52b72a] hover:bg-[#469e24] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer rounded-xs"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 2. SUB-NAV BAR: Exact Slate-Blue (#43669b) */}
        <div className="bg-[#43669b] text-white border-t border-blue-400/20 px-4 sm:px-8 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold tracking-wide">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <nav className="flex items-center gap-3 sm:gap-6 overflow-x-auto py-0.5">
              <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100 px-1.5 py-0.5">
                <span>Products</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100 px-1.5 py-0.5">
                <span>Resources</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              <span className="cursor-pointer hover:text-sky-100 px-1.5 py-0.5">Events</span>

              <div className="flex items-center gap-1 cursor-pointer bg-[#335384] px-2 py-0.5 rounded-xs text-white">
                <span>Support</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100 px-1.5 py-0.5">
                <span>Blogs</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100 px-1.5 py-0.5">
                <span>About</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </nav>

            {/* Search Trigger */}
            <div className="flex items-center shrink-0 ml-3">
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="flex items-center gap-1.5 text-white/95 hover:text-white cursor-pointer px-2 py-0.5"
                title="Search Skyward.com"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Search Bar (Stealth Password Entry Method) */}
        {showSearch && (
          <div className="bg-[#335384] px-4 sm:px-8 py-3 border-t border-blue-300/30 shadow-inner animate-in fade-in duration-150">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Skyward.com resources or products..."
                    className="w-full bg-white text-slate-900 placeholder-slate-400 pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded outline-none shadow-xs"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#00549c] hover:bg-[#004280] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
                >
                  Go
                </button>
              </form>
              <button 
                onClick={() => setShowSearch(false)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO & MAIN SHOWCASE: 100% IDENTICAL TO USER'S SCREENSHOT */}
      <main className="flex-1 w-full bg-[#1b263b] relative overflow-hidden flex flex-col items-center">
        <div className="w-full relative max-w-[1920px] aspect-[1898/946] min-h-[580px] sm:min-h-[700px] lg:min-h-[820px] flex flex-col justify-between">
          {/* Exact Real Visual from User's Screenshot */}
          <img 
            src="./assets/skyward_screenshot.png"
            alt="Skyward Education Portal"
            className="w-full h-full object-cover object-top select-none pointer-events-none absolute inset-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('Screenshot_2026-10-27')) {
                target.src = './assets/aistudio/Screenshot_2026-10-27_185600_142769a1.png';
              }
            }}
          />

          {/* Hot-Zone Overlay 1: "Watch the story" Button */}
          <button
            onClick={() => setShowStoryModal(true)}
            className="absolute left-[8%] sm:left-[8.5%] top-[52%] sm:top-[53%] w-[130px] sm:w-[155px] h-[36px] sm:h-[44px] rounded-full cursor-pointer hover:bg-white/10 transition-colors z-10"
            title="Watch the story"
          />

          {/* Hot-Zone Overlay 2: Bottom 3 Floating Cards */}
          <div className="absolute left-[7%] right-[7%] bottom-[12%] sm:bottom-[13%] grid grid-cols-3 gap-2 sm:gap-4 h-[120px] sm:h-[145px] z-10">
            {/* Card 1: Meet DistrictPulse */}
            <div 
              onClick={() => setActiveCardModal('DistrictPulse™ Analytics with Amazon Web Services')}
              className="cursor-pointer hover:bg-black/5 rounded-xs transition-colors"
              title="Learn more about DistrictPulse"
            />
            {/* Card 2: iCon 2027 Registration */}
            <div 
              onClick={() => setActiveCardModal('iCon 2027 Skyward User Conference')}
              className="cursor-pointer hover:bg-black/5 rounded-xs transition-colors"
              title="iCon 2027 Registration"
            />
            {/* Card 3: Thinking about Migrating to Qmlativ */}
            <div 
              onClick={() => setActiveCardModal('Migrating to Qmlativ: Case Studies')}
              className="cursor-pointer hover:bg-black/5 rounded-xs transition-colors"
              title="Migrating to Qmlativ"
            />
          </div>

          {/* Hot-Zone Overlay 3: Cookie Banner "OK" Button */}
          {showCookieNotice && (
            <button
              onClick={() => setShowCookieNotice(false)}
              className="absolute left-[48%] -translate-x-1/2 bottom-[2%] sm:bottom-[2.5%] w-[48px] sm:w-[58px] h-[24px] sm:h-[30px] cursor-pointer z-10 hover:opacity-80"
              title="Acknowledge cookie policy"
            />
          )}
        </div>
      </main>

      {/* 4. COOKIE NOTICE FALLBACK BANNER (if scrolled down or dismissed) */}
      {showCookieNotice && (
        <div className="bg-[#f3f4f6] text-[#4b5563] text-xs py-3 px-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-center gap-3 z-30 shadow-md">
          <p className="text-center sm:text-left leading-relaxed max-w-4xl">
            This site uses cookies to improve your browsing experience and to help us understand how you use our site.
            To learn more about how we use this data, click to{' '}
            <span className="text-[#00549c] underline cursor-pointer font-medium hover:text-[#00386b]">
              view our Privacy Policy
            </span>. By continuing to use this site, you are consenting to our cookie policy.
          </p>
          <button
            onClick={() => setShowCookieNotice(false)}
            className="bg-[#2c2c2c] hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-6 py-1.5 rounded-xs transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* 5. WATCH THE STORY MODAL */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#00549c] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-sm">Skyward Stories: Lakeview Community Schools</span>
              <button 
                onClick={() => setShowStoryModal(false)}
                className="text-white hover:text-sky-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="aspect-video bg-slate-900 rounded flex flex-col items-center justify-center text-white p-6 text-center">
                <Play className="w-12 h-12 text-[#52b72a] mb-2 fill-current" />
                <h3 className="font-bold text-base">Lakeview Community School District</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  How transitioning to Skyward saved teachers 5+ hours of administrative overhead every week.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setShowStoryModal(false)}
                  className="bg-[#00549c] text-white px-4 py-1.5 rounded text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. REALISTIC DISTRICT LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-300 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#00549c] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-200" />
                <span className="font-bold text-sm">Skyward Customer Access Portal</span>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your district school identifier, employee ID, or family access credentials to log in.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  District ID or Login ID
                </label>
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="e.g. 104492 or district username"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#00549c] focus:bg-white px-3 py-2 text-xs sm:text-sm rounded outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00549c] hover:bg-[#004280] text-white font-bold text-xs sm:text-sm px-5 py-2 rounded transition-colors cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. RESOURCE CARD DETAILS MODAL */}
      {activeCardModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-300 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#00549c] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-sm">{activeCardModal}</span>
              <button 
                onClick={() => setActiveCardModal(null)}
                className="text-white hover:text-sky-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Authorized K-12 Educational Resource</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect with educational software specialists and discover modern ERP & SIS tools built specifically for student achievement and administrative efficiency.
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveCardModal(null)}
                  className="bg-[#00549c] text-white px-4 py-1.5 rounded text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
