import { useState } from "react";
export function useViewMode(){
    const [viewMode, setViewMode] = useState<'list' | 'map' | 'management'>('list');
    return{viewMode, setViewMode};
}
