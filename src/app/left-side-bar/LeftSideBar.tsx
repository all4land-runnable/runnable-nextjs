import CategorySelect from "@/app/components/category-select/CategorySelect";
import React from 'react';
import styles from './LeftSideBar.module.css';
import RouteCard from "@/app/components/route-card/RouteCard";

export type LeftSideBarState = {
    open: boolean;
}

type LeftSideBarProps = {
    leftSideBarState: LeftSideBarState;
    setOpenRightSideBar: (open: boolean) => void;
};

export default function LeftSideBar({ leftSideBarState, setOpenRightSideBar }: LeftSideBarProps) {
    const [cat, setCat] = React.useState('전체 카테고리');

    const categories = ['전체 카테고리', '인기 코스', '횡단보도', '도보 경로'];
    const routeCards = Array.from({ length: 10 }, () => ({
        title: "여의도 고구마 런",
        distance: 3.2,
        startTime: new Date(),
        endTime: new Date(),
        description: "여의도의 고구마 같은 모습을 본따서 제작한 러닝 코스입니다.",
        imgUrl: "/resource/sample-image.png"
    }));

    return (
        <section className={styles.leftSideBar} style={{ display: leftSideBarState.open ? "flex" : "none" }}>
            <CategorySelect categories={categories} value={cat} onChangeAction={setCat} />
            <div className={styles.routeCardList}>
                {routeCards.map((routeCard, index) => (
                    <RouteCard routeCard={routeCard} setOpenRightSideBar={setOpenRightSideBar} key={index} />
                ))}
            </div>
        </section>
    );
}
