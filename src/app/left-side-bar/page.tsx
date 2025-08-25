'use client'

import CategorySelect from "@/app/components/category-select/CategorySelect";
import React from 'react';

export default function LeftSideBar() {
    const [cat, setCat] = React.useState('전체 카테고리');

    const categories = ['전체 카테고리', '인기 코스', '횡단보도', '도보 경로'];

    return <section className='col-top expand-height padding-050rem gap-075rem collapse-width'>
        <CategorySelect categories={categories} value={cat} onChange={setCat} />
    </section>;
}