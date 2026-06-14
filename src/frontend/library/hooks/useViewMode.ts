import { useState } from "react";
export function useViewMode(){
    const [viewMode, setViewMode] = useState<'list' | 'map' | 'management' | 'users'>('list');
    return{viewMode, setViewMode};
}
