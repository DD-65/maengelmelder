import { useState } from "react";
import { Issue } from "../types/Issue";


export function useFilter(unfilteredIssueList: Issue[], userEmail: string) {
    // Variablen fuer Filter und Filterwerte + Funktionen um diese zu setten
    const [currentFilter, setCurrentFilter] = useState("");
    const [currentFilterValue, setCurrentFilterValue] = useState("");
    const [filterOnlyOwn, setFilterOnlyOwn] = useState(false);
    const possibleFilters = [
        "Kategorie",
        "Ort",
        //"User", war nicht gefordert, dann eben nicht.
        "Status",
        
    ];
    
    //tatsächliche Filterung der Issues basierend auf dem aktuellen Filter und Filterwert
    const filteredIssues = unfilteredIssueList.filter(issue => issueMatchesCurrentFilter(issue) && issueMatchesOnlyOwnFilter(issue));

    // Constants für mögliche Filterwerte je Filter, dynamisch abgeleitet basierend auf den Daten der Issues

    const possibleFilterValues: Record<string, string[]> = {
        Kategorie: Array.from(new Set(unfilteredIssueList.map(issue => issue.kategorie).filter((x): x is string => Boolean(x)))),
        Ort: Array.from(new Set(unfilteredIssueList.flatMap(issue => {
            if (!issue.location) return [];
            const building = issue.location.split(/[-\s/\\._]+/)[0];
            return [building, issue.location]; // Returns both "46" and "46-210"
        }))).sort(),
        User: Array.from(new Set(unfilteredIssueList.map(issue => issue.user_email).filter((x): x is string => Boolean(x)))),
        Status: Array.from(new Set(unfilteredIssueList.map(issue => issue.status).filter((x): x is string => Boolean(x)))),
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