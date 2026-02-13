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

export const IconsGenzPlanner = {
  PlaneUp: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 22h20"/><path d="M8 3.5A2.5 2.5 0 0 0 5.5 6c0 5 2.5 6 2.5 6h10l-2-6h2l3 6h-3l-2 3H9l2-3H3c-1.1 0-2-.9-2-2s.9-2 2-2h4l1.5-3.5z"/>
      <path d="M12 13l2.5 3" />
    </svg>
  ),
  PlaneDown: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <path d="M2 22h20"/><path d="M18 3.5a2.5 2.5 0 0 1 2.5 2.5c0 5-2.5 6-2.5 6H8l2-6H8l-3 6h3l2 3h6l-2-3h6c1.1 0 2-.9 2-2s-.9-2-2-2h-4l-1.5-3.5z"/>
       <path d="M12 13l-2.5 3" />
    </svg>
  ),
  Sparkle: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9.75 12a2.25 2.25 0 0 1-2.25 2.25A2.25 2.25 0 0 1 5.25 12 2.25 2.25 0 0 1 7.5 9.75 2.25 2.25 0 0 1 9.75 12Zm11.25 0a2.25 2.25 0 0 1-2.25 2.25 2.25 2.25 0 0 1-2.25-2.25 2.25 2.25 0 0 1 2.25-2.25 2.25 2.25 0 0 1 2.25 2.25Zm-3-8.25a2.25 2.25 0 0 1-2.25 2.25 2.25 2.25 0 0 1-2.25-2.25 2.25 2.25 0 0 1 2.25-2.25 2.25 2.25 0 0 1 2.25 2.25ZM12 15.75a2.25 2.25 0 0 1-2.25 2.25 2.25 2.25 0 0 1-2.25-2.25 2.25 2.25 0 0 1 2.25-2.25 2.25 2.25 0 0 1 2.25 2.25Z" />
      <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25H15a.75.75 0 0 1 0 1.5h-2.25V9a.75.75 0 0 1-1.5 0V6.75H9a.75.75 0 0 1 0-1.5h2.25V3a.75.75 0 0 1 .75-.75ZM6 15a.75.75 0 0 1 .75.75v2.25H9a.75.75 0 0 1 0 1.5H6.75V21.75a.75.75 0 0 1-1.5 0V19.5H3a.75.75 0 0 1 0-1.5h2.25V15.75A.75.75 0 0 1 6 15Zm12 0a.75.75 0 0 1 .75.75v2.25H21a.75.75 0 0 1 0 1.5h-2.25V21.75a.75.75 0 0 1-1.5 0V19.5H15a.75.75 0 0 1 0-1.5h2.25V15.75A.75.75 0 0 1 18 15Z" opacity="0.6"/>
    </svg>
  ),
  Luggage: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="6" y="7" width="12" height="13" rx="2" ry="2"></rect>
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
    </svg>
  )
};