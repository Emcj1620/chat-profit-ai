import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Whatsapps", "name", {
      type: DataTypes.STRING,
      allowNull: false,
      unique: process.env.DB_DIALECT === "sqlite" ? false : true
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Whatsapps", "name");
  }
};
