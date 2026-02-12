import { ItemContent } from "../../types";
import { SVGBarcode, SVGPlane } from "../svg";

export const RenderCargo = ({ indoToJpn, jpnToIndo }) => {
    const getCargoStyle = (count: number) => {
        if (count >= 7) return { space: 'space-y-[1px]', font: 'text-[10px]', pad: 'p-0.5' };
        return { space: 'space-y-1', font: 'text-sm', pad: 'p-1' };
    };
    const sIndo = getCargoStyle(indoToJpn.length);
    const sJpn = getCargoStyle(jpnToIndo.length);
    const isDense = Math.max(indoToJpn.length, jpnToIndo.length) >= 6;

    return (
        <div className="relative z-10 w-full h-full p-3 font-sans flex flex-col text-black">
            <div className="border-4 border-black h-full w-full flex flex-col bg-white/95 backdrop-blur shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
                <div className={`bg-black text-yellow-400 flex justify-between items-center ${isDense ? 'p-2' : 'p-4'}`}>
                    <h1 className={`${isDense ? 'text-xl' : 'text-2xl'} font-black tracking-tighter uppercase italic`}>NIHONG JASTIP</h1>
                    {!isDense && <div className="border border-yellow-400 px-2 py-1 text-xs font-bold rounded">PRIORITY</div>}
                </div>
                <div className={`flex-1 flex flex-col ${isDense ? 'p-2 gap-2' : 'p-4 gap-4'}`}>
                    <div className="border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
                        <div className="bg-gray-200 p-1 mb-1 border-b-2 border-black flex justify-between items-center">
                            <span className="font-bold text-[10px] uppercase">IDN - JPN</span>
                            <SVGPlane className="w-3 h-3 rotate-45" />
                        </div>
                        <div className={sIndo.space}>
                            {indoToJpn.map((item: ItemContent)=> (
                                <div key={item.id} className={`flex justify-between font-mono font-bold bg-white items-center ${sIndo.pad} ${sIndo.font}`}>
                                    <span>{item.date}</span>
                                    {item.status === 'AVAILABLE' ? <span className="bg-black text-white px-1">QUOTA: {item.value}KG</span> :
                                        item.status === 'LIMITED' ? <span className="bg-yellow-400 text-black px-1 border border-black pattern-diagonal-lines-sm">LIMITED</span> :
                                            <span className="text-gray-400 line-through decoration-2 decoration-red-500">CLOSED</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
                        <div className="bg-gray-200 p-1 mb-1 border-b-2 border-black flex justify-between items-center">
                            <span className="font-bold text-[10px] uppercase">JPN - IDN</span>
                            <SVGPlane className="w-3 h-3 rotate-[225deg]" />
                        </div>
                        <div className={sJpn.space}>
                            {jpnToIndo.map((item: ItemContent)=> (
                                <div key={item.id} className={`flex justify-between font-mono font-bold bg-white items-center ${sJpn.pad} ${sJpn.font}`}>
                                    <span>{item.date}</span>
                                    {item.status === 'AVAILABLE' ? <span className="bg-black text-white px-1">QUOTA: {item.value}KG</span> :
                                        item.status === 'LIMITED' ? <span className="bg-yellow-400 text-black px-1 border border-black pattern-diagonal-lines-sm">LIMITED</span> :
                                            <span className="text-gray-400 line-through decoration-2 decoration-red-500">CLOSED</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-yellow-400 border-t-4 border-black mt-auto p-2 flex justify-between items-end">
                    <div><p className="font-black text-lg leading-none">HANDLE WITH CARE</p></div>
                    <SVGBarcode className="h-6 w-20 mix-blend-multiply" />
                </div>
            </div>
        </div>
    )
}