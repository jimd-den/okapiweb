// src/application/ports/repositories/iaction.repository.ts
import type { Action } from '@/domain/entities/action.entity';

export interface IActionRepository {
  findById(id: string): Promise<Action | null>;
  findBySpaceId(spaceId: string): Promise<Action[]>;
  getAll(): Promise<Action[]>;
  save(action: Action): Promise<Action>;
  delete(id: string): Promise<void>;
  deleteBySpaceId(spaceId: string): Promise<void>;
  clearAll(): Promise<void>;
}
