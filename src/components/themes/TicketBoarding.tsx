import { SVGBarcode, SVGPlane } from "../svg";

export const RenderBoardingPass = ({ indoToJpn, jpnToIndo }) => {
    // Hitung total item untuk menentukan "kepadatan"
    const totalItems = indoToJpn.length + jpnToIndo.length;

    // Logic Style Dinamis berdasarkan Total Item
    // Jika total item > 10, mode SANGAT PADAT. Jika > 6, mode PADAT.
    const getLayoutConfig = () => {
        if (totalItems >= 11) {
            return {
                headerPad: 'p-2',
                sectionPad: 'p-2',
                gap: 'gap-1',
                fontSize: 'text-[9px]',
                badgeClass: 'text-[8px] px-1 py-0',
                rowPad: 'py-0.5'
            };
        } else if (totalItems >= 7) {
            return {
                headerPad: 'p-3',
                sectionPad: 'p-3',
                gap: 'gap-1.5',
                fontSize: 'text-[11px]',
                badgeClass: 'text-[9px] px-1.5 py-[1px]',
                rowPad: 'py-1'
            };
        } else {
            return {
                headerPad: 'p-4',
                sectionPad: 'p-4',
                gap: 'gap-2',
                fontSize: 'text-sm',
                badgeClass: 'text-[10px] px-2 py-1',
                rowPad: 'py-1.5'
            };
        }
    };

    const config = getLayoutConfig();

    return (
        <div className="relative z-10 w-full bg-white rounded-xl shadow-2xl overflow-hidden text-gray-900 font-sans flex flex-col h-full border-l-4 border-blue-600">

            {/* Header */}
            <div className={`bg-blue-600 text-white flex justify-between items-center shadow-md z-20 shrink-0 ${config.headerPad}`}>
                <div>
                    <h1 className="text-lg font-black tracking-wider leading-none">FLIGHT<br />MANIFEST</h1>
                </div>
                <div className="text-right">
                    <p className="text-[9px] opacity-80 uppercase tracking-widest">Jastip Service</p>
                    <p className="text-xs font-bold font-mono">NHG-{new Date().getFullYear()}</p>
                </div>
            </div>

            {/* Content Wrapper - Menggunakan flex-1 agar mengisi sisa ruang */}
            <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                {/* ROUTE 1 (INDO-JPN) - Flex 1 */}
                <div className={`relative z-10 flex flex-col flex-1 ${config.sectionPad} pb-1`}>
                    <div className="flex items-center gap-3 mb-1 border-b-2 border-slate-200 pb-1 shrink-0">
                        <div className="flex items-center gap-1 bg-slate-200 px-2 rounded text-slate-600">
                            <span className="font-black text-xs">IDN</span>
                            <SVGPlane className="w-3 h-3 rotate-90 opacity-50" />
                            <span className="font-black text-xs">JPN</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Departure</span>
                    </div>

                    <div className={`flex flex-col flex-1 justify-start ${config.gap} overflow-hidden`}>
                        {indoToJpn.map((item, idx) => (
                            <div key={item.id} className={`flex items-center justify-between px-2 bg-white border border-slate-100 rounded shadow-sm ${config.rowPad}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-300 w-3">{idx + 1}.</span>
                                    <span className={`font-mono font-bold text-slate-700 ${config.fontSize}`}>{item.date}</span>
                                </div>
                                <div>
                                    {item.status === 'AVAILABLE' ? (
                                        <span className={`font-bold bg-blue-100 text-blue-700 rounded-sm border border-blue-200 uppercase tracking-tight ${config.badgeClass}`}>
                                            OPEN {item.value}KG
                                        </span>
                                    ) : item.status === 'LIMITED' ? (
                                        <span className={`font-bold bg-amber-50 text-amber-600 rounded-sm border border-amber-200 uppercase tracking-tight ${config.badgeClass}`}>
                                            ⚠ LIMITED
                                        </span>
                                    ) : (
                                        <span className={`font-bold text-slate-400 line-through decoration-slate-400 decoration-2 uppercase tracking-tight ${config.badgeClass}`}>
                                            SOLD OUT
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DIVIDER - Shrinkable */}
                <div className="relative h-4 w-full flex items-center justify-center shrink-0 z-10">
                    <div className="absolute left-0 -ml-2 bg-zinc-900 rounded-full w-4 h-4 shadow-inner"></div>
                    <div className="w-full border-t-2 border-dashed border-slate-300 mx-4"></div>
                    <div className="absolute right-0 -mr-2 bg-zinc-900 rounded-full w-4 h-4 shadow-inner"></div>
                </div>

                {/* ROUTE 2 (JPN-INDO) - Flex 1 */}
                <div className={`relative z-10 flex flex-col flex-1 ${config.sectionPad} pt-1`}>
                    <div className="flex items-center gap-3 mb-1 border-b-2 border-slate-200 pb-1 shrink-0">
                        <div className="flex items-center gap-1 bg-slate-200 px-2 rounded text-slate-600">
                            <span className="font-black text-xs">JPN</span>
                            <SVGPlane className="w-3 h-3 rotate-90 opacity-50" />
                            <span className="font-black text-xs">IDN</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Return</span>
                    </div>

                    <div className={`flex flex-col flex-1 justify-start ${config.gap} overflow-hidden`}>
                        {jpnToIndo.map((item, idx) => (
                            <div key={item.id} className={`flex items-center justify-between px-2 bg-white border border-slate-100 rounded shadow-sm ${config.rowPad}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-300 w-3">{idx + 1}.</span>
                                    <span className={`font-mono font-bold text-slate-700 ${config.fontSize}`}>{item.date}</span>
                                </div>
                                <div>
                                    {item.status === 'AVAILABLE' ? (
                                        <span className={`font-bold bg-blue-100 text-blue-700 rounded-sm border border-blue-200 uppercase tracking-tight ${config.badgeClass}`}>
                                            OPEN {item.value}KG
                                        </span>
                                    ) : item.status === 'LIMITED' ? (
                                        <span className={`font-bold bg-amber-50 text-amber-600 rounded-sm border border-amber-200 uppercase tracking-tight ${config.badgeClass}`}>
                                            ⚠ LIMITED
                                        </span>
                                    ) : (
                                        <span className={`font-bold text-slate-400 line-through decoration-slate-400 decoration-2 uppercase tracking-tight ${config.badgeClass}`}>
                                            SOLD OUT
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer - Shrink 0 (Fixed Height) */}
            <div className="bg-white border-t-2 border-slate-200 p-2 flex justify-between items-center z-20 shrink-0">
                <div className="flex flex-col">
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest">Boarding Pass</span>
                    <span className="text-[10px] font-bold text-slate-600">ECONOMY CLASS</span>
                </div>
                <SVGBarcode className="h-6 w-24 text-slate-800" />
            </div>
        </div>
    );
};