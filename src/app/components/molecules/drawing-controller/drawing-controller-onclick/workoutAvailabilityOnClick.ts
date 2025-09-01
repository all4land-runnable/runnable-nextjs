import {UnactiveError} from "@/error/unactiveError";

export default function workoutAvailabilityOnClick() {
    alert('운동이 가능한 시간 모달을 표시한다.');
    throw new UnactiveError(-101, "버튼 비활성화");
}