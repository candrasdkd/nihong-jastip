export const SVGPlane = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
);

export const SVGFlagID = ({ className = "w-6 h-auto" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className={className}>
    <rect width="3" height="1" fill="#CE1126"/>
    <rect y="1" width="3" height="1" fill="#F0F0F0"/>
  </svg>
);

export const SVGFlagJP = ({ className = "w-6 h-auto" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className={className}>
    <rect width="3" height="2" fill="#F0F0F0"/>
    <circle cx="1.5" cy="1" r="0.6" fill="#BC002D"/>
  </svg>
);

export const SVGBarcode = ({ className = "w-full h-8" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20" preserveAspectRatio="none" className={className} fill="currentColor">
     <rect x="0" y="0" width="2" height="20" />
     <rect x="3" y="0" width="1" height="20" />
     <rect x="5" y="0" width="3" height="20" />
     <rect x="9" y="0" width="1" height="20" />
     <rect x="12" y="0" width="2" height="20" />
     <rect x="15" y="0" width="1" height="20" />
     <rect x="18" y="0" width="4" height="20" />
     <rect x="23" y="0" width="1" height="20" />
     <rect x="25" y="0" width="2" height="20" />
     <rect x="29" y="0" width="2" height="20" />
     <rect x="32" y="0" width="1" height="20" />
     <rect x="35" y="0" width="3" height="20" />
     <rect x="39" y="0" width="1" height="20" />
     <rect x="42" y="0" width="2" height="20" />
     <rect x="45" y="0" width="1" height="20" />
     <rect x="48" y="0" width="4" height="20" />
     <rect x="53" y="0" width="1" height="20" />
     <rect x="55" y="0" width="2" height="20" />
     <rect x="59" y="0" width="2" height="20" />
     <rect x="62" y="0" width="1" height="20" />
     <rect x="65" y="0" width="3" height="20" />
     <rect x="69" y="0" width="1" height="20" />
     <rect x="72" y="0" width="2" height="20" />
     <rect x="75" y="0" width="1" height="20" />
     <rect x="78" y="0" width="4" height="20" />
     <rect x="83" y="0" width="1" height="20" />
     <rect x="85" y="0" width="2" height="20" />
     <rect x="89" y="0" width="2" height="20" />
     <rect x="92" y="0" width="1" height="20" />
     <rect x="95" y="0" width="3" height="20" />
     <rect x="99" y="0" width="1" height="20" />
  </svg>
);