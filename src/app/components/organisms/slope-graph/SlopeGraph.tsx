'use client'

import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import styles from './SlopeGraph.module.css'

export type SlopeGraphParam = {
    meter: number,
    height: number
}

type SlopeGraphProps = {
    slopeGraphParams: SlopeGraphParam[]
}

export default function SlopeGraph({slopeGraphParams}: SlopeGraphProps) {
    return (
        <section>
            <div className={styles.slopeGraph}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        width={500}
                        height={400}
                        data={slopeGraphParams}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="meter" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="height" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    )
}