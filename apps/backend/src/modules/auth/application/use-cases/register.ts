import { UserRepository } from "../../domain/ports/user-repository";
import { EmailService } from "../../domain/ports/email-service";
import { validatePassword } from "../../domain/value-objects/password";
import bcrypt from 'bcrypt';


export interface RegisterInput {
    email: string;
    password: string;
    role: 'producer' | 'artist';
}


export class RegisterUseCase {
    constructor (
        private userRepository: UserRepository,
        private emailService: EmailService,
    ) {}

    async execute(input: RegisterInput){
        const passwordErrors = validatePassword(input.password); 
        if(passwordErrors.length > 0) {
            const err = new Error(passwordErrors.join(', '));
            (err as any).status = 400;
            throw err;
        }

        const existing = await this.userRepository.findByEmail(input.email);
        if(existing) {
            const err = new Error('Ya existe un usuario con este Email');
            (err as any).status = 409;
            throw err;
        }
        const user = await this.userRepository.create({
            email: input.email,
            passwordHash: await bcrypt.hash(input.password, 12),
            role: input.role,
        });

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        };
    }
}
