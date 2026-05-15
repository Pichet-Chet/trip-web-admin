import { OperatorGuard } from "@/components/shared";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OperatorGuard>{children}</OperatorGuard>;
}
