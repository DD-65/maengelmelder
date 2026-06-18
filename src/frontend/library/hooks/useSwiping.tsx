import React, { useState } from "react";

const swipe_ignore_items = '.swipe-ignore, .leaflet-container, .settings-pane, select, input, textarea, button, .newsfeedContainer';

export function useSwiping(
    viewMode: 'list' | 'map' | 'management' | 'users',
    setViewMode: (val: 'list' | 'map' | 'management' | 'users') => void,
    isArchiveMode: boolean,
    setIsArchiveMode: (val: boolean) => void,
    isManagementMode: boolean,
    setIsManagementMode: (val: boolean) => void,
    isLoggedIn: boolean
) {
    // Swiping logic
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);

    // Start of swiping Handler
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        const target = e.target as HTMLElement;

        // dauerhafter fix für falsches Swiping: wenn auf unerwünschten Elementen getippt wird, wird das Swiping nicht gestartet
        // müssen evtl laufend ergänzt werden, je nachdem, welche Elemente noch Probleme machen
        if (target.closest(swipe_ignore_items)) {
            setTouchStart(null);
            return;
        }

        if ('touches' in e) {
            setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY }); // Either per Touch
        } else {
            setTouchStart({ x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY }); // Or per Mouse
        }
    };

    // End of swiping Handler
    const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
        if (!touchStart) return;

        let touchEndX: number;
        let touchEndY: number;

        if ('changedTouches' in e) {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
        } else {
            touchEndX = (e as React.MouseEvent).clientX;
            touchEndY = (e as React.MouseEvent).clientY;
        }

        const deltaX = touchEndX - touchStart.x;
        const deltaY = touchEndY - touchStart.y;

        // Touch-Start sofort resetten, um potenzielles doppeltes Auslösen zu verhindern
        setTouchStart(null);

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) { // Horizontal swipe with some vertical tolerance
            if (deltaX > 0) { // Swipe right (Rückwärts: Management -> Archiv -> Karte -> Liste)
                if (isManagementMode && isLoggedIn) {
                    setIsManagementMode(false);
                    setIsArchiveMode(true);
                    setViewMode('list');
                } else if (isArchiveMode) {
                    setIsArchiveMode(false);
                    setViewMode('map');
                } else if (viewMode === 'map') {
                    setViewMode('list');
                }

            } else { // Swipe left (Vorwärts: Liste -> Karte -> Archiv -> Management)
                if (viewMode === 'list' && !isArchiveMode) {
                    setViewMode('map');
                } else if (viewMode === 'map' && isLoggedIn) {
                    setIsArchiveMode(true);
                    setViewMode('list');
                } else if (isArchiveMode && isLoggedIn) {
                    setIsManagementMode(true);
                    setIsArchiveMode(false);
                    setViewMode('management');
                }
            }
        }
    };
    return{handleTouchStart, handleTouchEnd};
}
