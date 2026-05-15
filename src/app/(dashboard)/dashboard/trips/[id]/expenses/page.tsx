"use client";

import { use, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  EmptyState,
  PageSkeleton,
  ConfirmDialog,
  useToast,
  Drawer,
  Tabs,
  SegmentedControl,
  Banner,
  Spinner,
  Button,
  FormInput,
  DatePicker,
  SelectPicker,
  Checkbox,
  Avatar,
  IconButton,
} from "@/components/shared";
import type { TabItem, SelectOption } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";

/* ─── Types ─── */
interface Follower {
  id: string;
  displayName: string;
  channel: string;
  groupRole?: string | null;
}

const isMember = (channel: string) => channel.toLowerCase() === "member";

interface ParticipantResponse {
  followerId: string;
  displayName: string;
  share: number;
  owedAmount: number;
}

interface Expense {
  id: string;
  paidByFollowerId: string;
  paidByName: string;
  amount: number;
  currency: string;
  description: string;
  occurredOn: string;
  splitMode: "equal" | "shares" | "exact";
  participants: ParticipantResponse[];
  createdAt: string;
}

interface BalanceSummary {
  followerId: string;
  displayName: string;
  netBalance: number;
  totalPaid: number;
  totalOwed: number;
}

interface SettlementTransaction {
  fromFollowerId: string;
  fromName: string;
  toFollowerId: string;
  toName: string;
  amount: number;
  currency: string;
}

interface SettlementResponse {
  balances: BalanceSummary[];
  transactions: SettlementTransaction[];
}

const SPLIT_MODES: { value: "equal" | "shares" | "exact"; label: string }[] = [
  { value: "equal", label: "แชร์เท่ากัน" },
  { value: "shares", label: "ตามสัดส่วน" },
  { value: "exact", label: "กำหนดเอง" },
];

const CURRENCY_OPTIONS: SelectOption[] = ["THB", "USD", "EUR", "JPY", "SGD", "HKD", "CNY", "GBP", "KRW", "AUD"].map((c) => ({
  value: c,
  label: c,
}));

const TAB_ITEMS: TabItem[] = [
  { id: "expenses", label: "รายการค่าใช้จ่าย", icon: "receipt_long" },
  { id: "settlement", label: "คำนวณหนี้", icon: "calculate" },
];

const fmtAmount = (n: number, currency = "THB") =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

