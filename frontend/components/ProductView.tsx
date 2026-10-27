"use client";

import { useState } from "react";
import Link from "next/link";
import {
  sizes,
  toppings,
  getProductImageUrl,
  formatPrice,
  type Product,
} from "@/lib/data";
import { useStore, type CartItem } from "@/lib/store";
import {
  PageShell,
  StickyBar,
  Eyebrow,
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  btnPrimary,
} from "./ui";

export default function ProductView({ product }: { product: Product | null }) {
  const { dispatch, cartCount } = useStore();

  const [size, setSize] = useState<"S" | "M" | "L">("M");
  const [picked, setPicked] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <PageShell className="text-center">
        <h1 className="text-3xl font-semibold">Không tìm thấy sản phẩm</h1>
        <p className="mt-2 text-muted-foreground">
          Sản phẩm này không còn trong thực đơn.
        </p>
        <Link href="/" className={`${btnPrimary} mt-6`}>
          Quay lại thực đơn
        </Link>
      </PageShell>
    );
  }

  const sizeAdd = sizes.find((s) => s.value === size)?.priceAdd ?? 0;
  const toppingAdd = picked.reduce(
    (sum, tid) => sum + (toppings.find((t) => t.id === tid)?.price ?? 0),
    0
  );
  const unitPrice = product.basePrice + sizeAdd + toppingAdd;

  function toggle(tid: string) {
    setPicked((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid]
    );
  }

  function addToCart() {
    if (!product) return;
    const item: CartItem = {
      id: `${product.id}-${size}-${picked.join(",")}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      imageId: product.imageId,
      size,
      toppings: picked,
      qty,
      unitPrice,
    };
    dispatch({ type: "ADD_TO_CART", item });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <PageShell wide>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeftIcon size={16} /> Thực đơn
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-14">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="overflow-hidden rounded-xl bg-secondary">
            <img
              src={getProductImageUrl(product.imageId, 1000, 1000)}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>

        <div>
          <Eyebrow>
            {product.category === "hot"
              ? "Đồ uống nóng"
              : product.category === "cold"
              ? "Đồ uống lạnh"
              : "Món đặc biệt"}
          </Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>
          <p className="tabular mt-5 text-2xl font-semibold text-accent">
            {formatPrice(product.basePrice)}
          </p>

          <Section title="Kích cỡ">
            <div
              role="radiogroup"
              aria-label="Kích cỡ"
              className="grid grid-cols-3 gap-3"
            >
              {sizes.map((s) => {
                const on = size === s.value;
                return (
                  <button
                    key={s.value}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setSize(s.value)}
                    className={`rounded-xl border px-3 py-3 text-center transition ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-foreground/40"
                    }`}
                  >
                    <span className="block font-display text-xl font-semibold">
                      {s.value}
                    </span>
                    <span
                      className={`block text-xs ${
                        on
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.label.replace(/\s*\(.*\)/, "")}
                    </span>
                    <span
                      className={`tabular mt-1 block text-xs font-medium ${
                        on ? "text-primary-foreground" : "text-accent"
                      }`}
                    >
                      {s.priceAdd > 0
                        ? `+${formatPrice(s.priceAdd)}`
                        : "Mặc định"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Topping" hint="Tuỳ chọn">
            <div className="space-y-2.5">
              {toppings.map((t) => {
                const on = picked.includes(t.id);
                return (
                  <button
                    key={t.id}
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(t.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                      on
                        ? "border-accent bg-accent/5"
                        : "border-border bg-card hover:border-foreground/40"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        on
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background"
                      }`}
                    >
                      {on && <CheckIcon size={13} />}
                    </span>
                    <span className="flex-1 text-[15px] font-medium">
                      {t.label}
                    </span>
                    <span className="tabular text-sm text-muted-foreground">
                      +{formatPrice(t.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Số lượng">
            <Stepper value={qty} onChange={setQty} />
          </Section>

          <div className="mt-8">
            <StickyBar>
              <div className="mx-auto max-w-6xl">
                <button
                  onClick={addToCart}
                  className={`${btnPrimary} h-14 w-full justify-between px-7 text-base ${
                    added ? "bg-success hover:bg-success" : ""
                  }`}
                  aria-live="polite"
                >
                  <span className="flex items-center gap-2">
                    {added ? (
                      <>
                        <CheckIcon size={18} /> Đã thêm vào giỏ
                      </>
                    ) : (
                      "Thêm vào giỏ"
                    )}
                  </span>
                  <span className="tabular">
                    {formatPrice(unitPrice * qty)}
                  </span>
                </button>
                {added && (
                  <Link
                    href="/cart"
                    className="mt-3 block text-center text-sm font-medium text-accent underline underline-offset-4"
                  >
                    Xem giỏ hàng ({cartCount} món)
                  </Link>
                )}
              </div>
            </StickyBar>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 border-t border-border pt-7">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  const btn =
    "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition hover:bg-secondary disabled:opacity-40";
  return (
    <div className="inline-flex items-center gap-4">
      <button
        aria-label="Giảm số lượng"
        className={btn}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <MinusIcon size={16} />
      </button>
      <span
        className="tabular w-6 text-center text-lg font-semibold"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        aria-label="Tăng số lượng"
        className={btn}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
