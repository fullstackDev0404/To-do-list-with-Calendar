# Implementation Tasks

## Task 1: Extend Backend Models and Auth Middleware

- [ ] 1.1 Add `avatar`, `customShortcuts`, and `tokenVersion` fields to `User` model (`Backend/src/models/User.js`)
- [ ] 1.2 Create `ActivityLog` model with TTL index (`Backend/src/models/ActivityLog.js`)
- [ ] 1.3 Update `authMiddleware.js` to verify `tokenVersion` from JWT against the user document in DB
- [ ] 1.4 Create `logActivity(userId, actionType, details)` helper utility (`Backend/src/utils/activityLogger.js`)

**Requirements:** 8.7, 13.9, 14.3, 14.4

---

## Task 2: Backend — Auth Routes for Profile & Account Management

_Depends on: Task 1_

- [ ] 2.1 Add `GET /api/auth/profile` — return `username`, `email`, `avatar`, `customShortcuts`
- [ ] 2.2 Add `PUT /api/auth/profile` — update `username` (3–30 chars), `avatar` (base64), `customShortcuts`; call `logActivity` for profile_updated
- [ ] 2.3 Add `PUT /api/auth/change-password` — verify current password, enforce password requirements (8+ chars, upper, lower, number), increment `tokenVersion`, issue new JWT; call `logActivity` for password_changed
- [ ] 2.4 Add `DELETE /api/auth/account` — verify email + password, delete all Todos → ActivityLogs → User in sequence; return 200 on success
- [ ] 2.5 Add `logActivity` call in existing `POST /api/auth/login` for login events (IP from `req.ip`)
- [ ] 2.6 Register new auth routes in `server.js`

**Requirements:** 8.1–8.11, 13.3–13.16

---

## Task 3: Backend — Bulk Todo Operations and Import

_Depends on: Task 1_

- [ ] 3.1 Add `PUT /api/todos/bulk-complete` — accept `{ ids, completed }`, update only authenticated user's todos, return `{ updated }`
- [ ] 3.2 Add `DELETE /api/todos/bulk-delete` — accept `{ ids }`, delete only authenticated user's todos, return `{ deleted }`
- [ ] 3.3 Add `POST /api/todos/import` — accept `{ format, data, mode }`:
  - Hand-rolled RFC 4180 CSV parser for CSV format
  - JSON structure validation for JSON format
  - Duplicate detection (title + date + description, case-insensitive)
  - `replace` mode: delete all user todos then insert
  - `merge` mode: insert non-duplicates only
  - Return `{ imported, skipped, errors[] }`
- [ ] 3.4 Call `logActivity` for `data_imported` in import route
- [ ] 3.5 Register bulk and import routes in `todos.js`

**Requirements:** 3.5–3.8, 7.1–7.11, 12.1–12.15

---

## Task 4: Backend — Activity Log Route

_Depends on: Task 1_

- [ ] 4.1 Create `Backend/src/routes/activity.js` with `GET /api/activity`
  - Query params: `type`, `from`, `to`, `search`, `page` (default 1), `limit` (default 50)
  - Filter by `user`, `actionType`, date range on `timestamp`, `taskTitle` text search
  - Sort by `timestamp` descending
  - Return `{ entries, total, page, pages }`
- [ ] 4.2 Register activity route in `server.js` as `/api/activity`

**Requirements:** 14.1–14.15

---

## Task 5: Frontend — API Layer Extensions

_Depends on: Task 2, Task 3, Task 4_

- [ ] 5.1 Create `Frontend/src/api/userApi.js` with: `getProfile`, `updateProfile`, `changePassword`, `deleteAccount`, `getActivityLog`
- [ ] 5.2 Extend `Frontend/src/api/todoApi.js` with: `bulkComplete(ids, completed)`, `bulkDelete(ids)`, `importTodos(format, data, mode)`

**Requirements:** 3.5, 7.1, 8.1, 13.1, 14.1

---

## Task 6: Frontend — useKeyboardShortcuts Hook

- [ ] 6.1 Create `Frontend/src/hooks/useKeyboardShortcuts.js`
  - Single `keydown` listener on `document`
  - Input-field guard: suppress all shortcuts except `Escape` when focus is in `INPUT`/`TEXTAREA`/`SELECT`
  - Accept `actions` object, `isModalOpen` flag, `customShortcuts` map
  - Merge custom shortcuts over defaults at runtime
  - Default bindings: `n`, `e`, `d`, `t`, `ArrowLeft`, `ArrowRight`, `/`, `Escape`, `?`, `Tab`, `Shift+Tab`, `Space`, `m`

