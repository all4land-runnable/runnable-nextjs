// app/layout.tsx
import './globals.css'
import type { Metadata } from "next";
import Header from "@/app/header/Header";
import React from "react";
import MapPrime3DViewer from "@/app/components/organisms/cesium/MapPrime3DViewer";
import ReduxProvider from "@/app/store/redux/ReduxProvider";
import ModalProvider from "@/app/store/modal/ModalProvider";
import styles from "@/app/page.module.scss";
import RightSideBar from "@/app/components/side-bar/right-side-bar/RightSideBar";
import LeftSideBar from "@/app/components/side-bar/left-side-bar/LeftSideBar";

export const metadata: Metadata = {};

export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
        <body>
        <Header/>
        <ReduxProvider>
            <ModalProvider>
                <article>
                    <MapPrime3DViewer/>
                    <div className={styles.onViewer}>
                        {/* 왼쪽 고정 열 */}
                        <LeftSideBar/>
                        {/* 가운데 콘텐츠: 남은 전체 영역 차지 + column start-start */}
                        {children}
                        {/* 오른쪽 고정 열 */}
                        <RightSideBar/>
                    </div>
                </article>
            </ModalProvider>
        </ReduxProvider>
        </body>
        </html>
    );
}
