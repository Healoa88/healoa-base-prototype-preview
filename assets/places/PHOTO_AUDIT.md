# Photo audit · v2026-09-27-y

Cindy (2026-09-27): photo choice and framing need taste. For hot springs we had used the least attractive photo, and aspect ratio (phone vs desktop, portrait vs landscape) matters.

**How the App uses photos now**
- Each place's **HERO** is its best **portrait** photo. The phone uses it for the flip card, the result card, the place page and all places (4:5), and the 9:16 share image and video use it too (1080×1920).
- **WIDE** is a landscape photo, used as the blurred backdrop behind the centred phone-width frame on desktop and landscape screens.
- Every photo uses `object-fit: cover` with a per-photo focal point (`app/data.js` → `PHOTO_META` → `object-position`, and the same focal point in the canvas exports). Nothing is ever stretched.
- No credit is laid over photos. The copyright line sits at the bottom of every page and on the bottom edge of every export (R10).

Contact sheets with the picks marked (Cindy can overrule any pick): `/workspace/v4-y-shots/photo-audit-{wudang,pattaya,onsen,harbin,cabin-forest}.png`. Regenerate them with `python3 tools/photo_audit.py`.

Rank: 1 = best for that place, judged on composition, light, sharpness and emotional pull.

## 武当山 Wudang
| # | file | size | orient. | role | note |
|---|---|---|---|---|---|
| 1 | wudang/02-terrace-sunrise.jpg | 1170×1560 | P | **HERO**, autumn season photo, 2.5D | golden sunrise over the cloud sea, strong leading lines |
| 2 | wudang/03-crane-peaks.jpg | 1080×1916 | P | gallery | dramatic, true 9:16; alternative hero |
| 3 | wudang/vista/01-cliff-pavilion.jpg | 1050×1400 | P | gallery, "sit" activity | calm |
| 4 | wudang/01-cloud-sea-sun.jpg | 1080×1440 | P | practice background | hazy |
| 5 | wudang/homestay/01-courtyard-house.jpg | 1050×1400 | P | gallery, walk activity | old hero, flat light |
| 6 | wudang/homestay/02-window-tea-terrace.jpg | 787×1400 | P | gallery, Baduanjin activity | cozy |
| 7 | wudang/05-mist-rays.jpg | 810×1080 | P | not used | low resolution |
| 8 | wudang/04-monkey-temple.jpg | 1080×1441 | P | not used | busy frame |
| 9 | wudang/bustle/01-stairs-cable-crowd.jpg | 1400×1050 | L | not used | crowded, and the only landscape photo |

## 芭提雅 Pattaya
| # | file | size | orient. | role | note |
|---|---|---|---|---|---|
| 1 | thai/pool/01-infinity-coast.jpg | 787×1400 | P | **HERO** | infinity pool into the bay |
| 2 | thai/sunset/01-pattaya-harbor-dusk.jpg | 1400×1050 | L | **WIDE**, walk activity, autumn wide | best mood, but landscape only |
| 3 | thai/pool/03-long-pool-canopy.jpg | 1400×1050 | L | gallery, "sit" activity | |
| 4 | thai/market/01-floating-market-boat.jpg | 1400×1050 | L | not used | busy |
| 5 | thai/pool/02-deck-photo.jpg | 1400×1050 | L | not used | a person in frame |
| 6 | thai/dive/01-scuba-pair.jpg | 1320×660 | L | not used | people, off-topic |

## 草津温泉 Kusatsu onsen
| # | file | size | orient. | role | note |
|---|---|---|---|---|---|
| 1 | onsen/02-hot-spring-falls.jpg | 787×1400 | P | **HERO**, practice background | steaming falls, depth and motion |
| 2 | onsen/01-hot-spring-field-town.jpg | 787×1400 | P | gallery, activities | overcast, bland buildings (the old pick) |

## 哈尔滨 Harbin
| # | file | size | orient. | role | note |
|---|---|---|---|---|---|
| 1 | harbin/01-night-snow-roofs.jpg | 1050×1400 | P | **HERO**, winter season photo | night snow, warm lights |
| 2 | harbin/02-night-lanterns-snowman.jpg | 1400×787 | L | **WIDE**, breathing activity, winter wide | |
| 3 | harbin/04-stairs-street-blue-sky.jpg | 787×1400 | P | gallery | |
| 4 | harbin/03-day-milk-tea-village.jpg | 1400×787 | L | gallery, "sit" activity | old hero, flatter |

## Cabin / forest (practice and season backgrounds only; not places)
See the `photo-audit-cabin-forest.png` sheet. In use: cabin/04-soup-window-warm and forest/path/01-leaf-tunnel as practice backgrounds.

## Shots to ask Cindy for
- **Onsen:** a genuinely good **portrait** (warm or golden light, evening lanterns, steam over the 湯畑, a quiet footbath) and **any landscape** for desktop. Both current photos are overcast.
- **Wudang:** a calm **landscape** (cloud sea or terrace, no crowds) for desktop. Right now desktop falls back to the blurred portrait hero.
- **Pattaya:** the dusk harbour mood in **portrait**. The best Pattaya photo is landscape only, so the phone hero is the pool.
- **Harbin:** fine as it is (good portrait plus landscape).

## Practice stills (2026-10-01)
Cindy’s own Tai Chi / Baduanjin stills in `assets/practices/`. Prefer vertical for phone practice UI. `06-zixiao-steps-mist` / `wudang/07` are atmospheric but low resolution — mood/gallery only, not place hero. Courtyard class (`wudang/06`) is the autumn desktop wide backdrop.
