#!/usr/bin/env python3
"""Deploy exact-match-engine Worker via Cloudflare API (version upload + assets),
mirroring the wrangler deploy that produced production version 7.
Uses the stored custom.cloudflare credential via surrogate helpers; api.cloudflare.com only."""
import sys, os, json, hashlib, urllib.request, urllib.error, uuid
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request

ACCT = "9b59861bd1747cf7525571b4c51d2aa0"
SCRIPT = "exact-match-engine"
BASE = "https://api.cloudflare.com/client/v4"
ROOT = "/home/hatch/workspace/exact-match-review/repo/.output"

def req_json(method, path, body=None, extra_headers=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    if data: r.add_header("Content-Type", "application/json")
    if extra_headers:
        for k, v in extra_headers.items(): r.add_header(k, v)
    add_surrogate_to_request(r, "custom.cloudflare", allowed_hosts=["api.cloudflare.com"])
    try:
        with urllib.request.urlopen(r, timeout=120) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, "on", method, path)
        print(e.read().decode("utf-8", "replace")[:1200])
        raise SystemExit(1)

def req_multipart(path, parts, bearer=None):
    """parts: list of (name, filename, content_type, bytes)."""
    boundary = "----cfdeploy" + uuid.uuid4().hex
    body = b""
    for name, filename, ctype, data in parts:
        body += f"--{boundary}\r\n".encode()
        disp = f'Content-Disposition: form-data; name="{name}"'
        if filename: disp += f'; filename="{filename}"'
        body += (disp + "\r\n").encode()
        body += f"Content-Type: {ctype}\r\n\r\n".encode()
        body += data + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    r = urllib.request.Request(BASE + path, data=body, method="POST")
    r.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    if bearer: r.add_header("Authorization", f"Bearer {bearer}")
    else: add_surrogate_to_request(r, "custom.cloudflare", allowed_hosts=["api.cloudflare.com"])
    try:
        with urllib.request.urlopen(r, timeout=300) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, "on POST", path)
        print(e.read().decode("utf-8", "replace")[:1500])
        raise SystemExit(1)

# 1. asset manifest
manifest = {}
files_by_hash = {}
pub = os.path.join(ROOT, "public")
for dirpath, _, names in os.walk(pub):
    for n in names:
        full = os.path.join(dirpath, n)
        rel = "/" + os.path.relpath(full, pub).replace(os.sep, "/")
        data = open(full, "rb").read()
        h = hashlib.sha256(data).hexdigest()[:32]
        manifest[rel] = {"hash": h, "size": len(data)}
        files_by_hash[h] = data
print("assets:", len(manifest))

# 2. upload session
sess = req_json("POST", f"/accounts/{ACCT}/workers/scripts/{SCRIPT}/assets-upload-session", {"manifest": manifest})
if not sess.get("success"):
    print("session failed:", json.dumps(sess)[:800]); raise SystemExit(1)
jwt = sess["result"]["jwt"]
buckets = sess["result"].get("buckets", [])
print("buckets to upload:", [len(b) for b in buckets])

# 3. upload buckets
import base64
for b in buckets:
    parts = [(h, h, "application/octet-stream", base64.b64encode(files_by_hash[h])) for h in b]
    out = req_multipart(f"/accounts/{ACCT}/workers/assets/upload?base64=true", parts, bearer=jwt)
    if not out.get("success"):
        print("upload failed:", json.dumps(out)[:800]); raise SystemExit(1)
    if out["result"] and out["result"].get("jwt"): jwt = out["result"]["jwt"]
print("assets upload complete")

# 4. create version with modules
srv = os.path.join(ROOT, "server")
metadata = {
    "main_module": "index.mjs",
    "bindings": [{"name": "ASSETS", "type": "assets"}],
    "assets": {"jwt": jwt},
    "compatibility_date": "2026-11-02",
    "compatibility_flags": ["nodejs_compat"],
    "usage_model": "standard",
}
parts = [("metadata", None, "application/json", json.dumps(metadata).encode())]
nmod = 0
for dirpath, _, names in os.walk(srv):
    for n in names:
        full = os.path.join(dirpath, n)
        rel = os.path.relpath(full, srv).replace(os.sep, "/")
        if rel == "wrangler.json": continue
        parts.append((rel, rel, "application/javascript+module", open(full, "rb").read()))
        nmod += 1
print("modules:", nmod)
ver = req_multipart(f"/accounts/{ACCT}/workers/scripts/{SCRIPT}/versions", parts)
if not ver.get("success"):
    print("version failed:", json.dumps(ver)[:1000]); raise SystemExit(1)
version_id = ver["result"]["id"]
print("new version:", version_id, "number:", ver["result"].get("number"))

# 5. deploy 100%
dep = req_json("POST", f"/accounts/{ACCT}/workers/scripts/{SCRIPT}/deployments", {
    "strategy": "percentage",
    "versions": [{"version_id": version_id, "percentage": 100}],
    "annotations": {"workers/triggered_by": "deployment"},
})
print("deployment:", json.dumps(dep.get("result", dep))[:400])
