-- Add the owner column as nullable first so existing rows can be backfilled.
ALTER TABLE `subscriptions` ADD COLUMN `user_id` INTEGER NULL;

-- Backfill existing subscriptions to the earliest user (the seeded admin).
-- Safe for production: any pre-existing rows are assigned to the first account.
UPDATE `subscriptions`
SET `user_id` = (SELECT `id` FROM `users` ORDER BY `id` ASC LIMIT 1)
WHERE `user_id` IS NULL;

-- Now enforce NOT NULL.
ALTER TABLE `subscriptions` MODIFY COLUMN `user_id` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `subscriptions_user_id_idx` ON `subscriptions`(`user_id`);

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
