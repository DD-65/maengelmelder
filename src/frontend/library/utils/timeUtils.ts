// Changes timestampt into a readable format like "Day.Month.Year um Hours:Minutes Uhr" 
export function formatTimestamp(dateString?: string): string {
    if (!dateString) return "";
    
    const safeString = dateString.includes("T") ? dateString : dateString.replace(" ", "T") + "Z";
    const date = new Date(safeString);
  
    if (isNaN(date.getTime())) return "";
  
    const datePart = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timePart = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  
    return `${datePart} um ${timePart} Uhr`;
}

// Calculates relative time and formats it as "vor X Minuten/Stunden/Tagen/Wochen/Monaten/Jahren" or "gerade eben" if it's less than a minute ago
export function getRelativeTime(dateString?: string): string {
    if (!dateString) return "";
  
    const safeString = dateString.includes("T") ? dateString : dateString.replace(" ", "T") + "Z";
    const date = new Date(safeString);
  
    if (isNaN(date.getTime())) return "";
  
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return "gerade eben";
  
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30.44);
    const diffYear = Math.floor(diffDay / 365.25);
  
    if (diffYear >= 1) return `vor ${diffYear} ${diffYear === 1 ? 'Jahr' : 'Jahren'}`;
    if (diffMonth >= 1) return `vor ${diffMonth} ${diffMonth === 1 ? 'Monat' : 'Monaten'}`;
    if (diffWeek >= 1) return `vor ${diffWeek} ${diffWeek === 1 ? 'Woche' : 'Wochen'}`;
    if (diffDay >= 1) return `vor ${diffDay} ${diffDay === 1 ? 'Tag' : 'Tagen'}`;
    if (diffHour >= 1) return `vor ${diffHour} ${diffHour === 1 ? 'Stunde' : 'Stunden'}`;
    if (diffMin >= 1) return `vor ${diffMin} ${diffMin === 1 ? 'Minute' : 'Minuten'}`;
    
    return "gerade eben";
}