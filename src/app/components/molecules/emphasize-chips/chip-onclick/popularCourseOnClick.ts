import {UnactiveError} from "@/error/unactiveError";

/**
 * 인기 코스 버튼을 누를 때 수행되는 동작을 구현한 함수
 */
export default async function popularCourseOnClick(){
    alert("개발중: 인기 코스 데이터가 없습니다.");
    throw new UnactiveError(-101, "버튼 비활성화");
}