import { useMemo, useRef, useState } from "react";
import exifr from "exifr";
import { useInput } from "../hooks/useInput"
import { useGeolocation } from "../hooks/useGeolocation";
import { rooms } from "../constants/rooms";
import { buildingCoordinates } from "../constants/buildingCoordinates";
import {
  getCampusForCoordinates,
  getDistanceInMetres,
  getNearestBuildingForCoordinates,
  type Coordinates,
} from "../utils/campusLocation";
import { toast } from "react-toastify";
import type { ChangeEvent, FocusEvent, KeyboardEvent, SubmitEvent } from "react";

type InputFormProperties = {
  onIssueCreated: () => void;
  isRestricted: boolean;
};

type LocationSuggestion = {
  value: string;
  building: string | null;
  isBuilding: boolean;
  distance: number | null;
};

type ImageLocationState = "idle" | "reading" | "available" | "missing" | "outside" | "error";

const buildingNames = Object.keys(buildingCoordinates);
const availableLocations = Array.from(new Set([...buildingNames, ...rooms]));

function getBuildingForLocation(value: string): string | null {
  if (Object.hasOwn(buildingCoordinates, value)) return value;

  const building = value.split("-")[0];
  return Object.hasOwn(buildingCoordinates, building) ? building : null;
}

function formatDistance(distance: number): string {
  if (distance < 1_000) {
    const roundedDistance = Math.max(5, Math.round(distance / 5) * 5);
    return `${roundedDistance} m`;
  }

  return `${(distance / 1_000).toFixed(1)} km`;
}

