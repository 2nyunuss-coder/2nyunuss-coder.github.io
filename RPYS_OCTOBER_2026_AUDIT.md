# RPYS October 2026 scheduling audit — 2026-09-25

The scheduling engine remains **6.1.1**. This release repairs its integration and safety checks; it does not replace the engine or migrate user data.

## Corrections

- Poliklinik rotation preserves existing assignments unless selected-unit rebuilding is explicitly enabled. Manual and locked cells remain protected during rebuilding.
- Skopi generation no longer purges assignments in unrelated units. Its combined day/night pair is checked against the 16-hour next-day rest rule.
- Exact distribution validates the actual target shift, including date-specific active status and rest constraints.
- All three entry points defer saves until validation succeeds. Exceptions, protected-cell changes and new next-day rest violations restore the pre-run state.
- Synchronous engine calculations index keys and immutable queries while reading changing assignment values live. Assignment and overlap calculation results were compared with the original implementation.
- Month-boundary rest checks include the previous month's last day and the next month's first day.

## Validation

`node --test tests/reliability.test.cjs tests/scheduler-safety.test.cjs`: **42 passed, 0 failed**.

Using the current cloud source and an isolated, read-only scheduling snapshot:

- Mamografi, Poliklinik, Skopi, Acil and BT generation completed without engine errors or changes to pre-existing assignments in preserve mode.
- Poliklinik and Skopi alternate entry points passed both preserve and selected-unit rebuild scenarios; protected cells and unrelated months/units were preserved, with no new rest violations.
- **75** historical-assignment and overlap equivalence checks passed.
- The repaired cloud scripts and the complete loader output parsed successfully.
- BT and Acil full-month test runs took approximately **34–39 seconds** before the final additional transaction validation. These timings are environment-dependent, not a speed guarantee.

The October BT/Acil pools had not been selected in the snapshot. September pools were used only in those private test copies. Users must select the intended October pools; the BT test had six unfilled cells with that input. Existing conflicts were preserved rather than silently deleting user assignments. Passing tests does not guarantee that arbitrary pools and constraints can fill every slot.

The wider repository test run encountered pre-existing missing YEA arcade vendor dependencies (`three.min.js` / `cannon-es.js`); those unrelated files were not changed.

## Data and rollback

No cloud workspace data, schema, signed archives or existing lists were changed by the audit. Private snapshots and cloud application source are not included in this repository. The local selective scheduling snapshot is a test fixture, not a full database backup.

Pre-release code rollback point: `42b1f9f6a553472ec6499c170159dad2e1db2076`.
Revert this release's code commit to roll back without restoring or overwriting workspace data. A code rollback does not undo later user edits.
