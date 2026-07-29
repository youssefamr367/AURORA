import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from "./supplier.service.js";

class SupplierController {
  static async createSupplier(req, res) {
    try {
      res.status(201).json(await createSupplier(req.body));
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getAllSuppliers(req, res) {
    try {
      res.json(await listSuppliers());
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async updateSupplier(req, res) {
    try {
      const supplier = await updateSupplier(req.params.id, req.body);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      res.json(supplier);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async deleteSupplier(req, res) {
    try {
      const supplier = await deleteSupplier(req.params.id);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      res.json({ message: "Deleted." });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

export default SupplierController;
