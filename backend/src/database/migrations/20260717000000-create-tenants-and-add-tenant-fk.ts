import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const isSqlite = process.env.DB_DIALECT === "sqlite";

    // 1. Create Tenants Table
    await queryInterface.createTable("Tenants", {
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // 2. Insert Default Tenant (ID: 1)
    await queryInterface.bulkInsert("Tenants", [
      {
        id: 1,
        name: "Empresa Padrão",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 3. Drop and Re-create Settings Table with Composite Primary Key (key, tenantId)
    await queryInterface.dropTable("Settings");
    await queryInterface.createTable("Settings", {
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: 1,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
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

    const tables = [
      "Users",
      "Whatsapps",
      "Contacts",
      "Tickets",
      "Messages",
      "Queues",
      "QuickAnswers"
    ];

    // 4. Add tenantId column to each other table
    for (const table of tables) {
      await queryInterface.addColumn(table, "tenantId", {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
        ...(isSqlite
          ? {}
          : {
              references: { model: "Tenants", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE"
            })
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tables = [
      "Users",
      "Whatsapps",
      "Contacts",
      "Tickets",
      "Messages",
      "Queues",
      "QuickAnswers"
    ];

    for (const table of tables) {
      await queryInterface.removeColumn(table, "tenantId");
    }

    await queryInterface.dropTable("Settings");
    
    // Restore original Settings table
    await queryInterface.createTable("Settings", {
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false
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

    await queryInterface.dropTable("Tenants");
  }
};
