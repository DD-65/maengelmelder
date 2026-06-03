export function getUserColor(email = ''): string {
    const s = email.toLowerCase();
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    const r = (hash * 123) % 256;
    const g = (hash * 321) % 256;
    const b = (hash * 213) % 256;
    //prevent color from being too light
    const minBrightness = 100;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness < minBrightness) {
        const factor = minBrightness / brightness;
        return `rgb(${Math.min(255, Math.round(r * factor))}, ${Math.min(255, Math.round(g * factor))}, ${Math.min(255, Math.round(b * factor))})`;
    }
    //prevent color from being too dark
    const maxBrightness = 200;
    if (brightness > maxBrightness) {
        const factor = maxBrightness / brightness;
        return `rgb(${Math.min(255, Math.round(r * factor))}, ${Math.min(255, Math.round(g * factor))}, ${Math.min(255, Math.round(b * factor))})`;
    }
    //prevent color from being too close to white or black
    if (brightness > 240) {
        return `rgb(${Math.min(255, r - 20)}, ${Math.min(255, g - 20)}, ${Math.min(255, b - 20)})`;
    }
    if (brightness < 15) {
        return `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
};
export function getSecondaryUserColor(email = ''): string {
    const s = email.toLowerCase();
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    const r = (hash * 123) % 256;
    const g = (hash * 321) % 256;
    const b = (hash * 213) % 256;
    const secondaryR = (r + 128) % 256;
    const secondaryG = (g + 128) % 256;
    const secondaryB = (b + 128) % 256;
    return `rgb(${secondaryR}, ${secondaryG}, ${secondaryB})`;
};

