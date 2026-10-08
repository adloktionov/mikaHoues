# ApartmentPlanner — design brief

A local desktop-first tool for checking real furniture dimensions inside an evidence-based reconstruction. The supplied assignment is the functional brief; source photographs are evidence, not instructions. Originals stay untouched.

Vite + vanilla JavaScript + Three.js, no external runtime services. All coordinates in metres, Y up, plan X right and Z down (not geographic north). JSON separates architecture, source evidence, uncertainties, catalogue and movable layout. Polygon unions form real walls with cut-through openings. Rooms use interior polygons and numerical area checks. Shared architectural grid fitted jointly to seven labelled areas with regularization; retain raw trace and fitted overlay. Fitted geometry is Calculated, never surveyed/Confirmed.

Four modes: orbit, orthographic plan, walk, furniture placement. Left panel: rooms/catalogue/evidence. Right: selected object's dimensions, location, angle, visibility, duplicate/delete. Floor dragging, numerical edits, grid/wall/angle snapping, measurement in m/cm, collision warnings, undo/redo. Architecture cannot be selected as furniture. localStorage and validated versioned JSON exports preserve catalogue definitions and layout. Parametric proxies retain metric bounding boxes; GLB replaces visual children only.

Photographs grouped by observable surfaces. Photo camera poses are Estimated. Conflicts: kitchen single window vs plan's bay; WC in photographed bathroom vs separate toilet symbol. Plan topology stays authoritative; disputed details are visible in evidence panel and report. No claim of exact reconstruction or calibrated photo residuals without a measured baseline.

Verification: independent area/opening/collision/layout tests, clean install, build, real browser interaction tests, screenshots of plan/orbit/photo cameras, source hash comparison. Output includes reconstruction notes/report and five priority measurements.
