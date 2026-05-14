import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import mpegts from "mpegts.js";
import Hls from "hls.js";

// ─── CSS injected at mount ────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --bg0: #080c10;
  --bg1: #0d1117;
  --bg2: #131920;
  --bg3: #1a2330;
  --surface: #111820;
  --border: rgba(255,255,255,0.06);
  --border-h: rgba(255,255,255,0.12);
  --teal: #00e5c0;
  --teal2: #00b89a;
  --teal-dim: rgba(0,229,192,0.12);
  --rose: #ff4d6d;
  --rose-dim: rgba(255,77,109,0.15);
  --amber: #ffb830;
  --text: #e8edf2;
  --muted: #7a8fa6;
  --faint: #3d4f60;
  --r: 12px;
  --rs: 8px;
  --sidebar: 72px;
  --font: 'DM Sans', sans-serif;
  --font-display: 'Syne', sans-serif;
  --ease: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

html,body,#root{height:100%}
body{font-family:var(--font);background:var(--bg0);color:var(--text);overflow-x:hidden;-webkit-font-smoothing:antialiased}
#emergent-badge{display:none!important}

/* Scrollbar */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--faint);border-radius:99px}
::-webkit-scrollbar-thumb:hover{background:var(--muted)}

/* Layout */
.app{display:flex;height:100vh;overflow:hidden}
.sidebar{
  position:fixed;left:0;top:0;height:100%;z-index:50;
  width:var(--sidebar);
  background:rgba(8,12,16,0.95);
  border-right:1px solid var(--border);
  transition:width 0.35s var(--ease);
  backdrop-filter:blur(20px);
  display:flex;flex-direction:column;overflow:hidden;
}
.sidebar:hover,.sidebar.open{width:240px}
.sidebar-logo{
  display:flex;align-items:center;gap:12px;
  height:64px;padding:0 18px;
  border-bottom:1px solid var(--border);flex-shrink:0;
}
.logo-icon{
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(135deg,var(--teal),#0066ff);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;font-size:18px;
}
.logo-text{
  font-family:var(--font-display);font-weight:700;
  font-size:16px;color:var(--text);
  white-space:nowrap;opacity:0;
  transition:opacity 0.2s 0.1s;pointer-events:none;
  letter-spacing:-0.3px;
}
.logo-text span{color:var(--teal)}
.sidebar:hover .logo-text,.sidebar.open .logo-text{opacity:1}
.sidebar-nav{flex:1;overflow-y:auto;padding:12px 8px;display:flex;flex-direction:column;gap:2px}
.nav-item{
  display:flex;align-items:center;gap:14px;
  height:44px;padding:0 13px;border-radius:var(--rs);
  cursor:pointer;transition:all 0.18s var(--ease);
  position:relative;overflow:hidden;text-decoration:none;
  color:var(--muted);border:none;background:none;width:100%;
}
.nav-item::before{
  content:'';position:absolute;inset:0;
  background:var(--teal-dim);opacity:0;
  transition:opacity 0.18s;border-radius:var(--rs);
}
.nav-item:hover{color:var(--text);background:rgba(255,255,255,0.04)}
.nav-item:hover::before{opacity:0}
.nav-item.active{color:var(--teal);background:var(--teal-dim)}
.nav-item.active::before{opacity:0}
.nav-item svg{flex-shrink:0;transition:transform 0.2s var(--ease-spring)}
.nav-item:active svg{transform:scale(0.85)}
.nav-label{
  font-size:14px;font-weight:500;white-space:nowrap;
  opacity:0;transition:opacity 0.2s 0.08s;
}
.sidebar:hover .nav-label,.sidebar.open .nav-label{opacity:1}
.active-dot{
  position:absolute;left:0;top:50%;transform:translateY(-50%);
  width:3px;height:20px;border-radius:0 3px 3px 0;
  background:var(--teal);opacity:0;transition:opacity 0.2s;
}
.nav-item.active .active-dot{opacity:1}

/* Main content */
.main{flex:1;margin-left:var(--sidebar);display:flex;flex-direction:column;height:100vh;overflow:hidden}
.topbar{
  height:64px;display:flex;align-items:center;gap:16px;
  padding:0 28px;flex-shrink:0;
  background:rgba(8,12,16,0.85);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);position:sticky;top:0;z-index:30;
}
.page-title{font-family:var(--font-display);font-weight:700;font-size:18px;letter-spacing:-0.4px;flex-shrink:0}
.search-wrap{flex:1;max-width:420px;position:relative}
.search-wrap input{
  width:100%;height:38px;padding:0 14px 0 40px;
  background:var(--bg2);border:1px solid var(--border);
  border-radius:99px;color:var(--text);font-size:14px;
  font-family:var(--font);outline:none;transition:all 0.2s var(--ease);
}
.search-wrap input:focus{border-color:var(--teal2);background:var(--bg3);box-shadow:0 0 0 3px rgba(0,229,192,0.08)}
.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted)}
.topbar-right{display:flex;align-items:center;gap:10px;margin-left:auto}
.avatar{
  width:34px;height:34px;border-radius:50%;
  background:linear-gradient(135deg,var(--teal),#0066ff);
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;color:#000;cursor:pointer;
  transition:transform 0.2s var(--ease-spring);flex-shrink:0;
}
.avatar:hover{transform:scale(1.08)}
.time-badge{
  font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums;
}

/* Page content */
.page-shell{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column}
.page{flex:1;min-height:0;height:100%;overflow-y:auto;padding:24px 28px;position:relative}

/* Page transitions */
.page-enter{animation:pageIn 0.32s var(--ease) both}
@keyframes pageIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* Hero */
.hero{
  position:relative;border-radius:18px;overflow:hidden;
  height:clamp(320px,52vh,520px);margin-bottom:32px;
  border:1px solid var(--border);
}
.hero-img{width:100%;height:100%;object-fit:cover;filter:blur(0.5px) saturate(1.1)}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,12,16,0.98) 0%,rgba(8,12,16,0.65) 55%,rgba(8,12,16,0.05) 100%)}
.hero-overlay2{position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,12,16,0.95) 0%,transparent 50%)}
.hero-content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:36px 40px;max-width:620px}
.hero-badge{
  display:inline-flex;align-items:center;gap:6px;
  background:var(--teal-dim);border:1px solid rgba(0,229,192,0.25);
  color:var(--teal);font-size:11px;font-weight:600;letter-spacing:1.5px;
  text-transform:uppercase;padding:4px 12px;border-radius:99px;
  margin-bottom:14px;width:fit-content;
}
.hero-title{
  font-family:var(--font-display);font-weight:800;
  font-size:clamp(26px,4vw,44px);color:var(--text);
  letter-spacing:-1px;line-height:1.1;margin-bottom:10px;
}
.hero-desc{
  font-size:15px;color:var(--muted);line-height:1.65;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;
  overflow:hidden;margin-bottom:24px;max-width:480px;
}
.hero-actions{display:flex;align-items:center;gap:10px}
.btn{
  display:inline-flex;align-items:center;gap:7px;
  height:42px;padding:0 20px;border-radius:var(--rs);
  font-size:14px;font-weight:600;cursor:pointer;border:none;
  transition:all 0.15s var(--ease);font-family:var(--font);
  position:relative;overflow:hidden;
}
.btn::after{
  content:'';position:absolute;inset:0;
  background:rgba(255,255,255,0.1);opacity:0;
  transition:opacity 0.15s;
}
.btn:hover::after{opacity:1}
.btn:active{transform:scale(0.96)}
.btn-primary{background:var(--teal);color:#000}
.btn-primary:hover{background:#00ccaa}
.btn-ghost{background:rgba(255,255,255,0.08);color:var(--text);border:1px solid var(--border-h)}
.btn-ghost:hover{background:rgba(255,255,255,0.13)}
.hero-skeleton{
  height:clamp(320px,52vh,520px);border-radius:18px;
  background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);
  background-size:400% 100%;
  animation:shimmer 1.6s ease infinite;margin-bottom:32px;
}
.hero-empty{
  display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;
  padding:36px 40px;background:linear-gradient(135deg,var(--bg2),var(--bg1));
}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}

/* Quick nav grid */
.quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px}
.quick-card{
  display:flex;align-items:center;gap:12px;padding:14px 16px;
  background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--r);cursor:pointer;transition:all 0.2s var(--ease);
  text-decoration:none;color:var(--text);
}
.quick-card:hover{border-color:var(--border-h);background:var(--bg3);transform:translateY(-2px)}
.quick-card:active{transform:translateY(0) scale(0.98)}
.quick-icon{
  width:40px;height:40px;border-radius:var(--rs);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.quick-label{font-size:14px;font-weight:500}

/* Category rows */
.cat-row{margin-bottom:32px}
.cat-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:0 2px}
.cat-title{font-family:var(--font-display);font-weight:700;font-size:17px;letter-spacing:-0.3px}
.cat-controls{display:flex;align-items:center;gap:8px}
.see-all{font-size:13px;color:var(--teal);cursor:pointer;padding:4px 10px;border-radius:99px;transition:background 0.15s}
.see-all:hover{background:var(--teal-dim)}
.scroll-btn{
  width:30px;height:30px;border-radius:50%;
  background:var(--bg2);border:1px solid var(--border);
  color:var(--text);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all 0.15s var(--ease);
}
.scroll-btn:hover{background:var(--bg3);border-color:var(--border-h);transform:scale(1.1)}
.scroll-btn:active{transform:scale(0.92)}
.cat-scroller{
  display:flex;gap:14px;overflow-x:auto;padding:4px 2px 8px;
  scroll-behavior:smooth;scrollbar-width:none;
}
.cat-scroller::-webkit-scrollbar{display:none}

