import React, { useState, useEffect } from 'react';
import { Search, Calendar, BookOpen, Award, Users, ChevronRight, Phone, Mail, MapPin, ExternalLink, Clock } from 'lucide-react';

interface SchoolWebsiteProps {
  onUnlock: () => void;
}

export const SchoolWebsite: React.FC<SchoolWebsiteProps> = ({ onUnlock }) => {
  const [searchInput, setSearchInput] = useState('');
  const [keyBuffer, setKeyBuffer] = useState('');

  // Update tab title and favicon for school disguise
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Oakridge High School | District 42 Public Portal';

    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    const originalFavicon = link ? link.href : '';

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // Graduation cap / school SVG favicon
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231e3a8a"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>';

    return () => {
      document.title = originalTitle;
      if (link && originalFavicon) {
        link.href = originalFavicon;
      }
    };
  }, []);

  // Global keystroke listener: typing 'playgamesskib' anywhere unlocks the game site
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input to avoid double triggers
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      setKeyBuffer((prev) => {
        const updated = (prev + e.key.toLowerCase()).slice(-20);
        if (updated.includes('playgamesskib')) {
          onUnlock();
          return '';
        }
        return updated;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().toLowerCase() === 'playgamesskib') {
      onUnlock();
    } else {
      // Simulate normal search feedback
      setSearchInput('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans flex flex-col select-none">
      {/* Top District Emergency / Alert Banner */}
      <div className="bg-[#1e3a8a] text-white text-xs py-1.5 px-4 font-medium flex items-center justify-between border-b border-blue-900">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-blue-950 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
              Notice
            </span>
            <span>Quarter 2 Progress Reports & Bell Schedule Updates Posted to PowerSchool</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-blue-200 text-[11px]">
            <span>Staff Directory</span>
            <span>&bull;</span>
            <span>Parent Portal</span>
            <span>&bull;</span>
            <span>Canvas LMS</span>
          </div>
        </div>
      </div>

      {/* Main School Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* School Emblem / Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-900 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-blue-950 font-serif leading-none">
                Oakridge High School
              </h1>
              <p className="text-[11px] text-slate-500 font-sans tracking-wide uppercase mt-1">
                District 42 &bull; Home of the Eagles &bull; Est. 1968
              </p>
            </div>
          </div>

          {/* Search bar & Quick Nav */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search site..."
                className="bg-slate-100 border border-slate-300 focus:border-blue-600 focus:bg-white pl-8 pr-3 py-1.5 text-xs rounded-full w-44 sm:w-60 outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </form>

            <button
              onClick={() => {}}
              className="hidden lg:flex items-center gap-1.5 bg-blue-900 text-white px-3.5 py-1.5 rounded text-xs font-semibold hover:bg-blue-800 shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Student Portal</span>
            </button>
          </div>
        </div>

        {/* School Navigation Menu */}
        <nav className="bg-slate-50 border-t border-slate-200 text-xs font-semibold text-slate-700">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 overflow-x-auto py-2.5">
            <span className="text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5 cursor-pointer">HOME</span>
            <span className="hover:text-blue-900 cursor-pointer">ABOUT US</span>
            <span className="hover:text-blue-900 cursor-pointer">ACADEMICS</span>
            <span className="hover:text-blue-900 cursor-pointer">ATHLETICS</span>
            <span className="hover:text-blue-900 cursor-pointer">ACTIVITIES & CLUBS</span>
            <span className="hover:text-blue-900 cursor-pointer">COUNSELING & GUIDANCE</span>
            <span className="hover:text-blue-900 cursor-pointer">LIBRARY MEDIA CENTER</span>
            <span className="hover:text-blue-900 cursor-pointer">CALENDAR</span>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white py-12 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">
              Academic Excellence & Community
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white">
              Inspiring Leaders, Empowering Thinkers
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Oakridge High School provides comprehensive secondary education fostering critical inquiry, competitive sportsmanship, and student preparation for higher education and career readiness.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                Regular Schedule: 8:15 AM – 3:05 PM
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded text-xs">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                Next Recess: Fall Break (Nov 24–28)
              </span>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-white text-slate-800 p-5 rounded-lg shadow-lg w-full md:w-80 border border-slate-200">
            <h3 className="font-bold text-sm text-blue-950 mb-3 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Quick Links</span>
              <Award className="w-4 h-4 text-amber-500" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <span>PowerSchool Student Login</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <span>Canvas Classroom Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <span>Daily Bell Schedules</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <span>Athletic Schedules & Rosters</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements & Bulletin */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Bulletin */}
        <div className="md:col-span-2 space-y-6">
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
            <h3 className="text-lg font-bold text-blue-950 font-serif">Daily Announcements & News</h3>
            <span className="text-xs text-slate-500">Updated Daily</span>
          </div>

          <div className="space-y-4">
            <article className="bg-white p-4 rounded border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Academics</span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">PSAT/NMSQT & SAT School Day Registration</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sophomores and Juniors planning to sit for the upcoming standardized assessment window must verify room assignments with their guidance counselor before Friday.
              </p>
              <span className="text-[10px] text-slate-400 mt-2 block">Posted: October 20, 2026 &bull; Guidance Dept</span>
            </article>

            <article className="bg-white p-4 rounded border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Athletics</span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">Varsity Cross Country & Volleyball Regional Semifinals</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tickets for this Thursday’s regional quad tournament are available through the athletic office or GoFan app. Student section admission is $3 with school ASB ID card.
              </p>
              <span className="text-[10px] text-slate-400 mt-2 block">Posted: October 21, 2026 &bull; Athletics Office</span>
            </article>

            <article className="bg-white p-4 rounded border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Student Activities</span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">Fall Drama Production Auditions: The Crucible</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Open auditions for the Fall theater production begin next Tuesday in the Performing Arts Center at 3:30 PM. Audition sides are available in Room 204.
              </p>
              <span className="text-[10px] text-slate-400 mt-2 block">Posted: October 19, 2026 &bull; Drama Club</span>
            </article>
          </div>
        </div>

        {/* Sidebar: Calendar & Contact */}
        <div className="space-y-6">
          <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
            <h3 className="font-bold text-sm text-blue-950 font-serif border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-800" />
              <span>Upcoming Dates</span>
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex gap-3">
                <div className="bg-blue-100 text-blue-900 font-bold px-2 py-1 rounded text-center shrink-0 w-12">
                  <span className="block text-[10px] uppercase">Oct</span>
                  <span className="text-sm">24</span>
                </div>
                <div>
                  <strong className="block text-slate-800">Minimum Day Schedule</strong>
                  <span className="text-slate-500 text-[11px]">Staff professional development</span>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-blue-100 text-blue-900 font-bold px-2 py-1 rounded text-center shrink-0 w-12">
                  <span className="block text-[10px] uppercase">Nov</span>
                  <span className="text-sm">03</span>
                </div>
                <div>
                  <strong className="block text-slate-800">PTSA General Meeting</strong>
                  <span className="text-slate-500 text-[11px]">7:00 PM in Library Media Center</span>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-blue-100 text-blue-900 font-bold px-2 py-1 rounded text-center shrink-0 w-12">
                  <span className="block text-[10px] uppercase">Nov</span>
                  <span className="text-sm">11</span>
                </div>
                <div>
                  <strong className="block text-slate-800">Veterans Day Observance</strong>
                  <span className="text-slate-500 text-[11px]">No classes in session</span>
                </div>
              </li>
            </ul>
          </div>

          {/* School Directory Information */}
          <div className="bg-slate-100 p-4 rounded border border-slate-200 text-xs space-y-2 text-slate-600">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Campus Information</h4>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>4500 Eagle Ridge Way, Oakridge</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Main Office: (555) 438-9200</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Attendance 24-hr: (555) 438-9201</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>info@oakridgehigh.k12.state.us</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-bold text-white">Oakridge Community High School</p>
            <p className="mt-1">Dedicated to equity, academic achievement, and student well-being.</p>
            <p className="text-slate-500 text-[10px] mt-1">
              Title IX & Section 504 Non-Discrimination Statement &bull; Student Privacy Policy &bull; District Bylaws
            </p>
          </div>
          <div className="text-slate-500 text-[10px]">
            &copy; 2026 Oakridge High School District. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
