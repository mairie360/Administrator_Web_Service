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
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import {
  administrationApi,
  type AdministrationGroup,
  type AdministrationRole,
  type AdministrationSession,
  type UpdateUserInput,
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
  variant?: "primary" | "secondary" | "danger" | "ghost";
  busy?: boolean;
}) {
  const variants = {
    primary: "border-[#315f5c] bg-[#315f5c] text-white hover:bg-[#274d4a]",
    secondary: "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f8f7f5]",
    danger: "border-[#f0b6b2] bg-white text-[#b42318] hover:bg-[#fff4f2]",
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
    { tab: "users" as const, label: "Opérations utilisateur", value: "4", icon: UserCog },
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
        <UsersPanel roles={roles} busyAction={busyAction} runAction={runAction} />
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

function UsersPanel({
  roles,
  busyAction,
  runAction,
}: {
  roles: AdministrationRole[];
  busyAction: string | null;
  runAction: RunAction;
}) {
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [updateForm, setUpdateForm] = useState({
    userId: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });
  const [membershipForm, setMembershipForm] = useState({ userId: "", roleId: "" });

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction("create-user", "Utilisateur créé.", () =>
      administrationApi.createUser({
        ...createForm,
        phone_number: createForm.phone_number.trim() || null,
      }),
    );

    if (success) {
      setCreateForm({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
      });
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = Object.fromEntries(
      Object.entries(updateForm)
        .filter(([key, value]) => key !== "userId" && value.trim() !== "")
        .map(([key, value]) => [key, value.trim()]),
    ) as UpdateUserInput;

    if (Object.keys(input).length === 0) {
      await runAction("update-user", "", async () => {
        throw new Error("Renseignez au moins un champ à modifier.");
      });
      return;
    }

    const success = await runAction("update-user", "Utilisateur mis à jour.", () =>
      administrationApi.updateUser(Number(updateForm.userId), input),
    );

    if (success) {
      setUpdateForm({
        userId: updateForm.userId,
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
      });
    }
  };

  const changeCreate = (field: keyof typeof createForm, value: string) =>
    setCreateForm((current) => ({ ...current, [field]: value }));
  const changeUpdate = (field: keyof typeof updateForm, value: string) =>
    setUpdateForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-[#cbdedc] bg-[#f5fbfa] px-4 py-3 text-sm text-[#315f5c]">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="leading-5">
          Le BFF actuel ne fournit pas de route pour lister tous les utilisateurs. Les opérations de modification et de rôle utilisent donc l’identifiant numérique de l’utilisateur.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Créer un utilisateur"
          description="Créez un nouveau compte administrateur."
          className="h-fit"
        >
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
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
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClassName}
                value={createForm.password}
                onChange={(event) => changeCreate("password", event.target.value)}
              />
            </Field>
            <div className="flex items-end sm:justify-end">
              <ActionButton
                type="submit"
                busy={busyAction === "create-user"}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Créer l’utilisateur
              </ActionButton>
            </div>
          </form>
        </Panel>

        <Panel
          title="Modifier un utilisateur"
          description="Mettez à jour les informations d’un compte existant."
          className="h-fit"
        >
          <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
            <Field label="Identifiant utilisateur" htmlFor="update-user-id">
              <input
                id="update-user-id"
                type="number"
                min={1}
                required
                className={inputClassName}
                value={updateForm.userId}
                onChange={(event) => changeUpdate("userId", event.target.value)}
              />
            </Field>
            <Field label="Adresse e-mail" htmlFor="update-email">
              <input
                id="update-email"
                type="email"
                className={inputClassName}
                value={updateForm.email}
                onChange={(event) => changeUpdate("email", event.target.value)}
              />
            </Field>
            <Field label="Prénom" htmlFor="update-first-name">
              <input
                id="update-first-name"
                className={inputClassName}
                value={updateForm.first_name}
                onChange={(event) => changeUpdate("first_name", event.target.value)}
              />
            </Field>
            <Field label="Nom" htmlFor="update-last-name">
              <input
                id="update-last-name"
                className={inputClassName}
                value={updateForm.last_name}
                onChange={(event) => changeUpdate("last_name", event.target.value)}
              />
            </Field>
            <Field label="Téléphone" htmlFor="update-phone">
              <input
                id="update-phone"
                type="tel"
                className={inputClassName}
                value={updateForm.phone_number}
                onChange={(event) => changeUpdate("phone_number", event.target.value)}
              />
            </Field>
            <div className="flex items-end sm:justify-end">
              <ActionButton
                type="submit"
                busy={busyAction === "update-user"}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Enregistrer
              </ActionButton>
            </div>
          </form>
        </Panel>
      </div>

      <Panel
        title="Gérer les rôles d’un utilisateur"
        description="Ajoutez ou retirez un rôle à partir des identifiants utilisateur et rôle."
      >
        <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <Field label="Identifiant utilisateur" htmlFor="membership-user-id">
            <input
              id="membership-user-id"
              type="number"
              min={1}
              required
              className={inputClassName}
              value={membershipForm.userId}
              onChange={(event) =>
                setMembershipForm((current) => ({ ...current, userId: event.target.value }))
              }
            />
          </Field>
          <Field label="Rôle" htmlFor="membership-role-id">
            <select
              id="membership-role-id"
              required
              className={inputClassName}
              value={membershipForm.roleId}
              onChange={(event) =>
                setMembershipForm((current) => ({ ...current, roleId: event.target.value }))
              }
            >
              <option value="">Sélectionner</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} (#{role.id})
                </option>
              ))}
            </select>
          </Field>
          <ActionButton
            busy={busyAction === "add-user-role"}
            disabled={!membershipForm.userId || !membershipForm.roleId}
            onClick={() =>
              void runAction("add-user-role", "Rôle ajouté à l’utilisateur.", () =>
                administrationApi.addRoleToUser(
                  Number(membershipForm.userId),
                  Number(membershipForm.roleId),
                ),
              )
            }
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter
          </ActionButton>
          <ActionButton
            variant="danger"
            busy={busyAction === "remove-user-role"}
            disabled={!membershipForm.userId || !membershipForm.roleId}
            onClick={() =>
              void runAction("remove-user-role", "Rôle retiré de l’utilisateur.", () =>
                administrationApi.removeRoleFromUser(
                  Number(membershipForm.userId),
                  Number(membershipForm.roleId),
                ),
              )
            }
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Retirer
          </ActionButton>
        </form>
      </Panel>
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
                    onClick={() => {
                      if (!window.confirm(`Supprimer le rôle « ${role.name} » ?`)) return;
                      void runAction(
                        `delete-role-${role.id}`,
                        "Rôle supprimé.",
                        () => administrationApi.deleteRole(role.id),
                        refreshRoles,
                      );
                    }}
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
    </div>
  );
}

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
  const [selectedGroup, setSelectedGroup] = useState<AdministrationGroup | null>(null);
  const [groupUsers, setGroupUsers] = useState<number[]>([]);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);
  const [groupDetailError, setGroupDetailError] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState("");

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

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction(
      "create-group",
      "Groupe créé.",
      () => administrationApi.createGroup(createForm),
      refreshGroups,
    );
    if (success) setCreateForm({ name: "", description: "" });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
      <div className="space-y-5">
        <Panel
          title="Groupes"
          description="Consultez les groupes et gérez leurs membres."
          action={
            <ActionButton
              variant="secondary"
              busy={busyAction === "refresh-groups"}
              onClick={() => void runAction("refresh-groups", "Groupes actualisés.", refreshGroups)}
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
                  className={`rounded-lg border p-4 text-left transition hover:border-[#699c98] hover:bg-[#f8fcfb] ${
                    selectedGroup?.id === group.id
                      ? "border-[#699c98] bg-[#f5fbfa] ring-2 ring-[#3c7773]/10"
                      : "border-[#e4e1dc] bg-white"
                  }`}
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
                    Propriétaire #{group.owner_id}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Créer un groupe" description="Ajoutez un groupe pour organiser les utilisateurs.">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
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
                  setCreateForm((current) => ({ ...current, description: event.target.value }))
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
            ? "Consultez les informations et les membres de ce groupe."
            : "Sélectionnez un groupe pour voir ses membres."
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
          <div className="space-y-5">
            <div className="rounded-lg bg-[#f8f7f5] p-4">
              <p className="text-sm leading-5 text-[#475467]">
                {selectedGroup.description || "Aucune description"}
              </p>
              <p className="mt-2 text-xs font-semibold text-[#667085]">
                Propriétaire : utilisateur #{selectedGroup.owner_id}
              </p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-[#344054]">Membres ({groupUsers.length})</h3>
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
                <div className="space-y-2">
                  {groupUsers.map((userId) => (
                    <div
                      key={userId}
                      className="flex items-center justify-between rounded-lg border border-[#e4e1dc] px-3 py-2.5"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
                        <UserCog className="h-4 w-4 text-[#667085]" aria-hidden="true" />
                        Utilisateur #{userId}
                      </span>
                      <ActionButton
                        variant="ghost"
                        className="h-8 px-2 text-[#b42318]"
                        busy={busyAction === `remove-group-user-${userId}`}
                        onClick={() =>
                          void runAction(
                            `remove-group-user-${userId}`,
                            "Utilisateur retiré du groupe.",
                            () => administrationApi.removeUserFromGroup(selectedGroup.id, userId),
                            refreshSelectedGroupUsers,
                          )
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

            <div className="flex flex-col gap-3 border-t border-[#ebe8e3] pt-5 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="Ajouter un utilisateur" htmlFor="group-new-user-id">
                  <input
                    id="group-new-user-id"
                    type="number"
                    min={1}
                    className={inputClassName}
                    placeholder="Identifiant utilisateur"
                    value={newUserId}
                    onChange={(event) => setNewUserId(event.target.value)}
                  />
                </Field>
              </div>
              <ActionButton
                disabled={!newUserId}
                busy={busyAction === "add-group-user"}
                onClick={async () => {
                  const success = await runAction(
                    "add-group-user",
                    "Utilisateur ajouté au groupe.",
                    () => administrationApi.addUserToGroup(selectedGroup.id, Number(newUserId)),
                    refreshSelectedGroupUsers,
                  );
                  if (success) setNewUserId("");
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Ajouter
              </ActionButton>
            </div>

            <div className="border-t border-[#ebe8e3] pt-5">
              <ActionButton
                variant="danger"
                className="w-full"
                busy={busyAction === `delete-group-${selectedGroup.id}`}
                onClick={() => {
                  if (!window.confirm(`Supprimer le groupe « ${selectedGroup.name} » ?`)) return;
                  void runAction(
                    `delete-group-${selectedGroup.id}`,
                    "Groupe supprimé.",
                    () => administrationApi.deleteGroup(selectedGroup.id),
                    async () => {
                      await refreshGroups();
                      setSelectedGroup(null);
                      setGroupUsers([]);
                    },
                  );
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Supprimer ce groupe
              </ActionButton>
            </div>
          </div>
        )}
      </Panel>
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
