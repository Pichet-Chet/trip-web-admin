"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { ConfirmDialog, EmptyState, FormInput, Modal, useToast } from "@/components/shared";

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
  { value: "all",        label: "ทั้งหมด",            icon: "grid_view" },
  { value: "restaurant", label: "ร้านอาหาร",           icon: "restaurant" },
  { value: "cafe",       label: "คาเฟ่",               icon: "coffee" },
  { value: "attraction", label: "สถานที่ท่องเที่ยว",    icon: "photo_camera" },
  { value: "hotel",      label: "ที่พัก",               icon: "hotel" },
  { value: "shopping",   label: "ช้อปปิ้ง",            icon: "shopping_bag" },
  { value: "transport",  label: "การเดินทาง",           icon: "directions_bus" },
  { value: "nature",     label: "ธรรมชาติ",             icon: "forest" },
  { value: "other",      label: "อื่นๆ",               icon: "bookmark" },
];

const CAT_COLOR: Record<string, string> = {
  restaurant: "bg-orange-100 text-orange-700",
  cafe:       "bg-amber-100 text-amber-700",
  attraction: "bg-blue-100 text-blue-700",
  hotel:      "bg-purple-100 text-purple-700",
  shopping:   "bg-pink-100 text-pink-700",
  transport:  "bg-slate-100 text-slate-600",
  nature:     "bg-green-100 text-green-700",
  other:      "bg-gray-100 text-gray-600",
};

const CAT_ICON: Record<string, string> = {
  restaurant: "restaurant",
  cafe:       "coffee",
  attraction: "photo_camera",
  hotel:      "hotel",
  shopping:   "shopping_bag",
  transport:  "directions_bus",
  nature:     "forest",
  other:      "bookmark",
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
  const { toast } = useToast();
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
  const [deleteTarget, setDeleteTarget] = useState<SavedPlace | null>(null);
  const [deleting, setDeleting] = useState(false);

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

    if (form.mapsLink && !/^https?:\/\/.+/.test(form.mapsLink.trim())) {
      setSaveError("ลิงก์ Google Maps ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://)");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (editTarget) {
        await api.put(`/admin/me/saved-places/${editTarget.id}`, form);
        setPlaces((prev) => prev.map((p) =>
          p.id === editTarget.id
            ? { ...p, name: form.name, location: form.location || null, category: form.category, note: form.note || null, mapsLink: form.mapsLink || null }
            : p
        ));
      } else {
        await api.post("/admin/me/saved-places", form);
        await load();
      }
      setShowModal(false);
      toast.success(editTarget ? "แก้ไขสถานที่เรียบร้อย" : "เพิ่มสถานที่เรียบร้อย");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/me/saved-places/${deleteTarget.id}`);
      setPlaces((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("ลบสถานที่เรียบร้อย");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setDeleting(false);
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
        places.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="ยังไม่มีสถานที่ที่บันทึกไว้"
            description="บันทึกสถานที่ที่น่าสนใจเพื่อดูภายหลัง"
            actionLabel="เพิ่มสถานที่แรก"
            onAction={openCreate}
            actionIcon="add"
          />
        ) : (
          <EmptyState
            icon="search_off"
            title="ไม่พบสถานที่ที่ค้นหา"
            description="ลองเปลี่ยนคำค้นหาหรือหมวดหมู่"
          />
        )
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((place) => (
          <div key={place.id}
            className="bg-white rounded-2xl border border-(--outline-variant)/20 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${CAT_COLOR[place.category] ?? "bg-gray-100 text-gray-600"}`}>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                {CAT_ICON[place.category] ?? "bookmark"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm text-(--on-surface) truncate">{place.name}</p>
                {/* Actions — always visible (mobile-friendly) */}
                <div className="flex items-center gap-1 shrink-0">
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
                  <button onClick={() => setDeleteTarget(place)}
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
      <Modal
        open={showModal}
        onClose={() => { if (!saving) setShowModal(false); }}
        size="md"
        blocking={saving}
        title={editTarget ? "แก้ไขสถานที่" : "เพิ่มสถานที่"}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              disabled={saving}
              className="flex-1 border border-(--outline-variant)/30 rounded-full py-3 text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-container-low) disabled:opacity-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-(--primary) text-white rounded-full py-3 text-sm font-bold hover:brightness-110 disabled:opacity-60 transition-all"
            >
              {saving ? "กำลังบันทึก..." : editTarget ? "บันทึก" : "เพิ่มสถานที่"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl flex items-start gap-2">
              <span className="material-symbols-outlined text-red-500 text-sm mt-0.5 shrink-0">error</span>
              {saveError}
            </div>
          )}

          <FormInput
            label="ชื่อสถานที่"
            required
            placeholder="เช่น วัดพระแก้ว, ร้าน Yaowarat..."
            icon="place"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">หมวดหมู่</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                <button key={cat.value} type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    form.category === cat.value
                      ? "bg-(--primary) text-white shadow-sm"
                      : "bg-(--surface-container-low) text-(--on-surface-variant) hover:bg-(--surface-container)"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <FormInput
            label="ที่อยู่ / เขต / จังหวัด"
            placeholder="เช่น พระนคร, กรุงเทพฯ"
            icon="location_on"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">โน้ต (ส่วนตัว)</label>
            <textarea
              placeholder="บันทึกความจำ เวลาเปิด-ปิด ราคา ฯลฯ"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={3}
              className="w-full bg-(--surface-container-low) border border-transparent rounded-xl py-4 px-4 text-sm text-(--on-surface) font-medium placeholder:text-(--outline)/40 focus-visible:bg-(--surface) focus-visible:ring-2 focus-visible:ring-(--primary)/20 focus-visible:border-(--primary) outline-none transition-[border-color,box-shadow,background-color] resize-none"
            />
          </div>

          <FormInput
            label="ลิงก์ Google Maps"
            type="url"
            placeholder="https://maps.google.com/..."
            icon="map"
            value={form.mapsLink}
            onChange={(e) => setForm((f) => ({ ...f, mapsLink: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="ลบสถานที่?"
        description={`"${deleteTarget?.name ?? ""}" จะหายถาวร ไม่สามารถกู้คืนได้`}
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
