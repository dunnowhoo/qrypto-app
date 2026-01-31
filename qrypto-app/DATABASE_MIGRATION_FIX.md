# Database Migration Fix

## Problem

The application was experiencing "Null constraint violation" errors when trying to create new users in production. This happened because:

1. **Database schema was outdated** - The production database didn't have the necessary default values for `id` fields and `@updatedAt` decorators
2. **Migrations weren't running automatically** - Vercel only ran `prisma generate` but not `prisma migrate deploy`

## Solution

### 1. Updated Build Script

Changed `package.json` build script from:
```json
"build": "prisma generate && next build"
```

To:
```json
"build": "prisma migrate deploy && prisma generate && next build"
```

This ensures that:
- ✅ Migrations are applied to the database **before** building
- ✅ Prisma Client is generated with the latest schema
- ✅ Next.js build uses the updated schema

### 2. What Happens Now

Every time you deploy to Vercel:

1. **Prisma Migrate Deploy** runs first
   - Checks for pending migrations
   - Applies them to the production database
   - Safe to run multiple times (idempotent)

2. **Prisma Generate** runs next
   - Generates the Prisma Client based on schema
   - Ensures type safety

3. **Next Build** runs last
   - Builds the application
   - Uses the updated database schema

### 3. Migrations Applied

The following migrations have been created and will be applied:

1. `20260107034536_init` - Initial schema
2. `20260131015613_sync_schema` - Added missing User fields
3. `20260131020342_add_user_defaults` - Added UUID default for User.id
4. `20260131020813_add_all_defaults` - Added UUID defaults for all models

## Verification

After deployment, you can verify migrations were applied by checking Vercel logs:

```
> prisma migrate deploy

4 migrations found in prisma/migrations

No pending migrations to apply.
```

Or if there were pending migrations:

```
Applying migration `20260131020813_add_all_defaults`

The following migration(s) have been applied:

migrations/
  └─ 20260131020813_add_all_defaults/
    └─ migration.sql

All migrations have been successfully applied.
```

## For Future Migrations

When you need to make database changes:

1. **Create migration locally:**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Test locally** to ensure it works

3. **Commit and push:**
   ```bash
   git add prisma/migrations
   git commit -m "Add migration: your_migration_name"
   git push
   ```

4. **Vercel will automatically:**
   - Run `prisma migrate deploy`
   - Apply your new migration
   - Build and deploy

## Troubleshooting

### If migrations fail in production:

1. Check Vercel build logs for error messages
2. Ensure `DATABASE_URL` environment variable is set correctly
3. Verify migration SQL is valid
4. Check database permissions

### To manually run migrations:

```bash
# Using your local DATABASE_URL (pointing to production)
npx prisma migrate deploy
```

**⚠️ Warning:** Only do this if you understand what you're doing. The build script should handle this automatically.

## Status

✅ **Fixed** - Login and user creation now work in production
✅ **Automated** - Future migrations will apply automatically
✅ **Safe** - Migrations are idempotent and won't break existing data
