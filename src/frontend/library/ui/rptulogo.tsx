import { useEffect, useMemo, useState } from 'react';

const rptuLogoUrls = [
  '/RPTU-Brand/U_Farben/RPTU U.png',
  '/RPTU-Brand/U_Farben/RPTU U2.png',
  '/RPTU-Brand/U_Farben/RPTU U3.png',
  '/RPTU-Brand/U_Farben/RPTU U4.png',
  '/RPTU-Brand/U_Farben/RPTU U5.png',
  '/RPTU-Brand/U_Farben/RPTU U6.png',
  '/RPTU-Brand/U_Farben/RPTU U7.png',
  '/RPTU-Brand/U_Farben/RPTU U8.png',
  '/RPTU-Brand/U_Farben/RPTU U9.png',
  '/RPTU-Brand/U_Farben/RPTU U10.png',
  '/RPTU-Brand/U_Farben/RPTU U11.png',
  '/RPTU-Brand/U_Farben/RPTU U12.png',
];


//      So geht es jetzt, nicht anfassen pls :)
// useState darf hier nicht benutzt werden, ich glaube das zerschießt gerade die Webseite 
//export const [randomRptuLogo] = useMemo(() => { // random rptu logo für den Titel, wird einmalig beim Laden der Seite geladen
    const isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches; // light oder dark mode
    const allowedLogos = rptuLogoUrls.filter((url) =>
      isLightMode // matchen ob es sich um ein weißes oder schwarzes Logo handelt und entsprechend mit dem dark / light mode filtern
        ? !url.includes('RPTU U12.png')
        : !url.includes('RPTU U11.png'),
    );

    //return allowedLogos[Math.floor(Math.random() * allowedLogos.length)]; // zufälliges U wählen
  //} ,[]);
  export const randomRptuLogo =  allowedLogos[Math.floor(Math.random() * allowedLogos.length)];
