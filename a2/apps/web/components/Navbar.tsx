'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { BagIcon, MenuIcon, ReceiptIcon, UserIcon, CupIcon } from './ui';

const links = [
  { to: '/', label: 'Thực đơn', end: true },
  { to: '/orders', label: 'Đơn hàng', end: false },
];

const hideMobileTabsOn = ['/product', '/cart', '/checkout'];

export default function Navbar() {
  const { cartCount, state } = useStore();
  const pathname = usePathname();
  const isActive = (to: string, end: boolean) => (end ? pathname === to : pathname.startsWith(to));
  const showTabs = !hideMobileTabsOn.some((p) => pathname.startsWith(p));
  const firstName = state.user?.name.split(' ').pop() ?? '';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="BrewLite - Trang chủ">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CupIcon size={18} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">BrewLite</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                aria-current={isActive(l.to, l.end) ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive(l.to, l.end)
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              aria-label={`Giỏ hàng, ${cartCount} món`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-secondary"
            >
              <BagIcon />
              {cartCount > 0 && (
                <span className="tabular absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {state.user ? (
              <Link
                href="/login"
                className="flex h-10 items-center gap-2 rounded-full bg-secondary pl-1.5 pr-4 text-sm font-medium transition hover:bg-secondary/70"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold uppercase text-accent-foreground">
                  {firstName[0]}
                </span>
                <span className="hidden max-w-[7rem] truncate sm:inline">{firstName}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </nav>
      </header>

      {showTabs && (
        <nav
          aria-label="Điều hướng chính"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur md:hidden"
        >
          {[
            { to: '/', icon: <MenuIcon />, label: 'Thực đơn', end: true },
            { to: '/orders', icon: <ReceiptIcon />, label: 'Đơn hàng', end: false },
            { to: '/login', icon: <UserIcon />, label: 'Tài khoản', end: false },
          ].map((t) => (
            <Link
              key={t.to}
              href={t.to}
              aria-current={isActive(t.to, t.end) ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium ${
                isActive(t.to, t.end) ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
