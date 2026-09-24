# HeaLoa Base · prototype preview (throwaway)

**Not** a formal App launch. **Not** aurora-companions / healoa.com website work.

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- Version stamp: **预览 v2026-09-24-i** · **Scene Seed / 场景种子**
- Single-file offline HTML demo + local place photos: pick a place → see/hear/operate a scene → solo create → optional **simulated** second person → save / restore → emit a **Scene Seed** (`#seed=` reopenable work URL) → friend opens **their own copy** and can add a stroke

App social currency (Living Editions · App side) = **Scene Seed** — “我发现了一个美的地方，并把创作邀请给你”.

## v2026-09-24-i UX (哈尔滨冰雪实景 + 武当 · share PNG)

- **Default hero place stays 武当**（「直接进 · 武当」）. Harbin is **additional**.
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
