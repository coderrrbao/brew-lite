import type { Metadata, Viewport } from 'next';
import Navbar from '@/components/Navbar';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite - Đặt cà phê, nhận tại quầy',
  description: 'Đặt đồ uống và thanh toán không tiền mặt, nhận tại quầy khi đã pha xong.',
};

export const viewport: Viewport = { themeColor: '#f5efe6' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
