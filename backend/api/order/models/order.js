"use strict";
const uuid = require("uuid");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    beforeCreate: async (model) => {
      model.uuid = uuid();
    },
  },
};