/* Poster card */
.poster{
  border-radius:var(--r);overflow:hidden;cursor:pointer;
  background:var(--bg2);border:1px solid var(--border);
  position:relative;flex-shrink:0;
  transition:transform 0.25s var(--ease),border-color 0.2s,box-shadow 0.25s;
}
.poster:hover{transform:scale(1.05) translateY(-4px);border-color:rgba(0,229,192,0.4);box-shadow:0 20px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(0,229,192,0.12)}
.poster:active{transform:scale(0.97)}
.poster-portrait{aspect-ratio:2/3;width:160px}
.poster-wide{aspect-ratio:16/9;width:280px}
.poster img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.4s var(--ease)}
.poster:hover img{transform:scale(1.08)}
.poster-fallback{
  width:100%;height:100%;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,var(--bg3),var(--bg2));
  padding:12px;text-align:center;font-size:13px;color:var(--muted);
  line-height:1.4;
}
.poster-overlay{
  position:absolute;inset:0;
  background:linear-gradient(0deg,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.3) 50%,transparent 100%);
  opacity:0;transition:opacity 0.25s var(--ease);
}
.poster:hover .poster-overlay{opacity:1}
.poster-info{
  position:absolute;bottom:0;left:0;right:0;padding:10px 12px;
  transform:translateY(6px);opacity:0;
  transition:all 0.25s var(--ease);
}
.poster:hover .poster-info{transform:translateY(0);opacity:1}
.poster-play{
  width:36px;height:36px;border-radius:50%;
  background:var(--teal);display:flex;align-items:center;justify-content:center;
  margin-bottom:6px;transition:transform 0.2s var(--ease-spring);
}
.poster:hover .poster-play{transform:scale(1.1)}
.poster-name{font-size:12px;font-weight:500;color:var(--text);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.poster-rating{
  position:absolute;top:8px;left:8px;
  display:flex;align-items:center;gap:4px;
  background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);
  padding:3px 8px;border-radius:99px;font-size:11px;color:var(--amber);
  font-weight:600;
}
.poster-fav{
  position:absolute;top:8px;right:8px;
  width:30px;height:30px;border-radius:50%;
  background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;
  opacity:0;transition:all 0.15s var(--ease);cursor:pointer;border:none;
}
.poster:hover .poster-fav,.poster-fav.active{opacity:1}
.poster-fav:hover{transform:scale(1.15);background:rgba(0,0,0,0.8)}
.poster-fav:active{transform:scale(0.88)}
.live-badge{
  position:absolute;top:8px;left:8px;
  background:var(--rose);color:#fff;
  font-size:10px;font-weight:700;letter-spacing:0.8px;
  padding:3px 8px;border-radius:4px;text-transform:uppercase;
}

/* Skeleton */
.skel{border-radius:var(--r);background:var(--bg2);animation:shimmer 1.6s ease infinite;background-size:400% 100%;background-image:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%)}

/* Movies / Series page layout */
.content-layout{display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:start}
.cat-sidebar{
  background:var(--bg1);border:1px solid var(--border);border-radius:var(--r);
  padding:8px;position:sticky;top:20px;max-height:calc(100vh - 110px);overflow-y:auto;
}
.cat-sidebar-title{padding:8px 10px 6px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:var(--faint);font-weight:600}
.cat-btn{
  display:block;width:100%;text-align:left;padding:9px 10px;
  border-radius:var(--rs);font-size:13px;cursor:pointer;
  transition:all 0.15s var(--ease);border:none;background:none;
  color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.cat-btn:hover{background:rgba(255,255,255,0.04);color:var(--text)}
.cat-btn.active{background:var(--teal-dim);color:var(--teal)}
.content-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px}

/* Filter bar */
.filter-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px}
.filter-heading{display:flex;align-items:center;gap:10px;min-width:0;flex-wrap:wrap}
.filter-input{
  height:36px;padding:0 14px;background:var(--bg2);
  border:1px solid var(--border);border-radius:99px;
  color:var(--text);font-size:13px;font-family:var(--font);
  outline:none;transition:all 0.2s var(--ease);width:200px;
}
.filter-input:focus{border-color:var(--teal2);background:var(--bg3)}
.cat-mobile-select{
  display:none;height:36px;padding:0 34px 0 12px;
  background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--rs);color:var(--text);font-size:13px;
  font-family:var(--font);outline:none;max-width:220px;
}
.section-title{font-family:var(--font-display);font-weight:700;font-size:16px}

