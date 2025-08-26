import styles from './RouteSimulation.module.css'

export default function RouteSimulation() {
    return (
        <button className={[styles.routeSimulation, styles.routeSimulationFont].join(' ') }>
            3D 시뮬레이션
        </button>
    )
}