import { useState, useEffect, useCallback } from "react";
import type { ClimbingLog, Session, Entry, Gym, User } from "../features/climbing/domain/types";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getGymById } from "../features/climbing/adapters/staticDataRepository";
import { getSessionEntriesTotal } from "../features/climbing/domain/stats";
import {
  ALL_GRADES,
  getDefaultGradeForDiscipline,
  getGradesForDiscipline,
} from "../features/climbing/domain/grade";
import { climbingLogSchema } from "../features/climbing/domain/validators";
import {
  createGymId,
  createUserId,
  ensureSafeGymIds,
  ensureSafeUserIds,
  normalizeLogGymIds,
  normalizeLogUserIds,
  remapSessionGymIds,
  remapSessionUserIds,
} from "../features/climbing/domain/ids";

const LS_CHANGES_KEY = "climbing-local-changes";
const LS_TOKEN_KEY = "climbing-gh-token";
const GH_REPO = "Laurentdiao/my_climbing";
const GH_FILE = "src/data/climbing-log.json";
const GH_API = `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`;

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

interface LocalChanges {
  siteTitle: string | null;
  gyms: Gym[];
  users: User[];
  editedUsers: User[];
  removedGyms: string[];
  removedUsers: string[];
  added: Session[];
  edited: Session[];
  deleted: string[];
}

function emptyChanges(): LocalChanges {
  return {
    siteTitle: null,
    gyms: [],
    users: [],
    editedUsers: [],
    removedGyms: [],
    removedUsers: [],
    added: [],
    edited: [],
    deleted: [],
  };
}

function loadChanges(): LocalChanges {
  try {
    const raw = localStorage.getItem(LS_CHANGES_KEY);
    if (!raw) return emptyChanges();
    const parsed = JSON.parse(raw);
    const changes = normalizeLocalChanges({
      siteTitle: parsed.siteTitle ?? null,
      gyms: parsed.gyms || [],
      users: parsed.users || [],
      editedUsers: parsed.editedUsers || [],
      removedGyms: parsed.removedGyms || [],
      removedUsers: parsed.removedUsers || [],
      added: parsed.added || [],
      edited: parsed.edited || [],
      deleted: parsed.deleted || [],
    });
    saveChanges(changes);
    return changes;
  } catch {
    return emptyChanges();
  }
}

function normalizeLocalChanges(changes: LocalChanges): LocalChanges {
  const { gyms, idMap: gymIdMap, changed: gymChanged } = ensureSafeGymIds(changes.gyms);
  const { users, idMap: userIdMap, changed: userChanged } = ensureSafeUserIds(changes.users);
  if (!gymChanged && !userChanged) return changes;

  const remap = (sessions: Session[]) =>
    remapSessionUserIds(remapSessionGymIds(sessions, gymIdMap), userIdMap);

  return {
    ...changes,
    gyms,
    users,
    added: remap(changes.added),
    edited: remap(changes.edited),
  };
}

function saveChanges(changes: LocalChanges) {
  localStorage.setItem(LS_CHANGES_KEY, JSON.stringify(changes));
}

function loadToken(): string {
  return localStorage.getItem(LS_TOKEN_KEY) || "";
}

