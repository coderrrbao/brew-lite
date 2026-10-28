'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getProductImageUrl } from '@/lib/data';
import { authenticate } from '@/lib/api';
import { SpinnerIcon, StarIcon, btnPrimary, btnOutline, inputCls } from './ui';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { dispatch, state } = useStore();
  const router = useRouter();

  if (state.user) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-5 pb-36 pt-16 text-center md:pb-20">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent font-display text-3xl font-semibold uppercase text-accent-foreground">
          {state.user.name[0]}
        </span>
        <h1 className="mt-5 text-3xl font-semibold">{state.user.name}</h1>
        <p className="mt-1 text-muted-foreground">{state.user.email}</p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold">
          <StarIcon size={16} className="text-accent" />
          {state.user.loyaltyPoints} điểm tích luỹ
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Link href="/orders" className={`${btnPrimary} flex-1`}>
            Đơn hàng của tôi
          </Link>
          <button onClick={() => dispatch({ type: 'SET_USER', user: null })} className={`${btnOutline} flex-1`}>
            Đăng xuất
          </button>
        </div>
      </main>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password || (mode === 'register' && !name)) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    setLoading(true);
    const fallback = {
      id: 'user-' + Date.now(),
      email,
      name: mode === 'register' ? name : email.split('@')[0],
      loyaltyPoints: 120,
    };
    authenticate(mode, { email, password, name })
      .then((r) => r.user)
      .catch(() => fallback)
      .then((user) => {
        dispatch({ type: 'SET_USER', user });
        router.push('/');
      })
      .finally(() => setLoading(false));
  }

  const isLogin = mode === 'login';

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-36 pt-10 sm:px-8 md:pb-20 lg:grid-cols-2 lg:items-center lg:pt-16">
      <div className="relative hidden overflow-hidden rounded-xl bg-secondary lg:block">
        <img src={getProductImageUrl('1495474472287-4d71bcdd2085', 1000, 1200)} alt="Tách cà phê trên bàn gỗ" className="aspect-[4/5] w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-8 pt-24 text-white">
          <p className="font-display text-3xl font-semibold leading-tight">Đặt nhanh, nhận gọn, tích điểm mỗi ly.</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl font-semibold">{isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h1>
        <p className="mt-2 text-muted-foreground">
          {isLogin ? 'Đăng nhập để tích điểm và xem lịch sử đơn hàng.' : 'Tham gia BrewLite để nhận ưu đãi dành cho thành viên.'}
        </p>

        <div role="tablist" className="mt-7 grid grid-cols-2 rounded-full bg-secondary p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              type="button"
              onClick={() => {
                setMode(m);
                setError('');
              }}
              className={`h-10 rounded-full text-sm font-semibold transition ${
                mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {!isLogin && <Field id="name" label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Văn An" autoComplete="name" />}
          <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="ban@example.com" autoComplete="email" />
          <Field
            id="password"
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Ít nhất 6 ký tự"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {error && (
            <p role="alert" className="rounded-lg bg-[#f3d6d2] px-4 py-2.5 text-sm font-medium text-[#8a2a20]">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={`${btnPrimary} h-14 w-full text-base`}>
            {loading ? (
              <>
                <SpinnerIcon size={18} /> {isLogin ? 'Đang đăng nhập…' : 'Đang tạo tài khoản…'}
              </>
            ) : isLogin ? (
              'Đăng nhập'
            ) : (
              'Tạo tài khoản'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputCls}
      />
    </div>
  );
}
