import { Issue } from "../types/Issue";

interface SearchbarProperties {
  query : string;
  setQuery : React.Dispatch<React.SetStateAction<string>>;
  searchView: "search"|null;
  setSearchView: React.Dispatch<React.SetStateAction<"search" | null>>;
  issuesToDisplay: Issue[];
}

export function Searchbar({query, setQuery, searchView, setSearchView, issuesToDisplay} : SearchbarProperties){

  return (
          <div className="search-bar" >
            <input
                type="text"
                placeholder="Suche..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchView("search")}
                onBlur={() => {
                  if (query.length === 0) setSearchView(null);
                }}
            />
            {(query.length > 0 || searchView === "search") && (
              <button className="search-clear-button" aria-label="Suche schließen" onClick={(e) => {e.stopPropagation();setQuery("");setSearchView(null);}}>
                X
              </button>
            )}
          </div>)
}