**Requirements:** 1.1–1.14, 9.1–9.10, 10.1–10.2

---

## Task 7: Frontend — useUndoDelete Hook

- [ ] 7.1 Create `Frontend/src/hooks/useUndoDelete.js`
  - `deleteTasks(tasks)`: remove from state, store pending with 8s timer, show UndoToast
  - `undoDelete()`: clear timer, restore tasks to state, show "Restored" toast
  - Flush pending deletes immediately on navigation away (`beforeunload` + route change)
  - Only track most recent deletion; flush prior pending before queuing new one
  - Returns `{ deleteTasks, undoDelete, hasPending }`

**Requirements:** 4.1–4.10

---

## Task 8: Frontend — KeyboardShortcutsHelp Component

- [ ] 8.1 Create `Frontend/src/components/KeyboardShortcutsHelp.jsx`
  - `role="dialog"`, `aria-modal="true"`, focus trap
  - Full-screen backdrop with `backdrop-blur`
  - Two-column grid of key badge + description rows
  - Closes on `Escape`, `?`, or backdrop click
  - Dark/light mode support matching existing style conventions

**Requirements:** 1.10, 1.13, 10.1–10.2

---

## Task 9: Frontend — BulkActionsToolbar Component

- [ ] 9.1 Create `Frontend/src/components/BulkActionsToolbar.jsx`
  - Props: `darkMode`, `selectedCount`, `onMarkDone`, `onMarkUndone`, `onDeleteSelected`, `onSelectAll`, `onDeselectAll`
  - `role="toolbar"`, `aria-label="Bulk actions"`
  - Animated slide-up via `framer-motion`
  - Inline confirmation dialog for delete action
  - Shows selected count badge

**Requirements:** 3.4–3.12, 10.5

---

## Task 10: Frontend — Calendar Enhancements (Badges + Drop Targets)

_Depends on: Task 5_

- [ ] 10.1 Replace `todoDates` prop with `taskCounts: { [dateStr]: { total, completed, incomplete } }` in `Calendar.jsx`
- [ ] 10.2 Add `TaskCountBadge` sub-component inside `Calendar.jsx`:
  - No badge if no tasks
  - Grey badge (all completed), colored badge (has incomplete)
  - Color: sky (1–3 incomplete), amber (4–6), red (7+)
  - Display "9+" when count > 9
  - Hover tooltip showing "X done / Y remaining" via CSS `group-hover`
  - `aria-label` with full count details; text label alongside color dot
- [ ] 10.3 Add drag-and-drop drop target support to date cells:
  - `data-date={ds}` attribute on each cell
  - `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` handlers
  - Accept new props: `onDropTask(taskId, targetDate)`, `dragOverDate`
  - Highlight hovered cell with ring/border when `dragOverDate` matches

**Requirements:** 5.1–5.10, 2.2–2.3, 10.4, 10.9

---

## Task 11: Frontend — Dashboard Enhancements

_Depends on: Task 6, Task 7, Task 8, Task 9, Task 10_

- [ ] 11.1 Add `focusedTaskId` state; update `TaskRow` with `tabIndex`, `role="listitem"`, `ring-2 ring-sky-400` focus ring when focused
- [ ] 11.2 Wire `useKeyboardShortcuts` hook into Dashboard with all action callbacks
- [ ] 11.3 Add `showHelp` state; render `KeyboardShortcutsHelp` when true
- [ ] 11.4 Add `selectionMode` and `selectedIds` (Set) state; add "Select" toggle button in date header
- [ ] 11.5 Update `TaskRow` to show checkbox when `selectionMode` is active; clicking row body toggles selection
- [ ] 11.6 Render `BulkActionsToolbar` (animated) when `selectedIds.size > 0`; wire all bulk action handlers
- [ ] 11.7 Replace `handleDelete` with `useUndoDelete`'s `deleteTasks`; wire undo callback
- [ ] 11.8 Add `dragOverDate` state; make `TaskRow` draggable (HTML5 DnD `draggable={true}`, `onDragStart`)
- [ ] 11.9 Create `useTouchDrag` hook for touch drag support; wire into `TaskRow`
- [ ] 11.10 Add `handleDropTask(taskId, targetDate)` with optimistic update + API call + revert on error
- [ ] 11.11 Compute `taskCountsByDate` memo from `allTodos`; pass as `taskCounts` to `Calendar`
- [ ] 11.12 Add `m` key handler: open "Move to date" popover for focused task (keyboard DnD alternative)
- [ ] 11.13 Add `logActivity` call for `data_exported` when export is triggered from Dashboard

