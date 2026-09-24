# HeaLoa Base · prototype preview (throwaway)

**Not** a formal App launch. **Not** aurora-companions / healoa.com website work.

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- Version stamp: **预览 v2026-09-24-f** · **Scene Seed / 场景种子**
- Single-file offline HTML demo: pick a place → see/hear/operate a scene → solo create → optional **simulated** second person → save / restore → emit a **Scene Seed** (`#seed=` reopenable work URL) → friend opens **their own copy** and can add a stroke → optional handoff to https://healoa.com/circles

App social currency (Living Editions · App side) = **Scene Seed** — “我发现了一个美的地方，并把创作邀请给你”.

## v2026-09-24-f UX

- **Primary CTA「走进场景试试」goes to place pick** (or「直接进 · 日本温泉」auto-enters). Body×season is **optional** and no longer blocks first play.
- Place cards are **one-tap** into a playable scene; first mark tool auto-selected; coach dock「你可以做什么」stays.
- Homepage customer voice: what / why / CTA. Reviewer jargon (Choose Again, Circle Edition, Wrapped, Keeper, Life Maps, UNKNOWN walls) lives in collapsed「说明」.
- **Share-tail (Code lane):** after one mark → one「发给朋友」→ share screen (skips save confirm dance). Primary share action is「发给朋友」(copies `#seed=`). P0 honesty kept: copy ≠ live shared work (UNKNOWN). No Choose Again / Keeper / Circle Edition / Wrapped on share/save customer UI.

## Invite honesty (P0)

| | |
|---|---|
| **Implemented** | Friend opens `#seed=` and continues on **their own copy** (works across devices/browsers without a multiplayer server) |
| **UNKNOWN / not implemented** | Both sides share **one continuously updating work** (friend’s stroke does **not** sync back to sender) |
| **Simulated** | Same-device “第二人加入” / “以好友身份打开” buttons — always labeled **模拟** |
| **Never ship** | `#seedId=` as a friend invite (sender-local only). Overlong URLs fail clearly + offer JSON/PNG |

## Tests

```bash
cd /workspace/healoa-base-prototype-preview
npm i
npx playwright install chromium   # once
npm run test:scene-seed
# or: node tests/scene-seed-p0.mjs
```

Evidence: `/workspace/docs/demo-evidence-2026-09-24/14-*` (primary start skips body + non-blank scene + P0 invite honesty).
