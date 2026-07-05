import type { Request } from "express";
import db from "../db.js";
import { buildIssueWhere } from "./issueWhere.js";
import { buildIssueSort } from "./sortIssues.js";

type QueryValue = Request["query"][string];

type IssueRow = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  status: string;
  kategorie: string | null;
  created_at: string;
  votes: number;
  image_url: string | null;
  thumbnail_url: string | null;
  statusComment: string | null;
  commentCount: number;
  user_email: string | null;
  user_id: number | null;
  has_voted: number;
  is_private: number; 
  is_author_followed: number;
  reactions?: { emoji: string; count: number }[];
};

export type PaginatedIssues = {
  items: IssueRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ListIssuesOptions = {
  userId: number | null;
  query: Request["query"];
};

function getSingleQueryValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: QueryValue, fallback: number) {
  const rawValue = getSingleQueryValue(value);
  const parsed = typeof rawValue === "string" ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// debug query plan 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function explainQueryPlan(sql: string, params: unknown[]) {
  if (process.env.NODE_ENV === "production") return;

  const plan = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params);
  console.table(plan);
}

// haupt-sql:
// lädt Mängel mit allen Feldern, die das Frontend für Liste und Karte braucht
function selectIssues(whereClause: string, whereParams: unknown[], userId: number | null, orderByClause: string, limitClause = "") {
  const stmt = db.prepare(`
    SELECT
      maengel.id,
      maengel.title,
      maengel.description,
      maengel.location,
      CASE 
        WHEN maengel.is_deleted = 1 THEN 'Gelöscht'
        ELSE maengel.status
      END AS status,
      maengel.kategorie,
      maengel.created_at,
      maengel.votes,
      maengel.image_url,
      maengel.thumbnail_url,
      maengel_kommentare.kommentar AS statusComment,
      (
        SELECT COUNT(*)
        FROM maengel_kommentare alle_kommentare
        WHERE alle_kommentare.mangel_id = maengel.id
      ) AS commentCount,
      users.email AS user_email,
      users.username AS user_username,
      users.profile_pic_url AS user_profile_pic_url,
      maengel.user_id,
      CASE
        WHEN ? IS NULL THEN 0
        ELSE EXISTS (
          SELECT 1
          FROM mangel_votes
          WHERE mangel_votes.user_id = ?
            AND mangel_votes.mangel_id = maengel.id
        )
      END AS has_voted,
      maengel.is_private,
      CASE
        WHEN ? IS NULL THEN 0
        ELSE EXISTS (
          SELECT 1
          FROM follows
          WHERE follows.follower_id = ?
            AND follows.followed_id = maengel.user_id
        )
      END AS is_author_followed,
      CASE
        WHEN ? IS NULL THEN NULL
        ELSE (
          SELECT emoji FROM mangel_reactions 
          WHERE mangel_id = maengel.id AND user_id = ?
        )
      END AS user_reaction,
      (
        SELECT json_group_array(json_object('emoji', emoji, 'count', c))
        FROM (
          SELECT emoji, COUNT(*) as c
          FROM mangel_reactions
          WHERE mangel_id = maengel.id
          GROUP BY emoji
          ORDER BY c DESC
        )
      ) AS reactions_json
    FROM maengel
    LEFT JOIN users ON maengel.user_id = users.id
    LEFT JOIN maengel_kommentare ON maengel_kommentare.id = maengel.statusComment_id
    -- hier werden die verschiedensten Bedingungen aus den Filtern angehängt (muss als sql kommentar ups)
    ${whereClause}
    ${orderByClause}
    ${limitClause}
  `);

  // WRITTEN WITH THE HELP OF GEMINI 3.1 PRO EXTENDED
const rows = stmt.all(userId, userId, userId, userId, userId, userId, ...whereParams) as (IssueRow & { reactions_json: string, user_reaction: string | null })[];
  
  return rows.map(row => {
    const parsedReactions = JSON.parse(row.reactions_json || '[]');
    return {
      ...row,
      reactions: parsedReactions.filter((r: { emoji: string | null }) => r.emoji !== null)
    };
  }) as IssueRow[];
}
// END OF AI CODE

// zählt die mängel mit denselben Berechtigungen wie die eigentliche Liste (filterfunktionalität)
// damit die richtige Anzahl in der UI stehen kann
function countIssues(whereClause: string, whereParams: unknown[]) {
  const row = db.prepare(`
    SELECT COUNT(*) AS total
    FROM maengel
    LEFT JOIN users ON maengel.user_id = users.id
    ${whereClause}
  `).get(...whereParams) as { total: number };

  return row.total;
}

export function listIssues(options: ListIssuesOptions): IssueRow[] | PaginatedIssues {
  // ohne page/pageSize bleibt die alte Array-Response fürs bestehende Frontend erhalten zu testzwecken
  const usePagination = options.query.page !== undefined || options.query.pageSize !== undefined;
  const page = parsePositiveInt(options.query.page, 1);
  // pageSize begrenzen, damit der Endpoint nicht wieder aus Versehen alles lädt
  const pageSize = Math.min(parsePositiveInt(options.query.pageSize, 20), 100);
  const offset = (page - 1) * pageSize;
  const issueWhere = buildIssueWhere({
    userId: options.userId,
    query: options.query,
  });
  const orderByClause = buildIssueSort(options.query);

  // Privacy filter
  const privacySql = `(maengel.is_private = 0 OR maengel.user_id = ? OR (SELECT role FROM users WHERE id = ?) IN ('admin', 'superadmin'))`;
  
  if (issueWhere.whereClause.trim() === "") {
    issueWhere.whereClause = `WHERE ${privacySql}`;
  } else {
    issueWhere.whereClause += ` AND ${privacySql}`;
  }
  issueWhere.params.push(options.userId, options.userId);

  // ausgeloggte Nutzer bekommen im Archiv keine Mängel zurück
  if (!issueWhere.canAccess) {
    if (!usePagination) return [];

    return {
      items: [],
      page,
      pageSize,
      total: 0,
      totalPages: 0,
    };
  }

  if (!usePagination) { // alte Antwort ohne Pagination, damit die ui auch so funktioniert zu testzwecken
    return selectIssues(
      // filter dranhängen auch bei alter Antwort, damit die Suche auch ohne Pagination funktioniert (suche im frontend wurde rausgenommen)
      issueWhere.whereClause,
      issueWhere.params,
      options.userId,
      orderByClause
    );
  }

  const total = countIssues(issueWhere.whereClause, issueWhere.params);
  const items = selectIssues(
    issueWhere.whereClause,
    [...issueWhere.params, pageSize, offset],
    options.userId,
    orderByClause,
    "LIMIT ? OFFSET ?"
  );

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}