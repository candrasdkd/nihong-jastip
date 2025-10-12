type TabId = 'dashboard' | 'orders' | 'customers' | 'calculator' | 'cash';

export function BottomTabBar({
    current,
    setTab,
}: {
    current: TabId;
    setTab: (t: TabId) => void;
}) {
    const Item = ({
        id, label, Icon,
    }: { id: TabId; label: string; Icon: (props: { className?: string }) => JSX.Element }) => {
        const active = current === id;
        return (
            <button
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`group flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition
          ${active
                        ? 'bg-[#0a2342] text-white'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                title={label}
            >
                <Icon className={`h-5 w-5 ${active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`} />
                <span className={`text-[11px] leading-none ${active ? 'font-semibold' : ''}`}>{label}</span>
            </button>
        );
    };

    return (
        <footer
            className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 dark:border-neutral-800
                 bg-white/80 dark:bg-neutral-950/80 backdrop-blur"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <nav className="max-w-7xl mx-auto px-3 py-2">
                <div className="grid grid-cols-5 gap-1">
                    <Item id="dashboard" label="Dashboard" Icon={IconHome} />
                    <Item id="orders" label="Pesanan" Icon={IconClipboard} />
                    <Item id="customers" label="Konsumen" Icon={IconUsers} />
                    <Item id="calculator" label="Kalkulator" Icon={IconCalculator} />
                    <Item id="cash" label="Kas" Icon={IconCash} />
                </div>
            </nav>
        </footer>
    );
}

/** Ikon SVG inline (tanpa lib tambahan) */
function IconHome({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
        </svg>
    );
}
function IconClipboard({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                d="M9 4h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V6a2 2 0 0 1 2-2z" />
            <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 6h6" />
        </svg>
    );
}
function IconUsers({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="3" strokeWidth="1.8" />
            <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                d="M16 3.13a3 3 0 0 1 0 5.75" />
        </svg>
    );
}
function IconCalculator({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="1.8" />
            <path strokeWidth="1.8" d="M8 7h8" />
            <path strokeWidth="1.8" d="M8 11h3M8 15h3M13 11h3M13 15h3" />
        </svg>
    );
}

function IconCash({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v8m0-8C9.243 4 7 5.343 7 7.5S9.243 11 12 11s5-1.343 5-3.5S14.757 4 12 4zM5 19h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z" />
        </svg>
    );
}
