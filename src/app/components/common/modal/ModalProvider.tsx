'use client';

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import Modal1 from '@/app/components/common/modal/modal1/Modal1';
import Modal2 from '@/app/components/common/modal/modal2/Modal2';

type OpenConfirmArgs = {
    title: string;
    content: string;
    onConfirm?: () => void;
    onCancel?: () => void;
};

type OpenAlertArgs = {
    title: string;
    content: string;
    onConfirm?: () => void;       // 확인 후 닫힘
    // onCancel 없음(배경 클릭 닫기 원하면 openAlert 호출 시 onBackgroundClose 옵션을 Modal1에 추가 구현해도 됨)
};

type ModalCtx = {
    open: (args: OpenConfirmArgs) => void;      // 기존 API: Confirm(Modal2)
    openConfirm: (args: OpenConfirmArgs) => void;
    openAlert: (args: OpenAlertArgs) => void;   // 신규 API: Alert(Modal1)
    close: () => void;
};

const ModalContext = createContext<ModalCtx | null>(null);

export function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error('useModal must be used within <ModalProvider>');
    return ctx;
}

type ActiveType = 'confirm' | 'alert' | null;

export default function ModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setOpen] = useState(false);
    const [active, setActive] = useState<ActiveType>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const [confirmHandler, setConfirmHandler] = useState<() => void>(() => () => {});
    const [cancelHandler, setCancelHandler]   = useState<() => void>(() => () => {});

    const close = useCallback(() => {
        setOpen(false);
        setActive(null);
        setTitle('');
        setContent('');
        // 핸들러는 비워두지 않아도 되지만 깔끔히 초기화하고 싶으면 아래 주석 해제
        // setConfirmHandler(() => () => {});
        // setCancelHandler(() => () => {});
    }, []);

    // Modal2 (확인/취소) 열기
    const openConfirm = useCallback((args: OpenConfirmArgs) => {
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

    // Modal1 (확인만) 열기
    const openAlert = useCallback((args: OpenAlertArgs) => {
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

    // 기존 API 유지: open === openConfirm
    const api = useMemo<ModalCtx>(() => ({
        open: openConfirm,
        openConfirm,
        openAlert,
        close,
    }), [openConfirm, openAlert, close]);

    return (
        <ModalContext.Provider value={api}>
            {children}

            {/* Confirm 모달(취소/확인) */}
            {active === 'confirm' && (
                <Modal2
                    modal2Param={{
                        open: isOpen,
                        title,
                        content,
                        onConfirm: confirmHandler,
                        onCancel:  cancelHandler,
                    }}
                />
            )}

            {/* Alert 모달(확인만) */}
            {active === 'alert' && (
                <Modal1
                    modal1Param={{
                        open: isOpen,
                        title,
                        content,
                        onConfirm: confirmHandler,
                        // onCancel은 Modal1에서 optional.
                        // 배경 클릭으로 닫히게 하고 싶다면 아래 주석 제거:
                        // onCancel: close,
                    }}
                />
            )}
        </ModalContext.Provider>
    );
}
