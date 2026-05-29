import type { Request } from "express";

type QueryValue = Request["query"][string];

export type IssueSearchFilter = {
  whereClause: string;
  params: string[];
};

function getSingleQueryValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

// SQL-Sonderzeichen escapen
function escapeLikeValue(value: string) {
  return value.replace(/[\\%_]/g, match => `\\${match}`);
}

// SQL-Teil für die Suche über Textfelder und Nutzer-Mail
export function buildIssueSearchFilter(query: Request["query"]): IssueSearchFilter {
  const rawSearch = getSingleQueryValue(query.search);
  const search = typeof rawSearch === "string" ? rawSearch.trim().toLowerCase() : "";

  if (!search) {
    return {
      whereClause: "",
      params: [],
    };
  }

  const searchValue = `%${escapeLikeValue(search)}%`;

  return {
    whereClause: `
      (
        LOWER(maengel.title) LIKE ? ESCAPE '\\'
        OR LOWER(COALESCE(maengel.description, '')) LIKE ? ESCAPE '\\'
        OR LOWER(COALESCE(maengel.location, '')) LIKE ? ESCAPE '\\'
        OR LOWER(COALESCE(users.email, '')) LIKE ? ESCAPE '\\'
      )
    `,
/* 
SQL optimierungs zeug:

suche mit like & doppelter wildcard ist zwar schnell, da im backend, kann aber keine indizes verwenden.
so löst man immer einen full table scan aus. ich hab mal etwas getestet, und bis 200K rows ist es praktisch instant,
und auch bei 1M rows ist man noch unter den 3s vom ursprünglichen work item ^^
theoretisch hat sqlite mit FTS5 eine optimierte suchfunktion, die kann aber keine substring search (Findet zB bei suche nach 'lan' nicht 'wlan').
für FTS5 gibt es einen trigram tokenizer, der könnte substring search, da hat man dann aber das problem dass man sowohl users als auch maengel 
in einen speziellen index packen müsste und diesen maintainen müsste, was insbesondere bei email änderungen dazu führt dass alle einträge neu indexiert werden müssen.
Die performance ist ja wirklich schon gut genug so, deswegen lasse ich das erstmal so
*/    
    params: [searchValue, searchValue, searchValue, searchValue],
  };
}
