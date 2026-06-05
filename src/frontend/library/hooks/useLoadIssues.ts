import { Issue } from "../types/Issue";
import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export type LoadIssuesOptions = {
  archiv?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  kategorie?: string;
  status?: string;
  location?: string;
  onlyOwn?: boolean;
  sort?: "votes" | "createdAt" | "status";
  direction?: "asc" | "desc";
};

type IssuePagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type PaginatedIssueResponse = IssuePagination & {
  items: Issue[];
};

function normalizeLoadOptions(options?: boolean | LoadIssuesOptions): LoadIssuesOptions {
  if (typeof options === "boolean") {
    return { archiv: options };
  }

  return options ?? {};
}

function isPaginatedIssueResponse(data: unknown): data is PaginatedIssueResponse {
  return Boolean(data && typeof data === "object" && "items" in data && Array.isArray((data as PaginatedIssueResponse).items));
}

export function useLoadIssues(setIssueList: Dispatch<SetStateAction<Issue[]>>) {
  const [pagination, setPagination] = useState<IssuePagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // baut die Query für alte Archiv-Loads und neue paginierte Loads
  const buildIssuesUrl = useCallback((options?: boolean | LoadIssuesOptions) => {
    const normalizedOptions = normalizeLoadOptions(options);
    const params = new URLSearchParams();

    if (normalizedOptions.archiv) {
      params.set("archiv", "true");
    }

    if (normalizedOptions.search) {
      params.set("search", normalizedOptions.search);
    }

    if (normalizedOptions.kategorie) {
      params.set("kategorie", normalizedOptions.kategorie);
    }

    if (normalizedOptions.status) {
      params.set("status", normalizedOptions.status);
    }

    if (normalizedOptions.location) {
      params.set("location", normalizedOptions.location);
    }

    if (normalizedOptions.onlyOwn) {
      params.set("onlyOwn", "true");
    }

    if (normalizedOptions.sort) {
      params.set("sort", normalizedOptions.sort);
    }

    if (normalizedOptions.direction) {
      params.set("direction", normalizedOptions.direction);
    }

    if (normalizedOptions.page !== undefined || normalizedOptions.pageSize !== undefined) {
      params.set("page", String(normalizedOptions.page ?? 1));
      params.set("pageSize", String(normalizedOptions.pageSize ?? 20));
    }

    const query = params.toString();
    return `/api/mangel${query ? `?${query}` : ""}`;
  }, []);

  // issues aus db laden, optional direkt seitenweise
  const loadIssues = useCallback(async (options?: boolean | LoadIssuesOptions) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(buildIssuesUrl(options));
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Laden der Mängel");
      }

      // ohne Pagination kommt weiter das alte Array zurück
      if (Array.isArray(data)) {
        setIssueList(data);
        setPagination(null);
        return;
      }

      if (!isPaginatedIssueResponse(data)) {
        throw new Error("Unerwartete Antwort vom Server");
      }

      setIssueList(data.items);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Mängel");
    } finally {
      setIsLoading(false);
    }
  }, [buildIssuesUrl, setIssueList]);

  // issues in db löschen, die ersten drei Parameter bleiben wie vorher
  const deleteIssue = async (id: number, archiv: boolean = false, permanent: boolean = false, reloadOptions?: LoadIssuesOptions) => {
    const res = await fetch(`/api/mangel/${id}${permanent ? '?permanent=true' : ''}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Fehler beim Löschen des Mangels");
    }

    await loadIssues(reloadOptions ?? archiv);
  };

  return { loadIssues, deleteIssue, pagination, isLoading, error };

} 
 
