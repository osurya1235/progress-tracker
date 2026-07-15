"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, CalendarDays, X } from "lucide-react";
import Navigation from "@/components/Navigation";

interface LabNote {
  id: string;
  date: string;
  content: string;
  createdAt: string;
}

function toDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LabPage() {
  const [notes, setNotes] = useState<LabNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState("");
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [saving, setSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/lab-notes")
      .then((r) => r.json())
      .then((d) => {
        setNotes(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  function openAddForm() {
    setContent("");
    setSelectedDate(toDateStr(new Date()));
    setShowAdd(true);
  }

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

  async function saveNote() {
    if (!content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/lab-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, date: selectedDate }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setShowAdd(false);
      setContent("");
    }
    setSaving(false);
  }

  async function deleteNote(id: string) {
    await fetch(`/api/lab-notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "#f2f2f2" }}>
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-4xl font-bold">Lab Notes</h1>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>
          Paste anything — code, ideas, references
        </p>
      </div>

      <div className="px-4 space-y-3">
        {showAdd && (
          <div className="rounded-2xl p-4" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={openDatePicker}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
                style={{ background: "#f2f2f2" }}
              >
                <CalendarDays size={14} />
                {formatDate(selectedDate)}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg"
                style={{ color: "#6b6b6b" }}
              >
                <X size={16} />
              </button>
            </div>

            <input
              ref={dateInputRef}
              type="date"
              className="sr-only"
              value={selectedDate}
              onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
            />

            <textarea
              placeholder="Paste your notes, code, references..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              autoFocus
              className="w-full text-sm outline-none resize-none"
              style={{ fontFamily: "monospace" }}
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={saveNote}
                disabled={!content.trim() || saving}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: "#0a0a0a" }}
              >
                {saving ? "Saving..." : "Save note"}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "#f2f2f2" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-12" style={{ color: "#6b6b6b" }}>Loading...</div>}

        {!loading && notes.length === 0 && !showAdd && (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🔬</p>
            <p className="text-lg" style={{ color: "#6b6b6b" }}>No notes yet</p>
            <p className="text-sm mt-1" style={{ color: "#aaa" }}>Paste code, ideas, or anything you want to save</p>
          </div>
        )}

        {notes.map((note) => (
          <div key={note.id} className="rounded-2xl p-4 group" style={{ background: "#fff" }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#6b6b6b" }}>
                {formatDate(note.date.split("T")[0])}
              </span>
              <button
                onClick={() => deleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ml-2 flex-shrink-0 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <pre
              className="text-sm whitespace-pre-wrap break-words leading-relaxed"
              style={{ fontFamily: "monospace" }}
            >
              {note.content}
            </pre>
          </div>
        ))}
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

      <Navigation active="lab" />
    </div>
  );
}
