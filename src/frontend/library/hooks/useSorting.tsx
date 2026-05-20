import { useState } from 'react';
export function useSorting(){
    const [currentSorting, setCurrentSorting] = useState("");
    const [currentSortingMode, setCurrentSortingMode] = useState("");
    const possibleSortings = [
        "Votes",
        "Erstellungsdatum",
        "Status"
    ];
    const possibleSortingModes: Record<string, string[]> = {
        Votes: ["Aufsteigend", "Absteigend"],
        Erstellungsdatum: ["Neueste zuerst", "Älteste zuerst"],
        Status: ["Aufsteigend", "Absteigend"]
    };
    return{currentSorting, setCurrentSorting, currentSortingMode, setCurrentSortingMode, possibleSortings, possibleSortingModes};
}