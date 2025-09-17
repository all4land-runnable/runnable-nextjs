'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import styles from './SaveModal.module.css';
import { remToPx } from '@/app/utils/claculator/pxToRem';

type SaveModalParam = {
    open: boolean;
    /** 모달 상단 제목(“경로 저장” 등) */
    dialogTitle: string;
    /** 입력 초기값 */
    initialTitle?: string;
    initialDescription?: string;
    initialCategory?: string;
    /** 확인: 입력값을 외부로 전달 */
    onConfirm: (text: string, descript: string, category: string) => void;
    /** 취소 */
    onCancel: () => void;
};

type SaveModalProps = {
    saveModalParam: SaveModalParam;
};

export default function SaveModal({ saveModalParam }: SaveModalProps) {
    const {
        open,
        dialogTitle,
        initialTitle = '',
        initialDescription = '',
        initialCategory = '',
        onConfirm,
        onCancel,
    } = saveModalParam;

    const [title, setTitle] = useState(initialTitle);
    const [desc, setDesc] = useState(initialDescription);
    const [category, setCategory] = useState(initialCategory);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    if (!open) return null;

    const modal = (
        <div className={styles.background}>
            <div className={styles.modal} onClick={onCancel}>
                <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.header}>
                        <Image
                            src="/resource/save-icon.svg"
                            width={remToPx(2.5)}
                            height={remToPx(2.5)}
                            alt=""
                        />
                        <h3 className={styles.dialogTitle}>{dialogTitle}</h3>
                    </div>

                    <label className={styles.label} htmlFor="save-title">제목</label>
                    <input
                        id="save-title"
                        className={styles.textField}
                        type="text"
                        placeholder="예) 잠실 한강 러닝 코스"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />

                    <label className={styles.label} htmlFor="save-category">카테고리</label>
                    <input
                        id="save-category"
                        className={styles.textField}
                        type="text"
                        placeholder="예) 러닝 / 산책 / 자전거"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />

                    <label className={styles.label} htmlFor="save-desc">세부 설명</label>
                    <textarea
                        id="save-desc"
                        className={styles.textArea}
                        placeholder="예) 왕복 10km, 물품보관함 이용 가능, 경사 완만"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        rows={5}
                    />

                    <div className={styles.buttons}>
                        <button className={styles.cancelButton} onClick={onCancel}>취소</button>
                        <button
                            className={styles.confirmButton}
                            onClick={() => onConfirm(title.trim(), desc.trim(), category.trim())}
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
