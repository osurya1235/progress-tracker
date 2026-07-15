"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  tasks: Task[];
  _count: { records: number };
  createdAt: string;
}

const EMOJIS = ["🎯", "💪", "📚", "🏃", "🎨", "💻", "🌱", "✨", "🔥", "⭐"];

export default function HomePage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎯");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("pt_goals");
      if (cached) { setGoals(JSON.parse(cached)); setLoading(false); }
    } catch {}
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGoals(data);
          localStorage.setItem("pt_goals", JSON.stringify(data));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function createGoal() {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, emoji: newEmoji, description: newDesc }),
    });
    if (res.ok) {
      const goal = await res.json();
      setGoals((prev) => {
        const updated = [goal, ...prev];
        localStorage.setItem("pt_goals", JSON.stringify(updated));
        return updated;
      });
      setShowAdd(false);
      setNewTitle("");
      setNewEmoji("🎯");
      setNewDesc("");
    }
    setSaving(false);
  }

  async function deleteGoal(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this goal and all its tasks?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      localStorage.setItem("pt_goals", JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "#f2f2f2" }}>
      <div className="px-6 pt-14 pb-4">
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#6b6b6b" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-4xl font-bold mt-1">Goals</h1>
      </div>

      <div className="px-4 space-y-3">
        {loading && (
          <div className="text-center py-16" style={{ color: "#6b6b6b" }}>Loading...</div>
        )}

        {!loading && goals.length === 0 && !showAdd && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎯</p>
            <p className="text-lg" style={{ color: "#6b6b6b" }}>No goals yet</p>
            <p className="text-sm mt-1" style={{ color: "#aaa" }}>Tap + to add your first goal</p>
          </div>
        )}

        {goals.map((goal) => {
          const done = goal.tasks.filter((t) => t.completed).length;
          const total = goal.tasks.length;
          const pct = total > 0 ? (done / total) * 100 : 0;

          return (
            <div
              key={goal.id}
              className="rounded-2xl p-5 cursor-pointer transition-transform active:scale-[0.98] group"
              style={{ background: "#fff" }}
              onClick={() => router.push(`/goals/${goal.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg truncate">{goal.title}</h2>
                    {goal.description && (
                      <p className="text-sm truncate mt-0.5" style={{ color: "#6b6b6b" }}>
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={(e) => deleteGoal(e, goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={18} style={{ color: "#6b6b6b" }} />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "#6b6b6b" }}>
                  <span>{total > 0 ? `${done}/${total} tasks` : "No tasks yet"}</span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "#f2f2f2" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: "#0a0a0a" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Sheet */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full rounded-t-3xl p-6 pb-12"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: "#e5e5e5" }} />
            <h2 className="text-xl font-bold mb-5">New Goal</h2>

            <div className="flex gap-2 flex-wrap mb-4">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    newEmoji === e ? "scale-110" : ""
                  }`}
                  style={{ background: newEmoji === e ? "#0a0a0a" : "#f2f2f2" }}
                >
                  {e}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Goal title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGoal()}
              className="w-full px-4 py-3 rounded-xl text-base outline-none font-medium mb-3"
              style={{ background: "#f2f2f2" }}
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none mb-5"
              style={{ background: "#f2f2f2" }}
            />

            <button
              onClick={createGoal}
              disabled={!newTitle.trim() || saving}
              className="w-full py-3.5 text-white rounded-xl font-semibold text-base disabled:opacity-40 transition-transform active:scale-[0.98]"
              style={{ background: "#0a0a0a" }}
            >
              {saving ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed right-6 bottom-28 w-14 h-14 text-white rounded-full flex items-center justify-center z-40 transition-transform active:scale-95"
        style={{ background: "#0a0a0a", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
      >
        <Plus size={24} />
      </button>

      <Navigation active="goals" />
    </div>
  );
}
