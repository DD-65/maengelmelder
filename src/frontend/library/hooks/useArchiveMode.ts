import { useState } from "react";

export function useArchiveMode() {
    const [isArchiveMode, setIsArchiveMode] = useState(false);
    return { isArchiveMode, setIsArchiveMode };
}
