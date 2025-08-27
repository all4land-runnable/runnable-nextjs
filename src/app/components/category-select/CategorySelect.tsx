'use client';
import styles from './Category.module.css';

/**
 * 카테고리 속성
 * @param categories 카테고리 목록
 * @param value 현재 선택된 카테고리
 * @param onChangeAction Select 값 변경 시 이루어질 동작
 */
export type CategorySelectParam = {
    categories: string[];
    value: string;
    onChangeAction: (value: string) => void;
}

type CategorySelectProps = {
    categorySelectParam: CategorySelectParam;
};

/**
 * 카테고리를 구현하는 함수
 *
 * @param categorySelectParam 카테고리 속성
 * @constructor
 */
export default function CategorySelect({ categorySelectParam }: CategorySelectProps) {
    return (
        <select
            className={styles.selectCategory}
            value={categorySelectParam.value ?? ''}
            onChange={(e) => categorySelectParam.onChangeAction?.(e.target.value)}
        > {/* 기본적인 셀렉터 태그 정보 입력 */}
            {/* 각 카테고리 값 선회 */}
            {categorySelectParam.categories.map((category, index) => (
                <option key={index} value={category}>
                    {category}
                </option>
            ))}
        </select>
    );
}
