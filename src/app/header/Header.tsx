import Image from 'next/image';
import styles from './Header.module.css'

/**
 * 화면 상단 바를 구현하는 함수
 * 각종 네비게이션이 존재한다.
 *
 * @constructor
 */
export default function Header() {
    return (
        <header className={styles.header}> {/* 전체 헤더 지정 */}
            <div className={[styles.headerLeft, styles.headerLeftFont].filter(Boolean).join(' ')}> {/* 헤더의 왼쪽 영역에 배치되는 UI */}
                {/* 로고 이미지 */}
                <Image src="/resource/title-image.png" alt="title" width={45} height={45} />
                <span>Runnable</span>
            </div>
            <div className={[styles.headerRight, styles.headerRightFont].filter(Boolean).join(' ')}> {/* 헤더의 오른쪽 영역에 배치되는 UI */}
                <span>동호회</span>
                <span>친구</span>
                <span>기록</span>
                {/* 프로필 이미지 */}
                <Image src="/resource/profile-image.png" alt="profile" width={65} height={65} />
            </div>
        </header>
    )
}