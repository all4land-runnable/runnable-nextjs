import styles from './RouteCard.module.css'
import Image from "next/image";

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
    const fmt = new Intl.DateTimeFormat("ko", {
        hour: "numeric",
        hour12: true, // 12시간제 (AM/PM)
    });

    return (
        <div className={styles.routeCard}>
            <Image src={routeCard.imgUrl} alt="profile" width={171} height={114} />
            <span className={styles.title}>{routeCard.title}</span>
            <span className={styles.distance}>거리: {routeCard.distance}km / 가능 시간:{fmt.format(routeCard.startTime.getTime())}~{fmt.format(routeCard.endTime.getTime())}</span>
            <span className={styles.description}>{routeCard.description}</span>
        </div>
    )
}