/**
 * 버튼 비활성화를 위한 에러
 *
 * 버튼 상태를 복귀 시키기 위한 Controlled 로직이다.
 */
export class UnactiveError extends Error {
    constructor(public code: number, message?: string) {
        super(message);
        this.name = 'UnactiveError';
    }
}