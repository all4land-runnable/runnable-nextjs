import type { Metadata } from "next";
import "./globals.css";
import Header from "@/app/header/Header";
import React from "react";
import MapPrime3DViewer from "@/app/components/organisms/cesium/MapPrime3DViewer";
import ReduxProvider from "@/app/store/redux/ReduxProvider";
import ModalProvider from "@/app/store/modal/ModalProvider";
import styles from "@/app/page.module.css";
import RightSideBar from "@/app/components/side-bar/right-side-bar/RightSideBar";
import LeftSideBar from "@/app/components/side-bar/left-side-bar/LeftSideBar";

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
                    <div className={styles.onViewer}>
                        {/* 왼쪽 사이드 바 */}
                        <LeftSideBar/>
                        {children}
                        {/* 오른쪽 사이드 바 */}
                        <RightSideBar/>
                    </div>
                </article>
            </ModalProvider>
        </ReduxProvider>
        </body>
        </html>
    );
}