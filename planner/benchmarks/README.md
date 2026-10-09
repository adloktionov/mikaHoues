# Local rendering measurements

Local Chrome headless on this Mac. CPU render submission and animation-frame intervals, not GPU timer queries. Memory is an estimate. Not evidence for weak-device support.

Recorded: 2026-10-09T11:26:19.089Z

Browser: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36

Viewport: 900 × 600 CSS pixels. Fixtures: 6 / 40 / 160 / 600 furniture instances.

| Scene | Quality | CPU median ms | Frame interval median ms | Draw calls | Triangles | Estimated MB |
|---|---:|---:|---:|---:|---:|---:|
| Small | 1 | 0.30 | 17.00 | 9 | 118 | 4.1 |
| Small | 2 | 0.80 | 16.40 | 54 | 658 | 4.2 |
| Small | 3 | 0.60 | 16.60 | 107 | 1316 | 12.2 |
| Small | 4 | 0.90 | 16.40 | 217 | 2636 | 65.0 |
| Small | 5 | 0.80 | 17.00 | 217 | 2636 | 161.0 |
| Typical | 1 | 0.30 | 16.70 | 43 | 530 | 4.2 |
| Typical | 2 | 1.90 | 17.20 | 313 | 3770 | 4.4 |
| Typical | 3 | 1.60 | 16.60 | 619 | 7468 | 12.4 |
| Typical | 4 | 2.90 | 17.00 | 1241 | 14940 | 65.2 |
| Typical | 5 | 2.60 | 17.00 | 1241 | 14940 | 161.2 |
| Heavy | 1 | 2.20 | 17.20 | 163 | 1964 | 4.3 |
| Heavy | 2 | 3.00 | 16.80 | 1243 | 14924 | 5.1 |
| Heavy | 3 | 3.90 | 17.10 | 1689 | 20296 | 13.1 |
| Heavy | 4 | 6.90 | 16.70 | 3381 | 40596 | 66.0 |
| Heavy | 5 | 5.60 | 17.50 | 3381 | 40596 | 162.0 |
| Stress | 1 | 1.90 | 17.00 | 603 | 7244 | 4.6 |
| Stress | 2 | 7.80 | 16.50 | 4653 | 55844 | 7.9 |
| Stress | 3 | 9.50 | 16.70 | 5099 | 61216 | 15.9 |
| Stress | 4 | 17.60 | 19.40 | 10201 | 122436 | 68.7 |
| Stress | 5 | 17.00 | 18.20 | 10201 | 122436 | 164.7 |

LoadAndWarmupMs in the JSON includes scene construction, shader warmup and five animation-frame waits. It is not a network load time. The table above uses procedural furniture; imported measurements are listed below.

Three repeated quality cycles returned to the same geometry/texture counters at level 1 and preserved the project. This detects retained renderer resources in this scenario; it is not a full device-memory measurement.

Weak hardware has not been tested. No minimum-device performance guarantee is made.

## Imported furniture measurements

Recorded: 2026-10-09T21:28:41.890Z. One textured FBX fixture (970 source triangles), reused across 6 / 40 / 160 / 600 independently placed instances. Import: 65.9 ms; GLB 405856 bytes; low GLB 212096 bytes.

Local Chrome headless on this Mac. CPU render submission and animation-frame intervals, not GPU timer queries. One repeated imported asset shares GPU resources; this does not simulate 600 unique assets. Memory is an estimate. Not evidence for weak-device support.

| Scene | Quality | CPU median ms | Frame interval median ms | Draw calls | Triangles | Estimated MB |
|---|---:|---:|---:|---:|---:|---:|
| Small | 1 | 0.30 | 16.60 | 9 | 118 | 4.1 |
| Small | 2 | 0.60 | 16.50 | 9 | 5854 | 4.3 |
| Small | 3 | 0.80 | 16.70 | 17 | 11708 | 12.3 |
| Small | 4 | 0.80 | 16.60 | 37 | 23468 | 65.2 |
| Small | 5 | 0.30 | 16.70 | 37 | 23468 | 161.2 |
| Typical | 1 | 0.90 | 16.70 | 43 | 530 | 4.2 |
| Typical | 2 | 1.00 | 16.70 | 43 | 38770 | 4.3 |
| Typical | 3 | 0.80 | 16.50 | 85 | 77540 | 12.3 |
| Typical | 4 | 1.70 | 16.80 | 173 | 155404 | 65.2 |
| Typical | 5 | 0.80 | 16.70 | 173 | 155404 | 161.2 |
| Heavy | 1 | 2.00 | 17.70 | 163 | 1964 | 4.3 |
| Heavy | 2 | 1.80 | 16.80 | 163 | 154924 | 4.3 |
| Heavy | 3 | 1.00 | 16.70 | 325 | 309848 | 12.3 |
| Heavy | 4 | 1.90 | 16.60 | 653 | 620980 | 65.2 |
| Heavy | 5 | 1.70 | 16.70 | 653 | 620980 | 161.2 |
| Stress | 1 | 2.90 | 17.10 | 603 | 7244 | 4.6 |
| Stress | 2 | 1.70 | 16.80 | 603 | 580844 | 4.3 |
| Stress | 3 | 2.60 | 16.60 | 1205 | 1161688 | 12.3 |
| Stress | 4 | 3.20 | 16.70 | 2413 | 2328180 | 65.2 |
| Stress | 5 | 3.80 | 16.90 | 2413 | 2328180 | 161.2 |

The same source geometry/textures are shared by repeated instances. This measures many placements, not hundreds of unique high-resolution models. Imported quality cycling has a separate release/disposal test. Shadow/AO passes count toward rendered triangles. These measurements do not establish support for weak hardware.
