import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // 1. Add subscriptionStatus column (default 'trialing')
    await queryInterface.addColumn("Tenants", "subscriptionStatus", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "trialing"
    });

    // 2. Add dueDate column (default to 7 days from now)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    await queryInterface.addColumn("Tenants", "dueDate", {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sevenDaysFromNow
    });

    // 3. Add maxUsers column (default 3)
    await queryInterface.addColumn("Tenants", "maxUsers", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    });

    // 4. Add maxConnections column (default 1)
    await queryInterface.addColumn("Tenants", "maxConnections", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    // 5. Add planId column (default 1)
    await queryInterface.addColumn("Tenants", "planId", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    // 6. Add asaasCustomerId column
    await queryInterface.addColumn("Tenants", "asaasCustomerId", {
      type: DataTypes.STRING,
      allowNull: true
    });

    // 7. Add stripeCustomerId column
    await queryInterface.addColumn("Tenants", "stripeCustomerId", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Tenants", "subscriptionStatus");
    await queryInterface.removeColumn("Tenants", "dueDate");
    await queryInterface.removeColumn("Tenants", "maxUsers");
    await queryInterface.removeColumn("Tenants", "maxConnections");
    await queryInterface.removeColumn("Tenants", "planId");
    await queryInterface.removeColumn("Tenants", "asaasCustomerId");
    await queryInterface.removeColumn("Tenants", "stripeCustomerId");
  }
};
