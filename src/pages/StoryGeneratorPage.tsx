import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { ScheduleItem, ThemeType } from '../types'; 
import { SVGBarcode, SVGFlagID, SVGFlagJP, SVGPlane } from '../components/svg';
import { DEFAULT_INDO_JPN, DEFAULT_JPN_INDO, THEME_BACKGROUNDS } from '../utils/constants';
import { RenderBoardingPass } from '../components/themes/TicketBoarding';
import { RenderNeonNight } from '../components/themes/NeonNight';
import { RenderPastelPlanner } from '../components/themes/PastelPlanner';
import { RenderCargo } from '../components/themes/IndustrialCargo';

const FlightBoardGenerator = () => {
  const ref = useRef<HTMLDivElement>(null);
  
  // --- STATE ---
  const [indoToJpn, setIndoToJpn] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('schedule_indo_jpn');
    return saved ? JSON.parse(saved) : DEFAULT_INDO_JPN;
  });

  const [jpnToIndo, setJpnToIndo] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('schedule_jpn_indo');
    return saved ? JSON.parse(saved) : DEFAULT_JPN_INDO;
  });

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<'INDO-JPN' | 'JPN-INDO'>('INDO-JPN');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('BOARDING');
  
  const [inputDate, setInputDate] = useState('');
  const [inputStatus, setInputStatus] = useState('AVAILABLE');
  const [inputKg, setInputKg] = useState('');
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportScale, setExportScale] = useState(3);

  // --- EFFECT ---
  useEffect(() => { localStorage.setItem('schedule_indo_jpn', JSON.stringify(indoToJpn)); }, [indoToJpn]);
  useEffect(() => { localStorage.setItem('schedule_jpn_indo', JSON.stringify(jpnToIndo)); }, [jpnToIndo]);

  // --- HANDLERS ---
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => { if (event.target?.result) setBgImage(event.target.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomBg = () => setBgImage(null);

  const handleAdd = () => {
    if (!inputDate) return;
    const newItem: ScheduleItem = {
      id: Date.now(),
      date: inputDate.toUpperCase(),
      status: inputStatus as any,
      value: inputKg
    };
    if (activeRoute === 'INDO-JPN') setIndoToJpn([...indoToJpn, newItem]);
    else setJpnToIndo([...jpnToIndo, newItem]);
    setInputDate(''); setInputKg('');
  };

  const handleDelete = (id: number, route: 'INDO-JPN' | 'JPN-INDO') => {
    if (route === 'INDO-JPN') setIndoToJpn(indoToJpn.filter(i => i.id !== id));
    else setJpnToIndo(jpnToIndo.filter(i => i.id !== id));
  };

  const handleDownload = useCallback(async () => {
    if (ref.current === null || isExporting) return;
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true, pixelRatio: exportScale, width: 360, height: 640,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      const link = document.createElement('a');
      link.download = `Jadwal-${currentTheme}-${exportScale === 3 ? 'HD' : 'SD'}.png`;
      link.href = dataUrl; link.click();
    } catch (err) { alert('Gagal download.'); } 
    finally { setIsExporting(false); }
  }, [ref, isExporting, exportScale, currentTheme]);

  return (
    <div className="min-h-screen bg-neutral-900 p-4 font-sans text-gray-100 flex flex-col md:flex-row gap-8 justify-center items-start">
      {/* --- CONTROL PANEL --- */}
      <div className="w-full md:w-96 bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl relative">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">🎛️ Control Panel</h2>

        <div className="mb-6">
            <div className="flex justify-between items-center mb-2"><p className="text-xs font-bold text-gray-400 uppercase">Select Theme</p></div>
            <div className="grid grid-cols-2 gap-2">
                {(['BOARDING', 'NEON', 'PASTEL', 'CARGO'] as ThemeType[]).map(t => (
                    <button key={t} onClick={() => setCurrentTheme(t)} className={`p-2 text-xs rounded border transition-all ${currentTheme === t ? 'bg-blue-600 border-blue-400 text-white scale-105 shadow-lg' : 'border-neutral-600 text-gray-400 hover:bg-neutral-700'}`}>
                        {t === 'BOARDING' ? '🎫 Ticket' : t === 'NEON' ? '🔮 Neon' : t === 'PASTEL' ? '🌸 Pastel' : '📦 Cargo'}
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex bg-neutral-900 p-1 rounded-lg">
             <button onClick={() => setActiveRoute('INDO-JPN')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeRoute === 'INDO-JPN' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>🇮🇩 ID → JP ({indoToJpn.length})</button>
             <button onClick={() => setActiveRoute('JPN-INDO')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeRoute === 'JPN-INDO' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>🇯🇵 JP → ID ({jpnToIndo.length})</button>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="TGL (e.g. 04 NOV)" value={inputDate} onChange={e => setInputDate(e.target.value)} className="flex-1 bg-neutral-700 border border-neutral-600 p-2.5 rounded-lg text-sm text-white outline-none uppercase"/>
            <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-bold shadow-lg">+</button>
          </div>
          <div className="flex gap-2 items-center">
             <select value={inputStatus} onChange={e => setInputStatus(e.target.value)} className="bg-neutral-700 border border-neutral-600 p-2.5 rounded-lg text-sm text-white flex-1 outline-none">
               <option value="AVAILABLE">Available</option><option value="LIMITED">Limited</option><option value="SOLD OUT">Sold Out</option>
             </select>
             {inputStatus === 'AVAILABLE' && <input type="number" placeholder="Kg" value={inputKg} onChange={e => setInputKg(e.target.value)} className="w-20 bg-neutral-700 border border-neutral-600 p-2.5 rounded-lg text-sm text-white text-center outline-none"/>}
          </div>
        </div>

        <div className="space-y-2 max-h-32 overflow-y-auto mb-6 pr-1 custom-scrollbar">
          {(activeRoute === 'INDO-JPN' ? indoToJpn : jpnToIndo).map(item => (
            <div key={item.id} className="flex justify-between items-center bg-neutral-700/50 p-2 rounded-lg border border-neutral-700">
               <span className="font-mono text-white text-xs">{item.date}</span>
               <button onClick={() => handleDelete(item.id, activeRoute)} className="text-gray-400 hover:text-red-400 p-1">✕</button>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t border-neutral-700">
           <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg border border-neutral-700">
              <span className="text-xs font-bold text-gray-400 ml-2">Export:</span>
              <div className="flex gap-1">
                 <button onClick={() => setExportScale(3)} className={`px-3 py-1 text-xs rounded font-bold ${exportScale === 3 ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>HD</button>
                 <button onClick={() => setExportScale(4)} className={`px-3 py-1 text-xs rounded font-bold ${exportScale === 4 ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>4K</button>
              </div>
           </div>
           <div className="relative group">
              <input type="file" accept="image/*" onChange={handleBgUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <button className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors ${bgImage ? 'bg-green-600 text-white border-green-500' : 'bg-neutral-700 hover:bg-neutral-600 text-white border-neutral-600'}`}>
                 {bgImage ? '✅ Custom BG Active' : 'Upload Background'}
              </button>
              {bgImage && <button onClick={handleClearCustomBg} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-20 shadow-sm hover:bg-red-600">✕</button>}
           </div>
           <button onClick={handleDownload} disabled={isExporting} className="w-full py-3 bg-white text-black rounded-xl font-bold shadow-xl hover:bg-gray-200 transition-all flex justify-center items-center gap-2 mt-2">{isExporting ? '⏳ Rendering...' : `⬇️ Download Image`}</button>
        </div>
      </div>

      {/* --- PREVIEW CANVAS --- */}
      <div className="relative shadow-2xl rounded-[30px] overflow-hidden border-4 border-neutral-800 bg-neutral-900">
        <div ref={ref} style={{ width: 360, height: 640 }} className="relative overflow-hidden select-none flex flex-col items-center justify-center bg-zinc-900">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
               {bgImage ? <img src={bgImage} alt="custom bg" className="w-full h-full object-cover opacity-100" /> : 
                 <>
                   <img src={THEME_BACKGROUNDS[currentTheme]} alt="bg" className={`w-full h-full object-cover transition-opacity duration-500 ${currentTheme === 'NEON' ? 'blur-[2px] opacity-70' : currentTheme === 'BOARDING' ? 'blur-[1px] opacity-60' : currentTheme === 'CARGO' ? 'sepia-[0.3] opacity-50' : ''}`}/>
                   <div className={`absolute inset-0 mix-blend-overlay ${currentTheme === 'NEON' ? 'bg-indigo-900/40' : currentTheme === 'BOARDING' ? 'bg-blue-500/20' : currentTheme === 'CARGO' ? 'bg-yellow-900/30' : ''}`}></div>
                 </>
               }
            </div>

            {/* Content Layer */}
            {currentTheme === 'BOARDING' && <div className="p-4 w-full h-full flex flex-col justify-center relative z-10"><RenderBoardingPass indoToJpn={indoToJpn} jpnToIndo={jpnToIndo}/></div>}
            {currentTheme === 'NEON' && <RenderNeonNight indoToJpn={indoToJpn} jpnToIndo={jpnToIndo}/>}
            {currentTheme === 'PASTEL' && <RenderPastelPlanner indoToJpn={indoToJpn} jpnToIndo={jpnToIndo}/>}
            {currentTheme === 'CARGO' && <RenderCargo indoToJpn={indoToJpn} jpnToIndo={jpnToIndo}/>}

            {/* Watermark (Except Neon) */}
            {currentTheme !== 'NEON' && <div className="absolute bottom-6 font-bold text-black/20 text-xs tracking-widest uppercase z-10 pointer-events-none mix-blend-overlay">Trusted Jastip Service</div>}
        </div>
      </div>
    </div>
  );
};

export default FlightBoardGenerator;