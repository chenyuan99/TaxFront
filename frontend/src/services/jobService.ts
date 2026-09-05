import { db } from '../firebase';
import { collection, query, orderBy, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

/**
 * Jobs are owned by the backend. `processNewTaxDocument` opens a job when a
 * document record is created, advances it to `processing`, and closes it as
 * `completed` or `failed` — emitting a notification on the terminal write.
 *
 * The client is a reader only: it subscribes and renders. There is deliberately
 * no client-side status mutation here, because a tab writing its own view of
 * job state would race the trigger that actually does the work.
 */
/** What a completed extraction job reports back. Written by `completeJob`. */
export type JobResult = {
    documentType?: string;
    taxYear?: number | null;
    fieldsExtracted?: number;
};

export type Job = {
    id: string;
    documentId: string;
    documentName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
    error?: string;
    result?: JobResult;
    userId: string;
};

class JobService {
    private jobsCollection = collection(db, 'jobs');

    async getJob(jobId: string): Promise<Job | null> {
        const jobDoc = await getDoc(doc(this.jobsCollection, jobId));
        if (!jobDoc.exists()) return null;
        return { id: jobDoc.id, ...jobDoc.data() } as Job;
    }

    /**
     * Streams the user's jobs. Status changes written by the trigger arrive
     * here live, so an open Jobs page reflects backend progress without a
     * refresh. Returns the unsubscribe function.
     */
    subscribeToUserJobs(
        userId: string,
        onJobsUpdate: (jobs: Job[]) => void,
        onError: (error: Error) => void
    ) {
        const jobsQuery = query(
            this.jobsCollection,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(
            jobsQuery,
            (snapshot) => {
                const jobs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Job));
                onJobsUpdate(jobs);
            },
            onError
        );
    }
}

export const jobService = new JobService();
