import { z } from 'zod';

// Existing PostgreSQL UUID identities include stable seed values without RFC
// version/variant bits. Accept canonical DB UUID syntax, not arbitrary strings.
export const databaseUuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Choose a valid database identifier.',
);
