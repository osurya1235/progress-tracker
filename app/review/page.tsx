"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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

interface LogRecord {
  id: string;
  description: string;
  date: string;
  goal: Goal | null;
  task: { id: string; title: string } | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ReviewPage() {
  const router = useRouter();
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Record<string, { goalId: string | null; taskId: string | null }>>({});
  const [saving, setSaving] = useState<string | null>(null);

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

    fetch("/api/records/untagged")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRecords(d);
        setLoading(false);
      });
  }, []);

  function setGoalFor(id: string, goalId: string | null) {
    setSelection((prev) => ({ ...prev, [id]: { goalId, taskId: null } }));
  }

  function setTaskFor(id: string, taskId: string | null) {
    setSelection((prev) => ({ ...prev, [id]: { goalId: prev[id]?.goalId ?? null, taskId } }));
  }

  async function saveTag(id: string) {
    const sel = selection[id];
    if (!sel?.goalId) return;
    setSaving(id);
    const res = await fetch(`/api/records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: sel.goalId, taskId: sel.taskId }),
    });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
    setSaving(null);
  }

  function skip(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "#f2f2f2" }}>
      <div className="px-6 pt-14 pb-6">
        <button
          onClick={() => router.push("/daily")}
          className="flex items-center gap-1.5 mb-6 -ml-1 transition-colors"
          style={{ color: "#6b6b6b" }}
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Daily Log</span>
        </button>

        <h1 className="text-3xl font-bold">Tag entries</h1>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>
          {loading ? "Loading..." : `${records.length} entries without a goal`}
        </p>
      </div>

      <div className="px-4 space-y-3">
        {!loading && records.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-lg" style={{ color: "#6b6b6b" }}>All caught up</p>
            <p className="text-sm mt-1" style={{ color: "#aaa" }}>Every entry has a goal</p>
          </div>
        )}

        {records.map((record) => {
          const sel = selection[record.id] ?? { goalId: null, taskId: null };
          const goal = goals.find((g) => g.id === sel.goalId) ?? null;
          const pendingTasks = goal?.tasks.filter((t) => !t.completed) ?? [];

          return (
            <div key={record.id} className="rounded-2xl p-4" style={{ background: "#fff" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#6b6b6b" }}>
                {formatDate(record.date)}
              </p>
              <p className="font-medium text-sm leading-relaxed mb-3">{record.description}</p>

              <div className="flex gap-2 flex-wrap mb-2">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoalFor(record.id, sel.goalId === g.id ? null : g.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: sel.goalId === g.id ? "#0a0a0a" : "#f2f2f2",
                      color: sel.goalId === g.id ? "#fff" : "#6b6b6b",
                    }}
                  >
                    <span>{g.emoji}</span>
                    <span>{g.title}</span>
                  </button>
                ))}
              </div>

              {pendingTasks.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {pendingTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTaskFor(record.id, sel.taskId === t.id ? null : t.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: sel.taskId === t.id ? "#0a0a0a" : "#f2f2f2",
                        color: sel.taskId === t.id ? "#fff" : "#6b6b6b",
                      }}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => saveTag(record.id)}
                  disabled={!sel.goalId || saving === record.id}
                  className="flex-1 py-2 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                  style={{ background: "#0a0a0a" }}
                >
                  {saving === record.id ? "Saving..." : "Tag & next"}
                </button>
                <button
                  onClick={() => skip(record.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium"
                  style={{ background: "#f2f2f2", color: "#6b6b6b" }}
                >
                  Skip
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
