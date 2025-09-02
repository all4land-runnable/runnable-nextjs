// completeDrawingOnClick.ts (수정)
export function completeDrawingOnClick(
    open: (args: { title: string; content: string; onConfirm?: () => void; onCancel?: () => void }) => void,
    close?: () => void
) {
    open({
        title: '모달 텍스트를 넣어주세요.',
        content: '서브 텍스트를 넣어주세요.',
        onCancel: close,
        onConfirm: close,
    });
}
