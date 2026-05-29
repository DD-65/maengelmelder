import type { Request } from "express";

type QueryValue = Request["query"][string];

export type IssueFilter = {
  whereClause: string;
  params: unknown[];
};

export type IssueFilterOptions = {
  includeKategorie?: boolean;
  includeStatus?: boolean;
  includeLocation?: boolean;
  includeOnlyOwn?: boolean;
};

function getSingleQueryValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

// SQL-Sonderzeichen escapen wie in searchissues
function escapeLikeValue(value: string) {
  return value.replace(/[\\%_]/g, match => `\\${match}`);
}

// Queryparameter normalisieren und leere Werte ignorieren
function getCleanQueryString(query: Request["query"], key: string) {
  const value = getSingleQueryValue(query[key]);
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

// Filter aus der UI in SQL übersetzen
export function buildIssueFilter(query: Request["query"], userId: number | null, options: IssueFilterOptions = {}): IssueFilter {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const includeKategorie = options.includeKategorie ?? true;
  const includeStatus = options.includeStatus ?? true;
  const includeLocation = options.includeLocation ?? true;
  const includeOnlyOwn = options.includeOnlyOwn ?? true;
  const kategorie = getCleanQueryString(query, "kategorie");
  const status = getCleanQueryString(query, "status");
  const location = getCleanQueryString(query, "location");
  const onlyOwn = query.onlyOwn === "true";

  if (includeKategorie && kategorie) {
    clauses.push("maengel.kategorie = ?");
    params.push(kategorie);
  }

  if (includeStatus && status) {
    if (status === "Gelöscht") {
      clauses.push("maengel.is_deleted = 1");
    } else {
      clauses.push("maengel.status = ?");
      params.push(status);
    }
  }

  if (includeLocation && location) {
    clauses.push("maengel.location LIKE ? ESCAPE '\\'");
    params.push(`${escapeLikeValue(location)}%`);
  }

  if (includeOnlyOwn && onlyOwn) {
    clauses.push("maengel.user_id = ?");
    params.push(userId ?? -1);
  }

  return {
    whereClause: clauses.join(" AND "),
    params,
  };
}
