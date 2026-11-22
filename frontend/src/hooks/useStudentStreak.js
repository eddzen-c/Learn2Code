import { useEffect, useState } from 'react';

import {
    getDashboardSummary,
} from '../api/dashboard.api.js';

export function useStudentStreak(accessToken) {
    const [streakDays, setStreakDays] = useState(null);

    useEffect(() => {
        if (!accessToken) {
            return undefined;
        }

        let active = true;

        getDashboardSummary(accessToken)
            .then((summary) => {
                if (!active) return;

                const rawStreak =
                    summary?.gamification?.currentStreak;

                if (rawStreak == null) {
                    setStreakDays(null);
                    return;
                }

                const value = Number(rawStreak);

                setStreakDays(
                    Number.isFinite(value)
                        ? Math.max(0, Math.trunc(value))
                        : null,
                );
            })
            .catch(() => {
                if (active) {
                    setStreakDays(null);
                }
            });

        return () => {
            active = false;
        };
    }, [accessToken]);

    return streakDays;
}