'use client';

import React from 'react';
import styles from './LeftSideBar.module.css';
import RouteCard from '@/app/components/molecules/route-card/RouteCard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store/redux/store';
import { setRightSidebarOpen } from '@/app/store/redux/feature/rightSidebarSlice';

import { removePedestrianRoute } from '@/app/pages/route-drawing/utils/drawingTempRoute';
import { removeMarkers } from '@/app/utils/markers/hideMarkers';
import { getPedestrianRouteMarkers } from '@/app/staticVariables';
import type { Route } from '@/type/route';
import CategorySelect from "@/app/components/atom/CategorySelect";

export default function LeftSideBar() {
    const dispatch = useDispatch();
    const open = useSelector((s: RootState) => s.leftSidebar.open);
    const routes = useSelector((s: RootState) => s.leftSidebar.routes);
    const rightOpen = useSelector((s: RootState) => s.rightSidebar.rightSidebarOpen);
    const currentRoute = useSelector((s: RootState) => s.routeDrawing.pedestrianRoute);

    const [cat, setCat] = React.useState('전체 카테고리');

    /**
     * RouteCard가 선택되기 전에 부모(LeftSideBar)가 결정:
     * - 같은 카드 + 패널 열림: 기존 엔티티/마커 제거 후 패널 닫기 → 'close'
     * - 그 외: 기존 엔티티/마커 제거 후 패널 열기 → 'activate'
     */
    const handleBeforeSelect = (clicked: Route): 'activate' | 'close' => {
        const clickedKey = clicked;
        const currentKey = currentRoute ? currentRoute : null;

        // 공통: 기존 표시물 제거
        removePedestrianRoute();
        removeMarkers(getPedestrianRouteMarkers());

        if (rightOpen && currentKey && currentKey === clickedKey) {
            // 같은 카드 재클릭 → 닫기
            dispatch(setRightSidebarOpen(false));
            return 'close';
        }

        // 다른 카드 선택 또는 현재 닫혀 있음 → 열기
        dispatch(setRightSidebarOpen(true));
        return 'activate';
    };

    if (!open) return null;

    return (
        <section className={styles.leftSideBar}>
            <CategorySelect
                categories={['인기 코스', '횡단보도', '도보 경로']}
                value={cat}
                onChangeAction={(value: string) => setCat(value)}
            />
            <div className={styles.routeCardList}>
                {routes.map((route: Route, idx: number) => (
                    <RouteCard
                        key={idx}
                        route={route}
                        onBeforeSelect={handleBeforeSelect}
                    />
                ))}
            </div>
        </section>
    );
}
