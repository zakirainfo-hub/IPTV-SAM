import React, { useEffect, useRef, useState } from "react";
import mpegts from "mpegts.js";
import Hls from "hls.js";
import { streamUrl } from "../lib/api";
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * Unified player using mpegts.js for .ts and hls.js for .m3u8
 */
export default function Player({ kind, streamId, ext = "ts", poster }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setLoading(true);
    const video = videoRef.current;
    if (!video || !streamId) return;

    const url = streamUrl(kind, streamId, ext);

    const cleanup = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
    };

    const useMpegts = (ext === "ts" || kind === "live") && mpegts.isSupported();
    const useHls = ext === "m3u8";

    try {
      if (useMpegts) {
        const p = mpegts.createPlayer(
          { type: "mpegts", isLive: kind === "live", url },
          { enableStashBuffer: kind !== "live", liveBufferLatencyChasing: kind === "live", lazyLoad: false }
        );
        p.attachMediaElement(video);
        p.load();
        p.play().catch(() => {});
        p.on(mpegts.Events.ERROR, (type, detail) => {
          setError(`${type}: ${detail}`);
        });
        playerRef.current = p;
      } else if (useHls && Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: kind === "live" });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError(data.details || "Playback error");
        });
        playerRef.current = { destroy: () => hls.destroy() };
      } else {
        video.src = url;
        video.play().catch(() => {});
      }
    } catch (e) {
      setError(String(e));
    }

    const onPlaying = () => setLoading(false);
    const onWaiting = () => setLoading(true);
    const onError = () => setError("Playback failed. Stream may be offline.");
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("error", onError);
      cleanup();
    };
  }, [kind, streamId, ext]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-xl">
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        poster={poster}
        className="w-full h-full object-contain"
      />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2 text-center p-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-white font-medium">Unable to play stream</p>
          <p className="text-zinc-400 text-sm max-w-md">{error}</p>
        </div>
      )}
    </div>
  );
}
