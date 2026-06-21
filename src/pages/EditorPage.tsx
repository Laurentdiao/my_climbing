import { useState, useEffect, useCallback } from "react";
import type { ClimbingLog, Session, Entry, Gym, Profile } from "../features/climbing/domain/types";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getGymById } from "../features/climbing/adapters/staticDataRepository";
import { getSessionEntriesTotal } from "../features/climbing/domain/stats";
import { ALL_GRADES } from "../features/climbing/domain/grade";

const LS_TOKEN_KEY = "climbing-gh-token";
const LS_CHANGES_KEY = "climbing-local-changes";

interface LocalChanges {
  profile: Profile | null;
  added: Session[];
  edited: Session[];
  deleted: string[];
}

function loadChanges(): LocalChanges {
  try {
    const raw = localStorage.getItem(LS_CHANGES_KEY);
    if (!raw) return { profile: null, added: [], edited: [], deleted: [] };
    const parsed = JSON.parse(raw);
    return {
      profile: parsed.profile || null,
      added: parsed.added || [],
      edited: parsed.edited || [],
      deleted: parsed.deleted || [],
    };
  } catch {
    return { profile: null, added: [], edited: [], deleted: [] };
  }
}

function saveChanges(changes: LocalChanges) {
  localStorage.setItem(LS_CHANGES_KEY, JSON.stringify(changes));
}

function loadToken(): string {
  return localStorage.getItem(LS_TOKEN_KEY) || "";
}

function saveToken(token: string) {
  localStorage.setItem(LS_TOKEN_KEY, token);
}

