'use client';

import React, {useEffect} from 'react';
import styles from '@/app/components/side-bar/left-side-bar/LeftSideBar.module.scss';
import RouteCard from '@/app/components/molecules/route-card/RouteCard';
import {useDispatch, useSelector} from 'react-redux';
import { RootState } from '@/app/store/redux/store';
import type { Route } from '@/type/route';
import CategorySelect from '@/app/components/atom/CategorySelect';
import {CircularProgress, List, ListItem} from "@mui/material";
import {setRoutes} from "@/app/store/redux/feature/leftSidebarSlice";
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";

const USER_ID = 1; // 시연을 위한 하드코딩

/**
 * 왼쪽에 나타나는 사이드 바
 *
 * @constructor
 */
export default function LeftSideBar() {
    const dispatch = useDispatch();

    const leftSidebarOpen = useSelector((s: RootState) => s.leftSidebar.open);
    const leftSidebarRoutes = useSelector((state: RootState) => state.leftSidebar.routes);

    // 로컬 로딩 상태
    const [loading, setLoading] = React.useState(false);

    // 카테고리 내용 구분
    const [category, setCategory] = React.useState('전체 카테고리');

    // 카드의 활성화 여부를 관리
    const [activeIndex, setActiveIndex] = React.useState<string | null>(null);

    // NOTE 1. LeftSideBar가 열릴 때만 실행
    useEffect(()=>{
        if (!leftSidebarOpen) return;

        // 창을 여러번 여는 등의 과한 API 요청을 취소한다.
        const controller = new AbortController();
        setLoading(true);

        (async () => {
            try {
                dispatch(setRoutes([])); // 초기화
                const userRoutes = await getRoutes(USER_ID, controller.signal);
                dispatch(setRoutes(userRoutes));
            } catch (error) {
                alert('로딩 중 중 에러발생.')
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            controller.abort();
            setLoading(false);
        } // 언마운트/닫힘 시 취소
    }, [leftSidebarOpen]);

    return (
        leftSidebarOpen ? <section className={styles.leftSideBar} aria-busy={loading || undefined} aria-live="polite">
            <CategorySelect
                categories={['전체 카테고리', '인기 코스', '횡단보도', '도보 경로']}
                value={category}
                onChangeAction={(value: string) => setCategory(value)}
            />
            <div className={styles.listWrap}>
                <List className={ styles.routeCardList }>
                    {leftSidebarRoutes.map((route: Route, index: number) => {
                        const isOpen = activeIndex === `route-card-${index}`;
                        return (
                            <ListItem
                                key={`route-card-${index}`}
                                // 같은 카드면 닫기(null), 다른 카드면 그 카드로 열기(index)
                                onClick={() =>
                                    setActiveIndex((prev) => (prev === `route-card-${index}` ? null : `route-card-${index}`))
                                }
                            >
                                <RouteCard route={route} isOpen={isOpen} />
                            </ListItem>
                        )
                    })}

                    {/* 로딩 오버레이 */}
                    {loading && (
                        <div className={styles.listLoadingOverlay} role="status">
                            <CircularProgress size={28} />
                        </div>
                    )}
                </List>
            </div>
        </section> : null
    );
}

/**
 * 사용자 경로를 가져오는 API
 * @param userId 사용자 아이디
 * @param signal API 중복시 취소 요청
 */
async function getRoutes(userId:number, signal?: AbortSignal) {
    const response = await apiClient.get<CommonResponse<Route[]>>(
        `/api/v1/next_routes/${userId}`,
        {
            baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL,
            signal: signal,
        }
    );
    if(response.status !== 200 && response.status !== 201) {
        alert('getRoutes API 요청 실패');
        console.error('반환 데이터', response.data);
        throw Error('getRoutes API 요청 실패');
    }
    return response.data.data ?? [];
}