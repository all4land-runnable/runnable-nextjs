'use client';

import styles from './ProfileCard.module.css'

export type ProfileCardState = {
    openProfileCard: boolean;
    setOpenProfileCard: (open: boolean) => void;
}

type ProfileCardProps = {
    profileCardState: ProfileCardState;
};

export default function ProfileCard({ profileCardState }: ProfileCardProps) {
    const handler = () => profileCardState.setOpenProfileCard(false);

    return profileCardState.openProfileCard ? (
        <div className={styles.profileCard}>
            {/* 팝업 카드 */}
            <div className={styles.profilePopup}>
                <div className={styles.popupHeader}>
                    <div className={styles.avatar}/>
                    <div className={styles.popupTitleRow}>
                        <span id="profile-popup-title" className={styles.popupTitle}>동호회</span>
                        <button className={styles.closeBtn} onClick={handler}>×</button>
                    </div>
                </div>

                <div className={styles.popupActions}>
                    <button className={`${styles.btn} ${styles.primary}`}>회원가입</button>
                    <button className={`${styles.btn} ${styles.ghost}`}>로그인</button>
                    <button className={`${styles.btn} ${styles.ghost}`}>사용약관</button>
                </div>

                <p className={styles.caption}>추후 개발 예정</p>
            </div>
        </div>
    ) : null;
}
