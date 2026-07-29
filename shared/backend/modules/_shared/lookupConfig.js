export const LOOKUPS = {
  fabrics: {
    table: "fabrics",
    join: "product_fabrics",
    productKey: "fabric_id",
    orderJoin: "order_item_fabrics",
    orderKey: "fabric_id",
  },
  eshra: {
    table: "eshra",
    join: "product_eshra",
    productKey: "eshra_id",
    orderJoin: "order_item_eshra",
    orderKey: "eshra_id",
  },
  paintings: {
    table: "paintings",
    join: "product_paintings",
    productKey: "painting_id",
    orderJoin: "order_item_paintings",
    orderKey: "painting_id",
  },
  marble: {
    table: "marbles",
    join: "product_marbles",
    productKey: "marble_id",
    orderJoin: "order_item_marbles",
    orderKey: "marble_id",
  },
  glass: {
    table: "glass",
    join: "product_glass",
    productKey: "glass_id",
    orderJoin: "order_item_glass",
    orderKey: "glass_id",
  },
};
