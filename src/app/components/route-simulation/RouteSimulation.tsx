import styles from './RouteSimulation.module.css'

/**
 * 시뮬레이션 버튼을 구현하는 함수
 *
 * @constructor
 */
export default function RouteSimulation() {
    return (
        <button className={[styles.routeSimulation, styles.routeSimulationFont].join(' ') }>
            3D 시뮬레이션
        </button>
    )
}