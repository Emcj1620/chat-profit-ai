import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Whatsapps", "gptEnabled", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn("Whatsapps", "gptApiKey", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn("Whatsapps", "gptModel", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "gpt-4o-mini"
    });

    await queryInterface.addColumn("Whatsapps", "gptPrompt", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Whatsapps", "gptGuidelines", {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("Whatsapps", "gptTemperature", {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.7
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Whatsapps", "gptEnabled");
    await queryInterface.removeColumn("Whatsapps", "gptApiKey");
    await queryInterface.removeColumn("Whatsapps", "gptModel");
    await queryInterface.removeColumn("Whatsapps", "gptPrompt");
    await queryInterface.removeColumn("Whatsapps", "gptGuidelines");
    await queryInterface.removeColumn("Whatsapps", "gptTemperature");
  }
};
