"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Goal {
  id: string;
  title: string;
  emoji: string;
}

interface Record {
  id: string;
  description: string;
  date: string;
  createdAt: string;
  goal: Goal | null;
  task: { id: string; title: string } | null;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function toDateStr(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [records, setRecords] = useState<Record[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((d) => setGoals(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/records?date=${toDateStr(selectedDate)}`)
      .then((r) => r.json())
      .then((d) => {
        setRecords(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [selectedDate]);

  const isToday = toDateStr(selectedDate) === toDateStr(new Date());

  async function addRecord() {
    if (!description.trim()) return;
    setSaving(true);
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        goalId: selectedGoalId,
        date: toDateStr(selectedDate),
      }),
    });
    if (res.ok) {
      const record = await res.json();
      setRecords((prev) => [record, ...prev]);
      setDescription("");
      setSelectedGoalId(null);
      setShowAdd(false);
    }
    setSaving(false);
  }

  async function deleteRecord(id: string) {
    await fetch(`/api/records/${id}`, { method: "DELETE" });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "#f2f2f2" }}>
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-4xl font-bold mb-5">Daily Log</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:text-white"
            style={{ background: "#fff" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0a"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = ""; }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="font-semibold text-lg">{isToday ? "Today" : formatDate(selectedDate)}</p>
            {!isToday && (
              <p className="text-xs" style={{ color: "#6b6b6b" }}>{selectedDate.getFullYear()}</p>
            )}
          </div>
          <button
            onClick={() => !isToday && setSelectedDate((d) => addDays(d, 1))}
            disabled={isToday}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: "#fff" }}
            onMouseEnter={(e) => { if (!isToday) { (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0a"; (e.currentTarget as HTMLButtonElement).style.color = "white"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = ""; }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading && <div className="text-center py-12" style={{ color: "#6b6b6b" }}>Loading...</div>}

        {!loading && records.length === 0 && !showAdd && (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📝</p>
            <p className="text-lg" style={{ color: "#6b6b6b" }}>
              No entries {isToday ? "today" : "on this day"}
            </p>
            <p className="text-sm mt-1" style={{ color: "#aaa" }}>What did you work on?</p>
          </div>
        )}

        {records.map((record) => (
          <div key={record.id} className="rounded-2xl p-4 group" style={{ background: "#fff" }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {record.goal && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm">{record.goal.emoji}</span>
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#6b6b6b" }}
                    >
                      {record.goal.title}
                    </span>
                  </div>
                )}
                <p className="font-medium text-sm leading-relaxed">{record.description}</p>
                <p className="text-xs mt-2" style={{ color: "#aaa" }}>
                  {new Date(record.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => deleteRecord(record.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ml-2 flex-shrink-0 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Inline add form */}
        {showAdd && (
          <div className="rounded-2xl p-4" style={{ background: "#fff" }}>
            <textarea
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-sm outline-none resize-none"
              autoFocus
            />

            {goals.length > 0 && (
              <div className="mt-3 mb-3">
                <p className="text-xs font-medium mb-2" style={{ color: "#6b6b6b" }}>
                  Link to goal (optional)
                </p>
                <div className="flex gap-2 flex-wrap">
                  {goals.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGoalId(selectedGoalId === g.id ? null : g.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: selectedGoalId === g.id ? "#0a0a0a" : "#f2f2f2",
                        color: selectedGoalId === g.id ? "#fff" : "#6b6b6b",
                      }}
                    >
                      <span>{g.emoji}</span>
                      <span>{g.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={addRecord}
                disabled={!description.trim() || saving}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: "#0a0a0a" }}
              >
                {saving ? "Saving..." : "Log it"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setDescription(""); setSelectedGoalId(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "#f2f2f2" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed right-6 bottom-28 w-14 h-14 text-white rounded-full flex items-center justify-center z-40 transition-transform active:scale-95"
          style={{ background: "#0a0a0a", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
        >
          <Plus size={24} />
        </button>
      )}

      <Navigation active="daily" />
    </div>
  );
}
