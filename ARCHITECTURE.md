# House Planner — approved architecture

Approved by Michael on 2026-10-09 in this conversation. Implementation lives in `planner/` on `codex/house-planner-v1`; `project/` remains the original application. No personal apartment or catalogue is migrated automatically.

## Product contract

Single-storey browser editor: assemble rooms by their clear internal dimensions, attach them with one physical shared wall, edit openings, calculate individual masonry pieces, furnish, view in 3D, save variants and portable archives. A shared-wall move changes both neighbouring rooms. Right and obtuse corners are supported, acute corners and self-intersections rejected. One masonry element through the wall thickness. Exterior AAC; interior ceramic/silicate brick or thinner AAC. Costs, foundations, reinforcement, roofs and accounts are out of this release.

## Data and boundaries

Metres, stable IDs, versioned ProjectDocument. Architecture (vertices/rooms/walls/openings), MasonryProfile/Result, FurnitureDefinition/Instance, LayoutVariant, AssetRecord. Data is the source of truth for Konva 2D, Three.js 3D and quantities. Commands are atomic, undoable; asynchronous results carry a revision. GPU resources are not reactive project data.

Vue 3, TypeScript, Vite, Pinia; Konva; direct Three.js WebGLRenderer; polygon-clipping; Dexie/IndexedDB; fflate project archives; GLTFExporter + glTF Transform/Meshoptimizer; Vitest, Playwright and vue-tsc. No backend or file upload. Import workers are cancellable. Node 24 is the development target.

## Masonry contract

One deterministic result drives both rendered pieces and the bill. Rows respect corners and openings, start at ends and meet centrally, validate bonding across rows, and account for kerf and original stock. Pieces shorter than half the base unit length are excluded. A 1.5-length corner unit is a distinct real SKU, never a stretched ordinary unit; available only when explicitly configured. Usable leftovers go centrally where bonding permits. No silent resizing of architecture. Incomplete/unsupported arrangements are diagnosed and never labelled a complete procurement count.

AAC and brick rule profiles are separate. Each normative check names its source, edition and clause. AAC baseline: STO NAAG 3.1-2013 §6.2.2 (bond), §6.3.1 (thin joints). Block products: GOST 31360-2024; ordinary brick needs its separate product/rule basis. Geometric checks do not constitute structural load design or certification. The minimum half-length rule is a user constraint, not attributed to STO. Last-course height cuts are treated separately.

## Furniture and assets

Wardrobe, shelving, cabinet and table templates support dimensions, shelves, sections, partitions and per-part materials. Instances edit independently. FBX and GLB/glTF required; retain original files, normalize units/orientation to GLB, analyze vertices/triangles/meshes/materials/textures, optimize and build proxies/LOD before placement. Keep hierarchy/UV/material names where possible and report loss. External resources only from chosen local files. OBJ/USD are future adapters, not promised universal support.

## Quality and persistence

Five manual profiles: 1 proxy/unlit/no shadows; 2 low LOD/small textures/simple light; 3 PBR/limited shadows; 4 detailed/shadows/AO; 5 best available within device budget. Quality never changes project geometry/materials. Heavy GPU resources must be absent/released in low quality. Sun + fill initially; lighting/HDRI editor last. PNG Photo Mode restores previous camera/mode/quality. No 3D support leaves 2D available.

IndexedDB autosave with explicit failure states, independent variants and architecture lock. Portable archive includes project, original and derived assets. No success label on quota failure. CSV and printable quantities. Desktop editor, mobile viewer initially. Legacy localStorage untouched.

## Acceptance

Geometry, masonry conservation and bonding, save/load/migration/undo/variants, good/bad/heavy/cancelled imports, real browser interactions and quality/resource cycling. Small/Typical/Heavy/Stress measurements for all five profiles. Weak-device support requires actual hardware validation, not simulated CPU slowdown. No claim of universal FBX support, photorealism or a solution for contradictory constraints.
