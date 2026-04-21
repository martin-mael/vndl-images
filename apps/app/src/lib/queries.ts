import { queryOptions } from "@tanstack/react-query";
import { listExports } from "@/server/fn/exports";
import { getProject, listProjects } from "@/server/fn/projects";
import { loadSimpleState } from "@/server/fn/simpleState";
import { getTemplate, listTemplates } from "@/server/fn/templates";

export const simpleStateQueryOptions = () =>
	queryOptions({
		queryKey: ["simpleState"] as const,
		queryFn: () => loadSimpleState(),
	});

export const projectsQueryOptions = () =>
	queryOptions({
		queryKey: ["projects"] as const,
		queryFn: () => listProjects(),
	});

export const projectQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["project", id] as const,
		queryFn: () => getProject({ data: { id } }),
	});

export const templatesQueryOptions = (projectId: string) =>
	queryOptions({
		queryKey: ["templates", projectId] as const,
		queryFn: () => listTemplates({ data: { projectId } }),
	});

export const templateQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["template", id] as const,
		queryFn: () => getTemplate({ data: { id } }),
	});

export const exportsQueryOptions = (projectId?: string) =>
	queryOptions({
		queryKey: ["exports", { projectId: projectId ?? null }] as const,
		queryFn: () => listExports({ data: projectId ? { projectId } : {} }),
	});
