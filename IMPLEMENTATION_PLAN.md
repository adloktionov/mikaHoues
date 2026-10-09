# House Planner Implementation Plan

> Use superpowers:executing-plans inline. Approved architecture: ARCHITECTURE.md. Follow test-first implementation and milestone commits.

**Goal:** implement the approved single-storey room, masonry and interior planner.
**Architecture:** serializable domain data drives independent geometry, masonry workers and renderers; local persistence and portable assets.
**Tech Stack:** Vue/TS/Vite, Pinia, Konva, Three, Dexie, glTF Transform, Meshoptimizer, Vitest/Playwright.
**Spec:** ARCHITECTURE.md

## Global Constraints
Preserve project/. No backend. Metres. Real 1.5 SKUs only. No invented masonry certification. Five quality profiles. Browser-only FBX import. Source assets retained. UI in Russian. Branch codex/house-planner-v1.

Latest user override: local commits only; do not push, create worktrees/chats or parallel implementers. Completed checks are recorded in docs/STATUS.md and must not be repeated without a new regression concern. The original checklist below is historical planning; docs/STATUS.md is the authoritative progress ledger.

## Review Focus
- Invalid archives, ZIP expansion, missing asset references: reject transactionally.
- Concurrent saves/project switching: no stale overwrite or lost unsaved edits.
- Joined-room changes and openings: stable identity and no silent dimension loss.
- Impossible bonding/corners/cuts: no apparently complete false quantity.
- Cancelled imports/quality cycles: no stale worker application or leaked GPU resources.

### Task 1: Foundation
Files: planner/package.json, src/domain/{types,project,history}.ts, src/storage/database.ts, tests/project.test.ts.
Interfaces: createProject(): ProjectDocument; validateProject(unknown): ProjectDocument; History.apply/undo/redo; Repository.save/load/list/remove.
- [ ] Write failing tests for project validation, atomic commands, independent variants, archive roundtrip, stale writes.
- [ ] Implement typed core, IndexedDB repository and Vue shell; establish isolated FBX worker feasibility.
- [ ] Run unit tests, typecheck, build, browser reload; commit.

### Task 2: Room geometry
Files: src/domain/geometry.ts, src/components/PlanCanvas.vue, tests/geometry.test.ts.
Interfaces: deriveWalls(project), addRoom, attachRoom, moveSharedWall, validatePolygon, openingsForWall.
- [ ] RED: 4×5 internal room=20m²; adjacent rooms maintain areas; partial shared wall; acute/self-intersect rejection; opening conflict.
- [ ] Implement geometry and editor tools with one undo per gesture.
- [ ] GREEN + browser create/attach/resize/openings; commit.

### Task 3: Masonry
Files: src/masonry/{solver,rules,bill}.ts, src/workers/masonry.worker.ts, tests/masonry.test.ts.
Interfaces: solveMasonry(architecture,profiles): MasonryResult; billCsv(result).
- [ ] RED: no overlap/gaps beyond joints, stock conservation, half-length/kerf, explicit 1.5 SKU, doors/windows, bond violations and incomplete diagnostics.
- [ ] Implement deterministic row solver, corner ownership and quantity aggregation; worker revision/cancel controls.
- [ ] GREEN + inspect rows and exported bill; commit.

### Task 4: Furniture and 3D
Files: src/domain/furniture.ts, src/render/{scene,furniture}.ts, src/components/SceneView.vue, tests/furniture.test.ts.
Interfaces: buildFurniture(instance), scene update/dispose, variants and collisions.
- [ ] RED: dimensions, local parts, variants, resize/rotate and collisions.
- [ ] Implement catalogue, scene, Top/Orbit/Walk and numerical inspector.
- [ ] GREEN + browser placement/navigation; commit.

### Task 5: Quality and performance
Files: src/render/{quality,resources}.ts, benchmarks, tests/quality.test.ts.
- [ ] RED: low quality avoids heavy assets; cycling releases resources and preserves document.
- [ ] Implement 5 profiles, render on demand, LOD, stats and 4 benchmark fixtures.
- [ ] GREEN + browser quality cycling; commit.

### Task 6: Import
Files: src/assets/{importer,analysis,archive}.ts, src/workers/import.worker.ts, tests/import.test.ts.
- [ ] RED: real FBX/GLB, resources, corruption, cancellation, normalization, original retention.
- [ ] Implement analyze/normalize/optimize/LOD/preview/save/place with explicit losses and local-only resource handling.
- [ ] GREEN + browser worker cancellation and archive roundtrip; commit.

### Task 7: Parametric furniture
Files: src/components/FurnitureInspector.vue, domain/furniture.ts.
- [ ] RED: shelves/sections/thickness/per-part material bounds and undo.
- [ ] Implement part editor and live preview; validate impossible dimensions.
- [ ] GREEN + browser local material edits; commit.

### Task 8: Photo, lighting, QA and handoff
Files: src/render/{photo,lighting}.ts, browser tests, README.md, PROJECT_STATUS.md.
- [ ] RED: PNG export restores mode/camera/quality, local HDRI validation, light edits roundtrip.
- [ ] Implement Photo Mode and finally lighting/HDRI; verify benchmark matrix.
- [ ] Complete final integration/visual QA and review, fix findings and commit locally. Preserve completed checks; do not repeat legacy tests or push (latest user override).
- [ ] Document measured results and limitations; never label unverified stages complete.
