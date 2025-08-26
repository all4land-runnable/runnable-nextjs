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
}

export default function RouteCard({routeCard}: routeCardProps) {
    return (
        <div className={styles.routeCard}>
            <div className={styles.imageBox}>
                <Image src={routeCard.imgUrl} fill style={{ objectFit: "cover" }} alt=""/>
            </div>

            <span className={styles.titleFont}>{routeCard.title}</span>
            <span className={styles.routeInfoFont}>거리: {routeCard.distance}km / 가능 시간:{amPmFormat(routeCard.startTime.getTime())}~{amPmFormat(routeCard.endTime.getTime())}</span>
            <span className={[styles.description, styles.descriptionFont].join(' ')}>{routeCard.description}</span>
        </div>
    )
}