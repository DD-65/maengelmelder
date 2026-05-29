import { useState } from "react";
export function useViewMode(){
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    return{viewMode, setViewMode};
}
