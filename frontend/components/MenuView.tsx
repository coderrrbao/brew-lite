'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getProductImageUrl, formatPrice, type Category, type Product } from '@/lib/data';
import { useStore } from '@/lib/store';
import { PageShell, PlusIcon, Eyebrow } from './ui';

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'hot', label: 'Nóng' },
  { value: 'cold', label: 'Lạnh' },
  { value: 'specialty', label: 'Đặc biệt' },
];

const steps = [
  { n: '01', title: 'Chọn đồ uống', text: 'Size và topping theo ý bạn.' },
  { n: '02', title: 'Thanh toán không tiền mặt', text: 'Ví điện tử hoặc thẻ.' },
  { n: '03', title: 'Nhận tại quầy', text: 'Báo mã đơn, nhận ly ngay.' },
];

export default function MenuView({ products }: { products: Product[] }) {
  const [active, setActive] = useState<Category>('all');
  const { state } = useStore();
  const firstName = state.user?.name.split(' ').pop();

  const filtered = active === 'all' ? products : products.filter((p) => p.category === active);
  const featured = products.find((p) => p.id === 'cold-brew') ?? products[0];

  return (
    <PageShell wide>
      <section className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
        <div>
          <Eyebrow>{firstName ? `Chào ${firstName}` : 'Đặt trước, không xếp hàng'}</Eyebrow>
          <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">
            Hôm nay bạn muốn uống gì?
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Đặt đồ uống và thanh toán không tiền mặt chỉ trong vài chạm, rồi ghé quầy nhận ly khi đã pha xong.
          </p>
          <a
            href="#thuc-don"
            className="mt-7 inline-flex h-12 items-center rounded-full bg-primary px-7 text-[15px] font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Xem thực đơn
          </a>
        </div>

        <Link
          href={`/product/${featured.id}`}
          className="group relative block overflow-hidden rounded-xl bg-secondary"
        >
          <img
            src={getProductImageUrl(featured.imageId, 900, 720)}
            alt={featured.name}
            className="aspect-[5/4] w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-5 pt-16 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                Gợi ý hôm nay
              </p>
              <p className="font-display text-2xl font-semibold">{featured.name}</p>
            </div>
            <span className="tabular text-sm font-semibold">{formatPrice(featured.basePrice)}</span>
          </div>
        </Link>
      </section>

      <section aria-label="Quy trình đặt hàng" className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="flex items-start gap-4 bg-card p-5">
            <span className="font-display text-2xl font-semibold text-accent">{s.n}</span>
            <div>
              <p className="text-[15px] font-semibold">{s.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="thuc-don" className="scroll-mt-24 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold sm:text-4xl">Thực đơn</h2>
          <div role="tablist" aria-label="Lọc theo loại" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {categories.map((c) => {
              const selected = active === c.value;
              return (
                <button
                  key={c.value}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(c.value)}
                  className={`h-10 shrink-0 rounded-full border px-5 text-sm font-medium transition ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(35,21,16,0.25)]"
    >
      <div className="relative overflow-hidden bg-secondary">
        <img
          src={getProductImageUrl(product.imageId, 600, 480)}
          alt={product.name}
          loading="lazy"
          className="aspect-[5/4] w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.popular && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              Phổ biến
            </span>
          )}
          {product.stock <= 25 && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              Còn {product.stock}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="tabular text-base font-semibold">{formatPrice(product.basePrice)}</span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:bg-accent"
          >
            <PlusIcon size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}
