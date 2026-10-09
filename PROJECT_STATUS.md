# House Planner status

Implementation in progress on codex/house-planner-v1. Continuation state: docs/STATUS.md.

- Foundation and room geometry committed; original project/ unchanged.
- Masonry rows, actual corner pieces, joints, stock/offcuts/waste bill, CSV and incomplete-layout diagnostics implemented. Brick bonding is a project geometry rule, not normative certification.
- Furniture catalog, independent layout variants, dimensional controls, 2D/3D placement and 3D/Top/Walk implemented.
- Five quality profiles, real proxies, imported low/full models, shadows/AO and resource disposal implemented. Imported geometry/texture cycling is checked; the benchmark matrix still describes procedural scenes only.
- Browser FBX and GLB/glTF import: external files, orientation/scale, optimization, preview, cancellation, original retention and portable catalog/archive implemented. Missing textures fail explicitly. A >60k-triangle model and cancellation were tested, not arbitrary large files.
- Furniture construction and part materials, Photo PNG with settings restoration, sun/point/spot editor and local Radiance HDRI implemented with targeted checks.
- Remaining: final integration and visual QA (especially HDRI upload UI, nonuniform panorama orientation, production worker bundle and end-to-end photo download), imported-scene benchmark coverage, release instructions and honest limitations. Do not declare release complete yet. Weak hardware has not been tested.

Evidence for individual steps is recorded in docs/STATUS.md. Local performance data: planner/benchmarks/README.md. Weak-device performance has not been verified.

Development URL: http://127.0.0.1:5174/ while the local server runs. Local commits only; pushing is prohibited by the latest user instruction.
