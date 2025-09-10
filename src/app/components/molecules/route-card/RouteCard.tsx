import styles from './RouteCard.module.css'
import Image from "next/image";
import {amPmFormat} from "@/app/utils/formattingTime";
import {RightSideBarState} from "@/app/components/organisms/left-side-bar/LeftSideBar";

/**
 * 경로 카드 속성
 *
 * @param title 제목
 * @param distance 총 거리
 * @param startTime 운동 가능 시간
 * @param endTime 운동 제한시간
 * @param description 경로에 대한 설명
 * @param imgUrl 경로 프로필 사진
 */
export type RouteCardParam = {
    title: string,
    distance: number,
    startTime: Date,
    endTime: Date,
    description: string
    imgUrl: string
}

type routeCardProps = {
    routeCardParam: RouteCardParam;
    rightSideBarState: RightSideBarState;
}

/**
 * 경로 속성 카드를 구현하는 함수
 *
 * @param routeCard 경로 카드 속성
 * @param rightSideBarState 오른쪽 사이드바 확장 상태
 * @constructor
 */
export default function RouteCard({routeCardParam, rightSideBarState}: routeCardProps) {
    /**
     * RouteCard 선택 함수
     */

    return (
        <div className={styles.routeCard} onClick={()=>rightSideBarState.setOpenRightSideBar(!rightSideBarState.openRightSideBar)}> {/* RouteCard 가장 밖 테두리, 핸들러 지정 */}
            <div className={styles.imageBox}> {/* 경로 대표 사진 */}
                <Image src={routeCardParam.imgUrl} fill style={{ objectFit: "cover" }} alt=""/>
            </div>

            <span className={styles.titleFont}>{routeCardParam.title}</span> {/* 경로 제목 */}
            {/* 속성 정보 나열 */}
            <span className={styles.routeInfoFont}>거리: {routeCardParam.distance}km / 가능 시간:{amPmFormat(routeCardParam.startTime.getTime())}~{amPmFormat(routeCardParam.endTime.getTime())}</span>
            {/* 경로 설명 */}
            <span className={[styles.description, styles.descriptionFont].join(' ')}>{routeCardParam.description}</span>
        </div>
    )
}