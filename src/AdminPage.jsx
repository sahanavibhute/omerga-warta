import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DEFAULT_NEWS, 
  DEFAULT_RASHI,
  DEFAULT_ADS
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
  Megaphone,
  Eye,
  AlertTriangle,
  Image as ImageIcon,
  Check,
  FileCheck
} from 'lucide-react';
import { addNewsToSupabase, updateNewsInSupabase, deleteNewsFromSupabase } from './supabase';
import { 
  fetchNewsFromCloud, 
  saveNewsToCloud, 
  fetchRashiFromCloud, 
  saveRashiToCloud,
  fetchAstroFromCloud,
  saveAstroToCloud,
  fetchAdsFromCloud,
  saveAdsToCloud
} from './cloudSync';
import { validateImageFile, uploadImageToCloud } from './imageUpload';
import CloudImage from './CloudImage';
import { DEFAULT_ASTRO_TEXT, parseAstrologyScript } from './astroHelper';

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
    try {
      const saved = localStorage.getItem('ow_news_v2');
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const initial = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(initial) || initial.length === 0) return [];
      return initial.filter(item => {
        if (!item) return false;
        if (typeof item.id === 'number' && item.id < 1000) return false;
        const itemTime = item.createdAt || (typeof item.id === 'number' && item.id > 1000000 ? item.id : null) || Date.now();
        return itemTime >= oneWeekAgo;
      });
    } catch (e) {
      return [];
    }
  });

  // Rashi State
  const [rashiList, setRashiList] = useState(() => {
    try {
      const saved = localStorage.getItem('ow_rashi');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return DEFAULT_RASHI;
    } catch (e) {
      return DEFAULT_RASHI;
    }
  });

  // Ads Configuration State
  const [adsConfig, setAdsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ow_ads');
      return saved ? JSON.parse(saved) : DEFAULT_ADS;
    } catch (e) {
      return DEFAULT_ADS;
    }
  });

  // Admin Tab: 'news', 'rashi', 'ads'
  const [adminTab, setAdminTab] = useState('news');
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const fileInputRef = useRef(null);
  const adHeaderInputRef = useRef(null);
  const adSidebarInputRef = useRef(null);

  // News Form Fields
  const [formNews, setFormNews] = useState({
    title_mr: '',
    category_mr: 'उमरगा विशेष',
    image: '',
    content_mr: '',
    author: 'महेश निंबरगे',
    status: 'published' // 'published' or 'draft'
  });
  const [imagePreview, setImagePreview] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Rashi Form Fields
  const [selectedAdminRashiId, setSelectedAdminRashiId] = useState(1);
  const [formRashi, setFormRashi] = useState({
    prediction_mr: '',
    lucky_color_mr: ''
  });

  // Astro Bulletin State (Daily Long-form Panchang & Rashifal)
  const [astroText, setAstroText] = useState(() => {
    try {
      const saved = localStorage.getItem('ow_astro_text');
      return saved || DEFAULT_ASTRO_TEXT;
    } catch (e) {
      return DEFAULT_ASTRO_TEXT;
    }
  });
  const [astroPreviewTab, setAstroPreviewTab] = useState('panchang'); // 'panchang', 'rashifal', 'raw'

  // Track initial cloud sync to avoid overwriting existing cloud data on first render
  const isNewsInitializedRef = useRef(false);
  const isRashiInitializedRef = useRef(false);
  const isAdsInitializedRef = useRef(false);

  // Save changes to localStorage and Cloud Storage so all devices see updates
  useEffect(() => {
    try {
      localStorage.setItem('ow_news_v2', JSON.stringify(news));
    } catch (e) {}
    if (isNewsInitializedRef.current) {
      saveNewsToCloud(news);
    }
  }, [news]);

  useEffect(() => {
    try {
      localStorage.setItem('ow_rashi', JSON.stringify(rashiList));
    } catch (e) {}
    if (isRashiInitializedRef.current) {
      saveRashiToCloud(rashiList);
    }
  }, [rashiList]);

  useEffect(() => {
    try {
      localStorage.setItem('ow_ads', JSON.stringify(adsConfig));
    } catch (e) {}
    if (isAdsInitializedRef.current) {
      saveAdsToCloud(adsConfig);
    }
  }, [adsConfig]);

  // On mount, load existing cloud news, rashi & ads if available
  useEffect(() => {
    fetchNewsFromCloud().then(cloudPosts => {
      if (cloudPosts && Array.isArray(cloudPosts)) {
        if (cloudPosts.length > 0) {
          setNews(cloudPosts);
        }
      }
      isNewsInitializedRef.current = true;
    }).catch(() => {
      isNewsInitializedRef.current = true;
    });

    fetchRashiFromCloud().then(cloudRashi => {
      if (cloudRashi && Array.isArray(cloudRashi) && cloudRashi.length > 0) {
        setRashiList(cloudRashi);
      }
      isRashiInitializedRef.current = true;
    }).catch(() => {
      isRashiInitializedRef.current = true;
    });

    fetchAdsFromCloud().then(cloudAds => {
      if (cloudAds) {
        setAdsConfig(cloudAds);
      }
      isAdsInitializedRef.current = true;
    }).catch(() => {
      isAdsInitializedRef.current = true;
    });

    fetchAstroFromCloud().then(cloudAstro => {
      if (cloudAstro && cloudAstro.raw) {
        setAstroText(cloudAstro.raw);
        try {
          localStorage.setItem('ow_astro_text', cloudAstro.raw);
        } catch (e) {}
      }
    });
  }, []);

  // Sync selected rashi form
  useEffect(() => {
    const r = rashiList.find(x => x && x.id === selectedAdminRashiId);
    if (r) {
      setFormRashi({
        prediction_mr: r.prediction_mr || '',
        lucky_color_mr: r.lucky_color_mr || ''
      });
    }
  }, [selectedAdminRashiId, rashiList]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Secure Login Handler
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

  // Image Upload Handler: Full validation, cloud upload to permanent HTTPS CDN
  const handleImageFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingImage(true);
    setUploadStatus('फोटो लोड होत आहे...');

    // Quick client-side preview for instant feedback
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);

    try {
      const permanentCloudUrl = await uploadImageToCloud(file, (msg) => {
        setUploadStatus(msg);
      });

      if (permanentCloudUrl) {
        setImagePreview(permanentCloudUrl);
        setFormNews(prev => ({ ...prev, image: permanentCloudUrl }));
        showToast('फोटो क्लाउडवर सुरक्षितपणे सेव्ह झाला!');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('फोटो अपलोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsUploadingImage(false);
      setUploadStatus('');
    }
  };

  // Save / Publish News
  const handleSaveNews = async (e, publishStatus = 'published') => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formNews.title_mr.trim() || !formNews.content_mr.trim()) {
      alert('कृपया मराठी बातमीचे शीर्षक व मजकूर आवश्यक भरा.');
      return;
    }

    let finalImageUrl = formNews.image || '/logo.jpg';

    // If image is still a local data URI or not yet uploaded to cloud, upload it now
    if (finalImageUrl.startsWith('data:') || finalImageUrl.startsWith('blob:')) {
      try {
        setIsUploadingImage(true);
        setUploadStatus('फोटो क्लाउड CDN वर सेव्ह होत आहे...');
        const cloudUrl = await uploadImageToCloud(finalImageUrl, setUploadStatus);
        if (cloudUrl) {
          finalImageUrl = cloudUrl;
        }
      } catch (e) {
        console.warn('Final image upload attempt notice:', e);
      } finally {
        setIsUploadingImage(false);
        setUploadStatus('');
      }
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
        image: finalImageUrl,
        status: publishStatus
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
            image: finalImageUrl,
            status: publishStatus,
            updatedAt: Date.now()
          };
        }
        return item;
      }));
      showToast(publishStatus === 'draft' ? 'बातमी मसुदा (Draft) म्हणून सेव्ह केली!' : 'बातमी यशस्वीरीत्या अपडेट करण्यात आली!');
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
        image: finalImageUrl,
        date: formattedPostDateTime,
        views: 150,
        featured: false,
        status: publishStatus,
        author: formNews.author || 'महेश निंबरगे'
      };

      addNewsToSupabase(newEntry).then(cloudDoc => {
        if (cloudDoc && cloudDoc.id) {
          newEntry.id = cloudDoc.id;
        }
      });

      const updatedNewsList = [newEntry, ...news];
      setNews(updatedNewsList);
      showToast(publishStatus === 'draft' ? 'बातमी मसुदा (Draft) म्हणून सेव्ह केली!' : 'नवीन बातमी यशस्वीरीत्या प्रकाशित झाली!');
    }

    setEditingNewsId(null);
    setImagePreview('');
    setFormNews({
      title_mr: '',
      category_mr: 'उमरगा विशेष',
      image: '',
      content_mr: '',
      author: 'महेश निंबरगे',
      status: 'published'
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
      author: story.author || 'महेश निंबरगे',
      status: story.status || 'published'
    });
    setImagePreview(story.image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('तुम्हाला ही बातमी कायमची काढून टाकायची आहे का?')) {
      deleteNewsFromSupabase(id);
      const remaining = news.filter(x => x.id !== id);
      setNews(remaining);
      showToast('बातमी हटवली आहे.');
    }
  };

  // Save Rashi with Today's Date Stamp
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
      if (r && r.id === selectedAdminRashiId) {
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

  // Save Full Daily Astrology & Panchang Bulletin
  const handleSaveAstroBulletin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!astroText.trim()) {
      alert('कृपया पंचांग व राशी भविष्याचा मजकूर पेस्ट करा.');
      return;
    }
    const parsed = parseAstrologyScript(astroText);
    try {
      localStorage.setItem('ow_astro_text', astroText);
    } catch (err) {}
    
    // Push full parsed object to Cloud
    const success = await saveAstroToCloud(parsed);
    if (success) {
      showToast('दैनिक पंचांग व राशी भविष्य यशस्वीरीत्या प्रकाशित झाले!');
    } else {
      showToast('पंचांग स्थानिक पातळीवर सेव्ह झाले.');
    }
  };

  // Upload ad banner image
  const handleAdImageUpload = async (type, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    showToast('जाहिरात फोटो क्लाउडवर अपलोड होत आहे...');
    try {
      const url = await uploadImageToCloud(file);
      if (url) {
        setAdsConfig(prev => {
          const updated = {
            ...prev,
            [type]: {
              ...prev[type],
              imageUrl: url,
              enabled: true
            }
          };
          try {
            localStorage.setItem('ow_ads', JSON.stringify(updated));
          } catch (e) {}
          saveAdsToCloud(updated);
          return updated;
        });
        showToast('जाहिरात फोटो सेव्ह झाला!');
      }
    } catch (err) {
      alert('अपलोड त्रुटी: ' + err.message);
    }
  };

  // Delete / Remove ad banner image
  const handleDeleteAdImage = (type) => {
    if (!window.confirm('तुम्हाला ही जाहिरात काढून टाकायची आहे का?')) return;
    setAdsConfig(prev => {
      const updated = {
        ...prev,
        [type]: {
          ...prev[type],
          imageUrl: ''
        }
      };
      try {
        localStorage.setItem('ow_ads', JSON.stringify(updated));
      } catch (e) {}
      saveAdsToCloud(updated);
      return updated;
    });
    showToast('जाहिरात फोटो हटवला आहे.');
  };

  // ================= STRICT AUTH GUARD =================
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
              <label>संपादक आयडी</label>
              <input 
                type="text" 
                placeholder="संपादक आयडी टाका" 
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>पासवर्ड</label>
              <input 
                type="password" 
                placeholder="पासवर्ड टाका" 
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
              <span className="admin-auth-tag">अधिकृत संपादक: महेश निंबरगे</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="back-portal-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={15} /> मुख्य पोर्टल पहा
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={15} /> बाहेर पडा (लॉगआउट)
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
            <PlusCircle size={18} /> बातम्या व्यवस्थापन
          </button>
          <button 
            className={`admin-tab-btn ${adminTab === 'ads' ? 'active' : ''}`}
            onClick={() => setAdminTab('ads')}
          >
            <Megaphone size={18} /> जाहिरात व्यवस्थापन
          </button>
          <button 
            className={`admin-tab-btn ${adminTab === 'rashi' ? 'active' : ''}`}
            onClick={() => setAdminTab('rashi')}
          >
            <Sparkles size={18} /> पञ्चाङ्ग व राशी भविष्य
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

              <form onSubmit={(e) => handleSaveNews(e, 'published')} className="admin-form">
                <div className="form-group">
                  <label>बातमीचे शीर्षक (मराठी) *</label>
                  <input 
                    type="text" 
                    placeholder="उदा. उमरगा तालुक्यात नवीन योजना सुरू..." 
                    value={formNews.title_mr}
                    onChange={(e) => setFormNews({...formNews, title_mr: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>विभाग (कॅटेगरी)</label>
                  <select 
                    value={formNews.category_mr}
                    onChange={(e) => setFormNews({...formNews, category_mr: e.target.value})}
                  >
                    <option value="उमरगा विशेष">उमरगा विशेष</option>
                    <option value="महाराष्ट्र / जिल्हा">महाराष्ट्र / जिल्हा</option>
                    <option value="कृषी व बाजारभाव">कृषी व बाजारभाव</option>
                    <option value="शिक्षण व करिअर">शिक्षण व करिअर</option>
                    <option value="राजकारण">राजकारण</option>
                  </select>
                </div>

                {/* Device Image Upload */}
                <div className="form-group">
                  <label>बातमीचा फोटो (कॅमेरा / गॅलरीमधून निवडा) *</label>
                  <div 
                    className="device-upload-dropzone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                    {imagePreview ? (
                      <div className="device-preview-box">
                        <img src={imagePreview} alt="Preview" className="device-img-preview" />
                        <div className="device-reselect-tag">
                          {isUploadingImage ? (uploadStatus || 'फोटो क्लाउडवर अपलोड होत आहे...') : '✓ फोटो सुरक्षित जोडला (बदलण्यासाठी येथे क्लिक करा)'}
                        </div>
                      </div>
                    ) : (
                      <div className="device-empty-upload">
                        <Upload size={30} color="#0b3c75" />
                        <p style={{ fontWeight: 700, margin: '6px 0 2px' }}>
                          {isUploadingImage ? (uploadStatus || 'फोटो प्रक्रिया सुरू आहे...') : 'मोबाईल गॅलरी, कॅमेरा किंवा कॉम्प्युटरमधून फोटो निवडा'}
                        </p>
                        <small style={{ color: '#64748b' }}>JPG, PNG किंवा WebP (कमाल 10MB)</small>
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
                </div>

                <div className="form-action-btns" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    type="submit" 
                    className="btn-primary-action"
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? 'फोटो अपलोड होत आहे...' : (editingNewsId ? 'बदल सेव्ह व प्रकाशित करा' : 'पोर्टलवर प्रकाशित करा')}
                  </button>

                  <button 
                    type="button" 
                    className="btn-primary-action"
                    style={{ background: '#475569' }}
                    onClick={(e) => handleSaveNews(e, 'draft')}
                    disabled={isUploadingImage}
                  >
                    मसुदा सेव्ह करा
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
                          author: 'महेश निंबरगे',
                          status: 'published'
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
                बातमी यादी ({news.length})
              </h3>
              <div className="admin-stories-list">
                {news.map(item => (
                  <div key={item.id} className="admin-story-card">
                    <CloudImage 
                      src={item.image} 
                      alt="thumb" 
                      className="admin-story-img"
                    />
                    <div className="admin-story-content">
                      <div className="admin-story-top">
                        <span className="table-badge">{item.category_mr}</span>
                        {item.status === 'draft' ? (
                          <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                            मसुदा (Draft)
                          </span>
                        ) : (
                          <span style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                            प्रकाशित (Live)
                          </span>
                        )}
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

        {/* TAB 2: ADVERTISEMENTS */}
        {adminTab === 'ads' && (
          <div className="admin-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h3 className="admin-card-title">
              <Megaphone size={20} color="#0b3c75" />
              जाहिरात व्यवस्थापन
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
              मुख्य पोर्टलवरील मथळा जाहिरात आणि साइडबार जाहिरात येथून थेट नियंत्रित करा.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Header Banner Ad */}
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ color: '#0b3c75', fontSize: '1.1rem', margin: 0 }}>
                    १. मुख्य मथळा जाहिरात
                  </h4>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input 
                      type="checkbox"
                      checked={adsConfig.headerBanner?.enabled ?? true}
                      onChange={(e) => setAdsConfig(prev => ({
                        ...prev,
                        headerBanner: { ...prev.headerBanner, enabled: e.target.checked }
                      }))}
                    />
                    सक्रिय ठेवा
                  </label>
                </div>

                <div className="form-group">
                  <label>जाहिरात बॅनर फोटो</label>
                  <input 
                    type="file" 
                    ref={adHeaderInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleAdImageUpload('headerBanner', e)}
                  />
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn-primary-action"
                      style={{ background: '#0b3c75', padding: '8px 16px', fontSize: '0.85rem' }}
                      onClick={() => adHeaderInputRef.current && adHeaderInputRef.current.click()}
                    >
                      <Upload size={16} /> बॅनर फोटो निवडा
                    </button>
                    {adsConfig.headerBanner?.imageUrl && (
                      <>
                        <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                          ✓ बॅनर जोडला आहे
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdImage('headerBanner')}
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Trash2 size={14} /> जाहिरात हटवा
                        </button>
                      </>
                    )}
                  </div>
                  {adsConfig.headerBanner?.imageUrl && (
                    <div style={{ marginTop: '12px', maxWidth: '400px' }}>
                      <CloudImage 
                        src={adsConfig.headerBanner.imageUrl} 
                        alt="Ad preview" 
                        style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                      />
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>क्लिक केल्यावर उघडणारी लिंक (व्हॉट्सॲप किंवा वेबसाईट लिंक)</label>
                  <input 
                    type="text" 
                    value={adsConfig.headerBanner?.linkUrl || ''}
                    onChange={(e) => setAdsConfig(prev => ({
                      ...prev,
                      headerBanner: { ...prev.headerBanner, linkUrl: e.target.value }
                    }))}
                    placeholder="उदा. https://api.whatsapp.com/send?phone=919890288228"
                  />
                </div>
              </div>

              {/* Sidebar Ad */}
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ color: '#0b3c75', fontSize: '1.1rem', margin: 0 }}>
                    २. साइडबार जाहिरात
                  </h4>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input 
                      type="checkbox"
                      checked={adsConfig.sidebarBanner?.enabled ?? true}
                      onChange={(e) => setAdsConfig(prev => ({
                        ...prev,
                        sidebarBanner: { ...prev.sidebarBanner, enabled: e.target.checked }
                      }))}
                    />
                    सक्रिय ठेवा
                  </label>
                </div>

                <div className="form-group">
                  <label>साइडबार जाहिरात फोटो</label>
                  <input 
                    type="file" 
                    ref={adSidebarInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleAdImageUpload('sidebarBanner', e)}
                  />
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn-primary-action"
                      style={{ background: '#0b3c75', padding: '8px 16px', fontSize: '0.85rem' }}
                      onClick={() => adSidebarInputRef.current && adSidebarInputRef.current.click()}
                    >
                      <Upload size={16} /> साइडबार फोटो निवडा
                    </button>
                    {adsConfig.sidebarBanner?.imageUrl && (
                      <>
                        <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                          ✓ जाहिरात जोडली आहे
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdImage('sidebarBanner')}
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Trash2 size={14} /> जाहिरात हटवा
                        </button>
                      </>
                    )}
                  </div>
                  {adsConfig.sidebarBanner?.imageUrl && (
                    <div style={{ marginTop: '12px', maxWidth: '300px' }}>
                      <CloudImage 
                        src={adsConfig.sidebarBanner.imageUrl} 
                        alt="Sidebar Ad" 
                        style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                      />
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>क्लिक केल्यावर उघडणारी लिंक</label>
                  <input 
                    type="text" 
                    value={adsConfig.sidebarBanner?.linkUrl || ''}
                    onChange={(e) => setAdsConfig(prev => ({
                      ...prev,
                      sidebarBanner: { ...prev.sidebarBanner, linkUrl: e.target.value }
                    }))}
                    placeholder="उदा. https://api.whatsapp.com/send?phone=919890288228"
                  />
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-primary-action" 
              style={{ marginTop: '24px', width: '100%' }}
              onClick={() => {
                localStorage.setItem('ow_ads', JSON.stringify(adsConfig));
                saveAdsToCloud(adsConfig);
                showToast('जाहिरात सेटिंग्ज यशस्वीरीत्या सेव्ह झाल्या!');
              }}
            >
              सर्व जाहिरात सेटिंग्ज सेव्ह करा
            </button>
          </div>
        )}

        {/* TAB 3: RASHI & PANCHANG */}
        {adminTab === 'rashi' && (
          <div className="admin-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 className="admin-card-title" style={{ margin: 0 }}>
                  <Sparkles size={22} color="#f59e0b" />
                  दैनिक पञ्चाङ्ग व राशी भविष्य व्यवस्थापन
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0' }}>
                  दररोजचा पंचांग व १२ राशींचा संपूर्ण मजकूर खाली बॉक्समध्ये पेस्ट करा व प्रकाशित करा.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAstroBulletin} className="admin-form">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    संपूर्ण पंचांग व राशी भविष्य मजकूर *
                  </label>
                  {astroText && (
                    <button 
                      type="button"
                      onClick={() => setAstroText('')}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
                    >
                      मजकूर पुसा
                    </button>
                  )}
                </div>
                
                <textarea 
                  rows={14} 
                  placeholder="येथे संपूर्ण पंचांग, गोचर ग्रह, शुभ मुहूर्त व आजचा राशिफल मजकूर पेस्ट करा..."
                  value={astroText}
                  onChange={(e) => setAstroText(e.target.value)}
                  style={{ fontFamily: 'inherit', fontSize: '0.92rem', lineHeight: '1.7', padding: '14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="btn-primary-action" style={{ background: '#d97706', flex: 1, padding: '12px', fontSize: '1rem', fontWeight: 700 }}>
                  <Sparkles size={18} /> पञ्चाङ्ग व राशी भविष्य प्रकाशित करा
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
