'use client'

import React from 'react';
import styles from "@/app/page.module.scss"
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
    // 카테고리 상태
    const [cat, setCat] = React.useState('전체 카테고리');

    // NOTE: 샘플 카테고리 속성

    // NOTE: 샘플 경로 카드 속성 (10개 생성)
    const routeCardParams = Array.from({ length: 10 }, () => ({
        title: "여의도 고구마 런",
        distance: 3.2,
        startTime: new Date(),
        endTime: new Date(),
        description: "여의도의 고구마 같은 모습을 본따서 제작한 러닝 코스입니다.",
        imgUrl: "/resource/sample-image.png"
    }));

    return (
        // openLeftSideBar가 true일 때만 나타난다.
        open && <section className={styles.leftSideBar}>
            <CategorySelect categories={['전체 카테고리', '인기 코스', '횡단보도', '도보 경로']} value={cat} onChangeAction={(value: string) => setCat(value)}/> {/* 경로 카테고리 */}
            <div className={styles.routeCardList}>
                {/* 각 경로 카드 선회 */}
                {routeCardParams.map((routeCardParam, index) => (
                    <RouteCard routeCardParam={routeCardParam} key={index} />
                ))}
            </div>
        </section>
    );
}
