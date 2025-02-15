import { db, auth } from '../firebase';
import { collection, query, orderBy, where, onSnapshot, doc, updateDoc, addDoc, getDoc, Timestamp } from 'firebase/firestore';
import { api } from './api';

export type Job = {
    id: string;
    documentId: string;
    documentName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
    error?: string;
    result?: any;
    userId: string;
};

class JobService {
    private jobsCollection = collection(db, 'jobs');

    async createJob(documentId: string, documentName: string): Promise<string> {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const newJob = {
            documentId,
            documentName,
            status: 'pending' as const,
            createdAt: Timestamp.now().toDate().toISOString(),
            updatedAt: Timestamp.now().toDate().toISOString(),
            userId: user.uid
        };

        const docRef = await addDoc(this.jobsCollection, newJob);
        return docRef.id;
    }

    async getJob(jobId: string): Promise<Job | null> {
        const jobDoc = await getDoc(doc(this.jobsCollection, jobId));
        if (!jobDoc.exists()) return null;
        return { id: jobDoc.id, ...jobDoc.data() } as Job;
    }

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

    async updateJobStatus(
        jobId: string,
        status: Job['status'],
        error?: string,
        result?: any
    ): Promise<void> {
        const jobRef = doc(this.jobsCollection, jobId);
        const updateData: Partial<Job> = {
            status,
            updatedAt: Timestamp.now().toDate().toISOString()
        };

        if (error) updateData.error = error;
        if (result) updateData.result = result;

        await updateDoc(jobRef, updateData);
    }

    async processJob(jobId: string): Promise<void> {
        const job = await this.getJob(jobId);
        if (!job) throw new Error('Job not found');
        if (job.status === 'processing') return;

        await this.updateJobStatus(jobId, 'processing');
        try {
            const result = await api.processDocument(job.documentId);
            await this.updateJobStatus(jobId, 'completed', undefined, result);
        } catch (error) {
            await this.updateJobStatus(
                jobId,
                'failed',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
            throw error;
        }
    }
}

export const jobService = new JobService();
