import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // 1. Create Campaigns Table
    await queryInterface.createTable("Campaigns", {
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
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending"
      },
      message1: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      message2: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      message3: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      message4: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      message5: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      minDelay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      maxDelay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20
      },
      tagsToAdd: {
        type: DataTypes.STRING,
        allowNull: true
      },
      kanbanStageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "KanbanStages", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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

    // 2. Create CampaignContacts Table
    await queryInterface.createTable("CampaignContacts", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      campaignId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      number: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending"
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
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

    // 3. Create CampaignWhatsapps Table
    await queryInterface.createTable("CampaignWhatsapps", {
      campaignId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "Campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "Whatsapps", key: "id" },
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

    // 4. Add tags column to Contacts Table
    await queryInterface.addColumn("Contacts", "tags", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Contacts", "tags");
    await queryInterface.dropTable("CampaignWhatsapps");
    await queryInterface.dropTable("CampaignContacts");
    await queryInterface.dropTable("Campaigns");
  }
};
