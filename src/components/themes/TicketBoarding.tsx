import { ItemContent } from "../../types";
import { SVGBarcode, SVGPlane, SVGWorldMap } from "../svg";
export const RenderBoardingPass = ({ indoToJpn, jpnToIndo }) => {
    // 1. Config Route & Density
    const hasOutbound = indoToJpn.length > 0;
    const hasInbound = jpnToIndo.length > 0;
    const activeRouteCount = (hasOutbound ? 1 : 0) + (hasInbound ? 1 : 0);
    const maxItems = Math.max(indoToJpn.length, jpnToIndo.length);
    const isDense = activeRouteCount === 1 ? maxItems > 10 : maxItems >= 6;

    // 2. Styles
    const style = {
        header: isDense ? 'px-3 py-2' : 'px-4 py-4',
        titleSize: isDense ? 'text-lg' : 'text-2xl',
        sectionPad: isDense ? 'px-3 py-1' : 'px-5 py-3',
        itemFont: isDense ? 'text-[10px]' : 'text-xs',
        badgeFont: isDense ? 'text-[8px] px-1' : 'text-[9px] px-1.5',
    };

    // Helper: Render "Visual Filler" (Kotak Putus-Putus)
    const renderFillerSlots = (currentCount: number) => {
        // Target visual minimal agar terlihat penuh
        const targetRows = activeRouteCount === 1 ? 8 : 4; 
        const slotsNeeded = Math.max(0, targetRows - currentCount);

        if (currentCount >= targetRows) return null;

        return Array.from({ length: slotsNeeded }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center justify-between py-1.5 opacity-40 group">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-300 font-mono w-4 text-center">--</span>
                    {/* Kotak Putus-Putus */}
                    <div className="border-2 border-dashed border-slate-300 rounded px-2 py-0.5 bg-slate-50">
                        <span className={`font-mono font-bold text-slate-400 text-[10px] uppercase tracking-wider`}>COMING SOON</span>
                    </div>
                </div>
                
                {/* Garis Leader */}
                <div className="flex-1 border-b-2 border-dotted border-slate-200 mx-2 h-1 relative top-0.5 opacity-50"></div>
                
                <span className={`font-bold text-slate-300 border border-slate-200 bg-slate-50 rounded-sm ${style.badgeFont}`}>
                    TBA
                </span>
            </div>
        ));
    };

    return (
        <div className="relative z-10 w-full h-full font-sans text-slate-800 p-2">
            <div className="w-full h-full bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border border-slate-200 relative">
                
                {/* --- BACKGROUND DECORATION (Watermark Peta) --- */}
                <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <SVGWorldMap className="w-[150%] h-[150%] text-slate-100 opacity-60 rotate-12" />
                </div>
                {/* --- Noise Texture --- */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
                     style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px'}}>
                </div>

                {/* --- HEADER --- */}
                <div className={`bg-blue-700 text-white flex justify-between items-center shrink-0 z-20 shadow-md relative overflow-hidden ${style.header}`}>
                    <div className="flex flex-col z-10">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="bg-white/20 px-1 rounded text-[8px] font-bold tracking-wider">INTL</span>
                            <span className="text-blue-200 font-bold tracking-[0.2em] text-[8px] uppercase">Logistics</span>
                        </div>
                        <h1 className={`font-black tracking-widest leading-none italic uppercase drop-shadow-sm ${style.titleSize}`}>
                            Nihong<span className="text-blue-300">Jastip</span>
                        </h1>
                    </div>
                    <div className="z-10 text-right">
                        <div className={`bg-blue-800/50 border border-blue-400/30 backdrop-blur-md rounded flex flex-col items-center justify-center ${isDense ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
                             <span className="text-[8px] text-blue-200 font-mono uppercase">CLASS</span>
                             <span className="font-bold text-white tracking-widest text-[10px]">PRIORITY</span>
                        </div>
                    </div>
                    {/* Hiasan Pesawat Besar Transparan */}
                    <SVGPlane className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-5 -rotate-12 pointer-events-none" />
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 flex flex-col relative z-10 min-h-0">

                    {/* === SECTION 1: DEPARTURE === */}
                    {hasOutbound && (
                        <div className={`flex-1 flex flex-col min-h-0 ${style.sectionPad} relative`}>
                            <div className="flex items-center justify-between border-b-2 border-slate-200 shrink-0 mb-2 pb-1 relative z-10">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <div className="bg-slate-100 border border-slate-300 px-1.5 rounded text-xs font-black tracking-tighter">JKT</div>
                                    <SVGPlane className="w-3 h-3 text-blue-500 rotate-90" />
                                    <div className="bg-slate-100 border border-slate-300 px-1.5 rounded text-xs font-black tracking-tighter">JPN</div>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-1 rounded">Outbound</span>
                            </div>

                            <div className={`flex-1 flex flex-col overflow-hidden relative z-10 ${indoToJpn.length < 5 ? 'justify-start gap-1' : 'justify-between'}`}>
                                {indoToJpn.map((item, i) => (
                                    <div key={item.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 py-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-mono font-bold text-slate-400 w-3">{i+1}</span>
                                            <span className={`font-mono font-bold text-slate-700 ${style.itemFont}`}>{item.date}</span>
                                        </div>
                                        
                                        <div className="flex-1 border-b border-dotted border-slate-300 mx-2 h-1 relative top-1 opacity-60"></div>

                                        {item.status === 'AVAILABLE' ? 
                                            <span className={`font-bold bg-blue-50 text-blue-700 rounded border border-blue-200 shadow-sm ${style.badgeFont}`}>
                                                OPEN {item.value}KG
                                            </span> : 
                                         item.status === 'LIMITED' ?
                                            <span className={`font-bold bg-amber-50 text-amber-700 rounded border border-amber-200 ${style.badgeFont}`}>
                                                LIMITED
                                            </span> :
                                            <span className="text-slate-300 text-[8px] line-through font-bold decoration-2">SOLD OUT</span>
                                        }
                                    </div>
                                ))}
                                {renderFillerSlots(indoToJpn.length)}
                            </div>
                        </div>
                    )}

                    {/* === TEAR LINE === */}
                    {hasOutbound && hasInbound && (
                        <div className="relative flex items-center w-full h-4 shrink-0 bg-white z-20">
                            <div className="absolute left-[-8px] w-4 h-4 bg-[#0f1115] rounded-full z-20"></div> 
                            <div className="w-full border-t-2 border-dashed border-slate-300 mx-3"></div>
                            <div className="absolute right-[-8px] w-4 h-4 bg-[#0f1115] rounded-full z-20"></div>
                        </div>
                    )}

                    {/* === SECTION 2: RETURN === */}
                    {hasInbound && (
                        <div className={`flex-1 flex flex-col min-h-0 ${style.sectionPad} relative`}>
                             <div className="flex items-center justify-between border-b-2 border-slate-200 shrink-0 mb-2 pb-1 relative z-10">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <div className="bg-slate-100 border border-slate-300 px-1.5 rounded text-xs font-black tracking-tighter">JPN</div>
                                    <SVGPlane className="w-3 h-3 text-orange-500 rotate-90" />
                                    <div className="bg-slate-100 border border-slate-300 px-1.5 rounded text-xs font-black tracking-tighter">JKT</div>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-1 rounded">Inbound</span>
                            </div>

                            <div className={`flex-1 flex flex-col overflow-hidden relative z-10 ${jpnToIndo.length < 5 ? 'justify-start gap-1' : 'justify-between'}`}>
                                {jpnToIndo.map((item, i) => (
                                    <div key={item.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 py-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-mono font-bold text-slate-400 w-3">{i+1}</span>
                                            <span className={`font-mono font-bold text-slate-700 ${style.itemFont}`}>{item.date}</span>
                                        </div>
                                        
                                        <div className="flex-1 border-b border-dotted border-slate-300 mx-2 h-1 relative top-1 opacity-60"></div>

                                        {item.status === 'AVAILABLE' ? 
                                            <span className={`font-bold bg-blue-50 text-blue-700 rounded border border-blue-200 shadow-sm ${style.badgeFont}`}>
                                                OPEN {item.value}KG
                                            </span> : 
                                         item.status === 'LIMITED' ?
                                            <span className={`font-bold bg-amber-50 text-amber-700 rounded border border-amber-200 ${style.badgeFont}`}>
                                                LIMITED
                                            </span> :
                                            <span className="text-slate-300 text-[8px] line-through font-bold decoration-2">SOLD OUT</span>
                                        }
                                    </div>
                                ))}
                                {renderFillerSlots(jpnToIndo.length)}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FOOTER: MORE INFO --- */}
                <div className={`bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 z-10 ${isDense ? 'p-2' : 'p-3'}`}>
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Gate</span>
                            <span className="text-[10px] font-bold text-slate-700 font-mono">Express</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Seat</span>
                            <span className="text-[10px] font-bold text-slate-700 font-mono">VIP</span>
                        </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Baggage</span>
                            <span className="text-[10px] font-bold text-slate-700 font-mono">∞</span>
                        </div>
                    </div>
                    <div className="opacity-80">
                        <SVGBarcode className={`text-slate-800 ${isDense ? 'h-6 w-20' : 'h-8 w-28'}`} />
                    </div>
                </div>
            </div>
        </div>
    )
}