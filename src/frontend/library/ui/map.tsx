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

// hier müssen die Filter importiert werden, außerdem müssen die erst aus App raus gemacht werden.
// test commit
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

// creates custom cluster icon showing the total count of issues in the cluster
const creatClusterCustomIcon = (cluster: any) => {
    const childMarkers = cluster.getAllChildMarkers();
    let totalIssues = 0;

    childMarkers.forEach((marker: any) => {
        // saved in title to avoid creating a custom property on the marker
        totalIssues += parseInt(marker.options.title || "0", 10);
    });

    return L.divIcon({
            html: `<div style="background-color: var(--danger); color: white; width: 32px; height: 32px; 
            border-radius: 50%; display: flex; align-items: center; justify-content: center;">${totalIssues}</div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
};

export function Map({mapSummary,  setViewMode, setCurrentFilter, setCurrentFilterValue}:MapProperties){
    
    // state of campus selection, default is Kaiserslautern
    const [selectedCampus, setSelectedCampus] = useState<"KL" | "LD">("KL");

    return(
            <div style={{ width: '100%', height: '600px', position: 'relative', zIndex: 0 }}>

                {/* FLOATING CAMPUS TOGGLE */}
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    zIndex: 1000, // Forcing toogle to be above map
                    display: 'flex',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    backdropFilter: 'blur(10px)'
                }}>
                <div 
                    onClick={() => setSelectedCampus('KL')}
                    style={{
                        padding: '8px 14px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backgroundColor: selectedCampus === 'KL' ? 'var(--accent)' : 'transparent',
                        color: selectedCampus === 'KL' ? 'white' : 'var(--text)',
                        transition: 'all 0.2s ease'
                    }}>Kaiserslautern</div>
                <div 
                    onClick={() => setSelectedCampus('LD')}
                    style={{
                        padding: '8px 14px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backgroundColor: selectedCampus === 'LD' ? 'var(--accent)' : 'transparent',
                        color: selectedCampus === 'LD' ? 'white' : 'var(--text)',
                        transition: 'all 0.2s ease'
                    }}>Landau</div>
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

                {/* Cluster Pin Rendering */}
                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={creatClusterCustomIcon}
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

                        // HTML Pin with count
                        const countIcon = L.divIcon({
                            html: `<div style="background-color: var(--danger); color: white; width: 32px; height: 32px; 
                            border-radius: 50%; display: flex; align-items: center; justify-content: center;">${count}</div>`,
                            className: '',
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
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