import { ItemContent } from "../../types";
import { SVGBarcode, SVGPlane } from "../svg";

export const RenderCargo = ({ indoToJpn, jpnToIndo }) => {
    // 1. Logic Adaptive Layout
    const hasOutbound = indoToJpn.length > 0;
    const hasInbound = jpnToIndo.length > 0;
    const activeRouteCount = (hasOutbound ? 1 : 0) + (hasInbound ? 1 : 0);
    
    // Hitung max item untuk mode Dense
    const maxItems = Math.max(indoToJpn.length, jpnToIndo.length);
    const isDense = activeRouteCount === 1 ? maxItems > 10 : maxItems >= 6;

    // 2. Style Config
    const style = {
        padding: isDense ? 'p-2' : 'p-3',
        titleSize: isDense ? 'text-xs' : 'text-sm',
        rowFont: isDense ? 'text-[10px]' : 'text-[11px]',
        badgeFont: isDense ? 'text-[8px] px-1' : 'text-[9px] px-1.5',
    };

    // Helper: Render "Ghost Rows" (Awaiting Cargo)
    const renderGhostRows = (currentCount: number) => {
        // Target visual agar terlihat seperti formulir manifest penuh
        const targetRows = activeRouteCount === 1 ? 10 : 5;
        const slotsNeeded = Math.max(0, targetRows - currentCount);

        if (currentCount >= targetRows) return null;

        return Array.from({ length: slotsNeeded }).map((_, i) => (
            <div key={`ghost-${i}`} className={`flex justify-between items-center py-[1px] opacity-30 select-none grayscale`}>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 font-mono w-3">--</span>
                    <span className={`font-mono font-bold text-slate-500 uppercase ${style.rowFont}`}>COMING SOON</span>
                </div>
                {/* Garis Leader Tebal (Industrial Look) */}
                <div className="flex-1 border-b-2 border-dotted border-slate-400 mx-2 h-1 relative -top-1 opacity-50"></div>
                
                <span className={`font-bold text-slate-400 border border-slate-300 bg-slate-100 rounded-sm ${style.badgeFont}`}>
                    TBA
                </span>
            </div>
        ));
    };

    return (
        <div className="relative z-10 w-full h-full p-2 sm:p-4 font-sans text-slate-800">
            
            {/* Main Container: Cargo Label Style */}
            <div className="bg-white w-full h-full rounded-lg shadow-xl overflow-hidden flex flex-col border-2 border-slate-800">
                
                {/* --- HEADER: AIR WAYBILL STYLE --- */}
                <div className="bg-slate-800 text-white flex justify-between items-center shrink-0 p-3 relative overflow-hidden">
                    <div className="z-10 flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">Logistics Partner</span>
                        <div className="flex items-center gap-2">
                            <h1 className="font-black tracking-tighter text-lg uppercase italic leading-none">NIHONG</h1>
                            <div className="bg-yellow-400 text-black text-[9px] font-bold px-1 rounded-sm transform -skew-x-12">JASTIP</div>
                        </div>
                    </div>
                    
                    {/* Icon Plane Stencil Style */}
                    <div className="border-2 border-white/20 p-1.5 rounded-md z-10">
                         <SVGPlane className="w-5 h-5 text-white" />
                    </div>

                    {/* Background Pattern (Garis Miring) */}
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px'}}></div>
                </div>

                {/* --- BODY CONTENT (Flex-1 & min-h-0) --- */}
                <div className="flex-1 flex flex-col bg-slate-50 relative min-h-0">
                    
                    {/* === SECTION 1: OUTBOUND === */}
                    {hasOutbound && (
                        <div className={`flex-1 flex flex-col border-b-2 border-dashed border-slate-300 min-h-0 ${style.padding}`}>
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1 py-0.5 rounded-sm">IDN</span>
                                    <span className="text-slate-400 text-[8px] font-bold">TO</span>
                                    <span className="bg-slate-800 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm">JPN</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold font-mono tracking-tight">PRIORITY</span>
                            </div>

                            {/* List Items (Adaptive Layout) */}
                            <div className={`flex-1 flex flex-col ${indoToJpn.length < 5 ? 'justify-start gap-1' : 'justify-between'}`}>
                                {indoToJpn.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-[1px]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-slate-400 font-mono w-3">{i+1}</span>
                                            <span className={`font-mono font-bold text-slate-700 uppercase ${style.rowFont}`}>{item.date}</span>
                                        </div>
                                        
                                        {/* Dotted Leader */}
                                        <div className="flex-1 border-b border-dotted border-slate-300 mx-2 h-1 relative -top-1 opacity-50"></div>

                                        {item.status === 'AVAILABLE' ? 
                                            <span className={`font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-sm ${style.badgeFont}`}>
                                                {item.value}KG
                                            </span> :
                                         item.status === 'LIMITED' ? 
                                            <span className={`font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-sm ${style.badgeFont}`}>
                                                LIMITED
                                            </span> :
                                            <span className="text-slate-300 text-[9px] decoration-2 line-through font-bold">FULL</span>
                                        }
                                    </div>
                                ))}
                                {renderGhostRows(indoToJpn.length)}
                            </div>
                        </div>
                    )}

                    {/* === SECTION 2: INBOUND === */}
                    {hasInbound && (
                        <div className={`flex-1 flex flex-col min-h-0 ${style.padding}`}>
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1 py-0.5 rounded-sm">JPN</span>
                                    <span className="text-slate-400 text-[8px] font-bold">TO</span>
                                    <span className="bg-orange-100 text-orange-700 text-[9px] font-bold px-1 py-0.5 rounded-sm">IDN</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold font-mono tracking-tight">STANDARD</span>
                            </div>

                            {/* List Items (Adaptive Layout) */}
                            <div className={`flex-1 flex flex-col ${jpnToIndo.length < 5 ? 'justify-start gap-1' : 'justify-between'}`}>
                                {jpnToIndo.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-[1px]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-slate-400 font-mono w-3">{i+1}</span>
                                            <span className={`font-mono font-bold text-slate-700 uppercase ${style.rowFont}`}>{item.date}</span>
                                        </div>
                                        
                                        <div className="flex-1 border-b border-dotted border-slate-300 mx-2 h-1 relative -top-1 opacity-50"></div>

                                        {item.status === 'AVAILABLE' ? 
                                            <span className={`font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-sm ${style.badgeFont}`}>
                                                {item.value}KG
                                            </span> :
                                         item.status === 'LIMITED' ? 
                                            <span className={`font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-sm ${style.badgeFont}`}>
                                                LTD
                                            </span> :
                                            <span className="text-slate-300 text-[9px] decoration-2 line-through font-bold">FULL</span>
                                        }
                                    </div>
                                ))}
                                {renderGhostRows(jpnToIndo.length)}
                            </div>
                        </div>
                    )}

                    {/* EMPTY STATE */}
                    {!hasOutbound && !hasInbound && (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic font-mono bg-slate-100 m-2 rounded border border-dashed border-slate-300">
                            [NO ACTIVE MANIFEST]
                        </div>
                    )}

                </div>

                {/* --- FOOTER: TRACKING INFO --- */}
                <div className="bg-white border-t-2 border-slate-800 p-2 flex justify-between items-center shrink-0">
                     <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Waybill Number</span>
                        <span className="text-[10px] font-black text-slate-800 font-mono tracking-tighter">NJ-{new Date().getFullYear()}-EXP</span>
                     </div>
                     {/* Barcode yang responsive */}
                     <div className="opacity-90">
                        <SVGBarcode className={`text-slate-900 ${isDense ? 'h-6 w-24' : 'h-8 w-28'}`} />
                     </div>
                </div>
            </div>
        </div>
    )
}