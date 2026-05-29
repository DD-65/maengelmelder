import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from 'leaflet';
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

export function Map({mapSummary,  setViewMode, setCurrentFilter, setCurrentFilterValue}:MapProperties){
    //const{viewMode, setViewMode}=useViewMode();
    // const{
    //     setCurrentFilter,
    //     setCurrentFilterValue,
    //     issueMatchesCurrentFilter,
    //     issueMatchesOnlyOwnFilter
    // }=useFilter(issuesToDisplay, userEmail);


    return(<div style={{ width: '100%', height: '600px', position: 'relative', zIndex: 0 }}>
                <MapContainer center={[49.4244, 7.7531]} zoom={17} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 
                contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

                {/* Pin Rendering */}
                {(() => {
                    // Marker kommen aus dem Backend, damit sie nicht nur die aktuelle Seite zählen
                    return mapSummary.map(({building, count}) => {
                    const coords = buildingCoordinates[building];
                    
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

                    return (<Marker key={building} position={coords} icon={countIcon} eventHandlers={{click: () => 
                        {setCurrentFilter("Ort"); setCurrentFilterValue(building); setViewMode("list")}}}/>);
                    });
                })()}
                </MapContainer>
            </div>)
    }
