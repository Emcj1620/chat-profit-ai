import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const isSqlite = process.env.DB_DIALECT === "sqlite";

    // 1. Add columns to Whatsapps
    await queryInterface.addColumn("Whatsapps", "flowId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      ...(isSqlite
        ? {}
        : {
            references: { model: "ChatFlows", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
          })
    });

    // 2. Add columns to Tickets
    await queryInterface.addColumn("Tickets", "flowId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      ...(isSqlite
        ? {}
        : {
            references: { model: "ChatFlows", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
          })
    });

    await queryInterface.addColumn("Tickets", "flowNodeId", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn("Tickets", "flowState", {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Whatsapps", "flowId");
    await queryInterface.removeColumn("Tickets", "flowId");
    await queryInterface.removeColumn("Tickets", "flowNodeId");
    await queryInterface.removeColumn("Tickets", "flowState");
  }
};
