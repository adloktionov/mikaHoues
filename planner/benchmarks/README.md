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

LoadAndWarmupMs in the JSON includes scene construction, shader warmup and five animation-frame waits. It is not a network load time. Results use procedural furniture; heavy imported model coverage belongs to the import milestone.

Three repeated quality cycles returned to the same geometry/texture counters at level 1 and preserved the project. This detects retained renderer resources in this scenario; it is not a full device-memory measurement.

Weak hardware has not been tested. No minimum-device performance guarantee is made.
