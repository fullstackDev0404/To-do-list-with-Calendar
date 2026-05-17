# Design Document: TodoPro Enhancements

## Overview

This document describes the technical design for enhancing the existing TodoPro application. The app is a React 19 frontend with a Node.js/Express 5 backend and MongoDB via Mongoose. The current stack already includes `framer-motion`, `react-toastify`, `react-icons`, `react-router-dom`, `axios`, and Tailwind CSS. All new features must integrate cleanly into this existing architecture without introducing unnecessary new dependencies.

The enhancements are grouped into six implementation areas:

1. **Keyboard Shortcuts + Help Panel** (Req 1, 9, 10)
2. **Drag-and-Drop Calendar Rescheduling** (Req 2, 10)
3. **Bulk Actions + Undo Delete** (Req 3, 4, 10)
4. **Task Count Badges on Calendar** (Req 5, 10)
5. **Data Export / Import (JSON + CSV)** (Req 6, 7, 11, 12)
6. **Account & Profile Management** (Req 8, 13, 14)

Real-time collaboration (Req 15) is deferred — it requires WebSocket infrastructure not present in the current stack and is out of scope for this iteration.

---

## Architecture

The system follows the existing client-server architecture with no structural changes to the deployment model.

```
Frontend (React 19 + Tailwind)
├── src/
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.js   ← global shortcut dispatcher
│   │   └── useUndoDelete.js          ← in-memory undo state
│   ├── components/
│   │   ├── Calendar.jsx              ← enhanced with drop targets + badges
│   │   ├── TodoModal.jsx             ← existing, unchanged
│   │   ├── PomodoroTimer.jsx         ← existing, unchanged
│   │   ├── KeyboardShortcutsHelp.jsx ← new help panel overlay
│   │   ├── BulkActionsToolbar.jsx    ← new bulk action bar
│   │   └── UndoToast.jsx             ← custom toast with countdown
│   ├── pages/
│   │   ├── Dashboard.jsx             ← enhanced with all new features
│   │   ├── ProfileSettings.jsx       ← new page
│   │   ├── ActivityLog.jsx           ← new page
│   │   ├── Login.jsx                 ← existing, unchanged
│   │   └── Register.jsx              ← existing, unchanged
│   └── api/
│       ├── api.js                    ← existing, unchanged
│       ├── todoApi.js                ← extended with bulk/import
│       └── userApi.js                ← new: profile, export, import, delete

Backend (Express 5 + Mongoose)
├── src/
│   ├── models/
│   │   ├── Todo.js                   ← unchanged schema
│   │   ├── User.js                   ← extended with avatar, customShortcuts, tokenVersion
│   │   └── ActivityLog.js            ← new model
│   ├── routes/
│   │   ├── auth.js                   ← extended with profile, delete account
│   │   ├── todos.js                  ← extended with bulk, import
│   │   └── activity.js               ← new route
│   └── middleware/
│       └── authMiddleware.js         ← extended with tokenVersion check
```

**Key architectural decisions:**
- Undo delete is frontend-only (in-memory, no DB soft-delete needed).
- Export is frontend-only (data already in React state).
- Import goes through the backend for validation and persistence.
- Activity logging is fire-and-forget (async, non-blocking).
- All state remains local to components/hooks — no Redux or Context API.

---

## Data Models

### User Model (extended)

```js
// Additions to existing User schema
avatar:          { type: String, default: "" },         // base64 data URL, max ~60KB after resize
customShortcuts: { type: Map, of: String, default: {} }, // action → key binding
tokenVersion:    { type: Number, default: 0 }           // incremented to invalidate all sessions
```

JWT payload changes from `{ id }` to `{ id, tokenVersion }`. The auth middleware verifies `decoded.tokenVersion === user.tokenVersion` on every request.

### Todo Model (unchanged)

The existing Todo schema already covers all required fields: `title`, `description`, `date`, `timeFrom`, `timeTo`, `completed`, `priority`, `tags`, `order`, `estimatedMinutes`, `loggedMinutes`, `streak`, `lastCompletedDate`, `reminderAt`, `timestamps`.

### ActivityLog Model (new)

