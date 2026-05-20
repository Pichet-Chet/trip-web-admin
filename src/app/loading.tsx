import { Spinner } from "@pichetch08/trip-ui";

export default function Loading(): React.ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="md" color="primary" />
    </div>
  );
}
