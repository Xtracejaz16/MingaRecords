import { User } from '../entities/user';

export interface UserRepository {
    findByEmail(email: string):Promise<User | null>;
    findById(id: string):Promise<User | null>;
    create(data: CreateUserInput):Promise<User>;
    update(id: string, data: Partial<User>):Promise<User>;
}

export interface CreateUserInput {
    email: string;
    passwordHash: string;
    role: 'producer' | 'artist';
    
}