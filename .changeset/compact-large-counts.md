---
"@zkmake/three-meter": patch
---

Counts of 100,000 and up now show in compact notation (`250K`, `1.4M`, `1.2B`) instead of
overflowing the compact card's value column into the next label; a scene with a million triangles
read `1,076,708` across two cells. Smaller counts keep their exact thousands separators.
