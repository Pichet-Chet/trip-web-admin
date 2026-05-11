// Inline SVG icons (lucide-react not available in trip-web-admin)
function Phone({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function Globe({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
    </svg>
  );
}
import type { Company } from "@/lib/mock-data";

type CompanyFooterProps = {
  company: Company;
};

export function CompanyFooter({ company }: CompanyFooterProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-4">
        <img
          src={company.logoUrl}
          alt={company.name}
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <h4 className="font-bold text-foreground">{company.name}</h4>
          {company.tatLicense && (
            <p className="text-xs text-muted-foreground">
              TAT License: {company.tatLicense}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {company.phone && (
          <a
            href={`tel:${company.phone}`}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary-100"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            {company.phone}
          </a>
        )}
        {company.lineId && (
          <a
            href={`https://line.me/R/ti/p/${company.lineId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-[#06c755]/10"
          >
            <span className="text-sm text-[#06c755]">💚</span>
            LINE {company.lineId}
          </a>
        )}
        {company.facebook && (
          <a
            href={`https://facebook.com/${company.facebook}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary-100"
          >
            <span className="text-sm text-[#1877f2]">📘</span>
            {company.facebook}
          </a>
        )}
        {company.instagram && (
          <a
            href={`https://instagram.com/${company.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-pink-50"
          >
            <span className="text-sm">📷</span>
            @{company.instagram}
          </a>
        )}
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary-100"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            {company.website.replace(/https?:\/\//, "")}
          </a>
        )}
      </div>

      {/* Powered by App */}
      <div className="mt-4 border-t border-border pt-3 text-center">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            N
          </span>
          Powered by App
        </a>
      </div>
    </div>
  );
}
