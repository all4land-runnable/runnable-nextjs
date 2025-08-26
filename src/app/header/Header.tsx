import Image from 'next/image';
import styles from './Header.module.css'

export default function Header() {
    return (
        <header className={`${styles.header} row-start space-between justify-center padding-050rem`}>
            <div className={styles.titleFont+ 'row-start center'}>
                <Image src="/resource/title-image.png" alt="title" width={22} height={22} />
                <span>Runnable</span>
            </div>
            <div className={styles.font+' row-end center gap-375rem'}>
                <span>동호회</span>
                <span>친구</span>
                <span>기록</span>
                <Image src="/resource/profile-image.png" alt="profile" width={45} height={45} />
            </div>
        </header>
    )
}