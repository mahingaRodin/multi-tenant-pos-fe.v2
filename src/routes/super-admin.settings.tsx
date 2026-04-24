import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/super-admin/settings")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <SettingsPage />
    </AppShell>
  ),
});

const NAV_ITEMS = [
  { id: "general",  label: "General",           icon: "tune" },
  { id: "security", label: "Security",           icon: "security" },
  { id: "api",      label: "API & Integrations", icon: "api" },
  { id: "cache",    label: "Cache Management",   icon: "cached" },
];

function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [systemName, setSystemName] = useState("POSify Enterprise");
  const [timezone, setTimezone] = useState("EST");
  const [clearingCache, setClearingCache] = useState(false);

  const handleClearCache = async () => {
    if (!confirm("This will clear all Redis caches. Continue?")) return;
    setClearingCache(true);
    try {
      await api.delete("/api/admin/cache/clear/all");
      toast.success("All caches cleared successfully.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] p-8 font-sans">
      {/* Page Header */}
      <div className="flex items-end justify-between pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            System Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage global configuration, security, and administrative access.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.info("No pending changes to discard.")}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm hover:bg-slate-50 transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={() => toast.success("Configuration saved.")}
            className="px-4 py-2 bg-[#14B8A6] hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left: Navigation + System Health */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-6">
          {/* Nav */}
          <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-[#14B8A6]/10 text-[#14B8A6] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span
                  className="text-[20px] leading-none"
                  style={{ fontFamily: "'Material Symbols Outlined', sans-serif", fontVariationSettings: "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>

          {/* System Health */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700">API Status</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700">Last Backup</span>
                <span className="text-xs font-mono text-slate-400">2h ago</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700">Redis Cache</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content Panel */}
        <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
          {/* General Section */}
          {activeSection === "general" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-6">General Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    System Name
                  </label>
                  <input
                    type="text"
                    value={systemName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSystemName(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6]"
                  />
                  <p className="text-xs text-slate-400">Displayed in top navigation and emails.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Default Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimezone(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                    <option value="IST">IST (India Standard Time)</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5 mt-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Brand Logo
                  </label>
                  <div className="flex items-center gap-4 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <div className="w-16 h-16 bg-[#0F172A] rounded-lg flex items-center justify-center text-white text-xl font-bold shrink-0">
                      P
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          Change Logo
                        </button>
                        <button className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">Recommended size: 256×256px (PNG or SVG).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === "security" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-6">Security Configuration</h3>
              <div className="space-y-4 max-w-2xl">
                {[
                  { label: "Two-Factor Authentication", desc: "Require 2FA for all admin accounts", enabled: true },
                  { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
                  { label: "IP Allowlist", desc: "Restrict admin access to specific IP ranges", enabled: false },
                  { label: "Audit Logging", desc: "Log all administrative actions", enabled: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${item.enabled ? "bg-[#14B8A6]" : "bg-slate-200"}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.enabled ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Section */}
          {activeSection === "api" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-6">API &amp; Integrations</h3>
              <div className="space-y-4 max-w-2xl">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Base API URL</p>
                  <code className="text-sm font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded block">
                    {window.location.origin}/api
                  </code>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">API Version</p>
                  <span className="text-sm font-mono text-slate-700">v1.0.0</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">OpenAPI Documentation</p>
                    <p className="text-xs text-slate-400 mt-0.5">Swagger UI for all endpoints</p>
                  </div>
                  <a
                    href="/swagger-ui.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#14B8A6] font-medium hover:underline"
                  >
                    Open Docs →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Cache Management Section */}
          {activeSection === "cache" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-6">Cache Management</h3>
              <div className="space-y-4 max-w-2xl">
                <div className="p-4 border border-slate-200 rounded-lg flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <span className="text-amber-500 text-xl">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Clear All Redis Caches</p>
                    <p className="text-xs text-slate-400 mt-0.5 mb-4">
                      Clears all cached data including store data, sessions, and query results. Use this if you notice stale data across the platform.
                    </p>
                    <button
                      onClick={handleClearCache}
                      disabled={clearingCache}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                    >
                      {clearingCache ? "Clearing..." : "Clear All Caches"}
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-800">⚠️ Warning</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Clearing caches will temporarily slow down the system as data is reloaded from the database. Only do this during low-traffic periods.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