export function InputForm({onIssueCreated, isRestricted}: InputFormProperties){
  const{title, setTitle,description, setDescription, location, setLocation, kategorie, setKategorie, image, setImage, isPrivate, setIsPrivate, addIssue}=useInput(onIssueCreated);
  const { permission, location: userLocation, error: locationError, isLocating, requestLocation } = useGeolocation();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [imageCoordinates, setImageCoordinates] = useState<Coordinates | null>(null);
  const [imageLocationState, setImageLocationState] = useState<ImageLocationState>("idle");
  const hasRequestedLocation = useRef(false);
  const imageMetadataRequestId = useRef(0);
  const isLocationUnavailable = permission === "denied" || permission === "unsupported" || Boolean(locationError);

  const allSuggestions = useMemo<LocationSuggestion[]>(() => {
    return availableLocations.map((value) => {
      const building = getBuildingForLocation(value);
      const distance = userLocation && building
        ? getDistanceInMetres(
            userLocation.latitude,
            userLocation.longitude,
            buildingCoordinates[building],
          )
        : null;

      return {
        value,
        building,
        isBuilding: Object.hasOwn(buildingCoordinates, value),
        distance,
      };
    });
  }, [userLocation]);

  const closestBuilding = useMemo(() => {
    return allSuggestions
      .filter((suggestion) => suggestion.isBuilding && suggestion.distance !== null)
      .sort((left, right) => (left.distance ?? Infinity) - (right.distance ?? Infinity))[0]?.value ?? null;
  }, [allSuggestions]);

  const visibleSuggestions = useMemo(() => {
    const query = location.trim().toLocaleLowerCase("de");
    const matches = allSuggestions.filter((suggestion) => {
      if (!query) return suggestion.isBuilding;
      return suggestion.value.toLocaleLowerCase("de").includes(query);
    });

    matches.sort((left, right) => {
      const distanceDifference = (left.distance ?? Infinity) - (right.distance ?? Infinity);
      if (distanceDifference !== 0) return distanceDifference;
      return left.value.localeCompare(right.value, "de", { numeric: true });
    });

    return matches.slice(0, query ? 6 : 4);
  }, [allSuggestions, location]);

  const openLocationSuggestions = () => {
    setIsLocationOpen(true);
    setActiveSuggestionIndex(-1);

    if (
      !hasRequestedLocation.current
      && !userLocation
      && permission !== "denied"
      && permission !== "unsupported"
    ) {
      hasRequestedLocation.current = true;
      requestLocation();
    }
  };

  const selectLocation = (value: string) => {
    setLocation(value);
    setActiveSuggestionIndex(-1);
  };

  const applyCoordinatesAsLocation = (coordinates: Coordinates, sourceLabel: string) => {
    if (!getCampusForCoordinates(coordinates.latitude, coordinates.longitude)) {
      toast.error(`${sourceLabel} liegt außerhalb der Campusbereiche.`);
      return;
    }

    const building = getNearestBuildingForCoordinates(coordinates.latitude, coordinates.longitude);
    if (!building) {
      toast.error(`Für ${sourceLabel.toLocaleLowerCase("de")} konnte kein Gebäude ermittelt werden.`);
      return;
    }

    setLocation(building);
    setIsLocationOpen(true);
    setActiveSuggestionIndex(-1);
  };

  const useDeviceLocation = async () => {
    const nextLocation = await requestLocation();
    if (!nextLocation) {
      toast.error(locationError ?? "Dein Standort konnte nicht verwendet werden.");
      return;
    }

    applyCoordinatesAsLocation(nextLocation, "Dein Standort");
  };

  const useImageLocation = () => {
    if (!imageCoordinates || imageLocationState !== "available") return;
    applyCoordinatesAsLocation(imageCoordinates, "Der Bildstandort");
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const requestId = imageMetadataRequestId.current + 1;
    imageMetadataRequestId.current = requestId;
    setImage(file);
    setImageCoordinates(null);

    if (!file) {
      setImageLocationState("idle");
      return;
    }

    setImageLocationState("reading");

    try {
      const metadataLocation = await exifr.gps(file);
      if (requestId !== imageMetadataRequestId.current) return;

      if (
        !metadataLocation
        || !Number.isFinite(metadataLocation.latitude)
        || !Number.isFinite(metadataLocation.longitude)
      ) {
        setImageLocationState("missing");
        return;
      }

      const coordinates = {
        latitude: metadataLocation.latitude,
        longitude: metadataLocation.longitude,
      };

      setImageCoordinates(coordinates);
      setImageLocationState(
        getCampusForCoordinates(coordinates.latitude, coordinates.longitude) ? "available" : "outside",
      );
    } catch {
      if (requestId === imageMetadataRequestId.current) {
        setImageLocationState("error");
      }
    }
  };

  const imageLocationTitle = imageLocationState === "reading"
    ? "Bildstandort wird gelesen …"
    : imageLocationState === "available"
      ? "Standort aus Bild verwenden"
      : imageLocationState === "outside"
        ? "Bildstandort liegt außerhalb der Campusbereiche"
        : imageLocationState === "missing"
          ? "Bild enthält keine GPS-Standortdaten"
          : "Bildstandort konnte nicht gelesen werden";

  const handleLocationBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsLocationOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleLocationKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isLocationOpen || visibleSuggestions.length === 0) {
      if (event.key === "ArrowDown") openLocationSuggestions();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => Math.min(current + 1, visibleSuggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      selectLocation(visibleSuggestions[activeSuggestionIndex].value);
    } else if (event.key === "Escape") {
      setIsLocationOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    if (isRestricted) {
      event.preventDefault();
      toast.error("🫪 Dein Konto ist eingeschränkt. Du kannst keine neuen Mängel melden.");
      return;
    }

    try {
      await addIssue(event);
    } catch (error) {
      toast.error(`🫪 ${error instanceof Error ? error.message : "Mangel konnte nicht gespeichert werden"}`);
    }
  };
  
    return(
          <form className="issue-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Titel" value={title} disabled={isRestricted} onChange={(event) => setTitle(event.target.value)} />

            <div className={`location-wrapper${image ? " has-image-location-action" : ""}`} onBlur={handleLocationBlur}>
              <span className="location-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Gebäude, Raum oder Ort"
                value={location}
                disabled={isRestricted}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setIsLocationOpen(true);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={openLocationSuggestions}
                onKeyDown={handleLocationKeyDown}
                autoComplete="off"
                role="combobox"
                aria-label="Ort"
                aria-autocomplete="list"
                aria-expanded={isLocationOpen}
                aria-controls="location-suggestions"
                aria-activedescendant={activeSuggestionIndex >= 0 ? `location-suggestion-${activeSuggestionIndex}` : undefined}
              />

              <div className="location-input-actions">
                <button
                  type="button"
                  className="location-source-button"
                  aria-label="Aktuellen Standort verwenden"
                  title={isLocating ? "Standort wird ermittelt …" : "Aktuellen Standort verwenden"}
                  disabled={isLocating}
                  aria-busy={isLocating}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={useDeviceLocation}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
                  </svg>
                </button>

                {image && (
                  <button
                    type="button"
                    className="location-source-button"
                    aria-label="Standort aus Bild verwenden"
                    title={imageLocationTitle}
                    disabled={imageLocationState !== "available"}
                    aria-busy={imageLocationState === "reading"}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={useImageLocation}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M14.5 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2" strokeLinecap="round" />
                      <circle cx="8" cy="9" r="2" />
                      <path d="m4 17 4-4 3.5 3 2-2 1.5 1.5M18.5 6.5a3 3 0 0 0-3 3c0 2.3 3 5.5 3 5.5s3-3.2 3-5.5a3 3 0 0 0-3-3Z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="18.5" cy="9.5" r="0.7" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                )}
              </div>

              {isLocationOpen && (visibleSuggestions.length > 0 || isLocating || locationError) && (
                <div className="room-suggestions" id="location-suggestions" role="listbox">
                  {!location.trim() && (
                    <div className="room-suggestions-heading">
                      {isLocating ? "Standort wird ermittelt …" : userLocation ? "In deiner Nähe" : "Gebäude"}
                    </div>
                  )}
                  {isLocationUnavailable && !userLocation && (
                    <div className="room-suggestions-status">Entfernungen sind momentan nicht verfügbar.</div>
                  )}
                  {visibleSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.value}
                      id={`location-suggestion-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestionIndex}
                      className="room-item"
                      data-active={index === activeSuggestionIndex}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectLocation(suggestion.value)}
                    >
                      <span className="room-item-icon" aria-hidden="true">
                        {suggestion.isBuilding ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M5 21V4h11v17M16 9h3v12M3 21h18M8 8h2m3 0h1M8 12h2m3 0h1M8 16h2m3 0h1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M5 21h14M7 21V4h10v17M13.5 12h.01" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="room-item-copy">
                        <span className="room-item-name">{suggestion.value}</span>
                        <span className="room-item-kind">
                          {suggestion.isBuilding ? "Gebäude" : suggestion.building ? `Raum, Gebäude ${suggestion.building}` : "Ort"}
                        </span>
                      </span>
                      <span className="room-item-meta">
                        {suggestion.value === closestBuilding && <span className="nearest-label">Am nächsten</span>}
                        {suggestion.distance !== null && <span className="room-item-distance">{formatDistance(suggestion.distance)}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select value={kategorie} disabled={isRestricted} onChange={(event) => setKategorie(event.target.value)}>
              <option value="">Kategorie wählen</option>
              <option value="Steckdose">Steckdose</option>
              <option value="Schlagloch">Schlagloch</option>
              <option value="WLAN">WLAN</option>
              <option value="Mobiliar">Mobiliar</option>
              <option value="Andere">Andere</option>  {/* Als Option, wie gewollt */}
            </select>
            <input type="file" accept="image/*" disabled={isRestricted} onChange={handleImageChange} />
            <textarea 
              className="beschreibung-input" 
              placeholder="Beschreibung des Mangels" 
              value={description} 
              disabled={isRestricted}
              // Regex that removes linebreaks, tabs, and other control characters, and limits the length to 200 characters
              onChange={(event) => {
                const sanitizedText = event.target.value
                  .replace(/[\r\n\t]+/g, ' ')
                  // Control characters are intentionally removed from submitted descriptions.
                  // eslint-disable-next-line no-control-regex
                  .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
                  .slice(0, 200);
                setDescription(sanitizedText);
              }} 
              // Disable Enter key to prevent new lines in the textarea
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
              maxLength={200} 
            />

            {/* Checkbox to mark issues as private */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <input 
                type="checkbox" 
                id="isPrivate" 
                checked={isPrivate} 
                disabled={isRestricted}
                onChange={(e) => setIsPrivate(e.target.checked)} 
              />
              <label htmlFor="isPrivate" style={{ fontSize: '14px', cursor: 'pointer' }}>
                Mangel als Privat markieren
              </label>
            </div>

            <button type="submit">Posten</button>
          </form>
    )
}
