import type { Metadata } from "next";
import TripClientLayout from "./_components/TripClientLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface TripMeta {
  id: string;
  title: string;
  slug: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  company: { name: string; logoUrl: string | null };
}

async function fetchTripMeta(slug: string): Promise<TripMeta | null> {
  try {
    const res = await fetch(`${API_URL}/client/t/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${s.toLocaleDateString("th-TH", opts)} - ${e.toLocaleDateString("th-TH", opts)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trip = await fetchTripMeta(slug);

  if (!trip) {
    return { title: "Trip not found" };
  }

  const title = `${trip.title} — ${trip.company.name}`;
  const description = `${trip.destination} | ${formatDateRange(trip.startDate, trip.endDate)}`;
  const ogImageUrl = `${API_URL}/client/t/${encodeURIComponent(slug)}/og-image.png`;
  const tripUrl = `${SITE_URL}/t/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: tripUrl,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: trip.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TripLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  return <TripClientLayout slug={slug}>{children}</TripClientLayout>;
}
