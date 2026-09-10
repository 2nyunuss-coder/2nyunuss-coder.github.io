# Runtime dependencies

The published source and APKs do not contain copies of the third-party engines.
The browser loads the fixed versions directly using CDN links with SHA-384 SRI:

- Three.js r160: `https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/build/three.min.js`
- Cannon.js 0.6.2: `https://cdn.jsdelivr.net/gh/schteppe/cannon.js@v0.6.2/build/cannon.min.js`

Both projects identify their license as MIT. License/source pages:
https://github.com/mrdoob/three.js/tree/r160 and https://github.com/schteppe/cannon.js/tree/v0.6.2 .

First launch needs internet. The PWA caches these external responses on the user's
device after successful preparation. The native Android shell does not promise
offline rendering; it uses the platform's normal HTTP cache.

Local scene tests use separately installed `three@0.160.0` and `cannon@0.6.2` Node
dependencies, or the ignored local copies already available in the authoring workspace.
