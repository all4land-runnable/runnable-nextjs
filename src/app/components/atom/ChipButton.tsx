'use client';

import React from 'react';
import {Chip} from "@mui/material";


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

    /**
     * 클릭 시 이루어지는 동작
     *
     * 상태 값에 따라, 로직이 달라진다.
     */
    function onClickHandler() {
        if (type === CHIP_TYPE.SELECT)
            setSelect((prev) => !prev);
        else
            selectAction?.();
    }

    React.useEffect(() => {
        // SELECT 모드일 때만 토글의 결과에 따라 액션
        if (type !== CHIP_TYPE.SELECT) return;

        try{
            // SELECT 모드일 때만 토글의 결과에 따라 액션
            if (select) selectAction?.();
            else unSelectAction?.();
        } catch(error){
            alert('작업 중 에러발생.')
            console.error(error);
        }
    }, [select]);

    return (
        <Chip
            label={label}
            onClick={onClickHandler}
            color={'primary'}
            variant={select?'outlined':'filled'}
        />
    );
}
