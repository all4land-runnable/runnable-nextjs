'use client';
import styles from './Category.module.css';

type Props = {
    categories?: string[];
    value?: string | null;
    onChangeAction?: (value: string) => void;
};

export default function CategorySelect({ categories = [], value, onChangeAction }: Props) {
    return (
        <select
            className={styles.selectCategory}
            value={value ?? ''}
            onChange={(e) => onChangeAction?.(e.target.value)}
        >
            {categories.map((category, index) => (
                <option key={index} value={category}>
                    {category}
                </option>
            ))}
        </select>
    );
}
