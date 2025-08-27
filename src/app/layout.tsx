import type { Metadata } from "next";
import "./globals.css";
import Header from "@/app/header/Header";

/**
 * metadata를 추가할 땐 여기에 할 것
 */
export const metadata: Metadata = {};

export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
        <body>
        {/* header는 여기에서 고정으로 지정 */}
        <Header></Header>
        {/* page 전환 영역 기본 값은 page.tsx */}
        {children}
        </body>
        </html>
    );
}