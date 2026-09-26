---
"@zkmake/three-meter": minor
---

Top costs: where the draw calls and triangles come from. A new "top costs" section in the full view lists the five biggest costs in the main render pass, by mesh or by material, sortable by calls or triangles; copies of one mesh share a row (`tree ×300`) so unmerged duplicates stand out, and clicking a row logs its objects to the console. Estimated from the scene graph the way three walks it (visibility, layers, frustum culling, material groups, two-pass transparent double-sided materials), matching `renderer.info` exactly on a test scene. The monitor finds the scene itself from the render call that drew the most. Also `monitor.getSceneCost()`, and the copied report gains the top three meshes.
