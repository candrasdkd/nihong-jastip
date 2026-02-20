import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { login } from "../services/authFirebase";
import logo from "../assets/nihong.png";

/* =========================
🌸 Sakura Petal (Improved Physics)
========================= */
function SakuraPetal({ delay }: { delay: number }) {
  const randomX = Math.random() * 100;
  return (
    <motion.div
      initial={{ y: -20, x: `${randomX}vw`, rotate: 0, opacity: 0 }}
      animate={{
        y: "110vh",
        x: [`${randomX}vw`, `${randomX - 10}vw`, `${randomX + 10}vw`],
        rotate: 720,
        opacity: [0, 0.6, 0.6, 0],
      }}
      transition={{
        duration: 12 + Math.random() * 10,
        repeat: Infinity,
        delay,
        ease: "linear",
      }}
      className="absolute pointer-events-none"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="#fbcfe8"
        className="drop-shadow-sm"
      >
        <path d="M12 2c2 3 4 3 6 4-1 2-1 4-3 6 2 1 3 3 3 5-2 1-4 1-6-1-1 2-3 2-6 1 0-2 1-4 3-5-2-2-2-4-3-6 2-1 4-1 6-4z" />
      </svg>
    </motion.div>
  );
}

/* =========================
⛩️ Nihon Input (Custom Component)
========================= */
const NihonInput = ({ label, type, value, onChange }: any) => (
  <div className="relative group mb-6">
    <input
      type={type}
      value={value}
      onChange={onChange}
      required
      className="w-full bg-transparent border-b-2 border-neutral-200 py-3 pt-6 outline-none focus:border-red-500 transition-all duration-500 peer"
      placeholder=" "
    />
    <label className="absolute left-0 top-6 text-neutral-400 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 pointer-events-none peer-focus:top-0 peer-focus:text-red-500 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[10px]">
      {label}
    </label>
    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-red-500 transition-all duration-500 group-focus-within:w-full" />
  </div>
);

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  // Parallax Effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setTransitioning(true);
      setTimeout(async () => {
        try {
          await login(email, password);
        } catch (err) {
          setError("Invalid Credentials");
          setTransitioning(false);
          setLoading(false);
        }
      }, 1000);
    } catch (err) {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#faf9f6] selection:bg-red-100">
      {/* Dynamic Background & Sakura (Sama seperti sebelumnya) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{ x: mousePos.x, y: mousePos.y }}
          className="absolute inset-0 flex items-center justify-center opacity-[0.03]"
        >
          <span className="text-[50vw] font-serif font-bold">和</span>
        </motion.div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <SakuraPetal key={i} delay={i * 0.8} />
        ))}
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-full max-w-[420px] px-6"
      >
        <div className="bg-white/70 backdrop-blur-2xl p-10 md:p-14 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-white/50 relative">
          <div className="absolute top-10 right-10 w-8 h-8 border-2 border-red-600/20 rounded flex items-center justify-center text-[10px] text-red-600/30 font-bold rotate-12">
            日本
          </div>

          <header className="flex flex-col items-center mb-12">
            <motion.div whileHover={{ scale: 1.05 }} className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full" />
              <img
                src={logo}
                alt="Logo"
                className="relative h-16 w-16 object-contain"
              />
            </motion.div>

            <h1 className="text-3xl font-serif text-neutral-800 tracking-tight mb-2">
              Nihong <span className="text-red-600 font-light">Jastip</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-8 bg-neutral-200" />
              <span className="text-[9px] text-neutral-400 font-black uppercase tracking-[0.4em]">
                Authorized Admin
              </span>
              <div className="h-[1px] w-8 bg-neutral-200" />
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-2">
            <NihonInput
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
            />
            <NihonInput
              label="Password"
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />

            {error && (
              <p className="text-[11px] text-red-500 font-medium text-center pb-4">
                {error}
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "#000" }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold text-xs tracking-[0.2em] transition-all shadow-xl shadow-black/10 disabled:opacity-50 mt-4"
            >
              {loading ? "VERIFYING..." : "ENTER THE GATE"}
            </motion.button>
          </form>
        </div>
      </motion.div>

      <ShojiTransition active={transitioning} />
    </div>
  );
}

/* =========================
🚪 Shoji Door (Enhanced with Wood Texture)
========================= */
function ShojiTransition({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div className="fixed inset-0 z-[100] flex">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              initial={{ x: i === 0 ? "-100%" : "100%" }}
              animate={{ x: "0%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
              className={`w-1/2 h-full bg-[#faf9f6] border-${i === 0 ? "r-8" : "l-8"} border-[#2c2c2c] relative`}
            >
              {/* Shoji Paper Texture */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url('https://www.transparenttextures.com/patterns/natural-paper.png')`,
                }}
              />

              {/* Grid Lines */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                     linear-gradient(to right, #2c2c2c 1px, transparent 1px),
                     linear-gradient(to bottom, #2c2c2c 1px, transparent 1px)`,
                  backgroundSize: "60px 80px",
                  opacity: 0.08,
                }}
              />

              {/* Handle Area */}
              <div
                className={`absolute top-1/2 ${i === 0 ? "right-4" : "left-4"} -translate-y-1/2 w-12 h-40 bg-[#2c2c2c] rounded-sm shadow-2xl flex items-center justify-center`}
              >
                <div className="w-[1px] h-20 bg-white/20" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
