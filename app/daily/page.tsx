"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, Tag } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  emoji: string;
  tasks: Task[];
}

interface Record {
  id: string;
  description: string;
  date: string;
  loggedAt: string | null;
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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nowTimeStr() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function displayTime(record: Record) {
  if (!record.loggedAt) return null;
  return new Date(record.loggedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [records, setRecords] = useState<Record[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [logTime, setLogTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("pt_goals");
      if (cached) setGoals(JSON.parse(cached));
    } catch {}
    fetch("/api/goals")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setGoals(d);
          localStorage.setItem("pt_goals", JSON.stringify(d));
        }
      });
  }, []);

  useEffect(() => {
    const dateKey = `pt_daily_${toDateStr(selectedDate)}`;
    let resolvedFromCache = false;
    try {
      const cached = localStorage.getItem(dateKey);
      if (cached) {
        setRecords(JSON.parse(cached));
        setLoading(false);
        resolvedFromCache = true;
      }
    } catch {}
    if (!resolvedFromCache) setLoading(true);
    fetch(`/api/records?date=${toDateStr(selectedDate)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setRecords(d);
          localStorage.setItem(dateKey, JSON.stringify(d));
        }
        setLoading(false);
      });
  }, [selectedDate]);

  const isToday = toDateStr(selectedDate) === toDateStr(new Date());

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;
  const pendingTasks = selectedGoal?.tasks.filter((t) => !t.completed) ?? [];

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;
    try {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
    } catch {
      input.focus();
      input.click();
    }
  }

  function openAddForm() {
    setLogTime("");
    setDescription("");
    setSelectedGoalId(null);
    setSelectedTaskId(null);
    setShowAdd(true);
  }

  async function addRecord() {
    if (!description.trim()) return;
    setSaving(true);

    let loggedAt: string | undefined;
    if (logTime) {
      const [y, mo, d] = toDateStr(selectedDate).split("-").map(Number);
      const [h, mi] = logTime.split(":").map(Number);
      loggedAt = new Date(y, mo - 1, d, h, mi, 0).toISOString();
    }

    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        goalId: selectedGoalId,
        taskId: selectedTaskId,
        date: toDateStr(selectedDate),
        loggedAt,
      }),
    });
    if (res.ok) {
      const record = await res.json();
      const dateKey = `pt_daily_${toDateStr(selectedDate)}`;
      setRecords((prev) => {
        const updated = [record, ...prev];
        localStorage.setItem(dateKey, JSON.stringify(updated));
        return updated;
      });
      setDescription("");
      setSelectedGoalId(null);
      setSelectedTaskId(null);
      setLogTime("");
      setShowAdd(false);
    }
    setSaving(false);
  }

  function openEdit(record: Record) {
    setEditingId(record.id);
    setEditGoalId(record.goal?.id ?? null);
    setEditTaskId(record.task?.id ?? null);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: editGoalId, taskId: editTaskId }),
    });
    if (res.ok) {
      const updated = await res.json();
      const dateKey = `pt_daily_${toDateStr(selectedDate)}`;
      setRecords((prev) => {
        const next = prev.map((r) => (r.id === id ? updated : r));
        localStorage.setItem(dateKey, JSON.stringify(next));
        return next;
      });
    }
    setEditingId(null);
  }

  async function deleteRecord(id: string) {
    await fetch(`/api/records/${id}`, { method: "DELETE" });
    const dateKey = `pt_daily_${toDateStr(selectedDate)}`;
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(dateKey, JSON.stringify(updated));
      return updated;
    });
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

          <button
            className="flex-1 text-center flex flex-col items-center gap-0.5 group"
            onClick={openDatePicker}
            title="Jump to date"
          >
            <p className="font-semibold text-lg leading-tight group-hover:underline">
              {isToday ? "Today" : formatDate(selectedDate)}
            </p>
            <span className="flex items-center gap-1 text-xs" style={{ color: "#aaa" }}>
              <CalendarDays size={11} />
              {selectedDate.getFullYear()}
            </span>
          </button>

          <input
            ref={dateInputRef}
            type="date"
            className="sr-only"
            max={toDateStr(new Date())}
            value={toDateStr(selectedDate)}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split("-").map(Number);
                setSelectedDate(new Date(y, m - 1, d));
              }
            }}
          />

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

        {records.map((record) => {
          const isEditing = editingId === record.id;
          const editGoal = goals.find((g) => g.id === editGoalId) ?? null;
          const editPendingTasks = editGoal?.tasks.filter((t) => !t.completed) ?? [];

          return (
            <div key={record.id} className="rounded-2xl p-4 group" style={{ background: "#fff" }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {(record.goal || record.task) && (
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      {record.goal && (
                        <>
                          <span className="text-sm">{record.goal.emoji}</span>
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b6b6b" }}>
                            {record.goal.title}
                          </span>
                        </>
                      )}
                      {record.task && (
                        <span className="text-xs" style={{ color: "#aaa" }}>
                          → {record.task.title}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="font-medium text-sm leading-relaxed">{record.description}</p>
                  {displayTime(record) && (
                    <p className="text-xs mt-2" style={{ color: "#aaa" }}>
                      {displayTime(record)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => (isEditing ? setEditingId(null) : openEdit(record))}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                    style={{ opacity: isEditing ? 1 : undefined, color: isEditing ? "#0a0a0a" : undefined }}
                  >
                    <Tag size={14} />
                  </button>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f2f2f2" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "#6b6b6b" }}>Goal</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {goals.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setEditGoalId(editGoalId === g.id ? null : g.id);
                          setEditTaskId(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: editGoalId === g.id ? "#0a0a0a" : "#f2f2f2",
                          color: editGoalId === g.id ? "#fff" : "#6b6b6b",
                        }}
                      >
                        <span>{g.emoji}</span>
                        <span>{g.title}</span>
                      </button>
                    ))}
                  </div>

                  {editPendingTasks.length > 0 && (
                    <>
                      <p className="text-xs font-medium mb-2" style={{ color: "#6b6b6b" }}>Task</p>
                      <div className="flex gap-2 flex-wrap mb-3">
                        {editPendingTasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setEditTaskId(editTaskId === t.id ? null : t.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={{
                              background: editTaskId === t.id ? "#0a0a0a" : "#f2f2f2",
                              color: editTaskId === t.id ? "#fff" : "#6b6b6b",
                            }}
                          >
                            {t.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(record.id)}
                      className="flex-1 py-2 text-white rounded-xl text-xs font-semibold"
                      style={{ background: "#0a0a0a" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium"
                      style={{ background: "#f2f2f2" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

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

            <div className="mt-3 mb-3 flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: "#6b6b6b" }}>Time (optional)</label>
              <input
                type="time"
                value={logTime}
                onChange={(e) => setLogTime(e.target.value)}
                className="text-sm px-2 py-1 rounded-lg outline-none"
                style={{ background: "#f2f2f2" }}
              />
            </div>

            {goals.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium mb-2" style={{ color: "#6b6b6b" }}>
                  Link to goal (optional)
                </p>
                <div className="flex gap-2 flex-wrap">
                  {goals.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        const next = selectedGoalId === g.id ? null : g.id;
                        setSelectedGoalId(next);
                        setSelectedTaskId(null);
                      }}
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

                {pendingTasks.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-2" style={{ color: "#6b6b6b" }}>
                      Link to task (optional)
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {pendingTasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTaskId(selectedTaskId === t.id ? null : t.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                          style={{
                            background: selectedTaskId === t.id ? "#0a0a0a" : "#f2f2f2",
                            color: selectedTaskId === t.id ? "#fff" : "#6b6b6b",
                          }}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                onClick={() => { setShowAdd(false); setDescription(""); setSelectedGoalId(null); setSelectedTaskId(null); setLogTime(""); }}
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
          onClick={openAddForm}
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
