'use client'

import dynamic from 'next/dynamic'
import React from 'react'
import {CesiumType} from "@/app/types/cesium";

const CesiumDynamicComponent = dynamic(() => import('./CesiumComponent'), {
    ssr: false,
})

export const CesiumWrapper: React.FunctionComponent = () => {
    const [CesiumJs, setCesiumJs] = React.useState<CesiumType | null>(null)

    React.useEffect(() => {
        if (CesiumJs) return
            ;(async () => {
            const Cesium = await import('cesium')
            setCesiumJs(Cesium)
        })()
    }, [CesiumJs])

    return CesiumJs ? <CesiumDynamicComponent CesiumJs={CesiumJs} /> : null
}

export default CesiumWrapper
