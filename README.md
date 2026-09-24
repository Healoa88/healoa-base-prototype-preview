# HeaLoa Base · prototype preview (throwaway)

**Not** a formal App launch. **Not** aurora-companions / healoa.com website work.

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- Version stamp: **预览 v2026-09-24-k** · **Scene Seed / 场景种子**
- Single-file offline HTML demo + local place photos: pick a place → see/hear/operate a scene → solo create → optional **simulated** second person → save / restore → emit a **Scene Seed** (`#seed=` reopenable work URL) → friend opens **their own copy** and can add a stroke

App social currency (Living Editions · App side) = **Scene Seed** — “我发现了一个美的地方，并把创作邀请给你”.

## v2026-09-24-k UX (森林三路径选择)

- Pick **森林** from the place list → **path chooser** `#s2f` (not body questionnaire, not auto one path). Mirror of Wudang `#s2w`.
- Three photo paths: **廊前远望** (`forest-porch`) · **林中路** (`forest-path`, soft-cycles leaf/monstera/canopy) · **屋里创作** (`forest-cabin`, merges cabin set; honesty **窗外可能很冷 · 非医疗主张**).
- Default CTA remains **直接进 · 武当**. Harbin + Wudang paths unchanged. Thai assets left **unwired**.
- Scene Seed P0 honesty unchanged. Tests: **113/113 PASS**.

## v2026-09-24-j UX (武当三路径选择)

- Pick **武当** or **直接进 · 武当** → **path chooser** (not body questionnaire, not auto one path).
- Three photo paths: **疗愈民宿 · 慢住** (`wudang-homestay`) · **山中胜景 · 被山震住** (`wudang-vista`) · **热闹观景** (`wudang-bustle`, honesty badge **人多／热门打卡**).
- Tap path → enter that playable scene immediately (matching `PLACE_PHOTOS` hero; 民宿 soft-cycles tea terrace).
- Harbin intact; cabin photos may exist on disk but are **not wired** in this tip (parent next).
- No medical claims; P0 seed honesty unchanged.

## Prior v2026-09-24-i (哈尔滨冰雪实景 + 武当 · share PNG)

- **Default CTA family stays 武当**. Harbin is **additional**.
- **Real-photo places**: 武当 + **哈尔滨冰雪** under `assets/places/{wudang,harbin}/` (relative paths for GitHub Pages).
- Harbin place card: photo thumb + cold / ~2-month / 雪乡奶茶／暖食 bullets (customer-readable in ~3s). Scene feel copy is honest (约零下28℃ · 并不适合每个人 · 年开约两月) — **not** a medical prescription.
- Scene shell / Scene Seed live card / share PNG: `PLACE_PHOTOS` + `ensurePlacePhotoReady` cover-draw hero (same path as Wudang).
- Homepage badge: **多地实景（武当太极／哈尔滨冰雪）** without lengthening the form wall.
- Honesty: **演示用实景（武当／哈尔滨）· 非正式付费素材包 · 页内PNG≠富卡片** — no Keeper / Choose Again / Circle signup; no Track B.
- Other places may stay procedural for now.

## Prior (v2026-09-24-h / g / f)

- h: polish share-card PNG with real Wudang hero.
- g: embed real Wudang photos as default hero place.
- f: Primary CTA「走进场景试试」goes to place pick; body×season optional.
- Share-tail: after one mark →「发给朋友」; P0 honesty (copy ≠ live shared work / UNKNOWN). No `#seedId=` fake invites.

## Invite honesty (P0)

| | |
|---|---|
| **Implemented** | Friend opens `#seed=` and continues on **their own copy** |
| **UNKNOWN / not implemented** | Both sides share **one continuously updating work** |
| **Simulated** | Same-device “第二人加入” — always labeled **模拟** |
| **Never ship** | `#seedId=` as a friend invite |

## Tests

```bash
cd /workspace/healoa-base-prototype-preview
npm i
npx playwright install chromium   # once
npm run test:scene-seed
```

Evidence: `/workspace/docs/demo-evidence-2026-09-24/` (`harbin-*.png`, `wudang-*.png`, `14-*`).
