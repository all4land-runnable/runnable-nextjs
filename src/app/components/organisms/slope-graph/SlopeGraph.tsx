'use client'

import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import styles from './SlopeGraph.module.css'
import {remToPx} from "@/app/utils/claculator/pxToRem";

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
                        width={remToPx(58.125)}
                        height={remToPx(18.75)}
                        data={slopeGraphParams}
                        margin={{
                            top: remToPx(0.5),
                            right: remToPx(0.75),
                            left: remToPx(0.75),
                            bottom: remToPx(0.5),
                        }}
                    >
                        <CartesianGrid strokeDasharray="5 5" />
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