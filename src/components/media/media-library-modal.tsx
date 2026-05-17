"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

/* ─── Types ─── */
interface MediaItem {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  folder: string;
  altText: string | null;
  uploadedAt: string;
}

interface MediaListResponse {
  items: MediaItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  onMultiSelect?: (urls: string[]) => void;
  multiple?: boolean;
  maxSelect?: number;
  folder?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryModal({ open, onClose, onSelect, onMultiSelect, multiple, maxSelect }: MediaLibraryModalProps): React.ReactNode {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const pageSize = 24;

  const selectedItem = items.find((i) => i.id === selectedId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (folder) params.set("folder", folder);
      if (search) params.set("search", search);

      const [data, folderList] = await Promise.all([
        api.get<MediaListResponse>(`/admin/media?${params}`),
        api.get<string[]>("/admin/media/folders"),
      ]);
      setItems(data.items);
      setTotalCount(data.totalCount);
      setFolders(folderList);

      const allData = await api.get<MediaListResponse>("/admin/media?page=1&pageSize=1");
      setAllCount(allData.totalCount);

      const counts: Record<string, number> = {};
      for (const f of folderList) {
        const c = await api.get<MediaListResponse>(`/admin/media?folder=${encodeURIComponent(f)}&page=1&pageSize=1`);
        counts[f] = c.totalCount;
      }
      setFolderCounts(counts);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [page, folder, search]);

  useEffect(() => { if (open) load(); }, [open, load]);
  useEffect(() => { if (open) { setSelectedId(null); setSelectedIds(new Set()); setPage(1); setSearch(""); setFolder(""); } }, [open]);

  const totalPages = Math.ceil(totalCount / pageSize);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--outline-variant)/20 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-(--on-surface)">คลังสื่อ</h3>
            <p className="text-xs text-(--on-surface-variant) mt-0.5">{allCount} ไฟล์</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-(--surface-variant) transition-colors">
            <span className="material-symbols-outlined text-(--on-surface-variant)">close</span>
          </button>
        </div>

        {/* Search + Folder Tabs */}
        <div className="px-5 py-3 border-b border-(--outline-variant)/10 space-y-3 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-(--on-surface-variant) text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหาไฟล์..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-(--surface-container-low) border border-transparent text-sm font-medium text-(--on-surface) placeholder:text-(--outline)/40 outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => { setFolder(""); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${!folder ? "bg-(--primary) text-(--on-primary)" : "bg-(--surface-variant)/50 text-(--on-surface-variant) hover:bg-(--surface-variant)"}`}
            >
              <span className="material-symbols-outlined text-sm">photo_library</span>
              ทั้งหมด
              <span className="opacity-60">{allCount}</span>
            </button>
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => { setFolder(f); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${folder === f ? "bg-(--primary) text-(--on-primary)" : "bg-(--surface-variant)/50 text-(--on-surface-variant) hover:bg-(--surface-variant)"}`}
              >
                <span className="material-symbols-outlined text-sm">folder</span>
                {f}
                <span className="opacity-60">{folderCounts[f] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-(--surface-variant)/30 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <span className="material-symbols-outlined text-5xl text-(--outline-variant) mb-3">photo_library</span>
              <p className="text-sm font-bold text-(--on-surface-variant)">
                {folder ? `ยังไม่มีไฟล์ในโฟลเดอร์ "${folder}"` : "ยังไม่มีไฟล์ในคลังสื่อ"}
              </p>
              <p className="text-xs text-(--on-surface-variant) mt-1">อัปโหลดรูปภาพจากหน้าต่างๆ แล้วจะปรากฏที่นี่</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {items.map((item) => {
                const isSelected = multiple ? selectedIds.has(item.id) : selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (multiple) {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) { next.delete(item.id); }
                          else if (!maxSelect || next.size < maxSelect) { next.add(item.id); }
                          return next;
                        });
                      } else {
                        setSelectedId(selectedId === item.id ? null : item.id);
                      }
                    }}
                    className={`relative group overflow-hidden rounded-xl text-left transition-all ${
                      isSelected ? "ring-2 ring-(--primary) ring-offset-2 shadow-lg" : "hover:shadow-md"
                    }`}
                  >
                    <div className="aspect-square bg-(--surface-variant)/30">
                      <img src={item.url} alt={item.altText || item.fileName} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-(--primary) flex items-center justify-center shadow">
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      </div>
                    )}
                    <div className="px-2 py-1.5 bg-white">
                      <p className="text-[10px] font-medium text-(--on-surface) truncate">{item.fileName}</p>
                      <p className="text-[9px] text-(--on-surface-variant)">{formatSize(item.fileSizeBytes)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-2 border-t border-(--outline-variant)/10 shrink-0">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-(--on-surface-variant) hover:bg-(--surface-variant) disabled:opacity-30 transition-all">ก่อนหน้า</button>
            <span className="text-xs font-bold text-(--on-surface-variant)">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-(--on-surface-variant) hover:bg-(--surface-variant) disabled:opacity-30 transition-all">ถัดไป</button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-(--outline-variant)/20 bg-(--surface-container-lowest) shrink-0">
          <div className="text-sm text-(--on-surface-variant) min-w-0 truncate">
            {multiple ? (
              selectedIds.size > 0 ? (
                <span className="font-medium">เลือก {selectedIds.size} รูป{maxSelect ? ` (สูงสุด ${maxSelect})` : ""}</span>
              ) : (
                <span>เลือกรูปภาพจากคลังสื่อ{maxSelect ? ` (สูงสุด ${maxSelect} รูป)` : ""}</span>
              )
            ) : selectedItem ? (
              <span className="font-medium">{selectedItem.fileName} · {selectedItem.width}x{selectedItem.height} · {formatSize(selectedItem.fileSizeBytes)}</span>
            ) : (
              <span>เลือกรูปภาพจากคลังสื่อ</span>
            )}
          </div>
          <div className="flex gap-3 shrink-0 ml-4">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-variant) transition-colors">ยกเลิก</button>
            {multiple ? (
              <button
                onClick={() => {
                  if (selectedIds.size > 0 && onMultiSelect) {
                    const urls = items.filter((i) => selectedIds.has(i.id)).map((i) => i.url);
                    onMultiSelect(urls);
                    onClose();
                  }
                }}
                disabled={selectedIds.size === 0}
                className="px-5 py-2.5 rounded-xl bg-(--primary) text-(--on-primary) text-sm font-bold hover:opacity-90 disabled:opacity-30 transition-all"
              >
                เลือก {selectedIds.size > 0 ? `${selectedIds.size} รูป` : "รูป"}
              </button>
            ) : (
              <button
                onClick={() => { if (selectedItem) { onSelect(selectedItem.url); onClose(); } }}
                disabled={!selectedItem}
                className="px-5 py-2.5 rounded-xl bg-(--primary) text-(--on-primary) text-sm font-bold hover:opacity-90 disabled:opacity-30 transition-all"
              >
                เลือกรูปนี้
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
