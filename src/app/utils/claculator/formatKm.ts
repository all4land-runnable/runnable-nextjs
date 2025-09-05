export function formatKm(distance:number){
    return distance < 1000
        ? `${distance.toFixed(0)}m`
        : `${(distance / 1000).toFixed(2)}km`;
}