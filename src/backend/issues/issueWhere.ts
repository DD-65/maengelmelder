import type { Request } from "express";
import db from "../db.js";
import { buildIssueFilter, type IssueFilterOptions } from "./filterIssues.js";
import { buildIssueSearchFilter } from "./searchIssues.js";

export type IssueWhere = {
  whereClause: string;
  params: unknown[];
  canAccess: boolean;
};

type BuildIssueWhereOptions = {
  userId: number | null;
  query: Request["query"];
  includeSearch?: boolean;
  includeIssueFilters?: boolean;
  issueFilterOptions?: IssueFilterOptions;
};

// entscheidet, welche Mängel der aktuelle Nutzer (im archiv) sehen darf
function buildArchiveScope(userId: number | null, isArchive: boolean): IssueWhere {
  if (!isArchive) {
    return {
      whereClause: "WHERE (maengel.status != 'Behoben' OR maengel.status IS NULL) AND maengel.is_deleted = 0",
      params: [],
      canAccess: true,
    };
  }

  if (!userId) {
    return {
      whereClause: "",
      params: [],
      canAccess: false,
    };
  }

  const user = db
    .prepare("SELECT role FROM users WHERE id = ?")
    .get(userId) as { role: string } | undefined;

  if (user?.role === "admin" || user?.role === "manager") {
    return {
      whereClause: "WHERE (maengel.status = 'Behoben' OR maengel.is_deleted = 1)",
      params: [],
      canAccess: true,
    };
  }

  return {
    whereClause: "WHERE (maengel.status = 'Behoben' OR maengel.is_deleted = 1) AND maengel.user_id = ?",
    params: [userId],
    canAccess: true,
  };
}

// zusätzliche Bedingungen an die vorhandenen Archiv-Bedingungen hängen
function appendWhereFilters(whereClause: string, filterClauses: string[]) {
  const activeFilters = filterClauses.filter(Boolean);
  if (activeFilters.length === 0) return whereClause;
  return `${whereClause} AND ${activeFilters.join(" AND ")}`;
}

// gemeinsame funktion für Liste, Filteroptionen und Map
export function buildIssueWhere({
  userId,
  query,
  includeSearch = true,
  includeIssueFilters = true,
  issueFilterOptions,
}: BuildIssueWhereOptions): IssueWhere {
  const archiveScope = buildArchiveScope(userId, query.archiv === "true");

  if (!archiveScope.canAccess) {
    return archiveScope;
  }

  const searchFilter = includeSearch ? buildIssueSearchFilter(query) : { whereClause: "", params: [] };
  const issueFilter = includeIssueFilters ? buildIssueFilter(query, userId, issueFilterOptions) : { whereClause: "", params: [] };

  return {
    whereClause: appendWhereFilters(archiveScope.whereClause, [searchFilter.whereClause, issueFilter.whereClause]),
    params: [...archiveScope.params, ...searchFilter.params, ...issueFilter.params],
    canAccess: true,
  };
}
