import React from "react";
import styles from "./RouteChips.module.css";
import { remToPx } from "@/app/utils/claculator/pxToRem";
import { Chip } from "@/app/components/atom/chip/Chip";
import { useRouter } from "next/navigation";

/**
 * 경로 관련 버튼을 구현하는 함수
 * @constructor
 */
export default function RouteChips() {
    const router = useRouter();

    return (
        <div className={styles.routeChips}>
            <Chip label={"경로 생성"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={() => { router.push("/pages/route-drawing"); }}/>
            <Chip label={"경로 목록"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={() => { router.push("/pages/route-list"); }}/>
        </div>
    );
}
