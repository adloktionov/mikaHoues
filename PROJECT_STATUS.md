# House Planner status

Implementation in progress on codex/house-planner-v1. Continuation state: docs/STATUS.md.

- Foundation and room geometry committed; original project/ unchanged.
- Masonry rows, actual corner pieces, joints, stock/offcuts/waste bill, CSV and incomplete-layout diagnostics implemented. Brick bonding is a project geometry rule, not normative certification.
- Furniture catalog, independent layout variants, dimensional controls, 2D/3D placement and 3D/Top/Walk implemented.
- Five quality profiles, real low-quality proxies, shadows/AO, renderer resource disposal and local benchmark matrix implemented. Heavy imported resource/LOD checks remain part of import work.
- Browser FBX prototype converts real models with embedded textures and supports immediate worker cancellation. Full import UI and optimization remain in progress.
- Remaining: complete import/LOD/archive integration, part/shelf editor, photo/light/HDRI, final release QA and instructions.

Evidence for individual steps is recorded in docs/STATUS.md. Local performance data: planner/benchmarks/README.md. Weak-device performance has not been verified.

Development URL: http://127.0.0.1:5174/ while the local server runs. Local commits only; pushing is prohibited by the latest user instruction.
