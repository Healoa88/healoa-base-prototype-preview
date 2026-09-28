#!/usr/bin/env python3
"""Generate ONE World Labs Marble world from Cindy's Wudang terrace photo (v2026-09-28-b).

Cindy approved (2026-09-27): upload this one photo, spend about 1,500 credits for a single world.
Guard rails in this script:
  * the API key is read from $WORLDLABS_API_KEY and only ever sent as the WLT-Api-Key header (never printed);
  * a lock file (tools/.worldlabs-run.json, not committed) records the operation, so a second run resumes
    polling instead of paying for another world;
  * the credit balance is read before and after (GET /marble/v1/credits) and the run stops if the balance
    is below the cost of one world.
Usage:  python3 tools/worldlabs_generate.py [--model marble-1.1] [--out DIR]
"""
import argparse, json, os, sys, time, urllib.request, urllib.error

API = "https://api.worldlabs.ai/marble/v1"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PHOTO = os.path.join(ROOT, "assets/places/wudang/02-terrace-sunrise.jpg")
LOCK = os.path.join(HERE, ".worldlabs-run.json")
TEXT = ("A calm Taoist mountain terrace on Wudang Mountain at sunrise: stone balustrade and paved terrace in the "
        "foreground, golden light over a sea of clouds, layered misty peaks, quiet and peaceful, no people.")


def key():
    k = os.environ.get("WORLDLABS_API_KEY", "")
    if not k:
        sys.exit("WORLDLABS_API_KEY is not set")
    return k


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=None if body is None else json.dumps(body).encode(),
                                 headers={"WLT-Api-Key": key(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} -> HTTP {e.code}: {e.read()[:600].decode(errors='replace')}")


def credits():
    try:
        return call("GET", "/credits").get("remaining_credits")
    except SystemExit as e:
        print("credits: unavailable", e)
        return None


def save(d):
    with open(LOCK, "w") as f:
        json.dump(d, f, indent=2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="marble-1.1")
    a = ap.parse_args()
    run = json.load(open(LOCK)) if os.path.exists(LOCK) else {}
    if not run.get("operation_id"):
        before = credits()
        print("credits before:", before)
        need = 1580 if a.model != "marble-1.0-draft" else 230
        if before is not None and before < need:
            sys.exit(f"balance {before} < {need}: stop (overage would be billed later)")
        prep = call("POST", "/media-assets:prepare_upload", {"file_name": "wudang-terrace-sunrise.jpg", "kind": "image", "extension": "jpg"})
        up = prep["upload_info"]
        ma = prep["media_asset"]; maid = ma.get("media_asset_id") or ma.get("id")  # API field is media_asset_id
        data = open(PHOTO, "rb").read()
        req = urllib.request.Request(up["upload_url"], method=up.get("upload_method", "PUT"), data=data, headers=up.get("required_headers") or {})
        with urllib.request.urlopen(req, timeout=120) as r:
            print("upload:", r.status, len(data), "bytes")
        op = call("POST", "/worlds:generate", {
            "display_name": "HeaLoa Wudang terrace", "model": a.model,
            "world_prompt": {"type": "image", "image_prompt": {"source": "media_asset", "media_asset_id": maid},
                             "text_prompt": TEXT},
            "permission": {"public": False, "allow_id_access": False}})
        run = {"model": a.model, "media_asset_id": maid, "operation_id": op["operation_id"],
               "credits_before": before, "started": time.strftime("%Y-%m-%dT%H:%M:%S%z")}
        save(run)
        print("operation:", op["operation_id"])
    t0 = time.time()
    while True:
        op = call("GET", f"/operations/{run['operation_id']}")
        prog = (op.get("metadata") or {}).get("progress") or {}
        print(f"[{int(time.time()-t0):4d}s] done={op.get('done')} {prog.get('status')} {prog.get('description','')}", flush=True)
        if op.get("done"):
            break
        time.sleep(15)
    run["operation"] = op
    run["credits_after"] = credits()
    wid = (op.get("metadata") or {}).get("world_id") or (op.get("response") or {}).get("id")
    if wid:
        run["world"] = call("GET", f"/worlds/{wid}")
    save(run)
    if op.get("error"):
        sys.exit(f"generation failed: {json.dumps(op['error'])[:600]}")
    print("world:", (op.get("response") or {}).get("world_marble_url"), "credits after:", run["credits_after"])


if __name__ == "__main__":
    main()
