"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button, DataTable, Panel, formatDateTime, type DataTableColumn } from "@mairie360/lib-components/primitives";

import { administrationApi, type ProjectWithoutGroup } from '@/lib/administration-api';
import { getActiveFrontHrefs } from '@/lib/navigation';

/**
 * Where « Choisir un groupe » leads: the project in the Projects front (its deep link, `?project=<id>`), where the
 * manager edits the project to give it a group. The Projects front reads no `edit` parameter.
 */
export function projectGroupHref(projectsFront: string | undefined, projectId: string) {
  if (!projectsFront) return undefined;
  const url = new URL(projectsFront);
  url.searchParams.set("project", projectId);
  return url.href;
}

/**
 * F21 (MAIR-683): projects created before the groups or whose group was deleted, above the groups, with
 * « Choisir un groupe » opening the project in the Projects front. Empty: « Tous les projets ont un groupe ».
 */
export function ProjectsWithoutGroup() {
  const [projects, setProjects] = useState<ProjectWithoutGroup[] | null>(null);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "default" | "error">("loading");
  const revision = useRef(0);
  const projectsFront = getActiveFrontHrefs().projects;
  const load = useCallback(async () => {
    const current = ++revision.current;
    setState("loading");
    try {
      const received = await administrationApi.listProjectsWithoutGroup();
      if (current !== revision.current) return;
      setProjects(received.projects);
      setTotal(received.total);
      setState("default");
    } catch {
      if (current === revision.current) setState("error");
    }
  }, []);
  useEffect(() => { void load(); return () => { revision.current += 1; }; }, [load]);

  const columns: DataTableColumn<ProjectWithoutGroup>[] = [
    { key: "title", header: "Projet", kind: "strong", cell: (project) => project.title },
    { key: "createdAt", header: "Créé le", cell: (project) => (project.createdAt ? formatDateTime(project.createdAt, "dateOnly") : null) ?? "—" },
    {
      key: "actions", header: "Actions", hideHeader: true, kind: "actions",
      cell: (project) => {
        const href = projectGroupHref(projectsFront, project.id);
        return href
          ? <Button variant="outline" tone="neutral" size="s" icon={ExternalLink} iconPosition="end" onClick={() => window.location.assign(href)}>Choisir un groupe</Button>
          : null;
      },
    },
  ];
  const tableState = state === "loading" ? "loading" : state === "error" ? "error" : (projects ?? []).length === 0 ? "empty" : "default";
  return (
    <Panel className="administration-panel" title={`Projets sans groupe${state === "default" ? ` (${total})` : ""}`} description="Projets créés avant les groupes ou dont le groupe a été supprimé." flush>
      <DataTable<ProjectWithoutGroup> label="Projets sans groupe" columns={columns} rows={projects ?? []} rowKey={(project) => project.id} state={tableState} skeletonRows={2}
        stateProps={tableState === "error"
          ? { title: "Les projets sans groupe sont indisponibles.", onRetry: () => void load() }
          : { title: "Tous les projets ont un groupe", description: "Rien à rattacher pour le moment." }} />
    </Panel>
  );
}
