# Prisma Commands

Run these commands from `apps/api`:

```powershell
cd apps/api
```

Prisma uses `prisma/schema.prisma`, `prisma/migrations`, and `DATABASE_URL` from `.env`.

## Check the schema

```powershell
npx prisma validate
npx prisma format
```

`validate` checks the schema. `format` formats `schema.prisma`.

## Create a migration

1. Edit `prisma/schema.prisma`.
2. Check and format the schema:

```powershell
npx prisma validate
npx prisma format
```

3. Create and apply a development migration:

```powershell
npx prisma migrate dev --name describe_your_change
```

Example:

```powershell
npx prisma migrate dev --name add_weight_and_rule_config
```

This creates a folder under `prisma/migrations`, applies it to the development database, and regenerates Prisma Client.

## Check migration status

```powershell
npx prisma migrate status
```

## Apply existing migrations

Use this in CI or production:

```powershell
npx prisma migrate deploy
```

This applies committed migrations but does not create new ones.

## Inspect the database

```powershell
npx prisma studio
```

This opens Prisma Studio in a browser.

## Regenerate Prisma Client

```powershell
npx prisma generate
```

Run this if the generated client is out of date after a schema change.

## Reset a local database

```powershell
npx prisma migrate reset
```

This drops the database, reapplies all migrations, and removes local data. Do not use it for a shared or production database.

## Important migration notes

- Commit migration folders to source control.
- Do not delete an already-applied migration from a shared or production project.
- Prisma has no automatic rollback command. Create a new migration to undo a change.
- Use `prisma db push` only for disposable database experiments; it does not create migration history.
- Use `prisma db pull` to read an existing database into `schema.prisma`; review the changes before keeping them.
