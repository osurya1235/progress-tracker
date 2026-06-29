"use client";

import { useState, useEffect } from "react";
import { Download, Share2, Copy, Check } from "lucide-react";
import Navigation from "@/components/Navigation";

interface ActivityRecord {
  id: string;
  description: string;
  date: string;
  goal: { title: string; emoji: string } | null;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/share")
      .then((r) => r.json())
      .then((d) => setShareToken(d.shareToken ?? null));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/records?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setRecords(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  async function downloadExcel() {
    setDownloading(true);
    const res = await fetch(`/api/reports/excel?year=${year}&month=${month}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `progress-${year}-${String(month).padStart(2, "0")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  }

  function copyShareLink() {
    if (!shareToken) return;
    navigator.clipboard.writeText(`${origin}/share/${shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const grouped: { [key: string]: ActivityRecord[] } = {};
  records.forEach((r) => {
    const d = r.date.split("T")[0];
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(r);
  });

  return (
    <div className="min-h-screen pb-28" style={{ background: "#f2f2f2" }}>
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-4xl font-bold">Reports</h1>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>
          {records.length} entries in {monthLabel}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Month picker */}
        <div className="rounded-2xl p-4" style={{ background: "#fff" }}>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={{ background: "#f2f2f2" }}
            >
              ‹
            </button>
            <span className="font-semibold">{monthLabel}</span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={{ background: "#f2f2f2" }}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {MONTH_NAMES.map((m, i) => (
              <button
                key={i}
                onClick={() => setMonth(i + 1)}
                className="py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: month === i + 1 ? "#0a0a0a" : "#f2f2f2",
                  color: month === i + 1 ? "#fff" : "#6b6b6b",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={downloadExcel}
            disabled={downloading || records.length === 0}
            className="rounded-2xl p-4 flex flex-col items-start gap-2 text-white disabled:opacity-40 transition-transform active:scale-[0.98]"
            style={{ background: "#0a0a0a" }}
          >
            <Download size={20} />
            <span className="font-semibold text-sm">{downloading ? "Generating..." : "Download Excel"}</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Printable report</span>
          </button>

          <button
            onClick={copyShareLink}
            className="rounded-2xl p-4 flex flex-col items-start gap-2 transition-transform active:scale-[0.98]"
            style={{ background: "#fff" }}
          >
            {copied ? <Check size={20} style={{ color: "#16a34a" }} /> : <Share2 size={20} />}
            <span className="font-semibold text-sm">{copied ? "Copied!" : "Share Dashboard"}</span>
            <span className="text-xs" style={{ color: "#6b6b6b" }}>Read-only link</span>
          </button>
        </div>

        {/* Share link display */}
        {shareToken && (
          <div className="rounded-2xl p-4" style={{ background: "#fff" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b6b6b" }}>
              Your share link
            </p>
            <div className="flex items-center gap-2">
              <p
                className="text-xs flex-1 break-all px-3 py-2 rounded-xl"
                style={{ background: "#f2f2f2", fontFamily: "monospace" }}
              >
                {origin}/share/{shareToken}
              </p>
              <button
                onClick={copyShareLink}
                className="p-2 rounded-xl flex-shrink-0"
                style={{ background: "#f2f2f2" }}
              >
                {copied ? <Check size={16} style={{ color: "#16a34a" }} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Activity preview */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#6b6b6b" }}>
            {monthLabel} Activity
          </p>

          {loading && <div className="text-center py-8" style={{ color: "#6b6b6b" }}>Loading...</div>}

          {!loading && records.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📊</p>
              <p style={{ color: "#6b6b6b" }}>No entries in {monthLabel}</p>
            </div>
          )}

          {Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, recs]: [string, ActivityRecord[]]) => (
              <div key={date} className="mb-3">
                <p className="text-xs font-semibold px-1 mb-1.5" style={{ color: "#6b6b6b" }}>
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric",
                  })}
                </p>
                {recs.map((record) => (
                  <div key={record.id} className="rounded-xl px-4 py-3 mb-1.5" style={{ background: "#fff" }}>
                    <div className="flex items-center gap-2">
                      {record.goal && <span className="text-sm">{record.goal.emoji}</span>}
                      <p className="text-sm font-medium">{record.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      <Navigation active="reports" />
    </div>
  );
}
