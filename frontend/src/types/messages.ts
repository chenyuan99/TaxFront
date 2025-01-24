export interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: Date;
    isAccountant: boolean;
}