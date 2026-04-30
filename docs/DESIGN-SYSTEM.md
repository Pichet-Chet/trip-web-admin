# Design System Rules

Enforced by ESLint (`eslint.config.mjs`) + a CI grep script (`scripts/check-design-tokens.sh`).

Run locally: `npm run lint` and `npm run check:design`.

## Rules

### 1. Native browser dialogs are banned

❌ `window.confirm(...)`, `confirm(...)`, `window.alert(...)`, `alert(...)`, `window.prompt(...)`

✅ Use the project hooks instead:

```tsx
import { useConfirm } from "@/lib/hooks/use-confirm";
const { confirm } = useConfirm();
const ok = await confirm({ title: "...", description: "...", variant: "danger" });

import { useToast } from "@/components/shared";
const { toast } = useToast();
toast("Saved", "success");
```

### 2. Inline modal overlays are banned

❌ `<div className="fixed inset-0 ... bg-(black|slate-900) ...">`

✅ Use the shared `<Modal>` primitive:

```tsx
import { Modal } from "@/components/shared";

<Modal open={open} onClose={close} size="md" title="..." footer={<...>}>
  {/* body */}
</Modal>
```

`<Modal>` provides: backdrop (canonical `bg-slate-900/50`), Esc handler with cleanup,
focus trap (Tab/Shift+Tab), ARIA attributes, optional `blocking` flag for in-flight
operations, sticky `footer` slot, `headerActions` slot.

**Exception**: image lightboxes can use `bg-black/90` for high contrast — the script
allowlists this.

### 3. Hardcoded `blue-*` Tailwind classes are banned for primary actions

❌ `bg-blue-600`, `text-blue-600`, `border-blue-200`, `focus:ring-blue-500/20` etc.

✅ Use CSS-var tokens:

| Use case | Token |
|---|---|
| Primary surface | `bg-(--primary)` |
| Primary text/icon | `text-(--primary)` |
| Soft tint background | `bg-(--primary-container)/40` |
| Container surface | `bg-(--primary-container)` |
| Focus ring | `focus:ring-(--primary)/20` |
| Focus border | `focus:border-(--primary)` |
| Border variant | `border-(--primary)/20`, `border-(--primary)/30` |
| Hover (use opacity, not darker shade) | `hover:opacity-95` |

**Exceptions** (allowed and not flagged):
- Decorative gradient blobs (`blur-3xl`/`blur-2xl`) — preserved for brand styling
- VISA/Mastercard semantic badges in `/dashboard/upgrade`
- Legal/static pages (`/dashboard/terms`, `/privacy`, `/refund-policy`)
- Component definitions in `src/components/shared/banner.tsx` (defines variant tokens)

## Shared component library

Always check `src/components/shared/index.ts` before rolling your own:

| Need | Use |
|---|---|
| Page loading state | `<LoadingState />` |
| Page error state | `<ErrorState />` |
| Empty list / search | `<EmptyState />` |
| Form input | `<FormInput />` (not raw `<input>`) |
| Form textarea | `<FormTextarea />` (with `error`/`required`/`hint`) |
| Toggle switch | `<ToggleSwitch />` |
| Select dropdown | `<SelectPicker />` |
| Date / time picker | `<DatePicker />` / `<TimePicker />` |
| Image upload | `<ImageUpload />` |
| Stat card | `<StatCard />` (variant: default | pastel) |
| Status badge | `<StatusBadge />` / `<ChannelBadge />` |
| Banner | `<Banner variant="info|success|warning|danger" />` |
| Modal | `<Modal />` |
| Confirm prompt | `useConfirm()` hook + `<ConfirmDialog />` |
| Section header | `<SectionHeader />` |
| Filter tabs | `<FilterTabs />` |
| Pagination | `<Pagination />` |
| Toast | `useToast()` hook + `<ToastProvider />` |
| Skeleton | `<Skeleton />`, `<CardSkeleton />`, `<PageSkeleton />` |

## CI integration

Pre-merge:
```bash
npm run lint && npm run check:design && npm run build
```

If any of the three fails, the PR cannot merge. The `check:design` script
exits non-zero on violations and prints exact file:line references.
