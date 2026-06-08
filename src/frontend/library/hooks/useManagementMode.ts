import { useState } from "react";

export function useManagementMode() {
    const [isManagementMode, setIsManagementMode] = useState(false);
    return { isManagementMode, setIsManagementMode };
}
