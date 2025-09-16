'use client'

import React from 'react';
import styles from "./LeftSideBar.module.css"
import CategorySelect from "@/app/components/atom/category-select/CategorySelect";
import RouteCard from "@/app/components/molecules/route-card/RouteCard";
import {useSelector} from "react-redux";
import {RootState} from "@/app/store/redux/store";

/**
 * 왼쪽 사이드 바를 구현하는 함수
 *
 * @constructor
 */
export default function LeftSideBar() {
    const open = useSelector((state: RootState) => state.leftSidebar.open);
    const routes = useSelector((state: RootState) => state.leftSidebar.routes);
    // 카테고리 상태
    const [cat, setCat] = React.useState('전체 카테고리');

    return (
        // openLeftSideBar가 true일 때만 나타난다.
        open && <section className={styles.leftSideBar}>
            <CategorySelect categories={['전체 카테고리', '인기 코스', '횡단보도', '도보 경로']} value={cat} onChangeAction={(value: string) => setCat(value)}/> {/* 경로 카테고리 */}
            <div className={styles.routeCardList}>
                {/* 각 경로 카드 선회 */}
                {routes.map((route, index) => (
                    <RouteCard route={route} key={index} />
                ))}
            </div>
        </section>
    );
}
