import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { fetchAccount } from "../lib/api";
import { getProfile, saveProfile } from "../lib/storage";
import { User, Server, Shield, Info, Save, Calendar, Wifi } from "lucide-react";

export default function Settings() {
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(getProfile());
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchAccount().then(setAccount).catch(() => setAccount(null)); }, []);

  const onSave = () => { saveProfile(profile); setSaved(true); setTimeout(() => setSaved(false), 1500); };

  const exp = account?.user_info?.exp_date ? new Date(parseInt(account.user_info.exp_date, 10) * 1000).toLocaleDateString() : "—";

  return (
    <Layout title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        <Card icon={User} title="Profile">
          <label className="text-sm text-zinc-400">Display name</label>
          <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-md h-10 px-3 text-white outline-none focus:border-teal-500/60" />
          <button onClick={onSave} className="mt-4 flex items-center gap-2 px-5 h-10 bg-teal-400 hover:bg-teal-300 text-black font-medium rounded-lg">
            <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save"}
          </button>
        </Card>

        <Card icon={Server} title="Playlist">
          <Row label="Provider" value={account?.user_info?.message || "—"} />
          <Row label="Username" value={account?.user_info?.username || "—"} />
          <Row label="Status" value={<span className="text-emerald-400">{account?.user_info?.status || "—"}</span>} />
          <Row label="Server" value={account?.server_info?.url || "—"} />
        </Card>

        <Card icon={Calendar} title="Subscription">
          <Row label="Expires" value={exp} />
          <Row label="Trial" value={account?.user_info?.is_trial === "1" ? "Yes" : "No"} />
          <Row label="Active connections" value={`${account?.user_info?.active_cons || 0} / ${account?.user_info?.max_connections || 1}`} />
          <Row label="Output formats" value={(account?.user_info?.allowed_output_formats || []).join(", ")} />
        </Card>

        <Card icon={Wifi} title="Playback">
          <p className="text-sm text-zinc-400 leading-relaxed">Live TV streams use MPEG-TS via mpegts.js. Movies and series stream directly from your provider through a secure proxy to bypass CORS restrictions.</p>
        </Card>

        <Card icon={Shield} title="Privacy" className="lg:col-span-2">
          <p className="text-sm text-zinc-400">Favorites, profile and watch history are stored locally in your browser. No tracking, no external analytics.</p>
        </Card>

        <Card icon={Info} title="About" className="lg:col-span-2">
          <p className="text-sm text-zinc-400">OTT Navigator Web — a modern web client for Xtream Codes IPTV playlists. Built to match the feel of the popular Android player.</p>
        </Card>
      </div>
    </Layout>
  );
}

function Card({ icon: Icon, title, children, className = "" }) {
  return (
    <div className={`bg-[#0f141a] border border-white/5 rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-teal-400" />
        </div>
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
