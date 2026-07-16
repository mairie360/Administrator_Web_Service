"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  KeyRound,
  Layers3,
  LoaderCircle,
  MonitorSmartphone,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import {
  administrationApi,
  type AdministrationGroup,
  type AdministrationGroupMember,
  type AdministrationRole,
  type AdministrationSession,
  type AdministrationUser,
  type AdministrationUsersPage,
} from "@/lib/administration-api";
import { BffRequestError } from "@/lib/bff-client";

type TabId = "users" | "roles" | "groups" | "sessions";
type RoleWriteMode = "create" | "replace" | "update";

const inputClassName =
  "h-11 w-full rounded-lg border border-[#d8d5cf] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#98a2b3] focus:border-[#3c7773] focus:ring-2 focus:ring-[#3c7773]/15 disabled:cursor-not-allowed disabled:bg-[#f2f1ee]";
const textareaClassName = `${inputClassName} min-h-24 resize-y py-3`;

const tabs: Array<{
  id: TabId;
  label: string;
  icon: typeof UserCog;
}> = [
  { id: "users", label: "Utilisateurs", icon: UserCog },
  { id: "roles", label: "Rôles", icon: ShieldCheck },
  { id: "groups", label: "Groupes", icon: UsersRound },
  { id: "sessions", label: "Sessions", icon: MonitorSmartphone },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function errorMessage(error: unknown) {
  if (error instanceof BffRequestError && error.status === 401) {
    return "Authentification requise. Reconnectez-vous au portail Mairie360.";
  }

  if (error instanceof BffRequestError && error.status === 403) {
    return "Votre compte ne possède pas les droits d’administration nécessaires.";
  }

  return error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="block text-sm font-semibold text-[#344054]">{label}</span>
      {children}
      {hint && <span className="block text-xs text-[#667085]">{hint}</span>}
    </label>
  );
}

