export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  usage: "/dashboard/usage",
  tripNew: "/dashboard/trips/new",
  tripEdit: (id: string) => `/dashboard/trips/${id}/edit` as const,
  tripPreview: (id: string) => `/dashboard/trips/${id}/preview` as const,
  tripPublish: (id: string) => `/dashboard/trips/${id}/publish` as const,
  tripReceipts: (id: string) => `/dashboard/trips/${id}/receipts` as const,
} as const;
