import CesiumWrapper from '@/app/components/cesium/CesiumWrapper'
import Chip from '@/app/components/chip/Chip'
import LeftSideBar from "@/app/left-side-bar/LeftSideBar";
import RightSideBar from "@/app/right-side-bar/RightSideBar";

export default function Page() {
    return (
        <article>
            <section className="abs event">
                <CesiumWrapper />
            </section>

            <div className="row-start expand-width expand-height padding-050rem">
                <LeftSideBar/>
                <div className="row-start expand-width space-between">
                    <div className="row-start collapse-height event">
                        <Chip label="인기 코스" backgroundColor="#A1F0CB"/>
                        <Chip label="횡단보도" backgroundColor="#A1F0CB"/>
                        <Chip label="도보 경로" backgroundColor="#A1F0CB"/>
                        <Chip label="물품보관함" backgroundColor="#A1F0CB"/>
                        <Chip label="병원" backgroundColor="#A1F0CB"/>
                        <Chip label="음수대" backgroundColor="#A1F0CB"/>
                    </div>

                    <div className="row-end collapse-height event">
                        <Chip label="고도 표시" backgroundColor="#FCDE8C"/>
                        <Chip label="재질 표시" backgroundColor="#FCDE8C"/>
                        <Chip label="온도 측정 표시" backgroundColor="#FCDE8C"/>
                    </div>
                </div>
                <RightSideBar/>
            </div>

            <section className="abs z-index-10 col-bottom">
                <div className="row-end collapse-height center event">
                    <Chip label="경로 생성" backgroundColor="#FF9F9F"/>
                    <Chip label="경로 목록" backgroundColor="#FF9F9F"/>
                </div>
            </section>
        </article>
    )
}
