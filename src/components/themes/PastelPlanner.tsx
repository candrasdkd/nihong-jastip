  export const RenderPastelPlanner = ({ indoToJpn, jpnToIndo }) => {
    const getPastelStyle = (count: number) => {
        if (count >= 7) return { space: 'space-y-[2px]', font: 'text-[11px]', badge: 'text-[9px] px-1.5' };
        return { space: 'space-y-2', font: 'text-sm', badge: 'text-[10px] px-2' };
    };
    const sIndo = getPastelStyle(indoToJpn.length);
    const sJpn = getPastelStyle(jpnToIndo.length);
    const isDense = Math.max(indoToJpn.length, jpnToIndo.length) >= 6;

    return (
        <div className="relative z-10 w-full h-full p-3 font-serif text-gray-700">
            <div className="bg-[#fffdf5]/95 backdrop-blur-sm w-full h-full rounded-lg shadow-xl overflow-hidden relative border-l-8 border-[#e4d5b7] flex flex-col">
                 <div className={`text-center border-b-2 border-dashed border-gray-200 ${isDense ? 'p-3' : 'p-6'}`}>
                    <h1 className="text-2xl font-bold text-[#6b5b48]">Jastip Schedule ✈️</h1>
                 </div>
                 <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="bg-blue-50/80 rounded-xl border border-blue-100 p-3 flex-1">
                         <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-blue-800 bg-blue-200 px-2 rounded-full">JKT - TOKYO</span></div>
                         <ul className={sIndo.space}>
                            {indoToJpn.map(item => (
                                <li key={item.id} className={`flex items-center ${sIndo.font}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${item.status === 'AVAILABLE' ? 'bg-blue-400' : item.status === 'LIMITED' ? 'bg-orange-400' : 'bg-gray-300'}`}></div>
                                    <span className={`flex-1 ${item.status === 'SOLD OUT' ? 'line-through text-gray-400' : 'text-gray-600'}`}>{item.date}</span>
                                    {item.status === 'AVAILABLE' ? <span className={`font-bold text-blue-600 bg-white border border-blue-100 rounded-full ${sIndo.badge}`}>{item.value}kg</span> :
                                     item.status === 'LIMITED' ? <span className={`font-bold text-orange-600 bg-white border border-orange-100 rounded-full ${sIndo.badge}`}>Few Left</span> : null}
                                </li>
                            ))}
                         </ul>
                    </div>
                    <div className="bg-pink-50/80 rounded-xl border border-pink-100 p-3 flex-1">
                         <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-pink-800 bg-pink-200 px-2 rounded-full">TOKYO - JKT</span></div>
                         <ul className={sJpn.space}>
                            {jpnToIndo.map(item => (
                                <li key={item.id} className={`flex items-center ${sJpn.font}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${item.status === 'AVAILABLE' ? 'bg-pink-400' : item.status === 'LIMITED' ? 'bg-orange-400' : 'bg-gray-300'}`}></div>
                                    <span className={`flex-1 ${item.status === 'SOLD OUT' ? 'line-through text-gray-400' : 'text-gray-600'}`}>{item.date}</span>
                                    {item.status === 'AVAILABLE' ? <span className={`font-bold text-pink-600 bg-white border border-pink-100 rounded-full ${sJpn.badge}`}>{item.value}kg</span> :
                                     item.status === 'LIMITED' ? <span className={`font-bold text-orange-600 bg-white border border-orange-100 rounded-full ${sJpn.badge}`}>Few Left</span> : null}
                                </li>
                            ))}
                         </ul>
                    </div>
                 </div>
                 <div className="p-2 text-center text-[10px] text-gray-400 font-cursive italic">thank you for ordering ♡</div>
            </div>
        </div>
    )
  }
