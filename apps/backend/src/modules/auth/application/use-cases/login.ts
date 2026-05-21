import { UserRepository } from '../../domain/ports/user-repository';
import { TokenService } from '../../domain/ports/token-service';
import bcrypt from 'bcrypt';


export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; role: string };
}

export class LoginUseCase {
    constructor(
        private userRepository: UserRepository,
        private tokenService: TokenService,
    ){}


    async execute(input: LoginInput): Promise<LoginResult> {
        const user = await this.userRepository.findByEmail(input.email);
        if(!user){
            const err = new Error('Email o contraseña incorrectos');
            (err as any).statusCode = 401;
            throw err;
        }

        const valid = await bcrypt.compare(input.password, (user as any).passwordHash);
        if(!valid){
            const err = new Error('Email o contraseña incorrectos');
            (err as any).statusCode = 401;
            throw err;
        }

        const accessToken = this.tokenService.generateAccessToken(
            user.id, user.email, user.role
        );
        const refreshToken = this.tokenService.generateRefreshToken();
        const refreshHash = this.tokenService.hashToken(refreshToken);

        return {
            accessToken,
            refreshToken,
            user:{ id: user.id, email: user.email, role: user.role },
        };
    }
}



