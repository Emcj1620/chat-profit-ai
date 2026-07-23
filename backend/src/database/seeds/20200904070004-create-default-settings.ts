import { QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.bulkInsert(
      "Settings",
      [
        {
          key: "userCreation",
          value: "enabled",
          tenantId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "primaryColor",
          value: "#3f51b5",
          tenantId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "secondaryColor",
          value: "#f50057",
          tenantId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "appName",
          value: "WhaTicket",
          tenantId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "appLogoLight",
          value: "",
          tenantId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "appLogoDark",
          value: "",
          tenantId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          key: "appFavicon",
          value: "",
          tenantId: 1,
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
