import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, ArrowRight, ChevronDown, ChevronLeft, ChevronRight,
  X, Lock, Lightbulb, Users, HelpCircle, BookOpen, Hand, PhoneCall,
  CheckCircle, FileText, Calendar, Building
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

  // Set browser tab title and favicon to match authentic Skyward SIS portal
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
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="%2300549c" rx="4"/><path fill="white" d="M4 18c6-8 13-10 24-8-7 3-13 7-17 14-2-1-4-2-7-6z"/><path fill="%2300a8cc" d="M9 22c5-6 10-8 19-6-6 3-10 6-13 11-2-1-3-2-6-5z"/></svg>';

    return () => {
      document.title = originalTitle;
      if (link && originalFavicon) {
        link.href = originalFavicon;
      }
    };
  }, []);

  // Global stealth unlock: typing 'playgamesskib' anywhere on the page unlocks
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

  // Stealth search submit
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

  // Stealth login modal submit
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
    <div className="min-h-screen bg-white font-sans flex flex-col select-none overflow-x-hidden text-slate-800">
      {/* 1. TOP NAV BAR: Exact Royal Blue (#00549c) */}
      <header className="bg-[#00549c] text-white sticky top-0 z-40 shadow-sm">
        <div className="w-full px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between max-w-7xl mx-auto">
          {/* Authentic Skyward Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => {}}
            title="Skyward"
          >
            <img 
              src="./assets/skyward_logo.png" 
              alt="Skyward" 
              className="h-8 sm:h-9 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith('/assets/skyward_logo.png')) {
                  target.src = '/assets/skyward_logo.png';
                }
              }}
            />
          </div>

          {/* Right Action Items: Log in & Get started */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 text-white hover:text-sky-200 font-semibold text-xs sm:text-sm px-2.5 py-1.5 transition-colors cursor-pointer"
            >
              <span className="text-sm font-mono">[←</span>
              <span>Log in</span>
            </button>

            <button
              onClick={() => setShowStoryModal(true)}
              className="bg-[#52b72a] hover:bg-[#469e24] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 flex items-center gap-2 transition-colors shadow-xs cursor-pointer rounded-xs"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 2. SUB-NAV BAR: Exact Steel-Blue (#43669b) */}
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

              {/* Active selection "Support" with darker block (#355587) matching user's screenshot */}
              <div className="flex items-center gap-1 cursor-pointer bg-[#355587] px-2.5 py-0.5 rounded-xs text-white">
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
          <div className="bg-[#355587] px-4 sm:px-8 py-3 border-t border-blue-300/30 shadow-inner animate-in fade-in duration-150">
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

      {/* 3. HERO SHOWCASE (Single, clean, pure HTML/CSS without overlapping screenshots) */}
      <main className="flex-1 w-full relative bg-[#13233c] text-white overflow-hidden flex flex-col justify-between">
        {/* Authentic Teacher & Classroom Backdrop (Blended cleanly to the right) */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-no-repeat bg-right opacity-90 pointer-events-none"
          style={{ 
            backgroundImage: "url('./assets/teacher_classroom.jpg')",
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,1) 60%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,1) 60%)"
          }}
        />

        {/* Deep navy atmospheric gradient ensuring high-contrast readable text */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#111e33] via-[#111e33]/90 to-transparent pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 pt-8 sm:pt-14 pb-24 sm:pb-32 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Headline & Copy (Exact text from user's screenshot) */}
            <div className="lg:col-span-6 space-y-4 max-w-xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.15] text-white drop-shadow-md">
                Less time on tasks.<br />
                More time for students.
              </h1>

              <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed font-normal pt-1 max-w-md">
                You can't squeeze any more hours into the school day, but you can find ways to complete essential administrative tasks with super speed.
              </p>

              <div className="pt-3">
                <button
                  onClick={() => setShowStoryModal(true)}
                  className="inline-flex items-center gap-2.5 border-2 border-white rounded-full px-5 py-2.5 text-white font-bold text-xs sm:text-sm hover:bg-white hover:text-[#00549c] transition-all cursor-pointer shadow-md group"
                >
                  <div className="w-5 h-5 rounded-full bg-white text-[#00549c] flex items-center justify-center group-hover:bg-[#00549c] group-hover:text-white transition-colors">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                  <span>Watch the story</span>
                </button>
              </div>
            </div>

            {/* Center "Suggested Resources" Frosted Glass Card (Exact layout from user's screenshot) */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-5 shadow-2xl text-white">
                <h3 className="text-center font-bold text-sm tracking-wide text-white/95 mb-4">
                  Suggested Resources
                </h3>

                {/* 6 Circular Badge Action Icons */}
                <div className="grid grid-cols-3 gap-3 text-center mb-5">
                  {/* 1. Professional Development */}
                  <div 
                    onClick={() => setActiveCardModal('Professional Development')}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#c93b42] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight text-slate-200">
                      Professional Development
                    </span>
                  </div>

                  {/* 2. Family Toolkit */}
                  <div 
                    onClick={() => setActiveCardModal('Family Toolkit')}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#287fb8] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight text-slate-200">
                      Family Toolkit
                    </span>
                  </div>

                  {/* 3. Support Center */}
                  <div 
                    onClick={() => setActiveCardModal('Support Center')}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#9b59b6] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight text-slate-200">
                      Support Center
                    </span>
                    <span className="text-[8px] text-slate-400 -mt-1 leading-none">(Authorized only)</span>
                  </div>

                  {/* 4. Skyward Academy */}
                  <div 
                    onClick={() => setActiveCardModal('Skyward Academy')}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1f4e79] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight text-slate-200">
                      Skyward Academy
                    </span>
                  </div>

                  {/* 5. New to Skyward */}
                  <div 
                    onClick={() => setActiveCardModal('New to Skyward')}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#27ae60] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <Hand className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight text-slate-200">
                      New to Skyward
                    </span>
                  </div>

                  {/* 6. FAQ */}
                  <div 
                    onClick={() => setActiveCardModal('Frequently Asked Questions')}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#d35400] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight text-slate-200">
                      FAQ
                    </span>
                  </div>
                </div>

                {/* 3-Column Resource Links */}
                <div className="pt-3 border-t border-white/15 grid grid-cols-3 gap-2 text-[10px] text-slate-300">
                  <div className="space-y-1">
                    <span onClick={() => setActiveCardModal('Skyward Insider')} className="hover:text-white hover:underline cursor-pointer block truncate">Skyward Insider</span>
                    <span onClick={() => setActiveCardModal('Preemptive Support')} className="hover:text-white hover:underline cursor-pointer block truncate">Preemptive Support</span>
                  </div>
                  <div className="space-y-1">
                    <span onClick={() => setActiveCardModal('Quick Hits Videos')} className="hover:text-white hover:underline cursor-pointer block truncate">Quick Hits Videos</span>
                    <span onClick={() => setActiveCardModal('Employee Access')} className="hover:text-white hover:underline cursor-pointer block truncate">Employee Access</span>
                  </div>
                  <div className="space-y-1">
                    <span onClick={() => setActiveCardModal('Qmlativ Onboarding')} className="hover:text-white hover:underline cursor-pointer block truncate">Qmlativ Onboarding</span>
                    <span onClick={() => setActiveCardModal('Accessibility')} className="hover:text-white hover:underline cursor-pointer block truncate">Accessibility</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Floating Bottom Cards (100% Match to screenshot, crisp HTML/CSS) */}
        <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-8 -mb-10 sm:-mb-14">
          <div className="flex items-center gap-2">
            <button 
              className="w-8 h-8 rounded-full bg-white shadow-md text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer shrink-0 hidden sm:flex"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 flex-1">
              {/* Card 1 */}
              <div 
                onClick={() => setActiveCardModal('DistrictPulse™ Analytics')}
                className="bg-white text-slate-800 p-4 rounded-xs shadow-xl hover:shadow-2xl transition-all border border-slate-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Resource</span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    Meet DistrictPulse™ a data analytics tool by Skyward & Amazon Web Services.
                  </h4>
                </div>
                <div className="pt-3 flex items-center gap-1 text-xs font-bold text-[#00549c] hover:underline">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 2 */}
              <div 
                onClick={() => setActiveCardModal('iCon 2027 Registration')}
                className="bg-white text-slate-800 p-4 rounded-xs shadow-xl hover:shadow-2xl transition-all border border-slate-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Event</span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    iCon 2027 Registration is now open!
                  </h4>
                </div>
                <div className="pt-3 flex items-center gap-1 text-xs font-bold text-[#00549c] hover:underline">
                  <span>Register Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 3 */}
              <div 
                onClick={() => setActiveCardModal('Migrating to Qmlativ')}
                className="bg-white text-slate-800 p-4 rounded-xs shadow-xl hover:shadow-2xl transition-all border border-slate-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Case Study</span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    Thinking about Migrating to Qmlativ?
                  </h4>
                </div>
                <div className="pt-3 flex items-center gap-1 text-xs font-bold text-[#00549c] hover:underline">
                  <span>Hear from 7 districts that did</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <button 
              className="w-8 h-8 rounded-full bg-white shadow-md text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer shrink-0 hidden sm:flex"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Spacer between hero cards and footer */}
      <div className="h-16 sm:h-20 bg-white" />

      {/* 4. COOKIE CONSENT BANNER (Single, authentic, non-overlapping) */}
      {showCookieNotice && (
        <div className="bg-[#f8f9fa] text-[#4b5563] text-xs py-4 px-6 border-t border-slate-200 flex flex-col items-center justify-center gap-2.5 z-30 shadow-xs">
          <p className="text-center leading-relaxed max-w-4xl text-slate-600">
            This site uses cookies to improve your browsing experience and to help us understand how you use our site.<br className="hidden sm:inline" />
            To learn more about how we use this data, click to{' '}
            <span className="text-[#00549c] underline cursor-pointer font-medium hover:text-[#00386b]">
              view our Privacy Policy
            </span>. By continuing to use this site, you are consenting to our cookie policy.
          </p>
          <button
            onClick={() => setShowCookieNotice(false)}
            className="bg-[#333333] hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-7 py-1.5 rounded-xs transition-colors cursor-pointer"
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

      {/* 6. DISTRICT LOGIN MODAL */}
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

      {/* 7. RESOURCE MODAL */}
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
