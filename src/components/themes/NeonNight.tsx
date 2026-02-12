import { ItemContent } from "../../types";
import { SVGBarcode } from "../svg";

export const RenderNeonNight = ({ indoToJpn, jpnToIndo }) => {
    const getNeonStyle = (count: number) => {
        if (count >= 7) return { space: 'space-y-1', font: 'text-[10px]', tag: 'text-[8px] px-1.5 py-0.5' };
        return { space: 'space-y-2', font: 'text-xs', tag: 'text-[10px] px-2 py-0.5' };
    };
    const sIndo = getNeonStyle(indoToJpn.length);
    const sJpn = getNeonStyle(jpnToIndo.length);
    const isDense = Math.max(indoToJpn.length, jpnToIndo.length) >= 6;

    return (
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-2 font-sans">
        <div className={`bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] h-full flex flex-col ${isDense ? 'p-4 gap-4' : 'p-6 gap-6'}`}>
            <div className="text-center">
                <h1 className={`${isDense ? 'text-2xl' : 'text-3xl'} font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tighter filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>NIHONG<br/>JASTIP</h1>
            </div>
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2"><div className="w-1 h-3 bg-cyan-400 shadow-[0_0_10px_cyan]"></div><h3 className="text-cyan-100 font-bold text-xs">IDN → JPN</h3></div>
                    <div className={sIndo.space}>
                        {indoToJpn.map((item: ItemContent) => (
                            <div key={item.id} className="flex justify-between items-center">
                                <span className={`text-white font-mono font-bold ${sIndo.font}`}>{item.date}</span>
                                {item.status === 'AVAILABLE' ? <span className={`font-bold text-black bg-cyan-400 rounded shadow-[0_0_10px_cyan] ${sIndo.tag}`}>OPEN {item.value}KG</span> :
                                 item.status === 'LIMITED' ? <span className={`font-bold text-black bg-yellow-400 rounded shadow-[0_0_10px_yellow] ${sIndo.tag}`}>LIMITED</span> :
                                 <span className={`font-bold text-white/30 border border-white/20 rounded ${sIndo.tag}`}>SOLD OUT</span>}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2"><div className="w-1 h-3 bg-purple-500 shadow-[0_0_10px_purple]"></div><h3 className="text-purple-100 font-bold text-xs">JPN → IDN</h3></div>
                    <div className={sJpn.space}>
                        {jpnToIndo.map((item: ItemContent) => (
                            <div key={item.id} className="flex justify-between items-center">
                                <span className={`text-white font-mono font-bold ${sJpn.font}`}>{item.date}</span>
                                {item.status === 'AVAILABLE' ? <span className={`font-bold text-black bg-purple-400 rounded shadow-[0_0_10px_purple] ${sJpn.tag}`}>OPEN {item.value}KG</span> :
                                 item.status === 'LIMITED' ? <span className={`font-bold text-black bg-yellow-400 rounded shadow-[0_0_10px_yellow] ${sJpn.tag}`}>LIMITED</span> :
                                 <span className={`font-bold text-white/30 border border-white/20 rounded ${sJpn.tag}`}>SOLD OUT</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-auto flex justify-between items-end border-t border-white/10 pt-2">
                 <SVGBarcode className="h-4 w-20 text-white/50" />
                 <span className="text-[9px] text-green-400 animate-pulse">● ONLINE</span>
            </div>
        </div>
      </div>
    );
  };