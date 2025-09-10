'use client';
import styles from './CategorySelect.module.scss';

/**
 * 카테고리 속성
 * @param categories 카테고리 목록
 * @param value 현재 선택된 카테고리
 * @param onChangeAction Select 값 변경 시 이루어질 동작
 */
type CategorySelectProps = {
    categories: string[];
    value: string;
    onChangeAction: (value: string) => void;
};

/**
 * 카테고리를 구현하는 함수
 *
 * @param categorySelectParam 카테고리 속성
 * @constructor
 */
export default function CategorySelect({ categories, value, onChangeAction }: CategorySelectProps) {
    return (
        <select
            className={styles.selectCategory}
            value={value ?? ''}
            onChange={(e) => onChangeAction?.(e.target.value)}
        > {/* 기본적인 셀렉터 태그 정보 입력 */}
            {/* 각 카테고리 값 선회 */}
            {categories.map((category, index) => (
                <option key={index} value={category}>
                    {category}
                </option>
            ))}
        </select>
    );
}
