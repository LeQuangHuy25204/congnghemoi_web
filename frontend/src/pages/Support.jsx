import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  const [chatInput, setChatInput] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTickets = () => {
    const user = getStoredUser();
    if (!user?._id) return;
    api
      .get(`/support/tickets/${user._id}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setTickets(data);
        if (data.length && !selectedTicket) {
          setSelectedTicket(data[0]);
        }
      })
      .catch(() => setTickets([]));
  };

  const loadMessages = (ticketId) => {
    if (!ticketId) return;
    api
      .get(`/support/ticket/${ticketId}/messages`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setMessages(data);
      })
      .catch(() => setMessages([]));
  };

  const loadHistory = (ticketId) => {
    if (!ticketId) return;
    api
      .get(`/support/ticket/${ticketId}/history`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setHistory(data);
      })
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    const ticketId = selectedTicket?._id || selectedTicket?.id;
    loadMessages(ticketId);
    loadHistory(ticketId);
  }, [selectedTicket]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    const user = getStoredUser();
    try {
      await api.post('/support/ticket', {
        user_id: user._id,
        title: form.title,
        message: form.message,
        status: 'open',
        actor_id: user._id,
        actor_role: 'customer'
      });
      setAlert({ type: 'success', message: '✓ Phiếu hỗ trợ đã được tạo thành công.' });
      setForm({ title: '', message: '' });
      loadTickets();
      setTimeout(() => setAlert(null), 2000);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Tạo phiếu hỗ trợ thất bại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const user = getStoredUser();
    const ticketId = selectedTicket?._id || selectedTicket?.id;
    if (!ticketId || !chatInput.trim()) return;
    try {
      await api.post(`/support/ticket/${ticketId}/message`, {
        sender_id: user._id,
        sender_role: 'customer',
        content: chatInput.trim()
      });
      setChatInput('');
      loadMessages(ticketId);
      loadHistory(ticketId);
    } catch {
      setAlert({ type: 'danger', message: 'Gửi tin nhắn thất bại.' });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return { bg: 'rgba(24, 144, 255, 0.1)', text: 'var(--primary)', label: '🔵 Đang mở' };
      case 'pending':
        return { bg: 'rgba(250, 173, 20, 0.1)', text: '#faad14', label: '🟡 Chờ xử lý' };
      case 'closed':
        return { bg: 'rgba(82, 196, 26, 0.1)', text: '#52c41a', label: '🟢 Đã đóng' };
      default:
        return { bg: 'rgba(130, 130, 130, 0.1)', text: '#828282', label: '⚪ Không xác định' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)' }}>
      {/* Breadcrumb */}
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '12px 0' }}>
        <div className="container-lg">
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Trang chủ
            </Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>Hỗ trợ</span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
        {/* Alert */}
        {alert && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              backgroundColor:
                alert.type === 'success'
                  ? 'rgba(82, 196, 26, 0.1)'
                  : 'rgba(255, 77, 79, 0.1)',
              color:
                alert.type === 'success'
                  ? '#52c41a'
                  : '#ff4d4f',
              border: `1px solid ${
                alert.type === 'success'
                  ? '#b7eb8f'
                  : '#ffccc7'
              }`
            }}
          >
            {alert.message}
          </div>
        )}

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '32px' }}>
          💬 Hỗ trợ khách hàng
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
          {/* Sidebar - New Ticket Form */}
          <div>
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-light)',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase' }}>
                ✏️ Tạo phiếu hỗ trợ
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="Nhập tiêu đề phiếu hỗ trợ"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Mô tả chi tiết
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    placeholder="Mô tả chi tiết vấn đề của bạn"
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {loading ? '⏳ Tạo...' : '✓ Tạo phiếu'}
                </button>
              </form>
            </div>

            {/* Tickets List */}
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--primary-light)'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                  📋 Phiếu của tôi
                </h3>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {tickets.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                    Không có phiếu hỗ trợ nào
                  </div>
                ) : (
                  tickets.map((t) => {
                    const isActive = (selectedTicket?._id || selectedTicket?.id) === (t._id || t.id);
                    const statusColor = getStatusColor(t.status);
                    return (
                      <button
                        type="button"
                        key={t._id || t.id}
                        onClick={() => setSelectedTicket(t)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                          backgroundColor: isActive ? 'var(--primary-light)' : 'var(--surface)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          borderRadius: 0,
                          borderBottom: '1px solid var(--border-light)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'var(--surface-light)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'var(--surface)';
                          }
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.message}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {statusColor.label}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Ticket Detail */}
          <div>
            {!selectedTicket ? (
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border-light)',
                padding: '60px 40px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📌</div>
                <h2 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>Chọn một phiếu hỗ trợ</h2>
                <p style={{ color: 'var(--muted)' }}>Bên trái để xem chi tiết và trả lời tin nhắn</p>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                height: '800px'
              }}>
                {/* Header */}
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', margin: 0, marginBottom: '8px' }}>
                      {selectedTicket.title}
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0, marginBottom: '12px' }}>
                      {selectedTicket.message}
                    </p>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    backgroundColor: getStatusColor(selectedTicket.status).bg,
                    color: getStatusColor(selectedTicket.status).text,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {getStatusColor(selectedTicket.status).label}
                  </div>
                </div>

                {/* Messages Area */}
                <div style={{
                  flex: 1,
                  padding: '20px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: 'var(--surface-light)'
                }}>
                  {messages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      color: 'var(--muted)',
                      paddingTop: '40px'
                    }}>
                      Chưa có tin nhắn nào
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m._id || m.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '6px',
                          backgroundColor: m.sender_role === 'customer' ? 'var(--primary-light)' : 'white',
                          border: '1px solid var(--border-light)',
                          maxWidth: '80%',
                          marginLeft: m.sender_role === 'customer' ? 'auto' : 0
                        }}
                      >
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                          {m.sender_role === 'customer' ? '👤 Bạn' : '👨‍💼 Nhân viên hỗ trợ'} • {new Date(m.createdAt).toLocaleString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5' }}>
                          {m.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    📤 Gửi
                  </button>
                </div>

                {/* History */}
                {history.length > 0 && (
                  <div style={{
                    padding: '16px',
                    borderTop: '1px solid var(--border-light)',
                    backgroundColor: 'var(--surface-light)',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      📝 Lịch sử
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {history.map((h) => (
                        <div key={h._id || h.id} style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          <span style={{ fontWeight: 600 }}>{h.action}</span> • {new Date(h.createdAt).toLocaleString('vi-VN')}
                          {h.note && <div style={{ marginTop: '2px', fontStyle: 'italic' }}>"{h.note}"</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
