import type { Metadata } from "next";
import "./globals.css";
import Header from "@/app/header/Header";

export const metadata: Metadata = {};

export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
        <body>
        <Header></Header>
        {children}
        </body>
        </html>
    );
}