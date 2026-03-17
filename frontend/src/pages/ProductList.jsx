import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/products')
      .then((res) => {
        if (!active) return;
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setProducts(data);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAddToCart = async (product) => {
    setAlert(null);
    const user = getStoredUser();
    if (!user?._id) {
      setAlert({ type: 'warning', message: 'Please login to add to cart.' });
      return;
    }
    try {
      await api.post('/cart/add', {
        user_id: user._id,
        product_id: product.id || product._id,
        product_name: product.name || product.title,
        price: product.price || 0,
        quantity: 1
      });
      setAlert({ type: 'success', message: 'Add to cart success.' });
    } catch (err) {
      setAlert({ type: 'danger', message: 'Add to cart failed.' });
    }
  };

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const pName = (p.name || p.title || '').toLowerCase();
      const pCategory = (p.category || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      return pName.includes(q) || pCategory.includes(q) || pBrand.includes(q);
    });
  }, [products, query]);

  const handleSearch = () => {
    setQuery(queryInput);
  };

  const handleReset = () => {
    setQueryInput('');
    setQuery('');
  };

  return (
    <div className="shop-page">
      <div className="shop-hero mb-4">
        <h2 className="mb-2">Discover Your Next Favorite</h2>
        <div className="subtitle">Top products, honest prices, fast delivery.</div>
      </div>

      <div className="mb-4">
        <div className="d-flex justify-content-end align-items-center gap-2">
          <div className="text-muted me-2">{filteredProducts.length} items</div>
          <input
            className="form-control"
            style={{ maxWidth: 260 }}
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search..."
          />
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          <button className="btn btn-outline-primary" onClick={handleReset}>Reset</button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-muted">No products found.</div>
      ) : (
        <div className="row g-3">
          {filteredProducts.map((p) => (
            <div className="col-md-4" key={p.id || p._id}>
              <div className="card h-100 product-card">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title">{p.name || p.title}</h5>
                    <span className="badge badge-soft">{p.category || 'Product'}</span>
                  </div>
                  <p className="card-text text-muted">
                    {p.description ? p.description.slice(0, 80) : 'No description'}
                  </p>
                  <div className="mt-auto d-flex gap-2">
                    <Link className="btn btn-outline-primary" to={`/products/${p.id || p._id}`}>View</Link>
                    <button className="btn btn-primary" onClick={() => handleAddToCart(p)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
