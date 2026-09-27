#!/usr/bin/env bash
# healoa-rules-gate — run the full test suite on a PR head and post a commit status.
#
# Usage:  scripts/gate.sh <PR number | branch | ref | sha>
#   e.g.  scripts/gate.sh 14
#         scripts/gate.sh grok/my-branch
#
# What it does:
#   1. resolves the PR head SHA (or the ref's SHA) from GitHub / origin
#   2. posts status  healoa-rules-gate = pending  on that SHA
#   3. checks the SHA out in a temporary git worktree (your checkout is not touched)
#   4. installs deps (npm ci if a lockfile exists, otherwise npm install --no-save)
#   5. runs  npm test  (static-checks, healing-v3, i18n, merged-plan, rules)
#   6. posts  success  (pass counts) or  failure  (first failing rule / check IDs)
#
# main is branch-protected: merging requires  healoa-rules-gate = success  on the
# PR head, and the head must be up to date with main. Merge only with:
#   scripts/gate.sh <PR> && gh pr merge <PR> --merge
#
# Needs: gh (logged in, repo scope), git, node + npm. Env overrides:
#   GATE_REPO (default Healoa88/healoa-base-prototype-preview)
#   GATE_KEEP=1 keeps the temp worktree + log for debugging.
set -uo pipefail

REPO="${GATE_REPO:-Healoa88/healoa-base-prototype-preview}"
CONTEXT="healoa-rules-gate"
ARG="${1:-}"
if [[ -z "$ARG" ]]; then
  echo "usage: scripts/gate.sh <PR number | ref | sha>" >&2
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "gate: run inside a clone of $REPO" >&2; exit 2; }
cd "$ROOT"

# ---- resolve the SHA to test -------------------------------------------------
TARGET_URL=""
if [[ "$ARG" =~ ^[0-9]+$ ]]; then
  SHA="$(gh pr view "$ARG" --repo "$REPO" --json headRefOid -q .headRefOid)" || { echo "gate: cannot read PR #$ARG" >&2; exit 2; }
  TARGET_URL="https://github.com/$REPO/pull/$ARG"
  git fetch --quiet origin "pull/$ARG/head" || { echo "gate: cannot fetch PR #$ARG" >&2; exit 2; }
  LABEL="PR #$ARG"
else
  git fetch --quiet origin || true
  SHA="$(git rev-parse --verify --quiet "origin/$ARG^{commit}" || git rev-parse --verify --quiet "$ARG^{commit}")" || { echo "gate: cannot resolve ref '$ARG'" >&2; exit 2; }
  LABEL="$ARG"
fi
echo "gate: $LABEL -> $SHA"

post_status() { # state description
  local desc="${2:0:140}"
  local args=(-X POST "repos/$REPO/statuses/$SHA" -f "state=$1" -f "context=$CONTEXT" -f "description=$desc")
  [[ -n "$TARGET_URL" ]] && args+=(-f "target_url=$TARGET_URL")
  if gh api "${args[@]}" >/dev/null; then
    echo "gate: posted $CONTEXT=$1 on ${SHA:0:7} — $desc"
  else
    echo "gate: WARNING could not post status $1" >&2
  fi
}

post_status pending "npm test running on ${SHA:0:7}"

# ---- temp worktree -----------------------------------------------------------
WT="$(mktemp -d "${TMPDIR:-/tmp}/healoa-gate-XXXXXX")"
LOG="$WT.log"
FINISHED=0
cleanup() {
  if [[ "$FINISHED" != 1 ]]; then post_status error "gate aborted before finishing"; fi
  if [[ "${GATE_KEEP:-0}" != 1 ]]; then
    git -C "$ROOT" worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"
    git -C "$ROOT" worktree prune >/dev/null 2>&1
    rm -f "$LOG"
  else
    echo "gate: kept worktree $WT and log $LOG"
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

git worktree add --quiet --detach "$WT" "$SHA" || { FINISHED=1; post_status error "could not check out ${SHA:0:7}"; exit 1; }
cd "$WT"

# ---- deps --------------------------------------------------------------------
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund >"$LOG" 2>&1
else
  npm install --no-save --no-audit --no-fund >"$LOG" 2>&1
fi
if [[ $? -ne 0 ]]; then
  tail -20 "$LOG" >&2
  FINISHED=1; post_status failure "npm install failed on ${SHA:0:7}"; exit 1
fi

# ---- tests -------------------------------------------------------------------
echo "gate: npm test (takes a few minutes)…"
npm test 2>&1 | tee -a "$LOG"
RC=${PIPESTATUS[0]}

PASSES=$(grep -c '^PASS ' "$LOG" || true)
FAILS=$(grep -c '^FAIL ' "$LOG" || true)
SUITES=$(grep -E '^[a-z0-9-]+: [0-9]+/[0-9]+ PASS' "$LOG" | sed -E 's/: ([0-9]+)\/.*/ \1/' | paste -sd, - | sed 's/,/, /g')

if [[ $RC -eq 0 && $FAILS -eq 0 && $PASSES -gt 0 ]]; then
  FINISHED=1
  post_status success "npm test: $PASSES/$PASSES PASS ($SUITES)"
  echo "gate: SUCCESS"
  exit 0
fi

# first failing IDs: rules checks look like "FAIL  [R05.b] …"; other suites use the check name
IDS=$(grep '^FAIL ' "$LOG" | sed -E 's/^FAIL +\[([^]]+)\].*/\1/; t; s/^FAIL +//; s/ — .*//' | cut -c1-40 | head -4 | paste -sd';' - | sed 's/;/; /g')
[[ -z "$IDS" ]] && IDS="npm test exit $RC"
FINISHED=1
post_status failure "FAIL ($FAILS, $PASSES passed): $IDS"
echo "gate: FAILURE"
exit 1
