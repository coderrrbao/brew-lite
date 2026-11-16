import type { ReactNode, SVGProps } from 'react';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';
export const btnAccent =
  'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-accent text-accent-foreground font-semibold text-[15px] transition hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';
export const btnOutline =
  'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-border bg-card text-foreground font-semibold text-[15px] transition hover:bg-secondary active:scale-[0.98]';
export const inputCls =
  'w-full h-12 px-4 rounded-xl border border-border bg-card text-[15px] text-foreground placeholder:text-muted-foreground/70 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';
export const cardCls = 'rounded-xl border border-border bg-card';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

export function PageShell({
  children,
  className = '',
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <main
      className={`mx-auto w-full px-5 sm:px-8 pt-8 sm:pt-12 pb-36 md:pb-20 ${
        wide ? 'max-w-6xl' : 'max-w-5xl'
      } ${className}`}
    >
      {children}
    </main>
  );
}

export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-5 pt-3 pb-4 backdrop-blur md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      {children}
    </div>
  );
}

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const BagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" />
    <path d="M17 9.5h1.5a2 2 0 0 1 0 4H17" />
    <path d="M8 4v1.5M12 4v1.5" />
  </Svg>
);
export const ReceiptIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);
export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </Svg>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const MinusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.4">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const StarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5z" />
  </Svg>
);
export const StoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9" />
    <path d="M10 20v-5h4v5" />
  </Svg>
);
export const SpinnerIcon = (p: IconProps) => (
  <Svg {...p} className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
  </Svg>
);
export const WalletIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
    <path d="M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z" />
    <circle cx="16" cy="13.5" r="1" />
  </Svg>
);
export const CardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3 10h18M7 15h3" />
  </Svg>
);
export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 21h4" />
  </Svg>
);
export const CupIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 5h12l-1.3 14.2a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3L6 5z" />
    <path d="M6.5 10h11" />
  </Svg>
);