```js
const ActivityLogSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actionType:    { type: String, required: true },
  // Values: "task_created" | "task_updated" | "task_completed" | "task_deleted"
  //       | "task_restored" | "login" | "password_changed" | "profile_updated"
  //       | "data_exported" | "data_imported"
  taskId:        { type: mongoose.Schema.Types.ObjectId, ref: "Todo" },
  taskTitle:     { type: String },
  changedFields: { type: mongoose.Schema.Types.Mixed }, // { before: {}, after: {} }
  ipAddress:     { type: String },
  timestamp:     { type: Date, default: Date.now, expires: 7776000 } // TTL: 90 days
})
```

The `expires` TTL index on `timestamp` automatically purges entries older than 90 days.

---

## Components and Interfaces

### Frontend API Layer

**`userApi.js` (new)**
```js
getProfile()                          → GET  /api/auth/profile
updateProfile(data)                   → PUT  /api/auth/profile
changePassword(data)                  → PUT  /api/auth/change-password
deleteAccount(data)                   → DELETE /api/auth/account
getActivityLog(params)                → GET  /api/activity
```

**`todoApi.js` (extended)**
```js
bulkComplete(ids, completed)          → PUT  /api/todos/bulk-complete
bulkDelete(ids)                       → DELETE /api/todos/bulk-delete
importTodos(format, data, mode)       → POST /api/todos/import
```

### Backend Route Interfaces

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| `GET` | `/api/auth/profile` | ✓ | — | `{ username, email, avatar, customShortcuts }` |
| `PUT` | `/api/auth/profile` | ✓ | `{ username?, avatar?, customShortcuts? }` | updated user |
| `PUT` | `/api/auth/change-password` | ✓ | `{ currentPassword, newPassword }` | `{ token }` (new JWT) |
| `DELETE` | `/api/auth/account` | ✓ | `{ email, password }` | `{ message }` |
| `PUT` | `/api/todos/bulk-complete` | ✓ | `{ ids: string[], completed: boolean }` | `{ updated: number }` |
| `DELETE` | `/api/todos/bulk-delete` | ✓ | `{ ids: string[] }` | `{ deleted: number }` |
| `POST` | `/api/todos/import` | ✓ | `{ format, data, mode }` | `{ imported, skipped, errors }` |
| `GET` | `/api/activity` | ✓ | `?type&from&to&search&page&limit` | `{ entries, total, page, pages }` |

### New React Components

**`useKeyboardShortcuts(actions, isModalOpen, customShortcuts)`**
- Attaches single `keydown` listener to `document`.
- Suppresses all shortcuts except `Escape` when focus is in `INPUT`/`TEXTAREA`/`SELECT`.
- `actions`: `{ openNew, editFocused, deleteFocused, jumpToday, prevDay, nextDay, focusSearch, toggleHelp, focusNext, focusPrev, toggleComplete, moveTask }`.

**`useUndoDelete(setAllTodos)`**
- Returns `{ deleteTasks(tasks), undoDelete(), hasPending }`.
- Holds deleted tasks in memory for 8 seconds before committing API delete.
- Flushes immediately on navigation away.

**`KeyboardShortcutsHelp({ darkMode, onClose, shortcuts })`**
- `role="dialog"`, `aria-modal="true"`, focus-trapped.
- Two-column grid of key badge + description rows.
- Closes on `Escape`, `?`, or backdrop click.

**`BulkActionsToolbar({ darkMode, selectedCount, onMarkDone, onMarkUndone, onDeleteSelected, onSelectAll, onDeselectAll })`**
- `role="toolbar"`, `aria-label="Bulk actions"`.
- Animated slide-up via `framer-motion`.
- Confirmation dialog for delete action.

**`Calendar.jsx` (extended props)**
```js
// New props added to existing Calendar component
taskCounts: { [dateStr]: { total, completed, incomplete } }  // replaces todoDates
onDropTask: (taskId, targetDate) => void
dragOverDate: string | null
```

**`ProfileSettings.jsx` (new page)**
- Sections: Avatar, Username, Password, Keyboard Shortcuts, Export/Import, Delete Account.
- Avatar resize via `<canvas>` to 200×200 before base64 encoding.

