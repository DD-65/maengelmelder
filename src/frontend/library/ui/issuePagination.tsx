type IssuePaginationProperties = {
  page: number;
  total: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

// kleine Seitensteuerung für die paginiert geladenen Mängel
export function IssuePagination({ page, total, totalPages, isLoading, onPageChange }: IssuePaginationProperties) {
  const safeTotalPages = Math.max(totalPages, 1);
  // wann wird was 
  const showFirstPageButton = page > 2;
  const showBackButton = page > 1;
  const showForwardButton = page < safeTotalPages;
  const showLastPageButton = page < safeTotalPages - 1;
  const issueCountLabel = total === 1 ? "Mangel" : "Mängel";

  return (
    <nav className="issue-pagination" aria-label="Mängel-Seiten">
      {showFirstPageButton && (
        <button type="button" className="issue-pagination-small-button" onClick={() => onPageChange(1)} disabled={isLoading}>
          1
        </button>
      )}
      {showBackButton && (
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={isLoading}>
          Zurück
        </button>
      )}
      <span className="issue-pagination-info">
        Seite {page} von {safeTotalPages} ({total} {issueCountLabel})
      </span>
      {showForwardButton && (
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={isLoading}>
          Weiter
        </button>
      )}
      {showLastPageButton && (
        <button type="button" className="issue-pagination-small-button" onClick={() => onPageChange(safeTotalPages)} disabled={isLoading}>
          {safeTotalPages}
        </button>
      )}
    </nav>
  );
}
