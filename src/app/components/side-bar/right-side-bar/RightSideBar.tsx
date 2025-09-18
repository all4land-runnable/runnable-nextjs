'use client'

import styles from "./RightSideBar.module.css"
import PaceStrategy from "@/app/components/molecules/pace-strategy/PaceStrategy";
import {ChipButton} from "@/app/components/atom/chip/ChipButton";
import SlopeGraph from "@/app/components/molecules/slope-graph/SlopeGraph";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/app/store/redux/store";
import {useModal} from "@/app/store/modal/ModalProvider";
import {useRouter} from "next/navigation";
import {setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";

/**
 * 오른쪽 사이드바를 구현하는 함수
 * @constructor
 */
export default function RightSideBar() {
    const router = useRouter();
    const dispatch = useDispatch()
    const open = useSelector((state: RootState) => state.rightSidebar.rightSidebarOpen);

    const { openConfirm, close } = useModal(); // 모달 여부 // TODO: 필요한가?

    // 자동 경로 여부를 결정하는 상태값
    const automaticRoute = useSelector((state: RootState) => state.rightSidebar.automaticRoute);
    // 임시 경로를 결정하는 상태값
    const tempRoute = useSelector((state:RootState) => state.routeDrawing.tempRoute);
    // 보행자 경로를 결정하는 상태값
    const pedestrianRoute = useSelector((state:RootState) => state.routeDrawing.pedestrianRoute);

    /**
     * 경로 확정 완료 전 알림 전송
     */
    const similationOnClick= () => {
        openConfirm({
            title: "3D 시뮬레이션", // 제목
            content: "시뮬레이션을 시작하겠습니까?", // 본문
            // 확인 버튼 눌렀을 때 수행될 동작 구현
            onConfirm: async () => {
                close(); // 모달 닫기
                dispatch(setRightSidebarOpen(false));
                router.push('/pages/route-simulation');
            },
            onCancel: close
        })
    }

    return (
        open && <section className={styles.rightSideBar}>
            <div className={styles.sidebarTop}> {/* 오른쪽 사이드바 상단 */}
                <SlopeGraph/>
                <PaceStrategy route={automaticRoute?tempRoute:pedestrianRoute}/> {/* 페이스 전략 카드 */}
            </div>
            <div className={styles.sidebarBottom}> {/* 오른쪽 사이드바 하단 */}
                <div className={styles.detailInfo}>
                    <ChipButton label={"구간 속도"} selectAction={() => {}}/> {/* 구간 속도 */}
                    <ChipButton label={"페이스 분석"} selectAction={() => {}}/> {/* 페이스 분석 */}
                </div>
                <button className={[styles.routeSimulation, styles.routeSimulationFont].join(' ')} onClick={similationOnClick}>
                    3D 시뮬레이션
                </button>
            </div>
        </section>
    )
}
