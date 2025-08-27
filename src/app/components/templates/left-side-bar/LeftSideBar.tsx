import React from 'react';
import styles from './LeftSideBar.module.css';
import {RightSideBarState} from "@/app/components/templates/right-side-bar/RightSideBar";
import CategorySelect, {CategorySelectParam} from "@/app/components/atom/category-select/CategorySelect";
import RouteCard from "@/app/components/organisms/route-card/RouteCard";

/**
 * 왼쪽 사이드바 확장 상태
 *
 * @param openLeftSideBar 왼쪽 사이드바 현재 확장 상태
 * @param setOpenLeftSideBar 왼쪽 사이드바 확장 상태 변경
 */
export type LeftSideBarState = {
    openLeftSideBar: boolean;
    setOpenLeftSideBar: (open: boolean) => void;
}

type LeftSideBarProps = {
    leftSideBarState: LeftSideBarState;
    rightSideBarState: RightSideBarState;
};

/**
 * 왼쪽 사이드 바를 구현하는 함수
 *
 * @param leftSideBarState 왼쪽 사이드바 확장 상태
 * @param rightSideBarState 오른쪽 사이드바 확장 상태
 * @constructor
 */
export default function LeftSideBar({ leftSideBarState, rightSideBarState }: LeftSideBarProps) {
    // 카테고리 상태
    const [cat, setCat] = React.useState('전체 카테고리');

    // NOTE: 샘플 카테고리 속성
    const categorySelectParam: CategorySelectParam = {
        categories: ['전체 카테고리', '인기 코스', '횡단보도', '도보 경로'],
        value: cat,
        onChangeAction: (value: string) => setCat(value),
    }

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
        <section className={styles.leftSideBar} style={{ display: leftSideBarState.openLeftSideBar ? "flex" : "none" }}>
            <CategorySelect categorySelectParam={categorySelectParam} /> {/* 경로 카테고리 */}
            <div className={styles.routeCardList}>
                {/* 각 경로 카드 선회 */}
                {routeCardParams.map((routeCardParam, index) => (
                    <RouteCard routeCardParam={routeCardParam} rightSideBarState={rightSideBarState} key={index} />
                ))}
            </div>
        </section>
    );
}
