import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const gatewayBaseUrl = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const productMediaBaseUrl = import.meta.env.VITE_PRODUCT_MEDIA_BASE_URL || 'http://localhost:5002';

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  if (imagePath.startsWith('/img/') || imagePath.startsWith('img/')) {
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${productMediaBaseUrl}${normalizedPath}`;
  }

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${gatewayBaseUrl}${normalizedPath}`;
};

const emptyForm = { name: '', description: '', category: '', brand: '', price: '', stock: '', image: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    api.get('/products')
      .then((res) => {
        setProducts(Array.isArray(res.data) ? res.data : res.data?.items || []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setSelectedImageName(file.name);
    setImagePreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imagePath = res.data?.image || '';
      setForm((prev) => ({ ...prev, image: imagePath }));
      setImagePreview(resolveImageUrl(imagePath) || imagePreview);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Tải ảnh thất bại.' });
      setImagePreview('');
      setSelectedImageName('');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      brand: form.brand,
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setAlert({ type: 'success', message: '✓ Cập nhật sản phẩm thành công.' });
      } else {
        await api.post('/products', payload);
        setAlert({ type: 'success', message: '✓ Thêm sản phẩm thành công.' });
      }
      loadProducts();
      handleCancel();
      setTimeout(() => setAlert(null), 2000);
    } catch (err) {
      setAlert({ type: 'danger', message: editingId ? 'Cập nhật sản phẩm thất bại.' : 'Thêm sản phẩm thất bại.' });
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id || product.id);
    setForm({
      name: product.name || product.title || '',
      description: product.description || '',
      category: product.category || '',
      brand: product.brand || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      image: product.image || ''
    });
    setImagePreview(product.image ? resolveImageUrl(product.image) : '');
    setSelectedImageName(product.image ? 'image' : '');
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;
    setAlert(null);
    try {
      await api.delete(`/products/${productId}`);
      setAlert({ type: 'success', message: '✓ Xóa sản phẩm thành công.' });
      loadProducts();
      setTimeout(() => setAlert(null), 2000);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Xóa sản phẩm thất bại.' });
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setImagePreview('');
    setSelectedImageName('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)' }}>
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '12px 0' }}>
        <div className="container-lg">
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Trang chủ</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>Quản lý sản phẩm</span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
        {alert && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', backgroundColor: alert.type === 'success' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)', color: alert.type === 'success' ? '#52c41a' : '#ff4d4f', border: `1px solid ${alert.type === 'success' ? '#b7eb8f' : '#ffccc7'}` }}>
            {alert.message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>📦 Quản lý sản phẩm</h1>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', backgroundColor: showForm ? 'var(--border)' : 'var(--primary)', color: showForm ? 'var(--ink)' : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }} onMouseEnter={(e) => { if (!showForm) { e.currentTarget.style.backgroundColor = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; } }} onMouseLeave={(e) => { if (!showForm) { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}>
            {showForm ? '✕ Đóng form' : '+ Thêm sản phẩm'}
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)', padding: '24px', marginBottom: '32px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Tên sản phẩm</label><input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Danh mục</label><input name="category" value={form.category} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Thương hiệu</label><input name="brand" value={form.brand} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Giá (VND)</label><input name="price" type="number" value={form.price} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Tồn kho</label><input name="stock" type="number" value={form.stock} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Ảnh sản phẩm</label><input type="file" accept="image/*" onChange={handleImageChange} disabled={uploadingImage} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} />{uploadingImage && <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>⏳ Đang tải...</div>}{selectedImageName && !uploadingImage && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{selectedImageName}</div>}</div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Mô tả</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }} /></div>
              {imagePreview && (<div style={{ gridColumn: '1 / -1', textAlign: 'center' }}><img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '6px' }} /></div>)}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCancel} style={{ padding: '10px 20px', backgroundColor: 'var(--surface-light)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>✓ {editingId ? 'Cập nhật' : 'Thêm'}</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--primary)' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Ảnh</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Tên</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Danh mục</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Giá</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Tồn kho</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Không có sản phẩm nào</td></tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id || p.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-light)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px' }}>{p.image ? (<img src={resolveImageUrl(p.image)} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />) : (<div style={{ width: '50px', height: '50px', backgroundColor: 'var(--surface-light)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📷</div>)}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500 }}>{p.name || p.title}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--muted)' }}>{p.category || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}><span style={{ padding: '4px 8px', backgroundColor: p.stock > 0 ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)', color: p.stock > 0 ? '#52c41a' : '#ff4d4f', borderRadius: '4px', fontWeight: 600 }}>{p.stock}</span></td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => handleEdit(p)} style={{ padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: '6px' }}>✏️</button>
                        <button onClick={() => handleDelete(p._id || p.id)} style={{ padding: '6px 12px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
