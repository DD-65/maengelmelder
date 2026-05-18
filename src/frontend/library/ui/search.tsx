import { useState } from 'react';
import Fuse from 'fuse.js';
import { useIssueList, Issue } from '../hooks/issue';


export function useSearchStuff() {
    const {issueList} = useIssueList();

    const [searchView, setSearchView] = useState<"search" | null>(null);
    const [query, setQuery] = useState('');
    // Fuse erstellen, für Suche benötigt
    const fuse = new Fuse(issueList, {
        includeScore: true,
        ignoreLocation: true,
        threshold: 0.3,
        minMatchCharLength: 3,
        keys: [
          { name: "location", weight: 0.4 },
          { name: "title", weight: 0.25 }, 
          { name: "description", weight: 0.25 },
          { name: "user_email", weight: 0.1 },
        ],
      });
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedQueryForNumberSearch = normalizedQuery.replace(/\D/g, "");

    function normalizeNumberSearchValue(value?: string | null) {
        return value?.toLowerCase().replace(/\D/g, "") ?? "";
    }

    function issueMatchesShortSearch(issue: Issue) {
        const searchableValues = [
        issue.location,
        issue.title, 
        issue.description,
        issue.user_email,
        //issue.kategorie,
        //issue.status,
        ];
        const matchesText = searchableValues.some(value =>
        value?.toLowerCase().includes(normalizedQuery)
        );
        const matchesNumberPattern = Boolean(normalizedQueryForNumberSearch) && searchableValues.some(value =>
        normalizeNumberSearchValue(value).includes(normalizedQueryForNumberSearch)
        );

        return matchesText || matchesNumberPattern;
    }

    const searchIssueList = !normalizedQuery
            ? issueList
        : normalizedQuery.length < 3
        ? issueList.filter(issueMatchesShortSearch)
        // Issues mit fuzzy search mit score belegen 0 ist exacte übereinstimmung 1 das Gegenteil
        : fuse.search(normalizedQuery).map(result => result.item);
    const issuesToDisplay = searchView ? searchIssueList : issueList;

    return {issuesToDisplay, searchView, setSearchView, query, setQuery};
}