"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const validateProductsArray = (products) => {
  if (!products || products.length === 0) {
    throw new Error("Missing `products` in body");
  }
  products.forEach((product) => {
    if (!product.requested_quantity || product.requested_quantity < 0) {
      throw new Error("missing `requested_quantity`");
    }
    if (!product.id) {
      throw new Error("missing product.`id`");
    }
  });
};
module.exports = {
  create: async (ctx, next) => {
    const {
      request: {
        body: { products },
      },
    } = ctx;
    try {
      validateProductsArray(products);
      let order = await strapi.query("order").create({ total_cost: 0 });
      console.log("🚀 ~ file: order.js ~ line 30 ~ create: ~ order", order);
      let productsArr = await strapi.query("product").find({
        id: products.map((x) => x.id),
      });
      let productsMap = productsArr.reduce((acc, curr) => {
        return { ...acc, [curr.id]: curr };
      }, {});
      let orderProducts = products.map((x) => {
        const product = productsMap[x.id];
        if (product.available_quantity < x.requested_quantity) {
          throw new Error(`Not enough quantity for ${product.title}`);
        }
        return {
          product: product.id,
          order: order.id,
          requested_quantity: x.requested_quantity,
          cost: product.price * x.requested_quantity,
        };
      });

      orderProducts = orderProducts.map((x) => {
        return strapi.query("order-product").create(x);
      });
      orderProducts = await Promise.all(orderProducts);
      // calculating total amount
      let totalAmount = orderProducts
        .map((x) => x.cost)
        .reduce((acc, curr) => acc + curr, 0);

      order = await strapi.query("order").update(
        { id: order.id },
        {
          total_cost: totalAmount,
        }
      );
      return ctx.response.send({
        order,
        orderProducts,
      });
    } catch (err) {
      ctx.badRequest(null, {
        message: err.message,
      });
    }
  },
};
