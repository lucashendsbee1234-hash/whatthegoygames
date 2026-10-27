import React, { useState, useEffect } from 'react';
import { 
  Printer, Undo, Redo, SpellCheck, 
  Share2, MessageSquare, Video, 
  Bold, Italic, Underline, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare,
  Link, Image as ImageIcon, CornerDownRight, 
  Lock, Star, Folder, CloudCheck,
  ChevronDown, Minus, Plus, Search,
  Eye, LogOut
} from 'lucide-react';

interface FakeGoogleDocProps {
  onExit: () => void;
  onAdminActivated?: () => void;
}

export const FakeGoogleDoc: React.FC<FakeGoogleDocProps> = ({ onExit, onAdminActivated }) => {
  const [docTitle, setDocTitle] = useState('AP World History: Trans-Saharan Trade & Songhai Empire - Draft 3');
  const [zoom, setZoom] = useState('100%');
  const [fontSize, setFontSize] = useState(11);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [adminActivated, setAdminActivated] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    setDocTitle(newTitle);
    const normalized = newTitle.toLowerCase().replace(/[\s\-_]/g, '');
    if (normalized === 'whatthegoyadminpanel' || normalized.includes('whatthegoyadminpanel')) {
      setAdminActivated(true);
      setTimeout(() => {
        onAdminActivated?.();
        onExit();
      }, 900);
    }
  };

  // Change title & favicon on mount
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${docTitle} - Google Docs`;

    // Create or update link tag for google docs favicon
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    const originalFavicon = link ? link.href : '';
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // Google docs SVG icon
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="%232684FC" d="M30 6H12a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V18L30 6z"/><path fill="%230056B3" d="M30 6v12h10L30 6z"/><path fill="%23F1F3F4" d="M16 24h16v3H16zm0 6h16v3H16zm0-12h8v3H16z"/></svg>';

    return () => {
      document.title = originalTitle;
      if (link && originalFavicon) {
        link.href = originalFavicon;
      }
    };
  }, [docTitle]);

  return (
    <div className="fixed inset-0 z-9999 bg-[#f9fbfd] text-[#1f1f1f] flex flex-col font-sans select-text overflow-hidden">
      {/* Top Google Header */}
      <header className="bg-white border-b border-[#dadce0] px-4 pt-2 pb-1 flex flex-col gap-1 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Google Docs Icon */}
            <div className="w-10 h-10 flex items-center justify-center cursor-pointer" title="Docs home">
              <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
                <path d="M30 6H12C9.79086 6 8 7.79086 8 10V38C8 40.2091 9.79086 42 12 42H36C38.2091 42 40 40.2091 40 38V18L30 6Z" fill="#2684FC"/>
                <path d="M30 6V18H40L30 6Z" fill="#0056B3"/>
                <path d="M16 23H32V25H16V23ZM16 29H32V31H16V29ZM16 35H25V37H16V35Z" fill="#FFFFFF"/>
              </svg>
            </div>

            {/* Document Title & File Menu */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Rename document..."
                  className={`font-medium text-[18px] px-1.5 py-0.5 rounded focus:outline-none w-[420px] truncate transition-colors ${
                    adminActivated 
                      ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-500 font-bold font-mono' 
                      : 'text-[#1f1f1f] hover:border hover:border-[#dadce0] focus:border-blue-500 bg-transparent'
                  }`}
                />
                <button title="Star" className="p-1 hover:bg-[#f1f3f4] rounded-full text-[#444746]">
                  <Star className="w-4 h-4" />
                </button>
                <button title="Move" className="p-1 hover:bg-[#f1f3f4] rounded-full text-[#444746]">
                  <Folder className="w-4 h-4" />
                </button>
                <div title="Document status: All changes saved to Drive" className="flex items-center gap-1 text-[11px] text-[#5f6368] ml-2">
                  <CloudCheck className="w-4 h-4 text-[#5f6368]" />
                  <span className="hidden sm:inline">Saved to Drive</span>
                </div>

                {adminActivated && (
                  <div className="ml-3 px-2 py-0.5 bg-emerald-600 text-white font-mono text-xs font-bold rounded animate-pulse shadow-md flex items-center gap-1">
                    <span>👑 WTG ADMIN ACTIVATED</span>
                  </div>
                )}
              </div>

              {/* Menu Bar */}
              <div className="flex items-center gap-1 text-[13px] text-[#444746] mt-0.5 font-normal">
                {['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help'].map((item) => (
                  <button 
                    key={item} 
                    className="px-2 py-0.5 rounded hover:bg-[#f1f3f4] cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
                <span className="text-[11px] text-[#747775] ml-3 hidden md:inline">
                  Last edit was 3 minutes ago
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#f1f3f4] rounded-full text-[#444746]" title="Open comment history">
              <MessageSquare className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-[#f1f3f4] rounded-full text-[#444746]" title="Join a call or present to call">
              <Video className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 bg-[#c2e7ff] text-[#001d35] hover:bg-[#b3defa] px-4 py-2 rounded-full font-medium text-[14px]">
              <Lock className="w-4 h-4" />
              <span>Share</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-[#1e8e3e] text-white flex items-center justify-center font-medium text-[15px] ml-1 select-none">
              L
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 bg-[#edf2fa] rounded-full px-3 py-1 my-1 text-[#444746] overflow-x-auto text-[13px]">
          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Undo (Ctrl+Z)"><Undo className="w-4 h-4" /></button>
          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Redo (Ctrl+Y)"><Redo className="w-4 h-4" /></button>
          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Print (Ctrl+P)"><Printer className="w-4 h-4" /></button>
          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Spelling and grammar check"><SpellCheck className="w-4 h-4" /></button>

          <div className="h-4 w-px bg-[#dadce0] mx-1" />

          <select 
            value={zoom} 
            onChange={(e) => setZoom(e.target.value)}
            className="bg-transparent hover:bg-[#dbe4f0] rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer focus:outline-none"
          >
            <option>75%</option>
            <option>90%</option>
            <option>100%</option>
            <option>125%</option>
            <option>150%</option>
          </select>

          <div className="h-4 w-px bg-[#dadce0] mx-1" />

          <button className="px-2 py-0.5 hover:bg-[#dbe4f0] rounded text-xs flex items-center gap-1">
            <span>Normal text</span>
            <ChevronDown className="w-3 h-3 text-[#5f6368]" />
          </button>

          <button className="px-2 py-0.5 hover:bg-[#dbe4f0] rounded text-xs flex items-center gap-1 font-serif">
            <span>Arial</span>
            <ChevronDown className="w-3 h-3 text-[#5f6368]" />
          </button>

          <div className="flex items-center border border-[#dadce0] rounded bg-white px-1">
            <button onClick={() => setFontSize(Math.max(8, fontSize - 1))} className="p-0.5 hover:bg-gray-100 rounded">
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-xs font-semibold">{fontSize}</span>
            <button onClick={() => setFontSize(fontSize + 1)} className="p-0.5 hover:bg-gray-100 rounded">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#dadce0] mx-1" />

          <button 
            onClick={() => setIsBold(!isBold)} 
            className={`p-1 rounded ${isBold ? 'bg-[#dbe4f0] font-bold' : 'hover:bg-[#dbe4f0]'}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsItalic(!isItalic)} 
            className={`p-1 rounded ${isItalic ? 'bg-[#dbe4f0] italic' : 'hover:bg-[#dbe4f0]'}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsUnderline(!isUnderline)} 
            className={`p-1 rounded ${isUnderline ? 'bg-[#dbe4f0] underline' : 'hover:bg-[#dbe4f0]'}`}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#dadce0] mx-1" />

          <button 
            onClick={() => setAlignment('left')}
            className={`p-1 rounded ${alignment === 'left' ? 'bg-[#dbe4f0]' : 'hover:bg-[#dbe4f0]'}`}
            title="Left align"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setAlignment('center')}
            className={`p-1 rounded ${alignment === 'center' ? 'bg-[#dbe4f0]' : 'hover:bg-[#dbe4f0]'}`}
            title="Center align"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setAlignment('right')}
            className={`p-1 rounded ${alignment === 'right' ? 'bg-[#dbe4f0]' : 'hover:bg-[#dbe4f0]'}`}
            title="Right align"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setAlignment('justify')}
            className={`p-1 rounded ${alignment === 'justify' ? 'bg-[#dbe4f0]' : 'hover:bg-[#dbe4f0]'}`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#dadce0] mx-1" />

          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Checklist"><CheckSquare className="w-4 h-4" /></button>
          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Bulleted list"><List className="w-4 h-4" /></button>
          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Numbered list"><ListOrdered className="w-4 h-4" /></button>

          <div className="h-4 w-px bg-[#dadce0] mx-1" />

          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Insert link"><Link className="w-4 h-4" /></button>
          <button className="p-1 hover:bg-[#dbe4f0] rounded" title="Insert image"><ImageIcon className="w-4 h-4" /></button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-[#444746] px-2 py-0.5 rounded border border-[#c4c7c5] flex items-center gap-1 bg-white">
              Editing
              <ChevronDown className="w-3 h-3 text-[#5f6368]" />
            </span>
          </div>
        </div>
      </header>

      {/* Realistic Google Docs Ruler */}
      <div className="bg-[#f9fbfd] border-b border-[#e1e3e1] h-4 flex items-center justify-center select-none overflow-hidden">
        <div className="w-[816px] h-full bg-[#edf2fa] border-x border-[#dadce0] flex items-end justify-between px-8 text-[9px] text-[#747775]">
          {[1, 2, 3, 4, 5, 6, 7].map(num => (
            <div key={num} className="flex flex-col items-center">
              <span>{num}</span>
              <div className="h-1.5 w-px bg-[#8e918f]"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Document Body */}
      <main className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#f9fbfd]">
        <div 
          className="w-[816px] min-h-[1056px] bg-white border border-[#dadce0] shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] p-[72px] text-[#1f1f1f] outline-none"
          contentEditable
          suppressContentEditableWarning
          style={{
            fontSize: `${fontSize}pt`,
            textAlign: alignment,
            lineHeight: '1.6',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold mb-2">
              The Socio-Economic Centralization and Trans-Saharan Gold-Salt Trade Networks of the Songhai Empire (1464–1591)
            </h1>
            <p className="text-sm text-gray-700 italic">
              Alex Morgan &bull; Advanced Placement World History: Modern &bull; Period 4 &bull; October 21, 2026
            </p>
          </div>

          <p className="mb-4 text-justify">
            During the fifteenth and sixteenth centuries, the Songhai Empire emerged as the preeminent political and commercial hegemon across the Western Sahel. Following the strategic expansion spearheaded by Sunni Ali Ber and the administrative institutionalization by Askia Muhammad I (Askia the Great), Songhai consolidated direct control over vital trans-Saharan mercantile conduits that bridged sub-Saharan West Africa with the Mediterranean littoral and the wider Islamic world.
          </p>

          <p className="mb-4 text-justify">
            The fundamental economic apparatus of Songhai rested upon the dual monopolies of alluvial gold originating from the southern forest regions (notably Akan and Bambuk) and rock salt extracted from the Saharan desert basins of Taghaza and Taoudenni. Salt, functioning not merely as an essential nutritional preservative but also as a standardized unit of exchange, commanded parity valuation with gold weight-for-weight in the southernmost provinces. Through rigorous fiscal extraction, including harbor tolls along the Niger River artery and caravan levies at Gao, Timbuktu, and Djenné, the imperial court amassed substantial bullion reserves capable of maintaining a professional standing cavalry and administrative bureaucracy.
          </p>

          <p className="mb-4 text-justify">
            Crucially, the commercial vitality of the empire directly stimulated intellectual and clerical developments. The University of Sankore in Timbuktu housed tens of thousands of scholastic manuscripts, facilitating trans-regional theological, legal, and astronomical discourse. Leo Africanus, traversing the region in the early sixteenth century, documented that books imported from the Maghreb frequently fetched higher monetary profits among Gao merchant guilds than all other European and Levantine luxury manufactures combined.
          </p>

          <p className="mb-4 text-justify">
            However, this excessive dependence on trans-Saharan terminus control rendered Songhai structurally vulnerable to external geopolitical shifts. By the late sixteenth century, the proliferation of European maritime shipping along the Atlantic coast diverted lucrative coastal trade away from overland caravan trails. Concurrently, Sultan Ahmad al-Mansur of the Saadi Dynasty in Morocco sought to replenish Moroccan state treasuries depleted by the Battle of Three Kings by annexing the Taghaza salt mines and seizing Songhai goldfields.
          </p>

          <p className="mb-4 text-justify">
            The catastrophic culmination of this rivalry occurred at the Battle of Tondibi in March 1591. Despite commanding superior numerical infantry, the Songhai military succumbed to Moroccan forces equipped with arquebuses and cannons. The subsequent sacking of Gao and Timbuktu shattered the unified administrative superstructure of the Western Sudan, devolving regional governance into fragmented warring chiefdoms and terminating the golden age of imperial Sahelian consolidation.
          </p>

          <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-gray-600">
            <div className="font-bold mb-1">References & Primary Sources:</div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Al-Sadi, Abd al-Rahman. <em>Tarikh al-Sudan</em> (c. 1655), translated by John O. Hunwick. Cambridge University Press.</li>
              <li>Leo Africanus. <em>The History and Description of Africa</em> (1526), edited by Robert Brown. Hakluyt Society.</li>
              <li>Levtzion, Nehemia. <em>Ancient Ghana and Mali</em>. Holmes & Meier Publishers, 1980.</li>
            </ol>
          </div>
        </div>
      </main>

      {/* Discrete bottom bar with hotkey hint and panic exit */}
      <footer className="bg-white border-t border-[#dadce0] px-4 py-1.5 flex items-center justify-between text-xs text-[#5f6368] select-none">
        <div className="flex items-center gap-3">
          <span>Page 1 of 1</span>
          <span>&bull;</span>
          <span>628 words</span>
          <span>&bull;</span>
          <span>English (US)</span>
        </div>

        {/* Secret / discrete exit buttons */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono text-[10px]">ESC</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono text-[10px]">`</kbd> to return
          </span>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-2.5 py-1 text-gray-700 hover:text-black hover:bg-gray-100 rounded text-xs font-mono transition-colors border border-transparent hover:border-gray-300"
            title="Return to whatthegoy"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Return to whatthegoy</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
