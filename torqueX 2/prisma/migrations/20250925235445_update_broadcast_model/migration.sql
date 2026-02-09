-- First add the columns as nullable
ALTER TABLE "Broadcast" ADD COLUMN "title" TEXT,
ADD COLUMN "userTarget" TEXT DEFAULT 'ALL';

-- Update existing records to have a title
UPDATE "Broadcast" SET "title" = 'Admin Broadcast' WHERE "title" IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE "Broadcast" ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "userTarget" SET NOT NULL;
