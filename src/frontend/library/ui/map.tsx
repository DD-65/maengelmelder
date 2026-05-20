import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Issue } from "../types/Issue";
import { buildingCoordinates } from "../constants/buildingCoordinates";
import { useViewMode } from "../hooks/useViewMode";


// hier müssen die Filter importiert werden, außerdem müssen die erst aus App raus gemacht werden.
// test commit
interface MapProperties{
    issuesToDisplay: Issue[];
    //issueMatches ...
}

export function Map(){



    return(<div style={{ width: '100%', height: '600px', position: 'relative', zIndex: 0 }}>
                <MapContainer center={[49.4244, 7.7531]} zoom={17} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

                {/* Pin Rendering */}
                {(() => {
                    // Same filters as list
                    const filteredIssues = issuesToDisplay
                    .filter(issueMatchesCurrentFilter)
                    .filter(issueMatchesOnlyOwnFilter);

                    // Issues per Building
                    const buildingIssueCount: Record<string, number> = {};
                    
                    filteredIssues.forEach(issue => {
                    if (issue.location) {
                        // Split the string to only show the building via regex
                        const building = issue.location.split(/[-\s/\\._]+/)[0];
                        if (building) {
                        buildingIssueCount[building] = (buildingIssueCount[building] || 0) + 1;
                        }
                    }
                    });

                    // Place pin for each building with at least one issue
                    return Object.entries(buildingIssueCount).map(([building, count]) => {
                    const coords = buildingCoordinates[building];
                    
                    // No pin for buildings without coordinates
                    if (!coords) return null;

                    // HTML Pin with count
                    const countIcon = L.divIcon({
                        html: `<div style="background-color: var(--danger); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${count}</div>`,
                        className: '',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });

                    return (<Marker key={building} position={coords} icon={countIcon} eventHandlers={{click: () => {setCurrentFilter("Ort"); setCurrentFilterValue(building); setViewMode("list")}}}/>);
                    });
                })()}
                </MapContainer>
            </div>)
    }
