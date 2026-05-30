export function getBuildingFromLocation(location: string | null): string {
  if (!location) return "";

  const parts = location.trim().split(/(?:[/\\._]+|\s+(?=[0-9]))/);
  
  return parts[0].trim();
}