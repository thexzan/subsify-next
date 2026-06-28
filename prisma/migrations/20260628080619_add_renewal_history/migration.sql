-- CreateTable
CREATE TABLE `renewal_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subscription_id` INTEGER NOT NULL,
    `previous_renewal_date` DATE NULL,
    `new_renewal_date` DATE NOT NULL,
    `cost_snapshot` DECIMAL(12, 2) NOT NULL,
    `previous_status` ENUM('active', 'expired', 'cancelled') NOT NULL,
    `renewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `renewal_history_subscription_id_idx`(`subscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `renewal_history` ADD CONSTRAINT `renewal_history_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