**Requirements:** 1.1–1.14, 2.1–2.9, 3.1–3.12, 4.1–4.10, 5.6, 10.1–10.10

---

## Task 12: Frontend — ProfileSettings Page

_Depends on: Task 5_

- [ ] 12.1 Create `Frontend/src/pages/ProfileSettings.jsx` with route `/profile`
- [ ] 12.2 Avatar section: display current avatar or initials fallback; file input (`image/jpeg,image/png,image/gif`, max 5MB); resize to 200×200 via `<canvas>`; "Remove Avatar" option
- [ ] 12.3 Username section: inline edit field; validate 3–30 chars; call `updateProfile`
- [ ] 12.4 Password section: current password + new password + confirm form; enforce requirements; call `changePassword`; store new token
- [ ] 12.5 Keyboard Shortcuts section: list all actions with current bindings; click to enter capture mode; reject reserved keys with inline warning; "Reset to Defaults" button; call `updateProfile` to persist
- [ ] 12.6 Export/Import section: "Export Data" button (triggers format dialog) and "Import Data" button (triggers file picker + options dialog)
- [ ] 12.7 Delete Account danger zone: multi-step modal (warning → email confirm → password confirm → submit `deleteAccount` → clear storage → redirect `/login`)
- [ ] 12.8 Add `/profile` route to `App.js`

**Requirements:** 8.1–8.11, 9.1–9.10, 11.1–11.14, 12.1–12.15, 13.1–13.16

---

## Task 13: Frontend — ActivityLog Page

_Depends on: Task 5_

- [ ] 13.1 Create `Frontend/src/pages/ActivityLog.jsx` with route `/activity`
- [ ] 13.2 Fetch from `getActivityLog` with filter params; display chronological list (newest first)
- [ ] 13.3 Filter bar: All / Tasks / Account / Exports tabs
- [ ] 13.4 Date range pickers (from / to)
- [ ] 13.5 Search input (debounced, searches task title / action type)
- [ ] 13.6 Pagination controls (prev/next, page indicator)
- [ ] 13.7 Each entry shows: icon, action label, task title (if applicable), timestamp formatted as "MMM DD, YYYY at HH:MM AM/PM"
- [ ] 13.8 Expandable rows for task-related entries showing before/after field values
- [ ] 13.9 Add `/activity` route to `App.js`

**Requirements:** 14.1–14.15

---

## Task 14: Frontend — Header User Menu

_Depends on: Task 12, Task 13_

- [ ] 14.1 Extend `App.js` header with user menu dropdown (avatar/username button)
- [ ] 14.2 Fetch and display username/avatar from profile on mount (store in state)
- [ ] 14.3 Menu items: Profile Settings → `/profile`, Activity Log → `/activity`, Export Data (triggers export dialog), Log out (existing)
- [ ] 14.4 Export dialog: format selection (JSON / CSV) → trigger download via Blob + `<a>` click
- [ ] 14.5 Import dialog: file picker → format detection → merge/replace options → call `importTodos` → show summary toast

**Requirements:** 6.1–6.10, 7.1–7.11, 11.1–11.14, 12.1–12.15, 13.1

---

## Task 15: Accessibility Polish

_Depends on: Task 8, Task 9, Task 10, Task 11_

- [ ] 15.1 Add `aria-live="polite"` region in Dashboard for toast/undo announcements
- [ ] 15.2 Ensure `UndoToast` has `role="status"` and announces countdown to screen readers
- [ ] 15.3 Verify all new interactive elements have visible focus indicators in both themes
- [ ] 15.4 Add `aria-label` to drag handles: "Drag to reschedule task"
- [ ] 15.5 Verify logical tab order through BulkActionsToolbar, Calendar badges, and ProfileSettings sections
- [ ] 15.6 Add `aria-describedby` on task count badges pointing to tooltip text

**Requirements:** 10.1–10.10
