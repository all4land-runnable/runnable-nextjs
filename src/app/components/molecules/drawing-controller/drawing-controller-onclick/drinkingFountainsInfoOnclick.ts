import {UnactiveError} from "@/error/unactiveError";

export default function drinkingFountainsInfoOnclick() {
    alert('추후 경로안내 시 음수대 정보가 표시된다.');
    throw new UnactiveError(-101, "버튼 비활성화");
}