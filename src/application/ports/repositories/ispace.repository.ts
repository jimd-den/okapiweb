// src/application/ports/repositories/ispace.repository.ts
import type { Space } from '@/domain/entities/space.entity';

export interface ISpaceRepository {
  findById(id: string): Promise<Space | null>;
  getAll(): Promise<Space[]>;
  save(space: Space): Promise<Space>; // Handles both create and update
  delete(id: string): Promise<void>;
  clearAll(): Promise<void>;
}
