import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HalaCoach Admin',
  description: 'Operations console for HalaCoach matching, verification, and credits.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
