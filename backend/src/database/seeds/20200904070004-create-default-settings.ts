import { QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.bulkInsert(
      "Settings",
      [
        {
          key: "userCreation",
          value: "enabled",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "primaryColor",
          value: "#3f51b5",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "secondaryColor",
          value: "#f50057",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "appName",
          value: "WhaTicket",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "appLogoLight",
          value: "",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "appLogoDark",
          value: "",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "appFavicon",
          value: "",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Settings", {});
  }
};
