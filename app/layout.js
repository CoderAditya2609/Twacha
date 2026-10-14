import "./globals.css";
import { Cormorant_Garamond, Jost } from "next/font/google";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata = {
  title: "Twacha Skincare",
  description: "Personalized luxury skincare guidance with tailored routines and curated formulations.",
  openGraph: {
    title: "Twacha Skincare",
    description: "Personalized luxury skincare guidance with tailored routines and curated formulations.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="grain">{children}</body>
    </html>
  );
}
