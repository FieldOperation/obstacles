# Worker App UI Redesign – Summary

## What Changed

### Design System (New)

**Tokens** (`src/theme/tokens.ts`):
- Colors: `bg`, `surface`, `primary` (#0ea5e9), text/muted, semantic (success/warn/danger), status (open/closed)
- Spacing scale, radii, typography scale, elevation
- `minTouchTarget: 44` for accessibility

**Reusable Components** (`src/components/`):
- `Screen` – scroll wrapper with safe area, `KeyboardAvoidingView`
- `AppHeader` – logos row, title/subtitle, optional left (back) and right (Logout) actions
- `ActionCard` – large touchable card (View Cases, Create Case)
- `StatusChip` – status chip (OPEN/CLOSED) with color coding
- `CaseCard` – case list item with type, zone/road, date, status
- `EmptyState` – empty/error state with optional CTA
- `CaseCardSkeleton` – loading skeleton for case list
- `LocationRow` – location loading / success / retry states
- `PhotoThumbnail` – photo preview with remove button

**Settings Service** (`src/services/supabaseService.ts`):
- `settingsService.get()` – fetches logos from `system_settings` (contractor_logo, owner_logo) and returns public URLs from Supabase Storage

---

### 1. Home Screen (`src/screens/HomeScreen.tsx`)

- **Logos**: Fetches contractor/owner logos via `settingsService.get()` and shows them in `AppHeader`
- **Header**: “Welcome, Worker@2026” (or user name), optional subtitle with open cases count (e.g. “3 open cases”)
- **Logout**: Top-right text action in header (not main content)
- **Actions**: Two large cards – “View Cases” and “Create Case” (for ADMIN/WORKER)
- **FAB removed**: Single create entry point via Create Case card

---

### 2. Cases List Screen (`src/screens/CasesListScreen.tsx`)

- **Header**: Title “Cases”, optional count subtitle, back button
- **Case cards**: Type (OBSTACLE/DAMAGE), zone · road, date, status chip
- **Empty state**: “No cases yet” with CTA “Create Case”
- **Error state**: “Couldn’t load cases” with “Retry”
- **Loading**: Skeleton cards
- **Pull-to-refresh**: `RefreshControl` with primary color tint

---

### 3. Create Case Screen (`src/screens/CreateCaseScreen.tsx`)

- **Segmented control**: Obstacle / Damage with clear active/inactive states
- **Zone pills**: Horizontal scroll, selected zone highlighted
- **Road pills**: Shown when zone selected, same pill pattern
- **Form fields**: Labels, helper text, inline validation errors for description, planned work, zone, road, photos
- **Location row**:
  - Loading: “Getting location…”
  - Success: coordinates displayed
  - Error: “Location unavailable” + Retry
- **Photos**: Select Photos / Take Photo; thumbnail previews with remove button
- **Create button**: Disabled until required fields valid; “Creating…” while submitting; double-submit prevented
- **Keyboard**: `KeyboardAvoidingView` and `ScrollView` for keyboard avoidance
- **Accessibility**: Labels and roles on form controls

---

## Where to Review

| Screen        | File                                      |
|--------------|-------------------------------------------|
| Home         | `mobile/src/screens/HomeScreen.tsx`       |
| Cases List   | `mobile/src/screens/CasesListScreen.tsx`  |
| Create Case  | `mobile/src/screens/CreateCaseScreen.tsx` |
| Design tokens| `mobile/src/theme/tokens.ts`              |
| Components   | `mobile/src/components/`                 |

---

## Requirements Met

- Modern, consistent UI (tokens and shared components)
- Clear hierarchy, spacing, typography, alignment
- Single primary create entry point (FAB removed)
- Logout de-emphasized (top-right header)
- Loading, empty, error, submitting, disabled states
- Accessibility: contrast, `maxFontSizeMultiplier`, screen reader labels
- No business logic changes; API/data flows preserved
- Paper theme aligned with primary color (#0ea5e9)