/* ─── Page ─── */
export default function ExpensesPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id: tripId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  usePageTitle("ค่าใช้จ่ายกลุ่ม");

  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlement, setSettlement] = useState<SettlementResponse | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"expenses" | "settlement">("expenses");

  /* ─── Add expense form state ─── */
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paidBy, setPaidBy] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("THB");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().slice(0, 10));
  const [splitMode, setSplitMode] = useState<"equal" | "shares" | "exact">("equal");
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [participantShares, setParticipantShares] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setPaidBy("");
    setAmount("");
    setCurrency("THB");
    setDescription("");
    setOccurredOn(new Date().toISOString().slice(0, 10));
    setSplitMode("equal");
    setSelectedParticipants(new Set(followers.filter((f) => isMember(f.channel)).map((f) => f.id)));
    setParticipantShares({});
  }, [followers]);

  /* ─── Load ─── */
  const reload = useCallback(async () => {
    const [f, e] = await Promise.all([
      api.get<Follower[]>(`/admin/trips/${tripId}/followers`),
      api.get<Expense[]>(`/admin/trips/${tripId}/expenses`),
    ]);
    setFollowers(f);
    setExpenses(e);
    setSelectedParticipants(new Set(f.filter((x) => isMember(x.channel)).map((x) => x.id)));
  }, [tripId]);

  useEffect(() => {
    reload()
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [reload, toast]);

  const loadSettlement = useCallback(async () => {
    setSettlementLoading(true);
    try {
      const data = await api.get<SettlementResponse>(`/admin/trips/${tripId}/expenses/settlement`);
      setSettlement(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "คำนวณไม่สำเร็จ");
    } finally {
      setSettlementLoading(false);
    }
  }, [tripId, toast]);

  useEffect(() => {
    if (activeTab === "settlement") loadSettlement();
  }, [activeTab, loadSettlement]);

  /* ─── Derived ─── */
  const totalAmount = useMemo(() =>
    expenses.reduce((s, e) => (e.currency === (expenses[0]?.currency ?? "THB") ? s + e.amount : s), 0),
    [expenses]);

  /* ─── Form helpers ─── */
  function openNew() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(e: Expense) {
    setEditingId(e.id);
    setPaidBy(e.paidByFollowerId);
    setAmount(String(e.amount));
    setCurrency(e.currency);
    setDescription(e.description);
    setOccurredOn(e.occurredOn);
    setSplitMode(e.splitMode);
    const sel = new Set(e.participants.map((p) => p.followerId));
    setSelectedParticipants(sel);
    const shares: Record<string, string> = {};
    for (const p of e.participants) shares[p.followerId] = String(p.share);
    setParticipantShares(shares);
    setShowForm(true);
  }

  function toggleParticipant(id: string) {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!paidBy || !amount || !description || selectedParticipants.size === 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("จำนวนเงินไม่ถูกต้อง");
      return;
    }

    const participants = Array.from(selectedParticipants).map((fid) => ({
      followerId: fid,
      share: splitMode === "equal" ? 1 : parseFloat(participantShares[fid] ?? "1") || 1,
    }));

    setSaving(true);
    try {
      const body = {
        paidByFollowerId: paidBy,
        amount: parsedAmount,
        currency,
        description,
        occurredOn,
        splitMode,
        participants,
      };
      if (editingId) {
        await api.put(`/admin/trips/${tripId}/expenses/${editingId}`, body);
      } else {
        await api.post(`/admin/trips/${tripId}/expenses`, body);
      }
      toast.success(editingId ? "อัปเดตเรียบร้อย" : "เพิ่มรายการเรียบร้อย");
      setShowForm(false);
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/trips/${tripId}/expenses/${deleteId}`);
      toast.success("ลบเรียบร้อย");
      setDeleteId(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ");
    }
  }

  if (loading) return <PageSkeleton />;

  /* ─── Derived (render-time) ─── */
  const memberFollowers = followers.filter((f) => isMember(f.channel));
  const followerOptions: SelectOption[] = memberFollowers.map((f) => ({
    value: f.id,
    label: f.displayName + (f.groupRole ? ` (${f.groupRole})` : ""),
  }));

  /* ─── Render ─── */
  return (
    <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <IconButton icon="arrow_back" onClick={() => router.back()} aria-label="กลับ" />
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-(--on-surface)">ค่าใช้จ่ายกลุ่ม</h1>
            <p className="text-xs text-(--on-surface-variant) mt-0.5">
              {expenses.length} รายการ · {expenses.length > 0 ? fmtAmount(totalAmount, expenses[0].currency) : "—"}
            </p>
          </div>
          <Button icon="add" onClick={openNew}>เพิ่มรายการ</Button>
        </div>

        {/* No members warning */}
        {memberFollowers.length === 0 && (
          <Banner variant="warning" icon="group_off" title="ยังไม่มีสมาชิกทริป" className="mb-4">
            ต้องมีสมาชิกที่เข้าร่วมด้วยบัญชีก่อน จึงจะบันทึกค่าใช้จ่ายร่วมได้
          </Banner>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <Tabs
            items={TAB_ITEMS}
            value={activeTab}
            onChange={(id) => setActiveTab(id as "expenses" | "settlement")}
            variant="pill"
          />
        </div>

        {/* ─── Expenses tab ─── */}
        {activeTab === "expenses" && (
          <>
            {expenses.length === 0 ? (
              <EmptyState
                icon="receipt_long"
                title="ยังไม่มีรายการค่าใช้จ่าย"
                description='กด "เพิ่มรายการ" เพื่อบันทึกค่าใช้จ่ายกลุ่ม เช่น ค่ารถ ค่าอาหาร ค่าที่พัก'
              />
            ) : (
              <div className="space-y-3">
                {expenses.map((e) => (
                  <div key={e.id} className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-(--on-surface) truncate">{e.description}</p>
                        <p className="text-[11px] text-(--on-surface-variant) mt-0.5">
                          {fmtDate(e.occurredOn)} · จ่ายโดย <span className="font-semibold">{e.paidByName}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-(--primary)">{fmtAmount(e.amount, e.currency)}</p>
                        <p className="text-[10px] text-(--on-surface-variant)">{SPLIT_MODES.find((s) => s.value === e.splitMode)?.label}</p>
                      </div>
                    </div>
                    {/* Participant breakdown */}
                    {e.participants.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-(--outline-variant)/20 flex flex-wrap gap-1.5">
                        {e.participants.map((p) => (
                          <span key={p.followerId} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-(--surface-variant)/60 text-(--on-surface-variant)">
                            {p.displayName}
                            <span className="font-bold text-(--on-surface)">{fmtAmount(p.owedAmount, e.currency)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" icon="edit" onClick={() => openEdit(e)}>แก้ไข</Button>
                      <Button variant="danger" size="sm" icon="delete" onClick={() => setDeleteId(e.id)}>ลบ</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Settlement tab ─── */}
        {activeTab === "settlement" && (
          settlementLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" color="primary" />
            </div>
          ) : !settlement || (settlement.balances.length === 0) ? (
            <EmptyState
              icon="calculate"
              title="ยังไม่มีข้อมูล"
              description="เพิ่มค่าใช้จ่ายก่อนเพื่อคำนวณหนี้"
            />
          ) : (
            <div className="space-y-6">
              {/* Balance summary */}
              <section className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-(--on-surface) mb-4">ยอดคงค้างต่อคน</h2>
                <div className="space-y-2">
                  {settlement.balances.map((b) => (
                    <div key={b.followerId} className="flex items-center gap-3">
                      <Avatar name={b.displayName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-(--on-surface) truncate">{b.displayName}</p>
                        <p className="text-[11px] text-(--on-surface-variant)">
                          จ่าย {fmtAmount(b.totalPaid)} · แชร์ {fmtAmount(b.totalOwed)}
                        </p>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${b.netBalance > 0.005 ? "text-emerald-600" : b.netBalance < -0.005 ? "text-rose-600" : "text-(--on-surface-variant)"}`}>
                        {b.netBalance > 0.005 ? "+" : ""}{fmtAmount(b.netBalance)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Settlement transactions */}
              <section className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-(--primary)">swap_horiz</span>
                  วิธีชำระให้จบ ({settlement.transactions.length} รายการ)
                </h2>
                {settlement.transactions.length === 0 ? (
                  <p className="text-sm text-emerald-600 font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    ทุกคนสะอาดแล้ว ไม่มีหนี้ค้าง
                  </p>
                ) : (
                  <div className="space-y-3">
                    {settlement.transactions.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-(--surface-container-low) rounded-xl">
                        <span className="text-sm font-semibold text-(--on-surface) truncate flex-1">{t.fromName}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-(--primary)">{fmtAmount(t.amount, t.currency)}</span>
                          <span className="material-symbols-outlined text-base text-(--on-surface-variant)">arrow_forward</span>
                        </div>
                        <span className="text-sm font-semibold text-(--on-surface) truncate flex-1 text-right">{t.toName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )
        )}
      </div>

      {/* ─── Add/Edit Expense Drawer ─── */}
      <Drawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "แก้ไขรายการ" : "เพิ่มรายการค่าใช้จ่าย"}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowForm(false)}>ยกเลิก</Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              {editingId ? "บันทึก" : "เพิ่มรายการ"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Description */}
          <FormInput
            label="รายละเอียด"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={512}
            placeholder="เช่น ค่ารถตู้ไปสนามบิน"
          />

          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormInput
                label="จำนวนเงิน"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div>
              <SelectPicker
                label="สกุลเงิน"
                value={currency}
                onChange={setCurrency}
                options={CURRENCY_OPTIONS}
                searchable={false}
              />
            </div>
          </div>

          {/* Date */}
          <DatePicker
            label="วันที่"
            value={occurredOn}
            onChange={setOccurredOn}
          />

          {/* Paid by */}
          <SelectPicker
            label="จ่ายโดย"
            value={paidBy}
            onChange={setPaidBy}
            options={followerOptions}
            placeholder="— เลือก —"
            searchable={false}
          />

          {/* Split mode */}
          <SegmentedControl<"equal" | "shares" | "exact">
            label="วิธีแชร์"
            options={SPLIT_MODES}
            value={splitMode}
            onChange={setSplitMode}
            size="sm"
          />

          {/* Participants */}
          <div>
            <p className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest mb-2">
              ผู้ร่วมชำระ ({selectedParticipants.size} คน)
            </p>
            <div className="space-y-2">
              {memberFollowers.map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedParticipants.has(f.id)}
                    onChange={() => toggleParticipant(f.id)}
                    label={f.displayName}
                  />
                  {(splitMode === "shares" || splitMode === "exact") && selectedParticipants.has(f.id) && (
                    <input
                      type="number"
                      value={participantShares[f.id] ?? "1"}
                      onChange={(e) => setParticipantShares((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      min="0.01"
                      step="0.01"
                      className="w-20 text-right px-2 py-1 text-xs rounded-lg border border-(--outline-variant)/40 focus:border-(--primary) focus:outline-none ml-auto"
                      placeholder={splitMode === "exact" ? "จำนวนเงิน" : "น้ำหนัก"}
                    />
                  )}
                  {splitMode === "equal" && selectedParticipants.size > 0 && selectedParticipants.has(f.id) && amount && (
                    <span className="text-xs text-(--on-surface-variant) font-semibold w-20 text-right ml-auto">
                      {fmtAmount(parseFloat(amount || "0") / selectedParticipants.size, currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* ─── Delete confirm ─── */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="ลบรายการนี้?"
        description="รายการค่าใช้จ่ายจะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบ"
        variant="danger"
      />
    </main>
  );
}
