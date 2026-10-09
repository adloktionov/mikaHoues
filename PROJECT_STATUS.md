# House Planner — first release implemented

Status: DONE. Branch: codex/house-planner-v1. Local commits only; no push or merge. Original project/ is unchanged. The new application is in planner/.

Implemented: room/shared-wall editing and openings; masonry courses and separate material/stock/offcut/waste bill; furniture, independent layouts and 2D/3D/Top/Walk; five quality profiles with imported LOD/resource disposal; local FBX and GLB/glTF import/preview/optimization/catalog/archive; editable furniture parts/materials; PNG capture; sun/local lights and Radiance HDRI.

User instructions: [docs/USER_GUIDE.md](docs/USER_GUIDE.md). Open http://127.0.0.1:5174/ while the development server runs. QA evidence: [docs/RELEASE_QA.md](docs/RELEASE_QA.md). Detailed work ledger: docs/STATUS.md.

Final build/typecheck and production workflow passed on 2026-10-10. Independent sequential review found two P2 defects; both were reproduced and fixed. Additional archive-integrity and save-race defects were fixed during final QA. Completed legacy checks were not rerun, as requested.

Limits: measurements cover this Mac/Chrome, not weak hardware or all browsers. Imported benchmarks reuse one asset; they do not simulate hundreds of unique large models. Brick bonding is a project geometry rule, not structural/normative certification. Incompatible masonry remains visibly incomplete. Arbitrary FBX/glTF compatibility, OBJ/USD, prices, foundation, roof and collaborative accounts are outside this release.

Automatic continuation house-planner-2 is disabled because the implementation is complete. No further work without a new user request.
