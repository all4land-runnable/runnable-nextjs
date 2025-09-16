'use client';

import styles from '../../page.module.scss'
import React, {useEffect, useState} from "react";
import {Chip} from "@/app/components/atom/chip/Chip";
import {useRouter} from "next/navigation";
import {setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";
import {useDispatch} from "react-redux";
import {setLeftSidebarOpen} from "@/app/store/redux/feature/leftSidebarSlice";
import {Route} from "@/type/route";
import apiClient from "@/api/apiClient";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const dispatch = useDispatch()
    const router = useRouter();

    const userId = 1; // 시연을 위한 하드코딩
    const [routes, setRoutes] = useState<Route[]>()

    useEffect(() => {
        let alive = true; // 언마운트 대비 (선택)
        (async () => {
            const userRoutes = await getRoutes(userId);
            if (!alive) return;
            setRoutes(routes);
            console.log(userRoutes); // 최신값 로그는 이걸로!
        })();
        return () => { alive = false; };
    }, []);

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

async function getRoutes(userId:number) {
    const response = await apiClient.get<Route[]>(
        `/api/v1/next_routes/${userId}`,
        { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL }
    )
    return response.data
}
