import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistem Arsip Digital — Kantor DPD RI Provinsi Sumatera Barat',
  description:
    'Sistem Informasi Pengelolaan Arsip Surat Masuk dan Surat Keluar Kantor DPD RI Perwakilan Provinsi Sumatera Barat berbasis MongoDB GridFS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#064e3b" />
      </head>
      <body>{children}</body>
    </html>
  );
}
