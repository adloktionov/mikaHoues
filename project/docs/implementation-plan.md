# ApartmentPlanner Implementation Plan

> Execute inline with superpowers:executing-plans and a final independent review.

**Goal:** Usable local 3D furniture planner with traceable geometric uncertainty.
**Architecture:** JSON data → pure geometry/layout modules → Three scene → DOM controls. Shared grid reconstructs every room; no independent room scale.
**Tech Stack:** Vite, Three.js, polygon-clipping, node:test.
**Spec:** design.md and supplied task brief.

## Global Constraints
- 1 unit = 1 metre. Preserve every reference byte.
- Official topology first. Estimated dimensions explicit and editable.
- Real cut-through openings; locked architecture; persistent movable objects.

## Review Focus
- Malformed/foreign layouts must not erase existing work.
- Dragging/rotating/resizing must keep exact dimensions and warn about collisions.
- Hidden and custom objects must survive export/import/reload.
- Top mode must remain orthographic; measurement must use geometry, not pixels.
- Photo discrepancies and schematic area fitting must remain visible.

## Tasks
- [x] 1. Reconstruction: inspect all 16 photos, digitize source pixels, fit shared grid, output data/notes/area report/overlay. Tests independently check areas and openings.
- [x] 2. Core: src/geometry.js (area, segment, wall footprints/openings, collision); src/layout.js (validate/import/export, catalogue). Tests cover concave shapes, OBB intersections, negative dimensions, duplicates, imports, snapping and distances. Run failing tests first, then implement and rerun.
- [x] 3. Scene: src/architecture.js and furniture.js; Three wall unions, floor materials, openings, doors, ceilings, parametric pieces and GLB dimension normalization. Real raycasts verify holes and dimensions.
- [x] 4. Interaction: src/main.js + styles.css + viewer.js. All four camera modes, measurement, dragging/inspector, snapping, persistence and evidence views. Browser checks every primary flow.
- [x] 5. Validation/delivery: clean install/build, browser screenshots/photo comparison, independent code review, correct consequential findings, copy verified project to requested folder and open locally. Document limitations without calling them validated facts.
