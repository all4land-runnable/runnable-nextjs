'use client'

import CategorySelect from "@/app/components/category-select/CategorySelect";
import React from 'react';
import styles from './LeftSideBar.module.css';
import RouteCard from "@/app/components/route-card/RouteCard";

export default function LeftSideBar() {
    const [cat, setCat] = React.useState('전체 카테고리');
    const railRef = React.useRef<HTMLDivElement | null>(null);

    const categories = ['전체 카테고리', '인기 코스', '횡단보도', '도보 경로'];

    return (
        <section className={`${styles.leftSideBar} col-top padding-050rem gap-075rem collapse-width event`}>
            <CategorySelect categories={categories} value={cat} onChange={setCat} />

            {/* 카드 레일(세로 슬라이드) */}
            <div ref={railRef} className={styles.cardRail}>
                <div className={styles.snap} data-card><RouteCard title={"여의도 고구마 런"} distance={3.2} startTime={new Date()} endTime={new Date()} description={"여의도의 고구마 같은 모습을 본따서 제작한 러닝 코스입니다."} imgUrl={'/resource/sample-image.png'}/></div>
                <div className={styles.snap} data-card><RouteCard title={"여의도 고구마 런"} distance={3.2} startTime={new Date()} endTime={new Date()} description={"여의도의 고구마 같은 모습을 본따서 제작한 러닝 코스입니다."} imgUrl={'/resource/sample-image.png'}/></div>
                <div className={styles.snap} data-card><RouteCard title={"여의도 고구마 런"} distance={3.2} startTime={new Date()} endTime={new Date()} description={"여의도의 고구마 같은 모습을 본따서 제작한 러닝 코스입니다."} imgUrl={'/resource/sample-image.png'}/></div>
                <div className={styles.snap} data-card><RouteCard title={"여의도 고구마 런"} distance={3.2} startTime={new Date()} endTime={new Date()} description={"여의도의 고구마 같은 모습을 본따서 제작한 러닝 코스입니다."} imgUrl={'/resource/sample-image.png'}/></div>
                <div className={styles.snap} data-card><RouteCard title={"여의도 고구마 런"} distance={3.2} startTime={new Date()} endTime={new Date()} description={"여의도의 고구마 같은 모습을 본따서 제작한 러닝 코스입니다."} imgUrl={'/resource/sample-image.png'}/></div>
            </div>
        </section>
    );
}
