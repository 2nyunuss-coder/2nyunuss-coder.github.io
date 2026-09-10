# YEA 1.9 — 3D games and app delivery

This release only changes YEA and adds separate native shells. RPYS files, engine,
records, authentication and databases are outside the change scope. The concurrent
history query center/theme update is retained.

## Games

- Six real-time Three.js mesh scenes with cameras, lighting and shadows.
- Castle uses Cannon.js rigid-body contacts, gravity, impulses and falling towers;
  20 levels and an 80% destruction objective.
- Wood uses a spinning, dynamically deformed lathe mesh and procedural grain;
  12 profiles, three finishes, target outlines and cutting particles.
- Hole uses 3D toy props, a floor cutout, animated falling and growth; 20 levels.
- Territory uses raised Voronoi regions, animated units and a rival; 20 levels.
- Arrows and Blocks use raised 3D pieces with animated departures; 20/30 levels.
- The prior local progress key remains unchanged; JSON backup/import is available.
- These are original stylized adaptations, not identical commercial game copies.
  They are not photorealistic, and the simulations are intentionally simplified.

## Installation

- `/yea-suite/apps/` is the common installation/download page.
- iOS: separately installable PWAs via Safari. No signed IPA/TestFlight build exists.
  Apple signing/provisioning and developer distribution are required for that.
- Android: two Gradle product flavors (`com.yea.suite`, `com.yea.arcade`).
  Original game assets are bundled, but external engine loading needs internet. Suite connects to the existing
  HTTPS site/account; it is a native WebView shell, not a native UI rewrite.
- APKs are development-signed personal-use test builds, not Play Store releases.
  A future build may have a different debug certificate. Back up game progress
  before replacement/reinstallation; do not uninstall to troubleshoot without a backup.
- Native and browser local storage are separate. Move game progress using JSON.
- File import/export uses the Android system picker, not broad storage permission.
- The Android workflow builds on the development branch, and publishes a prerelease
  containing both APKs only on main. It does not alter Pages configuration.

## Verification scope

Node syntax/model/scene-structure checks and the existing reliability/history tests
are run. Native compilation is performed in the Android workflow. Physical device,
Safari/Chrome UI, GPU rendering and end-to-end authenticated write tests are not
claimed. A real-device visual/performance pass remains important before store release.

Third-party engines: Three.js r160 and Cannon.js 0.6.2 are linked from fixed external
distribution URLs with integrity hashes. They are not mirrored in this repository
or included in the APKs. Initial engine loading requires internet. PWA offline use
is available only after successful external/local cache preparation.
