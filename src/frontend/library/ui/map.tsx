import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import L, { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildingCoordinates } from "../constants/buildingCoordinates";

export type MapSummaryItem = {
    building: string;
    count: number;
};

// Importing of Filters
interface MapProperties{
    mapSummary: MapSummaryItem[];
    setViewMode: React.Dispatch<React.SetStateAction<"list" | "map">>;
    setCurrentFilter: React.Dispatch<React.SetStateAction<string>>;
    setCurrentFilterValue: React.Dispatch<React.SetStateAction<string>>;
}

// Bounding boxes of Kaiserslautern and Landau campuses
const campusBounds = {
    KL: {
        center: [49.424341, 7.754280] as [number, number], // Campus Kaiserslautern
        // Format: [[SouthWest Lat, SouthWest Lng], [NorthEast Lat, NorthEast Lng]]
        bounds: [
            [49.4180, 7.7450], // South-West Boundary
            [49.4300, 7.7650]  // North-East Boundary
        ] as LatLngBoundsExpression
    },
    LD: {
        center: [49.204066, 8.107626] as [number, number], // Main Campus Landau
        bounds: [
            [49.17853, 8.09364], // South-West Boundary
            [49.21614, 8.13774]  // North-East Boundary
        ] as LatLngBoundsExpression
    }
};

const formatCompactNumber = (num: number): string => {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};

// Moves Map to either Kaiserslautern or Landau campus based on toggle Button
function CampusSwitcher({ campus }: { campus: "KL" | "LD" }) {
    const map = useMap();

    useEffect(() => {

        // prevents panning outside of bounds during flight
        map.options.maxBoundsViscosity = 1.0;

        const targetCenter = L.latLng(campusBounds[campus].center);
        const currentCenter = map.getCenter();

        if (currentCenter.distanceTo(targetCenter) < 100) {
            map.setMaxBounds(campusBounds[campus].bounds); // Ensure bounds are correct if already on campus
            return; // No need to fly if already centered
        }

        // remove bounds to fly
        map.setMaxBounds(null as any);

        // fly to other campus
        map.flyTo(campusBounds[campus].center, 16, {
            animate: true,
            duration: 1.5
        });

        const applyBoundsAfterFlight = () => {
            map.setMaxBounds(campusBounds[campus].bounds);
        }

        // reapply bounds
        map.once('moveend', applyBoundsAfterFlight);

        // cleanup function
        return () => {
            map.off('moveend', applyBoundsAfterFlight);
        };

    }, [campus, map]);

    return null;
}

// Indicator component that shows glowing edges when there are pins outside the current map view and in which direction they are located
function EdgeGlowIndicator({ mapSummary, selectedCampus }: { mapSummary: MapSummaryItem[], selectedCampus: "KL" | "LD" }) {
    const map = useMap();
    const [glowDirs, setGlowDirs] = useState({ top: false, bottom: false, left: false, right: false });

    useEffect(() => {
        const updateGlows = () => {
            const bounds = map.getBounds();
            
            // Waits for map to fully render
            if (!bounds.isValid()) return;

            const newGlows = { top: false, bottom: false, left: false, right: false };

            const activeCampusBounds = L.latLngBounds(campusBounds[selectedCampus].bounds as [[number, number], [number, number]]);

            mapSummary.forEach(({ building }) => {
                const buildingKey = Object.keys(buildingCoordinates).find(
                    (key) => key.toLowerCase() === building.toLowerCase()
                );
                
                if (!buildingKey) return;
                
                const coords = buildingCoordinates[buildingKey];
                const latLng = L.latLng(coords);

                // Pins outside the active campus get excluded
                if (!activeCampusBounds.contains(latLng)) return;
                
                // Visible pins get excluded
                if (bounds.contains(latLng)) return;

                // Direction of pin relative to the current view
                if (latLng.lat > bounds.getNorth()) newGlows.top = true;
                if (latLng.lat < bounds.getSouth()) newGlows.bottom = true;
                if (latLng.lng > bounds.getEast()) newGlows.right = true;
                if (latLng.lng < bounds.getWest()) newGlows.left = true;
            });

            setGlowDirs(newGlows);
        };

        // Recalculating for user movement, zoom and resizing
        map.on('move', updateGlows);
        map.on('zoomend', updateGlows);
        map.on('resize', updateGlows);
        
        updateGlows(); 

        return () => {
            map.off('move', updateGlows);
            map.off('zoomend', updateGlows);
            map.off('resize', updateGlows);
        };
    }, [map, mapSummary, selectedCampus]);

    const shadows = [];
    const glowColor = 'rgba(255, 107, 138, 0.4)'; // Color
    const spread = '15px'; // Size

    if (glowDirs.top) shadows.push(`inset 0 ${spread} 20px -10px ${glowColor}`);
    if (glowDirs.bottom) shadows.push(`inset 0 -${spread} 20px -10px ${glowColor}`);
    if (glowDirs.left) shadows.push(`inset ${spread} 0 20px -10px ${glowColor}`);
    if (glowDirs.right) shadows.push(`inset -${spread} 0 20px -10px ${glowColor}`);

    if (shadows.length === 0) return null;

    return (
        <div 
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 999, // Over the map, but under UI elements
                pointerEvents: 'none', // User can click through the glow
                boxShadow: shadows.join(', '),
                transition: 'box-shadow 0.3s ease-in-out',
                borderRadius: 'inherit'
            }} 
        />
    );
}


