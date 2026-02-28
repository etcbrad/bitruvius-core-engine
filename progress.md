Original prompt: "widen the side console two head squares and make all base features visible without scrolling. Utilize minimized windows. Allow us to drag sections onto the canvas for canvas-centered, custom tools. All toggles, tools should be viewable and reversable when they will not break the model, then they can be blocked out. Build the most up to date version, but consolidate the UI/UX so it all stems from the side menu. Canvas only has click and drag and the buttons on there now."

2026-02-28
- Consolidate UI entry points into the left sidebar (move Console/Tools toggles off-canvas).
- Widen side panels and switch Console to a right-side docked panel with minimize support.
- Introduce a simple draggable “window” pattern for Tools/Console so panels can be moved/minimized without losing access.

TODO
- Convert remaining sidebar sections to collapsible/minimized headers so the full feature set is accessible without vertical scrolling.
- Add drag-from-sidebar → drop-on-canvas for additional sections (e.g., Joint Inspector, Timeline) once section content is refactored into reusable renderers.

2026-02-28
- Added per-joint mask system UI (upload/visible/opacity/scale/offset + center + clear) with a briefly-armed “Place” mode that enables drag placement and auto-disarms after dropping.
- Render joint masks in the SVG, anchored to each joint’s world position; size is 1 head-length (head↔cranium distance ×2) times the mask scale.
- Widened background/foreground reference layer scale ranges to 0.01–20.
- Added a visible build stamp (`build joint-masks-drag-2026-02-28`) in the sidebar header and logged it on startup to disambiguate old servers.

2026-02-28
- Restored “advanced UI” affordances: widened sidebar to 360px (+2 head-squares) and added draggable canvas widgets (sidebar `Widgets` section) including a floating `Console` panel with level filters + clear.

2026-02-28
- Replaced the IK 2-bone solver with an anchored FABRIK solver for end-effectors (arms/legs/head), keeping limb roots fixed (shoulders/hips/cranium) to reduce whole-body drift and improve stability.

2026-02-28
- Added “balance IK” path for IK/Hybrid drags: when ankle pins are active and you drag head/core joints, the rig translates from `sacrum` while re-solving pinned legs so pinned ankle world positions stay fixed (with reach clamping + optional spine FABRIK when clamped).

2026-02-28
- Implemented XPBD/PBD-style “Pose Physics” mode driven by the existing `Elasticity (S)` toggle: hard pin constraints + rigid hierarchy bones + soft wire constraints + optional hinge limits (Hard Stop) and hinge bias (Auto-Bend), with cursor-follow dragging and planted feet via pins.
