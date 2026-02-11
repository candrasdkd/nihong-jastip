import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Plus, Package, Calendar, Trash2, Edit3, CheckCircle2, Circle, X,
  Search, SortAsc, SortDesc, ListPlus, Send,
  LayoutGrid, ClipboardList, Loader2, SearchX, ExternalLink, User,
  CheckCircle, Clock, Share2, Copy
} from "lucide-react";
import { formatAndAddYear } from "../utils/helpers";
import { BG } from "../utils/constants";

// --- TYPES ---
type PurchaseItem = {
  id: string;
  name: string;
  quantity: string;
  pic: string;
  customer: string;
  platform?: string;
  link?: string;
  note?: string;
  shippingDate: string;
  isDone: boolean;
};

type ShareConfig = {
  date: string;
  pic: string;
  status: "all" | "pending" | "done";
};

// --- CONSTANTS ---
const PIC_OPTIONS = ["Diny", "Mizwar", "Zakiya", "Yua", "Candra"];
const PLATFORM_OPTIONS = ["Shopee", "Tokopedia", "TikTok", "Manual"];

// --- COMPONENTS ---
const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) => (
  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 flex-1 min-w-[120px]">
    <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      <Icon size={20} className={color.replace("bg-", "text-")} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

export default function PurchasesPage() {
  // --- STATE ---
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "done" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [editing, setEditing] = useState<PurchaseItem | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "draft">("input");

  // Form State
  const emptyForm = { name: "", quantity: "", pic: "", customer: "", platform: "", link: "", note: "", shippingDate: "", isDone: false };
  const [form, setForm] = useState(emptyForm);
  const [drafts, setDrafts] = useState<Omit<PurchaseItem, 'id'>[]>([]);

  // Share Config State
  const [shareConfig, setShareConfig] = useState<ShareConfig>({
    date: "",
    pic: "",
    status: "all"
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // --- EFFECT ---
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "purchases"), orderBy("shippingDate", sortOrder));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as PurchaseItem[];
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [sortOrder]);

  // --- ACTIONS ---
  const addToDraft = () => {
    if (!form.name || !form.pic || !form.shippingDate || !form.customer) return;
    setDrafts(prev => [...prev, { ...form }]);
    setForm(prev => ({
      ...emptyForm,
      pic: prev.pic,
      shippingDate: prev.shippingDate,
      customer: prev.customer,
      platform: prev.platform
    }));
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleSaveAll = async () => {
    setIsProcessing(true);
    try {
      if (editing) {
        // @ts-ignore
        await updateDoc(doc(db, "purchases", editing.id), form);
      } else if (drafts.length > 0) {
        const batch = writeBatch(db);
        drafts.forEach((d) => {
          const newRef = doc(collection(db, "purchases"));
          batch.set(newRef, d);
        });
        await batch.commit();
      }
      closeModal();
    } catch (e) {
      console.error("Error saving:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus item ini?")) return;
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "purchases", id));
    } catch (e) { console.error(e) }
    finally { setIsProcessing(false); }
  };

  const toggleDone = async (item: PurchaseItem) => {
    try {
      await updateDoc(doc(db, "purchases", item.id), { isDone: !item.isDone });
    } catch (e) { console.error(e); }
  };

  const openPlatformLink = (url?: string) => {
    if (!url) return;
    const validUrl = url.startsWith("http") ? url : `https://${url}`;
    window.open(validUrl, "_blank", "noopener,noreferrer");
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setDrafts([]);
    setActiveTab("input");
  };

  // --- DATA PROCESSING ---
  const processedItems = useMemo(() => {
    let result = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.pic.toLowerCase().includes(q) ||
        i.customer.toLowerCase().includes(q)
      );
    }
    if (filter === "done") result = result.filter(i => i.isDone);
    if (filter === "pending") result = result.filter(i => !i.isDone);
    return result;
  }, [items, filter, searchQuery]);

  const grouped = useMemo(() => {
    const map: Record<string, {
      total: number;
      done: number;
      pics: Record<string, Record<string, PurchaseItem[]>>
    }> = {};

    processedItems.forEach((item) => {
      const dateKey = item.shippingDate || "Tanpa Tanggal";
      const picKey = item.pic || "Tanpa PIC";
      const custKey = item.customer || "Tanpa Customer";

      if (!map[dateKey]) map[dateKey] = { total: 0, done: 0, pics: {} };
      if (!map[dateKey].pics[picKey]) map[dateKey].pics[picKey] = {};
      if (!map[dateKey].pics[picKey][custKey]) map[dateKey].pics[picKey][custKey] = [];

      map[dateKey].pics[picKey][custKey].push(item);
      map[dateKey].total++;
      if (item.isDone) map[dateKey].done++;
    });

    return map;
  }, [processedItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter(i => i.isDone).length;
    return { total, done, pending: total - done };
  }, [items]);

  // --- SHARE LOGIC ---
  const uniqueDates = useMemo(() => [...new Set(items.map(i => i.shippingDate))].sort(), [items]);
  const uniquePics = useMemo(() => {
      if(!shareConfig.date) return PIC_OPTIONS;
      return [...new Set(items.filter(i => i.shippingDate === shareConfig.date).map(i => i.pic))];
  }, [items, shareConfig.date]);

  const generateShareText = () => {
    const filteredForShare = items.filter(i => {
      const matchDate = shareConfig.date ? i.shippingDate === shareConfig.date : true;
      const matchPic = shareConfig.pic ? i.pic === shareConfig.pic : true;
      const matchStatus = 
        shareConfig.status === "all" ? true :
        shareConfig.status === "done" ? i.isDone :
        !i.isDone;
      return matchDate && matchPic && matchStatus;
    });

    if (filteredForShare.length === 0) return "Tidak ada data untuk filter ini.";

    // 1. Group by Customer (Normalized for Sorting)
    const groupedByCustomer: Record<string, PurchaseItem[]> = {};
    filteredForShare.forEach(i => {
      const custName = i.customer.trim().toUpperCase();
      if(!groupedByCustomer[custName]) groupedByCustomer[custName] = [];
      groupedByCustomer[custName].push(i);
    });

    // 2. Sort Customer Names (A-Z)
    const sortedCustomers = Object.keys(groupedByCustomer).sort();

    // 3. Build Text
    let text = `📦 *LAPORAN JASTIP*\n`;
    if(shareConfig.date) text += `🗓 Tanggal: ${formatAndAddYear(shareConfig.date)}\n`;
    if(shareConfig.pic) text += `👤 PIC: ${shareConfig.pic}\n`;
    text += `📊 Status: ${shareConfig.status === 'all' ? 'SEMUA' : shareConfig.status === 'done' ? 'SELESAI' : 'PENDING'}\n`;
    text += `---------------------------\n`;

    sortedCustomers.forEach(customer => {
      text += `\n👤 *${customer}*\n`;
      
      // Sort Items per Customer (A-Z)
      const customerItems = groupedByCustomer[customer].sort((a, b) => a.name.localeCompare(b.name));

      customerItems.forEach(item => {
        const check = item.isDone ? "✅" : "⬜";
        text += `${check} ${item.name} (${item.quantity})`;
        if(item.note) text += `\n   └ _Note: ${item.note}_`;
        text += `\n`;
      });
    });

    text += `\n---------------------------\n`;
    text += `Total: ${filteredForShare.length} Item\n`;
    return text;
  };

  const handleSendWhatsapp = () => {
    const text = generateShareText();
    // Gunakan API URL yang lebih robust untuk encoding emoji
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setIsShareOpen(false);
  };

  return (
    <div
      className="relative min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        backgroundColor: BG,
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
      }}
    >
      {/* --- LOADING OVERLAY --- */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/50 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-slate-100">
              <Loader2 className="animate-spin text-orange-500" size={24} />
              <span className="text-sm font-bold uppercase tracking-widest text-slate-600">Menyimpan...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="max-w-5xl mx-auto space-y-6">

        {/* --- HEADER & STATS --- */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Jastip Tracker</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola pesanan dan pengiriman.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatCard label="Total Item" value={stats.total} icon={Package} color="bg-blue-100" />
            <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-orange-100" />
            <StatCard label="Selesai" value={stats.done} icon={CheckCircle} color="bg-green-100" />
          </div>
        </div>

        {/* --- CONTROLS --- */}
        <div className="top-2 z-10 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari..."
              className="w-full pl-10 pr-4 py-2.5 bg-transparent text-base sm:text-sm outline-none font-medium placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pl-0 sm:pl-2 pt-2 sm:pt-0 overflow-x-auto no-scrollbar">
            {/* BUTTON SHARE WHATSAPP */}
            <button 
              onClick={() => {
                const defaultDate = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : "";
                setShareConfig({ date: defaultDate, pic: "", status: "all" });
                setIsShareOpen(true);
              }}
              className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors flex items-center gap-2"
              title="Share WhatsApp"
            >
              <Share2 size={18} />
              <span className="text-xs font-bold hidden sm:inline">SHARE</span>
            </button>
            
            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
              {sortOrder === "asc" ? <SortAsc size={18} /> : <SortDesc size={18} />}
            </button>
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              {(["all", "pending", "done"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- CONTENT LIST --- */}
        <div className="space-y-8 pb-24">
          {loading ? (
            <div className="space-y-4 pt-8 text-center">
              <Loader2 className="animate-spin text-orange-500 mx-auto" size={32} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Data...</p>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
              <SearchX size={64} className="text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tidak ditemukan data</h3>
            </div>
          ) : (
            Object.entries(grouped).map(([date, data]) => {
              const progress = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;

              return (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={date}
                  className="relative"
                >
                  {/* Date Header */}
                  <div className="flex items-end justify-between mb-4 sticky top-28 sm:top-16 z-20 bg-gradient-to-b from-[#f8f9fa] via-[#f8f9fa] to-transparent pb-3 pt-4 -mx-2 px-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-orange-500 text-white p-2 rounded-lg shadow-lg shadow-orange-200">
                        <Calendar size={16} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                          {formatAndAddYear(date)}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                          {data.done} / {data.total} SELESAI
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-300/80">{progress}%</span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="absolute left-[17px] top-12 bottom-0 w-0.5 bg-slate-300/50 rounded-full -z-10" />

                  {/* Groups */}
                  <div className="space-y-6 pl-10">
                    {Object.entries(data.pics).map(([pic, customerMap]) => (
                      <div key={pic} className="relative">
                        {/* PIC Badge */}
                        <div className="absolute -left-[45px] top-0 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-slate-400 rounded-full ring-4 ring-[#f8f9fa]" />
                        </div>

                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest shadow-md">
                            PIC: {pic}
                          </span>
                        </div>

                        <div className="space-y-4">
                          {Object.entries(customerMap).map(([customer, list]) => (
                            <div key={customer} className="bg-white/60 backdrop-blur-[2px] rounded-2xl p-2 border border-dashed border-slate-300">
                              <div className="flex items-center gap-2 mb-2 ml-1 mt-1">
                                <User size={14} className="text-orange-500" />
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{customer}</span>
                                <div className="h-px bg-slate-200 flex-1 ml-2" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {list.map((item) => (
                                  <div
                                    key={item.id}
                                    className={`
                                        group relative p-3.5 rounded-xl border transition-all duration-200
                                        ${item.isDone
                                        ? 'bg-slate-50 border-slate-100 opacity-60 grayscale-[0.8] hover:grayscale-0'
                                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-orange-200'
                                      }
                                      `}
                                  >
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => toggleDone(item)}
                                        className="mt-0.5 shrink-0 transition-transform active:scale-90"
                                      >
                                        {item.isDone
                                          ? <CheckCircle2 size={22} className="text-green-500" />
                                          : <Circle size={22} className="text-slate-300 group-hover:text-orange-400 transition-colors" />
                                        }
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                          <h4 className={`font-bold text-sm leading-tight ${item.isDone ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"}`}>
                                            {item.name}
                                          </h4>
                                          {item.link && (
                                            <button onClick={() => openPlatformLink(item.link)} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded">
                                              <ExternalLink size={12} />
                                            </button>
                                          )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                          <span className="text-[11px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                            {item.quantity}
                                          </span>
                                          {item.platform && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wide">
                                              {item.platform}
                                            </span>
                                          )}
                                        </div>

                                        {item.note && (
                                          <p className="mt-2 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                                            "{item.note}"
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          setEditing(item);
                                          setForm({
                                            name: item.name,
                                            quantity: item.quantity,
                                            pic: item.pic,
                                            customer: item.customer,
                                            shippingDate: item.shippingDate,
                                            isDone: item.isDone,
                                            platform: item.platform || "",
                                            link: item.link || "",
                                            note: item.note || ""
                                          });
                                          setIsOpen(true);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              );
            })
          )}
        </div>
      </div>

      {/* --- FAB --- */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-5 sm:bottom-8 sm:right-5 w-12 h-12 sm:w-16 sm:h-16 bg-orange-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-40 border-4 border-white/20 active:bg-orange-700 shadow-orange-900/20"
      >
        <Plus size={28} strokeWidth={3} />
      </motion.button>

      {/* --- MODAL INPUT/EDIT --- */}
      <AnimatePresence>
        {isOpen && (
          // MODAL WRAPPER
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              // MODAL BOX
              className="bg-[#f8f9fa] w-full max-w-5xl h-[92dvh] sm:h-[85vh] rounded-t-3xl sm:rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden ring-1 ring-white/50"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-200/50 flex justify-between items-center bg-white sticky top-0 z-20 shrink-0">
                <div>
                  <h3 className="font-black text-base text-slate-800 tracking-tight">{editing ? 'EDIT ITEM' : 'INPUT MASSAL'}</h3>
                  <p className="text-xs text-slate-400 font-medium">Isi data dengan lengkap.</p>
                </div>
                <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all text-slate-500"><X size={20} /></button>
              </div>

              {/* Mobile Tabs */}
              {!editing && (
                <div className="flex sm:hidden bg-white border-b border-slate-100 shrink-0">
                  <button onClick={() => setActiveTab("input")} className={`flex-1 py-3 text-[11px] font-black tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === "input" ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50" : "text-slate-400"}`}>
                    <LayoutGrid size={14} /> FORMULIR
                  </button>
                  <button onClick={() => setActiveTab("draft")} className={`flex-1 py-3 text-[11px] font-black tracking-widest flex items-center justify-center gap-2 relative transition-colors ${activeTab === "draft" ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50" : "text-slate-400"}`}>
                    <ClipboardList size={14} /> ANTRIAN
                    {drafts.length > 0 && <span className="absolute top-3 right-12 ml-6 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">{drafts.length}</span>}
                  </button>
                </div>
              )}

              {/* Modal Content Grid */}
              <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">

                {/* LEFT: FORM INPUT */}
                <div className={`w-full sm:w-1/2 flex flex-col h-full relative ${!editing && activeTab === "draft" ? "hidden sm:flex" : "flex"}`}>

                  {/* Scrollable Form Content */}
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-24 sm:pb-5">
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Nama Barang</label>
                        <input
                          ref={nameInputRef}
                          placeholder="Contoh: KitKat Matcha..."
                          // FONT INPUT LEBIH BESAR
                          className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-base sm:text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold transition-all placeholder:font-normal placeholder:text-slate-300 shadow-sm"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          autoFocus={!editing}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Tanggal</label>
                          <input type="date" className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-base sm:text-sm outline-none focus:border-orange-500 font-bold shadow-sm" value={form.shippingDate} onChange={(e) => setForm({ ...form, shippingDate: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Jumlah</label>
                          <input placeholder="1 pcs" className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-base sm:text-sm outline-none focus:border-orange-500 font-bold shadow-sm" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Customer</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input placeholder="Nama Pembeli..." className="w-full bg-white border border-slate-200 pl-10 pr-3 py-3.5 rounded-xl text-base sm:text-sm outline-none focus:border-orange-500 font-bold shadow-sm" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">PIC</label>
                          <div className="relative">
                            <select
                              className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-base sm:text-sm outline-none focus:border-orange-500 appearance-none font-bold shadow-sm cursor-pointer"
                              value={form.pic}
                              onChange={(e) => setForm({ ...form, pic: e.target.value })}
                            >
                              <option value="">Pilih...</option>
                              {PIC_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Platform</label>
                          <div className="relative">
                            <select
                              className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-base sm:text-sm outline-none focus:border-orange-500 appearance-none font-bold shadow-sm cursor-pointer"
                              value={form.platform}
                              onChange={(e) => setForm({ ...form, platform: e.target.value })}
                            >
                              <option value="">Pilih...</option>
                              {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <details className="group">
                          <summary className="list-none text-[11px] font-bold text-orange-600 cursor-pointer flex items-center gap-2 select-none">
                            <span className="bg-orange-100 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition">+ Tambah Link & Catatan</span>
                          </summary>
                          <div className="space-y-3 pt-3 animate-in slide-in-from-top-2 duration-300">
                            <input placeholder="Link Produk" className="w-full bg-white border border-slate-200 p-3 rounded-xl text-base sm:text-sm outline-none focus:border-orange-500 font-medium" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
                            <textarea placeholder="Catatan..." rows={3} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-base sm:text-sm outline-none focus:border-orange-500 resize-none font-medium" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                          </div>
                        </details>
                      </div>
                      <div className="h-10 sm:h-0"></div>
                    </div>
                  </div>

                  {/* FOOTER BUTTON - FIXED AT BOTTOM */}
                  {!editing && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                      <button
                        onClick={addToDraft}
                        disabled={!form.name || !form.pic || !form.shippingDate || !form.customer}
                        className="w-full py-4 bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                      >
                        <ListPlus size={18} /> TAMBAH KE ANTRIAN
                      </button>
                    </div>
                  )}
                </div>

                {/* RIGHT: DRAFT / PREVIEW */}
                <div className={`w-full sm:w-1/2 flex flex-col h-full p-5 bg-white sm:border-l border-slate-100 ${!editing && activeTab === "input" ? "hidden sm:flex" : "flex"}`}>
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <h4 className="font-black text-slate-400 text-[11px] uppercase tracking-[0.2em]">
                      {editing ? 'Preview Item' : `Antrian (${drafts.length})`}
                    </h4>
                    {drafts.length > 0 && (
                      <button onClick={() => setDrafts([])} className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all">
                        HAPUS SEMUA
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar pb-24 sm:pb-0">
                    {drafts.length === 0 && !editing ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 p-8">
                        <Package size={40} strokeWidth={1.5} className="mb-3 text-slate-200" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Antrian Kosong</p>
                      </div>
                    ) : (
                      editing ? (
                        <div className="p-5 bg-orange-50 border border-orange-100 rounded-xl">
                          <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1.5">Edit Mode:</span>
                          <p className="font-bold text-slate-800 text-base leading-tight mb-2">{form.name || "Nama Barang..."}</p>
                          <div className="flex gap-3 text-xs text-slate-500">
                            <span>{form.customer || "Customer"}</span> •
                            <span>{form.quantity || "Qty"}</span>
                          </div>
                        </div>
                      ) : (
                        <AnimatePresence>
                          {drafts.map((d, i) => (
                            <motion.div
                              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                              key={i}
                              className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm"
                            >
                              <div className="min-w-0 pr-3">
                                <p className="font-bold text-slate-700 text-sm truncate">{d.name}</p>
                                <div className="flex gap-2 mt-1.5">
                                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{d.customer}</span>
                                  <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-bold uppercase">{d.quantity}</span>
                                </div>
                              </div>
                              <button onClick={() => setDrafts(drafts.filter((_, idx) => idx !== i))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                <Trash2 size={16} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )
                    )}
                  </div>

                  <div className="absolute sm:relative bottom-0 left-0 right-0 p-4 sm:p-0 bg-white sm:bg-transparent border-t sm:border-t-0 border-slate-50 z-10 sm:z-auto">
                    <button
                      onClick={handleSaveAll}
                      disabled={isProcessing || (drafts.length === 0 && !editing)}
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black rounded-xl hover:shadow-lg flex items-center justify-center gap-2 text-xs tracking-[0.15em] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                      {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {editing ? 'SIMPAN' : `SIMPAN (${drafts.length})`}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL SHARE WHATSAPP --- */}
      <AnimatePresence>
        {isShareOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsShareOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2"><Share2 size={18} className="text-green-600"/> Bagikan Laporan</h3>
                 <button onClick={() => setIsShareOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={18} /></button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Config Controls */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</label>
                      <select 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-green-500"
                        value={shareConfig.date}
                        onChange={e => setShareConfig({...shareConfig, date: e.target.value})}
                      >
                        <option value="">Semua Tanggal</option>
                        {uniqueDates.map(d => <option key={d} value={d}>{formatAndAddYear(d)}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">PIC</label>
                      <select 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-green-500"
                        value={shareConfig.pic}
                        onChange={e => setShareConfig({...shareConfig, pic: e.target.value})}
                      >
                         <option value="">Semua PIC</option>
                         {uniquePics.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Status Barang</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                      {(['all', 'pending', 'done'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setShareConfig({...shareConfig, status: s})}
                          className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${shareConfig.status === s ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          {s === 'all' ? 'Semua' : s === 'done' ? 'Selesai' : 'Pending'}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Preview Box */}
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                     <span>Preview Pesan</span>
                     <span className="text-[10px] bg-green-100 text-green-700 px-2 rounded">WhatsApp Format</span>
                   </label>
                   <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-700 shadow-inner">
                      {generateShareText()}
                   </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                 <button 
                  onClick={handleSendWhatsapp}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-200"
                 >
                    <Send size={18} />
                    KIRIM KE WHATSAPP
                 </button>
              </div>
            </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}