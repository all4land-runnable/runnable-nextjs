// 프론트 내부에서 쓰기 좋은 타입 (카멜케이스 + Date)
export type UserRoute = {
    userRouteId: number;
    userId: number;
    categoryId: number;
    routeId: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
};