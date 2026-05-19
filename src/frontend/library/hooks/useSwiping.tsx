import { useState } from "react";

export function useSwiping(setViewMode: React.Dispatch<React.SetStateAction<"list" | "map">>){
    // Swiping logic
    const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
    
    // Start of swiping Handler
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        const target = e.target as HTMLElement;

        if (target.closest('.leaflet-container')) return; // Ignore touches on the map
        
        if ('touches' in e) {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY }); // Either per Touch
        } else {
        setTouchStart({ x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY }); // Or per Mouse
        }
    };

    // End of swiping Handler
    const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
        if (!touchStart) return;

        let touchEndX: number = 0, touchEndY: number = 0;

        if ('changedTouches' in e) {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        } else {
        touchEndX = (e as React.MouseEvent).clientX;
        touchEndY = (e as React.MouseEvent).clientY;
        }

        const deltaX = touchEndX - touchStart.x;
        const deltaY = touchEndY - touchStart.y;  

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) { // Horizontal swipe with some vertical tolerance
        if (deltaX > 0) {
            setViewMode('list'); // Swipe right to go to list
        } else {
            setViewMode('map'); // Swipe left to go to map
        }
        }

        setTouchStart(null); // Reset touch start
    };
    return{handleTouchStart, handleTouchEnd};
}