export type UserPace = {
    userPaceId: number;
    userStrategyId: number; // FK to user_strategies
    sectionId: number;      // FK to sections

    pace: number;           // seconds
    strategy: string;       // e.g., "steady", "negative-split", etc.

    foundationLatitude: number;   // deg
    foundationLongitude: number;  // deg
}