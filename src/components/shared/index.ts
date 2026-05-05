// Re-exported from @trip/ui shared component package
export {
  FormInput,
  FormTextarea,
  IconWrapper,
  IconButton,
  StatCard,
  type StatCardTone,
  SectionHeader,
  FooterActionBar,
  DashedAddButton,
  StatsSummary,
  EmptyState,
  Pagination,
  ConfirmDialog,
  ToggleSwitch,
  LoadingState,
  ErrorState,
  Banner,
  Modal,
} from "@trip/ui";

// Keep local: different API (toast(msg, type?) vs @trip/ui toast.success(msg))
export { ToastProvider, useToast } from "./toast";

// Keep local: different API ({ value, active, onChange } vs @trip/ui { id, activeTab, onTabChange })
export { FilterTabs } from "./filter-tabs";

// Admin-specific: keep local (has ChannelBadge importing FollowChannel from @/types)
export { StatusBadge, ChannelBadge } from "./status-badge";
export type { StatusConfig, StatusTone } from "./status-badge";

// Admin-specific: keep local (has StatCardSkeleton which is absent in @trip/ui)
export { Skeleton, CardSkeleton, TableRowSkeleton, PageSkeleton } from "./skeleton";

// Admin-specific components
export { ChangeSummaryModal } from "./change-summary-modal";
export { QRCodeDisplay } from "./qr-code-display";
export { ImageUpload } from "./image-upload";
export { SegmentedControl } from "./segmented-control";
export { DatePicker } from "./date-picker";
export { TimePicker } from "./time-picker";
export { SelectPicker } from "./select-picker";
export type { SelectOption } from "./select-picker";
export { MediaLibraryModal } from "./media-library-modal";
export { AuthHero } from "./auth-hero";
export { MobilePreview } from "./mobile-preview";
export { PreviewDrawer } from "./preview-drawer";
export { AuthGuard } from "./auth-guard";
export { DevAutoFill } from "./dev-auto-fill";