export function EditorPage() {
  const [data, setData] = useState<ClimbingLog | null>(null);
  const [changes, setChanges] = useState<LocalChanges>(loadChanges);
  const [token, setToken] = useState(loadToken);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editing, setEditing] = useState<Session | null>(null);

  useEffect(() => {
    loadClimbingLog().then(setData);
  }, []);

  const updateChanges = useCallback((next: LocalChanges) => {
    setChanges(next);
    saveChanges(next);
  }, []);

  const handleSave = useCallback(
    (session: Session, isNew: boolean) => {
      if (isNew) {
        const updated = { ...changes, added: [session, ...changes.added] };
        updateChanges(updated);
      } else {
        const updated = {
          ...changes,
          edited: changes.edited.filter((s) => s.id !== session.id).concat(session),
        };
        updateChanges(updated);
      }
      setEditing(null);
      setMessage({ type: "ok", text: "已保存到本地" });
    },
    [changes, updateChanges],
  );

  const handleDelete = useCallback(
    (session: Session) => {
      const isNew = changes.added.some((s) => s.id === session.id);
      if (isNew) {
        updateChanges({ ...changes, added: changes.added.filter((s) => s.id !== session.id) });
      } else {
        updateChanges({
          ...changes,
          edited: changes.edited.filter((s) => s.id !== session.id),
          deleted: changes.deleted.includes(session.id)
            ? changes.deleted
            : [...changes.deleted, session.id],
        });
      }
    },
    [changes, updateChanges],
  );

  const handleEdit = useCallback((session: Session) => {
    setEditing(session);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const discardChanges = useCallback(() => {
    updateChanges({ profile: null, added: [], edited: [], deleted: [] });
    setMessage({ type: "ok", text: "所有本地修改已撤销" });
  }, [updateChanges]);

  const changedCount =
    (changes.profile ? 1 : 0) +
    changes.added.length + changes.edited.length + changes.deleted.length;

  const updateProfile = useCallback(
    (profile: Profile) => {
      updateChanges({ ...changes, profile });
    },
    [changes, updateChanges],
  );

  const publish = useCallback(async () => {
    if (!data) return;
    if (!token) {
      setMessage({ type: "err", text: "请先设置 GitHub Token" });
      return;
    }
    setPublishing(true);
    setMessage(null);

    try {
      const deletedIds = new Set(changes.deleted);
      const editedIds = new Set(changes.edited.map((s) => s.id));
      const baseSessions = data.sessions.filter(
        (s) => !deletedIds.has(s.id) && !editedIds.has(s.id),
      );

      const merged: ClimbingLog = {
        ...data,
        profile: changes.profile || data.profile,
        sessions: [...changes.added, ...changes.edited, ...baseSessions],
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
        message: `data: ${changes.added.length} added, ${changes.edited.length} edited, ${changes.deleted.length} deleted`,
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

      updateChanges({ profile: null, added: [], edited: [], deleted: [] });
      setMessage({ type: "ok", text: "发布成功！1-2 分钟后刷新公开页面可见。" });

      loadClimbingLog().then(setData);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "未知错误";
      setMessage({ type: "err", text: `发布失败: ${errMsg}` });
    } finally {
      setPublishing(false);
    }
  }, [data, changes, token, updateChanges]);

  const isDeleted = (id: string) => changes.deleted.includes(id);

  const allSessions = buildSessionList(data?.sessions || [], changes);

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="text-lg font-bold text-stone-100">编辑记录</h1>
        <p className="mt-1 text-xs text-stone-500">
          增删改全部在本地完成，修改完点"发布"一次性同步到 GitHub。
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
          Fine-grained token：权限 <strong>Contents: Read and write</strong>，仓库 Laurentdiao/my_climbing。
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

      <ProfileEditor
        profile={changes.profile || data?.profile || null}
        onSave={updateProfile}
        isDirty={!!changes.profile}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {editing ? (
          <button
            onClick={() => setEditing(null)}
            className="rounded-lg border border-stone-700 px-3 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            取消编辑
          </button>
        ) : (
          <button
            onClick={() =>
              handleEdit({
                id: `new-${Date.now()}`,
                climbedAt: todayStr(),
                gymId: data?.gyms[0]?.id || "",
                timeOfDay: "evening",
                notes: "",
                entries: [],
              })
            }
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-lime-400 transition-colors"
          >
            + 新建记录
          </button>
        )}
        {changedCount > 0 && (
          <>
            <span className="text-xs text-stone-500">
              {changes.profile && "~个人信息 "}
              {changes.added.length > 0 && `+${changes.added.length}新增 `}
              {changes.edited.length > 0 && `~${changes.edited.length}修改 `}
              {changes.deleted.length > 0 && `-${changes.deleted.length}删除 `}
            </span>
            <button
              onClick={discardChanges}
              className="rounded-lg px-2 py-1 text-xs text-stone-500 hover:text-red-400 transition-colors"
            >
              撤销全部
            </button>
          </>
        )}
      </div>

      {editing && (
        <SessionEditorForm
          gyms={data?.gyms || []}
          initial={editing.entries.length > 0 ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {changedCount > 0 && (
        <button
          onClick={publish}
          disabled={publishing || !token}
          className="w-full rounded-lg bg-lime-500 px-4 py-3 text-sm font-bold text-stone-950 hover:bg-lime-400 disabled:opacity-50 transition-colors"
        >
          {publishing ? "发布中..." : "发布修改到 GitHub"}
        </button>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-300">
          全部记录 ({allSessions.length})
        </h3>
        <div className="space-y-2">
          {allSessions.map((session) => {
            const isLocalNew = changes.added.some((s) => s.id === session.id);
            const isLocalEdit = changes.edited.some((s) => s.id === session.id);
            const isLocalDel = isDeleted(session.id);
            const isLocal = isLocalNew || isLocalEdit || isLocalDel;

            return (
              <div
                key={session.id}
                className={`rounded-lg border p-3 transition-all ${
                  isLocalDel ? "border-red-900 bg-red-950/20 opacity-50 line-through" :
                  isLocal ? "border-lime-800 bg-lime-950/20" :
                  "border-stone-800 bg-stone-900/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1" onClick={() => handleEdit(session)}>
                    <p className="text-sm font-medium text-stone-200">
                      {data && getGymById(data, session.gymId)?.name || session.gymId}
                      {isLocalNew && <span className="ml-1 text-xs text-lime-400">[新增]</span>}
                      {isLocalEdit && <span className="ml-1 text-xs text-amber-400">[已修改]</span>}
                      {isLocalDel && <span className="ml-1 text-xs text-red-400">[待删除]</span>}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {session.climbedAt}
                      {session.timeOfDay && ` · ${session.timeOfDay}`}
                      {" · "}{session.entries.length} 组 · {getSessionEntriesTotal(session.entries)} 条线
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button
                      onClick={() => handleEdit(session)}
                      className="rounded px-2 py-1 text-xs text-stone-400 hover:text-lime-400 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(session)}
                      className="rounded px-2 py-1 text-xs text-stone-400 hover:text-red-400 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildSessionList(
  published: Session[],
  changes: LocalChanges,
): Session[] {
  const deletedIds = new Set(changes.deleted);
  const editedIds = new Set(changes.edited.map((s) => s.id));
  let sessions = published.filter(
    (s) => !deletedIds.has(s.id) && !editedIds.has(s.id),
  );

  sessions = [...changes.edited, ...sessions, ...changes.added];

  const seen = new Set<string>();
  sessions = sessions.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  sessions.sort(
    (a, b) => new Date(b.climbedAt).getTime() - new Date(a.climbedAt).getTime(),
  );

  return sessions;
}

function SessionEditorForm({
  gyms,
  initial,
  onSave,
  onCancel,
}: {
  gyms: Gym[];
  initial: Session | null;
  onSave: (session: Session, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const isNew = !initial || initial.entries.length === 0;
  const [gymId, setGymId] = useState(initial?.gymId || gyms[0]?.id || "");
  const [climbedAt, setClimbedAt] = useState(initial?.climbedAt || todayStr());
  const [timeOfDay, setTimeOfDay] = useState(initial?.timeOfDay || "evening");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [entries, setEntries] = useState<Entry[]>(
    initial?.entries?.length ? initial.entries : [emptyEntry()],
  );
  const [gradeInputMode, setGradeInputMode] = useState<"select" | "custom">("select");

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
    const id = isNew
      ? `${climbedAt}-${gymId}-local-${Date.now()}`
      : initial!.id;
    const session: Session = {
      id,
      climbedAt,
      gymId,
      timeOfDay,
      notes,
      entries,
    };
    onSave(session, isNew);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-lime-800 bg-stone-900/60 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-lime-400">
        {isNew ? "新建训练记录" : "编辑训练记录"}
      </h3>

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

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">时间段</label>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 focus:border-lime-400 focus:outline-none"
          >
            <option value="morning">上午</option>
            <option value="afternoon">下午</option>
            <option value="evening">晚上</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-stone-500 mb-1">备注 (可选)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="训练感受..."
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

              <div className="mb-2">
                <select
                  value={entry.discipline}
                  onChange={(e) => {
                    const d = e.target.value as "bouldering" | "lead";
                    updateEntry(i, "discipline", d);
                    const defaults: Record<string, { label: string; rank: number }> = {
                      bouldering: { label: "V3", rank: 30 },
                      lead: { label: "5.9", rank: 900 },
                    };
                    updateEntry(i, "gradeLabel", defaults[d].label);
                    updateEntry(i, "gradeRank", defaults[d].rank);
                  }}
                  className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 focus:border-lime-400 focus:outline-none"
                >
                  <option value="bouldering">抱石</option>
                  <option value="lead">难度</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setGradeInputMode("select")}
                  className={`text-xs px-2 py-0.5 rounded ${gradeInputMode === "select" ? "bg-lime-400/20 text-lime-400" : "text-stone-500"}`}
                >
                  预设
                </button>
                <button
                  type="button"
                  onClick={() => setGradeInputMode("custom")}
                  className={`text-xs px-2 py-0.5 rounded ${gradeInputMode === "custom" ? "bg-lime-400/20 text-lime-400" : "text-stone-500"}`}
                >
                  自定义
                </button>
              </div>

              {gradeInputMode === "select" ? (
                <select
                  value={entry.gradeLabel}
                  onChange={(e) => {
                    const label = e.target.value;
                    const found = ALL_GRADES.find((g) => g.label === label);
                    updateEntry(i, "gradeLabel", label);
                    updateEntry(i, "gradeRank", found?.rank || 0);
                  }}
                  className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 focus:border-lime-400 focus:outline-none"
                >
                  {(() => {
                    const gradeOptions = entry.discipline === "bouldering"
                      ? ALL_GRADES.filter((g) => g.label.startsWith("V"))
                      : ALL_GRADES.filter((g) => g.label.startsWith("5."));
                    return gradeOptions.map((g) => (
                      <option key={g.label} value={g.label}>{g.label}</option>
                    ));
                  })()}
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={entry.gradeLabel}
                    onChange={(e) => updateEntry(i, "gradeLabel", e.target.value)}
                    placeholder="如 V4, 5.10a"
                    className="flex-1 rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={entry.gradeRank}
                    onChange={(e) => updateEntry(i, "gradeRank", parseInt(e.target.value) || 0)}
                    placeholder="排序值"
                    className="w-20 rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
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

function ProfileEditor({
  profile,
  onSave,
  isDirty,
}: {
  profile: Profile | null;
  onSave: (p: Profile) => void;
  isDirty: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [siteTitle, setSiteTitle] = useState(profile?.siteTitle || "");
  const [bio, setBio] = useState(profile?.bio || "");

  function handleSave() {
    onSave({
      displayName: displayName || profile?.displayName || "Climber",
      siteTitle: siteTitle || profile?.siteTitle || "攀岩记录",
      bio,
      homeGym: profile?.homeGym || "",
    });
    setOpen(false);
  }

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-300">
          个人信息 {isDirty && <span className="text-xs text-amber-400">[已修改]</span>}
        </p>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-lime-400 hover:text-lime-300"
        >
          {open ? "收起" : "编辑"}
        </button>
      </div>
      {open && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">名字</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="你的名字"
              className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">网站标题</label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="如：攀岩记录"
              className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">自我介绍</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="简短介绍..."
              className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-lime-400 transition-colors"
          >
            保存个人信息
          </button>
        </div>
      )}
    </div>
  );
}
