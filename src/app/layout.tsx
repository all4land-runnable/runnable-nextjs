import type { Metadata } from "next";
import "./globals.css";
import Header from "@/app/header/Header";
import ModalProvider from "@/app/components/common/modal/ModalProvider";
import CesiumWrapper from "@/app/components/templates/cesium/CesiumWrapper";
import styles from "@/app/page.module.css";
import React from "react";

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
        <ModalProvider> {/* 모달 생성을 위한 Provider 선언 */}
            <article>
                <section className={styles.cesium}>
                    <CesiumWrapper/> {/* cesium viewer */}
                </section>
                {children}
            </article>
        </ModalProvider>
        </body>
        </html>
    );
}