'use client';

import styles from './ProfileCard.module.css'
import {postUsers} from "@/app/header/profile-card/utils/postUsers";
import {useEffect, useState} from "react";
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";
import {UserOut} from "@/api/response/users_response";

export type ProfileCardState = {
    openProfileCard: boolean;
    setOpenProfileCard: (open: boolean) => void;
}

type ProfileCardProps = {
    profileCardState: ProfileCardState;
};

export default function ProfileCard({ profileCardState }: ProfileCardProps) {
    const handler = () => profileCardState.setOpenProfileCard(false);

    const [userId, setUserId] = useState<number>(-1); // TODO: 유저 조회 기능도 추가할 것
    const [username, setUsername] = useState<string>("올포랜드-0000");
    const [age, setAge] = useState<number>(-1);
    const [runnerSince, setRunnerSince] = useState<number>(-1);
    const [paceAverage, setPaceAverage] = useState<number>(-1);

    /**
     * 처음 들어왔을 땐, 회원 정보를 다시 전달 받는다.
     */
    useEffect(() => {
        if (!profileCardState.openProfileCard) return;

        (async () => {
            const response = await apiClient.get<CommonResponse<UserOut>>(`/api/v1/users/1`, {
                baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL,
            })
            const userResponse: CommonResponse<UserOut> = response.data;
            const user = userResponse.data
            if(!user) return

            setUserId(user.user_id);
            setUsername(user.username);
            setAge(user.age);
            setRunnerSince(user.runner_since);
            setPaceAverage(user.pace_average);
        })();
    }, [profileCardState.openProfileCard]);

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

                <form>
                    <fieldset className={styles.contents}>
                        <label>사용자 아이디 <input type="text" id="user_id" style={{ width: '100%' }} value={userId} onChange={(e) => setUserId(Number(e.target.value))}/></label>
                        <label>사용자명 <input type="text" id="username" style={{ width: '100%' }} value={username} onChange={(e) => setUsername(e.target.value)}/></label>
                        <label>나이 <input type="text" id="age" style={{ width: '100%' }} value={age} onChange={(e) => setAge(Number(e.target.value))}/></label>
                        <label>구력 <input type="text" id="runner_since" style={{ width: '100%' }} value={runnerSince} onChange={(e) => setRunnerSince(Number(e.target.value))}/></label>
                        <label>속도 <input type="text" id="pace_average" style={{ width: '100%' }} value={paceAverage} onChange={(e) => setPaceAverage(Number(e.target.value))}/></label>
                        <input
                            type="button"
                            className={`${styles.btn} ${styles.primary}`}
                            value="사용자 정보 수정하기"
                            onClick={() => postUsers(userId, username, age, runnerSince, paceAverage)}
                        />
                    </fieldset>
                </form>
            </div>
        </div>
    ) : null;
}
