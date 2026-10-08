# Apartment variants implementation plan

Goal: protected original scene plus independent named layouts, with loss-resistant local persistence and JSON backups.
Architecture: immutable original scene references Architecture v2; each editable variant stores validated layout, parameter overrides and metadata. A pure variant store owns transactions and migration; the existing UI owns scene rendering and action guards.
Spec: user attachment 645a49a5-07a9-4cc7-ac55-32682c38f3d4/Pasted text.txt.

Constraints: preserve existing architecture, materials and nine original objects; preserve old browser keys as migration backup; no dependencies; protect original in all edit paths; confirm delete/reset/replace. Corridor correction awaits missing marked image or unambiguous user location.

Review focus: invalid or inaccessible storage never overwritten; failed write never reported saved; stale browser tab cannot silently overwrite newer store; per-variant history and parameters cannot leak across switches; old JSON remains importable.

1. tests/variants.test.js → src/variants.js: migration, immutable copies, independent layouts/parameters, original protection, metadata, transactional CRUD/import, JSON validation, quota/corruption/stale writes.
2. data/original-scene.json plus digest test: snapshot original nine objects, original catalogue definitions/materials/default parameters; reference shared Architecture v2 rather than duplicate architecture per layout.
3. src/variant-ui.js + existing src/main.js: selector/actions, read-only banner and guards, own history per active view (clear on switch), variant autosave, parameters restoration, import/export all/one and confirmation dialogs.
4. Browser QA: create from original, edit/add/move/save, switch original/back, reload, export/import, reset/delete cancel/confirm, read-only shortcuts, narrow UI and legacy migration.
5. Build and architecture verification; guarded deploy changed files with backup; open production variants control. Report corridor status accurately if source remains missing.
