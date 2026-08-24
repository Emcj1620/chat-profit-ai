import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Whatsapps", "typebotEnabled", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn("Whatsapps", "typebotUrl", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Whatsapps", "typebotName", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Whatsapps", "typebotViewerId", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Whatsapps", "n8nEnabled", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn("Whatsapps", "n8nUrl", {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Whatsapps", "typebotEnabled");
    await queryInterface.removeColumn("Whatsapps", "typebotUrl");
    await queryInterface.removeColumn("Whatsapps", "typebotName");
    await queryInterface.removeColumn("Whatsapps", "typebotViewerId");
    await queryInterface.removeColumn("Whatsapps", "n8nEnabled");
    await queryInterface.removeColumn("Whatsapps", "n8nUrl");
  }
};
