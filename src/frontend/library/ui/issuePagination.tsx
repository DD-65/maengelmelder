type IssuePaginationProperties = {
  page: number;
  total: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  const safePage = Math.min(Math.max(page, 1), totalPages);

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const startPage = Math.max(2, safePage - 1);
  const endPage = Math.min(totalPages - 1, safePage + 1);
  const items: PaginationItem[] = [1];

  if (startPage > 2) {
    items.push("ellipsis-left");
  }

  for (let currentPage = startPage; currentPage <= endPage; currentPage += 1) {
    items.push(currentPage);
  }

  if (endPage < totalPages - 1) {
    items.push("ellipsis-right");
  }

  items.push(totalPages);
  return items;
}

function getPageButtonClassName(pageNumber: number, currentPage: number, totalPages: number) {
  const classNames = ["issue-page-button"];

  if (pageNumber === currentPage) {
    classNames.push("is-active");
  }

  if (pageNumber !== 1 && pageNumber !== totalPages && pageNumber !== currentPage) {
    classNames.push("issue-page-context");
  }

  return classNames.join(" ");
}

// kleine Seitensteuerung für die paginiert geladenen Mängel
export function IssuePagination({ page, total, totalPages, isLoading, onPageChange }: IssuePaginationProperties) {
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const paginationItems = getPaginationItems(safePage, safeTotalPages);
  const issueCountLabel = total === 1 ? "Mangel" : "Mängel";
  const formattedTotal = new Intl.NumberFormat("de-DE").format(total);

  return (
    <nav className="issue-pagination" aria-label="Mängel-Seiten">
      <div className="issue-pagination-pages">
        <button
          type="button"
          className="issue-page-button issue-page-arrow"
          onClick={() => onPageChange(safePage - 1)}
          disabled={isLoading || safePage <= 1}
          aria-label="Vorherige Seite"
        >
          ‹
        </button>

        {paginationItems.map((item) => {
          if (typeof item !== "number") {
            return (
              <span key={item} className="issue-page-ellipsis" aria-hidden="true">
                …
              </span>
            );
          }

          const isActivePage = item === safePage;

          return (
            <button
              key={item}
              type="button"
              className={getPageButtonClassName(item, safePage, safeTotalPages)}
              onClick={() => onPageChange(item)}
              disabled={isLoading || isActivePage}
              aria-current={isActivePage ? "page" : undefined}
              aria-label={isActivePage ? `Aktuelle Seite, Seite ${item}` : `Seite ${item}`}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          className="issue-page-button issue-page-arrow"
          onClick={() => onPageChange(safePage + 1)}
          disabled={isLoading || safePage >= safeTotalPages}
          aria-label="Nächste Seite"
        >
          ›
        </button>
      </div>

      <span className="issue-pagination-info">
        Seite {safePage} von {safeTotalPages} · {formattedTotal} {issueCountLabel}
      </span>
    </nav>
  );
}
