import type { Metadata } from "next";
import { Libre_Franklin, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const franklin = Libre_Franklin({ variable: "--font-franklin", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Two agent sessions, one GBrain (unofficial demo)",
  description:
    "On the default keyless GBrain, a second agent session works without memory, and the shared-server plan gbrain_status gives it fails at step 3 on PGLite. Unofficial demo by Cheryl Aurelia.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${franklin.variable} ${mono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
