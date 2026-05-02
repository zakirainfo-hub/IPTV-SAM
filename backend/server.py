from fastapi import FastAPI, APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import time
from pathlib import Path
from typing import Any, Dict, Optional
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Xtream config
XTREAM_HOST = os.environ.get('XTREAM_HOST', '').rstrip('/')
XTREAM_USER = os.environ.get('XTREAM_USER', '')
XTREAM_PASS = os.environ.get('XTREAM_PASS', '')

app = FastAPI(title="OTT Navigator Clone")
api_router = APIRouter(prefix="/api")

# Simple in-memory cache to avoid hammering upstream
_CACHE: Dict[str, tuple[float, Any]] = {}
_CACHE_TTL = 60 * 30  # 30 minutes

# Shared httpx client
_client: Optional[httpx.AsyncClient] = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(30.0), follow_redirects=True)
    return _client


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
    try:
        r = await get_client().get(url, params=q)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logging.exception("xtream_call failed")
        raise HTTPException(status_code=502, detail=f"Upstream error: {e}")

    _CACHE[key] = (now, data)
    return data


# ===== API Routes =====

@api_router.get("/")
async def root():
    return {"message": "OTT Navigator API", "host": XTREAM_HOST}


@api_router.get("/account")
async def account():
    data = await xtream_call(None)
    return data


# -------- Live TV --------
@api_router.get("/live/categories")
async def live_categories():
    return await xtream_call("get_live_categories")


@api_router.get("/live/streams")
async def live_streams(category_id: Optional[str] = None):
    params = {}
    if category_id:
        params["category_id"] = category_id
    return await xtream_call("get_live_streams", **params)


@api_router.get("/live/short_epg")
async def live_short_epg(stream_id: int, limit: int = 4):
    return await xtream_call("get_short_epg", stream_id=stream_id, limit=limit)


@api_router.get("/live/epg")
async def live_epg(stream_id: int):
    return await xtream_call("get_simple_data_table", stream_id=stream_id)


# -------- VOD / Movies --------
@api_router.get("/vod/categories")
async def vod_categories():
    return await xtream_call("get_vod_categories")


@api_router.get("/vod/streams")
async def vod_streams(category_id: Optional[str] = None):
    params = {}
    if category_id:
        params["category_id"] = category_id
    return await xtream_call("get_vod_streams", **params)


@api_router.get("/vod/info/{vod_id}")
async def vod_info(vod_id: int):
    return await xtream_call("get_vod_info", vod_id=vod_id)


# -------- Series --------
@api_router.get("/series/categories")
async def series_categories():
    return await xtream_call("get_series_categories")


@api_router.get("/series")
async def series(category_id: Optional[str] = None):
    params = {}
    if category_id:
        params["category_id"] = category_id
    return await xtream_call("get_series", **params)


@api_router.get("/series/info/{series_id}")
async def series_info(series_id: int):
    return await xtream_call("get_series_info", series_id=series_id)


# -------- Global search across all content --------
@api_router.get("/search")
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
@api_router.get("/stream/{kind}/{stream_id}")
async def stream_proxy(kind: str, stream_id: str, ext: str = "ts", request: Request = None):
    """
    Proxy video streams to bypass CORS & inject auth.
    kind: live | movie | series
    For live: /live/<user>/<pass>/<id>.ts
    For movie: /movie/<user>/<pass>/<id>.<ext>
    For series: /series/<user>/<pass>/<id>.<ext>
    """
    if kind not in ("live", "movie", "series"):
        raise HTTPException(status_code=400, detail="Invalid kind")

    upstream_url = f"{XTREAM_HOST}/{kind}/{XTREAM_USER}/{XTREAM_PASS}/{stream_id}.{ext}"

    # Forward Range headers for VOD seeking
    headers = {}
    if request is not None:
        rng = request.headers.get("range")
        if rng:
            headers["Range"] = rng
        ua = request.headers.get("user-agent")
        if ua:
            headers["User-Agent"] = ua

    try:
        upstream = await get_client().send(
            get_client().build_request("GET", upstream_url, headers=headers),
            stream=True,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream stream error: {e}")

    # Pass through relevant headers
    passthrough = {}
    for h in ("content-type", "content-length", "content-range", "accept-ranges", "cache-control"):
        v = upstream.headers.get(h)
        if v:
            passthrough[h] = v
    if "content-type" not in passthrough:
        passthrough["content-type"] = "video/mp2t" if ext == "ts" else "video/mp4"

    async def gen():
        try:
            async for chunk in upstream.aiter_bytes(chunk_size=64 * 1024):
                yield chunk
        finally:
            await upstream.aclose()

    status = upstream.status_code
    return StreamingResponse(gen(), status_code=status, headers=passthrough)


# -------- Image proxy for stream icons (avoid mixed content + CORS) --------
@api_router.get("/img")
async def img_proxy(url: str):
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Bad url")
    try:
        r = await get_client().get(url, timeout=15.0)
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


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    global _client
    if _client is not None:
        await _client.aclose()
