export interface User {
    id: string;
    email: string;
    role: 'producer' | 'artist';
    alias?: string;
    avatarUrl?: string;
    bio?: string;
    emailVerified: boolean;
    createdAt: Date;
}