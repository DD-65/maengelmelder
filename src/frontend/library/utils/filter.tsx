const possibleFilterValues: Record<string, string[]> = {
    Kategorie: Array.from(new Set(issueList.map(issue => issue.kategorie).filter((x): x is string => Boolean(x)))),
    Ort: Array.from(new Set(issueList.flatMap(issue => {
      if (!issue.location) return [];
      const building = issue.location.split(/[-\s/\\._]+/)[0];
      return [building, issue.location]; // Returns both "46" and "46-210"
    }))).sort(),
    User: Array.from(new Set(issueList.map(issue => issue.user_email).filter((x): x is string => Boolean(x)))),
    Status: Array.from(new Set(issueList.map(issue => issue.status).filter((x): x is string => Boolean(x)))),
  };

  // dedizierte Funktionen um nur gueltige Filter und Werte setzbar zu machen
  function chooseFilterFromPossibleFilters(chosenFilter: string) {
    if (possibleFilters.includes(chosenFilter)) {
      setCurrentFilter(chosenFilter);
    } else {
      setCurrentFilter("");
    }
    setCurrentFilterValue("");
  }

  function chooseFilterValueFromPossibleValues(filter: string, chosenValue: string) {
    if (possibleFilterValues[filter]?.includes(chosenValue)) {
      setCurrentFilterValue(chosenValue);
    } else {
      setCurrentFilterValue("");
    }
  }