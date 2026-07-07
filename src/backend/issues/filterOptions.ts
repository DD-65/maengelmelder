import type { Request } from "express";
import db from "../db.js";
import { buildIssueWhere } from "./issueWhere.js";
import { getBuildingFromLocation } from "./locationUtils.js";

type FilterOptionRow = {
  kategorie: string | null;
  status: string | null;
  location: string | null;
};

export type IssueFilterOptionsResponse = {
  kategorien: string[];
  status: string[];
  locations: string[];
  followedUsers: string[];
};

function sortValues(values: Set<string>) {
  return Array.from(values).sort((a, b) => a.localeCompare(b, "de"));
}

// alle User, denen der Nutzer folgt(Username, sonst E-Mail)
function getFollowedUserOptions(userId: number | null) {
  if (!userId) return [];

  const rows = db.prepare(`
    SELECT COALESCE(users.username, users.email) AS label
    FROM follows
    JOIN users ON users.id = follows.followed_id
    WHERE follows.follower_id = ?
  `).all(userId) as { label: string }[];

  return sortValues(new Set(rows.map(row => row.label)));
}

// liefert alle Filterwerte, nicht nur die Werte der aktuellen Seite
export function getIssueFilterOptions(userId: number | null, query: Request["query"]): IssueFilterOptionsResponse {
  const issueWhere = buildIssueWhere({
    userId,
    query,
    issueFilterOptions: {
      includeKategorie: false,
      includeStatus: false,
      includeLocation: false,
      includeOnlyOwn: true,
      includeByFollowedUser: false,
    },
  });

  if (!issueWhere.canAccess) {
    return {
      kategorien: [],
      status: [],
      locations: [],
      followedUsers: [],
    };
  }

  const rows = db.prepare(`
    SELECT
      maengel.kategorie,
      CASE
        WHEN maengel.is_deleted = 1 THEN 'Gelöscht'
        ELSE maengel.status
      END AS status,
      maengel.location
    FROM maengel
    LEFT JOIN users ON maengel.user_id = users.id
    ${issueWhere.whereClause}
  `).all(...issueWhere.params) as FilterOptionRow[];

  const kategorien = new Set<string>();
  const status = new Set<string>();
  const locations = new Set<string>();

  for (const row of rows) {
    if (row.kategorie) kategorien.add(row.kategorie);
    if (row.status) status.add(row.status);

    if (row.location) {
      const building = getBuildingFromLocation(row.location);
      if (building) locations.add(building);
      locations.add(row.location);
    }
  }

  return {
    kategorien: sortValues(kategorien),
    status: sortValues(status),
    locations: sortValues(locations),
    followedUsers: getFollowedUserOptions(userId),
  };
}
