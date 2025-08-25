import styles from './page.module.css'
import CesiumWrapper from '@/app/components/CesiumWrapper'
import Chip from '@/app/components/chip/Chip'
import LeftSideBar from "@/app/left-side-bar/page";
import RightSideBar from "@/app/right-side-bar/right-side-bar";

export default function Page() {
    return (
        <div className={styles.mapShell}>
            <CesiumWrapper />
            <div className={`${styles.overlay} col-top expand-width expand-height`}>
                <div className="row-start center expand-width space-between">
                    <div className="row-start center">
                        <LeftSideBar/>
                        <div className="row-start center">
                            <Chip label="인기 코스" backgroundColor="#A1F0CB"/>
                            <Chip label="횡단보도" backgroundColor="#A1F0CB"/>
                            <Chip label="도보 경로" backgroundColor="#A1F0CB"/>
                            <Chip label="물품보관함" backgroundColor="#A1F0CB"/>
                            <Chip label="병원" backgroundColor="#A1F0CB"/>
                            <Chip label="음수대" backgroundColor="#A1F0CB"/>
                        </div>
                    </div>

                    <div className="row-end center">
                        <Chip label="고도 표시" backgroundColor="#FCDE8C"/>
                        <Chip label="재질 표시" backgroundColor="#FCDE8C"/>
                        <Chip label="온도 측정 표시" backgroundColor="#FCDE8C"/>
                        <RightSideBar/>
                    </div>
                </div>
                {/*TODO: 변경할 것*/}
                <div className="col-spacer" />
                <div className="row-start center">
                    <Chip label="경로 생성" backgroundColor="#FF9F9F"/>
                    <Chip label="경로 목록" backgroundColor="#FF9F9F"/>
                </div>
            </div>

        </div>
    )
}
