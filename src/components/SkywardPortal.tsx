import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, ArrowRight, LogIn, ChevronDown, X, Lock
} from 'lucide-react';
import { verifyCredentialsClientSide } from '../utils/auth';
import { getApiUrl } from '../utils/api';
import { setSharedCookie } from '../utils/cookie';

interface SkywardPortalProps {
  onUnlock: () => void;
}

export const SkywardPortal: React.FC<SkywardPortalProps> = ({ onUnlock }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showCookieNotice, setShowCookieNotice] = useState(true);

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

  // Search submit (Hidden Unlock Trigger #1)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (q === 'playgamesskib' || q === 'lucas' || q === 'lucashendsbee') {
      handleUnlockCrossDomain();
      return;
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  // Login modal submit (Unlock + Admin Auth)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = loginUsername.trim();
    const cleanPass = loginPassword.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');

    if (
      cleanUser.toLowerCase() === 'playgamesskib' ||
      cleanPass.toLowerCase() === 'playgamesskib'
    ) {
      handleUnlockCrossDomain();
      return;
    }

    // Direct Admin Sign In from Skyward Login modal
    try {
      const res = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data?.token) {
        localStorage.setItem('wtg_admin_token', data.token);
        setSharedCookie('wtg_admin_token', data.token);
        handleUnlockCrossDomain();
        return;
      }
    } catch {}

    // GitHub Pages / Static fallback:
    if (verifyCredentialsClientSide(cleanUser, cleanPass)) {
      const clientToken = 'wtg_client_' + Date.now();
      localStorage.setItem('wtg_admin_token', clientToken);
      setSharedCookie('wtg_admin_token', clientToken);
      handleUnlockCrossDomain();
      return;
    }

    setLoginError(true);
    setTimeout(() => setLoginError(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white text-[#1f2937] font-sans flex flex-col select-none overflow-x-hidden">
      {/* 1. TOP NAV BAR: Exact Royal Blue (#00539f) with Skyward Logo, Log in, and Get started */}
      <header className="bg-[#00539f] text-white">
        <div className="w-full px-4 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between">
          {/* Exact Skyward Logo with relative path and fallback */}
          <div className="flex items-center cursor-pointer" onClick={() => {}}>
            <img 
              src="./assets/skyward_logo.png" 
              alt="Skyward" 
              className="h-9 sm:h-11 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith('/assets/skyward_logo.png')) {
                  target.src = '/assets/skyward_logo.png';
                }
              }}
            />
          </div>

          {/* Right Action Items */}
          <div className="flex items-center">
            {/* Log in button with arrow bracket icon */}
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 text-white hover:text-sky-200 font-semibold text-sm sm:text-base px-3 sm:px-4 py-2 transition-colors cursor-pointer mr-2 sm:mr-3"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5 rotate-180 stroke-[2.5]" />
              <span>Log in</span>
            </button>

            {/* Get started button: Exact green #52b72a */}
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-[#52b72a] hover:bg-[#48a524] text-white font-bold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 2. SUB-NAV BAR: Exact Slate-Blue (#48679d) matching screenshot */}
        <div className="bg-[#48679d] text-white border-t border-blue-400/20 px-4 sm:px-8 py-2 sm:py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold tracking-wide">
          <nav className="flex items-center gap-4 sm:gap-8 overflow-x-auto py-0.5">
            <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100">
              <span>Products</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>

            <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100">
              <span>Resources</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>

            <span className="cursor-pointer hover:text-sky-100">Events</span>

            <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100">
              <span>Support</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>

            <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100">
              <span>Blogs</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>

            <div className="flex items-center gap-1 cursor-pointer hover:text-sky-100">
              <span>About</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </nav>

          {/* Search Trigger */}
          <div className="flex items-center shrink-0 ml-4">
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:text-sky-100 py-0.5 px-1.5 rounded transition-colors"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Dropdown Search Bar (Stealth Password Entry Method #1) */}
        {showSearch && (
          <div className="bg-[#3e5a8c] px-4 sm:px-8 py-3 border-t border-blue-300/30 shadow-inner flex items-center justify-between gap-3 animate-in fade-in duration-150">
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
                />
              </div>
              <button
                type="submit"
                className="bg-[#00539f] hover:bg-[#004280] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded shadow-xs transition-colors"
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
        )}
      </header>

      {/* 3. HERO SECTION: 100% IDENTICAL TO SCREENSHOT IMG_5626.png */}
      <section className="relative w-full overflow-hidden flex-1 flex items-center bg-[#1b263b]">
        {/* Exact cropped hero image of teacher, student, classroom & books */}
        <div 
          className="w-full relative aspect-[2360/876] min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] bg-cover bg-left sm:bg-center"
          style={{ backgroundImage: `url('./assets/skyward_hero_opt.jpg'), url('/assets/skyward_hero_opt.jpg')` }}
        >
          {/* Clickable overlay for "Watch the story" button */}
          <div 
            onClick={() => setShowStoryModal(true)}
            className="absolute left-[3%] sm:left-[4%] bottom-[12%] sm:bottom-[15%] w-48 sm:w-60 h-10 sm:h-12 rounded-full cursor-pointer hover:opacity-90"
            title="Watch the story"
          />
        </div>
      </section>

      {/* 4. COOKIE CONSENT BANNER: Exact copy and styling matching IMG_5626.png */}
      {showCookieNotice && (
        <div className="bg-[#f2f2f2] text-[#555] text-xs sm:text-[13px] py-4 px-6 border-t border-slate-300 flex flex-col items-center justify-center gap-3 z-20 shadow-md">
          <p className="text-center leading-relaxed max-w-4xl">
            This site uses cookies to improve your browsing experience and to help us understand how you use our site.<br className="hidden sm:inline" />
            To learn more about how we use this data, click to{' '}
            <span className="text-[#00539f] underline cursor-pointer font-medium hover:text-[#003d75]">
              view our Privacy Policy
            </span>
            . By continuing to use this site, you are consenting to our cookie policy.
          </p>

          <button
            onClick={() => setShowCookieNotice(false)}
            className="bg-[#313131] hover:bg-[#1a1a1a] text-white font-bold text-xs uppercase tracking-wider px-7 py-2 rounded transition-colors shadow-xs cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* 5. SKYWARD LOGIN MODAL (Stealth Password Entry Method #2) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#00539f] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-300" />
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
              <p className="text-xs text-slate-600">
                Sign in to your district’s Skyward Family Access, Student Access, or Educator Management portal.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  District ID or Login ID
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="District ID or Username"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#00539f] focus:bg-white px-3 py-2 text-xs sm:text-sm rounded outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password / Authorization Key
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#00539f] focus:bg-white px-3 py-2 text-xs sm:text-sm rounded outline-none"
                />
              </div>

              {loginError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded">
                  Authentication failed. Please check credentials or contact district support.
                </div>
              )}

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
                  className="bg-[#00539f] hover:bg-[#004280] text-white font-bold text-xs sm:text-sm px-5 py-2 rounded shadow-xs transition-colors cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. WATCH THE STORY MODAL */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 text-slate-800">
            <div className="bg-[#00539f] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-sm">Skyward Stories: Empowering K-12 Classrooms</span>
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
                  className="bg-[#00539f] text-white px-4 py-1.5 rounded text-xs font-bold cursor-pointer"
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
