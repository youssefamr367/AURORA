import { useState, useEffect, useCallback } from "react";
import ProductModal from "../components/ProductModal.jsx";
import AddProductModal from "../components/AddProductModal.jsx";
import { fetchProducts as fetchProductsApi } from "../features/products/api.js";
import { useResponsivePageSize } from "../shared/hooks/useResponsivePageSize.js";
import PageState from "../shared/ui/PageState.jsx";
import "../CSS/ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = useResponsivePageSize("products");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setProducts(await fetchProductsApi());
    } catch (err) {
      console.error("Failed to load products:", err);
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter((product) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return (
      product.name.toLowerCase().includes(query) ||
      product.productId.toString().includes(query)
    );
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="ProductList">
      <div className="header-row">
        <h2>All Products</h2>
        <button className="add-button" onClick={() => setShowAdd(true)}>
          + Add Product
        </button>
      </div>

      <div className="search-row">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="search-input"
        />
      </div>

      <div className="product-grid">
        {loading && (
          <PageState
            title="Loading products"
            description="We are fetching the current product list."
          />
        )}

        {!loading && error && (
          <PageState
            variant="error"
            title="Could not load products"
            description={error}
          />
        )}

        {!loading &&
          !error &&
          visibleProducts.map((product) => (
            <div
              key={product._id}
              className="product-card"
              onClick={() => setSelected(product)}
            >
              <h3>{product.name}</h3>
              <p>ID: {product.productId}</p>
            </div>
          ))}

        {!loading && !error && filtered.length === 0 && (
          <PageState
            title={searchTerm.trim() ? "No matching products" : "No products yet"}
            description={
              searchTerm.trim()
                ? "Try a different product name or ID."
                : "Add a product to start building orders."
            }
            className="no-results"
          />
        )}
      </div>

      {!loading && !error && filtered.length > 0 && (
        <div className="pagination-row">
          <button
            type="button"
            className="page-button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="page-meta">
            <strong>{filtered.length}</strong> products · Page {currentPage} of {totalPages}
          </div>
          <button
            type="button"
            className="page-button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          refreshList={fetchProducts}
        />
      )}

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          refreshList={fetchProducts}
        />
      )}
    </div>
  );
};

export default ProductList;
