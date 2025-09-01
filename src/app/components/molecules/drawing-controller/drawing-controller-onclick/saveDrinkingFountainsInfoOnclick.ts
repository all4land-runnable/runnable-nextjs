import {UnactiveError} from "@/error/unactiveError";

/**
 * 음수대 정보 기록 버튼을 클릭했을 때 수행되는 동작을 구현한 함수
 */
export default function saveDrinkingFountainsInfoOnclick() {
    alert('추후 경로안내 시 음수대 정보가 표시된다.');
    throw new UnactiveError(-101, "버튼 비활성화");
}