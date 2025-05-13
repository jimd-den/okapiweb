// src/lib/db.ts

// All specific DB access functions (addSpaceDB, getAllSpacesDB, etc.) and 
// the generic `performOperation` and `initDB` have been moved to:
// src/infrastructure/persistence/indexeddb/indexeddb-base.repository.ts
// and specific repository implementations (e.g., src/infrastructure/persistence/indexeddb/indexeddb-space.repository.ts).

// The `exportData` and `importData` functions are now handled by use cases:
// - src/application/use-cases/data/export-app-data.usecase.ts
// - src/application/use-cases/data/import-app-data.usecase.ts

// The `initDB()` call that was at the bottom of this file is now handled within 
// `src/infrastructure/persistence/indexeddb/indexeddb-base.repository.ts`
// to ensure the DB is initialized when repositories are used.

// This file is now a placeholder. If all its responsibilities are migrated,
// it can be deleted.
console.log("src/lib/db.ts is being deprecated. DB logic moved to /infrastructure and /application layers.");

// You might need to re-export initDB from the new location if any old code still tries to call it directly,
// but the goal is to phase out direct calls to it from outside the infrastructure layer.
// export { initDB } from '@/infrastructure/persistence/indexeddb/indexeddb-base.repository';