/* Live TV channels */
.channel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.channel-card{
  display:flex;align-items:center;gap:12px;padding:12px 14px;
  background:var(--bg1);border:1px solid var(--border);border-radius:var(--r);
  cursor:pointer;transition:all 0.18s var(--ease);
  position:relative;overflow:hidden;
}
.channel-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--teal);opacity:0;transition:opacity 0.18s}
.channel-card:hover{border-color:rgba(0,229,192,0.3);background:var(--bg2);transform:translateX(3px)}
.channel-card:hover::before{opacity:1}
.channel-card:active{transform:translateX(1px) scale(0.99)}
.ch-logo{
  width:48px;height:48px;border-radius:8px;
  background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;
  overflow:hidden;flex-shrink:0;
}
.ch-logo img{width:100%;height:100%;object-fit:contain}
.ch-info{flex:1;min-width:0}
.ch-name{font-size:14px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:7px}
.ch-epg-now{font-size:12px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-epg-next{font-size:11px;color:var(--faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-live{
  background:var(--rose-dim);color:var(--rose);
  font-size:9px;font-weight:700;letter-spacing:0.8px;
  padding:2px 6px;border-radius:4px;text-transform:uppercase;flex-shrink:0;
}

/* Watch page */
.watch-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:20px;align-items:start}
.watch-layout-single{grid-template-columns:minmax(0,1fr);max-width:1100px}
.player-wrap{border-radius:16px;overflow:hidden;background:#000;aspect-ratio:var(--player-aspect,16/9);position:relative}
.player-wrap video{width:100%;height:100%;display:block;background:#000}
.player-loader{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.player-error{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);gap:8px;padding:24px;text-align:center}
.player-tools{
  position:absolute;top:10px;right:10px;z-index:5;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;
  pointer-events:none;
}
.player-tool{
  pointer-events:auto;display:flex;align-items:center;gap:6px;
  min-height:32px;padding:5px 8px;border-radius:8px;
  background:rgba(8,12,16,0.78);border:1px solid rgba(255,255,255,0.12);
  backdrop-filter:blur(14px);color:var(--text);font-size:11px;
}
.player-tool span{color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.7px}
.player-tool select{
  max-width:140px;border:0;outline:none;background:transparent;color:var(--text);
  font-family:var(--font);font-size:12px;cursor:pointer;
}
.player-tool select option{background:var(--bg2);color:var(--text)}
.stream-meta{margin-top:14px;padding:14px 18px;background:var(--bg1);border:1px solid var(--border);border-radius:var(--r);display:flex;align-items:center;gap:14px}
.stream-thumb{width:56px;height:56px;border-radius:8px;background:rgba(0,0,0,0.4);object-fit:contain;flex-shrink:0}
.stream-copy{min-width:0;flex:1}
.stream-name{font-family:var(--font-display);font-weight:700;font-size:18px;letter-spacing:-0.3px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.stream-name-main{min-width:0;overflow:hidden;text-overflow:ellipsis}
.stream-cat{font-size:13px;color:var(--muted);margin-top:2px}
.media-badge{font-size:10px;background:var(--rose-dim);color:var(--rose);padding:2px 8px;border-radius:4px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase}
.fav-btn{
  margin-left:auto;height:38px;padding:0 16px;border-radius:var(--rs);
  font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;
  border:1px solid var(--border);background:transparent;color:var(--text);
  transition:all 0.15s var(--ease);font-family:var(--font);
}
.fav-btn:hover{background:var(--teal-dim);border-color:rgba(0,229,192,0.3);color:var(--teal)}
.fav-btn.active{background:var(--teal-dim);border-color:rgba(0,229,192,0.4);color:var(--teal)}
.fav-btn:active{transform:scale(0.95)}
.epg-list{display:flex;flex-direction:column;gap:8px;margin-top:20px}
.epg-section-title{font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:var(--faint);font-weight:600;margin-bottom:4px}
.epg-item{
  padding:10px 14px;border-radius:var(--rs);
  border:1px solid var(--border);background:var(--bg1);
}
.epg-item.now{background:var(--teal-dim);border-color:rgba(0,229,192,0.25)}
.epg-time{font-size:11px;color:var(--muted);margin-bottom:3px;display:flex;align-items:center;justify-content:space-between}
.epg-now-tag{background:var(--teal);color:#000;font-size:9px;font-weight:700;padding:1px 7px;border-radius:99px;text-transform:uppercase;letter-spacing:0.5px}
.epg-title{font-size:13px;font-weight:500;color:var(--text)}
.epg-desc{font-size:12px;color:var(--muted);margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.related-list{background:var(--bg1);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.related-header{padding:12px 14px;font-size:13px;font-weight:600;border-bottom:1px solid var(--border)}
.related-scroll{max-height:calc(100vh - 200px);overflow-y:auto}
.related-item{
  display:flex;align-items:center;gap:10px;padding:9px 14px;
  cursor:pointer;transition:background 0.15s;border:none;background:none;
  width:100%;text-align:left;border-bottom:1px solid var(--border);
}
.related-item:last-child{border-bottom:none}
.related-item:hover{background:rgba(255,255,255,0.03)}
.related-item:active{background:rgba(255,255,255,0.06)}
.related-logo{width:36px;height:36px;border-radius:6px;background:rgba(0,0,0,0.4);object-fit:contain;flex-shrink:0}
.related-name{font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Settings */
.settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:900px}
.settings-card{background:var(--bg1);border:1px solid var(--border);border-radius:var(--r);padding:22px}
.settings-card-header{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.settings-icon{width:34px;height:34px;border-radius:var(--rs);background:var(--teal-dim);display:flex;align-items:center;justify-content:center;color:var(--teal)}
.settings-card-title{font-family:var(--font-display);font-weight:700;font-size:15px}
.settings-field{margin-bottom:14px}
.settings-label{font-size:12px;color:var(--muted);margin-bottom:6px;font-weight:500}
.settings-input{
  width:100%;height:38px;padding:0 12px;
  background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--rs);color:var(--text);font-size:14px;
  font-family:var(--font);outline:none;transition:all 0.2s;
}
.settings-input:focus{border-color:var(--teal2)}
.settings-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)}
.settings-row:last-child{border-bottom:none}
.settings-row-label{font-size:13px;color:var(--muted)}
.settings-row-val{font-size:13px;color:var(--text)}
.save-btn{
  margin-top:16px;height:38px;padding:0 20px;border-radius:var(--rs);
  background:var(--teal);color:#000;font-size:14px;font-weight:600;
  cursor:pointer;border:none;font-family:var(--font);
  transition:all 0.15s var(--ease);display:flex;align-items:center;gap:7px;
}
.save-btn:hover{background:#00ccaa}
.save-btn:active{transform:scale(0.96)}

/* Search page */
.search-big{
  width:100%;max-width:640px;height:50px;
  padding:0 16px 0 48px;background:var(--bg2);
  border:1px solid var(--border);border-radius:12px;
  color:var(--text);font-size:16px;font-family:var(--font);
  outline:none;transition:all 0.2s;margin-bottom:32px;
}
.search-big:focus{border-color:var(--teal2);background:var(--bg3)}
.search-wrap-big{position:relative;max-width:640px}
.search-icon-big{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--muted)}
.search-results-section{margin-bottom:28px}
.search-section-title{font-family:var(--font-display);font-weight:700;font-size:17px;margin-bottom:14px}
.search-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
.search-grid-wide{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.empty-state{text-align:center;padding:80px 20px;color:var(--muted)}
.empty-icon{font-size:48px;margin-bottom:12px;opacity:0.3}
.empty-text{font-size:15px}

/* Favorites */
.fav-group{margin-bottom:28px}
.fav-group-title{font-family:var(--font-display);font-weight:700;font-size:17px;margin-bottom:14px}
.fav-empty{text-align:center;padding:80px 20px}

/* Spin */
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin 0.8s linear infinite}

/* Pulse */
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.pulse{animation:pulse 1.5s ease-in-out infinite}

/* Notification toast */
.toast-container{position:fixed;bottom:24px;right:24px;z-index:999;display:flex;flex-direction:column;gap:8px}
.toast{
  background:var(--bg3);border:1px solid var(--border-h);
  border-radius:var(--r);padding:12px 16px;font-size:14px;color:var(--text);
  display:flex;align-items:center;gap:10px;min-width:220px;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
  animation:toastIn 0.3s var(--ease-spring) both;
}
@keyframes toastIn{from{opacity:0;transform:translateX(100%) scale(0.9)}to{opacity:1;transform:translateX(0) scale(1)}}
.toast.out{animation:toastOut 0.25s var(--ease) both}
@keyframes toastOut{to{opacity:0;transform:translateX(100%)}}
.toast-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.toast-dot.success{background:var(--teal)}
.toast-dot.error{background:var(--rose)}

.mobile-nav{display:none}

/* Responsive tweaks */
@media(max-width:768px){
  .topbar{height:56px;padding:0 14px;gap:10px}
  .page-title{font-size:16px}
  .search-wrap{max-width:none;min-width:0}
  .search-wrap input{height:36px;font-size:13px}
  .topbar-right{display:none}
  .page{padding:16px 14px calc(86px + env(safe-area-inset-bottom))}
  .hero,.hero-skeleton{height:300px;border-radius:14px;margin-bottom:20px}
  .hero-content,.hero-empty{padding:24px 20px}
  .hero-actions{flex-wrap:wrap}
  .player-tools{left:8px;right:8px;top:8px;gap:6px}
  .player-tool{flex:1 1 92px;justify-content:space-between;padding:5px 7px}
  .player-tool select{max-width:90px}
  .content-layout{grid-template-columns:1fr}
  .cat-sidebar{display:none}
  .watch-layout{grid-template-columns:1fr}
  .settings-grid{grid-template-columns:1fr}
  .quick-grid{grid-template-columns:repeat(2,1fr)}
  .related-list{display:none}
  .stream-meta{align-items:flex-start;padding:12px;gap:12px}
  .stream-thumb{width:48px;height:48px}
  .fav-btn{margin-left:0}
  .filter-bar{align-items:stretch;flex-direction:column}
  .filter-heading{align-items:stretch;flex-direction:column;gap:8px}
  .filter-input,.cat-mobile-select{width:100%;max-width:none}
  .cat-mobile-select{display:block}
  .sidebar{width:0}
  .main{margin-left:0}
  .mobile-nav{
    position:fixed;left:0;right:0;bottom:0;z-index:60;
    display:grid;grid-template-columns:repeat(7,1fr);
    padding:8px 8px calc(8px + env(safe-area-inset-bottom));
    background:rgba(8,12,16,0.96);backdrop-filter:blur(18px);
    border-top:1px solid var(--border);
  }
  .mobile-nav-item{
    height:52px;border:0;background:transparent;color:var(--muted);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:4px;border-radius:var(--rs);font-family:var(--font);font-size:10px;
  }
  .mobile-nav-item span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .mobile-nav-item.active{color:var(--teal);background:var(--teal-dim)}
}
`;

// ─── Icons (inline SVG) ────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor", style: s }) => {
  const icons = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
    tv: <><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></>,
    film: <><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="2" y1="17" x2="7" y2="17"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    chevLeft: <polyline points="15 18 9 12 15 6"/>,
    chevRight: <polyline points="9 18 15 12 9 6"/>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    loader: <><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    server: <><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>,
    wifi: <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 16 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    radio: <><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
      {icons[name]}
    </svg>
  );
};

// ─── Storage ──────────────────────────────────────────────────────────────────
const FAV_KEY = "ottnav_favs";
const HIST_KEY = "ottnav_hist";
const PROF_KEY = "ottnav_prof";
const CRED_KEY = "ottnav_creds";

const store = {
  getFavs: () => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; } },
  saveFavs: (l) => localStorage.setItem(FAV_KEY, JSON.stringify(l)),
  toggleFav: (item) => {
    const l = store.getFavs();
    const k = `${item.kind}:${item.id}`;
    const i = l.findIndex((x) => `${x.kind}:${x.id}` === k);
    if (i >= 0) l.splice(i, 1); else l.unshift({ ...item, addedAt: Date.now() });
    store.saveFavs(l);
    return i < 0;
  },
  isFav: (kind, id) => store.getFavs().some((x) => x.kind === kind && String(x.id) === String(id)),
  getHistory: () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch { return []; } },
  pushHistory: (item) => {
    const l = store.getHistory().filter((x) => !(x.kind === item.kind && String(x.id) === String(item.id)));
    l.unshift({ ...item, watchedAt: Date.now() });
    localStorage.setItem(HIST_KEY, JSON.stringify(l.slice(0, 80)));
  },
  getProfile: () => { try { return JSON.parse(localStorage.getItem(PROF_KEY) || "null") || { name: "Guest" }; } catch { return { name: "Guest" }; } },
  saveProfile: (p) => localStorage.setItem(PROF_KEY, JSON.stringify(p)),
  getCreds: () => { try { return JSON.parse(localStorage.getItem(CRED_KEY) || "null"); } catch { return null; } },
  saveCreds: (c) => localStorage.setItem(CRED_KEY, JSON.stringify(c)),
};

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const API = `${BASE}/api`;
const mem = new Map();

const get = async (path, params = {}) => {
  const key = path + JSON.stringify(params);
  if (mem.has(key)) return mem.get(key);
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${API}${path}${qs ? "?" + qs : ""}`);
  if (!r.ok) throw new Error(r.statusText);
  const d = await r.json();
  mem.set(key, d);
  return d;
};

const api = {
  account: () => get("/account"),
  liveCategories: () => get("/live/categories"),
  liveStreams: (cat) => get("/live/streams", cat ? { category_id: cat } : {}),
  vodCategories: () => get("/vod/categories"),
  vodStreams: (cat) => get("/vod/streams", cat ? { category_id: cat } : {}),
  vodInfo: (id) => get(`/vod/info/${id}`),
  seriesCategories: () => get("/series/categories"),
  series: (cat) => get("/series", cat ? { category_id: cat } : {}),
  seriesInfo: (id) => get(`/series/info/${id}`),
  epg: (id) => fetch(`${API}/live/short_epg?stream_id=${id}&limit=6`).then((r) => r.json()),
  search: (q) => get("/search", { q }),
  imgProxy: (url) => url ? (url.startsWith("/") ? url : `${API}/img?url=${encodeURIComponent(url)}`) : "",
  streamUrl: (kind, id, ext = "ts") => `${API}/stream/${kind}/${id}?ext=${ext}`,
  decodeEpg: (b64) => { try { return decodeURIComponent(escape(atob(b64 || ""))); } catch { try { return atob(b64 || ""); } catch { return ""; } } },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const toastBus = { listeners: [], emit(msg) { this.listeners.forEach((fn) => fn(msg)); } };

function useToast() {
  const toast = useCallback((msg, type = "success") => toastBus.emit({ msg, type, id: Date.now() }), []);
  return toast;
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const fn = (t) => {
      setToasts((p) => [...p, t]);
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 2800);
    };
    toastBus.listeners.push(fn);
    return () => { toastBus.listeners = toastBus.listeners.filter((x) => x !== fn); };
  }, []);
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <div className={`toast-dot ${t.type}`} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Poster Card ──────────────────────────────────────────────────────────────
function PosterCard({ item, wide, onClick, onToggleFav, isFav }) {
  const [err, setErr] = useState(false);
  const src = item.icon ? api.imgProxy(item.icon) : null;
  return (
    <div className={`poster ${wide ? "poster-wide" : "poster-portrait"}`} onClick={onClick}>
      {src && !err ? (
        <img src={src} alt={item.name} onError={() => setErr(true)} loading="lazy" />
      ) : (
        <div className="poster-fallback">{item.name}</div>
      )}
      {item.kind === "live" && <div className="live-badge">Live</div>}
      {item.rating && (
        <div className="poster-rating">
          <Icon name="star" size={11} color="#ffb830" style={{ fill: "#ffb830" }} />
          {parseFloat(item.rating).toFixed(1)}
        </div>
      )}
      <div className="poster-overlay" />
      <div className="poster-info">
        <div className="poster-play"><Icon name="play" size={15} color="#000" style={{ fill: "#000" }} /></div>
        <div className="poster-name">{item.name}</div>
      </div>
      {onToggleFav && (
        <button
          className={`poster-fav ${isFav ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          style={{ color: isFav ? "var(--teal)" : "var(--text)" }}
        >
          <Icon name="heart" size={15} color={isFav ? "var(--teal)" : "var(--text)"} style={isFav ? { fill: "var(--teal)" } : {}} />
        </button>
      )}
    </div>
  );
}

// ─── Category Row ─────────────────────────────────────────────────────────────
function CatRow({ title, onSeeAll, children }) {
  const ref = useRef();
  const scroll = (d) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  return (
    <div className="cat-row">
      <div className="cat-header">
        <div className="cat-title">{title}</div>
        <div className="cat-controls">
          {onSeeAll && <button className="see-all" onClick={onSeeAll}>See all</button>}
          <button className="scroll-btn" onClick={() => scroll(-1)}><Icon name="chevLeft" size={16} /></button>
          <button className="scroll-btn" onClick={() => scroll(1)}><Icon name="chevRight" size={16} /></button>
        </div>
      </div>
      <div ref={ref} className="cat-scroller">{children}</div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ style }) { return <div className="skel" style={style} />; }

function SkeletonRow() {
  return (
    <div className="cat-row">
      <div className="cat-header">
        <Skel style={{ width: 160, height: 20, borderRadius: 6 }} />
      </div>
      <div className="cat-scroller">
        {Array(8).fill(0).map((_, i) => (
          <Skel key={i} style={{ width: 160, height: 240, borderRadius: 12, flexShrink: 0 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home", icon: "home", label: "Home" },
  { id: "live", icon: "tv", label: "Live TV" },
  { id: "movies", icon: "film", label: "Movies" },
  { id: "series", icon: "monitor", label: "Series" },
  { id: "search", icon: "search", label: "Search" },
  { id: "favorites", icon: "heart", label: "Favorites" },
  { id: "settings", icon: "settings", label: "Settings" },
];

function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📺</div>
        <div className="logo-text">OTT <span>Stream</span></div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
            <div className="active-dot" />
            <Icon name={icon} size={20} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
function MobileNav({ page, setPage }) {
  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map(({ id, icon, label }) => (
        <button key={id} className={`mobile-nav-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
          <Icon name={icon} size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function TopBar({ title, setPage }) {
  const [q, setQ] = useState("");
  const [time, setTime] = useState(new Date());
  const profile = store.getProfile();
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const submit = (e) => { e.preventDefault(); if (q.trim()) setPage("search", q.trim()); };
  return (
    <header className="topbar">
      <div className="page-title">{title}</div>
      <form className="search-wrap" onSubmit={submit}>
        <span className="search-icon"><Icon name="search" size={16} /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies, shows, channels..." />
      </form>
      <div className="topbar-right">
        <div className="time-badge">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <span style={{ margin: "0 6px", opacity: 0.3 }}>•</span>
          {time.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" })}
        </div>
        <div className="avatar" title={profile.name}>
          {(profile.name || "G")[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}

// ─── Player ───────────────────────────────────────────────────────────────────
const ASPECT_OPTIONS = [
  { value: "fit", label: "Fit", ratio: "16/9", objectFit: "contain" },
  { value: "fill", label: "Fill", ratio: "16/9", objectFit: "cover" },
  { value: "stretch", label: "Stretch", ratio: "16/9", objectFit: "fill" },
  { value: "4-3", label: "4:3", ratio: "4/3", objectFit: "contain" },
  { value: "16-9", label: "16:9", ratio: "16/9", objectFit: "contain" },
  { value: "21-9", label: "21:9", ratio: "21/9", objectFit: "contain" },
];

const trackLabel = (track, index, fallback) => {
  const name = track.name || track.label || "";
  const lang = (track.lang || track.language || "").toUpperCase();
  if (name && lang) return `${name} (${lang})`;
  if (name) return name;
  return `${fallback} ${index + 1}${lang ? ` (${lang})` : ""}`;
};

function Player({ kind, streamId, ext = "ts", poster }) {
  const videoRef = useRef();
  const playerRef = useRef();
  const hlsRef = useRef(null);
  const liveRecoveriesRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aspectMode, setAspectMode] = useState("fit");
  const [audioTracks, setAudioTracks] = useState([]);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState("");
  const [selectedSubtitle, setSelectedSubtitle] = useState("-1");

  const aspect = useMemo(
    () => ASPECT_OPTIONS.find((opt) => opt.value === aspectMode) || ASPECT_OPTIONS[0],
    [aspectMode]
  );

  useEffect(() => {
    setError(null);
    setLoading(true);
    setAudioTracks([]);
    setSubtitleTracks([]);
    setSelectedAudio("");
    setSelectedSubtitle("-1");
    liveRecoveriesRef.current = 0;

    const video = videoRef.current;
    if (!video || !streamId) return;
    const url = api.streamUrl(kind, streamId, ext);
    let liveChaseTimer = null;

    const syncNativeAudioTracks = () => {
      const tracks = video.audioTracks ? Array.from(video.audioTracks) : [];
      setAudioTracks(tracks.map((track, index) => ({ id: String(index), label: trackLabel(track, index, "Audio"), nativeIndex: index })));
      const enabledIndex = tracks.findIndex((track) => track.enabled);
      setSelectedAudio(enabledIndex >= 0 ? String(enabledIndex) : (tracks.length ? "0" : ""));
    };

    const syncNativeSubtitleTracks = () => {
      const tracks = video.textTracks ? Array.from(video.textTracks).filter((track) => ["subtitles", "captions"].includes(track.kind)) : [];
      setSubtitleTracks(tracks.map((track, index) => ({ id: String(index), label: trackLabel(track, index, "Subtitles"), nativeIndex: Array.from(video.textTracks).indexOf(track) })));
      const showingIndex = tracks.findIndex((track) => track.mode === "showing");
      setSelectedSubtitle(showingIndex >= 0 ? String(showingIndex) : "-1");
    };

    const jumpToLiveEdge = () => {
      if (kind !== "live" || !video.buffered || video.buffered.length === 0) return false;
      const end = video.buffered.end(video.buffered.length - 1);
      const lag = end - video.currentTime;
      if (lag > 12) {
        video.currentTime = Math.max(0, end - 3);
        return true;
      }
      if (video.paused && !video.ended) video.play().catch(() => {});
      return false;
    };

    const cleanup = () => {
      if (liveChaseTimer) window.clearInterval(liveChaseTimer);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };

    const setupPlayer = async () => {
      try {
        const useMpegts = (ext === "ts" || kind === "live");
        if (useMpegts && mpegts.isSupported()) {
          const isLive = kind === "live";
          const p = mpegts.createPlayer(
            { type: "mpegts", isLive, url },
            {
              enableStashBuffer: true,
              stashInitialSize: isLive ? 768 * 1024 : 384 * 1024,
              lazyLoad: false,
              autoCleanupSourceBuffer: true,
              autoCleanupMaxBackwardDuration: isLive ? 45 : 180,
              autoCleanupMinBackwardDuration: isLive ? 20 : 60,
              liveBufferLatencyChasing: isLive,
              liveBufferLatencyMaxLatency: 10,
              liveBufferLatencyMinRemain: 2,
            }
          );
          p.attachMediaElement(video);
          p.load();
          p.play().catch(() => {});
          p.on(mpegts.Events.ERROR, (type, detail) => {
            if (isLive && liveRecoveriesRef.current < 3) {
              liveRecoveriesRef.current += 1;
              setLoading(true);
              window.setTimeout(() => {
                try {
                  p.unload();
                  p.load();
                  p.play().catch(() => {});
                } catch {
                  setError(`${type}: ${detail}`);
                }
              }, 900);
              return;
            }
            setError(`${type}: ${detail}`);
          });
          playerRef.current = p;
        } else if (ext === "m3u8" && Hls.isSupported()) {
          const hlsConfig = {
            lowLatencyMode: false,
            backBufferLength: kind === "live" ? 30 : 90,
            maxBufferLength: kind === "live" ? 45 : 90,
            maxMaxBufferLength: kind === "live" ? 60 : 120,
            maxLiveSyncPlaybackRate: kind === "live" ? 1.1 : 1,
          };
          if (kind === "live") {
            hlsConfig.liveSyncDurationCount = 4;
            hlsConfig.liveMaxLatencyDurationCount = 10;
          }
          const hls = new Hls(hlsConfig);
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
            const tracks = data.audioTracks || [];
            setAudioTracks(tracks.map((track, index) => ({ id: String(index), label: trackLabel(track, index, "Audio") })));
            setSelectedAudio(String(Math.max(hls.audioTrack, 0)));
          });
          hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => setSelectedAudio(String(data.id)));
          hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
            const tracks = data.subtitleTracks || [];
            setSubtitleTracks(tracks.map((track, index) => ({ id: String(index), label: trackLabel(track, index, "Subtitles") })));
            setSelectedSubtitle(String(hls.subtitleTrack));
          });
          hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_, data) => setSelectedSubtitle(String(data.id ?? hls.subtitleTrack)));
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              setError(data.details || "Playback error");
            }
          });
          playerRef.current = { destroy: () => hls.destroy() };
        } else {
          video.src = url;
          video.load();
          video.play().catch(() => {});
        }
      } catch (e) { setError(String(e)); }
    };

    setupPlayer();
    if (kind === "live") liveChaseTimer = window.setInterval(jumpToLiveEdge, 5000);

    const onPlaying = () => setLoading(false);
    const onCanPlay = () => setLoading(false);
    const onWaiting = () => setLoading(!jumpToLiveEdge() && video.readyState < 3);
    const onStalled = () => { if (!jumpToLiveEdge()) setLoading(true); };
    const onError = () => setError("Stream may be offline or unavailable.");
    const onLoadedMetadata = () => {
      syncNativeAudioTracks();
      syncNativeSubtitleTracks();
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("stalled", onStalled);
    video.addEventListener("error", onError);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.audioTracks?.addEventListener?.("change", syncNativeAudioTracks);
    video.textTracks?.addEventListener?.("change", syncNativeSubtitleTracks);
    video.textTracks?.addEventListener?.("addtrack", syncNativeSubtitleTracks);

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("error", onError);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.audioTracks?.removeEventListener?.("change", syncNativeAudioTracks);
      video.textTracks?.removeEventListener?.("change", syncNativeSubtitleTracks);
      video.textTracks?.removeEventListener?.("addtrack", syncNativeSubtitleTracks);
      cleanup();
    };
  }, [kind, streamId, ext]);

  const changeAudio = (value) => {
    setSelectedAudio(value);
    const index = Number(value);
    const hls = hlsRef.current;
    if (hls && hls.audioTracks?.length) {
      hls.audioTrack = index;
      return;
    }
    const tracks = videoRef.current?.audioTracks;
    if (tracks) Array.from(tracks).forEach((track, i) => { track.enabled = i === index; });
  };

  const changeSubtitle = (value) => {
    setSelectedSubtitle(value);
    const index = Number(value);
    const hls = hlsRef.current;
    if (hls && hls.subtitleTracks?.length) {
      hls.subtitleTrack = index;
      return;
    }
    const tracks = videoRef.current?.textTracks;
    if (tracks) {
      const subtitleIndexes = Array.from(tracks).reduce((acc, track, i) => {
        if (["subtitles", "captions"].includes(track.kind)) acc.push(i);
        return acc;
      }, []);
      Array.from(tracks).forEach((track, i) => {
        track.mode = value !== "-1" && i === subtitleIndexes[index] ? "showing" : "disabled";
      });
    }
  };

  const showLanguageControls = kind !== "live";

  return (
    <div className="player-wrap" style={{ "--player-aspect": aspect.ratio }}>
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        preload="auto"
        poster={poster}
        style={{ width: "100%", height: "100%", display: "block", objectFit: aspect.objectFit }}
      />
      <div className="player-tools">
        <label className="player-tool">
          <span>Ratio</span>
          <select value={aspectMode} onChange={(e) => setAspectMode(e.target.value)}>
            {ASPECT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </label>
        {showLanguageControls && audioTracks.length > 1 && (
          <label className="player-tool">
            <span>Audio</span>
            <select value={selectedAudio} onChange={(e) => changeAudio(e.target.value)}>
              {audioTracks.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
            </select>
          </label>
        )}
        {showLanguageControls && subtitleTracks.length > 0 && (
          <label className="player-tool">
            <span>Subs</span>
            <select value={selectedSubtitle} onChange={(e) => changeSubtitle(e.target.value)}>
              <option value="-1">Off</option>
              {subtitleTracks.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
            </select>
          </label>
        )}
      </div>
      {loading && !error && (
        <div className="player-loader">
          <Icon name="loader" size={40} color="var(--teal)" style={{ animation: "spin 0.8s linear infinite" }} />
        </div>
      )}
      {error && (
        <div className="player-error">
          <Icon name="alert" size={36} color="var(--amber)" />
          <div style={{ fontWeight: 600 }}>Unable to play stream</div>
          <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 360 }}>{error}</div>
        </div>
      )}
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ setPage }) {
  const [hero, setHero] = useState(undefined);
  const [movies, setMovies] = useState(null);
  const [series, setSeries] = useState(null);
  const [liveRows, setLiveRows] = useState(null);
  const [favTick, setFavTick] = useState(0);
  const toast = useToast();

  const mapVod = (s) => ({ kind: "movie", id: s.stream_id, name: s.name, icon: s.stream_icon, rating: s.rating, ext: s.container_extension });
  const mapSeries = (s) => ({ kind: "series", id: s.series_id, name: s.name, icon: s.cover, rating: s.rating });
  const mapLive = (s) => ({ kind: "live", id: s.stream_id, name: s.name, icon: s.stream_icon });

  useEffect(() => {
    (async () => {
      try {
        const cats = await api.liveCategories();
        const featured = (cats || []).slice(0, 2);
        const rows = await Promise.all(featured.map(async (c) => ({
          cat: c,
          items: ((await api.liveStreams(c.category_id).catch(() => [])) || []).slice(0, 20).map(mapLive),
        })));
        setLiveRows(rows);
      } catch { setLiveRows([]); }
    })();
    (async () => {
      try {
        const cats = await api.vodCategories();
        const fc = (cats || []).find((c) => /4k|english|netflix|latest|2024|2025/i.test(c.category_name)) || (cats || [])[0];
        if (!fc) { setMovies({ cat: { category_name: "Movies" }, items: [] }); setHero(null); return; }
        const v = (await api.vodStreams(fc.category_id)) || [];
        setMovies({ cat: fc, items: v.slice(0, 20).map(mapVod) });
        const candidate = v.find((x) => x.stream_icon) || v[0];
        setHero(candidate ? { ...mapVod(candidate), overview: candidate.plot } : null);
      } catch { setMovies({ cat: { category_name: "Movies" }, items: [] }); setHero(null); }
    })();
    (async () => {
      try {
        const cats = await api.seriesCategories();
        const fc = (cats || []).find((c) => /netflix|amazon|hbo|apple/i.test(c.category_name)) || (cats || [])[0];
        if (!fc) { setSeries({ cat: { category_name: "Series" }, items: [] }); return; }
        const s = (await api.series(fc.category_id)) || [];
        setSeries({ cat: fc, items: s.slice(0, 20).map(mapSeries) });
      } catch { setSeries({ cat: { category_name: "Series" }, items: [] }); }
    })();
  }, []);

  const history = store.getHistory().slice(0, 12);
  const openItem = (it) => {
    if (it.kind === "live") setPage("watch", it.id, { kind: "live" });
    else if (it.kind === "movie") setPage("movieDetail", it.id);
    else setPage("seriesDetail", it.id);
  };

  const toggleFav = (item) => {
    const added = store.toggleFav(item);
    toast(added ? `Added to Favorites` : "Removed from Favorites", added ? "success" : "error");
    setFavTick((t) => t + 1);
  };

  const quick = [
    { icon: "tv", label: "Live TV", page: "live", bg: "rgba(255,77,109,0.12)", color: "var(--rose)" },
    { icon: "film", label: "Movies", page: "movies", bg: "rgba(0,229,192,0.12)", color: "var(--teal)" },
    { icon: "monitor", label: "Series", page: "series", bg: "rgba(120,80,255,0.12)", color: "#9b6dff" },
    { icon: "clock", label: "Continue", page: "favorites", bg: "rgba(255,184,48,0.12)", color: "var(--amber)" },
  ];

  return (
    <div className="page page-enter">
      {/* Hero */}
      {hero === undefined ? (
        <div className="hero-skeleton" />
      ) : hero ? (
        <div className="hero">
          {hero.icon && <img src={api.imgProxy(hero.icon)} alt={hero.name} className="hero-img" />}
          <div className="hero-overlay" />
          <div className="hero-overlay2" />
          <div className="hero-content">
            <div className="hero-badge">⭐ Featured</div>
            <h2 className="hero-title">{hero.name}</h2>
            {hero.overview && <p className="hero-desc">{hero.overview}</p>}
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => setPage("movieDetail", hero.id)}>
                <Icon name="play" size={16} color="#000" style={{ fill: "#000" }} /> Watch Now
              </button>
              <button className="btn btn-ghost" onClick={() => setPage("movieDetail", hero.id)}>
                <Icon name="info" size={16} /> More Info
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hero hero-empty">
          <div className="hero-badge">No content</div>
          <h2 className="hero-title">Playlist unavailable</h2>
          <p className="hero-desc">Live TV, movies, and series will appear here once the backend can reach your IPTV provider.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setPage("settings")}>
              <Icon name="settings" size={16} color="#000" /> Settings
            </button>
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="quick-grid" style={{ marginBottom: 32 }}>
        {quick.map(({ icon, label, page, bg, color }) => (
          <button key={page} className="quick-card" onClick={() => setPage(page)} style={{ background: bg + "33" }}>
            <div className="quick-icon" style={{ background: bg }}>
              <Icon name={icon} size={22} color={color} />
            </div>
            <span className="quick-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Continue watching */}
      {history.length > 0 && (
        <CatRow title="Continue Watching">
          {history.map((it) => (
            <PosterCard key={`${it.kind}-${it.id}`} item={it} wide={it.kind === "live"} onClick={() => openItem(it)} />
          ))}
        </CatRow>
      )}

      {movies ? (
        movies.items.length > 0 && (
          <CatRow title={movies.cat.category_name} onSeeAll={() => setPage("movies")}>
            {movies.items.map((it) => (
              <PosterCard key={it.id} item={it} isFav={store.isFav(it.kind, it.id)} onClick={() => openItem(it)} onToggleFav={() => toggleFav(it)} />
            ))}
          </CatRow>
        )
      ) : <SkeletonRow />}

      {series ? (
        series.items.length > 0 && (
          <CatRow title={series.cat.category_name} onSeeAll={() => setPage("series")}>
            {series.items.map((it) => (
              <PosterCard key={it.id} item={it} onClick={() => openItem(it)} />
            ))}
          </CatRow>
        )
      ) : <SkeletonRow />}

      {liveRows && liveRows.map(({ cat, items }) => items.length > 0 && (
        <CatRow key={cat.category_id} title={`Live • ${cat.category_name}`} onSeeAll={() => setPage("live")}>
          {items.map((it) => (
            <PosterCard key={it.id} item={it} wide onClick={() => openItem(it)} />
          ))}
        </CatRow>
      ))}
    </div>
  );
}

// ─── Movies Page ──────────────────────────────────────────────────────────────
function MoviesPage({ setPage }) {
  const [cats, setCats] = useState([]);
  const [selCat, setSelCat] = useState("");
  const [streams, setStreams] = useState(null);
  const [filter, setFilter] = useState("");
  const [favTick, setFavTick] = useState(0);
  const toast = useToast();

  useEffect(() => { api.vodCategories().then(setCats).catch(() => setCats([])); }, []);
  useEffect(() => {
    setStreams(null);
    const cat = selCat || (cats[0]?.category_id);
    if (!cat) { setStreams([]); return; }
    api.vodStreams(cat).then((l) => setStreams(l || [])).catch(() => setStreams([]));
  }, [selCat, cats]);

  const filtered = useMemo(() => {
    if (!streams) return null;
    const q = filter.trim().toLowerCase();
    return q ? streams.filter((s) => (s.name || "").toLowerCase().includes(q)) : streams;
  }, [streams, filter]);

  const activeCat = cats.find((c) => String(c.category_id) === String(selCat)) || cats[0];

  const toggleFav = (item) => {
    const added = store.toggleFav(item);
    toast(added ? "Added to Favorites" : "Removed from Favorites", added ? "success" : "error");
    setFavTick((t) => t + 1);
  };

  return (
    <div className="page page-enter">
      <div className="content-layout">
        <div className="cat-sidebar">
          <div className="cat-sidebar-title">Genres</div>
          {cats.map((c) => (
            <button key={c.category_id} className={`cat-btn ${String(activeCat?.category_id) === String(c.category_id) ? "active" : ""}`}
              onClick={() => setSelCat(c.category_id)} title={c.category_name}>
              {c.category_name}
            </button>
          ))}
        </div>
        <div>
          <div className="filter-bar">
            <div className="filter-heading">
              <span className="section-title">{activeCat?.category_name || "Movies"}</span>
              {cats.length > 0 && (
                <select className="cat-mobile-select" value={activeCat?.category_id || ""} onChange={(e) => setSelCat(e.target.value)}>
                  {cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              )}
            </div>
            <input className="filter-input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..." />
          </div>
          {!filtered ? (
            <div className="content-grid">
              {Array(18).fill(0).map((_, i) => <Skel key={i} style={{ aspectRatio: "2/3", borderRadius: 12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎬</div><div className="empty-text">No movies found</div></div>
          ) : (
            <div className="content-grid">
              {filtered.slice(0, 200).map((s) => {
                const item = { kind: "movie", id: s.stream_id, name: s.name, icon: s.stream_icon, rating: s.rating, ext: s.container_extension };
                return (
                  <PosterCard key={s.stream_id} item={item} isFav={store.isFav("movie", s.stream_id)}
                    onClick={() => setPage("movieDetail", s.stream_id)}
                    onToggleFav={() => toggleFav(item)} />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Live TV Page ─────────────────────────────────────────────────────────────
function LivePage({ setPage }) {
  const [cats, setCats] = useState([]);
  const [selCat, setSelCat] = useState("");
  const [streams, setStreams] = useState(null);
  const [filter, setFilter] = useState("");
  const [epgMap, setEpgMap] = useState({});

  useEffect(() => { api.liveCategories().then(setCats).catch(() => setCats([])); }, []);
  useEffect(() => {
    setStreams(null); setEpgMap({});
    const cat = selCat || (cats[0]?.category_id);
    if (!cat) { setStreams([]); return; }
    api.liveStreams(cat).then((l) => setStreams(l || [])).catch(() => setStreams([]));
  }, [selCat, cats]);

  useEffect(() => {
    if (!streams) return;
    streams.slice(0, 20).forEach(async (s) => {
      try {
        const res = await api.epg(s.stream_id);
        const listings = res?.epg_listings || [];
        if (listings.length) setEpgMap((m) => ({ ...m, [s.stream_id]: listings }));
      } catch {}
    });
  }, [streams]);

  const filtered = useMemo(() => {
    if (!streams) return null;
    const q = filter.trim().toLowerCase();
    return q ? streams.filter((s) => (s.name || "").toLowerCase().includes(q)) : streams;
  }, [streams, filter]);

  const activeCat = cats.find((c) => String(c.category_id) === String(selCat)) || cats[0];

  return (
    <div className="page page-enter">
      <div className="content-layout">
        <div className="cat-sidebar">
          <div className="cat-sidebar-title"><Icon name="radio" size={11} /> Categories</div>
          {cats.map((c) => (
            <button key={c.category_id} className={`cat-btn ${String(activeCat?.category_id) === String(c.category_id) ? "active" : ""}`}
              onClick={() => setSelCat(c.category_id)} title={c.category_name}>
              {c.category_name}
            </button>
          ))}
        </div>
        <div>
          <div className="filter-bar">
            <div className="filter-heading">
              <span className="section-title">{activeCat?.category_name || "Channels"} <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 400 }}>({filtered?.length || 0})</span></span>
              {cats.length > 0 && (
                <select className="cat-mobile-select" value={activeCat?.category_id || ""} onChange={(e) => setSelCat(e.target.value)}>
                  {cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              )}
            </div>
            <input className="filter-input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter channels..." />
          </div>
          {!filtered ? (
            <div className="channel-grid">
              {Array(12).fill(0).map((_, i) => <Skel key={i} style={{ height: 74, borderRadius: 12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">TV</div><div className="empty-text">No channels found</div></div>
          ) : (
            <div className="channel-grid">
              {filtered.map((s) => {
                const epg = epgMap[s.stream_id] || [];
                return (
                  <div key={s.stream_id} className="channel-card" onClick={() => setPage("watch", s.stream_id, { kind: "live" })}>
                    <div className="ch-logo">
                      {s.stream_icon ? (
                        <img src={api.imgProxy(s.stream_icon)} alt={s.name} onError={(e) => { e.target.style.display = "none"; }} />
                      ) : <Icon name="tv" size={22} color="var(--faint)" />}
                    </div>
                    <div className="ch-info">
                      <div className="ch-name">
                        {s.name}
                        <span className="ch-live">Live</span>
                      </div>
                      {epg[0] ? (
                        <div className="ch-epg-now"><span style={{ color: "var(--teal)" }}>Now:</span> {api.decodeEpg(epg[0].title) || "—"}</div>
                      ) : <div className="ch-epg-now" style={{ color: "var(--faint)" }}>No EPG data</div>}
                      {epg[1] && <div className="ch-epg-next"><span style={{ color: "var(--muted)" }}>Next:</span> {api.decodeEpg(epg[1].title) || "—"}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Series Page ──────────────────────────────────────────────────────────────
function SeriesPage({ setPage }) {
  const [cats, setCats] = useState([]);
  const [selCat, setSelCat] = useState("");
  const [streams, setStreams] = useState(null);
  const [filter, setFilter] = useState("");

  useEffect(() => { api.seriesCategories().then(setCats).catch(() => setCats([])); }, []);
  useEffect(() => {
    setStreams(null);
    const cat = selCat || (cats[0]?.category_id);
    if (!cat) { setStreams([]); return; }
    api.series(cat).then((l) => setStreams(l || [])).catch(() => setStreams([]));
  }, [selCat, cats]);

  const filtered = useMemo(() => {
    if (!streams) return null;
    const q = filter.trim().toLowerCase();
    return q ? streams.filter((s) => (s.name || "").toLowerCase().includes(q)) : streams;
  }, [streams, filter]);

  const activeCat = cats.find((c) => String(c.category_id) === String(selCat)) || cats[0];

  return (
    <div className="page page-enter">
      <div className="content-layout">
        <div className="cat-sidebar">
          <div className="cat-sidebar-title">Genres</div>
          {cats.map((c) => (
            <button key={c.category_id} className={`cat-btn ${String(activeCat?.category_id) === String(c.category_id) ? "active" : ""}`}
              onClick={() => setSelCat(c.category_id)} title={c.category_name}>
              {c.category_name}
            </button>
          ))}
        </div>
        <div>
          <div className="filter-bar">
            <div className="filter-heading">
              <span className="section-title">{activeCat?.category_name || "Series"}</span>
              {cats.length > 0 && (
                <select className="cat-mobile-select" value={activeCat?.category_id || ""} onChange={(e) => setSelCat(e.target.value)}>
                  {cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              )}
            </div>
            <input className="filter-input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..." />
          </div>
          {!filtered ? (
            <div className="content-grid">
              {Array(18).fill(0).map((_, i) => <Skel key={i} style={{ aspectRatio: "2/3", borderRadius: 12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📺</div><div className="empty-text">No series found</div></div>
          ) : (
            <div className="content-grid">
              {filtered.slice(0, 200).map((s) => {
                const item = { kind: "series", id: s.series_id, name: s.name, icon: s.cover, rating: s.rating };
                return <PosterCard key={s.series_id} item={item} onClick={() => setPage("seriesDetail", s.series_id)} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Watch Page ───────────────────────────────────────────────────────────────
function WatchPage({ streamId, setPage }) {
  const [channel, setChannel] = useState(null);
  const [related, setRelated] = useState([]);
  const [epg, setEpg] = useState([]);
  const [favTick, setFavTick] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cats = await api.liveCategories().catch(() => []);
      for (const c of (cats || [])) {
        const list = await api.liveStreams(c.category_id).catch(() => []);
        const match = (list || []).find((s) => String(s.stream_id) === String(streamId));
        if (match) {
          if (cancelled) return;
          setChannel({ ...match, category_name: c.category_name });
          setRelated((list || []).filter((x) => String(x.stream_id) !== String(streamId)).slice(0, 40));
          store.pushHistory({ kind: "live", id: match.stream_id, name: match.name, icon: match.stream_icon });
          break;
        }
      }
    })();
    api.epg(streamId).then((res) => setEpg(res?.epg_listings || [])).catch(() => setEpg([]));
    return () => { cancelled = true; };
  }, [streamId]);

  const favItem = channel ? { kind: "live", id: channel.stream_id, name: channel.name, icon: channel.stream_icon } : null;
  const isFav = favItem ? store.isFav("live", favItem.id) : false;

  const toggleFav = () => {
    if (!favItem) return;
    const added = store.toggleFav(favItem);
    toast(added ? "Added to Favorites" : "Removed from Favorites", added ? "success" : "error");
    setFavTick((t) => t + 1);
  };

  const fmt = (ts) => new Date((parseInt(ts, 10) || 0) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="page page-enter">
      <button className="btn btn-ghost" style={{ marginBottom: 16, height: 36 }} onClick={() => setPage("live")}>
        <Icon name="arrowLeft" size={16} /> Back
      </button>
      <div className="watch-layout">
        <div>
          <Player kind="live" streamId={streamId} ext="ts" poster={channel?.stream_icon ? api.imgProxy(channel.stream_icon) : undefined} />
          {channel && (
            <div className="stream-meta">
              {channel.stream_icon
                ? <img className="stream-thumb" src={api.imgProxy(channel.stream_icon)} alt={channel.name} onError={(e) => { e.target.style.display = "none"; }} />
                : <div className="stream-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="tv" size={24} color="var(--faint)" /></div>}
              <div>
                <div className="stream-name">{channel.name} <span style={{ fontSize: 10, background: "var(--rose-dim)", color: "var(--rose)", padding: "2px 8px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.8 }}>LIVE</span></div>
                <div className="stream-cat">{channel.category_name}</div>
              </div>
              <button className={`fav-btn ${isFav ? "active" : ""}`} onClick={toggleFav}>
                <Icon name="heart" size={15} color={isFav ? "var(--teal)" : "currentColor"} style={isFav ? { fill: "var(--teal)" } : {}} />
                {isFav ? "Saved" : "Save"}
              </button>
            </div>
          )}
          {epg.length > 0 && (
            <div className="epg-list">
              <div className="epg-section-title">Program Guide</div>
              {epg.map((e, i) => (
                <div key={i} className={`epg-item ${i === 0 ? "now" : ""}`}>
                  <div className="epg-time">
                    <span>{fmt(e.start_timestamp)} – {fmt(e.stop_timestamp)}</span>
                    {i === 0 && <span className="epg-now-tag">Now</span>}
                  </div>
                  <div className="epg-title">{api.decodeEpg(e.title)}</div>
                  {e.description && <div className="epg-desc">{api.decodeEpg(e.description)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="related-list">
          <div className="related-header">More Channels</div>
          <div className="related-scroll">
            {related.map((s) => (
              <button key={s.stream_id} className="related-item" onClick={() => setPage("watch", s.stream_id, { kind: "live" })}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {s.stream_icon
                    ? <img src={api.imgProxy(s.stream_icon)} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                    : <Icon name="tv" size={16} color="var(--faint)" />}
                </div>
                <span className="related-name">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Search Page ──────────────────────────────────────────────────────────────
function PlaybackPage({ streamId, opts = {}, setPage }) {
  const kind = opts.kind || "live";
  const ext = opts.ext || (kind === "live" ? "ts" : "mp4");
  const [media, setMedia] = useState(kind === "live" ? null : opts.item || null);
  const [related, setRelated] = useState([]);
  const [epg, setEpg] = useState([]);
  const [favTick, setFavTick] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setRelated([]);
    setEpg([]);

    if (kind !== "live") {
      const fallback = {
        kind,
        id: streamId,
        name: kind === "movie" ? "Movie" : "Episode",
        icon: opts.poster || "",
        seriesId: opts.seriesId,
        seriesName: opts.seriesName,
      };
      const item = opts.item || fallback;
      setMedia(item);
      store.pushHistory(item.kind === "series" && item.seriesId ? { ...item, id: item.seriesId, name: item.seriesName || item.name } : item);
      return () => { cancelled = true; };
    }

    setMedia(null);
    (async () => {
      const cats = await api.liveCategories().catch(() => []);
      for (const c of (cats || [])) {
        const list = await api.liveStreams(c.category_id).catch(() => []);
        const match = (list || []).find((s) => String(s.stream_id) === String(streamId));
        if (match) {
          if (cancelled) return;
          const item = { kind: "live", id: match.stream_id, name: match.name, icon: match.stream_icon, category: c.category_name };
          setMedia(item);
          setRelated((list || []).filter((x) => String(x.stream_id) !== String(streamId)).slice(0, 40));
          store.pushHistory(item);
          break;
        }
      }
    })();
    api.epg(streamId).then((res) => setEpg(res?.epg_listings || [])).catch(() => setEpg([]));
    return () => { cancelled = true; };
  }, [streamId, kind, opts]);

  const favItem = media ? {
    kind: media.kind || kind,
    id: media.kind === "series" && media.seriesId ? media.seriesId : (media.id || streamId),
    name: media.kind === "series" && media.seriesName ? media.seriesName : (media.name || "Untitled"),
    icon: media.icon,
  } : null;
  const isFav = favItem ? store.isFav(favItem.kind, favItem.id) : false;

  const toggleFav = () => {
    if (!favItem) return;
    const added = store.toggleFav(favItem);
    toast(added ? "Added to Favorites" : "Removed from Favorites", added ? "success" : "error");
    setFavTick((t) => t + 1);
  };

  const goBack = () => {
    if (opts.backPage === "seriesDetail" && opts.backId) setPage("seriesDetail", opts.backId);
    else if (opts.backPage === "movieDetail" && opts.backId) setPage("movieDetail", opts.backId);
    else if (kind === "movie" && streamId) setPage("movieDetail", streamId);
    else setPage(kind === "series" ? "series" : kind === "movie" ? "movies" : "live");
  };

  const fmt = (ts) => new Date((parseInt(ts, 10) || 0) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const badge = kind === "live" ? "Live" : kind === "movie" ? "Movie" : "Episode";
  const title = media?.name || (kind === "live" ? "Live Stream" : kind === "movie" ? "Movie" : "Episode");
  const subtitle = media?.category || media?.seriesName || (kind === "live" ? "Channel" : kind === "movie" ? "Video on demand" : "Series");
  const poster = media?.icon ? api.imgProxy(media.icon) : undefined;

  return (
    <div className="page page-enter">
      <button className="btn btn-ghost" style={{ marginBottom: 16, height: 36 }} onClick={goBack}>
        <Icon name="arrowLeft" size={16} /> Back
      </button>
      <div className={`watch-layout ${kind !== "live" ? "watch-layout-single" : ""}`}>
        <div>
          <Player kind={kind} streamId={streamId} ext={ext} poster={poster} />
          <div className="stream-meta">
            {poster
              ? <img className="stream-thumb" src={poster} alt={title} onError={(e) => { e.target.style.display = "none"; }} />
              : <div className="stream-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={kind === "live" ? "tv" : "film"} size={24} color="var(--faint)" /></div>}
            <div className="stream-copy">
              <div className="stream-name">
                <span className="stream-name-main">{title}</span>
                <span className="media-badge">{badge}</span>
              </div>
              <div className="stream-cat">{subtitle}</div>
            </div>
            <button className={`fav-btn ${isFav ? "active" : ""}`} onClick={toggleFav}>
              <Icon name="heart" size={15} color={isFav ? "var(--teal)" : "currentColor"} style={isFav ? { fill: "var(--teal)" } : {}} />
              {isFav ? "Saved" : "Save"}
            </button>
          </div>
          {kind === "live" && epg.length > 0 && (
            <div className="epg-list">
              <div className="epg-section-title">Program Guide</div>
              {epg.map((e, i) => (
                <div key={i} className={`epg-item ${i === 0 ? "now" : ""}`}>
                  <div className="epg-time">
                    <span>{fmt(e.start_timestamp)} - {fmt(e.stop_timestamp)}</span>
                    {i === 0 && <span className="epg-now-tag">Now</span>}
                  </div>
                  <div className="epg-title">{api.decodeEpg(e.title)}</div>
                  {e.description && <div className="epg-desc">{api.decodeEpg(e.description)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        {kind === "live" && (
          <div className="related-list">
            <div className="related-header">More Channels</div>
            <div className="related-scroll">
              {related.map((s) => (
                <button key={s.stream_id} className="related-item" onClick={() => setPage("watch", s.stream_id, { kind: "live" })}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {s.stream_icon
                      ? <img src={api.imgProxy(s.stream_icon)} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                      : <Icon name="tv" size={16} color="var(--faint)" />}
                  </div>
                  <span className="related-name">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchPage({ initialQ, setPage }) {
  const [q, setQ] = useState(initialQ || "");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) { setResults(null); return; }
    setLoading(true);
    api.search(q).then(setResults).catch(() => setResults({ live: [], vod: [], series: [] })).finally(() => setLoading(false));
  }, [q]);

  const submit = (e) => { e.preventDefault(); };
  const total = results ? results.live.length + results.vod.length + results.series.length : 0;

  return (
    <div className="page page-enter">
      <form onSubmit={submit} className="search-wrap-big">
        <span className="search-icon-big"><Icon name="search" size={20} /></span>
        <input autoFocus className="search-big" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies, series & channels..." />
      </form>
      {!q && <div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-text">Start typing to search</div></div>}
      {loading && <div className="empty-state"><div className="empty-text pulse">Searching...</div></div>}
      {results && !loading && total === 0 && <div className="empty-state"><div className="empty-icon">😕</div><div className="empty-text">No results for "{q}"</div></div>}
      {results?.vod?.length > 0 && (
        <div className="search-results-section">
          <div className="search-section-title">Movies ({results.vod.length})</div>
          <div className="search-grid">
            {results.vod.map((s) => (
              <PosterCard key={s.stream_id} item={{ kind: "movie", id: s.stream_id, name: s.name, icon: s.stream_icon, rating: s.rating }} onClick={() => setPage("movieDetail", s.stream_id)} />
            ))}
          </div>
        </div>
      )}
      {results?.series?.length > 0 && (
        <div className="search-results-section">
          <div className="search-section-title">Series ({results.series.length})</div>
          <div className="search-grid">
            {results.series.map((s) => (
              <PosterCard key={s.series_id} item={{ kind: "series", id: s.series_id, name: s.name, icon: s.cover, rating: s.rating }} onClick={() => setPage("seriesDetail", s.series_id)} />
            ))}
          </div>
        </div>
      )}
      {results?.live?.length > 0 && (
        <div className="search-results-section">
          <div className="search-section-title">Live TV ({results.live.length})</div>
          <div className="search-grid-wide">
            {results.live.map((s) => (
              <PosterCard wide key={s.stream_id} item={{ kind: "live", id: s.stream_id, name: s.name, icon: s.stream_icon }} onClick={() => setPage("watch", s.stream_id, { kind: "live" })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Favorites Page ───────────────────────────────────────────────────────────
function FavoritesPage({ setPage }) {
  const [tick, setTick] = useState(0);
  const toast = useToast();
  const list = store.getFavs();
  const groups = {
    movie: list.filter((x) => x.kind === "movie"),
    series: list.filter((x) => x.kind === "series"),
    live: list.filter((x) => x.kind === "live"),
  };
  const open = (it) => {
    if (it.kind === "live") setPage("watch", it.id, { kind: "live" });
    else if (it.kind === "movie") setPage("movieDetail", it.id);
    else setPage("seriesDetail", it.id);
  };
  const toggleFav = (it) => {
    store.toggleFav(it);
    toast("Removed from Favorites", "error");
    setTick((t) => t + 1);
  };

  return (
    <div className="page page-enter">
      {list.length === 0 && (
        <div className="fav-empty">
          <div style={{ fontSize: 56, marginBottom: 12 }}>💔</div>
          <div style={{ fontSize: 15, color: "var(--muted)" }}>No favorites yet. Tap the heart on any title to save it.</div>
        </div>
      )}
      {Object.entries(groups).map(([k, items]) => items.length > 0 && (
        <div key={k} className="fav-group">
          <div className="fav-group-title">{k === "live" ? "Live Channels" : k === "movie" ? "Movies" : "Series"}</div>
          <div style={{ display: "grid", gridTemplateColumns: k === "live" ? "repeat(auto-fill,minmax(220px,1fr))" : "repeat(auto-fill,minmax(140px,1fr))", gap: 14 }}>
            {items.map((it) => (
              <PosterCard key={`${it.kind}-${it.id}`} item={it} wide={it.kind === "live"} isFav onClick={() => open(it)} onToggleFav={() => toggleFav(it)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
function SettingsPage() {
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(store.getProfile());
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  useEffect(() => { api.account().then(setAccount).catch(() => {}); }, []);
  const onSave = () => {
    store.saveProfile(profile);
    setSaved(true);
    toast("Profile saved!", "success");
    setTimeout(() => setSaved(false), 2000);
  };
  const exp = account?.user_info?.exp_date ? new Date(parseInt(account.user_info.exp_date, 10) * 1000).toLocaleDateString() : "—";

  const SettCard = ({ icon, title, full, children }) => (
    <div className="settings-card" style={full ? { gridColumn: "1/-1" } : {}}>
      <div className="settings-card-header">
        <div className="settings-icon"><Icon name={icon} size={18} /></div>
        <div className="settings-card-title">{title}</div>
      </div>
      {children}
    </div>
  );
  const Row = ({ label, value }) => (
    <div className="settings-row">
      <span className="settings-row-label">{label}</span>
      <span className="settings-row-val">{value}</span>
    </div>
  );

  return (
    <div className="page page-enter">
      <div className="settings-grid">
        <SettCard icon="user" title="Profile">
          <div className="settings-field">
            <div className="settings-label">Display name</div>
            <input className="settings-input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <button className="save-btn" onClick={onSave}>
            <Icon name="save" size={16} color="#000" /> {saved ? "Saved ✓" : "Save"}
          </button>
        </SettCard>
        <SettCard icon="server" title="Playlist">
          <Row label="Provider" value={account?.user_info?.message || "—"} />
          <Row label="Username" value={account?.user_info?.username || "—"} />
          <Row label="Status" value={<span style={{ color: "var(--teal)" }}>{account?.user_info?.status || "—"}</span>} />
          <Row label="Server" value={account?.server_info?.url || "—"} />
        </SettCard>
        <SettCard icon="clock" title="Subscription">
          <Row label="Expires" value={exp} />
          <Row label="Trial" value={account?.user_info?.is_trial === "1" ? "Yes" : "No"} />
          <Row label="Active connections" value={`${account?.user_info?.active_cons || 0} / ${account?.user_info?.max_connections || 1}`} />
          <Row label="Output formats" value={(account?.user_info?.allowed_output_formats || []).join(", ") || "—"} />
        </SettCard>
        <SettCard icon="wifi" title="Playback">
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>Live TV streams use MPEG-TS via mpegts.js. Movies and series stream directly from your provider through a secure proxy to bypass CORS restrictions.</p>
        </SettCard>
        <SettCard icon="shield" title="Privacy" full>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>Favorites, profile and watch history are stored locally in your browser. No tracking, no external analytics.</p>
        </SettCard>
        <SettCard icon="info" title="About" full>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>OTT Stream — a modern, enhanced web client for Xtream Codes IPTV playlists. Built with React, featuring smooth animations, EPG support, favorites, and watch history.</p>
        </SettCard>
      </div>
    </div>
  );
}

// ─── Page titles ──────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  home: "Home", live: "Live TV", movies: "Movies", series: "Series",
  search: "Search", favorites: "Favorites", settings: "Settings",
  watch: "Watch", movieDetail: "Movie", seriesDetail: "Series",
};

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPageState] = useState("home");
  const [pageId, setPageId] = useState(null);
  const [pageOpts, setPageOpts] = useState({});
  const [searchQ, setSearchQ] = useState("");
  const [pageKey, setPageKey] = useState(0);

  const setPage = useCallback((p, id = null, opts = {}) => {
    setPageState(p);
    setPageId(id);
    setPageOpts(opts);
    if (p === "search" && typeof id === "string") setSearchQ(id);
    setPageKey((k) => k + 1);
    window.scrollTo?.({ top: 0 });
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage setPage={setPage} />;
      case "live": return <LivePage setPage={setPage} />;
      case "movies": return <MoviesPage setPage={setPage} />;
      case "series": return <SeriesPage setPage={setPage} />;
      case "search": return <SearchPage initialQ={searchQ} setPage={setPage} />;
      case "favorites": return <FavoritesPage setPage={setPage} />;
      case "settings": return <SettingsPage />;
      case "watch": return <PlaybackPage streamId={pageId} opts={pageOpts} setPage={setPage} />;
      case "movieDetail": return <MovieDetailPage id={pageId} setPage={setPage} />;
      case "seriesDetail": return <SeriesDetailPage id={pageId} setPage={setPage} />;
      default: return <HomePage setPage={setPage} />;
    }
  };

  const navPage = (() => {
    if (["home", "live", "movies", "series", "search", "favorites", "settings"].includes(page)) return page;
    if (page === "movieDetail") return "movies";
    if (page === "seriesDetail") return "series";
    if (page === "watch") {
      if (pageOpts.kind === "movie") return "movies";
      if (pageOpts.kind === "series") return "series";
      return "live";
    }
    return "home";
  })();

  return (
    <div className="app">
      <Sidebar page={navPage} setPage={setPage} />
      <div className="main">
        <TopBar title={PAGE_TITLES[page] || "OTT Stream"} setPage={setPage} />
        <div key={pageKey} className="page-shell">{renderPage()}</div>
      </div>
      <ToastContainer />
      <MobileNav page={navPage} setPage={setPage} />
    </div>
  );
}

// ─── Movie Detail ─────────────────────────────────────────────────────────────
function MovieDetailPage({ id, setPage }) {
  const [info, setInfo] = useState(null);
  const [favTick, setFavTick] = useState(0);
  const toast = useToast();

  useEffect(() => { api.vodInfo(id).then(setInfo).catch(() => {}); }, [id]);

  const movie = info?.info || {};
  const stream = info?.movie_data || {};
  const item = { kind: "movie", id: stream.stream_id || id, name: stream.name || movie.name || "Unknown", icon: movie.movie_image || stream.stream_icon, rating: movie.rating || movie.rating_5based, ext: stream.container_extension };

  const isFav = store.isFav("movie", item.id);
  const toggleFav = () => {
    const added = store.toggleFav(item);
    toast(added ? "Added to Favorites" : "Removed from Favorites", added ? "success" : "error");
    setFavTick((t) => t + 1);
    store.pushHistory(item);
  };

  return (
    <div className="page page-enter">
      <button className="btn btn-ghost" style={{ marginBottom: 20, height: 36 }} onClick={() => setPage("movies")}>
        <Icon name="arrowLeft" size={16} /> Back
      </button>
      {!info ? (
        <div style={{ display: "flex", gap: 28 }}>
          <Skel style={{ width: 220, height: 330, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <Skel style={{ height: 36, width: "60%", borderRadius: 8 }} />
            <Skel style={{ height: 20, width: "40%", borderRadius: 6 }} />
            <Skel style={{ height: 100, borderRadius: 8 }} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div style={{ flexShrink: 0 }}>
            {item.icon ? (
              <img src={api.imgProxy(item.icon)} alt={item.name} style={{ width: 200, borderRadius: 12, display: "block", objectFit: "cover", aspectRatio: "2/3" }} onError={(e) => { e.target.style.display = "none"; }} />
            ) : (
              <div style={{ width: 200, aspectRatio: "2/3", borderRadius: 12, background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="film" size={40} color="var(--faint)" />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, letterSpacing: -0.5, marginBottom: 8 }}>{item.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {movie.rating && <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--amber)", fontSize: 14 }}><Icon name="star" size={14} color="var(--amber)" style={{ fill: "var(--amber)" }} />{parseFloat(movie.rating).toFixed(1)}</span>}
              {movie.releasedate && <span style={{ color: "var(--muted)", fontSize: 13 }}>{movie.releasedate}</span>}
              {movie.genre && <span style={{ fontSize: 12, background: "var(--bg3)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: 99, color: "var(--muted)" }}>{movie.genre}</span>}
              {movie.duration && <span style={{ color: "var(--muted)", fontSize: 13 }}>{movie.duration}</span>}
            </div>
            {movie.plot && <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.75, marginBottom: 20, maxWidth: 580 }}>{movie.plot}</p>}
            {movie.cast && <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}><span style={{ color: "var(--text)", fontWeight: 500 }}>Cast:</span> {movie.cast}</div>}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => { store.pushHistory(item); setPage("watch", item.id, { kind: "movie", ext: item.ext || "mp4", item, backPage: "movieDetail", backId: item.id }); }}>
                <Icon name="play" size={16} color="#000" style={{ fill: "#000" }} /> Play Movie
              </button>
              <button className={`fav-btn ${isFav ? "active" : ""}`} style={{ height: 42 }} onClick={toggleFav}>
                <Icon name="heart" size={15} color={isFav ? "var(--teal)" : "currentColor"} style={isFav ? { fill: "var(--teal)" } : {}} />
                {isFav ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Series Detail ────────────────────────────────────────────────────────────
function SeriesDetailPage({ id, setPage }) {
  const [info, setInfo] = useState(null);
  const [selSeason, setSelSeason] = useState(null);
  useEffect(() => { api.seriesInfo(id).then(setInfo).catch(() => {}); }, [id]);

  const meta = info?.info || {};
  const eps = info?.episodes || {};
  const seasons = Object.keys(eps).sort((a, b) => Number(a) - Number(b));
  const activeSeason = selSeason || seasons[0];
  const episodes = eps[activeSeason] || [];

  return (
    <div className="page page-enter">
      <button className="btn btn-ghost" style={{ marginBottom: 20, height: 36 }} onClick={() => setPage("series")}>
        <Icon name="arrowLeft" size={16} /> Back
      </button>
      {!info ? (
        <div style={{ display: "flex", gap: 28 }}>
          <Skel style={{ width: 200, height: 300, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <Skel style={{ height: 36, width: "60%", borderRadius: 8 }} />
            <Skel style={{ height: 100, borderRadius: 8 }} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 28 }}>
            {meta.cover && <img src={api.imgProxy(meta.cover)} alt={meta.name} style={{ width: 180, borderRadius: 12, objectFit: "cover", aspectRatio: "2/3", flexShrink: 0 }} onError={(e) => { e.target.style.display = "none"; }} />}
            <div style={{ flex: 1, minWidth: 260 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: -0.5, marginBottom: 10 }}>{meta.name}</h2>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                {meta.rating && <span style={{ color: "var(--amber)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><Icon name="star" size={13} color="var(--amber)" style={{ fill: "var(--amber)" }} />{parseFloat(meta.rating).toFixed(1)}</span>}
                {meta.releaseDate && <span style={{ color: "var(--muted)", fontSize: 13 }}>{meta.releaseDate}</span>}
                {meta.genre && <span style={{ fontSize: 12, background: "var(--bg3)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: 99, color: "var(--muted)" }}>{meta.genre}</span>}
              </div>
              {meta.plot && <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.75, maxWidth: 560 }}>{meta.plot}</p>}
            </div>
          </div>
          {seasons.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {seasons.map((s) => (
                  <button key={s} onClick={() => setSelSeason(s)}
                    style={{ padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                      background: activeSeason === s ? "var(--teal)" : "transparent",
                      borderColor: activeSeason === s ? "var(--teal)" : "var(--border)",
                      color: activeSeason === s ? "#000" : "var(--muted)" }}>
                    Season {s}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {episodes.map((ep) => (
                  <button key={ep.id} onClick={() => setPage("watch", ep.id, { kind: "series", ext: ep.container_extension || "mp4", backPage: "seriesDetail", backId: id, item: { kind: "series", id: ep.id, name: ep.title || `Episode ${ep.episode_num}`, icon: meta.cover, seriesId: id, seriesName: meta.name } })}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "var(--r)", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,192,0.3)"; e.currentTarget.style.background = "var(--bg2)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg1)"; }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--teal-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="play" size={16} color="var(--teal)" style={{ fill: "var(--teal)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Ep {ep.episode_num}: {ep.title || `Episode ${ep.episode_num}`}</div>
                      {ep.plot && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.plot}</div>}
                    </div>
                    {ep.duration && <span style={{ fontSize: 12, color: "var(--faint)", flexShrink: 0 }}>{ep.duration}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
