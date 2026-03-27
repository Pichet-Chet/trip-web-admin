import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function NotFound(): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-[var(--muted-foreground)]">Page not found</p>
      <Button asChild>
        <Link href={ROUTES.home}>Go Home</Link>
      </Button>
    </div>
  );
}
