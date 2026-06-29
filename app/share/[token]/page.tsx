import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const user = await prisma.user.findUnique({
    where: { shareToken: token },
    include: {
      goals: {
        where: { archived: false },
        include: { tasks: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
      records: {
        take: 30,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { goal: true },
      },
    },
  });

  if (!user) notFound();

  const goals = user.goals;
  const records = user.records;

  type RecordWithGoal = (typeof records)[0];
  const grouped: { [key: string]: RecordWithGoal[] } = {};
  records.forEach((r: RecordWithGoal) => {
    const d = r.date instanceof Date
      ? r.date.toISOString().split("T")[0]
      : String(r.date).split("T")[0];
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(r);
  });

  return (
    <div className="min-h-screen pb-12" style={{ background: "#f2f2f2" }}>
      <div className="px-6 pt-14 pb-4">
        <div
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 text-white"
          style={{ background: "#0a0a0a" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#4ade80", animation: "pulse 2s infinite" }}
          />
          Read Only
        </div>
        <h1 className="text-4xl font-bold">Progress</h1>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>Shared dashboard</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Goals */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#6b6b6b" }}>
            Goals
          </p>

          {goals.length === 0 && (
            <div className="rounded-2xl p-6 text-center text-sm" style={{ background: "#fff", color: "#6b6b6b" }}>
              No goals yet
            </div>
          )}

          {goals.map((goal) => {
            const done = goal.tasks.filter((t) => t.completed).length;
            const total = goal.tasks.length;
            const pct = total > 0 ? (done / total) * 100 : 0;

            return (
              <div key={goal.id} className="rounded-2xl p-5 mb-3" style={{ background: "#fff" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div>
                    <h2 className="font-bold text-base">{goal.title}</h2>
                    {goal.description && (
                      <p className="text-xs" style={{ color: "#6b6b6b" }}>{goal.description}</p>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: "#6b6b6b" }}>
                    <span>{done}/{total} tasks</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#f2f2f2" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "#0a0a0a" }}
                    />
                  </div>
                </div>

                {goal.tasks.length > 0 && (
                  <div className="space-y-1.5">
                    {goal.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{
                            background: task.completed ? "#0a0a0a" : "transparent",
                            borderColor: task.completed ? "#0a0a0a" : "#d0d0d0",
                          }}
                        >
                          {task.completed && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span
                          className="text-xs"
                          style={{ color: task.completed ? "#aaa" : "#0a0a0a", textDecoration: task.completed ? "line-through" : "none" }}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recent activity */}
        {records.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#6b6b6b" }}>
              Recent Activity
            </p>
            {Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 7)
              .map(([date, recs]) => (
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
        )}
      </div>
    </div>
  );
}
