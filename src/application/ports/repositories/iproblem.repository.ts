// src/application/ports/repositories/iproblem.repository.ts
import type { Problem } from '@/domain/entities/problem.entity';

export interface IProblemRepository {
  findById(id: string): Promise<Problem | null>;
  findBySpaceId(spaceId: string): Promise<Problem[]>;
  getAll(): Promise<Problem[]>;
  save(problem: Problem): Promise<Problem>; // Handles create and update
  delete(id: string): Promise<void>;
  deleteBySpaceId(spaceId: string): Promise<void>;
  clearAll(): Promise<void>;
}
