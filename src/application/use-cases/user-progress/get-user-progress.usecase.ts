// src/application/use-cases/user-progress/get-user-progress.usecase.ts
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import { DEFAULT_USER_ID } from '@/lib/constants';

export class GetUserProgressUseCase {
  constructor(private readonly userProgressRepository: IUserProgressRepository) {}

  async execute(userId: string = DEFAULT_USER_ID): Promise<UserProgress | null> {
    let progress = await this.userProgressRepository.findByUserId(userId);
    if (!progress && userId === DEFAULT_USER_ID) {
      // Ensure a default progress object exists for the default user if none found
      progress = { 
        userId: DEFAULT_USER_ID, 
        points: 0, 
        level: 1, 
        unlockedCustomizations: [] 
      };
      await this.userProgressRepository.save(progress); // Save it so it's there next time
    }
    return progress;
  }
}
