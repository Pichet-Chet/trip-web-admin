import type { StatusConfig } from "@pichetch08/trip-ui";

export const TRIP_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft:         { label: "ฉบับร่าง",          tone: "amber" },
  rejected:      { label: "ไม่ผ่านการตรวจสอบ", tone: "rose" },
  pendingreview: { label: "รอตรวจสอบ",         tone: "amber" },
  published:     { label: "เผยแพร่แล้ว",       tone: "emerald" },
  unpublished:   { label: "ปิดการเผยแพร่",     tone: "rose" },
  archived:      { label: "จบแล้ว",             tone: "slate" },
};

export function tripStatusLabel(status: string): string {
  return TRIP_STATUS_CONFIG[status.toLowerCase()]?.label ?? status;
}
