import { ItemContent } from "../../types";
import { SVGBarcode } from "../svg";

export const RenderReceipt = ({ indoToJpn, jpnToIndo }) => {
  // 1. Logic Adaptive Layout
  const hasOutbound = indoToJpn.length > 0;
  const hasInbound = jpnToIndo.length > 0;
  const activeRouteCount = (hasOutbound ? 1 : 0) + (hasInbound ? 1 : 0);

  // Hitung max item untuk mode Dense
  const maxItems = Math.max(indoToJpn.length, jpnToIndo.length);
  const isDense = activeRouteCount === 1 ? maxItems > 10 : maxItems >= 6;

  // 2. Config Style
  const style = {
    padding: isDense ? "px-3 py-2" : "px-4 py-3",
    fontSize: isDense ? "text-[9px]" : "text-[11px]",
    badgeSize: isDense ? "text-[8px] px-1" : "text-[9px] px-1.5",
  };

  // Helper: Render "Ghost Rows" (Baris Samar) untuk ngisi tempat
  const renderGhostRows = (currentCount: number) => {
    // Jika cuma 1 rute aktif, kita targetkan 10 baris biar panjang. Kalau 2 rute, 5 baris.
    const targetRows = activeRouteCount === 1 ? 10 : 5;
    const slotsNeeded = Math.max(0, targetRows - currentCount);

    // Jangan render jika item sudah cukup banyak (biar justify-between yang handle)
    if (currentCount >= targetRows) return null;

    return Array.from({ length: slotsNeeded }).map((_, i) => (
      <div
        key={`ghost-${i}`}
        className={`flex justify-between items-center ${style.fontSize} opacity-25 select-none grayscale`}
      >
        <div className="flex gap-2 items-center">
          <span className="text-zinc-400 font-mono w-3">--</span>
          <span className="font-bold uppercase text-zinc-800">COMING SOON</span>
        </div>
        <div className="flex-1 border-b border-dotted border-zinc-300 mx-2 h-1 relative -top-1 opacity-50"></div>
        <div>
          <span className="text-zinc-500 font-bold whitespace-nowrap">TBA</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="relative z-10 w-full h-full font-mono text-zinc-800 p-2 sm:p-4 flex items-center justify-center">
      {/* KERTAS STRUK: Full Height (h-full) */}
      <div className="relative w-full h-full bg-[#fffcf5] shadow-xl flex flex-col my-2 max-w-sm mx-auto">
        {/* Pinggiran Atas (Jagged Edge) */}
        <div
          className="absolute -top-1.5 left-0 w-full h-2 bg-[#fffcf5]"
          style={{
            clipPath:
              "polygon(0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%)",
          }}
        ></div>

        {/* --- HEADER (Fixed Height) --- */}
        <div
          className={`text-center flex flex-col items-center border-b-2 border-dashed border-zinc-300 mx-3 ${style.padding} shrink-0`}
        >
          <div className="border-2 border-zinc-800 px-2 py-0.5 mb-1">
            <h1 className="font-black tracking-tight text-xl leading-none">
              NIHONG JASTIP
            </h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Official Receipt
          </p>
        </div>

        {/* --- BODY (Flex-1: Mengisi Sisa Ruang) --- */}
        <div className="flex-1 flex flex-col relative overflow-hidden px-3 py-2">
          {/* Texture Kertas */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)",
              backgroundSize: "4px 4px",
            }}
          ></div>

          {/* === SECTION 1: DEPARTURE === */}
          {hasOutbound && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-end border-b border-zinc-300 pb-1 mb-1 shrink-0">
                <span className="font-bold text-[10px] bg-zinc-200 px-1 py-0.5 rounded-sm">
                  DEPARTURE
                </span>
                <span className="text-[10px] font-bold text-zinc-500">
                  JKT &gt; OSAKA
                </span>
              </div>

              {/* Logic: Jika item < 5, pakai gap biasa (start). Jika banyak, spread (between) */}
              <div
                className={`flex-1 flex flex-col ${indoToJpn.length < 5 ? "justify-start gap-1.5" : "justify-between"} py-1`}
              >
                {indoToJpn.map((item, i) => (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center ${style.fontSize}`}
                  >
                    <div className="flex gap-2 items-center">
                      <span className="text-zinc-400 font-mono w-3">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-bold uppercase text-zinc-800">
                        {item.date}
                      </span>
                    </div>
                    <div className="flex-1 border-b border-dotted border-zinc-300 mx-2 h-1 relative -top-1 opacity-50"></div>
                    <div>
                      {item.status === "AVAILABLE" ? (
                        <span className="font-bold whitespace-nowrap">
                          {item.value} KG
                        </span>
                      ) : item.status === "LIMITED" ? (
                        <span
                          className={`font-bold bg-zinc-800 text-white whitespace-nowrap ${style.badgeSize}`}
                        >
                          LIMITED
                        </span>
                      ) : (
                        <span className="text-zinc-400 line-through whitespace-nowrap">
                          SOLD
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {renderGhostRows(indoToJpn.length)}
              </div>
            </div>
          )}

          {/* Separator Tengah (Hanya jika kedua rute ada) */}
          {hasOutbound && hasInbound && (
            <div className="border-t-2 border-dashed border-zinc-200 my-2 shrink-0"></div>
          )}

          {/* === SECTION 2: RETURN === */}
          {hasInbound && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-end border-b border-zinc-300 pb-1 mb-1 shrink-0">
                <span className="font-bold text-[10px] bg-zinc-200 px-1 py-0.5 rounded-sm">
                  RETURN
                </span>
                <span className="text-[10px] font-bold text-zinc-500">
                  OSAKA &gt; JKT
                </span>
              </div>

              <div
                className={`flex-1 flex flex-col ${jpnToIndo.length < 5 ? "justify-start gap-1.5" : "justify-between"} py-1`}
              >
                {jpnToIndo.map((item, i) => (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center ${style.fontSize}`}
                  >
                    <div className="flex gap-2 items-center">
                      <span className="text-zinc-400 font-mono w-3">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-bold uppercase text-zinc-800">
                        {item.date}
                      </span>
                    </div>
                    <div className="flex-1 border-b border-dotted border-zinc-300 mx-2 h-1 relative -top-1 opacity-50"></div>
                    <div>
                      {item.status === "AVAILABLE" ? (
                        <span className="font-bold whitespace-nowrap">
                          {item.value} KG
                        </span>
                      ) : item.status === "LIMITED" ? (
                        <span
                          className={`font-bold bg-zinc-800 text-white whitespace-nowrap ${style.badgeSize}`}
                        >
                          LIMITED
                        </span>
                      ) : (
                        <span className="text-zinc-400 line-through whitespace-nowrap">
                          SOLD
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {renderGhostRows(jpnToIndo.length)}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!hasOutbound && !hasInbound && (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs italic">
              Waiting for schedule update...
            </div>
          )}
        </div>

        {/* --- FOOTER (Fixed Height) --- */}
        <div
          className={`border-t-2 border-dashed border-zinc-300 mx-3 flex flex-col items-center shrink-0 ${style.padding}`}
        >
          <div className="flex justify-between w-full text-[10px] font-bold mb-1 px-1">
            <span>TOTAL FLIGHTS</span>
            <span>{indoToJpn.length + jpnToIndo.length}</span>
          </div>

          <div className="opacity-80 mb-1">
            <SVGBarcode className="h-8 w-40 text-zinc-900" />
          </div>

          <p className="text-[8px] text-center text-zinc-400 uppercase tracking-wider">
            Thank you for shopping
          </p>
        </div>

        {/* Pinggiran Bawah (Jagged Edge) */}
        <div
          className="absolute -bottom-1.5 left-0 w-full h-2 bg-[#fffcf5]"
          style={{
            clipPath:
              "polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)",
          }}
        ></div>
      </div>
    </div>
  );
};
