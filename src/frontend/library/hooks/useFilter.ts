import { useState } from "react";
import { Issue } from "../types/Issue";

export type FilterOptionValues = Partial<Record<"Kategorie" | "Ort" | "Status" | "User" | "Gefolgte User", string[]>>;

export function useFilter(unfilteredIssueList: Issue[], userEmail: string, isArchiveMode: boolean = false, backendFilterOptions: FilterOptionValues = {}) {
    // Variablen fuer Filter und Filterwerte + Funktionen um diese zu setten
    const [currentFilter, setCurrentFilter] = useState("");
    const [currentFilterValue, setCurrentFilterValue] = useState("");
    const [filterOnlyOwn, setFilterOnlyOwn] = useState(false);
    const possibleFilters = [
        "Kategorie",
        "Ort",
        //"User", war nicht gefordert, dann eben nicht.
        "Status",
        // gefolgte User nur mit Login
        ...(userEmail ? ["Gefolgte User"] : []),
    ];
    
    //tatsächliche Filterung der Issues basierend auf dem aktuellen Filter und Filterwert
    const filteredIssues = unfilteredIssueList.filter(issue => issueMatchesCurrentFilter(issue) && issueMatchesOnlyOwnFilter(issue));

    // Constants für mögliche Filterwerte je Filter

    const possibleFilterValues: Record<string, string[]> = {
        Kategorie: backendFilterOptions.Kategorie ?? ["Steckdose", "Schlagloch", "WLAN", "Mobiliar", "Andere"],
        Ort: backendFilterOptions.Ort ?? Array.from(new Set(unfilteredIssueList.flatMap(issue => {
            if (!issue.location) return [];
            const building = issue.location.split(/[-\s/\\._]+/)[0];
            return [building, issue.location]; // Returns both "46" and "46-210"
        }))).sort(),
        User: Array.from(new Set(unfilteredIssueList.map(issue => issue.user_email).filter((x): x is string => Boolean(x)))),
        Status: backendFilterOptions.Status ?? (isArchiveMode
            ? ["Behoben", "Gelöscht"]
            : ["Gemeldet", "Akzeptiert", "Abgelehnt", "In Bearbeitung"]),
        "Gefolgte User": backendFilterOptions["Gefolgte User"] ?? [],
    };
    

    // dedizierte Funktionen um nur gueltige Filter und Werte setzbar zu machen
    function chooseFilter(chosenFilter: string) {
        if (possibleFilters.includes(chosenFilter)) {
            setCurrentFilter(chosenFilter);
        } else {
            setCurrentFilter("");
        }
        setCurrentFilterValue("");
    }
    
    function chooseFilterValue(filter: string, chosenValue: string) {
        if (possibleFilterValues[filter]?.includes(chosenValue)) {
            setCurrentFilterValue(chosenValue);
        } else {
            setCurrentFilterValue("");
        }
    }

    function issueMatchesCurrentFilter(issue: Issue) {
    if (!currentFilter || !currentFilterValue) return true;
    if (currentFilter === "Kategorie") return issue.kategorie === currentFilterValue;
    if (currentFilter === "Ort") return issue.location?.startsWith(currentFilterValue) ?? false;
    if (currentFilter === "User") return issue.user_email === currentFilterValue;
    if (currentFilter === "Status") return issue.status === currentFilterValue;
    if (currentFilter === "Gefolgte User") return (issue.user_username ?? issue.user_email) === currentFilterValue;
    return true;
  }

  function issueMatchesOnlyOwnFilter(issue: Issue) {
    if (filterOnlyOwn) return issue.user_email === userEmail;
    return true;
  }
    
    return {
        filteredIssues,
        currentFilter,
        setCurrentFilter,
        currentFilterValue,
        setCurrentFilterValue,
        possibleFilters,
        possibleFilterValues,
        chooseFilter,
        chooseFilterValue,
        filterOnlyOwn,
        setFilterOnlyOwn,
        issueMatchesCurrentFilter,
        issueMatchesOnlyOwnFilter
    };

}
