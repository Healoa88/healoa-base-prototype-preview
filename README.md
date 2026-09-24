# HeaLoa Base · prototype preview (throwaway)

**Not** a formal App launch. **Not** aurora-companions / healoa.com website work.

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- Version stamp: **预览 v2026-09-24-e** · **Scene Seed / 场景种子**
- Single-file offline HTML demo: enter a place → see/hear/operate a scene → solo create → optional **simulated** second person → save / restore → emit a **Scene Seed** (`#seed=` reopenable work URL) → friend opens **their own copy** and can add a stroke → optional handoff to https://healoa.com/circles

App social currency (Living Editions · App side) = **Scene Seed** — “我发现了一个美的地方，并把创作邀请给你”.

## v2026-09-24-e UX

- Homepage answers in ~5s: what HeaLoa Base is, which desire it meets (feel a place / leave a creation / invite a stroke — without form walls or a real trip first), clear CTA, informal Scene Seed Demo badge.
- Entered scene is not blank: stronger atmosphere, landmark silhouette, persistent「你可以做什么」coach dock, duration trial collapsed by default, scroll-into-view on enter.

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

Evidence: `/workspace/docs/demo-evidence-2026-09-24/14-*` (homepage + non-blank scene + P0 invite honesty) · results JSON includes two-context proof that sender does **not** see friend’s stroke after refresh.
