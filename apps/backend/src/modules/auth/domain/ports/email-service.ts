export interface EmailService {
    sendVerificationEmail(to: string, token: string): Promise<void>;
    sendResetEmail(email: string, token: string): Promise<void>;
}