**`ActivityLog.jsx` (new page)**
- Filter bar, date range pickers, search input, paginated list.
- Expandable rows showing before/after for task updates.

---

## 1. Keyboard Shortcuts Detail (Req 1, 9, 10)

**Default shortcut map:**

| Key | Action |
|-----|--------|
| `n` | Open new task modal |
| `e` | Edit focused task |
| `d` | Delete focused task |
| `t` | Jump to today |
| `ArrowLeft` | Previous day |
| `ArrowRight` | Next day |
| `/` | Focus search/filter input |
| `Escape` | Close modal / help panel |
| `?` | Toggle shortcuts help panel |
| `Tab` | Focus next task |
| `Shift+Tab` | Focus previous task |
| `Space` | Toggle completion of focused task |
| `m` | Open "Move to date" popover for focused task |

**Focused task tracking:** `Dashboard` maintains `focusedTaskId` state. Focused `TaskRow` gets `tabIndex={0}` and `ring-2 ring-sky-400` focus ring.

**Customization:** Stored in `User.customShortcuts` map. Reserved keys (`Tab`, `Enter`, `Ctrl+C`, `Ctrl+V`, `Ctrl+Z`) cannot be assigned.

---

## 2. Drag-and-Drop Detail (Req 2, 10)

Uses native HTML5 Drag and Drop API (no new library).

**Drag source:** `TaskRow` gets `draggable={true}`, `onDragStart` sets `dataTransfer.setData("taskId", id)`.

**Drop targets:** Calendar date cells get `onDragOver`/`onDragEnter`/`onDragLeave`/`onDrop`. `dragOverDate` state drives highlight styling.

**Touch support:** `useTouchDrag` hook uses `touchstart`/`touchmove`/`touchend` + `document.elementFromPoint` to find `[data-date]` target.

**Optimistic update:** Date changed in state immediately; reverted on API error.

---

## 3. Bulk Actions + Undo Delete Detail (Req 3, 4, 10)

**Selection mode:** Toggle via "Select" button in date header. Checkboxes appear on each `TaskRow`.

**Undo flow:**
1. Tasks removed from state immediately.
2. Stored in `useUndoDelete` pending state with 8s timer.
3. `UndoToast` shown with countdown progress bar.
4. On undo: tasks restored to state, timer cleared.
5. On expiry: `DELETE /api/todos/bulk-delete` called.

Only the most recent pending deletion is tracked; prior pending deletes are flushed before a new one is queued.

---

## 4. Task Count Badges Detail (Req 5, 10)

`taskCountsByDate` memo computed in `Dashboard`, passed to `Calendar` as `taskCounts`.

Badge color by incomplete count: 1–3 = sky, 4–6 = amber, 7+ = red. All-completed = grey. Count capped at "9+". Hover tooltip shows breakdown. Each badge has `aria-label` with full count details.

---

## 5. Export / Import Detail (Req 6, 7, 11, 12)

**Export (frontend-only):**
- JSON: `{ exportedAt, version, user, tasks }` → Blob download.
- CSV: header row + one row per task, tags as semicolon-separated quoted field.
- Filename: `todopro-export-YYYY-MM-DD.json` or `.csv`.

**Import (backend):**
- `POST /api/todos/import` with `{ format, data, mode }`.
- Hand-rolled CSV parser (RFC 4180 compliant, no third-party library).
- Duplicate detection: same `title + date + description` (case-insensitive).
- `replace` mode deletes all existing todos first.
- Returns `{ imported, skipped, errors[] }`.

---

## 6. Account & Profile Management Detail (Req 8, 13, 14)

**Password change:** Increments `tokenVersion`, re-issues new JWT for current session.

**Account deletion:** Requires email + password confirmation. Deletes Todos → ActivityLogs → User in sequence.

**Activity logging:** `logActivity(userId, actionType, details)` helper called fire-and-forget from route handlers. TTL index auto-purges after 90 days.

---

## Error Handling

