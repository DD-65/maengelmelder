import { useEffect, useState } from 'react';

const logoColors = [
  "Blaugrau", 
  "Dunkelblau", 
  "Dunkelgrün", 
  "Grüngrau", 
  "Hellblau", 
  "Hellgrün", 
  "Orange", 
  "Pink", 
  "Rot", 
  "Violett"
];

/**
 * Hook zum Abrufen des dynamischen Logopfads basierend auf dem Design und einer Zufallsfarbe.
 */
export function useDynamicLogo() {
  const [randomColor] = useState(() => logoColors[Math.floor(Math.random() * logoColors.length)]);
  const [theme, setTheme] = useState(() => {
      const stored = document.documentElement.dataset.theme;
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.dataset.theme;
          if (newTheme === 'light' || newTheme === 'dark') {
            setTheme(newTheme);
          } else {
            // Falls theme entfernt wird, auf Systemeinstellung zurückgreifen
            setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    
    // Auch auf Änderungen der Systemeinstellung achten, falls nicht manuell überschrieben
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
        if (!document.documentElement.dataset.theme || document.documentElement.dataset.theme === 'system') {
            setTheme(e.matches ? 'dark' : 'light');
        }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
        observer.disconnect();
        mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const textColor = theme === 'dark' ? 'Weiß' : 'Schwarz';
  return `/logos/${textColor}${randomColor}.webp`;
}

// Alten Export für Kompatibilität beibehalten, falls nötig.
// Das neue System basiert auf Bildern.
export const randomRptuLogo = '/RPTU-Brand/U_Farben/RPTU U.png';
