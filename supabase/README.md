# RPYS recovery, 2026-11-02

The old project's public application endpoint returned HTTP 402 with
`exceed_egress_quota`. The restored client therefore serves its program from
GitHub Pages (`rpys-app.html` and `rpys-assets/functions/`). It uses the existing
`RPYS_MAIN` workspace in the connected RPYS-NEW project for private records.

No personnel state, credentials, workspace secret, or snapshot is copied into
this repository. The bundled core starts with an empty embedded database.
Recovery did not replace the existing workspace or remove its 60 snapshots.

`functions/rpys-web/index.ts` implements the original `/api/` contract. Deploy
with `verify_jwt = false`: this application has its own username/password
authentication and verifies an opaque, revocable session on every private
request. Only a SHA-256 digest of each session token is stored, under a reserved
`rpys_session:` key in the existing private `rpys_cloud_state` table. Existing
bcrypt passwords remain unchanged; new password changes use PBKDF2. Passwords
are omitted from client state responses and preserved on normal state saves.

Use the platform's server-only service key environment variable; never place a
service key in client code. Existing table RLS remains enabled, with no public
read/write policy. Status polling fetches only the user/revision projection,
not the complete calendar database.

Writes require the expected existing revision, create a prior-state snapshot,
and update through a revision compare-and-swap. Automatic local imports cannot
overwrite the master. Existing personnel, task-loss, and cell-lock guards are
checked before saving. A concurrent update leaves the newer master intact.

Validation:

- `tests/recovery-api.test.cjs`: authentication, bcrypt compatibility, session
  revocation, password changes, privacy, guarded saves, and concurrent writes.
  Requires `bcryptjs@3.0.2` in the test dependency path.
- `tests/recovery.browser.test.cjs`: real bundled application and local add-ons,
  mocked private API, existing-state login and one revisioned save; asserts zero
  requests to the unavailable old project and zero writes merely from opening.
- The existing loader, reliability, and scheduler safety checks also pass.

Live workspace integrity was checked through the connected database: revision
3006, 37 staff, 3,748 main assignments, unchanged state fingerprint, last updated
2026-10-30. Browser tests use synthetic records; no test writes to RPYS_MAIN.
