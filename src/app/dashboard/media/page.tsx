"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/shared/toast";
import { Skeleton, ConfirmDialog, EmptyState, Pagination } from "@/components/shared";

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";

export default function MediaPage(): React.ReactNode {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [contextFolder, setContextFolder] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const pageSize = 24;

  const selectedItem = items.find((i) => i.id === selectedId);
  const totalPages = Math.ceil(totalCount / pageSize);

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

      // Get counts per folder
      const counts: Record<string, number> = {};
      for (const f of folderList) {
        const c = await api.get<MediaListResponse>(`/admin/media?folder=${encodeURIComponent(f)}&page=1&pageSize=1`);
        counts[f] = c.totalCount;
      }
      // Total count (all)
      const allData = await api.get<MediaListResponse>("/admin/media?page=1&pageSize=1");
      counts["__all__"] = allData.totalCount;
      setFolderCounts(counts);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ไม่สามารถโหลดข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  }, [page, folder, search, toast]);

  useEffect(() => { load(); }, [load]);

  /* ─── Upload ─── */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let lastError = "";

    for (const file of Array.from(files)) {
      try {
        const { getValidToken } = await import("@/lib/auth");
        const token = await getValidToken();
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_URL}/admin/media/upload?folder=${folder || "general"}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) {
          successCount++;
        } else {
          lastError = json.error || "อัปโหลดไม่สำเร็จ";
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (successCount > 0) {
      toast(`อัปโหลดสำเร็จ ${successCount} ไฟล์`);
      load();
    } else if (lastError) {
      toast(lastError, "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/media/${deleteTarget.id}`);
      toast("ลบสำเร็จ");
      setDeleteTarget(null);
      setSelectedId(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ", "error");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast("คัดลอก URL แล้ว");
  }

  function downloadFile(url: string, fileName: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, ".webp");
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await api.post("/admin/media/folders", { name });
      setFolder(name);
      setShowNewFolder(false);
      setNewFolderName("");
      toast(`สร้างโฟลเดอร์ "${name}" สำเร็จ`);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "สร้างโฟลเดอร์ไม่สำเร็จ", "error");
    }
  }

  async function handleRenameFolder() {
    if (!renamingFolder || !renameFolderValue.trim()) return;
    try {
      await api.put("/admin/media/folders/rename", { oldName: renamingFolder, newName: renameFolderValue.trim() });
      toast("เปลี่ยนชื่อโฟลเดอร์สำเร็จ");
      if (folder === renamingFolder) setFolder(renameFolderValue.trim());
      setRenamingFolder(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "เปลี่ยนชื่อไม่สำเร็จ", "error");
    }
  }

  async function handleDeleteFolder(name: string) {
    try {
      await api.delete(`/admin/media/folders/${encodeURIComponent(name)}`);
      toast("ลบโฟลเดอร์สำเร็จ ไฟล์ถูกย้ายไปทั้งหมด");
      if (folder === name) setFolder("");
      setContextFolder(null);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ", "error");
    }
  }

  async function handleMoveToFolder(mediaId: string, targetFolder: string) {
    try {
      await api.put(`/admin/media/${mediaId}/move`, { folder: targetFolder });
      toast("ย้ายไฟล์สำเร็จ");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ย้ายไม่สำเร็จ", "error");
    }
  }

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4rem)]">
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleUpload} className="hidden" />

      <div className="flex h-full gap-0 rounded-2xl border border-(--outline-variant)/30 bg-white overflow-hidden shadow-sm">

        {/* ═══ Left: Folder Tree ═══ */}
        <div className="w-64 shrink-0 border-r border-(--outline-variant)/20 flex flex-col bg-(--surface-container-lowest)">
          {/* Sidebar header */}
          <div className="p-4 border-b border-(--outline-variant)/20">
            <h2 className="text-sm font-bold text-(--on-surface)">โฟลเดอร์</h2>
          </div>

          {/* Folder list */}
          <nav className="flex-1 overflow-y-auto py-2">
            {/* All files */}
            <button
              onClick={() => { setFolder(""); setPage(1); setSelectedId(null); }}
              onDragOver={(e) => { e.preventDefault(); setDragOverFolder("__all__"); }}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverFolder(null);
                const mediaId = e.dataTransfer.getData("mediaId");
                if (mediaId) handleMoveToFolder(mediaId, "general");
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                dragOverFolder === "__all__"
                  ? "bg-(--primary)/15 text-(--primary) ring-2 ring-(--primary)/30 ring-inset"
                  : !folder ? "bg-(--primary)/8 text-(--primary) font-bold border-r-3 border-(--primary)" : "text-(--on-surface-variant) hover:bg-(--surface-variant)/50"
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={!folder ? { fontVariationSettings: "'FILL' 1" } : undefined}>photo_library</span>
              <span className="flex-1 text-sm">ทั้งหมด</span>
              <span className="text-xs font-semibold text-(--on-surface-variant)/60">{folderCounts["__all__"] ?? 0}</span>
            </button>

            {/* Folders */}
            {folders.map((f) => (
              <div key={f} className="relative group">
                <button
                  onClick={() => { setFolder(f); setPage(1); setSelectedId(null); }}
                  onContextMenu={(e) => { e.preventDefault(); setContextFolder(contextFolder === f ? null : f); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverFolder(f); }}
                  onDragLeave={() => setDragOverFolder(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverFolder(null);
                    const mediaId = e.dataTransfer.getData("mediaId");
                    if (mediaId) handleMoveToFolder(mediaId, f);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                    dragOverFolder === f
                      ? "bg-(--primary)/15 text-(--primary) ring-2 ring-(--primary)/30 ring-inset"
                      : folder === f ? "bg-(--primary)/8 text-(--primary) font-bold border-r-3 border-(--primary)" : "text-(--on-surface-variant) hover:bg-(--surface-variant)/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg" style={folder === f || dragOverFolder === f ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {dragOverFolder === f ? "folder_open" : "folder"}
                  </span>
                  <span className="flex-1 text-sm truncate">{f}</span>
                  <span className="text-xs font-semibold text-(--on-surface-variant)/60">{folderCounts[f] ?? 0}</span>
                  {/* More button */}
                  <span
                    onClick={(e) => { e.stopPropagation(); setContextFolder(contextFolder === f ? null : f); }}
                    className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 text-(--on-surface-variant) hover:text-(--on-surface) transition-all"
                  >
                    more_vert
                  </span>
                </button>

                {/* Context menu */}
                {contextFolder === f && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setContextFolder(null)} />
                    <div className="absolute right-2 top-10 z-50 bg-white rounded-xl shadow-xl border border-(--outline-variant)/30 py-1 w-40">
                      <button
                        onClick={() => { setRenamingFolder(f); setRenameFolderValue(f); setContextFolder(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-(--on-surface) hover:bg-(--surface-variant)/50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        เปลี่ยนชื่อ
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(f)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        ลบโฟลเดอร์
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </nav>

          {/* New folder */}
          <div className="p-3 border-t border-(--outline-variant)/20">
            {showNewFolder ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); } }}
                  placeholder="ชื่อโฟลเดอร์"
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-(--outline-variant)/30 text-xs font-medium text-(--on-surface) outline-none focus:border-(--primary) transition-all"
                />
                <button onClick={handleCreateFolder} className="w-8 h-8 rounded-lg bg-(--primary) text-(--on-primary) flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">check</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewFolder(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-(--on-surface-variant) hover:bg-(--surface-variant)/50 border border-dashed border-(--outline-variant)/30 transition-all"
              >
                <span className="material-symbols-outlined text-base">create_new_folder</span>
                สร้างโฟลเดอร์
              </button>
            )}
          </div>
        </div>

        {/* ═══ Right: Content Area ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-(--outline-variant)/20">
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-(--on-surface-variant) text-lg">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ค้นหาชื่อไฟล์..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-(--surface-container-low) border border-transparent text-sm font-medium text-(--on-surface) placeholder:text-(--outline)/40 outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 transition-all"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-(--on-surface-variant) font-medium">{totalCount} ไฟล์</span>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--on-primary) rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-base">{uploading ? "hourglass_top" : "cloud_upload"}</span>
                {uploading ? "อัปโหลด..." : "อัปโหลด"}
              </button>
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="material-symbols-outlined text-5xl text-(--outline-variant) mb-3">photo_library</span>
                <p className="text-sm font-bold text-(--on-surface-variant)">
                  {folder ? `ยังไม่มีไฟล์ในโฟลเดอร์ "${folder}"` : "ยังไม่มีไฟล์ในคลังสื่อ"}
                </p>
                <p className="text-xs text-(--on-surface-variant) mt-1">ลากไฟล์มาวาง หรือกดปุ่มอัปโหลด</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-4 px-5 py-2.5 bg-(--primary) text-(--on-primary) rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                >
                  อัปโหลดไฟล์
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("mediaId", item.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                    className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all ${
                      selectedId === item.id
                        ? "ring-2 ring-(--primary) ring-offset-2 shadow-lg"
                        : "hover:shadow-md"
                    }`}
                  >
                    <div className="aspect-square bg-(--surface-variant)/30">
                      <img src={item.url} alt={item.fileName} className="w-full h-full object-cover" loading="lazy" />
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />

                    {/* Selected check */}
                    {selectedId === item.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-(--primary) flex items-center justify-center shadow">
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadFile(item.url, item.fileName); }}
                        className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white"
                        title="ดาวน์โหลด"
                      >
                        <span className="material-symbols-outlined text-xs text-(--on-surface)">download</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}
                        className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white"
                        title="คัดลอก URL"
                      >
                        <span className="material-symbols-outlined text-xs text-(--on-surface)">content_copy</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                        className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white"
                        title="ลบ"
                      >
                        <span className="material-symbols-outlined text-xs text-red-500">delete</span>
                      </button>
                    </div>

                    {/* File name */}
                    <div className="px-2.5 py-2 bg-white">
                      <p className="text-[11px] font-medium text-(--on-surface) truncate">{item.fileName}</p>
                      <p className="text-[10px] text-(--on-surface-variant)">{formatSize(item.fileSizeBytes)} · {item.contentType === "image/webp" ? "WebP" : item.contentType.split("/")[1]?.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-(--outline-variant)/20">
              <Pagination currentPage={page} totalPages={totalPages} totalItems={totalCount} pageSize={pageSize} onPageChange={setPage} />
            </div>
          )}

          {/* Detail panel at bottom */}
          {selectedItem && (
            <div className="border-t border-(--outline-variant)/20 bg-(--surface-container-lowest) px-5 py-4">
              <div className="flex items-center gap-5">
                <img src={selectedItem.url} alt={selectedItem.altText || selectedItem.fileName} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-sm text-(--on-surface) truncate">{selectedItem.fileName}</p>
                    <p className="text-xs text-(--on-surface-variant) shrink-0">
                      {selectedItem.width}x{selectedItem.height} · {formatSize(selectedItem.fileSizeBytes)} · {selectedItem.contentType === "image/webp" ? "WebP" : selectedItem.contentType.split("/")[1]?.toUpperCase()}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={selectedItem.altText || ""}
                    onChange={(e) => setItems((prev) => prev.map((m) => m.id === selectedItem.id ? { ...m, altText: e.target.value } : m))}
                    onBlur={(e) => { api.put(`/admin/media/${selectedItem.id}/alt`, { altText: e.target.value || null }).catch(() => toast("บันทึก Alt Text ไม่สำเร็จ", "error")); }}
                    placeholder="Alt Text (สำหรับ SEO) เช่น ทริปญี่ปุ่น วัดคินคาคุจิ..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-(--outline-variant)/30 text-xs text-(--on-surface) placeholder:text-(--outline)/40 outline-none focus:border-(--primary) focus:ring-1 focus:ring-(--primary)/20 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Move to folder */}
                  <select
                    value={selectedItem.folder}
                    onChange={(e) => handleMoveToFolder(selectedItem.id, e.target.value)}
                    className="px-3 py-2 rounded-lg bg-(--surface-variant)/50 text-(--on-surface-variant) text-xs font-bold border-none outline-none cursor-pointer"
                  >
                    <option value="general">ทั้งหมด</option>
                    {folders.filter((f) => f !== "general").map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <button onClick={() => downloadFile(selectedItem.url, selectedItem.fileName)} className="px-3 py-2 rounded-lg bg-(--on-surface) text-(--surface) text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">download</span>
                    ดาวน์โหลด
                  </button>
                  <button onClick={() => copyUrl(selectedItem.url)} className="px-3 py-2 rounded-lg bg-(--surface-variant)/50 text-(--on-surface-variant) text-xs font-bold hover:bg-(--surface-variant) transition-colors">
                    คัดลอก URL
                  </button>
                  <button onClick={() => setDeleteTarget(selectedItem)} className="px-3 py-2 rounded-lg text-red-600 bg-red-50 text-xs font-bold hover:bg-red-100 transition-colors">
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rename Folder Modal */}
      {renamingFolder && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={() => setRenamingFolder(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-(--on-surface)">เปลี่ยนชื่อโฟลเดอร์</h3>
            <input
              type="text"
              value={renameFolderValue}
              onChange={(e) => setRenameFolderValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-(--surface-container-low) border border-transparent text-sm font-medium text-(--on-surface) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 transition-all"
            />
            <div className="flex gap-3">
              <button onClick={() => setRenamingFolder(null)} className="flex-1 py-3 rounded-xl border border-(--outline-variant)/30 text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-variant)/50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleRenameFolder} className="flex-1 py-3 rounded-xl bg-(--primary) text-(--on-primary) text-sm font-bold hover:opacity-90 transition-opacity">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="ลบไฟล์"
        description={`คุณต้องการลบ "${deleteTarget?.fileName}" ใช่หรือไม่? ไฟล์จะถูกลบออกจากคลังสื่อถาวร`}
        confirmLabel="ลบ"
        variant="danger"
      />
    </div>
  );
}
