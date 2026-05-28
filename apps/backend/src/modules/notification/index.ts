import { Resend } from 'resend';

export interface SendVerificationEmailInput {
    to: string;
    verificationUrl: string;
}

export class ResendNotificationAdapter {
    constructor(
        private readonly resend: Resend,
        private readonly senderEmail: string,
    ) {}

    async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
        const { error } = await this.resend.emails.send({
            from: this.senderEmail,
            to: input.to,
            subject: 'Verificá tu email en Minga Records',
            html: `
                <h1>Verificá tu email</h1>
                <p>Hacé click en el siguiente link para verificar tu cuenta:</p>
                <a href="${input.verificationUrl}">Verificar email</a>
            `,
        });

        if (error) {
            throw error;
        }
    }
}
