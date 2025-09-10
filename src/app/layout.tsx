import type { Metadata } from "next";
import "./globals.css";
import Header from "@/app/header/Header";
import React from "react";
import MapPrime3DViewer from "@/app/components/organisms/cesium/MapPrime3DViewer";
import ReduxProvider from "@/app/store/redux/ReduxProvider";
import ModalProvider from "@/app/store/modal/ModalProvider";

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
        <Header/>
        <ReduxProvider>
            <ModalProvider> {/* 모달 생성을 위한 Provider 선언 */}
                <article>
                    <MapPrime3DViewer/> {/* cesium viewer */}
                    {children}
                </article>
            </ModalProvider>
        </ReduxProvider>
        </body>
        </html>
    );
}