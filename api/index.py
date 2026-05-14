from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, Response
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import time
from typing import Any, Dict, Optional
import httpx

# Xtream config from environment variables
XTREAM_HOST = os.environ.get('XTREAM_HOST', '').rstrip('/')
XTREAM_USER = os.environ.get('XTREAM_USER', '')
XTREAM_PASS = os.environ.get('XTREAM_PASS', '')

app = FastAPI(title="OTT Navigator Clone")

# Simple in-memory cache to avoid hammering upstream
_CACHE: Dict[str, tuple[float, Any]] = {}
_CACHE_TTL = 60 * 30  # 30 minutes

STREAM_CONTENT_TYPES = {
    "ts": "video/mp2t",
    "m2ts": "video/mp2t",
    "mp4": "video/mp4",
    "m4v": "video/mp4",
    "mov": "video/quicktime",
    "mkv": "video/x-matroska",
    "webm": "video/webm",
    "avi": "video/x-msvideo",
    "m3u8": "application/vnd.apple.mpegurl",
}


async def xtream_call(action: Optional[str] = None, **params) -> Any:
    """Call Xtream Codes player_api.php with caching."""
    key = f"{action}:{sorted(params.items())}"
    now = time.time()
    if key in _CACHE:
        ts, val = _CACHE[key]
        if now - ts < _CACHE_TTL:
            return val

    q = {"username": XTREAM_USER, "password": XTREAM_PASS}
    if action:
        q["action"] = action
    q.update({k: str(v) for k, v in params.items() if v is not None})
    url = f"{XTREAM_HOST}/player_api.php"
    
    timeout = httpx.Timeout(connect=15.0, read=90.0, write=15.0, pool=15.0)
    
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(url, params=q)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logging.exception("xtream_call failed")
        raise HTTPException(status_code=502, detail=f"Upstream error: {e}")

    _CACHE[key] = (now, data)
    return data


# ===== API Routes =====

@app.get("/api/")
async def root():
    return {"message": "OTT Navigator API", "host": XTREAM_HOST}


@app.get("/api/account")
async def account():
    data = await xtream_call(None)
    return data


# -------- Live TV --------
@app.get("/api/live/categories")
async def live_categories():
    return await xtream_call("get_live_categories")


@app.get("/api/live/streams")
async def live_streams(category_id: Optional[str] = None):
    params = {}
    if category_id:
        params["category_id"] = category_id
    return await xtream_call("get_live_streams", **params)


@app.get("/api/live/short_epg")
async def live_short_epg(stream_id: int, limit: int = 4):
    return await xtream_call("get_short_epg", stream_id=stream_id, limit=limit)


@app.get("/api/live/epg")
async def live_epg(stream_id: int):
    return await xtream_call("get_simple_data_table", stream_id=stream_id)


# -------- VOD / Movies --------
@app.get("/api/vod/categories")
async def vod_categories():
    return await xtream_call("get_vod_categories")


@app.get("/api/vod/streams")
async def vod_streams(category_id: Optional[str] = None):
    params = {}
    if category_id:
        params["category_id"] = category_id
    return await xtream_call("get_vod_streams", **params)


@app.get("/api/vod/info/{vod_id}")
async def vod_info(vod_id: int):
    return await xtream_call("get_vod_info", vod_id=vod_id)


# -------- Series --------
@app.get("/api/series/categories")
async def series_categories():
    return await xtream_call("get_series_categories")


@app.get("/api/series")
async def series(category_id: Optional[str] = None):
    params = {}
    if category_id:
        params["category_id"] = category_id
    return await xtream_call("get_series", **params)


@app.get("/api/series/info/{series_id}")
async def series_info(series_id: int):
    return await xtream_call("get_series_info", series_id=series_id)


# -------- Global search across all content --------
@app.get("/api/search")
async def search_all(q: str = Query(..., min_length=1)):
    q_lower = q.lower()
    # fetch cached lists
    try:
        live = await xtream_call("get_live_streams")
    except Exception:
        live = []
    try:
        vod = await xtream_call("get_vod_streams")
    except Exception:
        vod = []
    try:
        ser = await xtream_call("get_series")
    except Exception:
        ser = []

    def match(item, fields=("name", "title")):
        for f in fields:
            v = item.get(f)
            if v and q_lower in str(v).lower():
                return True
        return False

    return {
        "live": [x for x in (live or []) if match(x)][:50],
        "vod": [x for x in (vod or []) if match(x)][:50],
        "series": [x for x in (ser or []) if match(x)][:50],
    }


# -------- Stream proxy (handles CORS + TS streams) --------
@app.get("/api/stream/{kind}/{stream_id}")
async def stream_proxy(kind: str, stream_id: str, ext: str = "ts", request: Request = None):
    """
    Proxy video streams to bypass CORS & inject auth.
    kind: live | movie | series
    """
    if kind not in ("live", "movie", "series"):
        raise HTTPException(status_code=400, detail="Invalid kind")

    clean_ext = (ext or "ts").lower().lstrip(".")
    upstream_url = f"{XTREAM_HOST}/{kind}/{XTREAM_USER}/{XTREAM_PASS}/{stream_id}.{clean_ext}"

    # Forward Range headers for VOD seeking
    headers = {"Accept": "*/*", "Connection": "keep-alive"}
    if request is not None:
        rng = request.headers.get("range")
        if rng:
            headers["Range"] = rng
        ua = request.headers.get("user-agent")
        if ua:
            headers["User-Agent"] = ua

    timeout = httpx.Timeout(connect=15.0, read=90.0, write=15.0, pool=15.0)
    limits = httpx.Limits(max_connections=100, max_keepalive_connections=20)
    
    try:
        client = httpx.AsyncClient(timeout=timeout, limits=limits, follow_redirects=True)
        upstream = await client.send(
            client.build_request("GET", upstream_url, headers=headers),
            stream=True,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream stream error: {e}")

    # Pass through relevant headers
    passthrough = {}
    for h in ("content-range", "accept-ranges"):
        v = upstream.headers.get(h)
        if v:
            passthrough[h] = v
    upstream_content_type = upstream.headers.get("content-type", "")
    if upstream_content_type and upstream_content_type.lower() != "application/octet-stream":
        passthrough["content-type"] = upstream_content_type
    else:
        passthrough["content-type"] = STREAM_CONTENT_TYPES.get(clean_ext, "application/octet-stream")
    passthrough["cache-control"] = "no-store" if kind == "live" else upstream.headers.get("cache-control", "public, max-age=3600")
    passthrough["x-accel-buffering"] = "no"
    cl = upstream.headers.get("content-length")
    if cl and cl != "0" and kind != "live":
        passthrough["content-length"] = cl
    chunk_size = 256 * 1024 if kind == "live" else 512 * 1024

    async def gen():
        try:
            async for chunk in upstream.aiter_bytes(chunk_size=chunk_size):
                yield chunk
        finally:
            await upstream.aclose()
            await client.aclose()

    status = upstream.status_code
    return StreamingResponse(gen(), status_code=status, headers=passthrough)


# -------- Image proxy for stream icons --------
@app.get("/api/img")
async def img_proxy(url: str):
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Bad url")
    try:
        timeout = httpx.Timeout(connect=10.0, read=15.0)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(url)
            content_type = r.headers.get("content-type", "image/jpeg")
            return Response(
                content=r.content,
                status_code=r.status_code,
                media_type=content_type,
                headers={"cache-control": "public, max-age=86400"},
            )
    except Exception:
        # return transparent 1x1 png on error
        tiny = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6300010000000500010d0a2db40000000049454e44ae426082"
        )
        return Response(content=tiny, media_type="image/png")


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
