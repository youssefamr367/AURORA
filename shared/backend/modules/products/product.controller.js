import {
  createProduct,
  deleteProduct,
  getProductByProductId,
  listProducts,
  updateProduct,
} from "./product.service.js";

class ProductController {
  static async createProduct(req, res) {
    try {
      const product = await createProduct(req.body);
      res.status(201).json(product);
    } catch (err) {
      const status = err.message.includes("already exists") ? 400 : 400;
      res.status(status).json({ message: err.message });
    }
  }

  static async getAllProducts(req, res) {
    try {
      res.json(await listProducts());
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getProductById(req, res) {
    try {
      const product = await getProductByProductId(Number(req.params.productId));
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      const product = await updateProduct(Number(req.params.productId), req.body);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const product = await deleteProduct(Number(req.params.productId));
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json({ message: "Deleted." });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

export default ProductController;
