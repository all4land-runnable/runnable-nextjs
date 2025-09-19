'use client';

import React from 'react';
import {Chip, CircularProgress} from "@mui/material";


type ChipProps = {
    label: string;
    type?: 'CLICK'|'SELECT';
    selectAction: () => void | Promise<void>;
    unSelectAction?: () => void | Promise<void>;
};

export const CHIP_TYPE = {
    CLICK: 'CLICK',
    SELECT: 'SELECT',
} as const;

/**
 *
 * @param label 칩버튼에 작성될 정보
 * @param type Choice ChipButton 타입 설정
 * @param selectAction 선택됐을 때 발생할 동작
 * @param unSelectAction 선택되지 않았을 때 발생할 동작
 * @constructor
 */
export function ChipButton({ label, type = CHIP_TYPE.SELECT, selectAction, unSelectAction=()=>{} }: ChipProps) {
    // Choice ChipButton 설정 여부
    const [select, setSelect] = React.useState<boolean>(false); // 처음엔 선택 여부가 꺼져있다.
    const [loading, setLoading] = React.useState<boolean>(false); // 로딩 여부 설정

    /**
     * 클릭 시 이루어지는 동작
     *
     * 상태 값에 따라, 로직이 달라진다.
     */
    const onClickHandler = async () => {
        if (loading) return; // 로딩 중엔 작업되지 않게 제한
        if (type === CHIP_TYPE.SELECT) {
            setSelect(prev => !prev); // 액션은 useEffect에서 실행
        } else {
            // CLICK 타입은 즉시 실행
            await safetyAction(selectAction);
        }
    };

    // 공통 실행 헬퍼: 로딩 토글 + 에러 처리 + 중복 실행 방지
    const safetyAction = React.useCallback(
        async (action?: () => void | Promise<void>) => {
            if (!action || loading) return; // 로딩 중이거나 요청 함수가 없다면 생략

            setLoading(true); // 로딩 시작
            try {
                await action(); // 함수 실행
            } catch (err) { // 예외처리
                alert('작업 중 에러발생.');
                console.error(err);
            } finally {
                setLoading(false); // 로딩 끝
            }
        },
        [loading]
    );

    // SELECT 모드: 토글 결과에 따라 액션 실행
    React.useEffect(() => {
        if (type !== CHIP_TYPE.SELECT) return; // SELECT일 경우

        void safetyAction(select ? selectAction : unSelectAction);
    }, [select]);

    return (
        <Chip
            onClick={onClickHandler}
            color="primary"
            variant={select ? 'outlined' : 'filled'}
            aria-busy={loading || undefined}
            label={loading ? <CircularProgress size={14} /> : label}
            sx={{
                // 중앙 정렬(스피너/텍스트 모두 센터)
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                // 레이아웃 점프가 신경 쓰이면 최소 너비를 살짝 지정
                minWidth: 64,
                '& .MuiCircularProgress-root': { mr: 0 }, // 여백 조정
            }}
        />
    );
}
