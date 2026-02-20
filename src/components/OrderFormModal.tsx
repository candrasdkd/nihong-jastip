import React, { useMemo, useState } from "react";
import { Customer, Option, Order, OrderStatus } from "../types";
import { computeTotal, todayStr } from "../utils/helpers";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { formatCurrency } from "../utils/format";
import SearchableSelect from "./ui/SearchableSelect";
import { Select } from "./ui/Select";
import { RupiahInput } from "./ui/RupiahInput";
import { CATEGORY_OPTIONS, ORDER_STATUSES } from "../utils/constants";

const toStr = (v: number) => (Number.isFinite(v) ? String(v) : "");
const num = (v: any) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

export function OrderFormModal({
  customers,
  initial,
  onClose,
  onSubmit,
  existing,
  unitPrice,
}: {
  customers: Customer[];
  initial?: Order;
  onClose: () => void;
  onSubmit: (order: Order) => void | Promise<void>;
  existing: Order[];
  unitPrice: number;
}) {
  const [loading, setLoading] = useState(false);

  // State Mata Uang
  const [currency, setCurrency] = useState<"IDR" | "JPY">(
    (initial as any)?.currency || "IDR",
  );

  // State Form Utama
  const [no] = useState(initial?.no || `ORD-${new Date().getTime()}`);
  const [namaBarang, setNamaBarang] = useState(initial?.namaBarang || "");
  const [kategori, setKategori] = useState(initial?.kategori || "Makanan");
  const [tanggal, setTanggal] = useState(initial?.tanggal || todayStr());
  const [namaPelanggan, setNamaPelanggan] = useState(
    initial?.namaPelanggan || "",
  );
  const [jumlahKg, setJumlahKg] = useState<number>(initial?.jumlahKg || 1);
  const [pengiriman, setPengiriman] = useState<string>(
    (initial as any)?.pengiriman || "INDO - JPG",
  );
  const [catatan, setCatatan] = useState<string>(
    (initial as any)?.catatan || "",
  );
  const [status, setStatus] = useState<string>(
    (initial?.status as any) || "Belum Membayar",
  );

  // State Harga (Disimpan sebagai angka murni)
  const [hargaJastipManual, setHargaJastipManual] = useState<number>(
    Number((initial as any)?.hargaJastipManual ?? 0),
  );
  const [hargaJastipMarkup, setHargaJastipMarkup] = useState<number>(
    Number((initial as any)?.hargaJastipMarkup ?? 0),
  );
  const [hargaOngkir, setHargaOngkir] = useState<number>(
    (initial as any)?.hargaOngkir ?? 0,
  );
  const [hargaOngkirMarkup, setHargaOngkirMarkup] = useState<number>(
    Number((initial as any)?.hargaOngkirMarkup ?? 0),
  );

  // Memoized Calculations
  const baseOngkir = useMemo(() => Number(hargaOngkir) || 0, [hargaOngkir]);
  const ceilKg = useMemo(() => Math.ceil(Number(jumlahKg || 0)), [jumlahKg]);

  const totalPembayaran = useMemo(
    () => (Number(hargaJastipMarkup) || 0) + (Number(hargaOngkirMarkup) || 0),
    [hargaJastipMarkup, hargaOngkirMarkup],
  );

  const totalKeuntungan = useMemo(
    () =>
      (Number(hargaJastipMarkup) || 0) +
      (Number(hargaOngkirMarkup) || 0) -
      (Number(hargaJastipManual) || 0) -
      (Number(baseOngkir) || 0),
    [hargaJastipMarkup, hargaOngkirMarkup, hargaJastipManual, baseOngkir],
  );

  const profitNegative = useMemo(
    () => Number.isFinite(totalKeuntungan) && totalKeuntungan < 0,
    [totalKeuntungan],
  );
  const customerEmpty = useMemo(
    () => !String(namaPelanggan || "").trim(),
    [namaPelanggan],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (customerEmpty) {
      alert("Nama Pelanggan wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        id: initial?.id || crypto.randomUUID(),
        no,
        namaBarang,
        kategori,
        tanggal,
        namaPelanggan,
        jumlahKg: num(jumlahKg),
        totalHarga: baseOngkir,
        status,
        pengiriman: pengiriman || "",
        catatan: catatan || "",
        hargaJastip: num(hargaJastipManual),
        hargaJastipMarkup: num(hargaJastipMarkup),
        hargaOngkir: num(baseOngkir),
        hargaOngkirMarkup: num(hargaOngkirMarkup),
        totalKeuntungan,
        totalPembayaran,
        kgCeil: ceilKg,
        tipeNominal: currency,
        _computed: { unitPriceAtSave: unitPrice },
      };
      console.log(payload);

      await Promise.resolve(onSubmit(payload as Order));
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  const customerOptions: Option[] = useMemo(
    () => customers.map((c) => ({ label: c.nama, value: c.nama })),
    [customers],
  );

  return (
    <Modal
      onClose={loading ? () => {} : onClose}
      title={initial ? "Edit Pesanan" : "Tambah Pesanan"}
      size="5xl"
      contentClassName="w-full"
    >
      {/* Tipe Mata Uang Switcher */}
      <div className="px-2 mb-4">
        <label className="block mb-2 text-sm font-medium text-neutral-700">
          Mata Uang Transaksi
        </label>
        <div className="flex p-1 bg-neutral-100 rounded-xl w-fit border border-neutral-200">
          <button
            type="button"
            onClick={() => setCurrency("IDR")}
            className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${currency === "IDR" ? "bg-white text-orange-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
          >
            IDR (Rp)
          </button>
          <button
            type="button"
            onClick={() => setCurrency("JPY")}
            className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${currency === "JPY" ? "bg-white text-red-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
          >
            JPY (¥)
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-2">
        <form
          id="order-form"
          onSubmit={submit}
          className="grid grid-cols-1 gap-6"
        >
          <fieldset disabled={loading} className={loading ? "opacity-70" : ""}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="No Pesanan"
                value={no}
                disabled
                className="bg-neutral-50"
              />
              <Input
                label="Nama Barang"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                required
              />
              <div className="lg:col-span-1">
                <label className="block mb-1 text-sm text-neutral-600">
                  Kategori
                </label>
                <Select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
              </div>
              <Input
                label="Tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
              />
              <div className="lg:col-span-1">
                <SearchableSelect
                  label="Nama Pelanggan *"
                  value={namaPelanggan}
                  onChange={setNamaPelanggan}
                  options={customerOptions}
                  disabled={loading}
                />
              </div>
              <Input
                label="Berat (Kg)"
                type="number"
                step="0.01"
                value={toStr(jumlahKg)}
                onChange={(e) => setJumlahKg(num(e.target.value))}
                required
              />
              <Input
                label="Lokasi Pengiriman"
                value={pengiriman}
                onChange={(e) => setPengiriman(e.target.value)}
                className="lg:col-span-2"
              />
              <div className="lg:col-span-1">
                <label className="block mb-1 text-sm text-neutral-600">
                  Status
                </label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* SEKSI HARGA */}
            <div
              className={`mt-6 rounded-2xl border p-4 bg-white/50 space-y-4 ${currency === "JPY" ? "border-red-100" : "border-orange-100"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <RupiahInput
                  currency={currency}
                  label={`Jastip Asli (${currency})`}
                  value={hargaJastipManual}
                  onChange={setHargaJastipManual}
                />
                <RupiahInput
                  currency={currency}
                  label={`Jastip Nihong (${currency})`}
                  value={hargaJastipMarkup}
                  onChange={setHargaJastipMarkup}
                />
                <RupiahInput
                  currency={currency}
                  label={`Ongkir Asli (${currency})`}
                  value={hargaOngkir}
                  onChange={setHargaOngkir}
                />
                <RupiahInput
                  currency={currency}
                  label={`Ongkir Nihong (${currency})`}
                  value={hargaOngkirMarkup}
                  onChange={setHargaOngkirMarkup}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-neutral-600">
                    Total Pembayaran
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-[#0a2342]/20 bg-white font-bold text-lg text-[#0a2342]">
                    {formatCurrency(totalPembayaran, currency)}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-neutral-600">
                    Total Keuntungan
                  </label>
                  <div
                    className={`px-3 py-2 rounded-xl border font-bold text-lg ${profitNegative ? "border-red-300 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}
                  >
                    {formatCurrency(totalKeuntungan, currency)}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block mb-1 text-sm text-neutral-600">
                    Ringkasan
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-neutral-100 text-xs text-neutral-500 leading-relaxed">
                    Berat: <b>{ceilKg}kg</b> <br />
                    Mata Uang: <b>{currency}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block mb-1 text-sm text-neutral-600">
                Catatan
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-orange-500"
                placeholder="Catatan khusus..."
              />
            </div>
          </fieldset>
        </form>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4 mt-4">
        <Button
          variant="ghost"
          type="button"
          onClick={onClose}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          form="order-form"
          disabled={loading || profitNegative || customerEmpty}
          className={`bg-orange-600 hover:bg-orange-700 text-white ${loading || profitNegative || customerEmpty ? "opacity-50" : ""}`}
        >
          {loading ? "Menyimpan..." : "Simpan Pesanan"}
        </Button>
      </div>
    </Modal>
  );
}
