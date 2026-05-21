export interface TokenService {
    generateAccessToken(userId: string, email: string, role: string):string;
    generateRefreshToken():string;
    hashToken(token: string):string;
    verifyToken(token: string, hash: string): boolean;
}