// creates custom cluster icon showing the total count of issues in the cluster
const createClusterCustomIcon = (cluster: any) => {
    const childMarkers = cluster.getAllChildMarkers();
    let totalIssues = 0;

    childMarkers.forEach((marker: any) => {
        // saved in title to avoid creating a custom property on the marker
        totalIssues += parseInt(marker.options.title || "0", 10);
    });

    const displayTotal = formatCompactNumber(totalIssues);

    return L.divIcon({
            html: `
            <div aria-label="${totalIssues} Mängel in diesem Bereich zusammengefasst" role="button" tabindex="0" style="display: flex; justify-content: center;">
                <svg viewBox="0 0 36 48" width="42" height="56" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.059 27.941 0 18 0z" fill="var(--accent)" />
                    <circle cx="18" cy="18" r="12" fill="white" />
                    <text x="18" y="22.5" fill="var(--accent)" font-size="12px" font-weight="900" font-family="sans-serif" text-anchor="middle">${displayTotal}</text>
                </svg>
            </div>`,
            className: '',
            iconSize: [42, 56],
            iconAnchor: [21, 56] 
        });
};

export function Map({mapSummary,  setViewMode, setCurrentFilter, setCurrentFilterValue}:MapProperties){
    
    // state of campus selection, default is Kaiserslautern
    const [selectedCampus, setSelectedCampus] = useState<"KL" | "LD">("KL");

    return(
            <div className="map-container" style={{ width: '100%', height: '600px', position: 'relative', zIndex: 0 }}>

                <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    zIndex: 1000, 
                    display: 'flex',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px', 
                    padding: '0', 
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    backdropFilter: 'blur(10px)'
                }}>
                <button 
                    type="button"
                    aria-label="Campus Kaiserslautern anzeigen"
                    aria-pressed={selectedCampus === 'KL'}
                    onClick={() => setSelectedCampus('KL')}
                    style={{
                        appearance: 'none', 
                        outline: 'none',
                        border: 'none',
                        margin: 0,
                        fontFamily: 'inherit',
                        padding: '8px 14px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: selectedCampus === 'KL' ? 'var(--accent)' : 'transparent',
                        color: selectedCampus === 'KL' ? 'white' : 'var(--text)',
                        borderRadius: 0,
                        boxShadow: 'none',
                        opacity: 1,
                        transition: 'all 0.2s ease'
                    }}>Kaiserslautern</button>
                <button 
                    type="button"
                    aria-label="Campus Landau anzeigen"
                    aria-pressed={selectedCampus === 'LD'}
                    onClick={() => setSelectedCampus('LD')}
                    style={{
                        appearance: 'none', 
                        outline: 'none',
                        border: 'none',
                        margin: 0,
                        fontFamily: 'inherit',
                        padding: '8px 14px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: selectedCampus === 'LD' ? 'var(--accent)' : 'transparent', 
                        color: selectedCampus === 'LD' ? 'white' : 'var(--text)',
                        borderRadius: 0, 
                        boxShadow: 'none', 
                        opacity: 1, 
                        transition: 'all 0.2s ease'
                    }}>Landau</button>
                </div>

                <MapContainer 
                    center={campusBounds.KL.center} 
                    zoom={17} 
                    minZoom={15} // prevents zooming out too far
                    maxZoom={18} // prevents zooming in too far
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                    >

                <CampusSwitcher campus={selectedCampus} />

                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 
                contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

                <EdgeGlowIndicator mapSummary={mapSummary} selectedCampus={selectedCampus} />

                {/* Cluster Pin Rendering */}
                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createClusterCustomIcon}
                    maxClusterRadius={40} // Adjust cluster radius as needed
                    >

                    {/* Pin Rendering */}
                    {(() => {
                        // Marker kommen aus dem Backend, damit sie nicht nur die aktuelle Seite zählen
                        return mapSummary.map(({building, count}) => {    
                            const buildingKey = Object.keys(buildingCoordinates).find(
                                (key) => key.toLowerCase() === building.toLowerCase()
                        );

                        const coords = buildingKey ? buildingCoordinates[buildingKey] : null;
                        
                        // No pin for buildings without coordinates
                        if (!coords) return null;

                        const displayCount = formatCompactNumber(count);

                        // HTML Pin with count
                        const countIcon = L.divIcon({
                            html: `
                            <div aria-label="${count} Mängel an Gebäude ${building}" role="button" tabindex="0" style="display: flex; justify-content: center;">
                                <svg viewBox="0 0 36 48" width="36" height="48" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.059 27.941 0 18 0z" fill="var(--danger)" />
                                    <circle cx="18" cy="18" r="12" fill="white" />
                                    <text x="18" y="22" fill="var(--danger)" font-size="11px" font-weight="900" font-family="sans-serif" text-anchor="middle">${displayCount}</text>
                                </svg>
                            </div>`,
                            className: '',
                            iconSize: [36, 48],
                            iconAnchor: [18, 48]
                        });

                        return (<Marker key={building} position={coords} icon={countIcon} title={count.toString()} eventHandlers={{click: () => 
                            {setCurrentFilter("Ort"); setCurrentFilterValue(building); setViewMode("list"); window.scrollTo({ top: 0, behavior: 'smooth' });}}}/>);
                        });
                    })()}
                </MarkerClusterGroup>
                </MapContainer>
            </div>
            );
    }