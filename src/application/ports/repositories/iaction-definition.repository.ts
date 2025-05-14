// src/application/ports/repositories/iaction-definition.repository.ts
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';

export interface IActionDefinitionRepository {
  findById(id: string): Promise<ActionDefinition | null>;
  findBySpaceId(spaceId: string): Promise<ActionDefinition[]>;
  getAll(): Promise<ActionDefinition[]>;
  save(actionDefinition: ActionDefinition): Promise<ActionDefinition>; // Creates or updates
  delete(id: string): Promise<void>;
  deleteBySpaceId(spaceId: string): Promise<void>;
  clearAll(): Promise<void>;
}
