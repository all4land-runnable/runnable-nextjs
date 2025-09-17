'use client';

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import ConfirmModal from "@/app/store/modal/confirm-modal/ConfirmModal";
import AlertModal from "@/app/store/modal/alert-modal/AlertModal";
import SaveModal from "@/app/store/modal/save-modal/SaveModal";

/** Confirm 모달 */
type OpenConfirmProp = {
    title: string;
    content: string;
    onConfirm: () => void;
    onCancel?: () => void;
};

/** Alert 모달 */
type OpenAlertProp = {
    title: string;
    content: string;
    onConfirm: () => void;
};

/** Save 모달 */
type OpenSaveProp = {
    dialogTitle: string;
    initialTitle?: string;
    initialDescription?: string;
    initialCategory?: string;
    onConfirm: (text: string, descript: string, category: string) => void;
    onCancel?: () => void;
};

type ModalContext = {
    openConfirm: (args: OpenConfirmProp) => void;
    openAlert: (args: OpenAlertProp) => void;
    openSave: (args: OpenSaveProp) => void;
    close: () => void;
};

const ModalContext = createContext<ModalContext | null>(null);

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within <ModalProvider>');
    return context;
}

type ActiveType = 'confirm' | 'alert' | 'save' | null;

export default function ModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setOpen] = useState(false);
    const [active, setActive] = useState<ActiveType>(null);

    // 공통 텍스트
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // confirm/alert 핸들러
    const [confirmHandler, setConfirmHandler] = useState<() => void>(() => () => {});
    const [cancelHandler, setCancelHandler]   = useState<() => void>(() => () => {});

    // save 모달 전용 상태
    const [saveInitTitle, setSaveInitTitle] = useState('');
    const [saveInitDesc, setSaveInitDesc] = useState('');
    const [saveInitCategory, setSaveInitCategory] = useState('');
    const [saveConfirmHandler, setSaveConfirmHandler] =
        useState<(text: string, descript: string, category: string) => void>(() => () => {});

    const close = useCallback(() => {
        setOpen(false);
        setActive(null);

        setTitle('');
        setContent('');

        setConfirmHandler(() => () => {});
        setCancelHandler(() => () => {});

        setSaveInitTitle('');
        setSaveInitDesc('');
        setSaveInitCategory('');
        setSaveConfirmHandler(() => () => {});
    }, []);

    // Confirm
    const openConfirm = useCallback((args: OpenConfirmProp) => {
        setActive('confirm');
        setTitle(args.title);
        setContent(args.content);
        setConfirmHandler(() => () => { args.onConfirm?.(); close(); });
        setCancelHandler(() => () => { args.onCancel?.(); close(); });
        setOpen(true);
    }, [close]);

    // Alert
    const openAlert = useCallback((args: OpenAlertProp) => {
        setActive('alert');
        setTitle(args.title);
        setContent(args.content);
        setConfirmHandler(() => () => { args.onConfirm?.(); close(); });
        setOpen(true);
    }, [close]);

    // Save (제목/설명/카테고리)
    const openSave = useCallback((args: OpenSaveProp) => {
        setActive('save');
        setTitle(args.dialogTitle);
        setSaveInitTitle(args.initialTitle ?? '');
        setSaveInitDesc(args.initialDescription ?? '');
        setSaveInitCategory(args.initialCategory ?? '');
        setSaveConfirmHandler(() => (t:string, d:string, c:string) => { args.onConfirm?.(t, d, c); close(); });
        setCancelHandler(() => () => { args.onCancel?.(); close(); });
        setOpen(true);
    }, [close]);

    const api = useMemo<ModalContext>(() => ({
        openConfirm, openAlert, openSave, close
    }), [openConfirm, openAlert, openSave, close]);

    return (
        <ModalContext.Provider value={api}>
            {children}

            {active === 'confirm' && (
                <ConfirmModal
                    confirmModalParam={{
                        open: isOpen, title, content,
                        onConfirm: confirmHandler, onCancel: close
                    }}
                />
            )}

            {active === 'alert' && (
                <AlertModal
                    alertModalParam={{
                        open: isOpen, title, content,
                        onConfirm: confirmHandler, onCancel: cancelHandler
                    }}
                />
            )}

            {active === 'save' && (
                <SaveModal
                    saveModalParam={{
                        open: isOpen,
                        dialogTitle: title,
                        initialTitle: saveInitTitle,
                        initialDescription: saveInitDesc,
                        initialCategory: saveInitCategory,
                        onConfirm: saveConfirmHandler,
                        onCancel: close,
                    }}
                />
            )}
        </ModalContext.Provider>
    );
}
