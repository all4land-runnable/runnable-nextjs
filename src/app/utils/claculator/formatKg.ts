// grams → "g" / "kg" 표시 (formatKm과 동일 규칙)
export function formatKg(weight: number) {
    return weight < 1000
        ? `${weight.toFixed(0)}g`
        : `${(weight / 1000).toFixed(2)}kg`;
}
