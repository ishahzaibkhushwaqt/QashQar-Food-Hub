import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Khushwaqt Developers Meta Signature */}
        <meta name="author" content="Khushwaqt Developers" />
        <meta name="creator" content="Khushwaqt Developers" />
        <meta name="publisher" content="Khushwaqt Developers" />
        <meta name="application-name" content="Qashqar Food Hub (QFH)" />
        <meta
          name="keywords"
          content="Qashqar Food Hub, QFH, Chitral food delivery, Khushwaqt Developers, Mantou, River Trout, Ghalmandi, Shinwari Karahi, Chitral restaurants, Tirich Mir dining"
        />

        {/* Google Fonts — Playfair Display (serif display) + DM Sans (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased bg-cream-100 text-dark-800 selection:bg-gold-200 selection:text-dark-800">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
