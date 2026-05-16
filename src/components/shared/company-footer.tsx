
import type { Company } from "@/lib/types/trip";

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
            <span className="material-symbols-outlined text-sm text-primary">call</span>
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
            <span className="material-symbols-outlined text-sm text-primary">language</span>
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
