'use client';
import styles from './Category.module.css';

type Props = {
    categories?: string[];
    value?: string | null;
    onChange?: (value: string) => void;  // <-- 이름을 onChange로 통일
};

export default function CategorySelect({ categories = [], value, onChange }: Props) {
    return (
        <select
            className={styles.selectCategory}
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
        >
            {categories.map((category, index) => (
                <option key={index} value={category}>
                    {category}
                </option>
            ))}
        </select>
    );
}
