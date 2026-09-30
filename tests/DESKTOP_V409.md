# RPYS presentation v409

- Production business nodes remain direct children of `main.main`. No clones or iframes.
- Only `rpys_view_preferences_v409` is written. No database, cloud, credentials or scheduler APIs are modified.
- Classic view remains the first default; users explicitly enable desktop. `/?view=classic` recovers the classic layout.
- Full-size module windows by default; the user can tile them. All windows share the native month/list selection.
- Native permissions and module navigation are retained. Existing SDS/query entry points are reused.
- Legacy zoom controls are hidden; one toolbar targets the current table even after a native re-render. Width-fit has a 50% readability floor and horizontal scrolling for very wide tables.
- CSS zoom resets for print. Native payroll/duty processing and 6.1.1 engine are unchanged.

Validation (2026-09-30): 31 tests passed for view continuity, zoom restoration, no mutation loop, first-edit guards, list isolation and scheduling safety. Browser fixture verifies 100→110%, fit, full-table toggle, collapse, two modules, classic return, and an edited input retained across switching. Fixture has only synthetic records and no cloud connection.

To run presentation tests: install jsdom 26.1.0 into an isolated tools directory, set NODE_PATH to its node_modules and run `node --test tests/desktop-live.test.cjs`. Other selected suites need only Node.

Code rollback baseline: branch `backup/pre-desktop-v409-20260930` at `27b9eb0ab171152a55407caf4c4853196f093f6a`. This is a code snapshot, not a database backup. Removing the two v409 loader lines from index.html disables the presentation add-on without touching business records.

## v410 (2026-09-30)

Favorite groups select two or three permitted modules and optionally retain their current geometry. Only display preferences are stored. Existing pages stay mounted; window switching blurs the active editor before changing activePage and does not rerender drafts. Tab/Shift+Tab cycle visible windows outside editable fields and dialogs. Header controls allow numeric dimensions and pointer resizing. The cloud status badge is above the taskbar with truncation; taskbar remains clickable.

14 focused tests passed: desktop continuity, group preferences, draft retention, keyboard behavior, dimensions, first-edit guards, and monthly list isolation. Database contents and scheduling engine are unchanged. Browser checks use synthetic fixtures; authenticated live-record editing was not tested. Rollback this release to cf1f334f74d198a1b3e5e006d58ffd93f61fb526.
