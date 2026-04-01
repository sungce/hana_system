import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: '학생 생활지도 누적 일지',
  description: '학생별 생활지도 내용을 기록하고 누적 횟수를 관리하는 앱입니다.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
