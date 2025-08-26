import styles from './RouteCard.module.css'
import Image from "next/image";
import {amPmFormat} from "@/app/utils/formattingTime";


export type RouteCard = {
    title: string,
    distance: number,
    startTime: Date,
    endTime: Date,
    description: string
    imgUrl: string
}

type routeCardProps = {
    routeCard: RouteCard;
    setOpenRightSideBar: (open: boolean) => void;
}

/**
 * 경로 속성 카드를 구현하는 함수
 *
 * @param routeCard
 * @param setOpenRightSideBar 카드 선택 시, 오른쪽 사이드 바 확장
 * @constructor
 */
export default function RouteCard({routeCard, setOpenRightSideBar}: routeCardProps) {
    const handleClick = () => {
        setOpenRightSideBar(true);
    };

    return (
        <div className={styles.routeCard} onClick={handleClick}>
            <div className={styles.imageBox}>
                <Image src={routeCard.imgUrl} fill style={{ objectFit: "cover" }} alt=""/>
            </div>

            <span className={styles.titleFont}>{routeCard.title}</span>
            <span className={styles.routeInfoFont}>거리: {routeCard.distance}km / 가능 시간:{amPmFormat(routeCard.startTime.getTime())}~{amPmFormat(routeCard.endTime.getTime())}</span>
            <span className={[styles.description, styles.descriptionFont].join(' ')}>{routeCard.description}</span>
        </div>
    )
}