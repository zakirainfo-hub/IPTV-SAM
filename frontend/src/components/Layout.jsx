import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout({ title, children }) {
  return (
    <div className="min-h-screen bg-[#0a0e12] text-white">
      <Sidebar />
      <div className="pl-[72px]">
        <TopBar title={title} />
        <main className="px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
