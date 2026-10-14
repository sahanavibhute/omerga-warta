import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DEFAULT_NEWS, 
  DEFAULT_RASHI 
} from './mockData';
import { 
  autoTranslateMarathiToEnglish, 
  autoTranslateCategory, 
  autoTranslateColor 
} from './translator';
import { 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ArrowLeft, 
  X, 
  Lock, 
  ShieldCheck, 
  CheckCircle, 
  Upload,
  LogOut,
  FileText,
  Eye,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { saveEpaperPdf, getEpaperPdf, deleteEpaperPdf } from './pdfStorage';
import { addNewsToSupabase, updateNewsInSupabase, deleteNewsFromSupabase } from './supabase';

export default function AdminPage() {
  const navigate = useNavigate();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('ow_secure_auth') === 'verified_mahesh_2026';
  });

  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // News State: Auto-filters any posts older than 7 days (1 week)
  const [news, setNews] = useState(() => {
    const saved = localStorage.getItem('ow_news');
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const initial = saved ? JSON.parse(saved) : DEFAULT_NEWS;
    return initial.filter(item => {
      const itemTime = item.createdAt || item.id || Date.now();
      return itemTime >= oneWeekAgo;
    });
  });

  // Rashi State
  const [rashiList, setRashiList] = useState(() => {
    const saved = localStorage.getItem('ow_rashi');
    return saved ? JSON.parse(saved) : DEFAULT_RASHI;
  });

  // E-Paper PDF State
  const [epaperData, setEpaperData] = useState(() => {
    const saved = localStorage.getItem('ow_epaper');
    return saved ? JSON.parse(saved) : {
      title_mr: "उमरगा वार्ता - आजची मुख्य आवृत्ती",
      date: new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      pdfUrl: "",
      fileName: ""
    };
  });

  // Admin Tab: 'news', 'rashi', or 'epaper'
  const [adminTab, setAdminTab] = useState('news');
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const fileInputRef = useRef(null);
  const epaperPdfRef = useRef(null);

  // News Form Fields
  const [formNews, setFormNews] = useState({
    title_mr: '',
    category_mr: 'उमरगा विशेष',
    image: '',
    content_mr: '',
    author: 'महेश निंबरगे'
  });
  const [imagePreview, setImagePreview] = useState('');

  // Rashi Form Fields
  const [selectedAdminRashiId, setSelectedAdminRashiId] = useState(1);
  const [formRashi, setFormRashi] = useState({
    prediction_mr: '',
    lucky_color_mr: ''
  });

  // Save changes to localStorage so public portal reflects them immediately
  useEffect(() => {
    localStorage.setItem('ow_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('ow_rashi', JSON.stringify(rashiList));
  }, [rashiList]);

  // Load existing PDF on component mount
  useEffect(() => {
    getEpaperPdf().then(saved => {
      if (saved) {
        setEpaperData({
          title_mr: saved.title_mr || "उमरगा वार्ता - आजची मुख्य आवृत्ती",
          date: saved.date,
          pdfUrl: saved.pdfUrl,
          fileName: saved.fileName
        });
      }
    });
  }, []);

  // E-Paper PDF Upload Handler with IndexedDB
  const handleEpaperPdfUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('कृपया फक्त PDF फाइल निवडा (Only PDF files allowed).');
        return;
      }
      try {
        const item = await saveEpaperPdf(file, {
          title_mr: epaperData.title_mr,
          date: new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        });
        const objectUrl = URL.createObjectURL(file);
        setEpaperData({
          title_mr: item.title_mr,
          date: item.date,
          pdfUrl: objectUrl,
          fileName: item.fileName
        });
        showToast('ई-पेपर PDF यशस्वीरीत्या सेव्ह व प्रकाशित झाली!');
      } catch (err) {
        console.error(err);
        alert('PDF सेव्ह करताना एरर आली. कृपया पुन्हा प्रयत्न करा.');
      }
    }
  };

  // Delete E-Paper PDF Handler
  const handleDeleteEpaperPdf = async () => {
    if (window.confirm('तुम्हाला सध्याचा ई-पेपर कायमचा हटवायचा आहे का? (Confirm delete e-paper PDF?)')) {
      await deleteEpaperPdf();
      setEpaperData({
        title_mr: "उमरगा वार्ता - आजची मुख्य आवृत्ती",
        date: new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        pdfUrl: "",
        fileName: ""
      });
      if (epaperPdfRef.current) epaperPdfRef.current.value = '';
      showToast('ई-पेपर यशस्वीरीत्या हटवण्यात आला!');
    }
  };

  // Sync selected rashi form
  useEffect(() => {
    const r = rashiList.find(x => x.id === selectedAdminRashiId);
    if (r) {
      setFormRashi({
        prediction_mr: r.prediction_mr || '',
        lucky_color_mr: r.lucky_color_mr || ''
      });
    }
  }, [selectedAdminRashiId, rashiList]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Secure Login Handler: Exact ID & Password requested
  const handleSecureLogin = (e) => {
    e.preventDefault();
    if (inputUsername === 'adminmahesh' && inputPassword === 'admin55@') {
      setIsAuthenticated(true);
      sessionStorage.setItem('ow_secure_auth', 'verified_mahesh_2026');
      setLoginError('');
      showToast('संपादक लॉगिन यशस्वी झाले!');
    } else {
      setLoginError('चुकीचा आयडी किंवा पासवर्ड! प्रवेश नाकारला आहे.');
      setInputPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ow_secure_auth');
    navigate('/');
  };

  // Image Upload Handler
  const handleImageFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('कृपया 5MB पेक्षा लहान फोटो निवडा.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormNews(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save News
  const handleSaveNews = (e) => {
    e.preventDefault();
    if (!formNews.title_mr.trim() || !formNews.content_mr.trim()) {
      alert('कृपया मराठी बातमीचे शीर्षक व मजकूर आवश्यक भरा.');
      return;
    }

    const nowObj = new Date();
    const todayDate = nowObj.toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const postTime = nowObj.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const formattedPostDateTime = `${todayDate} • ${postTime}`;

    const autoTitleEn = autoTranslateMarathiToEnglish(formNews.title_mr);
    const autoContentEn = autoTranslateMarathiToEnglish(formNews.content_mr);
    const autoCategoryEn = autoTranslateCategory(formNews.category_mr);

    if (editingNewsId) {
      updateNewsInSupabase(editingNewsId, {
        title_mr: formNews.title_mr,
        title_en: autoTitleEn,
        category_mr: formNews.category_mr,
        category_en: autoCategoryEn,
        content_mr: formNews.content_mr,
        content_en: autoContentEn,
        image: formNews.image || '/logo.jpg'
      });

      setNews(prev => prev.map(item => {
        if (item.id === editingNewsId) {
          return {
            ...item,
            title_mr: formNews.title_mr,
            title_en: autoTitleEn,
            category_mr: formNews.category_mr,
            category_en: autoCategoryEn,
            content_mr: formNews.content_mr,
            content_en: autoContentEn,
            image: formNews.image || item.image || '/logo.jpg'
          };
        }
        return item;
      }));
      showToast('बातमी यशस्वीरीत्या अपडेट करण्यात आली!');
    } else {
      const now = Date.now();
      const newEntry = {
        id: now,
        createdAt: now,
        title_mr: formNews.title_mr,
        title_en: autoTitleEn,
        category_mr: formNews.category_mr,
        category_en: autoCategoryEn,
        content_mr: formNews.content_mr,
        content_en: autoContentEn,
        image: formNews.image || '/logo.jpg',
        date: formattedPostDateTime,
        views: 150,
        featured: false
      };

      addNewsToSupabase(newEntry).then(cloudDoc => {
        if (cloudDoc && cloudDoc.id) {
          newEntry.id = cloudDoc.id;
        }
      });

      setNews(prev => [newEntry, ...prev]);
      showToast('नवीन बातमी यशस्वीरीत्या प्रकाशित झाली!');
    }

    setEditingNewsId(null);
    setImagePreview('');
    setFormNews({
      title_mr: '',
      category_mr: 'उमरगा विशेष',
      image: '',
      content_mr: '',
      author: 'महेश निंबरगे'
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditClick = (story) => {
    setEditingNewsId(story.id);
    setFormNews({
      title_mr: story.title_mr || '',
      category_mr: story.category_mr || 'उमरगा विशेष',
      image: story.image || '',
      content_mr: story.content_mr || '',
      author: story.author || 'महेश निंबरगे'
    });
    setImagePreview(story.image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('तुम्हाला ही बातमी कायमची काढून टाकायची आहे का?')) {
      deleteNewsFromSupabase(id);
      setNews(prev => prev.filter(x => x.id !== id));
      showToast('बातमी हटवली आहे.');
    }
  };

  // Save Rashi with Today's Date Stamp (Replaces previous day's horoscope cleanly)
  const handleSaveRashi = (e) => {
    e.preventDefault();
    const autoPredEn = autoTranslateMarathiToEnglish(formRashi.prediction_mr);
    const autoColorEn = autoTranslateColor(formRashi.lucky_color_mr);
    const todayFormatted = new Date().toLocaleDateString('mr-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    setRashiList(prev => prev.map(r => {
      if (r.id === selectedAdminRashiId) {
        return {
          ...r,
          prediction_mr: formRashi.prediction_mr,
          prediction_en: autoPredEn,
          lucky_color_mr: formRashi.lucky_color_mr,
          lucky_color_en: autoColorEn,
          updated_date: todayFormatted,
          updated_at: Date.now()
        };
      }
      return r;
    }));
    showToast('आजचे राशी भविष्य अपडेट झाले!');
  };

  // ================= STRICT AUTH GUARD =================
  // If not authenticated, render ONLY the secure login screen. Admin data cannot be accessed under any circumstances.
  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen">
        <div className="admin-auth-card">
          <div className="admin-lock-icon-wrap">
            <Lock size={36} color="#0b3c75" />
          </div>
          <h2 className="admin-lock-title">संपादक नियंत्रण कक्ष (Restricted)</h2>
          <p className="admin-lock-sub">फक्त अधिकृत संपादकांसाठी राखीव सुरक्षित पोर्टल</p>

          {loginError && (
            <div className="login-error-alert" style={{ textAlign: 'left', marginTop: '14px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleSecureLogin} className="admin-form" style={{ marginTop: '18px' }}>
            <div className="form-group">
              <label>संपादक आयडी (Admin ID)</label>
              <input 
                type="text" 
                placeholder="Enter Admin ID" 
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>पासवर्ड (Password)</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary-action" style={{ width: '100%', marginTop: '8px' }}>
              सुरक्षित लॉगिन करा
            </button>
          </form>

          <button onClick={() => navigate('/')} className="btn-back-home-text">
            ← मुख्य न्यूज पोर्टलवर परत जा
          </button>
        </div>
      </div>
    );
  }

  // ================= AUTHENTICATED DASHBOARD =================
  return (
    <div className="admin-dashboard-wrapper">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="floating-toast">
          <CheckCircle size={20} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <div className="admin-top-bar">
        <div className="container admin-top-bar-inner">
          <div className="admin-brand-side">
            <ShieldCheck size={22} color="#10b981" />
            <div>
              <strong>उमरगा वार्ता | संपादक कक्ष</strong>
              <span className="admin-auth-tag">Authenticated: adminmahesh</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="back-portal-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={15} /> पोर्टल पहा (View Site)
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={15} /> लॉगआउट (Logout)
            </button>
          </div>
        </div>
      </div>

      <div className="container admin-container">
        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab-btn ${adminTab === 'news' ? 'active' : ''}`}
            onClick={() => setAdminTab('news')}
          >
            <PlusCircle size={18} /> बातम्या व्यवस्थापन (News Management)
          </button>
          <button 
            className={`admin-tab-btn ${adminTab === 'rashi' ? 'active' : ''}`}
            onClick={() => setAdminTab('rashi')}
          >
            <Sparkles size={18} /> राशी भविष्य अपडेट (Horoscope)
          </button>
          <button 
            className={`admin-tab-btn ${adminTab === 'epaper' ? 'active' : ''}`}
            onClick={() => setAdminTab('epaper')}
          >
            <FileText size={18} /> ई-पेपर PDF अपलोड (E-Paper)
          </button>
        </div>

        {/* TAB 1: NEWS */}
        {adminTab === 'news' && (
          <div className="admin-grid-layout">
            {/* Form */}
            <div className="admin-card">
              <h3 className="admin-card-title">
                {editingNewsId ? <Edit3 size={20} color="#0b3c75" /> : <PlusCircle size={20} color="#d32f2f" />}
                {editingNewsId ? 'बातमी संपादित करा' : 'नवीन बातमी पोस्ट करा'}
              </h3>

              <form onSubmit={handleSaveNews} className="admin-form">
                <div className="form-group">
                  <label>बातमीचे शीर्षक (मराठी) *</label>
                  <input 
                    type="text" 
                    placeholder="उदा. उमरगा तालुक्यात नवीन योजना सुरू..." 
                    value={formNews.title_mr}
                    onChange={(e) => setFormNews({...formNews, title_mr: e.target.value})}
                    required
                  />
                  <small style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Sparkles size={14} /> इंग्रजी भाषांतर पोर्टल आपोआप तयार करेल.
                  </small>
                </div>

                <div className="form-group">
                  <label>विभाग (Category)</label>
                  <select 
                    value={formNews.category_mr}
                    onChange={(e) => setFormNews({...formNews, category_mr: e.target.value})}
                  >
                    <option value="उमरगा विशेष">उमरगा विशेष (Omerga Special)</option>
                    <option value="महाराष्ट्र / जिल्हा">महाराष्ट्र / जिल्हा (Maharashtra / District)</option>
                    <option value="कृषी व बाजारभाव">कृषी व बाजारभाव (Agriculture & Market)</option>
                    <option value="शिक्षण व करिअर">शिक्षण व करिअर (Education & Career)</option>
                    <option value="राजकारण">राजकारण (Politics)</option>
                  </select>
                </div>

                {/* Device Image Upload */}
                <div className="form-group">
                  <label>बातमीचा फोटो (Device मधून निवडा) *</label>
                  <div 
                    className="device-upload-dropzone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                    {imagePreview ? (
                      <div className="device-preview-box">
                        <img src={imagePreview} alt="Preview" className="device-img-preview" />
                        <div className="device-reselect-tag">
                          <Upload size={14} /> दुसरा फोटो निवडा (Change Image)
                        </div>
                      </div>
                    ) : (
                      <div className="device-empty-upload">
                        <Upload size={30} color="#0b3c75" />
                        <p style={{ fontWeight: 700, margin: '6px 0 2px' }}>गॅलरी / कॉम्प्युटरमधून फोटो निवडा</p>
                        <small style={{ color: '#64748b' }}>JPG, PNG किंवा WebP (कमाल 5MB)</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>सविस्तर बातमी मजकूर (मराठी) *</label>
                  <textarea 
                    rows={6} 
                    placeholder="बातमीचा सविस्तर मजकूर येथे मराठीत लिहा..."
                    value={formNews.content_mr}
                    onChange={(e) => setFormNews({...formNews, content_mr: e.target.value})}
                    required
                  />
                  <small style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Sparkles size={14} /> इंग्रजी मजकूर आपोआप तयार होईल.
                  </small>
                </div>

                <div className="form-action-btns">
                  <button type="submit" className="btn-primary-action">
                    {editingNewsId ? 'बदल सेव्ह करा (Update)' : 'पोर्टलवर प्रकाशित करा (Publish)'}
                  </button>
                  {editingNewsId && (
                    <button 
                      type="button" 
                      className="btn-cancel-action"
                      onClick={() => {
                        setEditingNewsId(null);
                        setImagePreview('');
                        setFormNews({
                          title_mr: '',
                          category_mr: 'उमरगा विशेष',
                          image: '',
                          content_mr: '',
                          author: 'महेश निंबरगे'
                        });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      रद्द करा
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Published Stories List */}
            <div className="admin-card">
              <h3 className="admin-card-title">
                प्रकाशित बातम्या ({news.length})
              </h3>
              <div className="admin-stories-list">
                {news.map(item => (
                  <div key={item.id} className="admin-story-card">
                    <img 
                      src={item.image || '/logo.jpg'} 
                      alt="thumb" 
                      className="admin-story-img"
                      onError={(e) => { e.target.src = '/logo.jpg'; }}
                    />
                    <div className="admin-story-content">
                      <div className="admin-story-top">
                        <span className="table-badge">{item.category_mr}</span>
                        <span className="admin-story-date">{item.date || 'आज'}</span>
                      </div>
                      <h4 className="admin-story-title">{item.title_mr}</h4>
                      <p className="admin-story-sub">{item.title_en || ''}</p>
                      <div className="admin-story-actions">
                        <button 
                          className="btn-admin-edit" 
                          onClick={() => handleEditClick(item)}
                        >
                          <Edit3 size={15} /> बातमी एडिट करा
                        </button>
                        <button 
                          className="btn-admin-del" 
                          onClick={() => handleDeleteClick(item.id)}
                        >
                          <Trash2 size={15} /> डिलीट करा
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RASHI */}
        {adminTab === 'rashi' && (
          <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="admin-card-title">
              <Sparkles size={20} color="#f59e0b" />
              दैनिक राशी भविष्य अद्ययावत करा
            </h3>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>रास निवडा (Select Sign):</label>
              <select 
                className="large-select"
                value={selectedAdminRashiId} 
                onChange={(e) => setSelectedAdminRashiId(Number(e.target.value))}
              >
                {rashiList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.symbol} {r.name_mr} ({r.name_en})
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveRashi} className="admin-form">
              <div className="form-group">
                <label>शुभ रंग (मराठी)</label>
                <input 
                  type="text" 
                  placeholder="उदा. पिवळा / केशरी"
                  value={formRashi.lucky_color_mr}
                  onChange={(e) => setFormRashi({...formRashi, lucky_color_mr: e.target.value})}
                />
                <small style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Sparkles size={14} /> Lucky Color इंग्रजीत आपोआप सेव्ह होईल.
                </small>
              </div>

              <div className="form-group">
                <label>आजचे राशी भविष्य (मराठी) *</label>
                <textarea 
                  rows={5} 
                  placeholder="आजचा दिवस कसा राहील, काय काळजी घ्यावी..."
                  value={formRashi.prediction_mr}
                  onChange={(e) => setFormRashi({...formRashi, prediction_mr: e.target.value})}
                  required
                />
                <small style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Sparkles size={14} /> English Horoscope Prediction पोर्टल आपोआप तयार करेल.
                </small>
              </div>

              <button type="submit" className="btn-primary-action" style={{ background: '#d97706' }}>
                राशी भविष्य सेव्ह करा
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: E-PAPER PDF UPLOAD */}
        {adminTab === 'epaper' && (
          <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="admin-card-title">
              <FileText size={20} color="#059669" />
              आजचा डिजिटल ई-पेपर (PDF Management)
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '18px' }}>
              येथून तुम्ही आजच्या वर्तमानपत्राची PDF फाइल अपलोड किंवा हटवू शकता. अपलोड केलेली PDF मुख्य पृष्ठावरील <strong>"ई-पेपर वाचा (PDF)"</strong> बटणावर वाचकांना थेट वाचता व डाउनलोड करता येईल.
            </p>

            <div className="form-group">
              <label>ई-पेपर आवृत्तीचे नाव / शीर्षक</label>
              <input 
                type="text" 
                value={epaperData.title_mr}
                onChange={(e) => setEpaperData({...epaperData, title_mr: e.target.value})}
                placeholder="उदा. उमरगा वार्ता - मुख्य आवृत्ती"
              />
            </div>

            {/* Hidden Input controlled by buttons */}
            <input 
              type="file" 
              ref={epaperPdfRef}
              accept="application/pdf"
              onChange={handleEpaperPdfUpload}
              style={{ display: 'none' }}
            />

            {/* Action Buttons: Upload & Delete */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn-primary-action"
                style={{ background: '#059669', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={() => epaperPdfRef.current && epaperPdfRef.current.click()}
              >
                <Upload size={18} /> नवीन PDF फाइल अपलोड करा (Upload PDF)
              </button>

              {epaperData.pdfUrl && (
                <button 
                  type="button" 
                  className="btn-primary-action"
                  style={{ background: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleDeleteEpaperPdf}
                >
                  <Trash2 size={18} /> ई-पेपर PDF हटवा (Delete PDF)
                </button>
              )}
            </div>

            {/* Active Status Display Card */}
            {epaperData.pdfUrl ? (
              <div style={{ marginTop: '22px', padding: '16px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ background: '#059669', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                      सक्रिय ई-पेपर (Active)
                    </span>
                    <h4 style={{ color: '#065f46', fontSize: '1.1rem', margin: '6px 0 2px' }}>
                      {epaperData.title_mr}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: '#047857' }}>
                      फाइल: <strong>{epaperData.fileName}</strong> | तारीख: {epaperData.date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a 
                      href={epaperData.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary-action"
                      style={{ background: '#0b3c75', padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye size={16} /> PDF उघडा (View PDF)
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '20px', padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px dashed #f59e0b', color: '#b45309', fontSize: '0.9rem' }}>
                सध्या कोणतीही ई-पेपर PDF अपलोड केलेली नाही. <strong>"नवीन PDF फाइल अपलोड करा"</strong> बटणावर क्लिक करून PDF निवडा.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
