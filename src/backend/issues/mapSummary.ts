import type { Request } from "express";
import db from "../db.js";
import { buildIssueWhere } from "./issueWhere.js";
import { getBuildingFromLocation } from "./locationUtils.js";

type LocationRow = {
  location: string | null;
};

export type IssueMapSummaryItem = {
  building: string;
  count: number;
};

// zählt Mängel pro gebäude über alle passenden Treffer unabhängig von der jeweils geladenen seite
export function getIssueMapSummary(userId: number | null, query: Request["query"]): IssueMapSummaryItem[] {
  const issueWhere = buildIssueWhere({
    userId,
    query,
  });

  if (!issueWhere.canAccess) return [];

  const rows = db.prepare(`
    SELECT maengel.location
    FROM maengel
    LEFT JOIN users ON maengel.user_id = users.id
    ${issueWhere.whereClause}
  `).all(...issueWhere.params) as LocationRow[];

  const counts = new Map<string, number>();

  for (const row of rows) {
    if (!row.location) continue;

    const building = getBuildingFromLocation(row.location);
    if (!building) continue;

    counts.set(building, (counts.get(building) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([building, count]) => ({ building, count }))
    .sort((a, b) => a.building.localeCompare(b.building, "de"));
}
