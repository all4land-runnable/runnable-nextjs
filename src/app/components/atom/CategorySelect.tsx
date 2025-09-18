'use client';

import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";


type CategorySelectProps = {
    selectId?: string;
    addLabel?: boolean;
    label?: string;
    categories: string[];
    value: string;
    onChangeAction: (value: string) => void;
};

/**
 * 카테고리를 구현하는 함수
 *
 * @param selectId 셀렉트 아이디 명
 * @param addLabel 라벨 추가 여부
 * @param label 셀렉터 라벨
 * @param categories 카테고리 목록
 * @param value 현재 선택된 카테고리
 * @param onChangeAction Select 값 변경 시 이루어질 동작
 * @constructor TODO: 클릭이 되지 않는 문제 발생
 */
export default function CategorySelect({ selectId='route-category', addLabel=false, label='카테고리', categories, value, onChangeAction }: CategorySelectProps) {
    return (
        <FormControl  variant="standard" sx={{ m: 1, minWidth: 120 }}>
            {addLabel ? <InputLabel id={`${selectId}-label`}>{label}</InputLabel> : null}
            <Select
                labelId={addLabel?`${selectId}-label`:''}
                id={selectId}
                value={value}
                label={label}
                onChange={(e) => onChangeAction?.(e.target.value)}
            >
                <MenuItem key={0} value={''}>
                    전체 카테고리
                </MenuItem>
                {categories.map((category, index) => (
                    <MenuItem key={index} value={category+1}>
                        {category}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
