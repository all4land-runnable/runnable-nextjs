export class UnactiveError extends Error {
    constructor(public code: number, message?: string) {
        super(message);
        this.name = 'UnactiveError';
    }
}