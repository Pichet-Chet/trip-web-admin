
import type { EmergencyContact } from "@/lib/types/trip";

type EmergencyCardProps = {
  contacts: EmergencyContact[];
};

export function EmergencyCard({ contacts }: EmergencyCardProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h3 className="mb-3 text-base font-bold text-foreground">
        🆘 เบอร์ฉุกเฉิน
      </h3>
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div
            key={contact.phone}
            className="flex items-center justify-between rounded-xl bg-muted px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{contact.icon}</span>
              <span className="text-sm font-medium text-foreground">
                {contact.name}
              </span>
            </div>
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
            >
              <span className="material-symbols-outlined text-xs">call</span>
              {contact.phone}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
