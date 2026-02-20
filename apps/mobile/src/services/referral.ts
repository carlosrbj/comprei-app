import { api } from './api';

export interface ReferralEntry {
    name: string;
    joinedAt: string;
    rewarded: boolean;
}

export interface ReferralStats {
    referralCode: string | null;
    referralCount: number;
    proMonthsEarned: number;
    neededForNextReward: number;
    referrals: ReferralEntry[];
}

export const referralService = {
    getStats: async (): Promise<ReferralStats> => {
        const response = await api.get('/referral/stats');
        return response.data;
    },
};
