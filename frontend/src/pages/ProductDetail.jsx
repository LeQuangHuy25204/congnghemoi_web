import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    let active = true;
    api.get(`/products/${id}`)
      .then((res) => {
        if (!active) return;
        setProduct(res.data);
      })
      .catch(() => {
        if (!active) return;
        setProduct(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    setAlert(null);
    const user = getStoredUser();
    if (!user?._id || !product) {
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

  if (loading) return <div>Loading...</div>;
  if (!product) return <div className="text-muted">Product not found.</div>;

  return (
    <div className="row">
      <div className="col-md-8">
        <h2>{product.name || product.title}</h2>
        <p className="text-muted">{product.description || 'No description available.'}</p>
      </div>
      <div className="col-md-4">
        {alert && (
          <div className={`alert alert-${alert.type}`}>{alert.message}</div>
        )}
        <div className="card">
          <div className="card-body">
            <div className="h4 mb-3">{product.price ? `${product.price}` : 'Price not available'}</div>
            <button className="btn btn-primary w-100" onClick={handleAddToCart}>Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}
