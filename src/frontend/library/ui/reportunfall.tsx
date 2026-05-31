import { useDynamicLogo } from '../utils/rptulogo';

export function Reportunfall() {
    const logoPath = useDynamicLogo();

    return (
        <img 
            src={logoPath} 
            alt="Report Unfall Logo" 
            className="logo-image"
        />
    );
}
