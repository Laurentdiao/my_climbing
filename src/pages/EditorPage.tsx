import { useState, useEffect, useCallback } from "react";
import type { ClimbingLog, Session, Entry, Gym } from "../features/climbing/domain/types";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getGymById } from "../features/climbing/adapters/staticDataRepository";
import { getSessionEntriesTotal } from "../features/climbing/domain/stats";

const LS_SESSIONS_KEY = "climbing-local-sessions";
const LS_TOKEN_KEY = "climbing-gh-token";

function loadLocalSessions(): Session[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: Session[]) {
  localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions));
}

function loadToken(): string {
  return localStorage.getItem(LS_TOKEN_KEY) || "";
}

function saveToken(token: string) {
  localStorage.setItem(LS_TOKEN_KEY, token);
}

export function EditorPage() {
  const [data, setData] = useState<ClimbingLog | null>(null);
  const [localSessions, setLocalSessions] = useState<Session[]>(loadLocalSessions);
  const [token, setToken] = useState(loadToken);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadClimbingLog().then(setData);
  }, []);

  const addSession = useCallback(
    (session: Session) => {
      const updated = [session, ...localSessions];
      setLocalSessions(updated);
      saveLocalSessions(updated);
      setShowForm(false);
      setMessage({ type: "ok", text: "已保存到本地 (localStorage)" });
    },
    [localSessions],
  );

  const deleteLocalSession = useCallback(
    (id: string) => {
      const updated = localSessions.filter((s) => s.id !== id);
      setLocalSessions(updated);
      saveLocalSessions(updated);
    },
    [localSessions],
  );

  const clearLocal = useCallback(() => {
    setLocalSessions([]);
    saveLocalSessions([]);
    setMessage({ type: "ok", text: "本地记录已清空" });
  }, []);

  const publish = useCallback(async () => {
    if (!data) return;
    if (!token) {
      setMessage({ type: "err", text: "请先设置 GitHub Token" });
      return;
    }
    setPublishing(true);
    setMessage(null);

    try {
      const merged: ClimbingLog = {
        ...data,
        sessions: [...localSessions, ...data.sessions],
      };
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(merged, null, 2))));

      const shaResp = await fetch(
        "https://api.github.com/repos/Laurentdiao/my_climbing/contents/src/data/climbing-log.json",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!shaResp.ok && shaResp.status !== 404) {
        throw new Error(`GitHub API: ${shaResp.status}`);
      }
      const shaData = await shaResp.json().catch(() => ({}));
      const sha = shaData.sha;

      const body: Record<string, string> = {
        message: "data: update climbing log from editor",
        content,
        branch: "main",
      };
      if (sha) body.sha = sha;

      const putResp = await fetch(
        "https://api.github.com/repos/Laurentdiao/my_climbing/contents/src/data/climbing-log.json",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!putResp.ok) {
        const err = await putResp.json().catch(() => ({}));
        throw new Error(err.message || `GitHub API: ${putResp.status}`);
      }

      setLocalSessions([]);
      saveLocalSessions([]);
      setMessage({ type: "ok", text: "发布成功！GitHub Actions 正在部署，1-2 分钟后可在公开页面看到新记录。" });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "未知错误";
      setMessage({ type: "err", text: `发布失败: ${errMsg}` });
    } finally {
      setPublishing(false);
    }
  }, [data, localSessions, token]);

  const allSessions = [...localSessions, ...(data?.sessions || [])].sort(
    (a, b) => new Date(b.climbedAt).getTime() - new Date(a.climbedAt).getTime(),
  );

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="text-lg font-bold text-stone-100">编辑记录</h1>
        <p className="mt-1 text-xs text-stone-500">
          在手机上填写训练记录，保存到本地，然后一键发布到 GitHub。
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border border-green-800 bg-green-950/50 text-green-300"
              : "border border-red-800 bg-red-950/50 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4 space-y-3">
        <p className="text-sm font-semibold text-stone-300">GitHub Token 设置</p>
        <p className="text-xs text-stone-500">
          需要 GitHub Personal Access Token 才能发布。在 GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens 创建一个，权限只选 <strong>Contents: Read and write</strong>，仓库选 Laurentdiao/my_climbing。
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            saveToken(e.target.value);
          }}
          placeholder="github_pat_..."
          className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-lime-400 transition-colors"
        >
          {showForm ? "关闭表单" : "+ 新建训练记录"}
        </button>
        {localSessions.length > 0 && (
          <>
            <span className="text-xs text-stone-500">
              {localSessions.length} 条本地记录待发布
            </span>
            <button
              onClick={clearLocal}
              className="rounded-lg px-2 py-1 text-xs text-stone-500 hover:text-red-400 transition-colors"
            >
              清空
            </button>
          </>
        )}
      </div>

      {showForm && (
        <SessionEditorForm
          gyms={data?.gyms || []}
          onSubmit={addSession}
          onCancel={() => setShowForm(false)}
        />
      )}

      {localSessions.length > 0 && (
        <button
          onClick={publish}
          disabled={publishing || !token}
          className="w-full rounded-lg bg-lime-500 px-4 py-3 text-sm font-bold text-stone-950 hover:bg-lime-400 disabled:opacity-50 transition-colors"
        >
          {publishing ? "发布中..." : `发布 ${localSessions.length} 条记录到 GitHub`}
        </button>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-300">
          全部记录 ({allSessions.length})
        </h3>
        <div className="space-y-2">
          {allSessions.map((session) => (
            <div
              key={session.id}
              className={`rounded-lg border p-3 ${
                localSessions.some((s) => s.id === session.id)
                  ? "border-lime-800 bg-lime-950/20"
                  : "border-stone-800 bg-stone-900/40"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-200">
                    {session.title || session.climbedAt}
                  </p>
                  <p className="text-xs text-stone-500">
                    {session.climbedAt}
                    {data && getGymById(data, session.gymId)
                      ? ` · ${getGymById(data, session.gymId)!.name}`
                      : ""}
                    {" · "}{session.entries.length} 组 · {getSessionEntriesTotal(session.entries)} 条线
                  </p>
                </div>
                {localSessions.some((s) => s.id === session.id) && (
                  <button
                    onClick={() => deleteLocalSession(session.id)}
                    className="text-xs text-stone-500 hover:text-red-400"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionEditorForm({
  gyms,
  onSubmit,
  onCancel,
}: {
  gyms: Gym[];
  onSubmit: (session: Session) => void;
  onCancel: () => void;
}) {
  const [gymId, setGymId] = useState(gyms[0]?.id || "");
  const [climbedAt, setClimbedAt] = useState(todayStr());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<Entry[]>([emptyEntry()]);

  function addEntry() {
    setEntries([...entries, emptyEntry()]);
  }

  function updateEntry(index: number, field: keyof Entry, value: string | number) {
    setEntries(
      entries.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  }

  function removeEntry(index: number) {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const session: Session = {
      id: `${climbedAt}-${gymId}-local-${Date.now()}`,
      climbedAt,
      gymId,
      discipline: "bouldering",
      title,
      notes,
      entries,
    };
    onSubmit(session);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-lime-800 bg-stone-900/60 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-lime-400">新建训练记录</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">日期</label>
          <input
            type="date"
            value={climbedAt}
            onChange={(e) => setClimbedAt(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 focus:border-lime-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">岩馆</label>
          <select
            value={gymId}
            onChange={(e) => setGymId(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 focus:border-lime-400 focus:outline-none"
          >
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-stone-500 mb-1">标题 (可选)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="如：周一晚训练"
          className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-stone-500 mb-1">备注 (可选)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="训练感受、注意点..."
          className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-stone-500">线路记录</label>
          <button
            type="button"
            onClick={addEntry}
            className="text-xs text-lime-400 hover:text-lime-300"
          >
            + 添加线路
          </button>
        </div>

        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={i} className="rounded-lg border border-stone-800 bg-stone-950 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500">线路 {i + 1}</span>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(i)}
                    className="text-xs text-stone-500 hover:text-red-400"
                  >
                    删除
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-stone-600 mb-0.5">难度</label>
                  <select
                    value={entry.gradeLabel}
                    onChange={(e) => {
                      const label = e.target.value;
                      const ranks: Record<string, number> = {
                        V0: 0, V1: 10, V2: 20, V3: 30, V4: 40, V5: 50, V6: 60, V7: 70, V8: 80, V9: 90, V10: 100,
                      };
                      updateEntry(i, "gradeLabel", label);
                      updateEntry(i, "gradeRank", ranks[label] || 0);
                    }}
                    className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 focus:border-lime-400 focus:outline-none"
                  >
                    {["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-0.5">结果</label>
                  <select
                    value={entry.result}
                    onChange={(e) => updateEntry(i, "result", e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 focus:border-lime-400 focus:outline-none"
                  >
                    <option value="flash">Flash</option>
                    <option value="sent">Sent</option>
                    <option value="repeat">Repeat</option>
                    <option value="attempted">尝试中</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-0.5">数量</label>
                  <input
                    type="number"
                    min={1}
                    value={entry.quantity}
                    onChange={(e) => updateEntry(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 focus:border-lime-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-stone-600 mb-0.5">尝试次数 (可选)</label>
                  <input
                    type="number"
                    min={0}
                    value={entry.attempts ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateEntry(i, "attempts", v === "" ? null as unknown as number : Math.max(0, parseInt(v) || 0));
                    }}
                    className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 focus:border-lime-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-0.5">备注 (可选)</label>
                  <input
                    type="text"
                    value={entry.notes}
                    onChange={(e) => updateEntry(i, "notes", e.target.value)}
                    placeholder="动作描述..."
                    className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-600 mb-0.5">视频链接 (可选)</label>
                <input
                  type="text"
                  value={entry.videoUrl}
                  onChange={(e) => updateEntry(i, "videoUrl", e.target.value)}
                  placeholder="小红书链接..."
                  className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-lime-500 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-lime-400 transition-colors"
        >
          保存到本地
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-stone-700 px-4 py-2.5 text-sm text-stone-400 hover:text-stone-200 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

function emptyEntry(): Entry {
  return {
    id: `local-entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    discipline: "bouldering",
    gradeLabel: "V3",
    gradeRank: 30,
    result: "sent",
    attempts: 1,
    quantity: 1,
    notes: "",
    videoUrl: "",
    videoPlatform: "xiaohongshu",
    videoTitle: "",
  };
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
