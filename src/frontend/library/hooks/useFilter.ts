import { useState } from "react";

export function useFilter(){
    // Variablen fuer Filter und Filterwerte + Funktionen um diese zu setten
    const [currentFilter, setCurrentFilter] = useState("");
    const [currentFilterValue, setCurrentFilterValue] = useState("");
    const possibleFilters = [
        "Kategorie",
        "Ort",
        //"User", war nicht gefordert, dann eben nicht.
        "Status",

    ];
    return{currentFilter, setCurrentFilter, currentFilterValue, setCurrentFilterValue, possibleFilters};
}