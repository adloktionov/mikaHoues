# Release QA — 2026-10-10

First release implemented on codex/house-planner-v1. Evidence is scoped to the tested scenarios; no universal compatibility or weak-device claim.

- Final production build and vue-tsc passed.
- Production UI: imported real textured FBX, uploaded a nonuniform HDR panorama, downloaded a valid 1280×720 PNG, restored working quality, reloaded the saved project, exported/imported its archive and recovered model/HDRI resources. Browser console had no uncaught errors. Actual editor/photo screenshots were inspected.
- HDR orientation: upper/lower hemispheres checked by pixel colors on a mirror sphere.
- Imported LOD: actual triangle reduction, unchanged normalized dimensions, three quality cycles releasing geometry/textures and rejection of stale loads.
- External resources: local BIN/texture resolution, missing-texture error without remote request, cancellation and subsequent successful import of a >60k-triangle model.
- Furniture: construction/material edits, Undo/Redo, persistence and independent variants. Imported instance material does not change shared originals.
- Storage regressions: forged ZIP sizes, CRC mismatch, malformed model metadata and resource-type mismatch are rejected. Edits made during archive parsing or resource refresh remain in the current document. Failed first save remains dirty.
- Sequential independent review: HDRI crossing project boundaries and unchecked asset metadata were the two actionable findings; both have passing regression tests. No new masonry defect was confirmed within valid project constraints.
- Procedural and imported benchmark matrices each cover Small/Typical/Heavy/Stress on five quality profiles. See ../planner/benchmarks/README.md and its JSON files for measured data and limitations.

Earlier room geometry, shared walls, masonry courses/stock balance and legacy verification are recorded in STATUS.md and were not repeated solely for completion. Only checks affected by later fixes were rerun. Arbitrary numerical contours, every FBX/glTF feature, other browsers and weak hardware remain unverified. The original project/ is unchanged.
