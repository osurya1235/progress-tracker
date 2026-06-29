"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Check, Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  tasks: Task[];
}

export default function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [flashTask, setFlashTask] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/goals/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) router.push("/");
        else setGoal(data);
        setLoading(false);
      });
  }, [id, router]);

  async function addTask() {
    if (!newTask.trim() || addingTask) return;
    setAddingTask(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: id, title: newTask }),
    });
    if (res.ok) {
      const task = await res.json();
      setGoal((prev) => prev ? { ...prev, tasks: [...prev.tasks, task] } : prev);
      setNewTask("");
      setShowAddTask(false);
    }
    setAddingTask(false);
  }

  async function toggleTask(taskId: string, completed: boolean) {
    setGoal((prev) =>
      prev ? { ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)) } : prev
    );
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    if (res.ok && completed) {
      setFlashTask(taskId);
      setTimeout(() => setFlashTask(null), 2500);
    }
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setGoal((prev) => prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) } : prev);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f2f2f2" }}>
        <p style={{ color: "#6b6b6b" }}>Loading...</p>
      </div>
    );
  }

  if (!goal) return null;

  const pending = goal.tasks.filter((t) => !t.completed);
  const completed = goal.tasks.filter((t) => t.completed);
  const pct = goal.tasks.length > 0 ? Math.round((completed.length / goal.tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen pb-28" style={{ background: "#f2f2f2" }}>
      <div className="px-6 pt-14 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 mb-6 -ml-1 transition-colors"
          style={{ color: "#6b6b6b" }}
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Goals</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-4xl">{goal.emoji}</span>
          <div>
            <h1 className="text-3xl font-bold">{goal.title}</h1>
            {goal.description && (
              <p className="text-sm mt-0.5" style={{ color: "#6b6b6b" }}>{goal.description}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2" style={{ color: "#6b6b6b" }}>
            <span>{completed.length}/{goal.tasks.length} completed</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "#e5e5e5" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "#0a0a0a" }}
            />
          </div>
        </div>
      </div>

      <div className="px-4">
        {goal.tasks.length === 0 && !showAddTask && (
          <div className="text-center py-12" style={{ color: "#6b6b6b" }}>
            <p className="text-4xl mb-3">📋</p>
            <p>No tasks yet — add one below</p>
          </div>
        )}

        {/* Pending tasks */}
        {pending.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl p-4 mb-2 flex items-center gap-3 transition-colors group"
            style={{ background: flashTask === task.id ? "#f0fdf4" : "#fff" }}
          >
            <button
              onClick={() => toggleTask(task.id, true)}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all hover:text-white"
              style={{ borderColor: "#0a0a0a" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
            />
            <span className="flex-1 font-medium">{task.title}</span>
            {flashTask === task.id && (
              <span className="text-xs font-medium" style={{ color: "#16a34a" }}>✓ Added to log</span>
            )}
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* Add task */}
        {showAddTask ? (
          <div className="rounded-2xl p-4 mb-2" style={{ background: "#fff" }}>
            <input
              type="text"
              placeholder="Task name"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
                if (e.key === "Escape") setShowAddTask(false);
              }}
              className="w-full text-base outline-none"
              style={{ color: "#0a0a0a" }}
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={addTask}
                disabled={!newTask.trim() || addingTask}
                className="flex-1 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: "#0a0a0a" }}
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddTask(false); setNewTask(""); }}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ background: "#f2f2f2" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddTask(true)}
            className="w-full py-3.5 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 transition-colors mb-4 hover:border-[#0a0a0a] hover:text-[#0a0a0a]"
            style={{ borderColor: "#e5e5e5", color: "#6b6b6b" }}
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Add task</span>
          </button>
        )}

        {/* Completed tasks */}
        {completed.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: "#6b6b6b" }}>
              Completed
            </p>
            {completed.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl p-4 mb-2 flex items-center gap-3 group"
                style={{ background: "rgba(255,255,255,0.6)" }}
              >
                <button
                  onClick={() => toggleTask(task.id, false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0a0a0a" }}
                >
                  <Check size={12} color="white" />
                </button>
                <span className="flex-1 line-through" style={{ color: "#6b6b6b" }}>{task.title}</span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navigation active="goals" />
    </div>
  );
}
