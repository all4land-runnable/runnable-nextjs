import styles from './RouteCard.module.css'
import Image from "next/image";

type routeCardProps = {
    title: string,
    distance: number,
    startTime: Date,
    endTime: Date,
    description: string
    imgUrl: string
}

export default function RouteCard({title, distance, startTime, endTime, description, imgUrl}: routeCardProps) {
    const fmt = new Intl.DateTimeFormat("ko", {
        hour: "numeric",
        hour12: true, // 12시간제 (AM/PM)
    });

    return (
        <div className={styles.routeCard}>
            <Image src={imgUrl} alt="profile" width={171} height={114} />
            <span className={styles.title}>{title}</span>
            <span className={styles.distance}>거리: {distance}km / 가능 시간:{fmt.format(startTime.getTime())}~{fmt.format(endTime.getTime())}</span>
            <span className={styles.description}>{description}</span>
        </div>
    )
}