| Scenario | Frontend Behavior | Backend Behavior |
|----------|-------------------|------------------|
| Drag-drop API failure | Revert optimistic date change, show error toast | Return 500 with message |
| Bulk delete API failure | Re-add tasks to state, show error toast | Return 500, no partial delete |
| Import validation error | Show error list in import dialog | Return 400 with `errors[]` array |
| Import replace mode failure | Show error, existing tasks untouched | Wrap in try/catch; if insert fails after delete, log error |
| Account deletion failure | Show error, no redirect | Return 500, no data deleted |
| Password change — wrong current password | Show inline error | Return 400 "Current password incorrect" |
| Avatar upload > 5MB | Reject before upload, show size error | Return 400 if base64 > ~7MB |
| Token version mismatch | Auto-redirect to `/login` (existing 401 interceptor) | Return 401 |
| Activity log write failure | Silent (fire-and-forget) | Catch and log to console only |

---

## Correctness Properties

### Property 1: Undo Isolation
Only the most recent delete operation can be undone. Prior pending deletes are committed to the API before a new delete is queued, ensuring no data loss from overlapping undo windows.

**Validates: Requirements 4.9, 4.10**

### Property 2: Drag-Drop Idempotency
Dropping a task on its own date is a no-op — no API call is made and no state change occurs. The task remains in its original position.

**Validates: Requirements 2.4, 2.7**

### Property 3: Bulk Operation Ownership
All bulk endpoints filter by `user: req.user.id`. A user can never modify or delete another user's tasks, even if they supply valid task IDs belonging to another account.

**Validates: Requirements 3.5, 3.6, 3.8**

### Property 4: Import Duplicate Safety
Duplicate detection runs per-user by comparing `title + date + description` (case-insensitive). Importing the same file twice produces no duplicate tasks regardless of mode.

**Validates: Requirements 7.10, 12.12**

### Property 5: Token Invalidation Completeness
Incrementing `tokenVersion` invalidates all existing sessions across all browsers and devices. The current session receives a freshly issued token immediately so the active user is not logged out.

**Validates: Requirements 8.7, 13.9**

### Property 6: Activity Log Non-Interference
Activity log writes are fire-and-forget. A failure to write an activity log entry never causes the primary operation (create, update, delete, login) to fail or roll back.

**Validates: Requirements 14.3, 14.4**

### Property 7: CSV Tag Delimiter Safety
Semicolon is the tag delimiter in CSV exports. Tags are stripped of leading/trailing whitespace on import. Tags containing semicolons are split into multiple tags rather than causing a parse error.

**Validates: Requirements 11.5, 12.15**

---

## Testing Strategy

### Unit Tests (Frontend)

- `useKeyboardShortcuts`: verify each key triggers correct action; verify input-field guard suppresses shortcuts; verify reserved keys are rejected in customization.
- `useUndoDelete`: verify tasks are removed from state immediately; verify restore works within 8s; verify API is called after 8s; verify flush on navigation.
- `taskCountsByDate` memo: verify correct counts for mixed/all-complete/empty dates; verify "9+" cap.
- CSV export: verify header row, correct column order, quoted fields with commas/newlines, semicolon-separated tags.
- CSV parser (import): verify RFC 4180 quoted fields, missing required columns, line number reporting.

### Integration Tests (Backend)

- `PUT /api/todos/bulk-complete`: verify only authenticated user's todos are updated; verify `completed` field toggled correctly.
- `DELETE /api/todos/bulk-delete`: verify only authenticated user's todos are deleted; verify non-existent IDs are ignored gracefully.
- `POST /api/todos/import` (JSON): verify merge mode adds without deleting; verify replace mode deletes then inserts; verify duplicate skipping.
- `POST /api/todos/import` (CSV): verify column mapping; verify validation errors returned with line numbers.
- `DELETE /api/auth/account`: verify all Todos and ActivityLogs deleted; verify User deleted; verify subsequent requests with old token return 401.
- `PUT /api/auth/change-password`: verify old token rejected after change; verify new token works.
- `GET /api/activity`: verify pagination, type filter, date range filter, search filter.

### Manual / Accessibility Testing

- Keyboard navigation through task list with Tab/Shift+Tab.
- Screen reader announcement of toast notifications and undo countdown.
- Drag-and-drop on touch devices.
- Focus trap in KeyboardShortcutsHelp dialog.
- Color-blind mode: verify task count badges convey information beyond color alone.
