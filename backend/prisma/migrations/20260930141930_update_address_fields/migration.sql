/*
  Warnings:

  - Added the required column `updatedAt` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `address` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `label` VARCHAR(191) NULL DEFAULT 'HOME',
    ADD COLUMN `note` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'coffee';

-- AlterTable
ALTER TABLE `user` ADD COLUMN `gender` VARCHAR(10) NULL,
    ADD COLUMN `nickname` VARCHAR(50) NULL;