function saveToken(token: string) {
  if (token) {
    localStorage.setItem(LS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(LS_TOKEN_KEY);
  }
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
    updateChanges(emptyChanges());
    setMessage({ type: "ok", text: "所有本地修改已撤销" });
  }, [updateChanges]);

  const changedCount =
    (changes.siteTitle !== null ? 1 : 0) +
    changes.gyms.length + changes.removedGyms.length +
    changes.users.length + changes.editedUsers.length + changes.removedUsers.length +
    changes.added.length + changes.edited.length + changes.deleted.length;

  const updateSiteTitle = useCallback(
    (siteTitle: string) => {
      updateChanges({ ...changes, siteTitle });
    },
    [changes, updateChanges],
  );

  const addGym = useCallback(
    (gym: Gym) => {
      updateChanges({ ...changes, gyms: [...changes.gyms, gym] });
    },
    [changes, updateChanges],
  );

  const removeGym = useCallback(
    (gymId: string) => {
      const isNew = changes.gyms.some((g) => g.id === gymId);
      if (isNew) {
        updateChanges({ ...changes, gyms: changes.gyms.filter((g) => g.id !== gymId) });
      } else {
        updateChanges({
          ...changes,
          removedGyms: changes.removedGyms.includes(gymId)
            ? changes.removedGyms
            : [...changes.removedGyms, gymId],
        });
      }
    },
    [changes, updateChanges],
  );

  const addUser = useCallback(
    (user: User) => {
      updateChanges({ ...changes, users: [...changes.users, user] });
    },
    [changes, updateChanges],
  );

  const removeUser = useCallback(
    (userId: string) => {
      const isNew = changes.users.some((u) => u.id === userId);
      if (isNew) {
        updateChanges({
          ...changes,
          users: changes.users.filter((u) => u.id !== userId),
          editedUsers: changes.editedUsers.filter((u) => u.id !== userId),
        });
      } else {
        updateChanges({
          ...changes,
          removedUsers: changes.removedUsers.includes(userId)
            ? changes.removedUsers
            : [...changes.removedUsers, userId],
          editedUsers: changes.editedUsers.filter((u) => u.id !== userId),
        });
      }
    },
    [changes, updateChanges],
  );

  const editUser = useCallback(
    (user: User) => {
      // 编辑已有用户（包括已发布的和本地新增的）：按 id 替换
      const isNew = changes.users.some((u) => u.id === user.id);
      if (isNew) {
        updateChanges({
          ...changes,
          users: changes.users.map((u) => (u.id === user.id ? user : u)),
        });
      } else {
        updateChanges({
          ...changes,
          editedUsers: [
            ...changes.editedUsers.filter((u) => u.id !== user.id),
            user,
          ],
        });
      }
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

      // 合并用户：已发布用户应用 editedUsers 覆盖，过滤掉已删除，再追加新增
      const editedUserMap = new Map(changes.editedUsers.map((u) => [u.id, u]));
      const mergedUsers: User[] = [
        ...data.users
          .filter((u) => !changes.removedUsers.includes(u.id))
          .map((u) => editedUserMap.get(u.id) || u),
        ...changes.users,
      ];

      const merged: ClimbingLog = normalizeLogUserIds(normalizeLogGymIds({
        ...data,
        siteTitle: changes.siteTitle ?? data.siteTitle,
        gyms: [
          ...data.gyms.filter((g) => !changes.removedGyms.includes(g.id)),
          ...changes.gyms,
        ],
        users: mergedUsers,
        sessions: [...changes.added, ...changes.edited, ...baseSessions],
      }));

      const validation = climbingLogSchema.safeParse(merged);
      if (!validation.success) {
        const issues = validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new Error("数据校验失败: " + issues);
      }

      const content = toBase64(JSON.stringify(merged, null, 2));

      const shaResp = await fetch(GH_API,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!shaResp.ok) {
        if (shaResp.status === 401 || shaResp.status === 403) {
          throw new Error("Token 无效或无权限，请重新生成");
        }
        if (shaResp.status !== 404) {
          throw new Error(`GitHub 请求失败 (${shaResp.status})`);
        }
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
        GH_API,
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
        if (putResp.status === 409) {
          throw new Error("文件冲突，请先刷新页面再试");
        }
        throw new Error(err.message || `提交失败 (${putResp.status})`);
      }

      updateChanges(emptyChanges());
      setMessage({ type: "ok", text: "发布成功！1-2 分钟后刷新公开页面可见。" });

      loadClimbingLog().then(setData);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "未知错误";
      console.error("Publish failed:", errMsg);
      setMessage({ type: "err", text: `发布失败: ${errMsg}` });
    } finally {
      setPublishing(false);
    }
  }, [data, changes, token, updateChanges]);

  const isDeleted = (id: string) => changes.deleted.includes(id);

  const allSessions = buildSessionList(data?.sessions || [], changes);
  // 合并后的全量用户列表（供下拉和名称显示使用）
  const allUsers: User[] = (() => {
    const editedMap = new Map(changes.editedUsers.map((u) => [u.id, u]));
    return [
      ...(data?.users || []).map((u) => editedMap.get(u.id) || u),
      ...changes.users,
    ].filter((u) => !changes.removedUsers.includes(u.id));
  })();

  const getUserName = (userId: string) =>
    allUsers.find((u) => u.id === userId)?.name || userId;

  const allGyms = [
    ...(data?.gyms || []),
    ...changes.gyms,
  ].filter((g) => !changes.removedGyms.includes(g.id));

  return (
    <div className="space-y-5 py-3">
      <div className="rounded-2xl border border-stone-800/90 bg-stone-900/55 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
        <h1 className="text-xl font-bold text-stone-100">编辑记录</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
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

      <div className="rounded-2xl border border-stone-800 bg-stone-900/65 p-4 space-y-3 shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-300">GitHub Token 设置</p>
            {token && (
              <p className="mt-1 text-xs text-lime-300">
                已保存在当前浏览器
              </p>
            )}
          </div>
          {token && (
            <button
              type="button"
              onClick={() => {
                setToken("");
                saveToken("");
                setMessage({ type: "ok", text: "已清除本机保存的 GitHub Token" });
              }}
              className="shrink-0 rounded-lg border border-stone-700 px-2.5 py-1.5 text-xs text-stone-400 hover:border-red-800 hover:text-red-300"
            >
              清除
            </button>
          )}
        </div>
        <p className="text-xs leading-relaxed text-stone-500">
          Fine-grained token：权限 <strong>Contents: Read and write</strong>，仓库 Laurentdiao/my_climbing。Token 会保存在当前手机/浏览器的 localStorage，方便下次直接发布；不要在公用设备上使用。
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            saveToken(e.target.value);
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder="github_pat_..."
          className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={async () => {
              if (!token) return;
              try {
                const resp = await fetch("https://api.github.com/user", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (resp.ok) {
                  setMessage({ type: "ok", text: "Token 有效 ✓" });
                } else {
                  setMessage({ type: "err", text: `Token 验证失败 (${resp.status})` });
                }
              } catch {
                setMessage({ type: "err", text: "网络错误，无法连接 GitHub" });
              }
            }}
            disabled={!token}
            className="rounded-lg border border-stone-700 px-3 py-1 text-xs text-stone-400 hover:text-stone-200 disabled:opacity-50 transition-colors"
          >
            测试 Token
          </button>
        </div>
      </div>

      <SiteTitleEditor
        siteTitle={changes.siteTitle ?? data?.siteTitle ?? ""}
        onSave={updateSiteTitle}
        isDirty={changes.siteTitle !== null}
      />

      <GymManager
        gyms={data?.gyms || []}
        addedGyms={changes.gyms}
        removedGymIds={changes.removedGyms}
        onAdd={addGym}
        onRemove={removeGym}
      />

      <UserManager
        users={data?.users || []}
        addedUsers={changes.users}
        editedUsers={changes.editedUsers}
        removedUserIds={changes.removedUsers}
        gyms={allGyms}
        onAdd={addUser}
        onRemove={removeUser}
        onEdit={editUser}
      />

      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <button
            onClick={() => setEditing(null)}
            className="rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-400 hover:border-stone-600 hover:text-stone-200"
          >
            取消编辑
          </button>
        ) : (
          <button
            onClick={() =>
              handleEdit({
                id: `new-${Date.now()}`,
                climbedAt: todayStr(),
                gymId: allGyms[0]?.id || "",
                userId: allUsers[0]?.id || "",
                timeOfDay: "evening",
                notes: "",
                entries: [],
              })
            }
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-lime-400 transition-colors"
          >
            新建记录
          </button>
        )}
        {changedCount > 0 && (
          <>
            <span className="text-xs text-stone-500">
              {changes.siteTitle !== null && "~网站标题 "}
              {changes.gyms.length > 0 && `+${changes.gyms.length}岩馆 `}
              {changes.removedGyms.length > 0 && `-${changes.removedGyms.length}岩馆 `}
              {changes.users.length > 0 && `+${changes.users.length}攀爬者 `}
              {changes.editedUsers.length > 0 && `~${changes.editedUsers.length}攀爬者 `}
              {changes.removedUsers.length > 0 && `-${changes.removedUsers.length}攀爬者 `}
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
          gyms={allGyms}
          users={allUsers}
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
                      {` · ${getUserName(session.userId)}`}
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
  users,
  initial,
  onSave,
  onCancel,
}: {
  gyms: Gym[];
  users: User[];
  initial: Session | null;
  onSave: (session: Session, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const isNew = !initial || initial.entries.length === 0;
  const [userId, setUserId] = useState(initial?.userId || users[0]?.id || "");
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

  function updateEntry(index: number, patch: Partial<Entry>) {
    setEntries(
      (current) => current.map((e, i) => (i === index ? { ...e, ...patch } : e)),
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
      userId,
      timeOfDay,
      notes,
      entries,
    };
    onSave(session, isNew);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-lime-800 bg-stone-900/60 p-4 space-y-4 overflow-hidden">
      <div>
        <h3 className="text-base font-semibold text-lime-300">
          {isNew ? "新建训练记录" : "编辑训练记录"}
        </h3>
        <p className="mt-1 text-xs text-stone-500">先记日期和岩馆，再补线路、数量和外部视频链接。</p>
      </div>

      <div className="min-w-0">
        <label className="block text-xs text-stone-500 mb-1">日期</label>
        <input
          type="date"
          value={climbedAt}
          onChange={(e) => setClimbedAt(e.target.value)}
          className="block w-full min-w-0 max-w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-left text-sm text-stone-200 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="block text-xs text-stone-500 mb-1">攀爬者</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-200 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="block text-xs text-stone-500 mb-1">岩馆</label>
          <select
            value={gymId}
            onChange={(e) => setGymId(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-200 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
          >
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="block text-xs text-stone-500 mb-1">时间段</label>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-200 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
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
          className="w-full min-w-0 rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
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
            <div key={i} className="rounded-xl border border-stone-800 bg-stone-950/90 p-3 space-y-3">
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
                    const defaultGrade = getDefaultGradeForDiscipline(d);
                    updateEntry(i, {
                      discipline: d,
                      gradeLabel: defaultGrade.label,
                      gradeRank: defaultGrade.rank,
                    });
                  }}
                  className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-2 text-sm text-stone-200 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                >
                  <option value="bouldering">抱石</option>
                  <option value="lead">难度</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mb-1 rounded-lg bg-stone-900/70 p-1">
                <button
                  type="button"
                  onClick={() => setGradeInputMode("select")}
                  className={`rounded-md px-2.5 py-1 text-xs ${gradeInputMode === "select" ? "bg-lime-400 text-stone-950" : "text-stone-500 hover:text-stone-300"}`}
                >
                  预设
                </button>
                <button
                  type="button"
                  onClick={() => setGradeInputMode("custom")}
                  className={`rounded-md px-2.5 py-1 text-xs ${gradeInputMode === "custom" ? "bg-lime-400 text-stone-950" : "text-stone-500 hover:text-stone-300"}`}
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
                    updateEntry(i, {
                      gradeLabel: label,
                      gradeRank: found?.rank || 0,
                    });
                  }}
                  className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-2 text-sm text-stone-200 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                >
                  {(() => {
                    const gradeOptions = getGradesForDiscipline(entry.discipline);
                    return gradeOptions.map((g) => (
                      <option key={g.label} value={g.label}>{g.label}</option>
                    ));
                  })()}
                </select>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
                  <input
                    type="text"
                    value={entry.gradeLabel}
                    onChange={(e) => updateEntry(i, { gradeLabel: e.target.value })}
                    placeholder="如 V4, 5.10a"
                    className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                  />
                  <input
                    type="number"
                    value={entry.gradeRank}
                    onChange={(e) => updateEntry(i, { gradeRank: parseInt(e.target.value, 10) || 0 })}
                    placeholder="排序值"
                    className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <div className="min-w-0">
                  <label className="block text-xs text-stone-600 mb-0.5">数量</label>
                  <input
                    type="number"
                    min={1}
                    value={entry.quantity}
                    onChange={(e) => updateEntry(i, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-2 text-sm text-stone-200 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs text-stone-600 mb-0.5">备注 (可选)</label>
                  <input
                    type="text"
                    value={entry.notes}
                    onChange={(e) => updateEntry(i, { notes: e.target.value })}
                    placeholder="动作描述..."
                    className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-600 mb-0.5">视频链接 (可选)</label>
                <input
                  type="text"
                  value={entry.videoUrl}
                  onChange={(e) => updateEntry(i, { videoUrl: e.target.value })}
                  placeholder="小红书链接..."
                  className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <button
          type="submit"
          className="rounded-xl bg-lime-500 px-4 py-3 text-sm font-semibold text-stone-950 hover:bg-lime-400"
        >
          保存到本地
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-400 hover:border-stone-600 hover:text-stone-200"
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

function SiteTitleEditor({
  siteTitle,
  onSave,
  isDirty,
}: {
  siteTitle: string;
  onSave: (title: string) => void;
  isDirty: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(siteTitle);

  function handleSave() {
    onSave(title.trim() || siteTitle || "攀岩记录");
    setOpen(false);
  }

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/65 p-4 space-y-3 shadow-[0_18px_55px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-300">
          网站标题 {isDirty && <span className="text-xs text-amber-400">[已修改]</span>}
        </p>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-lime-400 hover:text-lime-300"
        >
          {open ? "收起" : "编辑"}
        </button>
      </div>
      {!open && (
        <p className="text-sm text-stone-400">{siteTitle}</p>
      )}
      {open && (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-stone-500">
            这是显示在顶部导航栏的网站标题，所有攀爬者共用，不属于任何个人。
          </p>
          <div>
            <label className="block text-xs text-stone-500 mb-1">网站标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：攀岩记录"
              className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-lime-400 transition-colors"
          >
            保存网站标题
          </button>
        </div>
      )}
    </div>
  );
}

function GymManager({
  gyms,
  addedGyms,
  removedGymIds,
  onAdd,
  onRemove,
}: {
  gyms: Gym[];
  addedGyms: Gym[];
  removedGymIds: string[];
  onAdd: (gym: Gym) => void;
  onRemove: (gymId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [color, setColor] = useState("#84cc16");

  const COLORS = ["#84cc16", "#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

  const allGyms = [...gyms, ...addedGyms].filter(
    (g) => !removedGymIds.includes(g.id),
  );

  function handleAdd() {
    if (!name.trim()) return;
    const id = createGymId(name, { existingIds: allGyms.map((g) => g.id) });
    onAdd({ id, name: name.trim(), city: city.trim(), color });
    setName("");
    setCity("");
    setColor("#84cc16");
  }

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-300">
          岩馆管理 {(addedGyms.length > 0 || removedGymIds.length > 0) && <span className="text-xs text-amber-400">[已修改]</span>}
        </p>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-lime-400 hover:text-lime-300"
        >
          {open ? "收起" : "管理"}
        </button>
      </div>

      {!open && (
        <div className="flex flex-wrap gap-1.5">
          {allGyms.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1 rounded-full border border-stone-700 px-2.5 py-1 text-xs text-stone-300"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: g.color }}
              />
              {g.name}
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="space-y-3">
          <div className="space-y-2">
            {allGyms.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-950 px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2 text-xs text-stone-300">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="truncate">{g.name}</span>
                  {g.city && <span className="text-stone-500">· {g.city}</span>}
                  {addedGyms.some((a) => a.id === g.id) && (
                    <span className="shrink-0 text-lime-400">[新增]</span>
                  )}
                </span>
                <button
                  onClick={() => onRemove(g.id)}
                  className="text-xs text-stone-500 hover:text-red-400"
                >
                  删除
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="block text-xs text-stone-500 mb-0.5">岩馆名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如 Beta Boulders"
                className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-stone-500 mb-0.5">城市</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="如 上海"
                className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">颜色</label>
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!name.trim()}
            className="rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-lime-400 disabled:opacity-50"
          >
            添加岩馆
          </button>
        </div>
      )}
    </div>
  );
}

function UserManager({
  users,
  addedUsers,
  editedUsers,
  removedUserIds,
  gyms,
  onAdd,
  onRemove,
  onEdit,
}: {
  users: User[];
  addedUsers: User[];
  editedUsers: User[];
  removedUserIds: string[];
  gyms: Gym[];
  onAdd: (user: User) => void;
  onRemove: (userId: string) => void;
  onEdit: (user: User) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editHomeGym, setEditHomeGym] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");

  const COLORS = ["#3b82f6", "#84cc16", "#f97316", "#8b5cf6", "#ec4899", "#14b8a6"];

  const editedMap = new Map(editedUsers.map((u) => [u.id, u]));
  const allUsers: User[] = [
    ...users.map((u) => editedMap.get(u.id) || u),
    ...addedUsers,
  ].filter((u) => !removedUserIds.includes(u.id));

  function handleAdd() {
    if (!name.trim()) return;
    const id = createUserId(name, { existingIds: allUsers.map((u) => u.id) });
    onAdd({ id, name: name.trim(), bio: "", homeGym: "", color });
    setName("");
    setColor("#3b82f6");
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditBio(u.bio || "");
    setEditHomeGym(u.homeGym || "");
    setEditColor(u.color || "#3b82f6");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditBio("");
    setEditHomeGym("");
    setEditColor("#3b82f6");
  }

  function saveEdit(u: User) {
    if (!editName.trim()) return;
    onEdit({
      ...u,
      name: editName.trim(),
      bio: editBio,
      homeGym: editHomeGym,
      color: editColor,
    });
    cancelEdit();
  }

  const isEdited = (id: string) => editedUsers.some((u) => u.id === id);

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-300">
          攀爬者管理 {(addedUsers.length > 0 || editedUsers.length > 0 || removedUserIds.length > 0) && <span className="text-xs text-amber-400">[已修改]</span>}
        </p>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-lime-400 hover:text-lime-300"
        >
          {open ? "收起" : "管理"}
        </button>
      </div>

      {!open && (
        <div className="flex flex-wrap gap-1.5">
          {allUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 rounded-full border border-stone-700 px-2.5 py-1 text-xs text-stone-300"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: u.color }}
              />
              {u.name}
              {isEdited(u.id) && <span className="text-amber-400">~</span>}
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="space-y-3">
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-2.5 space-y-2"
              >
                {editingId === u.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: editColor }}
                      />
                      <span className="text-xs text-stone-500 truncate">编辑 {u.name}</span>
                      {addedUsers.some((a) => a.id === u.id) && (
                        <span className="shrink-0 text-lime-400">[新增]</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-0.5">昵称</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="攀爬者昵称（支持中文）"
                        className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-0.5">自我介绍</label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={2}
                        placeholder="简短介绍..."
                        className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-0.5">常去岩馆</label>
                      <select
                        value={editHomeGym}
                        onChange={(e) => setEditHomeGym(e.target.value)}
                        className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-2 text-sm text-stone-200 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
                      >
                        <option value="">不指定</option>
                        {gyms.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">颜色</label>
                      <div className="flex gap-1.5">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className={`h-6 w-6 rounded-full border-2 transition-all ${editColor === c ? "border-white scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(u)}
                        disabled={!editName.trim()}
                        className="rounded-lg bg-lime-500 px-3 py-1.5 text-xs font-semibold text-stone-950 hover:bg-lime-400 disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-xs text-stone-300">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: u.color }}
                      />
                      <span className="truncate">{u.name}</span>
                      {u.homeGym && (
                        <span className="text-stone-500">
                          · {gyms.find((g) => g.id === u.homeGym)?.name || u.homeGym}
                        </span>
                      )}
                      {addedUsers.some((a) => a.id === u.id) && (
                        <span className="shrink-0 text-lime-400">[新增]</span>
                      )}
                      {isEdited(u.id) && (
                        <span className="shrink-0 text-amber-400">[已修改]</span>
                      )}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(u)}
                        className="text-xs text-stone-500 hover:text-lime-400"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => onRemove(u.id)}
                        className="text-xs text-stone-500 hover:text-red-400"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-stone-800 pt-3 space-y-2">
            <p className="text-xs text-stone-500">添加新攀爬者</p>
            <div className="min-w-0">
              <label className="block text-xs text-stone-500 mb-0.5">攀爬者名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="支持中文名，如 小王"
                className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">颜色</label>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!name.trim()}
              className="rounded-xl bg-lime-500 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-lime-400 disabled:opacity-50"
            >
              添加攀爬者
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
