// src/application/ports/repositories/iuser-progress.repository.ts
import type { UserProgress } from '@/domain/entities/user-progress.entity';

export interface IUserProgressRepository {
  findByUserId(userId: string): Promise<UserProgress | null>;
  save(userProgress: UserProgress): Promise<UserProgress>;
  clearAll(): Promise<void>;
}
