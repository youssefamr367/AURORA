// @ts-ignore
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import PageState from "./shared/ui/PageState.jsx";

const ProductList = lazy(() => import("./pages/ProductList.jsx"));
const OrderList = lazy(() => import("./pages/OrderList.jsx"));
const SupplierList = lazy(() => import("./pages/SupplierList.jsx"));
const OrderDashboard = lazy(() => import("./pages/OrderDashboard.jsx"));
const LookupManager = lazy(() => import("./pages/LookupManager.jsx"));

const routeFallback = (
  <div className="container">
    <PageState
      title="Loading page"
      description="Preparing the selected workspace."
    />
  </div>
);

const App = () => (
  <Router>
    <div className="app-shell">
      <Navbar />
      <Suspense fallback={routeFallback}>
        <div className="container">
          <Routes>
            <Route path="/" element={<OrderDashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/suppliers" element={<SupplierList />} />
            <Route path="/Materials" element={<LookupManager />} />
          </Routes>
        </div>
      </Suspense>
    </div>
  </Router>
);

export default App;
