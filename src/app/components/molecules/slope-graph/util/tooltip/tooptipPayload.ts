// 커스텀 Tooltip (버전 독립 타입)
type TooltipPayload<T> = { payload: T };

export type TooltipContentProps<T> = {
    active?: boolean;
    payload?: TooltipPayload<T>[];
};