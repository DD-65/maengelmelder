import type { Request } from "express";

type QueryValue = Request["query"][string];

// standard soriterung auch übernommen (Kann hier angepasst werden)
const DEFAULT_SORT = "ORDER BY maengel.votes DESC, maengel.created_at DESC, maengel.id DESC";

function getSingleQueryValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

// Richtung nur aus erlaubten Werten parsen
function parseSortDirection(value: QueryValue) {
  const direction = getSingleQueryValue(value);
  return direction === "asc" ? "ASC" : "DESC";
}

// Status hat immer noch diese feste Reihenfolge als sql switch
function getStatusSortExpression() {
  return `
    CASE
      WHEN maengel.is_deleted = 1 THEN 6
      WHEN maengel.status = 'Gemeldet' THEN 1
      WHEN maengel.status = 'Akzeptiert' THEN 2
      WHEN maengel.status = 'In Bearbeitung' THEN 3
      WHEN maengel.status = 'Behoben' THEN 4
      WHEN maengel.status = 'Abgelehnt' THEN 5
      ELSE 99
    END
  `;
}

// übersetzt die Sortierung aus der UI in ORDER-BY die dann verwendet / importiert werden kann
export function buildIssueSort(query: Request["query"]) {
  const sort = getSingleQueryValue(query.sort);
  const direction = parseSortDirection(query.direction);

  if (sort === "votes") {
    return `ORDER BY maengel.votes ${direction}, maengel.created_at DESC, maengel.id DESC`;
  }

  if (sort === "createdAt") {
    return `ORDER BY maengel.created_at ${direction}, maengel.id DESC`;
  }

  if (sort === "status") {
    return `ORDER BY ${getStatusSortExpression()} ${direction}, maengel.created_at DESC, maengel.id DESC`;
  }

  return DEFAULT_SORT;
}
