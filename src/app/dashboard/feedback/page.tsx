"use client";

import { useState } from "react";
import { FormInput, FormTextarea, useToast } from "@/components/shared";

type FeedbackType = "bug" | "feature" | "improvement" | "other";

const feedbackTypes: { value: FeedbackType; label: string; desc: string }[] = [
  { value: "bug", label: "แจ้งปัญหา", desc: "ระบบทำงานผิดปกติ ข้อผิดพลาด หรือใช้งานไม่ได้" },
  { value: "feature", label: "เสนอฟีเจอร์ใหม่", desc: "อยากให้ระบบมีความสามารถอะไรเพิ่ม" },
  { value: "improvement", label: "ปรับปรุงฟีเจอร์เดิม", desc: "ฟีเจอร์ที่มีอยู่แล้วแต่อยากให้ดีขึ้น" },
  { value: "other", label: "อื่นๆ", desc: "คำถาม ข้อสงสัย หรือความคิดเห็นทั่วไป" },
];

const priorityOptions = [
  { value: "low", label: "ไม่เร่งด่วน" },
  { value: "medium", label: "ปานกลาง" },
  { value: "high", label: "เร่งด่วน" },
];

export default function FeedbackPage(): React.ReactNode {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [priority, setPriority] = useState("medium");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setSubmitted(true);
    toast("ส่งเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น");
  }

  if (submitted) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-green-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">ส่งเรียบร้อยแล้ว</h2>
        <p className="text-slate-500 mb-8 max-w-sm">ขอบคุณสำหรับความคิดเห็นของคุณ ทีมงานจะตรวจสอบและตอบกลับผ่านอีเมลที่ลงทะเบียนไว้</p>
        <div className="flex gap-3">
          <button onClick={() => { setSubmitted(false); setType(null); }} className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            ส่งอีกครั้ง
          </button>
          <a href="/dashboard" className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">แจ้งปัญหา / ข้อเสนอแนะ</h1>
        <p className="text-slate-500 mt-2 text-sm">ความคิดเห็นของคุณช่วยให้เราพัฒนาระบบได้ตรงกับการใช้งานจริง</p>
      </div>

      {/* Step 1: Select type */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">ประเภท</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {feedbackTypes.map((ft) => (
            <button
              key={ft.value}
              onClick={() => setType(ft.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                type === ft.value
                  ? "border-blue-600 bg-blue-50/50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className={`text-sm font-bold ${type === ft.value ? "text-blue-600" : "text-slate-900"}`}>{ft.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{ft.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Detail form (show after type selected) */}
      {type && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">รายละเอียด</h2>
          </div>
          <div className="p-6 space-y-6">
            <FormInput
              label="หัวข้อ"
              placeholder={type === "bug" ? "เช่น กดบันทึกทริปแล้ว error" : type === "feature" ? "เช่น อยากให้มีระบบจัดการค่าใช้จ่าย" : "สรุปสั้นๆ"}
            />

            <FormTextarea
              label="รายละเอียด"
              placeholder={type === "bug"
                ? "อธิบายขั้นตอนที่ทำให้เกิดปัญหา:\n1. เข้าหน้า...\n2. กดปุ่ม...\n3. เกิด error..."
                : type === "feature"
                  ? "อธิบายสิ่งที่อยากได้:\n- ใช้งานยังไง\n- ช่วยแก้ปัญหาอะไร\n- ตัวอย่างจากระบบอื่น (ถ้ามี)"
                  : "อธิบายเพิ่มเติม..."}
              rows={6}
            />

            {type === "bug" && (
              <FormInput
                label="URL หน้าที่เกิดปัญหา"
                placeholder="เช่น /dashboard/trips/new"
                icon="link"
              />
            )}

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">ระดับความสำคัญ</label>
              <div className="flex gap-2">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      priority === p.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Screenshot upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">แนบภาพหน้าจอ (ไม่บังคับ)</label>
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center transition-colors hover:bg-blue-50/30">
                  <span className="material-symbols-outlined text-2xl text-slate-300">attach_file</span>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG ไม่เกิน 5MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              ส่งข้อเสนอแนะ
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
