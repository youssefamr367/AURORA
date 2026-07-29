import {
  createLookup,
  deleteLookup,
  listLookup,
} from "./lookup.service.js";

export function createLookupController({ table, label }) {
  return {
    async create(req, res) {
      try {
        res.status(201).json(await createLookup(table, req.body));
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },

    async list(req, res) {
      try {
        res.json(await listLookup(table));
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },

    async remove(req, res) {
      try {
        const deleted = await deleteLookup(table, req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: `${label} not found` });
        }
        res.json({ message: `${label} deleted` });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
  };
}
