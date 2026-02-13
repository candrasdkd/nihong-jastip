import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { ScheduleItem, ThemeType } from '../types';
import { DEFAULT_INDO_JPN, DEFAULT_JPN_INDO, LONG_MONTHS_LABEL, THEME_BACKGROUNDS } from '../utils/constants';
import { RenderBoardingPass } from '../components/themes/TicketBoarding';
import { RenderGenZPlanner } from '../components/themes/GenZPlanner';
import { RenderReceipt } from '../components/themes/ReceiptPlanner';
import { RenderCargo } from '../components/themes/IndustrialCargo';
import {
  Ticket, Sparkles, Receipt, Truck,
  PlaneTakeoff, PlaneLanding, Plus, Trash2,
  Download, Image as ImageIcon, CheckCircle, X,
  CalendarDays, Save, Copy
} from 'lucide-react';

const FlightBoardGenerator = () => {
  const ref = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [indoToJpn, setIndoToJpn] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('schedule_indo_jpn');
    return saved ? JSON.parse(saved) : DEFAULT_INDO_JPN;
  });

  const [jpnToIndo, setJpnToIndo] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('schedule_jpn_indo');
    return saved ? JSON.parse(saved) : DEFAULT_JPN_INDO;
  });

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<'INDO-JPN' | 'JPN-INDO'>('INDO-JPN');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('BOARDING');

  // SINGLE INPUT STATE
  const [inputDate, setInputDate] = useState('');
  const [inputStatus, setInputStatus] = useState('AVAILABLE');
  const [inputKg, setInputKg] = useState('');

  // --- SMART BATCH IMPORT STATE ---
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Default ke BULAN INI (Real-time)
  const [batchMonth, setBatchMonth] = useState(LONG_MONTHS_LABEL[new Date().getMonth()]);
  // List draft item yang mau dimasukkan
  const [batchRows, setBatchRows] = useState([
    { day: '', status: 'AVAILABLE', kg: '10' }
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportScale, setExportScale] = useState(3);

  // --- EFFECT ---
  useEffect(() => { localStorage.setItem('schedule_indo_jpn', JSON.stringify(indoToJpn)); }, [indoToJpn]);
  useEffect(() => { localStorage.setItem('schedule_jpn_indo', JSON.stringify(jpnToIndo)); }, [jpnToIndo]);

  // --- HANDLERS ---
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => { if (event.target?.result) setBgImage(event.target.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomBg = () => setBgImage(null);

  // 1. ADD SINGLE ITEM (Manual)
  const handleAdd = () => {
    if (!inputDate) return;
    const newItem: ScheduleItem = {
      id: Date.now(),
      date: inputDate.toUpperCase(),
      status: inputStatus as any,
      value: inputKg || '10'
    };
    if (activeRoute === 'INDO-JPN') setIndoToJpn([...indoToJpn, newItem]);
    else setJpnToIndo([...jpnToIndo, newItem]);
    setInputDate(''); setInputKg('');
  };

  // 2. BATCH ROW MANAGEMENT
  const addBatchRow = () => {
    setBatchRows([...batchRows, { day: '', status: 'AVAILABLE', kg: '10' }]);
  };

  const removeBatchRow = (index: number) => {
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const updateBatchRow = (index: number, field: string, value: string) => {
    const newRows = [...batchRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setBatchRows(newRows);
  };

  const duplicateBatchRow = (index: number) => {
    const rowToClone = batchRows[index];
    // Insert after the current index
    const newRows = [...batchRows];
    newRows.splice(index + 1, 0, { ...rowToClone, day: '' }); // Clone status/kg but clear day
    setBatchRows(newRows);
  };

  // 3. PROCESS BATCH IMPORT
  const handleBatchImport = () => {
    const validItems: ScheduleItem[] = batchRows
      .filter(row => row.day.trim() !== '') // Hanya ambil yang tanggalnya diisi
      .map(row => ({
        id: Date.now() + Math.random(),
        date: `${row.day} ${batchMonth}`.toUpperCase(), // Combine Day + Month
        status: row.status as any,
        value: row.kg
      }));

    if (validItems.length === 0) return;

    if (activeRoute === 'INDO-JPN') setIndoToJpn([...indoToJpn, ...validItems]);
    else setJpnToIndo([...jpnToIndo, ...validItems]);

    // Reset & Close
    setBatchRows([{ day: '', status: 'AVAILABLE', kg: '10' }]);
    setShowBatchModal(false);
  };

  // 4. DIRECT EDIT
  const handleUpdateItem = (id: number, field: keyof ScheduleItem, newValue: string) => {
    const updater = (items: ScheduleItem[]) => items.map(item => {
      if (item.id === id) return { ...item, [field]: newValue };
      return item;
    });
    if (activeRoute === 'INDO-JPN') setIndoToJpn(updater(indoToJpn));
    else setJpnToIndo(updater(jpnToIndo));
  };

  const handleDelete = (id: number, route: 'INDO-JPN' | 'JPN-INDO') => {
    if (route === 'INDO-JPN') setIndoToJpn(indoToJpn.filter(i => i.id !== id));
    else setJpnToIndo(jpnToIndo.filter(i => i.id !== id));
  };

  const handleDownload = useCallback(async () => {
    if (ref.current === null || isExporting) return;
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true, pixelRatio: exportScale, width: 360, height: 640,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      const link = document.createElement('a');
      link.download = `Jadwal-${currentTheme}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl; link.click();
    } catch (err) { alert('Gagal download.'); }
    finally { setIsExporting(false); }
  }, [ref, isExporting, exportScale, currentTheme]);

  const activeList = activeRoute === 'INDO-JPN' ? indoToJpn : jpnToIndo;

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 p-4 lg:p-8 font-sans flex flex-col lg:flex-row gap-8 justify-center items-start">

      {/* =======================
          CONTROL PANEL (LEFT)
         ======================= */}
      <div className="w-full lg:w-[420px] bg-[#161b22] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#1c2128]">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600 w-2 h-6 rounded-full"></span>
            Flight Board Studio
          </h1>
        </div>

        <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[85vh] custom-scrollbar">

          {/* 1. Theme Selector */}
          <section>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'BOARDING', label: 'Boarding Pass', icon: Ticket, color: 'bg-blue-500', border: 'border-blue-500' },
                { id: 'NEON', label: 'Gen Z Aesthetic', icon: Sparkles, color: 'bg-purple-500', border: 'border-purple-500' },
                { id: 'PASTEL', label: 'Store Receipt', icon: Receipt, color: 'bg-amber-500', border: 'border-amber-500' },
                { id: 'CARGO', label: 'Industrial Cargo', icon: Truck, color: 'bg-slate-500', border: 'border-slate-500' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setCurrentTheme(theme.id as ThemeType)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${currentTheme === theme.id
                      ? `${theme.border} bg-slate-800 text-white shadow-lg`
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  <theme.icon className={`w-4 h-4 ${currentTheme === theme.id ? theme.color.replace('bg-', 'text-') : ''}`} />
                  <span className="text-xs font-bold">{theme.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Schedule Manager */}
          <section className="space-y-4">
            {/* Route Switcher */}
            <div className="bg-slate-900 p-1 rounded-lg flex border border-slate-800">
              <button onClick={() => setActiveRoute('INDO-JPN')} className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeRoute === 'INDO-JPN' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                <PlaneTakeoff className="w-3 h-3" /> ID ➝ JP
              </button>
              <button onClick={() => setActiveRoute('JPN-INDO')} className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeRoute === 'JPN-INDO' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                <PlaneLanding className="w-3 h-3" /> JP ➝ ID
              </button>
            </div>

            {/* --- Quick Add & Batch Add Buttons --- */}
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="DATE (e.g 12 OCT)"
                  value={inputDate}
                  onChange={e => setInputDate(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                />
                <button onClick={handleAdd} disabled={!inputDate} className="bg-slate-700 hover:bg-slate-600 text-white px-3 rounded-lg font-bold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* BATCH Trigger - More Prominent */}
              <button
                onClick={() => setShowBatchModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
                title="Add Multiple Dates"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs">Batch Add</span>
              </button>
            </div>

            {/* --- EDITABLE LIST --- */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {activeList.length} Items (Click to Edit)
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto p-1 space-y-1 custom-scrollbar">
                {activeList.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-600 italic">No schedule. Add one or use Batch Add.</div>
                )}
                {activeList.map(item => (
                  <div key={item.id} className="flex gap-2 items-center bg-slate-800/50 p-1.5 rounded border border-slate-700/50 group hover:border-slate-600 transition-colors">
                    {/* Date Input */}
                    <input
                      type="text"
                      value={item.date}
                      onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value.toUpperCase())}
                      className="bg-transparent text-xs font-mono font-bold text-white w-20 focus:bg-slate-700 focus:outline-none rounded px-1"
                    />

                    <div className="h-4 w-[1px] bg-slate-700"></div>

                    {/* Status Select */}
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateItem(item.id, 'status', e.target.value)}
                      className={`bg-transparent text-[10px] font-bold outline-none rounded px-1 cursor-pointer w-20 ${item.status === 'AVAILABLE' ? 'text-green-400' :
                          item.status === 'LIMITED' ? 'text-amber-400' : 'text-red-400'
                        }`}
                    >
                      <option value="AVAILABLE" className="bg-slate-800 text-green-400">OPEN</option>
                      <option value="LIMITED" className="bg-slate-800 text-amber-400">LIMIT</option>
                      <option value="SOLD OUT" className="bg-slate-800 text-red-400">SOLD</option>
                    </select>

                    {/* Kg Input (Only if Available) */}
                    {item.status === 'AVAILABLE' && (
                      <>
                        <input
                          type="number"
                          value={item.value}
                          onChange={(e) => handleUpdateItem(item.id, 'value', e.target.value)}
                          className="bg-transparent text-[10px] text-right font-bold text-slate-300 w-8 focus:bg-slate-700 focus:outline-none rounded"
                        />
                        <span className="text-[9px] text-slate-500">kg</span>
                      </>
                    )}

                    <div className="flex-1"></div>

                    <button onClick={() => handleDelete(item.id, activeRoute)} className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Export Actions */}
          <section className="pt-4 border-t border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <input type="file" accept="image/*" onChange={handleBgUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <button className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold border border-dashed flex items-center justify-center gap-2 transition-all ${bgImage ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {bgImage ? <CheckCircle className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  {bgImage ? 'BG Active' : 'Custom BG'}
                </button>
                {bgImage && <button onClick={handleClearCustomBg} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 z-20 shadow"><X className="w-3 h-3" /></button>}
              </div>

              <button onClick={() => setExportScale(exportScale === 3 ? 4 : 3)} className={`py-2.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all ${exportScale === 4 ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                <span>{exportScale === 4 ? '4K Ultra' : 'HD Quality'}</span>
              </button>
            </div>

            <button onClick={handleDownload} disabled={isExporting} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
              {isExporting ? 'Generating...' : 'Download Image'}
            </button>
          </section>
        </div>
      </div>

      {/* =======================
          PREVIEW CANVAS (RIGHT)
         ======================= */}
      <div className="flex flex-col items-center gap-4">
        <div className="bg-[#161b22] px-4 py-1.5 rounded-full border border-slate-800 shadow-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Preview</span>
        </div>

        <div className="relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-[32px] p-2 bg-[#2a2a2a] border border-slate-700">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-[#2a2a2a] rounded-b-xl z-20"></div>
          <div className="rounded-[28px] overflow-hidden border-2 border-slate-900 bg-zinc-900">
            <div ref={ref} style={{ width: 360, height: 640 }} className="relative overflow-hidden select-none flex flex-col items-center justify-center bg-zinc-900">
              <div className="absolute inset-0 z-0">
                {bgImage ? <img src={bgImage} alt="custom bg" className="w-full h-full object-cover opacity-100" /> :
                  <>
                    <img src={THEME_BACKGROUNDS[currentTheme]} alt="bg" className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${currentTheme === 'NEON' ? 'scale-110 blur-[2px] opacity-70' : currentTheme === 'BOARDING' ? 'blur-[1px] opacity-60' : currentTheme === 'CARGO' ? 'sepia-[0.3] opacity-50' : ''}`} />
                    <div className={`absolute inset-0 mix-blend-overlay transition-colors duration-700 ${currentTheme === 'NEON' ? 'bg-indigo-900/40' : currentTheme === 'BOARDING' ? 'bg-blue-500/20' : currentTheme === 'CARGO' ? 'bg-yellow-900/30' : ''}`}></div>
                  </>
                }
              </div>
              <div className="relative w-full h-full z-10 transition-opacity duration-300">
                {currentTheme === 'BOARDING' && <div className="p-4 w-full h-full flex flex-col justify-center"><RenderBoardingPass indoToJpn={indoToJpn} jpnToIndo={jpnToIndo} /></div>}
                {currentTheme === 'NEON' && <RenderGenZPlanner indoToJpn={indoToJpn} jpnToIndo={jpnToIndo} />}
                {currentTheme === 'PASTEL' && <RenderReceipt indoToJpn={indoToJpn} jpnToIndo={jpnToIndo} />}
                {currentTheme === 'CARGO' && <RenderCargo indoToJpn={indoToJpn} jpnToIndo={jpnToIndo} />}
              </div>
              {currentTheme !== 'NEON' && <div className="absolute bottom-6 font-bold text-white/20 text-[10px] tracking-[0.3em] uppercase z-10 pointer-events-none mix-blend-overlay">Flight Board Generator</div>}
            </div>
          </div>
        </div>
      </div>

      {/* === MODAL SMART BATCH IMPORT (NEW) === */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1c2128] w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-[#161b22]">
              <div className="flex items-center gap-3">
                <div className="bg-purple-900/50 p-2 rounded-lg text-purple-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Batch Creator</h3>
                  <p className="text-[10px] text-slate-400">Add multiple dates for one month</p>
                </div>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5">

              {/* 1. SELECT MONTH */}
              {/* 1. SELECT MONTH */}
              <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <label className="text-xs font-bold text-slate-400 uppercase">Select Month:</label>
                <select
                  value={batchMonth}
                  onChange={(e) => setBatchMonth(e.target.value)}
                  className="bg-slate-900 text-white font-bold text-sm px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-purple-500 uppercase flex-1"
                >
                  {LONG_MONTHS_LABEL.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* 2. ROWS INPUT */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Dates & Status</span>
                  <span className="text-[10px] text-slate-600 italic">Day {batchMonth} will be auto-generated</span>
                </div>

                {batchRows.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                    {/* Day Input */}
                    <div className="relative w-16">
                      <input
                        type="text"
                        placeholder="Day"
                        value={row.day}
                        onChange={(e) => updateBatchRow(index, 'day', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-2 pr-1 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none text-center font-bold"
                        autoFocus={index === batchRows.length - 1} // Auto focus new row
                      />
                    </div>

                    {/* Status Select */}
                    <select
                      value={row.status}
                      onChange={(e) => updateBatchRow(index, 'status', e.target.value)}
                      className={`flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs font-bold focus:outline-none ${row.status === 'AVAILABLE' ? 'text-green-400' :
                          row.status === 'LIMITED' ? 'text-amber-400' : 'text-red-400'
                        }`}
                    >
                      <option value="AVAILABLE">OPEN</option>
                      <option value="LIMITED">LIMITED</option>
                      <option value="SOLD OUT">SOLD OUT</option>
                    </select>

                    {/* Kg Input */}
                    {row.status === 'AVAILABLE' && (
                      <div className="relative w-16">
                        <input
                          type="number"
                          value={row.kg}
                          onChange={(e) => updateBatchRow(index, 'kg', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-2 pr-6 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none text-right"
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-slate-500">kg</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => duplicateBatchRow(index)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                        title="Duplicate Row"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {batchRows.length > 1 && (
                        <button
                          onClick={() => removeBatchRow(index)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addBatchRow}
                className="w-full py-2 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Another Date
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700 bg-[#161b22] flex gap-3">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-bold text-sm hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchImport}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Import to Schedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FlightBoardGenerator;