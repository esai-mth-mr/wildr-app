import { satoshi, slussen } from '@/fonts/fonts';
import { MainLayout } from '@/components/home/MainLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${satoshi.variable} ${slussen.variable}`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
