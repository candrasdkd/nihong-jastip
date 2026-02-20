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
  Plus,
  Package,
  Calendar,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  X,
  Search,
  SortAsc,
  SortDesc,
  ListPlus,
  Send,
  LayoutGrid,
  ClipboardList,
  Loader2,
  SearchX,
  ExternalLink,
  User,
  CheckCircle,
  Clock,
  Share2,
  Filter,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { formatAndAddYear } from "../utils/helpers";
import { PIC_OPTIONS, PLATFORM_OPTIONS } from "../utils/constants";
import { PurchaseItem, ShareConfig } from "../types";

// --- SUB-COMPONENTS ---

const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }: any) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-w-[100px] flex-1 relative overflow-hidden group">
    <div
      className={`absolute right-[-10px] top-[-10px] p-4 rounded-full ${bgClass} opacity-20 group-hover:scale-125 transition-transform duration-500`}
    >
      <Icon size={40} />
    </div>
    <div className={`p-2 w-fit rounded-xl ${bgClass} ${colorClass} mb-3`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-black text-slate-800 tracking-tight">
        {value}
      </p>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
    </div>
  </div>
);

const Badge = ({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: "slate" | "orange" | "green" | "blue";
}) => {
  const styles = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles[color]} uppercase tracking-wide`}
    >
      {children}
    </span>
  );
};

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
  const emptyForm = {
    name: "",
    quantity: "",
    pic: "",
    customer: "",
    platform: "",
    link: "",
    note: "",
    shippingDate: "",
    isDone: false,
  };
  const [form, setForm] = useState(emptyForm);
  const [drafts, setDrafts] = useState<Omit<PurchaseItem, "id">[]>([]);

  // Share Config
  const [shareConfig, setShareConfig] = useState<ShareConfig>({
    date: "",
    pic: "",
    status: "all",
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // --- EFFECT ---
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "purchases"),
      orderBy("shippingDate", sortOrder),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PurchaseItem[];
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [sortOrder]);

  // --- ACTIONS ---
  const addToDraft = () => {
    if (!form.name || !form.pic || !form.shippingDate || !form.customer) return;
    setDrafts((prev) => [...prev, { ...form }]);
    setForm((prev) => ({
      ...emptyForm,
      pic: prev.pic,
      shippingDate: prev.shippingDate,
      customer: prev.customer,
      platform: prev.platform,
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
    if (!confirm("Hapus item ini?")) return;
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "purchases", id));
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDone = async (item: PurchaseItem) => {
    try {
      await updateDoc(doc(db, "purchases", item.id), { isDone: !item.isDone });
    } catch (e) {
      console.error(e);
    }
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
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.pic.toLowerCase().includes(q) ||
          i.customer.toLowerCase().includes(q),
      );
    }
    if (filter === "done") result = result.filter((i) => i.isDone);
    if (filter === "pending") result = result.filter((i) => !i.isDone);
    return result;
  }, [items, filter, searchQuery]);

  const grouped = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        done: number;
        pics: Record<string, Record<string, PurchaseItem[]>>;
      }
    > = {};

    processedItems.forEach((item) => {
      const dateKey = item.shippingDate || "Tanpa Tanggal";
      const picKey = item.pic || "Tanpa PIC";
      const custKey = item.customer || "Tanpa Customer";

      if (!map[dateKey]) map[dateKey] = { total: 0, done: 0, pics: {} };
      if (!map[dateKey].pics[picKey]) map[dateKey].pics[picKey] = {};
      if (!map[dateKey].pics[picKey][custKey])
        map[dateKey].pics[picKey][custKey] = [];

      map[dateKey].pics[picKey][custKey].push(item);
      map[dateKey].total++;
      if (item.isDone) map[dateKey].done++;
    });
    return map;
  }, [processedItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.isDone).length;
    return { total, done, pending: total - done };
  }, [items]);

  const uniqueDates = useMemo(
    () => [...new Set(items.map((i) => i.shippingDate))].sort(),
    [items],
  );
  const uniquePics = useMemo(() => {
    if (!shareConfig.date) return PIC_OPTIONS;
    return [
      ...new Set(
        items
          .filter((i) => i.shippingDate === shareConfig.date)
          .map((i) => i.pic),
      ),
    ];
  }, [items, shareConfig.date]);

  // --- SHARE GENERATOR ---
  const generateShareText = () => {
    const filteredForShare = items.filter((i) => {
      const matchDate = shareConfig.date
        ? i.shippingDate === shareConfig.date
        : true;
      const matchPic = shareConfig.pic ? i.pic === shareConfig.pic : true;
      const matchStatus =
        shareConfig.status === "all"
          ? true
          : shareConfig.status === "done"
            ? i.isDone
            : !i.isDone;
      return matchDate && matchPic && matchStatus;
    });

    if (filteredForShare.length === 0) return "Tidak ada data.";

    const groupedByCustomer: Record<string, PurchaseItem[]> = {};
    filteredForShare.forEach((i) => {
      const custName = i.customer.trim().toUpperCase();
      if (!groupedByCustomer[custName]) groupedByCustomer[custName] = [];
      groupedByCustomer[custName].push(i);
    });

    let text = `📦 *LAPORAN JASTIP*\n`;
    if (shareConfig.date) text += `🗓 ${formatAndAddYear(shareConfig.date)}\n`;
    if (shareConfig.pic) text += `👤 PIC: ${shareConfig.pic}\n`;
    text += `----------------------\n`;

    Object.keys(groupedByCustomer)
      .sort()
      .forEach((customer) => {
        text += `\n👤 *${customer}*\n`;
        groupedByCustomer[customer]
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((item) => {
            text += `${item.isDone ? "✅" : "⭕️"} ${item.name} (${item.quantity})`;
            if (item.note) text += `\n   └ _${item.note}_`;
            text += `\n`;
          });
      });
    return text;
  };

  const handleSendWhatsapp = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(generateShareText())}`,
      "_blank",
    );
    setIsShareOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-900 pb-28">
      {/* --- LOADING OVERLAY --- */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex items-center justify-center"
          >
            <div className="bg-white px-8 py-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-orange-500" size={32} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Memproses...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* --- HERO HEADER --- */}
        <header className="pt-8 pb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Jastip<span className="text-orange-500">Tracker</span>.
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Kelola pesanan dengan efisien.
              </p>
            </div>
            <button
              onClick={() => {
                const defaultDate =
                  uniqueDates.length > 0
                    ? uniqueDates[uniqueDates.length - 1]
                    : "";
                setShareConfig({ date: defaultDate, pic: "", status: "all" });
                setIsShareOpen(true);
              }}
              className="bg-white hover:bg-slate-50 text-slate-600 p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
            >
              <Share2 size={20} />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <StatCard
              label="Total Item"
              value={stats.total}
              icon={Package}
              bgClass="bg-blue-100"
              colorClass="text-blue-600"
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              bgClass="bg-orange-100"
              colorClass="text-orange-600"
            />
            <StatCard
              label="Selesai"
              value={stats.done}
              icon={CheckCircle}
              bgClass="bg-emerald-100"
              colorClass="text-emerald-600"
            />
          </div>
        </header>

        {/* --- STICKY SEARCH & FILTER --- */}
        <div className="sticky top-4 z-30 mb-8">
          <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-lg shadow-slate-200/50 border border-white/50 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari item, customer, pic..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-400 placeholder:font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 sm:pt-0 pb-1 sm:pb-0 px-1 sm:px-0">
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="aspect-square h-full p-3 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-orange-500 transition-colors shrink-0 flex items-center justify-center"
              >
                {sortOrder === "asc" ? (
                  <SortAsc size={18} />
                ) : (
                  <SortDesc size={18} />
                )}
              </button>
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 h-full items-center">
                {(["all", "pending", "done"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all h-full flex items-center ${filter === f ? "bg-white text-slate-800 shadow-sm scale-100" : "text-slate-400 hover:text-slate-600 scale-95"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN LIST --- */}
        <div className="space-y-10">
          {loading ? (
            <div className="py-20 text-center space-y-4">
              <Loader2
                className="animate-spin text-orange-400 mx-auto"
                size={40}
              />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                Memuat Data...
              </p>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
              <SearchX
                size={80}
                className="text-slate-300 mb-4"
                strokeWidth={1}
              />
              <h3 className="text-base font-bold text-slate-600">
                Tidak ada data ditemukan
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Coba ubah kata kunci atau filter anda.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, data]) => {
              const progress =
                data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;

              return (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={date}
                  className="relative"
                >
                  {/* Date Header Group */}
                  <div className="sticky top-[5.5rem] z-20 bg-slate-50/95 backdrop-blur-sm pb-4 pt-2 mb-2">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-slate-800 text-white p-2 rounded-lg">
                          <Calendar size={18} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">
                          {formatAndAddYear(date)}
                        </h2>
                      </div>
                      <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                        {data.done}/{data.total} Selesai
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500" : "bg-orange-500"}`}
                      />
                    </div>
                  </div>

                  {/* Group by PIC */}
                  <div className="space-y-6">
                    {Object.entries(data.pics).map(([pic, customerMap]) => (
                      <div
                        key={pic}
                        className="relative pl-4 border-l-2 border-slate-200 ml-3"
                      >
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-slate-50" />

                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            PIC: {pic}
                          </span>
                        </div>

                        {/* Group by Customer */}
                        <div className="space-y-3">
                          {Object.entries(customerMap).map(
                            ([customer, list]) => (
                              <div
                                key={customer}
                                className="bg-white rounded-2xl p-1 shadow-sm border border-slate-200/60 overflow-hidden"
                              >
                                <div className="px-3 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                                  <User size={12} className="text-slate-400" />
                                  <h4 className="text-xs font-black text-slate-600 uppercase tracking-wide">
                                    {customer}
                                  </h4>
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {list.map((item) => (
                                    <div
                                      key={item.id}
                                      className={`relative p-3 transition-all hover:bg-slate-50 group ${item.isDone ? "opacity-50 grayscale-[0.8]" : ""}`}
                                    >
                                      <div className="flex gap-3 items-start">
                                        <button
                                          onClick={() => toggleDone(item)}
                                          className="mt-0.5 shrink-0 text-slate-300 hover:text-emerald-500 transition-colors active:scale-90"
                                        >
                                          {item.isDone ? (
                                            <CheckCircle2
                                              size={22}
                                              className="text-emerald-500"
                                            />
                                          ) : (
                                            <Circle size={22} strokeWidth={2} />
                                          )}
                                        </button>

                                        <div className="flex-1 min-w-0 pt-0.5">
                                          <div className="flex justify-between items-start">
                                            <h5
                                              className={`font-bold text-sm leading-snug ${item.isDone ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"}`}
                                            >
                                              {item.name}
                                            </h5>
                                            {/* Actions Overlay */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-white/90 shadow-sm rounded-lg p-1 border border-slate-100">
                                              {item.link && (
                                                <button
                                                  onClick={() =>
                                                    openPlatformLink(item.link)
                                                  }
                                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md"
                                                >
                                                  <ExternalLink size={14} />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => {
                                                  setEditing(item);
                                                  setForm({
                                                    name: item.name,
                                                    quantity: item.quantity,
                                                    pic: item.pic,
                                                    customer: item.customer,
                                                    shippingDate:
                                                      item.shippingDate,
                                                    isDone: item.isDone,
                                                    platform:
                                                      item.platform || "",
                                                    link: item.link || "",
                                                    note: item.note || "",
                                                  });
                                                  setIsOpen(true);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-md"
                                              >
                                                <Edit3 size={14} />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleDelete(item.id)
                                                }
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <Badge color="orange">
                                              {item.quantity}
                                            </Badge>
                                            {item.platform && (
                                              <Badge color="blue">
                                                {item.platform}
                                              </Badge>
                                            )}
                                          </div>

                                          {item.note && (
                                            <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg italic border border-slate-100/50 flex gap-1.5">
                                              <span className="font-bold not-italic text-slate-400">
                                                Note:
                                              </span>{" "}
                                              {item.note}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
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
        className="fixed bottom-20 right-6 sm:bottom-6 sm:right-6 h-14 w-14 bg-slate-800 text-white rounded-full shadow-2xl shadow-slate-800/40 flex items-center justify-center z-40 hover:bg-slate-900"
      >
        <Plus size={28} strokeWidth={2.5} />
      </motion.button>

      {/* --- MODAL INPUT --- */}
      {/* --- MODAL INPUT --- */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-slate-50 w-full max-w-4xl h-[92dvh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl relative flex flex-col overflow-hidden"
            >
              {/* 1. HEADER (Fixed) */}
              <div className="bg-white px-5 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 z-30">
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">
                    {editing ? "Edit Pesanan" : "Input Pesanan"}
                  </h2>
                  <p className="text-xs font-medium text-slate-400">
                    {editing
                      ? "Perbarui data item ini"
                      : "Tambah item baru ke antrian"}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 2. TABS (Mobile Only - Fixed) */}
              {!editing && (
                <div className="flex sm:hidden bg-white border-b border-slate-200 shrink-0 z-30">
                  <button
                    onClick={() => setActiveTab("input")}
                    className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${activeTab === "input" ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50" : "text-slate-400"}`}
                  >
                    Formulir
                  </button>
                  <button
                    onClick={() => setActiveTab("draft")}
                    className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest relative transition-colors ${activeTab === "draft" ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50" : "text-slate-400"}`}
                  >
                    Antrian
                    {drafts.length > 0 && (
                      <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px] min-w-[18px] inline-block text-center">
                        {drafts.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* 3. CONTENT BODY (Scrollable Area) */}
              {/* min-h-0 sangat penting agar child scroll berfungsi didalam flex parent */}
              <div className="flex flex-1 min-h-0 flex-col sm:flex-row relative bg-slate-50">
                {/* --- KIRI: FORM INPUT --- */}
                <div
                  className={`flex-1 flex flex-col relative h-full ${!editing && activeTab === "draft" ? "hidden sm:flex" : "flex"}`}
                >
                  {/* Scrollable Container */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pb-32 sm:pb-28">
                    <div className="space-y-5">
                      {/* Input Nama (Primary) */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Nama Barang
                          </label>
                          <input
                            ref={nameInputRef}
                            autoFocus={!editing}
                            className="w-full text-lg font-bold text-slate-800 placeholder:text-slate-300 border-b-2 border-slate-100 focus:border-orange-500 outline-none py-2 bg-transparent transition-colors"
                            placeholder="Contoh: Coklat Royce..."
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Jumlah
                            </label>
                            <input
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                              placeholder="1"
                              value={form.quantity}
                              onChange={(e) =>
                                setForm({ ...form, quantity: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Customer
                            </label>
                            <input
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                              placeholder="Nama..."
                              value={form.customer}
                              onChange={(e) =>
                                setForm({ ...form, customer: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Input Detail (Secondary) */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Tanggal
                            </label>
                            <input
                              type="date"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-sm outline-none"
                              value={form.shippingDate}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  shippingDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              PIC
                            </label>
                            <div className="relative">
                              <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-sm outline-none appearance-none"
                                value={form.pic}
                                onChange={(e) =>
                                  setForm({ ...form, pic: e.target.value })
                                }
                              >
                                <option value="">Pilih...</option>
                                {PIC_OPTIONS.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Platform
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {PLATFORM_OPTIONS.map((p) => (
                              <button
                                key={p}
                                onClick={() =>
                                  setForm({ ...form, platform: p })
                                }
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${form.platform === p ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Optional */}
                      <details className="group bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <summary className="list-none flex justify-between items-center cursor-pointer">
                          <span className="text-xs font-bold text-slate-500">
                            Catatan & Link
                          </span>
                          <Plus
                            size={16}
                            className="text-slate-400 group-open:rotate-45 transition-transform"
                          />
                        </summary>
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                          <input
                            placeholder="Link Produk..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                            value={form.link}
                            onChange={(e) =>
                              setForm({ ...form, link: e.target.value })
                            }
                          />
                          <textarea
                            placeholder="Catatan..."
                            rows={2}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none"
                            value={form.note}
                            onChange={(e) =>
                              setForm({ ...form, note: e.target.value })
                            }
                          />
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* BUTTON ACTION (FIXED BOTTOM) */}
                  {!editing && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                      <button
                        onClick={addToDraft}
                        disabled={
                          !form.name ||
                          !form.pic ||
                          !form.shippingDate ||
                          !form.customer
                        }
                        className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-300 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                      >
                        <ListPlus size={18} />
                        <span className="text-sm tracking-wide">
                          TAMBAH KE ANTRIAN
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* --- KANAN: DRAFT LIST --- */}
                <div
                  className={`flex-1 flex flex-col h-full bg-slate-100 sm:border-l border-slate-200 relative ${!editing && activeTab === "input" ? "hidden sm:flex" : "flex"}`}
                >
                  {/* Header Draft */}
                  <div className="p-4 bg-white/50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      {editing
                        ? "Preview"
                        : `Daftar Antrian (${drafts.length})`}
                    </span>
                    {!editing && drafts.length > 0 && (
                      <button
                        onClick={() => setDrafts([])}
                        className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded hover:bg-red-100"
                      >
                        HAPUS SEMUA
                      </button>
                    )}
                  </div>

                  {/* List Draft */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
                    {editing ? (
                      <div className="bg-white p-5 rounded-2xl border-2 border-orange-100 shadow-sm text-center">
                        <p className="text-xs font-bold text-orange-500 uppercase mb-2">
                          Sedang Mengedit
                        </p>
                        <h3 className="text-lg font-black text-slate-800">
                          {form.name || "..."}
                        </h3>
                      </div>
                    ) : drafts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-40 mt-10 sm:mt-0">
                        <ClipboardList
                          size={40}
                          className="mb-2 text-slate-400"
                        />
                        <p className="text-xs font-bold text-slate-400 uppercase">
                          Belum ada antrian
                        </p>
                      </div>
                    ) : (
                      drafts.map((d, i) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={i}
                          className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-800 text-sm truncate">
                              {d.name}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                {d.customer}
                              </span>
                              <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                {d.quantity}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setDrafts(drafts.filter((_, idx) => idx !== i))
                            }
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* BUTTON SIMPAN (FIXED BOTTOM) */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <button
                      onClick={handleSaveAll}
                      disabled={
                        isProcessing || (drafts.length === 0 && !editing)
                      }
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white h-12 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      {isProcessing ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                      {editing
                        ? "SIMPAN PERUBAHAN"
                        : `SIMPAN SEMUA (${drafts.length})`}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SHARE MODAL --- */}
      <AnimatePresence>
        {isShareOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Share2 size={18} className="text-green-600" /> Share Laporan
                </h3>
                <button
                  onClick={() => setIsShareOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Tanggal
                    </label>
                    <select
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      value={shareConfig.date}
                      onChange={(e) =>
                        setShareConfig({ ...shareConfig, date: e.target.value })
                      }
                    >
                      <option value="">Semua</option>
                      {uniqueDates.map((d) => (
                        <option key={d} value={d}>
                          {formatAndAddYear(d)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      PIC
                    </label>
                    <select
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      value={shareConfig.pic}
                      onChange={(e) =>
                        setShareConfig({ ...shareConfig, pic: e.target.value })
                      }
                    >
                      <option value="">Semua</option>
                      {PIC_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg z-10">
                    WHATSAPP PREVIEW
                  </div>
                  <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                    {generateShareText()}
                  </pre>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleSendWhatsapp}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all active:scale-95"
                >
                  Kirim ke WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
