import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Contacts", "lid", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      unique: process.env.DB_DIALECT === "sqlite" ? false : true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Contacts", "lid");
  }
};
