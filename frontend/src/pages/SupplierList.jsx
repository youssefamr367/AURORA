import { useState, useEffect, useCallback } from "react";
import SupplierModal from "../components/SupplierModal.jsx";
import AddSupplierModal from "../components/AddSupplierModal.jsx";
import { fetchSuppliers as fetchSuppliersApi } from "../features/suppliers/api.js";
import PageState from "../shared/ui/PageState.jsx";
import "../CSS/SupplierList.css";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setSuppliers(await fetchSuppliersApi());
    } catch (err) {
      console.error("Failed to load suppliers:", err);
      setError(err.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filtered = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="SupplierList">
      <div className="header-row">
        <h2>All Suppliers</h2>
        <button className="add-button" onClick={() => setShowAdd(true)}>
          + Add Supplier
        </button>
      </div>

      <div className="filter-row">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="search-input"
        />
      </div>

      <div className="supplier-grid">
        {loading && (
          <PageState
            title="Loading suppliers"
            description="We are fetching the current supplier list."
          />
        )}

        {!loading && error && (
          <PageState
            variant="error"
            title="Could not load suppliers"
            description={error}
          />
        )}

        {!loading &&
          !error &&
          filtered.map((supplier) => (
            <div
              key={supplier._id}
              className="supplier-card"
              onClick={() => setSelected(supplier)}
            >
              <h3>{supplier.name}</h3>
              <p>{supplier.number ? `${supplier.number}` : "No phone number"}</p>
            </div>
          ))}

        {!loading && !error && filtered.length === 0 && (
          <PageState
            title={searchTerm.trim() ? "No matching suppliers" : "No suppliers yet"}
            description={
              searchTerm.trim()
                ? "Try a different supplier name."
                : "Add a supplier to make products available for order entry."
            }
            className="no-results"
          />
        )}
      </div>

      {selected && (
        <SupplierModal
          supplier={selected}
          onClose={() => setSelected(null)}
          refreshList={fetchSuppliers}
        />
      )}

      {showAdd && (
        <AddSupplierModal
          onClose={() => setShowAdd(false)}
          refreshList={fetchSuppliers}
        />
      )}
    </div>
  );
};

export default SupplierList;
