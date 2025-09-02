'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import styles from './AlertModal.module.css'
import {remToPx} from "@/app/utils/claculator/pxToRem";

/**
 * 모달 속성
 *
 * @param open 개폐 여부
 * @param title 제목
 * @param content 내용
 * @param onConfirm 확인 버튼
 * @param onCancel 모달 밖을 누를 때 작동 내역
 */
type AlertParam = {
    open: boolean;
    title: string;
    content: string;
    onConfirm: () => void;
    onCancel?: () => void;
};

type AlertModalProps = {
    alertModalParam: AlertParam;
}

/**
 * 취소 버튼이 없는 모달을 구현하는 함수
 *
 * @param moda1lParam 모달 속성
 * @constructor
 */
export default function AlertModal({alertModalParam}: AlertModalProps) {
    useEffect(() => {
        // 예외처리: 열려있을 때만 진행
        if (!alertModalParam.open) return;

        // 스크롤 잠금
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => { document.body.style.overflow = prev; };
    }, [alertModalParam.open]); // ← open 값만 감시

    // 예외처리: 열려있을 때만 진행
    if (!alertModalParam.open) return null;

    const modal = (
        <div className={styles.modal1} onClick={() => alertModalParam.onCancel?.()}>  {/* 바깥 클릭 시, 닫기 */}
            {/* 내용 클릭은 전파 막기 */}
            <div className={styles.alertModalTitle} onClick={(e) => e.stopPropagation()}>
                <Image src="/resource/success-icon.svg" width={remToPx(3)} height={remToPx(3)} alt={""}/>
                <span className={styles.titleFont}>{alertModalParam.title}</span> {/* 제목 */}
                <span className={styles.contentFont}>{alertModalParam.content}</span> {/* 본문 */}

                <div className={styles.buttons}>
                    <button className={styles.confirmButton} onClick={() => alertModalParam.onConfirm()}>확인</button> {/* 확인 버튼 */}
                </div>
            </div>
        </div>
    );

    // 생성된 모달 반환
    return createPortal(modal, document.body);
}