function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-[#dedbd5] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-[#ebe8e3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#172033]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-5 text-[#667085]">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ActionButton({
  variant = "primary",
  busy = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "dangerSolid" | "ghost";
  busy?: boolean;
}) {
  const variants = {
    primary: "border-[#315f5c] bg-[#315f5c] text-white hover:bg-[#274d4a]",
    secondary: "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f8f7f5]",
    danger: "border-[#f0b6b2] bg-white text-[#b42318] hover:bg-[#fff4f2]",
    dangerSolid: "border-[#b42318] bg-[#b42318] text-white hover:bg-[#912018]",
    ghost: "border-transparent bg-transparent text-[#475467] hover:bg-[#f2f1ee]",
  };

  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#3c7773]/25 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || busy}
      {...props}
    >
      {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[#d8d5cf] bg-[#faf9f7] px-5 py-10 text-center text-sm text-[#667085]">
      {children}
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "security";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onCancel, open]);

  if (!open) return null;

  const ConfirmationIcon = tone === "security" ? KeyRound : Trash2;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#101828]/55 backdrop-blur-[2px]"
        aria-label="Fermer la confirmation"
        disabled={busy}
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        className="relative w-full max-w-md rounded-2xl border border-[#dedbd5] bg-white p-6 shadow-2xl"
      >
        <div
          className={
            "grid h-11 w-11 place-items-center rounded-xl " +
            (tone === "security"
              ? "bg-[#edf7f6] text-[#315f5c]"
              : "bg-[#fef3f2] text-[#b42318]")
          }
        >
          <ConfirmationIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="confirmation-dialog-title" className="mt-4 text-xl font-bold text-[#172033]">
          {title}
        </h2>
        <p id="confirmation-dialog-description" className="mt-2 text-sm leading-6 text-[#667085]">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ActionButton
            variant="secondary"
            className="sm:min-w-28"
            disabled={busy}
            autoFocus
            onClick={onCancel}
          >
            Annuler
          </ActionButton>
          <ActionButton
            variant={tone === "security" ? "primary" : "dangerSolid"}
            className="sm:min-w-36"
            busy={busy}
            onClick={onConfirm}
          >
            {!busy && <ConfirmationIcon className="h-4 w-4" aria-hidden="true" />}
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function SessionTable({ sessions }: { sessions: AdministrationSession[] }) {
  if (sessions.length === 0) {
    return <EmptyState>Aucune session retournée par le BFF.</EmptyState>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#e4e1dc]">
      <table className="min-w-[760px] w-full text-left text-sm">
        <thead className="bg-[#f8f7f5] text-xs font-semibold uppercase tracking-wide text-[#667085]">
          <tr>
            <th className="px-4 py-3">Appareil</th>
            <th className="px-4 py-3">Adresse IP</th>
            <th className="px-4 py-3">Créée le</th>
            <th className="px-4 py-3">Expiration</th>
            <th className="px-4 py-3">État</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ebe8e3]">
          {sessions.map((session) => (
            <tr key={session.id} className="bg-white">
              <td className="px-4 py-3.5">
                <div className="font-semibold text-[#344054]">{session.device_info}</div>
                <div className="mt-0.5 font-mono text-xs text-[#98a2b3]">
                  {session.id}
                </div>
              </td>
              <td className="px-4 py-3.5 text-[#475467]">{session.ip_address}</td>
              <td className="px-4 py-3.5 text-[#475467]">{formatDate(session.created_at)}</td>
              <td className="px-4 py-3.5 text-[#475467]">{formatDate(session.expires_at)}</td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    session.revoked_at
                      ? "bg-[#fef3f2] text-[#b42318]"
                      : "bg-[#ecfdf3] text-[#027a48]"
                  }`}
                >
                  {session.revoked_at ? "Révoquée" : "Active"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdministrationConsole() {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [usersTotal, setUsersTotal] = useState<number | null>(null);
  const [roles, setRoles] = useState<AdministrationRole[]>([]);
  const [groups, setGroups] = useState<AdministrationGroup[]>([]);
  const [activeSessions, setActiveSessions] = useState<AdministrationSession[]>([]);
  const [sessionHistory, setSessionHistory] = useState<AdministrationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const results = await Promise.allSettled([
      administrationApi.listRoles(),
      administrationApi.listGroups(),
      administrationApi.listActiveSessions(),
      administrationApi.listSessionHistory(),
    ]);

    if (results[0].status === "fulfilled") setRoles(results[0].value);
    if (results[1].status === "fulfilled") setGroups(results[1].value);
    if (results[2].status === "fulfilled") setActiveSessions(results[2].value);
    if (results[3].status === "fulfilled") setSessionHistory(results[3].value);

    const failures = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason);

    setAuthRequired(
      failures.some(
        (failure) => failure instanceof BffRequestError && failure.status === 401,
      ),
    );

    if (failures.length > 0) {
      setLoadError([...new Set(failures.map(errorMessage))].join(" "));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const runAction = useCallback(
    async (
      key: string,
      successMessage: string,
      action: () => Promise<unknown>,
      refresh?: () => Promise<unknown>,
    ) => {
      setBusyAction(key);
      setActionError(null);
      setNotice(null);

      try {
        await action();
        if (refresh) await refresh();
        setNotice(successMessage);
        return true;
      } catch (error) {
        setActionError(errorMessage(error));
        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [],
  );

  const refreshRoles = useCallback(async () => {
    setRoles(await administrationApi.listRoles());
  }, []);

  const refreshGroups = useCallback(async () => {
    setGroups(await administrationApi.listGroups());
  }, []);

  const refreshSessions = useCallback(async () => {
    const [current, history] = await Promise.all([
      administrationApi.listActiveSessions(),
      administrationApi.listSessionHistory(),
    ]);
    setActiveSessions(current);
    setSessionHistory(history);
  }, []);

  const metrics = [
    {
      tab: "users" as const,
      label: "Utilisateurs",
      value: usersTotal ?? "—",
      icon: UserCog,
    },
    { tab: "roles" as const, label: "Rôles", value: roles.length, icon: ShieldCheck },
    { tab: "groups" as const, label: "Groupes", value: groups.length, icon: UsersRound },
    {
      tab: "sessions" as const,
      label: "Sessions actives",
      value: activeSessions.length,
      icon: Activity,
    },
  ];

  return (
    <section className="space-y-6 text-[#172033]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight text-[#0b1220]">Administration</h1>
          <p className="mt-1 max-w-3xl text-base leading-6 text-[#475467]">
            Gérez les utilisateurs, les rôles, les groupes et les sessions via le BFF Mairie360.
          </p>
        </div>
        <ActionButton
          variant="secondary"
          busy={loading}
          onClick={() => void loadAll()}
          className="shrink-0"
        >
          {!loading && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          Actualiser
        </ActionButton>
      </div>

      {authRequired && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[#f4c7c3] bg-[#fff7f6] px-4 py-3.5 text-sm text-[#912018]"
        >
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Session administrateur requise</p>
            <p className="mt-0.5 leading-5">
              Le BFF a répondu 401. Connectez-vous depuis le portail afin que le JWT soit transmis aux appels Administration.
            </p>
          </div>
        </div>
      )}

      {loadError && !authRequired && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[#f4c7c3] bg-[#fff7f6] px-4 py-3.5 text-sm text-[#912018]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Certaines données n’ont pas pu être chargées</p>
            <p className="mt-0.5 leading-5">{loadError}</p>
          </div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#a6e3c4] bg-[#f2fff8] px-4 py-3 text-sm font-semibold text-[#05603a]"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            {notice}
          </span>
          <button type="button" aria-label="Fermer" onClick={() => setNotice(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#f4c7c3] bg-[#fff7f6] px-4 py-3 text-sm font-semibold text-[#912018]"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {actionError}
          </span>
          <button type="button" aria-label="Fermer" onClick={() => setActionError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <button
              type="button"
              key={metric.tab}
              onClick={() => setActiveTab(metric.tab)}
              className={`flex items-center gap-4 rounded-xl border bg-white p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${
                activeTab === metric.tab ? "border-[#699c98] ring-2 ring-[#3c7773]/10" : "border-[#dedbd5]"
              }`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#edf5f4] text-[#315f5c]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-2xl font-bold text-[#172033]">{metric.value}</span>
                <span className="block text-sm text-[#667085]">{metric.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto border-b border-[#d8d5cf]">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Sections d’administration">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-[#315f5c] text-[#315f5c]"
                    : "border-transparent text-[#667085] hover:text-[#344054]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "users" && (
        <UsersPanel
          roles={roles}
          busyAction={busyAction}
          runAction={runAction}
          onTotalChange={setUsersTotal}
        />
      )}
      {activeTab === "roles" && (
        <RolesPanel
          roles={roles}
          busyAction={busyAction}
          runAction={runAction}
          refreshRoles={refreshRoles}
        />
      )}
      {activeTab === "groups" && (
        <GroupsPanel
          groups={groups}
          busyAction={busyAction}
          runAction={runAction}
          refreshGroups={refreshGroups}
        />
      )}
      {activeTab === "sessions" && (
        <SessionsPanel
          activeSessions={activeSessions}
          sessionHistory={sessionHistory}
          busyAction={busyAction}
          runAction={runAction}
          refreshSessions={refreshSessions}
        />
      )}
    </section>
  );
}

type RunAction = (
  key: string,
  successMessage: string,
  action: () => Promise<unknown>,
  refresh?: () => Promise<unknown>,
) => Promise<boolean>;

const emptyUsersPage: AdministrationUsersPage = {
  users: [],
  page: 1,
  page_size: 20,
  total: 0,
  total_pages: 0,
};

function UsersPanel({
  roles,
  busyAction,
  runAction,
  onTotalChange,
}: {
  roles: AdministrationRole[];
  busyAction: string | null;
  runAction: RunAction;
  onTotalChange: (total: number) => void;
}) {
  const [usersPage, setUsersPage] = useState<AdministrationUsersPage>(emptyUsersPage);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdministrationUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdministrationUser | null>(null);
  const [passwordResetTarget, setPasswordResetTarget] = useState<{
    user: AdministrationUser;
    password: string;
  } | null>(null);
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    roleId: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmation: "",
  });

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const response = await administrationApi.listUsers({ page, search });
      setUsersPage(response);
      onTotalChange(response.total);

      if (response.total_pages > 0 && page > response.total_pages) {
        setPage(response.total_pages);
      }
    } catch (error) {
      setUsersError(errorMessage(error));
    } finally {
      setUsersLoading(false);
    }
  }, [onTotalChange, page, search]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const selectUser = (user: AdministrationUser) => {
    setSelectedUser(user);
    setEditorMode("edit");
    setPasswordForm({ password: "", confirmation: "" });
    setPasswordResetTarget(null);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number ?? "",
      roleId: user.roles[0] ? String(user.roles[0].id) : "",
    });

    window.requestAnimationFrame(() => {
      document.getElementById("user-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();

    if (page === 1 && search === nextSearch) {
      void loadUsers();
      return;
    }

    setSearch(nextSearch);
    setPage(1);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction(
      "create-user",
      "Utilisateur créé.",
      () =>
        administrationApi.createUser({
          ...createForm,
          phone_number: createForm.phone_number.trim() || null,
        }),
      loadUsers,
    );

    if (success) {
      setCreateForm({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
      });
      setEditorMode(null);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;

    const selectedRoleId = editForm.roleId ? Number(editForm.roleId) : null;
    const currentRoleIds = selectedUser.roles.map((role) => role.id);
    const roleIdsToRemove = currentRoleIds.filter((roleId) => roleId !== selectedRoleId);
    const shouldAddRole =
      selectedRoleId !== null && !currentRoleIds.includes(selectedRoleId);

    const success = await runAction(
      "update-user-" + selectedUser.id,
      "Utilisateur mis à jour.",
      async () => {
        await administrationApi.updateUser(selectedUser.id, {
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          email: editForm.email.trim(),
          phone_number: editForm.phone_number.trim() || null,
        });

        await Promise.all([
          ...roleIdsToRemove.map((roleId) =>
            administrationApi.removeRoleFromUser(selectedUser.id, roleId),
          ),
          ...(shouldAddRole && selectedRoleId !== null
            ? [administrationApi.addRoleToUser(selectedUser.id, selectedRoleId)]
            : []),
        ]);
      },
    );

    if (!success) return;

    const selectedRole = roles.find((role) => role.id === selectedRoleId);
    const updatedUser: AdministrationUser = {
      ...selectedUser,
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      email: editForm.email.trim(),
      phone_number: editForm.phone_number.trim() || null,
      roles: selectedRole ? [{ id: selectedRole.id, name: selectedRole.name }] : [],
    };

    setSelectedUser(updatedUser);
    setUsersPage((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === updatedUser.id ? updatedUser : user,
      ),
    }));
  };

  const confirmUserDeletion = () => {
    if (!userToDelete) return;
    const user = userToDelete;

    void runAction(
      "delete-user-" + user.id,
      "Utilisateur supprimé.",
      () => administrationApi.deleteUser(user.id),
      async () => {
        setSelectedUser(null);
        setEditorMode(null);
        await loadUsers();
      },
    ).then((success) => {
      if (success) setUserToDelete(null);
    });
  };

  const requestPasswordReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser || passwordForm.password !== passwordForm.confirmation) return;

    setPasswordResetTarget({
      user: selectedUser,
      password: passwordForm.password,
    });
  };

  const confirmPasswordReset = () => {
    if (!passwordResetTarget) return;
    const { user, password } = passwordResetTarget;

    void runAction(
      "reset-user-password-" + user.id,
      "Mot de passe modifié. Les sessions ont été révoquées.",
      () => administrationApi.resetUserPassword(user.id, password),
    ).then((success) => {
      if (!success) return;
      setPasswordForm({ password: "", confirmation: "" });
      setPasswordResetTarget(null);
    });
  };

  const passwordsMismatch =
    passwordForm.confirmation.length > 0 &&
    passwordForm.password !== passwordForm.confirmation;

  const changeCreate = (field: keyof typeof createForm, value: string) =>
    setCreateForm((current) => ({ ...current, [field]: value }));
  const changeEdit = (field: keyof typeof editForm, value: string) =>
    setEditForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(380px,0.5fr)]">
      <Panel
        title="Utilisateurs"
        description="Sélectionnez une personne dans le tableau pour modifier ses informations."
        action={
          <ActionButton
            onClick={() => {
              setSelectedUser(null);
              setEditorMode("create");
              setPasswordForm({ password: "", confirmation: "" });
              setPasswordResetTarget(null);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvel utilisateur
          </ActionButton>
        }
      >
        <div className="space-y-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            role="search"
          >
            <label className="relative block flex-1">
              <span className="sr-only">Rechercher un utilisateur</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]"
                aria-hidden="true"
              />
              <input
                type="search"
                className={inputClassName + " pl-9"}
                placeholder="Rechercher par nom, prénom ou e-mail"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </label>
            <ActionButton type="submit" variant="secondary">
              Rechercher
            </ActionButton>
          </form>

          {usersError ? (
            <div role="alert" className="rounded-lg bg-[#fff7f6] p-4 text-sm text-[#912018]">
              {usersError}
            </div>
          ) : usersLoading ? (
            <div className="grid min-h-64 place-items-center text-[#667085]">
              <LoaderCircle className="h-6 w-6 animate-spin" aria-label="Chargement" />
            </div>
          ) : usersPage.users.length === 0 ? (
            <EmptyState>
              {search
                ? "Aucun utilisateur ne correspond à cette recherche."
                : "Aucun utilisateur disponible."}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#e4e1dc]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#f8f7f5] text-xs font-semibold uppercase tracking-wide text-[#667085]">
                  <tr>
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Rôle</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="w-12 px-4 py-3">
                      <span className="sr-only">Modifier</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe8e3]">
                  {usersPage.users.map((user) => {
                    const selected = selectedUser?.id === user.id;

                    return (
                      <tr
                        key={user.id}
                        tabIndex={0}
                        aria-selected={selected}
                        onClick={() => selectUser(user)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectUser(user);
                          }
                        }}
                        className={
                          "cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#3c7773]/30 " +
                          (selected
                            ? "bg-[#edf7f6]"
                            : "bg-white hover:bg-[#fafcfb]")
                        }
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#344054]">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="mt-0.5 text-xs text-[#98a2b3]">
                            Identifiant #{user.id}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-[#475467]">{user.email}</div>
                          <div className="mt-0.5 text-xs text-[#98a2b3]">
                            {user.phone_number || "Aucun téléphone"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-[#edf5f4] px-2.5 py-1 text-xs font-semibold text-[#315f5c]">
                            {user.roles.map((role) => role.name).join(", ") || "Aucun rôle"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " +
                              (user.is_archived
                                ? "bg-[#fef3f2] text-[#b42318]"
                                : "bg-[#ecfdf3] text-[#027a48]")
                            }
                          >
                            {user.is_archived ? "Archivé" : user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Pencil className="h-4 w-4 text-[#667085]" aria-hidden="true" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[#ebe8e3] pt-4 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between">
            <span>
              {usersPage.total} utilisateur{usersPage.total > 1 ? "s" : ""} · 20 maximum par page
            </span>
            <div className="flex items-center gap-2">
              <ActionButton
                variant="secondary"
                className="h-9 px-2.5"
                disabled={page <= 1 || usersLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </ActionButton>
              <span className="min-w-24 text-center font-semibold text-[#344054]">
                Page {usersPage.page} / {Math.max(usersPage.total_pages, 1)}
              </span>
              <ActionButton
                variant="secondary"
                className="h-9 px-2.5"
                disabled={
                  usersLoading ||
                  usersPage.total_pages === 0 ||
                  page >= usersPage.total_pages
                }
                onClick={() => setPage((current) => current + 1)}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </ActionButton>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title={
          editorMode === "create"
            ? "Créer un utilisateur"
            : selectedUser
              ? "Modifier l’utilisateur"
              : "Fiche utilisateur"
        }
        description={
          editorMode === "create"
            ? "Créez un nouveau compte."
            : selectedUser
              ? selectedUser.first_name + " " + selectedUser.last_name
              : "Cliquez sur une ligne du tableau pour ouvrir la fiche."
        }
        className="h-fit"
      >
        <div id="user-editor">
          {editorMode === "create" ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Prénom" htmlFor="create-first-name">
                <input
                  id="create-first-name"
                  required
                  className={inputClassName}
                  value={createForm.first_name}
                  onChange={(event) => changeCreate("first_name", event.target.value)}
                />
              </Field>
              <Field label="Nom" htmlFor="create-last-name">
                <input
                  id="create-last-name"
                  required
                  className={inputClassName}
                  value={createForm.last_name}
                  onChange={(event) => changeCreate("last_name", event.target.value)}
                />
              </Field>
              <Field label="Adresse e-mail" htmlFor="create-email">
                <input
                  id="create-email"
                  type="email"
                  required
                  className={inputClassName}
                  value={createForm.email}
                  onChange={(event) => changeCreate("email", event.target.value)}
                />
              </Field>
              <Field label="Téléphone" htmlFor="create-phone">
                <input
                  id="create-phone"
                  type="tel"
                  className={inputClassName}
                  value={createForm.phone_number}
                  onChange={(event) => changeCreate("phone_number", event.target.value)}
                />
              </Field>
              <Field label="Mot de passe initial" htmlFor="create-password">
                <input
                  id="create-password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className={inputClassName}
                  value={createForm.password}
                  onChange={(event) => changeCreate("password", event.target.value)}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <ActionButton variant="ghost" onClick={() => setEditorMode(null)}>
                  Annuler
                </ActionButton>
                <ActionButton type="submit" busy={busyAction === "create-user"}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Créer
                </ActionButton>
              </div>
            </form>
          ) : selectedUser ? (
            <div className="space-y-6">
            <form onSubmit={handleUpdate} className="space-y-4">
              <Field label="Prénom" htmlFor="edit-first-name">
                <input
                  id="edit-first-name"
                  required
                  className={inputClassName}
                  value={editForm.first_name}
                  onChange={(event) => changeEdit("first_name", event.target.value)}
                />
              </Field>
              <Field label="Nom" htmlFor="edit-last-name">
                <input
                  id="edit-last-name"
                  required
                  className={inputClassName}
                  value={editForm.last_name}
                  onChange={(event) => changeEdit("last_name", event.target.value)}
                />
              </Field>
              <Field label="Adresse e-mail" htmlFor="edit-email">
                <input
                  id="edit-email"
                  type="email"
                  required
                  className={inputClassName}
                  value={editForm.email}
                  onChange={(event) => changeEdit("email", event.target.value)}
                />
              </Field>
              <Field label="Téléphone" htmlFor="edit-phone">
                <input
                  id="edit-phone"
                  type="tel"
                  className={inputClassName}
                  value={editForm.phone_number}
                  onChange={(event) => changeEdit("phone_number", event.target.value)}
                />
              </Field>
              <Field
                label="Rôle"
                htmlFor="edit-role"
                hint="Le rôle sélectionné remplace les rôles actuels."
              >
                <select
                  id="edit-role"
                  className={inputClassName}
                  value={editForm.roleId}
                  onChange={(event) => changeEdit("roleId", event.target.value)}
                >
                  <option value="">Aucun rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <ActionButton
                  variant="danger"
                  busy={busyAction === "delete-user-" + selectedUser.id}
                  onClick={() => setUserToDelete(selectedUser)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Supprimer l’utilisateur
                </ActionButton>
                <ActionButton
                  type="submit"
                  busy={busyAction === "update-user-" + selectedUser.id}
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Enregistrer
                </ActionButton>
              </div>
            </form>
            <form
              onSubmit={requestPasswordReset}
              className="space-y-4 border-t border-[#ebe8e3] pt-5"
            >
              <div>
                <h3 className="flex items-center gap-2 font-bold text-[#344054]">
                  <KeyRound className="h-4 w-4 text-[#315f5c]" aria-hidden="true" />
                  Réinitialiser le mot de passe
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                  Définissez le nouveau mot de passe. Toutes les sessions actives seront
                  déconnectées et l’utilisateur devra se reconnecter avec celui-ci.
                </p>
              </div>
              <Field label="Nouveau mot de passe" htmlFor="reset-password">
                <input
                  id="reset-password"
                  type="password"
                  minLength={8}
                  maxLength={255}
                  required
                  autoComplete="new-password"
                  className={inputClassName}
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Confirmer le mot de passe" htmlFor="reset-password-confirmation">
                <input
                  id="reset-password-confirmation"
                  type="password"
                  minLength={8}
                  maxLength={255}
                  required
                  autoComplete="new-password"
                  aria-invalid={passwordsMismatch}
                  aria-describedby={passwordsMismatch ? "password-mismatch" : undefined}
                  className={inputClassName}
                  value={passwordForm.confirmation}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmation: event.target.value,
                    }))
                  }
                />
              </Field>
              {passwordsMismatch && (
                <p id="password-mismatch" role="alert" className="text-xs font-semibold text-[#b42318]">
                  Les deux mots de passe ne correspondent pas.
                </p>
              )}
              <ActionButton
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={
                  passwordForm.password.length < 8 ||
                  passwordForm.password !== passwordForm.confirmation
                }
                busy={busyAction === "reset-user-password-" + selectedUser.id}
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Réinitialiser le mot de passe
              </ActionButton>
            </form>
            </div>
          ) : (
            <EmptyState>Sélectionnez un utilisateur dans le tableau.</EmptyState>
          )}
        </div>
      </Panel>

      <ConfirmModal
        open={userToDelete !== null}
        title="Supprimer cet utilisateur ?"
        description={
          userToDelete
            ? `Le compte de « ${userToDelete.first_name} ${userToDelete.last_name} » (${userToDelete.email}) sera définitivement supprimé. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer l’utilisateur"
        busy={
          userToDelete !== null && busyAction === "delete-user-" + userToDelete.id
        }
        onCancel={() => setUserToDelete(null)}
        onConfirm={confirmUserDeletion}
      />
      <ConfirmModal
        open={passwordResetTarget !== null}
        tone="security"
        title="Confirmer la réinitialisation ?"
        description={
          passwordResetTarget
            ? `Le mot de passe de « ${passwordResetTarget.user.first_name} ${passwordResetTarget.user.last_name} » sera remplacé. Toutes ses sessions actives seront déconnectées.`
            : ""
        }
        confirmLabel="Réinitialiser"
        busy={
          passwordResetTarget !== null &&
          busyAction === "reset-user-password-" + passwordResetTarget.user.id
        }
        onCancel={() => setPasswordResetTarget(null)}
        onConfirm={confirmPasswordReset}
      />
    </div>
  );
}

function RolesPanel({
  roles,
  busyAction,
  runAction,
  refreshRoles,
}: {
  roles: AdministrationRole[];
  busyAction: string | null;
  runAction: RunAction;
  refreshRoles: () => Promise<void>;
}) {
  const [mode, setMode] = useState<RoleWriteMode>("create");
  const [roleId, setRoleId] = useState("");
  const [form, setForm] = useState({ name: "", description: "", can_be_deleted: true });
  const [roleToDelete, setRoleToDelete] = useState<AdministrationRole | null>(null);

  const resetForm = () => {
    setMode("create");
    setRoleId("");
    setForm({ name: "", description: "", can_be_deleted: true });
  };

  const editRole = (role: AdministrationRole) => {
    setMode("replace");
    setRoleId(String(role.id));
    setForm({ name: role.name, description: role.description, can_be_deleted: true });
    document.getElementById("role-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = {
      name: form.name.trim(),
      description: form.description.trim(),
      can_be_deleted: form.can_be_deleted,
    };
    const action =
      mode === "create"
        ? () => administrationApi.createRole(input)
        : mode === "replace"
          ? () => administrationApi.replaceRole(Number(roleId), input)
          : () => administrationApi.updateRole(Number(roleId), input);
    const success = await runAction(
      "save-role",
      mode === "create" ? "Rôle créé." : "Rôle mis à jour.",
      action,
      refreshRoles,
    );
    if (success) resetForm();
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
      <Panel
        title="Rôles disponibles"
        description="Consultez et gérez les rôles disponibles."
        action={
          <ActionButton
            variant="secondary"
            busy={busyAction === "refresh-roles"}
            onClick={() => void runAction("refresh-roles", "Rôles actualisés.", refreshRoles)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Actualiser
          </ActionButton>
        }
      >
        {roles.length === 0 ? (
          <EmptyState>Aucun rôle retourné par le BFF.</EmptyState>
        ) : (
          <div className="divide-y divide-[#ebe8e3] rounded-lg border border-[#e4e1dc]">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#344054]">{role.name}</span>
                    <span className="rounded bg-[#f2f1ee] px-1.5 py-0.5 font-mono text-xs text-[#667085]">
                      #{role.id}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#667085]">{role.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ActionButton variant="secondary" onClick={() => editRole(role)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Modifier
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    busy={busyAction === `delete-role-${role.id}`}
                    onClick={() => setRoleToDelete(role)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Supprimer
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title={mode === "create" ? "Créer un rôle" : "Modifier le rôle"}
        description={
          mode === "create"
            ? "Ajoutez un nouveau rôle à l’organisation."
            : mode === "replace"
              ? "Remplacez les informations complètes du rôle."
              : "Mettez à jour les informations du rôle."
        }
        className="h-fit"
      >
        <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
          {mode !== "create" && (
            <Field label="Type de modification" htmlFor="role-write-mode">
              <select
                id="role-write-mode"
                className={inputClassName}
                value={mode}
                onChange={(event) => setMode(event.target.value as RoleWriteMode)}
              >
                <option value="replace">Remplacement complet (PUT)</option>
                <option value="update">Mise à jour partielle (PATCH)</option>
              </select>
            </Field>
          )}
          <Field label="Nom" htmlFor="role-name">
            <input
              id="role-name"
              required
              className={inputClassName}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field label="Description" htmlFor="role-description">
            <textarea
              id="role-description"
              required
              className={textareaClassName}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Field>
          <label className="flex items-center gap-3 text-sm font-medium text-[#344054]">
            <input
              type="checkbox"
              checked={form.can_be_deleted}
              onChange={(event) =>
                setForm((current) => ({ ...current, can_be_deleted: event.target.checked }))
              }
              className="h-4 w-4 rounded border-[#d0d5dd] accent-[#315f5c]"
            />
            Autoriser la suppression de ce rôle
          </label>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            {mode !== "create" && (
              <ActionButton variant="ghost" onClick={resetForm}>
                Annuler
              </ActionButton>
            )}
            <ActionButton type="submit" busy={busyAction === "save-role"}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {mode === "create" ? "Créer" : "Enregistrer"}
            </ActionButton>
          </div>
        </form>
      </Panel>

      <ConfirmModal
        open={roleToDelete !== null}
        title="Supprimer ce rôle ?"
        description={
          roleToDelete
            ? `Le rôle « ${roleToDelete.name} » sera définitivement supprimé. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer le rôle"
        busy={
          roleToDelete !== null && busyAction === `delete-role-${roleToDelete.id}`
        }
        onCancel={() => setRoleToDelete(null)}
        onConfirm={() => {
          if (!roleToDelete) return;
          const role = roleToDelete;
          void runAction(
            `delete-role-${role.id}`,
            "Rôle supprimé.",
            () => administrationApi.deleteRole(role.id),
            refreshRoles,
          ).then((success) => {
            if (success) setRoleToDelete(null);
          });
        }}
      />
    </div>
  );
}

type GroupDeletionTarget =
  | {
      kind: "member";
      group: AdministrationGroup;
      user: AdministrationGroupMember;
    }
  | {
      kind: "group";
      group: AdministrationGroup;
    };

function GroupsPanel({
  groups,
  busyAction,
  runAction,
  refreshGroups,
}: {
  groups: AdministrationGroup[];
  busyAction: string | null;
  runAction: RunAction;
  refreshGroups: () => Promise<void>;
}) {
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [selectedGroup, setSelectedGroup] = useState<AdministrationGroup | null>(null);
  const [groupUsers, setGroupUsers] = useState<AdministrationGroupMember[]>([]);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);
  const [groupDetailError, setGroupDetailError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [userOptions, setUserOptions] = useState<AdministrationUser[]>([]);
  const [userOptionsLoading, setUserOptionsLoading] = useState(false);
  const [userOptionsError, setUserOptionsError] = useState<string | null>(null);
  const [deletionTarget, setDeletionTarget] = useState<GroupDeletionTarget | null>(null);

  const loadGroup = useCallback(async (groupId: number) => {
    setGroupDetailLoading(true);
    setGroupDetailError(null);

    try {
      const [group, users] = await Promise.all([
        administrationApi.getGroup(groupId),
        administrationApi.listGroupUsers(groupId),
      ]);
      setSelectedGroup(group);
      setGroupUsers(users);
      setEditForm({
        name: group?.name ?? "",
        description: group?.description ?? "",
      });
    } catch (error) {
      setGroupDetailError(errorMessage(error));
    } finally {
      setGroupDetailLoading(false);
    }
  }, []);

  const refreshSelectedGroupUsers = useCallback(async () => {
    if (!selectedGroup) return;
    setGroupUsers(await administrationApi.listGroupUsers(selectedGroup.id));
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) {
      setUserOptions([]);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setUserOptionsLoading(true);
      setUserOptionsError(null);

      try {
        const result = await administrationApi.listUsers({
          page: 1,
          search: memberSearch,
        });
        if (!cancelled) setUserOptions(result.users);
      } catch (error) {
        if (!cancelled) setUserOptionsError(errorMessage(error));
      } finally {
        if (!cancelled) setUserOptionsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [memberSearch, selectedGroup]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction(
      "create-group",
      "Groupe créé.",
      () =>
        administrationApi.createGroup({
          name: createForm.name.trim(),
          description: createForm.description.trim(),
        }),
      refreshGroups,
    );
    if (success) setCreateForm({ name: "", description: "" });
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroup) return;

    let updatedGroup: AdministrationGroup | null = null;
    const success = await runAction(
      "update-group-" + selectedGroup.id,
      "Groupe mis à jour.",
      async () => {
        updatedGroup = await administrationApi.updateGroup(selectedGroup.id, {
          name: editForm.name.trim(),
          description: editForm.description.trim(),
        });
      },
      refreshGroups,
    );

    if (success && updatedGroup) {
      setSelectedGroup(updatedGroup);
    }
  };

  const owner = selectedGroup
    ? groupUsers.find((user) => user.id === selectedGroup.owner_id)
    : null;
  const availableUsers = userOptions.filter(
    (user) => !groupUsers.some((member) => member.id === user.id),
  );

  const deletionActionKey = deletionTarget
    ? deletionTarget.kind === "member"
      ? "remove-group-user-" + deletionTarget.user.id
      : "delete-group-" + deletionTarget.group.id
    : null;

  const confirmDeletion = () => {
    if (!deletionTarget) return;

    if (deletionTarget.kind === "member") {
      const { group, user } = deletionTarget;
      void runAction(
        "remove-group-user-" + user.id,
        "Utilisateur retiré du groupe.",
        () => administrationApi.removeUserFromGroup(group.id, user.id),
        refreshSelectedGroupUsers,
      ).then((success) => {
        if (success) setDeletionTarget(null);
      });
      return;
    }

    const { group } = deletionTarget;
    void runAction(
      "delete-group-" + group.id,
      "Groupe supprimé.",
      () => administrationApi.deleteGroup(group.id),
      async () => {
        await refreshGroups();
        setSelectedGroup(null);
        setGroupUsers([]);
      },
    ).then((success) => {
      if (success) setDeletionTarget(null);
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <div className="space-y-5">
        <Panel
          title="Groupes"
          description="Sélectionnez un groupe pour modifier ses informations et ses membres."
          action={
            <ActionButton
              variant="secondary"
              busy={busyAction === "refresh-groups"}
              onClick={() =>
                void runAction("refresh-groups", "Groupes actualisés.", refreshGroups)
              }
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Actualiser
            </ActionButton>
          }
        >
          {groups.length === 0 ? (
            <EmptyState>Aucun groupe retourné par le BFF.</EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => void loadGroup(group.id)}
                  className={
                    "rounded-lg border p-4 text-left transition hover:border-[#699c98] hover:bg-[#f8fcfb] " +
                    (selectedGroup?.id === group.id
                      ? "border-[#699c98] bg-[#f5fbfa] ring-2 ring-[#3c7773]/10"
                      : "border-[#e4e1dc] bg-white")
                  }
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-bold text-[#344054]">{group.name}</span>
                    <span className="font-mono text-xs text-[#98a2b3]">#{group.id}</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-sm leading-5 text-[#667085]">
                    {group.description || "Aucune description"}
                  </span>
                  <span className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#315f5c]">
                    <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Ouvrir le groupe
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Créer un groupe"
          description="Ajoutez un groupe pour organiser les utilisateurs."
        >
          <form
            onSubmit={handleCreate}
            className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"
          >
            <Field label="Nom" htmlFor="group-name">
              <input
                id="group-name"
                required
                className={inputClassName}
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Description" htmlFor="group-description">
              <input
                id="group-description"
                required
                className={inputClassName}
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <ActionButton type="submit" busy={busyAction === "create-group"}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer
            </ActionButton>
          </form>
        </Panel>
      </div>

      <Panel
        title={selectedGroup ? selectedGroup.name : "Détail du groupe"}
        description={
          selectedGroup
            ? "Modifiez le groupe et gérez ses membres par nom et prénom."
            : "Sélectionnez un groupe pour ouvrir sa fiche."
        }
        className="h-fit"
      >
        {groupDetailLoading ? (
          <div className="grid min-h-52 place-items-center text-[#667085]">
            <LoaderCircle className="h-6 w-6 animate-spin" aria-label="Chargement" />
          </div>
        ) : groupDetailError ? (
          <div className="rounded-lg bg-[#fff7f6] p-4 text-sm text-[#912018]">
            {groupDetailError}
          </div>
        ) : !selectedGroup ? (
          <EmptyState>Cliquez sur un groupe dans la liste.</EmptyState>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleUpdate} className="space-y-4">
              <Field label="Nom du groupe" htmlFor="edit-group-name">
                <input
                  id="edit-group-name"
                  required
                  className={inputClassName}
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Description" htmlFor="edit-group-description">
                <textarea
                  id="edit-group-description"
                  className={textareaClassName}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="flex flex-col gap-2 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Propriétaire :{" "}
                  {owner
                    ? owner.first_name + " " + owner.last_name
                    : "utilisateur #" + selectedGroup.owner_id}
                </span>
                <ActionButton
                  type="submit"
                  busy={busyAction === "update-group-" + selectedGroup.id}
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Enregistrer le groupe
                </ActionButton>
              </div>
            </form>

            <div className="border-t border-[#ebe8e3] pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold text-[#344054]">
                  Membres ({groupUsers.length})
                </h3>
                <ActionButton
                  variant="ghost"
                  busy={busyAction === "refresh-group-users"}
                  onClick={() =>
                    void runAction(
                      "refresh-group-users",
                      "Membres actualisés.",
                      refreshSelectedGroupUsers,
                    )
                  }
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Actualiser
                </ActionButton>
              </div>

              {groupUsers.length === 0 ? (
                <EmptyState>Ce groupe ne contient aucun utilisateur.</EmptyState>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {groupUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e1dc] px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#344054]">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="block truncate text-xs text-[#98a2b3]">
                          {user.email}
                        </span>
                      </span>
                      <ActionButton
                        variant="ghost"
                        className="h-8 shrink-0 px-2 text-[#b42318]"
                        busy={busyAction === "remove-group-user-" + user.id}
                        onClick={() =>
                          setDeletionTarget({ kind: "member", group: selectedGroup, user })
                        }
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Retirer
                      </ActionButton>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#ebe8e3] pt-5">
              <Field
                label="Ajouter un utilisateur"
                htmlFor="group-user-search"
                hint="Recherchez par nom, prénom ou adresse e-mail."
              >
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]"
                    aria-hidden="true"
                  />
                  <input
                    id="group-user-search"
                    type="search"
                    className={inputClassName + " pl-9"}
                    placeholder="Ex. Marie Martin"
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                  />
                </div>
              </Field>

              <div className="mt-3">
                {userOptionsLoading ? (
                  <div className="flex items-center gap-2 py-3 text-sm text-[#667085]">
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Recherche des utilisateurs…
                  </div>
                ) : userOptionsError ? (
                  <p className="py-3 text-sm text-[#912018]">{userOptionsError}</p>
                ) : availableUsers.length === 0 ? (
                  <p className="py-3 text-sm text-[#667085]">
                    Aucun utilisateur disponible pour cette recherche.
                  </p>
                ) : (
                  <div className="max-h-60 divide-y divide-[#ebe8e3] overflow-y-auto rounded-lg border border-[#e4e1dc]">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-[#344054]">
                            {user.first_name} {user.last_name}
                          </span>
                          <span className="block truncate text-xs text-[#98a2b3]">
                            {user.email}
                          </span>
                        </span>
                        <ActionButton
                          variant="secondary"
                          className="h-8 shrink-0 px-2.5"
                          busy={busyAction === "add-group-user-" + user.id}
                          onClick={() =>
                            void runAction(
                              "add-group-user-" + user.id,
                              user.first_name + " " + user.last_name + " ajouté au groupe.",
                              () =>
                                administrationApi.addUserToGroup(
                                  selectedGroup.id,
                                  user.id,
                                ),
                              refreshSelectedGroupUsers,
                            )
                          }
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Ajouter
                        </ActionButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#ebe8e3] pt-5">
              <ActionButton
                variant="danger"
                className="w-full"
                busy={busyAction === "delete-group-" + selectedGroup.id}
                onClick={() =>
                  setDeletionTarget({ kind: "group", group: selectedGroup })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Supprimer ce groupe
              </ActionButton>
            </div>
          </div>
        )}
      </Panel>

      <ConfirmModal
        open={deletionTarget !== null}
        title={
          deletionTarget?.kind === "member"
            ? "Retirer ce membre du groupe ?"
            : "Supprimer ce groupe ?"
        }
        description={
          deletionTarget?.kind === "member"
            ? `« ${deletionTarget.user.first_name} ${deletionTarget.user.last_name} » sera retiré du groupe « ${deletionTarget.group.name} ». Son compte ne sera pas supprimé.`
            : deletionTarget
              ? `Le groupe « ${deletionTarget.group.name} » et ses associations seront définitivement supprimés. Cette action est irréversible.`
              : ""
        }
        confirmLabel={
          deletionTarget?.kind === "member" ? "Retirer du groupe" : "Supprimer le groupe"
        }
        busy={deletionActionKey !== null && busyAction === deletionActionKey}
        onCancel={() => setDeletionTarget(null)}
        onConfirm={confirmDeletion}
      />
    </div>
  );
}

function SessionsPanel({
  activeSessions,
  sessionHistory,
  busyAction,
  runAction,
  refreshSessions,
}: {
  activeSessions: AdministrationSession[];
  sessionHistory: AdministrationSession[];
  busyAction: string | null;
  runAction: RunAction;
  refreshSessions: () => Promise<void>;
}) {
  const [view, setView] = useState<"active" | "history">("active");
  const [refreshToken, setRefreshToken] = useState("");

  const submitTokenAction = async (action: "refresh" | "revoke") => {
    const success = await runAction(
      `${action}-session`,
      action === "refresh" ? "Session rafraîchie." : "Session révoquée.",
      () =>
        action === "refresh"
          ? administrationApi.refreshSession(refreshToken)
          : administrationApi.revokeSession(refreshToken),
      refreshSessions,
    );
    if (success) setRefreshToken("");
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Sessions"
        description={
          view === "active"
            ? "Consultez les connexions actuellement ouvertes."
            : "Consultez l’historique des connexions."
        }
        action={
          <ActionButton
            variant="secondary"
            busy={busyAction === "refresh-sessions"}
            onClick={() =>
              void runAction("refresh-sessions", "Sessions actualisées.", refreshSessions)
            }
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Actualiser
          </ActionButton>
        }
      >
        <div className="mb-5 inline-flex rounded-lg bg-[#f2f1ee] p-1">
          <button
            type="button"
            onClick={() => setView("active")}
            className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
              view === "active" ? "bg-white text-[#315f5c] shadow-sm" : "text-[#667085]"
            }`}
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Actives ({activeSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setView("history")}
            className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
              view === "history" ? "bg-white text-[#315f5c] shadow-sm" : "text-[#667085]"
            }`}
          >
            <History className="h-4 w-4" aria-hidden="true" />
            Historique ({sessionHistory.length})
          </button>
        </div>
        <SessionTable sessions={view === "active" ? activeSessions : sessionHistory} />
      </Panel>

      <Panel
        title="Gérer une session"
        description="Rafraîchissez ou révoquez une session à l’aide de son refresh token."
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <Field
            label="Refresh token"
            htmlFor="session-refresh-token"
            hint="Le token reste uniquement dans ce formulaire et n’est pas mémorisé."
          >
            <input
              id="session-refresh-token"
              type="password"
              autoComplete="off"
              className={inputClassName}
              value={refreshToken}
              onChange={(event) => setRefreshToken(event.target.value)}
            />
          </Field>
          <ActionButton
            variant="secondary"
            disabled={!refreshToken.trim()}
            busy={busyAction === "refresh-session"}
            onClick={() => void submitTokenAction("refresh")}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Rafraîchir
          </ActionButton>
          <ActionButton
            variant="danger"
            disabled={!refreshToken.trim()}
            busy={busyAction === "revoke-session"}
            onClick={() => void submitTokenAction("revoke")}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Révoquer
          </ActionButton>
        </div>
      </Panel>
    </div>
  );
}
