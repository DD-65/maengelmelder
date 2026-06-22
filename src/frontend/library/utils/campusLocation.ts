import { buildingCoordinates } from "../constants/buildingCoordinates";

export type Campus = "KL" | "LD";
export type Coordinates = {
  latitude: number;
  longitude: number;
};

type CampusDefinition = {
  center: [number, number];
  bounds: [[number, number], [number, number]];
};

// Bounding boxes of the Kaiserslautern and Landau map views.
export const campusBounds: Record<Campus, CampusDefinition> = {
  KL: {
    center: [49.424341, 7.754280],
    bounds: [
      [49.4180, 7.7450],
      [49.4300, 7.7650],
    ],
  },
  LD: {
    center: [49.204066, 8.107626],
    bounds: [
      [49.17853, 8.09364],
      [49.21614, 8.13774],
    ],
  },
};

export function getCampusForCoordinates(latitude: number, longitude: number): Campus | null {
  for (const campus of Object.keys(campusBounds) as Campus[]) {
    const [[south, west], [north, east]] = campusBounds[campus].bounds;
    if (latitude >= south && latitude <= north && longitude >= west && longitude <= east) {
      return campus;
    }
  }

  return null;
}

export function getDistanceInMetres(
  latitude: number,
  longitude: number,
  [targetLatitude, targetLongitude]: [number, number],
): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(targetLatitude - latitude);
  const longitudeDelta = toRadians(targetLongitude - longitude);
  const startLatitude = toRadians(latitude);
  const endLatitude = toRadians(targetLatitude);

  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function getNearestBuildingForCoordinates(latitude: number, longitude: number): string | null {
  const campus = getCampusForCoordinates(latitude, longitude);
  if (!campus) return null;

  let nearestBuilding: string | null = null;
  let nearestDistance = Infinity;

  for (const [building, coordinates] of Object.entries(buildingCoordinates)) {
    if (getCampusForCoordinates(coordinates[0], coordinates[1]) !== campus) continue;

    const distance = getDistanceInMetres(latitude, longitude, coordinates);
    if (distance < nearestDistance) {
      nearestBuilding = building;
      nearestDistance = distance;
    }
  }

  return nearestBuilding;
}
