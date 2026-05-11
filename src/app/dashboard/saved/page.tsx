"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";

interface SavedPlace {
  id: string;
  name: string;
  location: string | null;
  category: string;
  note: string | null;
  mapsLink: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: "all", label: "ทั้งหมด", icon: "grid_view" },
  { value: "attraction", label: "สถานที่ท่องเที่ยว", icon: "photo_camera" },
  { value: "restaurant", label: "ร้านอาหาร", icon: "restaurant" },
  { value: "hotel", label: "ที่พัก", icon: "hotel" },
  { value: "shopping", label: "ช้อปปิ้ง", icon: "shopping_bag" },
  { value: "transport", label: "การเดินทาง", icon: "directions_bus" },
  { value: "nature", label: "ธรรมชาติ", icon: "forest" },
  { value: "other", label: "อื่นๆ", icon: "bookmark" },
];

const CAT_COLOR: Record<string, string> = {
  attraction: "bg-blue-100 text-blue-700",
  restaurant: "bg-orange-100 text-orange-700",
  hotel: "bg-purple-100 text-purple-700",
  shopping: "bg-pink-100 text-pink-700",
  transport: "bg-slate-100 text-slate-600",
  nature: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-600",
};

const CAT_ICON: Record<string, string> = {
  attraction: "photo_camera",
  restaurant: "restaurant",
  hotel: "hotel",
  shopping: "shopping_bag",
  transport: "directions_bus",
  nature: "forest",
  other: "bookmark",
};

function catLabel(c: string) {
  return CATEGORIES.find((x) => x.value === c)?.label ?? c;
}

interface FormState {
  name: string;
  location: string;
  category: string;
  note: string;
  mapsLink: string;
}

const EMPTY_FORM: FormState = { name: "", location: "", category: "other", note: "", mapsLink: "" };

