-- --------------------------------------------------------
--
-- Table structure for table `leaves`
--
START TRANSACTION;

CREATE TABLE `leaves` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `leave_date` date NOT NULL,
  `reason` text,
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0 = Applied | 1 = Approved | 2 = Rejected',
  `approver_reason` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `leaves`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `leaves`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

COMMIT;
-- --------------------------------------------------------


-- --------------------------------------------------------
--
-- Table structure for table `teams`
--
START TRANSACTION;

CREATE TABLE `teams` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `teams`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

COMMIT;
-- --------------------------------------------------------


-- --------------------------------------------------------
--
-- Table structure for table `team_users`
--
START TRANSACTION;

CREATE TABLE `team_users` (
  `id` int NOT NULL,
  `team_id` int NOT NULL,
  `user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `team_users`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `team_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

COMMIT;
-- --------------------------------------------------------


-- --------------------------------------------------------
--
-- Table structure for table `users`
--
START TRANSACTION;

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `signum` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(600) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_admin` tinyint NOT NULL DEFAULT '0' COMMENT '0 = No | 1 = Yes',
  `manager` int DEFAULT NULL,
  `active` tinyint NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
COMMIT;
-- --------------------------------------------------------