import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // 1. Update Tenants table
    // Set dueDate of Tenant 1 to far in the future
    await queryInterface.sequelize.query(
      "UPDATE `Tenants` SET `dueDate` = '2035-12-31 23:59:59', `subscriptionStatus` = 'active' WHERE `id` = 1"
    );

    // Also update any other tenants to be active with far due date so they are unblocked immediately
    await queryInterface.sequelize.query(
      "UPDATE `Tenants` SET `dueDate` = '2035-12-31 23:59:59', `subscriptionStatus` = 'active'"
    );

    // 2. Locate user with email 'emersonpyres@gmail.com' and set their tenantId to 1, and profile to 'admin'
    await queryInterface.sequelize.query(
      "UPDATE `Users` SET `tenantId` = 1, `profile` = 'admin' WHERE `email` = 'emersonpyres@gmail.com'"
    );
  },

  down: async (queryInterface: QueryInterface) => {
    // No need to undo this migration
  }
};