export default function SavedPage(): React.ReactNode {
  usePageTitle("สถานที่บันทึก");
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SavedPlace | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<SavedPlace[]>("/admin/me/saved-places");
      setPlaces(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = places.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) ||
      (p.location?.toLowerCase().includes(q) ?? false) ||
      (p.note?.toLowerCase().includes(q) ?? false);
    return matchCat && matchSearch;
  });

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setShowModal(true);
  }

  function openEdit(place: SavedPlace) {
    setEditTarget(place);
    setForm({ name: place.name, location: place.location ?? "", category: place.category, note: place.note ?? "", mapsLink: place.mapsLink ?? "" });
    setSaveError(null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setSaveError("กรุณากรอกชื่อสถานที่"); return; }
    setSaving(true);
    setSaveError(null);
    try {
      if (editTarget) {
        await api.put(`/admin/me/saved-places/${editTarget.id}`, form);
      } else {
        await api.post("/admin/me/saved-places", form);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/admin/me/saved-places/${id}`);
      setDeleteId(null);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently ignore
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-(--on-surface)">สถานที่บันทึก</h1>
          {places.length > 0 && (
            <span className="bg-(--primary)/10 text-(--primary) text-xs font-bold px-2 py-0.5 rounded-full">{places.length}</span>
          )}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-(--primary) text-white text-sm font-bold px-4 py-2.5 rounded-full hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-base">add</span>
          เพิ่ม
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-(--on-surface-variant)/50 text-lg">search</span>
        <input
          type="text"
          placeholder="ค้นหาสถานที่..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-(--outline-variant)/30 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary)"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const count = cat.value === "all" ? places.length : places.filter((p) => p.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                activeCategory === cat.value
                  ? "bg-(--primary) text-white shadow-sm"
                  : "bg-white border border-(--outline-variant)/20 text-(--on-surface-variant) hover:border-(--primary)/30"
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
              {cat.label}
              {count > 0 && <span className={`ml-0.5 text-[10px] font-black ${activeCategory === cat.value ? "opacity-70" : "opacity-50"}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-(--primary)/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-(--primary) text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
          </div>
          <p className="text-(--on-surface-variant) text-sm">
            {search || activeCategory !== "all" ? "ไม่พบสถานที่ที่ค้นหา" : "ยังไม่มีสถานที่ที่บันทึกไว้"}
          </p>
          {!search && activeCategory === "all" && (
            <button onClick={openCreate} className="mt-4 text-(--primary) text-sm font-bold hover:underline">
              + เพิ่มสถานที่แรก
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((place) => (
          <div key={place.id}
            className="bg-white rounded-2xl border border-(--outline-variant)/20 p-4 flex items-start gap-3 group hover:shadow-sm transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${CAT_COLOR[place.category] ?? "bg-gray-100 text-gray-600"}`}>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                {CAT_ICON[place.category] ?? "bookmark"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm text-(--on-surface) truncate">{place.name}</p>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {place.mapsLink && (
                    <a href={place.mapsLink} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-(--primary)" title="เปิด Maps">
                      <span className="material-symbols-outlined text-base">map</span>
                    </a>
                  )}
                  <button onClick={() => openEdit(place)}
                    className="p-1.5 rounded-lg hover:bg-(--surface-variant) text-(--on-surface-variant)" title="แก้ไข">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button onClick={() => setDeleteId(place.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="ลบ">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
              {place.location && (
                <p className="text-xs text-(--on-surface-variant) mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {place.location}
                </p>
              )}
              {place.note && <p className="text-xs text-(--on-surface-variant)/70 mt-1 line-clamp-2">{place.note}</p>}
              <p className="text-[10px] text-(--on-surface-variant)/40 mt-1.5">
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium mr-1.5 ${CAT_COLOR[place.category] ?? ""}`}>
                  {catLabel(place.category)}
                </span>
                บันทึกเมื่อ {new Date(place.createdAt).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg text-(--on-surface)">{editTarget ? "แก้ไขสถานที่" : "เพิ่มสถานที่"}</h2>

            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{saveError}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-(--on-surface-variant) mb-1 block">ชื่อสถานที่ *</label>
                <input type="text" placeholder="เช่น วัดพระแก้ว, ร้าน Yaowarat..."
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-(--outline-variant)/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-(--on-surface-variant) mb-1 block">หมวดหมู่</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                    <button key={cat.value} type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        form.category === cat.value ? "bg-(--primary) text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-(--on-surface-variant) mb-1 block">ที่อยู่ / เขต / จังหวัด</label>
                <input type="text" placeholder="เช่น พระนคร, กรุงเทพฯ"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full border border-(--outline-variant)/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-(--on-surface-variant) mb-1 block">โน้ต (ส่วนตัว)</label>
                <textarea placeholder="บันทึกความจำ เวลาเปิด-ปิด ราคา ฯลฯ"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={3}
                  className="w-full border border-(--outline-variant)/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)/20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-(--on-surface-variant) mb-1 block">ลิงก์ Google Maps</label>
                <input type="url" placeholder="https://maps.google.com/..."
                  value={form.mapsLink}
                  onChange={(e) => setForm((f) => ({ ...f, mapsLink: e.target.value }))}
                  className="w-full border border-(--outline-variant)/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-(--outline-variant)/30 rounded-full py-3 text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-container-low) transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-(--primary) text-white rounded-full py-3 text-sm font-bold hover:brightness-110 disabled:opacity-60 transition-all">
                {saving ? "กำลังบันทึก..." : editTarget ? "บันทึก" : "เพิ่มสถานที่"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-red-500 text-2xl">delete</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">ลบสถานที่?</h3>
              <p className="text-sm text-(--on-surface-variant) mt-1">ข้อมูลจะหายถาวร ไม่สามารถกู้คืนได้</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-(--outline-variant)/30 rounded-full py-3 text-sm font-bold hover:bg-slate-50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 text-white rounded-full py-3 text-sm font-bold hover:bg-red-600 transition-all">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
