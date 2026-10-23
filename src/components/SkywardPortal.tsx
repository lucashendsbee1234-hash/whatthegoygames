import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, ArrowRight, LogIn, ChevronDown, X, Lock, CheckCircle2, Shield
} from 'lucide-react';

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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Match the exact tab title seen in the user's browser tab: "Skyward | A Better SI..."
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
      // Don't intercept if typing in a normal form input (they can submit or press enter)
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-20);
      if (keyBuffer.includes('playgamesskib')) {
        onUnlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock]);

  // Search submit (Hidden Unlock Trigger #1)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().toLowerCase() === 'playgamesskib') {
      onUnlock();
      return;
    }
    // Fake realistic search
    setSearchQuery('');
    setShowSearch(false);
  };

  // Login modal submit (Unlock + Admin Auth)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = loginUsername.trim();
    const cleanPass = loginPassword.trim();

    if (
      cleanUser.toLowerCase() === 'playgamesskib' ||
      cleanPass.toLowerCase() === 'playgamesskib'
    ) {
      onUnlock();
      return;
    }

    // Direct Admin Sign In from Skyward Login modal
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('wtg_admin_token', data.token);
        onUnlock();
        return;
      }
    } catch {}

    setLoginError(true);
    setTimeout(() => setLoginError(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white text-[#1f2937] font-sans flex flex-col select-none overflow-x-hidden">
      {/* 1. TOP NAV BAR: Exact Royal Blue (#00539f) with Skyward Logo, Log in, and Get started */}
      <header className="bg-[#00539f] text-white">
        <div className="w-full px-4 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between">
          {/* Exact Skyward Logo */}
          <div className="flex items-center">
            <img 
              src="/assets/skyward_logo.png" 
              alt="Skyward" 
              className="h-10 sm:h-12 w-auto object-contain cursor-pointer"
              onClick={() => {}}
            />
          </div>

          {/* Right Action Items */}
          <div className="flex items-center">
            {/* Log in button with arrow bracket icon */}
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 text-white hover:text-sky-200 font-semibold text-sm sm:text-base px-3 sm:px-4 py-2 transition-colors cursor-pointer mr-2 sm:mr-3"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
              <span>Log in</span>
            </button>

            {/* Get started button: Exact green #52b72a */}
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-[#52b72a] hover:bg-[#48a524] text-white font-bold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. SUB-NAV BAR: Exact Slate-Blue (#5575b4) with Products, Resources, Events, Support, Blogs, About, Search */}
        <div className="bg-[#5575b4] text-white border-t border-blue-400/20 px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold tracking-wide">
          <nav className="flex items-center gap-4 sm:gap-8 overflow-x-auto py-0.5">
            <div 
              className="flex items-center gap-1 cursor-pointer hover:text-sky-100"
              onClick={() => setActiveDropdown(activeDropdown === 'products' ? null : 'products')}
            >
              <span>Products</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>

            <div 
              className="flex items-center gap-1 cursor-pointer hover:text-sky-100"
              onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
            >
              <span>Resources</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>

            <span className="cursor-pointer hover:text-sky-100">Events</span>

            <div 
              className="flex items-center gap-1 cursor-pointer hover:text-sky-100"
              onClick={() => setActiveDropdown(activeDropdown === 'support' ? null : 'support')}
            >
              <span>Support</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>

            <div 
              className="flex items-center gap-1 cursor-pointer hover:text-sky-100"
              onClick={() => setActiveDropdown(activeDropdown === 'blogs' ? null : 'blogs')}
            >
              <span>Blogs</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>

            <div 
              className="flex items-center gap-1 cursor-pointer hover:text-sky-100"
              onClick={() => setActiveDropdown(activeDropdown === 'about' ? null : 'about')}
            >
              <span>About</span>
              <ChevronDown className="w-3.5 h-3.5" />
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
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Dropdown Search Bar (Stealth Password Entry Method #1) */}
        {showSearch && (
          <div className="bg-[#4665a3] px-4 sm:px-8 py-3 border-t border-blue-300/30 shadow-inner flex items-center justify-between gap-3 animate-in fade-in duration-150">
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
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION: Exact Replica of Skyward Classroom & Typography */}
      <section className="relative w-full bg-[#1b263b] overflow-hidden flex-1 min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center">
        {/* Exact cropped background image of the teacher & student */}
        <div 
          className="absolute inset-0 bg-cover bg-center sm:bg-right-top"
          style={{ backgroundImage: `url('/assets/skyward_hero_bg.png')` }}
        />

        {/* Gradient overlay for perfect readability matching the screenshot */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent sm:from-black/75 sm:via-black/35 sm:to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-12 lg:py-20 w-full">
          <div className="max-w-xl sm:max-w-2xl text-white space-y-4 sm:space-y-6">
            {/* Exact Headline from Skyward screenshot */}
            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-[1.08] drop-shadow-sm font-sans">
              Less time on tasks.<br />
              More time for students.
            </h1>

            {/* Exact Subtitle from Skyward screenshot */}
            <p className="text-base sm:text-lg lg:text-xl font-medium text-slate-100 leading-snug sm:leading-relaxed max-w-xl drop-shadow-xs">
              You can't squeeze any more hours into the school day, but you can find ways to complete essential administrative tasks with super speed.
            </p>

            {/* Exact "Watch the story" button with play icon */}
            <div className="pt-2 sm:pt-4">
              <button
                onClick={() => setShowStoryModal(true)}
                className="inline-flex items-center gap-2.5 border-2 border-white bg-black/30 hover:bg-white hover:text-[#00539f] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all shadow-md group cursor-pointer backdrop-blur-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center group-hover:bg-[#00539f] group-hover:text-white transition-colors">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch the story</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COOKIE CONSENT BANNER: Exact gray bottom bar matching screenshot */}
      {showCookieNotice && (
        <div className="bg-[#f2f2f2] text-[#4b5563] text-xs sm:text-sm py-4 px-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 shadow-lg">
          <p className="text-center sm:text-left leading-relaxed max-w-4xl">
            This site uses cookies to improve your browsing experience and to help us understand how you use our site. To learn more about how we use this data, click to{' '}
            <span className="text-[#00539f] underline cursor-pointer font-medium hover:text-[#003d75]">
              view our Privacy Policy
            </span>
            . By continuing to use this site, you are consenting to our cookie policy.
          </p>

          <button
            onClick={() => setShowCookieNotice(false)}
            className="bg-[#2d3748] hover:bg-[#1a202c] text-white font-bold text-xs uppercase tracking-wider px-6 py-2 rounded transition-colors shrink-0 shadow-xs cursor-pointer"
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
                  placeholder="e.g. DIS-042 or Username"
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
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00539f] hover:bg-[#004280] text-white font-bold text-xs sm:text-sm px-5 py-2 rounded shadow-xs transition-colors"
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
                className="text-white hover:text-sky-200"
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
                  className="bg-[#00539f] text-white px-4 py-1.5 rounded text-xs font-bold"
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
