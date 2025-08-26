import CesiumWrapper from '@/app/components/cesium/CesiumWrapper'
import Chip from '@/app/components/chip/Chip'
import LeftSideBar from "@/app/left-side-bar/LeftSideBar";
import RightSideBar from "@/app/right-side-bar/RightSideBar";
import styles from './page.module.css'

export default function Page() {
    return (
        <article>
            <section className={styles.cesium}>
                <CesiumWrapper/>
            </section>

            <div className={styles.onViewer}>
                <LeftSideBar/>
                <div className={styles.topSheet}>
                    <div className={styles.emphasizeChips}>
                        <Chip label="인기 코스" backgroundColor="#A1F0CB"/>
                        <Chip label="횡단보도" backgroundColor="#A1F0CB"/>
                        <Chip label="도보 경로" backgroundColor="#A1F0CB"/>
                        <Chip label="물품보관함" backgroundColor="#A1F0CB"/>
                        <Chip label="병원" backgroundColor="#A1F0CB"/>
                        <Chip label="음수대" backgroundColor="#A1F0CB"/>
                    </div>

                    <div className={styles.emphasizeChips}>
                        <Chip label="고도 표시" backgroundColor="#FCDE8C"/>
                        <Chip label="재질 표시" backgroundColor="#FCDE8C"/>
                        <Chip label="온도 측정 표시" backgroundColor="#FCDE8C"/>
                    </div>
                </div>
                <RightSideBar/>
            </div>

            <section className={styles.bottomSheet}>
                <div className={styles.routeChips}>
                    <Chip label="경로 생성" backgroundColor="#FF9F9F"/>
                    <Chip label="경로 목록" backgroundColor="#FF9F9F"/>
                </div>
            </section>
        </article>
    )
}
