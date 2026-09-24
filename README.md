# HeaLoa Base · prototype preview (throwaway)

**Not** a formal App launch. **Not** aurora-companions / healoa.com website work.

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- Version stamp: **预览 v2026-09-24-h** · **Scene Seed / 场景种子**
- Single-file offline HTML demo + local place photos: pick a place → see/hear/operate a scene → solo create → optional **simulated** second person → save / restore → emit a **Scene Seed** (`#seed=` reopenable work URL) → friend opens **their own copy** and can add a stroke

App social currency (Living Editions · App side) = **Scene Seed** — “我发现了一个美的地方，并把创作邀请给你”.

## v2026-09-24-h UX (武当实景 · share-card PNG polish)

- **Default hero place = 武当**（「直接进 · 武当」）when Wudang exists in `PLACES`.
- Wudang place card + scene shell + Scene Seed card/PNG use **real demo photos** under `assets/places/wudang/` (relative paths for GitHub Pages).
- Share-card PNG export (竖版/方版): waits for Wudang hero load, cover-draws **real photo** (not leaf/placeholder), stronger scrim for readable text, **1080×1440 / 1080×1080** canvas for crisp save/send. Honesty foot: 演示用实景 · 页内PNG≠链接富卡片.
- Homepage customer voice: 先感受太极好去处的气氛 → 留下一笔 → 邀请朋友加一笔 → 以后再决定要不要真去. Keep: 不用先填一堆表，也不用真的先飞过去.
- Honesty: **场景照片为演示用实景（武当）· 非正式付费素材包 · 非正式 healoa.app** — not medical claims; no Keeper / Choose Again / Circle signup on customer UI.
- Other places may stay procedural for now.
- Scope note: this stamp polishes **seed/share PNG export only**; place cards / scene bg / CTA→scene / startViaPlaces left as in g (`5e0b81c`).

## Prior (v2026-09-24-g / f)

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

Evidence: `/workspace/docs/demo-evidence-2026-09-24/` (`wudang-*.png`, `14-*`).
