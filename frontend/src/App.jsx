import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import Home from './pages/Home.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Support from './pages/Support.jsx';
import Chatbot from './pages/Chatbot.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import Orders from './pages/Orders.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import EmployeeSupport from './pages/EmployeeSupport.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container my-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/history" element={<OrderHistory />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Route>

          <Route element={<ProtectedRoute role="employee" />}>
            <Route path="/employee/support" element={<EmployeeSupport />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/support" element={<Support />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </div>
      <ChatWidget />
    </BrowserRouter>
  );
}
