import {UnactiveError} from "@/error/unactiveError";

/**
 * 운동 가능 시간 버튼을 클릭했을 때 수행되는 동작을 구현한 함수
 */
export default function workoutAvailabilityOnClick() {
    alert('운동이 가능한 시간 모달을 표시한다.');
    throw new UnactiveError(-101, "버튼 비활성화");
}