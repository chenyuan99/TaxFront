export interface TaxDocument {
    id: string;
    name: string;
    type: 'W2' | '1099' | 'Other';
    year: number;
    uploadDate: string;
    fileUrl: string;
    status: 'pending' | 'processed' | 'archived';
}