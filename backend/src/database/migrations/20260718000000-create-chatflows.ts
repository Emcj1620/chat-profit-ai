import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const isSqlite = process.env.DB_DIALECT === "sqlite";

    await queryInterface.createTable("ChatFlows", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      flowData: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        ...(isSqlite
          ? {}
          : {
              references: { model: "Tenants", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE"
            })
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ChatFlows");
  }
};
