// Inline SVG icon (lucide-react not available in trip-web-admin)
function Phone({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
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
              <Phone className="h-3 w-3" />
              {contact.phone}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
