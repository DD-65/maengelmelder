function chooseSortingFromPossibleSortings(chosenSorting: string) {
    if (possibleSortings.includes(chosenSorting)) {
      setCurrentSorting(chosenSorting);
      setCurrentSortingMode(possibleSortingModes[chosenSorting][0]);
    } else {
      setCurrentSorting("");
      setCurrentSortingMode("");
    }
  }

  function chooseSortingModeFromPossibleSortingModes(filter: string, chosenValue: string) {
    if (possibleSortingModes[filter]?.includes(chosenValue)) {
      setCurrentSortingMode(chosenValue);
    } else {
      setCurrentSortingMode("");
    }
  }

  function currentComparator(a: Issue, b: Issue): number {
    if (!currentSorting || !currentSortingMode) return 0;

    if (currentSorting === "Votes") {
      const votesA = a.votes || 0;
      const votesB = b.votes || 0;
      if(currentSortingMode === "Aufsteigend") {
        if (votesA - votesB < 0) return -1;
        if (votesA - votesB > 0) return 1;
        return 0; 
      }
      else {
        if (votesB - votesA < 0) return -1;
        if (votesB - votesA > 0) return 1;
        return 0; 
      }
    }
    
    if (currentSorting === "Erstellungsdatum") {
      const dateA = new Date(a.created_at || "");
      const dateB = new Date(b.created_at || "");
      if(currentSortingMode === "Neueste zuerst") {
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        return 0; 
      }
      else {
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0; 
      }
    }
    
    if (currentSorting === "Status") {
      const statusOrder = ["Gemeldet", "Akzeptiert", "In Bearbeitung", "Behoben", "Abgelehnt"];
      const indexA = statusOrder.indexOf(a.status || "");
      const indexB = statusOrder.indexOf(b.status || "");
      
      if(currentSortingMode === "Aufsteigend") {
        if (indexA - indexB < 0) return -1;
        if (indexA - indexB > 0) return 1;
        return 0; 
      }
      else {
        if (indexB - indexA < 0) return -1;
        if (indexB - indexA > 0) return 1;
        return 0; 
      }
    }
    return 0;
  }