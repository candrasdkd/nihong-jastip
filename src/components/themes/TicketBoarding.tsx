import { ItemContent } from "../../types";
import { SVGBarcode, SVGPlane } from "../svg";

export const RenderBoardingPass = ({ indoToJpn, jpnToIndo }) => {
    // Deteksi Kepadatan
    const maxCount = Math.max(indoToJpn.length, jpnToIndo.length);
    const isDense = maxCount >= 6;

    // Config style berdasarkan kepadatan agar tidak overflow
    const style = {
        header: isDense ? 'px-3 py-2' : 'px-4 py-3',
        titleSize: isDense ? 'text-lg' : 'text-2xl',
        sectionPad: isDense ? 'px-3 py-1' : 'px-4 py-2',
        itemFont: isDense ? 'text-[10px]' : 'text-xs',
        badgeFont: isDense ? 'text-[8px] px-1' : 'text-[9px] px-1.5',
    };

    return (
        <div className="relative z-10 w-full h-full font-sans text-slate-800 p-2">
            {/* Main Container: Full Height & Hidden Overflow is MANDATORY */}
            <div className="w-full h-full bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
                
                {/* --- HEADER (Shrinkable) --- */}
                <div className={`bg-blue-700 text-white flex justify-between items-center shrink-0 z-20 shadow-md ${style.header}`}>
                    <div className="flex flex-col z-10">
                        <span className={`text-blue-200 font-bold tracking-[0.2em] uppercase ${isDense ? 'text-[8px] mb-0' : 'text-[10px] mb-0.5'}`}>
                            Official Logistics
                        </span>
                        <h1 className={`font-black tracking-widest leading-none italic uppercase drop-shadow-sm ${style.titleSize}`}>
                            Nihong<span className="text-blue-300">Jastip</span>
                        </h1>
                    </div>
                    
                    <div className="z-10 text-right">
                        <div className={`bg-white/10 border border-white/20 backdrop-blur-md rounded ${isDense ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
                             <p className={`font-bold tracking-widest text-white uppercase flex items-center gap-1 ${isDense ? 'text-[8px]' : 'text-[9px]'}`}>
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                Priority
                             </p>
                        </div>
                    </div>
                    
                    {/* Watermark Pesawat */}
                    <SVGPlane className="absolute right-[-15px] top-[-15px] w-24 h-24 text-white opacity-5 rotate-12 pointer-events-none" />
                </div>

                {/* --- BODY (Flex-1 + min-h-0 AGAR TIDAK LEWAT BATAS) --- */}
                <div className="flex-1 flex flex-col bg-slate-50 relative min-h-0">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                         style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '12px 12px'}}>
                    </div>

                    {/* === SECTION 1: DEPARTURE === */}
                    <div className={`flex-1 flex flex-col min-h-0 ${style.sectionPad}`}>
                        {/* Route Label */}
                        <div className="flex items-center justify-between border-b border-dashed border-slate-300 shrink-0 mb-1 pb-1">
                            <div className="flex items-center gap-2 text-slate-700">
                                <span className="text-xs font-black tracking-tight bg-slate-200 px-1 rounded">JKT</span>
                                <SVGPlane className="w-3 h-3 text-blue-500 rotate-90" />
                                <span className="text-xs font-black tracking-tight bg-slate-200 px-1 rounded">JPN</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Outbound</span>
                        </div>

                        {/* List Items: Gunakan flex-1 & justify-between agar pas memenuhi ruang */}
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                            {indoToJpn.map((item: ItemContent, i: number) => (
                                <div key={item.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 py-[1px]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-slate-300 font-mono w-3">{i+1}</span>
                                        <span className={`font-mono font-bold text-slate-600 ${style.itemFont}`}>{item.date}</span>
                                    </div>
                                    
                                    {item.status === 'AVAILABLE' ? 
                                        <span className={`font-bold bg-blue-100 text-blue-700 rounded-sm border border-blue-200 ${style.badgeFont}`}>
                                            OPEN {item.value}KG
                                        </span> : 
                                     item.status === 'LIMITED' ?
                                        <span className={`font-bold bg-amber-100 text-amber-700 rounded-sm border border-amber-200 ${style.badgeFont}`}>
                                            LIMITED
                                        </span> :
                                        <span className="text-slate-300 text-[8px] line-through font-bold decoration-2">SOLD</span>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* === TEAR LINE === */}
                    <div className="relative flex items-center w-full h-3 shrink-0 bg-slate-50">
                        <div className="absolute left-[-6px] w-3 h-3 bg-white rounded-full border-r border-slate-200 shadow-sm z-10"></div>
                        <div className="w-full border-t-2 border-dashed border-slate-300 mx-2"></div>
                        <div className="absolute right-[-6px] w-3 h-3 bg-white rounded-full border-l border-slate-200 shadow-sm z-10"></div>
                    </div>

                    {/* === SECTION 2: RETURN === */}
                    <div className={`flex-1 flex flex-col min-h-0 ${style.sectionPad}`}>
                         <div className="flex items-center justify-between border-b border-dashed border-slate-300 shrink-0 mb-1 pb-1">
                            <div className="flex items-center gap-2 text-slate-700">
                                <span className="text-xs font-black tracking-tight bg-slate-200 px-1 rounded">JPN</span>
                                <SVGPlane className="w-3 h-3 text-orange-500 rotate-90" />
                                <span className="text-xs font-black tracking-tight bg-slate-200 px-1 rounded">JKT</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Inbound</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                            {jpnToIndo.map((item: ItemContent, i: number) => (
                                <div key={item.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 py-[1px]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-slate-300 font-mono w-3">{i+1}</span>
                                        <span className={`font-mono font-bold text-slate-600 ${style.itemFont}`}>{item.date}</span>
                                    </div>
                                    
                                    {item.status === 'AVAILABLE' ? 
                                        <span className={`font-bold bg-blue-100 text-blue-700 rounded-sm border border-blue-200 ${style.badgeFont}`}>
                                            OPEN {item.value}KG
                                        </span> : 
                                     item.status === 'LIMITED' ?
                                        <span className={`font-bold bg-amber-100 text-amber-700 rounded-sm border border-amber-200 ${style.badgeFont}`}>
                                            LIMITED
                                        </span> :
                                        <span className="text-slate-300 text-[8px] line-through font-bold decoration-2">SOLD</span>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- FOOTER (Fixed) --- */}
                <div className={`bg-white border-t border-slate-200 flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 ${isDense ? 'p-2' : 'p-3'}`}>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">Service</span>
                        <span className="text-[9px] font-bold text-slate-700 font-mono">EXECUTIVE CARGO</span>
                    </div>
                    <div className="opacity-70 mix-blend-multiply">
                        <SVGBarcode className={`text-slate-800 ${isDense ? 'h-6 w-20' : 'h-7 w-24'}`} />
                    </div>
                </div>
            </div>
        </div>
    )
}