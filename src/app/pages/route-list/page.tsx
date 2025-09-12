'use client';

import styles from '../../page.module.scss'
import React, {useEffect} from "react";
import {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";
import {Chip} from "@/app/components/atom/chip/Chip";
import {useRouter} from "next/navigation";
import {setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";
import {useDispatch} from "react-redux";
import {setLeftSidebarOpen} from "@/app/store/redux/feature/leftSidebarSlice";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const dispatch = useDispatch()
    const router = useRouter();

    // NOTE: 샘플 구간 전략 속성
    const sectionStrategies: SectionStrategyParam[] = [
        { distance:100, startPlace: '여의도 공원 입구', strategies: ['페이스를 유지해 주세요!'] },
        { distance:200, startPlace: '마포대교 사거리', strategies: ["매우 가파른 경사입니다. 7'20'페이스를 유지하세요!","주변에 음수대가 있습니다. 수분을 보충할 수 있습니다."] },
    ];

    useEffect(() => {
        dispatch(setLeftSidebarOpen(true))
    });

    return (
        <section className={styles.bottomSheet}>
            <div className={styles.listChips}>
                <Chip label={"홈"} activable={false} onClickAction={()=> {
                    dispatch(setRightSidebarOpen(false));
                    dispatch(setLeftSidebarOpen(false));
                    router.push('/')
                }}/> {/* 뒤로가기 */}
            </div>
        </section>
    )
}
