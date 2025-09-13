'use client';

import styles from '../../page.module.scss'
import React, {useEffect} from "react";
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
