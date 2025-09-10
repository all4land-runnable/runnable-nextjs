'use client';

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import ConfirmModal from "@/app/store/modal/confirm-modal/ConfirmModal";
import AlertModal from "@/app/store/modal/alert-modal/AlertModal";

/**
 * 확인 모달에 필요한 인자
 *
 * @param title
 * @param content
 * @param onConfirm
 * @param onCancel
 */
type OpenConfirmProp = {
    title: string;
    content: string;
    onConfirm: () => void;
    onCancel?: () => void;
};

/**
 * 알림 모달에 필요한 인자
 *
 * @param title
 * @param content
 * @param onConfirm
 */
type OpenAlertProp = {
    title: string;
    content: string;
    onConfirm: () => void;
};

/**
 * ???
 */
type ModalContext = {
    openConfirm: (args: OpenConfirmProp) => void;
    openAlert: (args: OpenAlertProp) => void;
    close: () => void;
};

// 컨텍스트 할당
const ModalContext = createContext<ModalContext | null>(null);

/**
 * Modal을 요청하는 함수
 */
export function useModal() {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within <ModalProvider>');
    return context;
}

type ActiveType = 'confirm' | 'alert' | null;

/**
 * 모달창을 제어해주는 Privider 함수이다.
 *
 * @param children 모달과 관련 없는 기본 컴포넌트
 * @constructor
 */
export default function ModalProvider({ children }: { children: React.ReactNode }) {
    // 모달창 개폐 여부
    const [isOpen, setOpen] = useState(false);
    const [active, setActive] = useState<ActiveType>(null);

    // 제목 본문 내용
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // 확인, 취소 버튼 클릭 리스너
    const [confirmHandler, setConfirmHandler] = useState<() => void>(() => () => {});
    const [cancelHandler, setCancelHandler]   = useState<() => void>(() => () => {});

    // 닫을 때 기본으로 실행될 함수
    const close = useCallback(() => {
        setOpen(false);
        setActive(null);

        setTitle('');
        setContent('');

        setConfirmHandler(() => () => {});
        setCancelHandler(() => () => {});
    }, []);

    // ConfirmModal (확인/취소) 열기
    const openConfirm = useCallback((args: OpenConfirmProp) => {
        setActive('confirm');
        setTitle(args.title);
        setContent(args.content);
        setConfirmHandler(() => () => {
            args.onConfirm?.();
            close();
        });
        setCancelHandler(() => () => {
            args.onCancel?.();
            close();
        });
        setOpen(true);
    }, [close]);

    // ConfirmModal (확인) 열기
    const openAlert = useCallback((args: OpenAlertProp) => {
        setActive('alert');
        setTitle(args.title);
        setContent(args.content);
        setConfirmHandler(() => () => {
            args.onConfirm?.();
            close();
        });
        // Modal1은 취소 버튼이 없으므로 cancelHandler는 사용 안 함
        setOpen(true);
    }, [close]);

    // ModalProvider가 노출할 API
    const api = useMemo<ModalContext>(() => ({
        openConfirm, // 확인/취소가 있는 Confirm 모달 띄우기
        openAlert, // 확인만 있는 Alert 모달 띄우기
        close, // 현재 떠 있는 모달을 강제로 닫기
    }), [openConfirm, openAlert, close]);

    return (
        <ModalContext.Provider value={api}>
            {children}

            {/* Confirm 모달(취소/확인) */}
            {active === 'confirm' && <ConfirmModal confirmModalParam={{open: isOpen, title, content, onConfirm: confirmHandler, onCancel: close}}/>}

            {/* Alert 모달(확인) */}
            {active === 'alert' && <AlertModal alertModalParam={{open: isOpen, title, content, onConfirm: confirmHandler, onCancel: cancelHandler}}/>}
        </ModalContext.Provider>
    );
}
