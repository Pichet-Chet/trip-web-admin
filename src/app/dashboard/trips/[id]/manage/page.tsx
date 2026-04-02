"use client";

import { use } from "react";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function ManagePage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  redirect(ROUTES.tripPreview(id));
}
