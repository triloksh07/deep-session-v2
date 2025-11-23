// hooks/useSessionsQuery.ts
import { useQuery, useQueryClient, } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/types';
import { useEffect } from 'react';
import { logSessionsFetch } from '@/lib/logging';
import type { QueryDocumentSnapshot } from 'firebase/firestore'

interface FirestoreSessionData {
    id: string;
    userId: string;
    title: string;
    session_type_id: string;
    notes?: string;
    started_at: string; // ISO String
    ended_at: string;  // ISO String
    total_focus_ms: number;
    total_break_ms: number;
    created_at?: Timestamp | '';
}

// helper that converts Firestore doc data -> Session (UI) model
const adaptDocToSession = (doc: any) => {
    const data = doc.data() as FirestoreSessionData;
    if (!data?.started_at || !data?.ended_at) return null;
    const startTime = new Date(data.started_at).getTime();
    const endTime = new Date(data.ended_at).getTime();
    if (isNaN(startTime) || isNaN(endTime)) return null;
    return {
        id: doc.id,
        title: data.title,
        type: data.session_type_id,
        notes: data.notes || '',
        sessionTime: data.total_focus_ms,
        breakTime: data.total_break_ms,
        startTime,
        endTime,
        date: new Date(startTime).toISOString().split('T')[0],
        // fromCache: doc.metadata.fromCache,
        // pending: doc.metadata.hasPendingWrites,
    } as Session;
};

export const fetchSessions = async (userId: string): Promise<Session[]> => {
    console.log('useSessionsQuery: Attempting to fetch for userId from new hook:', userId);
    if (!userId) return [];

    try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', userId), orderBy('started_at', 'desc'));
        const querySnapshot = await getDocs(q);
        // querySnapshot.docs.forEach(doc => console.log('Session data fromCache:', doc.metadata?.fromCache));

        let fromCacheCount = 0;
        let fromServerCount = 0;
        querySnapshot.docs.forEach((doc) => {
            if (doc.metadata.fromCache) fromCacheCount++;
            else fromServerCount++;
        });

        const sessions: Session[] = querySnapshot.docs
            .map(adaptDocToSession)
            .filter(Boolean) as Session[];

        // logging for debbuging
        logSessionsFetch({
            source: 'fetch',
            userId,
            count: sessions.length,
            fromCacheCount,
            fromServerCount,
        });

        console.log('useSessionsQuery: Successfully fetched', sessions.length, 'sessions.');
        return sessions;
    } catch (error) {
        console.error('useSessionsQuery: Error inside fetchSessions:', error);
        throw error;
    }
};

export const useSessionsQuery = (userId: string | undefined, enabled: boolean) => {
    const qc = useQueryClient();

    // Start a real-time listener that seeds react-query cache and keeps it up-to-date.
    useEffect(() => {
        if (!userId || !enabled) return;

        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', userId), orderBy('started_at', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // snapshot will return cached results immediately when offline
            const sessions = snapshot.docs.map(adaptDocToSession).filter(Boolean) as Session[];
            qc.setQueryData(['sessions', userId], sessions);
            // for debugging
            logSessionsFetch({
                source: 'snapshot',
                userId,
                count: sessions.length,
                fromCacheSnapshot: snapshot.metadata.fromCache,
            });

        }, (err) => {
            console.error('onSnapshot error for sessions:', err);
        });

        return () => unsubscribe();
    }, [userId, enabled, qc]);

    return useQuery({
        queryKey: ['sessions', userId],
        // initial fetch only — after that onSnapshot will keep cache fresh
        queryFn: () => fetchSessions(userId!),
        enabled: !!userId && enabled,
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
    });
};
