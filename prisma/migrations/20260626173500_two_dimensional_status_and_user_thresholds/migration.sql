-- Two-dimensional status model + per-user alert thresholds.

-- 1. Per-user threshold preferences (with sensible defaults for existing rows).
ALTER TABLE `users`
  ADD COLUMN `expiring_threshold_days` INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN `urgent_threshold_days` INTEGER NOT NULL DEFAULT 7;

-- 2. "expiring_soon" is no longer a lifecycle status — it's derived from the
-- renewal date. Collapse any stored rows back to `active` before dropping the
-- enum value, so no row is left referencing a value the new enum can't hold.
UPDATE `subscriptions` SET `status` = 'active' WHERE `status` = 'expiring_soon';

-- 3. Shrink the enum to the real lifecycle states.
ALTER TABLE `subscriptions`
  MODIFY COLUMN `status` ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active';
