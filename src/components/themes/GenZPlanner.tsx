import { ItemContent } from "../../types";
import { IconsGenzPlanner } from "../svg";

export const RenderGenZPlanner = ({ indoToJpn, jpnToIndo }) => {
    // Logic Dinamis: Kepadatan Item
    const maxItems = Math.max(indoToJpn.length, jpnToIndo.length);
    const isDense = maxItems >= 6;

    // Config Style
    const style = {
        // Container
        padding: isDense ? 'p-3' : 'p-5',
        // Header
        titleSize: isDense ? 'text-4xl' : 'text-5xl',
        headerGap: isDense ? 'mb-2' : 'mb-6',
        // Content
        dateFont: isDense ? 'text-[10px]' : 'text-xs',
        badgeFont: isDense ? 'text-[9px] px-1.5' : 'text-[10px] px-2',
        cardGap: isDense ? 'gap-2' : 'gap-4',
        iconSize: isDense ? 'w-3 h-3' : 'w-4 h-4',
    };

    return (
        <div className="relative z-10 w-full h-full font-sans text-slate-800 overflow-hidden p-4 flex justify-center items-center">
            
            {/* --- Background --- */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f8f9ff] via-[#f1f5f9] to-[#eef2ff]"></div>
            
            {/* Noise Texture (Halus) */}
            <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none" 
                 style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`}}>
            </div>

            {/* Blob Gradient Blur */}
            <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-400/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-400/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            {/* --- Main Card --- */}
            <div className={`relative w-full h-full bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] flex flex-col overflow-hidden ring-1 ring-white/80 ${style.padding}`}>
                
                {/* === HEADER: TYPOGRAPHIC POSTER STYLE === */}
                <div className={`relative z-20 flex justify-between items-start ${style.headerGap}`}>
                    
                    {/* Left: Big Typography */}
                    <div className="flex flex-col relative leading-[0.85]">
                        {/* Decorative Star */}
                        <IconsGenzPlanner.Sparkle className="absolute -top-6 -left-4 w-10 h-10 text-yellow-400 fill-yellow-400 animate-spin-slow drop-shadow-sm" />
                        
                        <span className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase ml-1 mb-1">Schedule</span>
                        
                        {/* Judul: Stroke Text Effect (Tailwind doesn't have native text-stroke, simulated with drop-shadow or color) */}
                        <h1 className={`font-black tracking-tighter text-slate-900 ${style.titleSize}`}>
                            NIHONG
                        </h1>
                        <h1 className={`font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 ${style.titleSize}`}>
                            JASTIP.
                        </h1>
                    </div>

                    {/* Right: Sticker/Badge Element */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-black/10 rounded-full blur-sm transform translate-y-1"></div>
                        <div className="bg-zinc-900 text-white px-3 py-1.5 rounded-full border-2 border-white/50 shadow-lg transform rotate-[-6deg] group-hover:rotate-0 transition-transform duration-300 cursor-default">
                             <div className="flex flex-col items-center leading-none">
                                 <span className="text-[8px] tracking-widest text-zinc-400 uppercase">EDITION</span>
                                 <span className="text-sm font-black tracking-tighter text-white">JPN</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* === BODY: SPLIT CARDS === */}
                <div className={`flex-1 flex flex-col overflow-hidden ${style.cardGap}`}>
                    
                    {/* --- Card 1: OUTBOUND --- */}
                    <div className="flex-1 flex flex-col bg-white/50 rounded-2xl border border-white p-2 relative overflow-hidden group hover:bg-white/70 transition-colors">
                        {/* Section Label */}
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex items-center gap-1.5">
                                <div className="bg-blue-100 text-blue-600 p-1 rounded-md">
                                    <IconsGenzPlanner.PlaneUp className={style.iconSize} />
                                </div>
                                <span className="font-bold text-slate-700 text-[10px] tracking-wider uppercase">Jakarta <span className="text-slate-300">/</span> Osaka</span>
                            </div>
                            <div className="h-[1px] flex-1 mx-3 bg-gradient-to-r from-blue-200 to-transparent"></div>
                        </div>

                        {/* List */}
                        <div className="flex-1 flex flex-col justify-between px-1">
                            {indoToJpn.map((item: ItemContent) => (
                                <div key={item.id} className="flex items-center justify-between py-[1px]">
                                    <span className={`font-bold font-mono text-slate-600 tracking-tight ${style.dateFont}`}>{item.date}</span>
                                    
                                    {/* Dotted Line */}
                                    <div className="flex-1 mx-2 border-b border-dotted border-slate-300/60 relative top-1"></div>

                                    {item.status === 'AVAILABLE' ? 
                                        <div className={`bg-blue-50 text-blue-600 border border-blue-100 rounded-md font-bold shadow-sm ${style.badgeFont}`}>
                                            {item.value}kg
                                        </div> : 
                                     item.status === 'LIMITED' ?
                                        <div className={`bg-amber-50 text-amber-600 border border-amber-100 rounded-md font-bold ${style.badgeFont}`}>
                                            Limited
                                        </div> :
                                        <div className={`text-slate-300 line-through decoration-1 ${style.badgeFont}`}>Sold</div>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- Card 2: INBOUND --- */}
                    <div className="flex-1 flex flex-col bg-white/50 rounded-2xl border border-white p-2 relative overflow-hidden group hover:bg-white/70 transition-colors">
                         {/* Section Label */}
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex items-center gap-1.5">
                                <div className="bg-purple-100 text-purple-600 p-1 rounded-md">
                                    <IconsGenzPlanner.PlaneDown className={style.iconSize} />
                                </div>
                                <span className="font-bold text-slate-700 text-[10px] tracking-wider uppercase">Osaka <span className="text-slate-300">/</span> Jakarta</span>
                            </div>
                            <div className="h-[1px] flex-1 mx-3 bg-gradient-to-r from-purple-200 to-transparent"></div>
                        </div>

                        {/* List */}
                        <div className="flex-1 flex flex-col justify-between px-1">
                            {jpnToIndo.map((item: ItemContent) => (
                                <div key={item.id} className="flex items-center justify-between py-[1px]">
                                    <span className={`font-bold font-mono text-slate-600 tracking-tight ${style.dateFont}`}>{item.date}</span>
                                    
                                    <div className="flex-1 mx-2 border-b border-dotted border-slate-300/60 relative top-1"></div>

                                    {item.status === 'AVAILABLE' ? 
                                        <div className={`bg-purple-50 text-purple-600 border border-purple-100 rounded-md font-bold shadow-sm ${style.badgeFont}`}>
                                            {item.value}kg
                                        </div> :
                                     item.status === 'LIMITED' ?
                                        <div className={`bg-amber-50 text-amber-600 border border-amber-100 rounded-md font-bold ${style.badgeFont}`}>
                                            Limited
                                        </div> :
                                        <div className={`text-slate-300 line-through decoration-1 ${style.badgeFont}`}>Sold</div>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
                
                {/* --- Footer Marquee Effect (Static) --- */}
                <div className="mt-3 overflow-hidden whitespace-nowrap opacity-30">
                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex gap-4">
                        <span>• Secure Your Slot</span>
                        <span>• DM for Booking</span>
                        <span>• Trusted Jastip</span>
                        <span>• Japan to Indonesia</span>
                        <span>• Limited Quota</span>
                    </div>
                </div>

            </div>
        </div>
    )
}