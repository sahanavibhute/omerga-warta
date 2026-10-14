import React, { useState, useEffect, useRef } from 'react';
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
  Globe, 
  Settings, 
  Flame, 
  Calendar, 
  MapPin, 
  Share2, 
  Clock, 
  ChevronRight, 
  Eye, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ArrowLeft, 
  X, 
  Mail, 
  UserCheck, 
  CheckCircle,
  TrendingUp,
  Search,
  Filter,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import './App.css';

export default function App() {
  // Language State: 'mr' (Marathi) or 'en' (English)
  const [lang, setLang] = useState(() => localStorage.getItem('ow_lang') || 'mr');
  
  // Navigation / View State: 'portal' or 'admin'
  const [activeView, setActiveView] = useState('portal');

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('ow_admin_auth') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // News State
  const [news, setNews] = useState(() => {
    const saved = localStorage.getItem('ow_news');
    return saved ? JSON.parse(saved) : DEFAULT_NEWS;
  });

  // Rashi State
  const [rashiList, setRashiList] = useState(() => {
    const saved = localStorage.getItem('ow_rashi');
    return saved ? JSON.parse(saved) : DEFAULT_RASHI;
  });

  // Selected Rashi for widget view
  const [selectedRashiId, setSelectedRashiId] = useState(1);

  // Modal State for reading a news story in full
  const [activeStory, setActiveStory] = useState(null);

  // Category filter on main portal
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin form state
  const [adminTab, setAdminTab] = useState('news'); // 'news' or 'rashi'
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const fileInputRef = useRef(null);

  // News Form Fields (English fields auto-generated)
  const [formNews, setFormNews] = useState({
    title_mr: '',
    category_mr: 'उमरगा विशेष',
    image: '',
    content_mr: '',
    author: 'महेश निंबरगे'
  });

  // Image preview state
  const [imagePreview, setImagePreview] = useState('');

  // Rashi Form Fields (in Admin - English auto-translated)
  const [selectedAdminRashiId, setSelectedAdminRashiId] = useState(1);
  const [formRashi, setFormRashi] = useState({
    prediction_mr: '',
    lucky_color_mr: ''
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('ow_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('ow_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('ow_rashi', JSON.stringify(rashiList));
  }, [rashiList]);

  // Sync selected rashi form when admin dropdown changes
  useEffect(() => {
    const r = rashiList.find(x => x.id === selectedAdminRashiId);
    if (r) {
      setFormRashi({
        prediction_mr: r.prediction_mr || '',
        prediction_en: r.prediction_en || '',
        lucky_color_mr: r.lucky_color_mr || '',
        lucky_color_en: r.lucky_color_en || ''
      });
    }
  }, [selectedAdminRashiId, rashiList]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'mr' ? 'en' : 'mr');
  };

  // Admin Login Handler
  const handleAdminAccess = () => {
    if (isAdminLoggedIn) {
      setActiveView('admin');
    } else {
      setLoginError('');
      setLoginId('');
      setLoginPassword('');
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // Default Credentials: ID = admin or mnimbarge@gmail.com, Password = omerga123 or admin123
    const validId = loginId.trim().toLowerCase();
    const validPass = loginPassword.trim();

    if ((validId === 'admin' || validId === 'mnimbarge@gmail.com') && (validPass === 'omerga123' || validPass === 'admin123')) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('ow_admin_auth', 'true');
      setShowLoginModal(false);
      setActiveView('admin');
      showToast('संपादक लॉगिन यशस्वी झाले!');
    } else {
      setLoginError(lang === 'mr' ? 'चुकीचा आयडी किंवा पासवर्ड! कृपया पुन्हा प्रयत्न करा.' : 'Invalid ID or Password! Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('ow_admin_auth');
    setActiveView('portal');
    showToast(lang === 'mr' ? 'लॉगआउट यशस्वी!' : 'Logged out successfully!');
  };

  // Helper text translations
  const t = {
    location: lang === 'mr' ? 'उमरगा | धाराशिव जिल्हा | महाराष्ट्र' : 'Omerga | Dharashiv District | Maharashtra',
    brandName: lang === 'mr' ? 'उमरगा वार्ता' : 'Omerga Warta',
    brandSubtitle: lang === 'mr' ? 'संपादक - महेश शिवशंकर निंबरगे' : 'Editor - Mahesh Shivshankar Nimbarge',
    tagline: lang === 'mr' ? 'सत्य, निर्भीड आणि निष्पक्ष पत्रकारिता' : 'Truth, Fearless and Impartial Journalism',
    breaking: lang === 'mr' ? 'ब्रेकिंग न्यूज' : 'BREAKING NEWS',
    mainNews: lang === 'mr' ? 'महत्त्वाच्या बातम्या (Main News)' : 'Top Headlines & Main News',
    rashiTitle: lang === 'mr' ? 'आजचे राशी भविष्य' : "Today's Horoscope",
    rashiSubtitle: lang === 'mr' ? 'आपली रास निवडून आजचा दिवस कसा असेल ते जाणून घ्या:' : 'Select your zodiac sign to read personalized predictions:',
    luckyColor: lang === 'mr' ? 'शुभ रंग' : 'Lucky Color',
    rulingPlanet: lang === 'mr' ? 'स्वामी ग्रह' : 'Ruling Planet',
    luckyNo: lang === 'mr' ? 'शुभ अंक' : 'Lucky Number',
    readMore: lang === 'mr' ? 'सविस्तर बातमी वाचा →' : 'Read Full Story →',
    adminLogin: lang === 'mr' ? 'संपादक कक्ष (Admin)' : 'Admin Dashboard',
    backToPortal: lang === 'mr' ? 'मुख्य न्यूज पोर्टलवर जा' : 'Back to News Portal',
    filterAll: lang === 'mr' ? 'सर्व बातम्या' : 'All Stories',
    shareWhatsapp: lang === 'mr' ? 'व्हॉट्सॲपवर शेअर करा' : 'Share on WhatsApp',
    contactEditor: lang === 'mr' ? 'संपादकांशी संपर्क:' : 'Contact Bureau:'
  };

  // Current Date Display
  const currentDateStr = new Date().toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Active Selected Rashi in Portal
  const activeRashi = rashiList.find(r => r.id === selectedRashiId) || rashiList[0];

  // News Filtering
  const filteredNews = news.filter(item => {
    const title = lang === 'mr' ? item.title_mr : (item.title_en || item.title_mr);
    const category = item.category_mr;
    const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Breaking ticker text
  const breakingHeadline = news.length > 0 
    ? (lang === 'mr' ? news[0].title_mr : (news[0].title_en || news[0].title_mr))
    : (lang === 'mr' ? 'उमरगा वार्ता डिजिटल पोर्टलवर आपले स्वागत आहे.' : 'Welcome to Omerga Warta News Portal.');

  // Handle Image File Upload directly from User's Device
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

  // Handle Admin News Submission with Auto Translation
  const handleSaveNews = (e) => {
    e.preventDefault();
    if (!formNews.title_mr.trim() || !formNews.content_mr.trim()) {
      alert('कृपया मराठी बातमीचे शीर्षक व सविस्तर बातमी मजकूर आवश्यक भरा.');
      return;
    }

    const todayDate = new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Auto-generate English translation from Marathi input!
    const autoTitleEn = autoTranslateMarathiToEnglish(formNews.title_mr);
    const autoContentEn = autoTranslateMarathiToEnglish(formNews.content_mr);
    const autoCategoryEn = autoTranslateCategory(formNews.category_mr);

    if (editingNewsId) {
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
      showToast('बातमी व इंग्रजी भाषांतर आपोआप अपडेट झाले!');
    } else {
      const newEntry = {
        id: Date.now(),
        title_mr: formNews.title_mr,
        title_en: autoTitleEn,
        category_mr: formNews.category_mr,
        category_en: autoCategoryEn,
        content_mr: formNews.content_mr,
        content_en: autoContentEn,
        image: formNews.image || '/logo.jpg',
        date: todayDate,
        views: 110,
        featured: false
      };
      setNews(prev => [newEntry, ...prev]);
      showToast('नवीन बातमी व इंग्रजी आवृत्ती प्रकाशित झाली!');
    }

    // Reset Form
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
    if (window.confirm('तुम्हाला ही बातमी कायमची काढून टाकायची आहे का? (Confirm delete story?)')) {
      setNews(prev => prev.filter(x => x.id !== id));
      showToast('बातमी हटवली आहे.');
    }
  };

  // Handle Rashi Save with Auto Translation
  const handleSaveRashi = (e) => {
    e.preventDefault();
    const autoPredEn = autoTranslateMarathiToEnglish(formRashi.prediction_mr);
    const autoColorEn = autoTranslateColor(formRashi.lucky_color_mr);

    setRashiList(prev => prev.map(r => {
      if (r.id === selectedAdminRashiId) {
        return {
          ...r,
          prediction_mr: formRashi.prediction_mr,
          prediction_en: autoPredEn,
          lucky_color_mr: formRashi.lucky_color_mr,
          lucky_color_en: autoColorEn
        };
      }
      return r;
    }));
    showToast('राशी भविष्य व इंग्रजी भाषांतर सेव्ह झाले!');
  };

  const handleShareWhatsApp = (story) => {
    const title = lang === 'mr' ? story.title_mr : (story.title_en || story.title_mr);
    const text = encodeURIComponent(`*${title}*\n\nसविस्तर वाचा 'उमरगा वार्ता' डिजिटल वर:\n${window.location.origin}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Distinct categories for filter pills
  const categories = ['ALL', 'उमरगा विशेष', 'महाराष्ट्र / जिल्हा', 'कृषी व बाजारभाव', 'शिक्षण व करिअर'];

  return (
    <div className="news-app">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="floating-toast">
          <CheckCircle size={20} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP META BAR */}
      <div className="top-meta-bar">
        <div className="container top-meta-content">
          <div className="meta-left">
            <span className="meta-pill"><Calendar size={14} /> {currentDateStr}</span>
            <span className="meta-pill"><MapPin size={14} /> {t.location}</span>
          </div>

          <div className="meta-right">
            {/* Language Switcher */}
            <button className="lang-btn" onClick={toggleLang} title="भाषा बदला / Toggle Language">
              <Globe size={16} />
              <span>{lang === 'mr' ? 'English मध्ये वाचा' : 'मराठी आवृत्ती'}</span>
            </button>

            {/* Admin Switcher */}
            {activeView === 'portal' ? (
              <button className="admin-nav-btn" onClick={handleAdminAccess}>
                <Settings size={15} />
                <span>{t.adminLogin}</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="back-portal-btn" onClick={() => setActiveView('portal')}>
                  <ArrowLeft size={15} />
                  <span>{t.backToPortal}</span>
                </button>
                <button className="logout-btn" onClick={handleLogout} title="Logout">
                  <X size={15} />
                  <span>{lang === 'mr' ? 'लॉगआउट' : 'Logout'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================== VIEW 1: MAIN NEWS PORTAL ===================== */}
      {activeView === 'portal' && (
        <>
          {/* MAIN BRANDING HEADER */}
          <header className="brand-header">
            <div className="container brand-header-grid">
              <div className="brand-identity">
                <img 
                  src="/logo.jpg" 
                  alt="उमरगा वार्ता लोगो" 
                  className="brand-logo-img" 
                  onError={(e) => { e.target.src = 'https://placehold.co/180x80/0b3c75/ffffff?text=Omerga+Warta'; }}
                />
                <div className="brand-titles">
                  <h1 className="brand-main-title">{t.brandName}</h1>
                  <p className="brand-editor-credit">{t.brandSubtitle}</p>
                  <p className="brand-rni">RNI NO-MAHMAR/2022/85957 | Regd. District Dharashiv</p>
                </div>
              </div>

              {/* Bureau & Email Badge */}
              <div className="bureau-card">
                <div className="bureau-item">
                  <Mail size={16} className="bureau-icon" />
                  <div>
                    <span className="bureau-lbl">{t.contactEditor}</span>
                    <a href="mailto:mnimbarge@gmail.com" className="bureau-email">mnimbarge@gmail.com</a>
                  </div>
                </div>
                <div className="bureau-item">
                  <TrendingUp size={16} className="bureau-icon" />
                  <div>
                    <span className="bureau-lbl">डिजिटल डेस्क</span>
                    <span className="bureau-val">उमरगा व धाराशिव न्यूज नेटवर्क</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* MAIN NAVIGATION BAR */}
          <nav className="site-navbar">
            <div className="container nav-container">
              <div className="nav-links">
                <a href="#main-news" className="nav-item active">{lang === 'mr' ? 'मुख्य बातमी' : 'Top News'}</a>
                <a href="#rashi" className="nav-item">{lang === 'mr' ? 'राशी भविष्य' : 'Horoscope'}</a>
                <a href="#local" className="nav-item">{lang === 'mr' ? 'उमरगा शहर' : 'Omerga City'}</a>
                <a href="#dharashiv" className="nav-item">{lang === 'mr' ? 'धाराशिव जिल्हा' : 'Dharashiv'}</a>
                <a href="#agri" className="nav-item">{lang === 'mr' ? 'बाजारभाव व शेती' : 'Agriculture'}</a>
              </div>

              <div className="nav-search-bar">
                <Search size={16} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder={lang === 'mr' ? 'बातमी शोधा...' : 'Search news...'} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </nav>

          {/* BREAKING NEWS TICKER */}
          <div className="breaking-ticker-wrap">
            <div className="container ticker-container">
              <div className="breaking-badge">
                <Flame size={15} />
                <span>{t.breaking}</span>
              </div>
              <div className="ticker-text-flow">
                <span>{breakingHeadline}</span>
              </div>
            </div>
          </div>

          {/* MAIN GRID LAYOUT */}
          <main className="container portal-layout">
            
            {/* LEFT COLUMN: MAIN NEWS SECTION */}
            <section className="news-main-column" id="main-news">
              
              {/* Section Header with Category Filters */}
              <div className="section-head-bar">
                <div className="section-title-wrap">
                  <h2 className="section-title-text">{t.mainNews}</h2>
                  <span className="section-count-tag">{filteredNews.length} {lang === 'mr' ? 'बातम्या' : 'Stories'}</span>
                </div>

                {/* Filter Pills */}
                <div className="filter-pills">
                  {categories.map((cat, idx) => (
                    <button 
                      key={idx}
                      className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'ALL' ? t.filterAll : cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredNews.length === 0 ? (
                <div className="empty-state-card">
                  <p>{lang === 'mr' ? 'कोणतीही बातमी उपलब्ध नाही.' : 'No news found matching your criteria.'}</p>
                </div>
              ) : (
                <>
                  {/* Lead / Hero News Story */}
                  {filteredNews[0] && (
                    <article className="lead-hero-story" onClick={() => setActiveStory(filteredNews[0])}>
                      <div className="hero-img-wrap">
                        <img 
                          src={filteredNews[0].image || '/logo.jpg'} 
                          alt={filteredNews[0].title_mr}
                          onError={(e) => { e.target.src = '/logo.jpg'; }}
                        />
                        <span className="hero-tag">
                          {lang === 'mr' ? filteredNews[0].category_mr : (filteredNews[0].category_en || filteredNews[0].category_mr)}
                        </span>
                      </div>
                      <div className="hero-details">
                        <div className="story-meta-line">
                          <span><Clock size={14} /> {filteredNews[0].date}</span>
                          <span><Eye size={14} /> {filteredNews[0].views || 1200} वाचन</span>
                        </div>
                        <h3 className="hero-title">
                          {lang === 'mr' ? filteredNews[0].title_mr : (filteredNews[0].title_en || filteredNews[0].title_mr)}
                        </h3>
                        <p className="hero-snippet">
                          {(lang === 'mr' ? filteredNews[0].content_mr : (filteredNews[0].content_en || filteredNews[0].content_mr)).slice(0, 200)}...
                        </p>
                        <div className="hero-action-line">
                          <span className="read-more-link">{t.readMore}</span>
                          <button 
                            className="btn-quick-share" 
                            onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(filteredNews[0]); }}
                          >
                            <Share2 size={15} /> {lang === 'mr' ? 'शेअर' : 'Share'}
                          </button>
                        </div>
                      </div>
                    </article>
                  )}

                  {/* Rest of News Grid */}
                  <div className="news-cards-grid">
                    {filteredNews.slice(1).map(story => {
                      const displayTitle = lang === 'mr' ? story.title_mr : (story.title_en || story.title_mr);
                      const displaySnippet = lang === 'mr' ? story.content_mr : (story.content_en || story.content_mr);
                      const displayCat = lang === 'mr' ? story.category_mr : (story.category_en || story.category_mr);

                      return (
                        <article 
                          key={story.id} 
                          className="news-grid-card"
                          onClick={() => setActiveStory(story)}
                        >
                          <div className="card-thumb-wrap">
                            <img 
                              src={story.image || '/logo.jpg'} 
                              alt={displayTitle} 
                              onError={(e) => { e.target.src = '/logo.jpg'; }}
                            />
                            <span className="card-cat-badge">{displayCat}</span>
                          </div>
                          <div className="card-body">
                            <div className="card-time"><Clock size={13} /> {story.date}</div>
                            <h4 className="card-title">{displayTitle}</h4>
                            <p className="card-desc">{displaySnippet.slice(0, 110)}...</p>
                            <div className="card-footer-action">
                              <span className="card-link">{t.readMore}</span>
                              <button 
                                className="icon-share-btn"
                                onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(story); }}
                                title="Share"
                              >
                                <Share2 size={14} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            {/* RIGHT COLUMN: RASHI BHAVISHYA & EDITORIAL SIDEBAR */}
            <aside className="sidebar-column">
              
              {/* SECTION: RASHI BHAVISHYA WIDGET */}
              <div className="rashi-glass-box" id="rashi">
                <div className="rashi-widget-header">
                  <div>
                    <h3 className="rashi-widget-title">
                      <Sparkles size={20} className="sparkle-icon" />
                      {t.rashiTitle}
                    </h3>
                    <p className="rashi-widget-desc">{t.rashiSubtitle}</p>
                  </div>
                  <span className="daily-pill">{lang === 'mr' ? 'दैनिक' : 'Daily'}</span>
                </div>

                {/* 12 Zodiac Sign Selection Grid */}
                <div className="rashi-icons-grid">
                  {rashiList.map(r => {
                    const isSelected = r.id === selectedRashiId;
                    return (
                      <button
                        key={r.id}
                        className={`rashi-pick-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedRashiId(r.id)}
                      >
                        <span className="rashi-symbol">{r.symbol}</span>
                        <span className="rashi-label-mr">{lang === 'mr' ? r.name_mr : r.name_en}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Rashi Detail View */}
                {activeRashi && (
                  <div className="active-rashi-card">
                    <div className="active-rashi-head">
                      <div className="rashi-big-icon">{activeRashi.symbol}</div>
                      <div>
                        <h4 className="active-rashi-name">
                          {lang === 'mr' ? `${activeRashi.name_mr} रास (${activeRashi.name_en})` : `${activeRashi.name_en} (${activeRashi.name_mr})`}
                        </h4>
                        <div className="active-rashi-stats">
                          <span>{t.rulingPlanet}: <strong>{lang === 'mr' ? activeRashi.planet_mr : activeRashi.planet_en}</strong></span>
                          <span>•</span>
                          <span>{t.luckyColor}: <strong style={{color: '#b45309'}}>{lang === 'mr' ? activeRashi.lucky_color_mr : activeRashi.lucky_color_en}</strong></span>
                        </div>
                      </div>
                    </div>
                    <p className="active-rashi-prediction">
                      {lang === 'mr' ? activeRashi.prediction_mr : (activeRashi.prediction_en || activeRashi.prediction_mr)}
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION: EDITORIAL PROFILE */}
              <div className="sidebar-card editor-profile-box">
                <div className="editor-avatar-ring">
                  <UserCheck size={36} color="#0b3c75" />
                </div>
                <h4 className="editor-name">महेश शिवशंकर निंबरगे</h4>
                <div className="editor-designation">{lang === 'mr' ? 'मुख्य संपादक' : 'Editor-in-Chief'}</div>
                <p className="editor-bio">
                  {lang === 'mr' 
                    ? "'उमरगा वार्ता' - सत्य, निर्भीड आणि निष्पक्ष पत्रकारिता. उमरगा शहर, तालुका आणि धाराशिव जिल्ह्यातील प्रत्येक घडामोडीचे विश्वासार्ह व्यासपीठ."
                    : "'Omerga Warta' stands committed to transparent, fearless journalism for Omerga and the entire Dharashiv district."
                  }
                </p>
                <a href="mailto:mnimbarge@gmail.com" className="editor-contact-btn">
                  <Mail size={16} /> mnimbarge@gmail.com
                </a>
              </div>

              {/* DIGITAL E-PAPER WIDGET */}
              <div className="sidebar-card epaper-banner">
                <h4 className="epaper-title">{lang === 'mr' ? 'उमरगा वार्ता ई-पेपर' : 'Digital E-Paper'}</h4>
                <p className="epaper-sub">
                  {lang === 'mr' 
                    ? 'आजची पूर्ण आवृत्ती आणि रविवार विशेष पुरवणी मोफत वाचा.'
                    : 'Download today’s complete print edition in digital PDF format.'
                  }
                </p>
                <button 
                  className="epaper-download-btn"
                  onClick={() => alert(lang === 'mr' ? 'ई-पेपर लोड होत आहे...' : 'Loading E-paper edition...')}
                >
                  {lang === 'mr' ? 'ई-पेपर वाचा (PDF)' : 'Read E-Paper'}
                </button>
              </div>

            </aside>
          </main>
        </>
      )}

      {/* ===================== VIEW 2: ADMIN DASHBOARD ===================== */}
      {activeView === 'admin' && (
        <div className="container admin-container">
          <div className="admin-header-strip">
            <div>
              <h2 className="admin-page-title">{lang === 'mr' ? 'संपादक नियंत्रण कक्ष (Admin Management)' : 'Editorial Control Panel'}</h2>
              <p className="admin-page-desc">
                {lang === 'mr' 
                  ? 'येथून तुम्ही मुख्य बातम्या आणि दैनिक राशी भविष्य थेट अपडेट करू शकता. केलेले सर्व बदल त्वरित मुख्य पोर्टलवर लाइव्ह होतात.'
                  : 'Manage stories and daily zodiac predictions. All updates reflect instantly on the front-end.'}
              </p>
            </div>
            <button className="back-portal-btn" onClick={() => setActiveView('portal')}>
              <ArrowLeft size={16} /> {t.backToPortal}
            </button>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="admin-tabs">
            <button 
              className={`admin-tab-btn ${adminTab === 'news' ? 'active' : ''}`}
              onClick={() => setAdminTab('news')}
            >
              <PlusCircle size={18} /> {lang === 'mr' ? 'बातम्या व्यवस्थापन (News)' : 'News Stories'}
            </button>
            <button 
              className={`admin-tab-btn ${adminTab === 'rashi' ? 'active' : ''}`}
              onClick={() => setAdminTab('rashi')}
            >
              <Sparkles size={18} /> {lang === 'mr' ? 'राशी भविष्य अपडेट (Horoscope)' : 'Horoscope (Rashi)'}
            </button>
          </div>

          {/* TAB 1: NEWS MANAGEMENT */}
          {adminTab === 'news' && (
            <div className="admin-grid-layout">
              {/* Add / Edit News Form */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  {editingNewsId ? <Edit3 size={20} color="#0b3c75" /> : <PlusCircle size={20} color="#d32f2f" />}
                  {editingNewsId 
                    ? (lang === 'mr' ? 'बातमी संपादित करा (Edit News)' : 'Edit News Story')
                    : (lang === 'mr' ? 'नवीन बातमी पोस्ट करा (Add New Story)' : 'Publish New Story')
                  }
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
                      <Sparkles size={14} /> इंग्रजी भाषांतर (English Translation) पोर्टल आपोआप तयार करेल.
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

                  {/* Device File Upload */}
                  <div className="form-group">
                    <label>बातमीचा फोटो (Device मधून फोटो निवडा) *</label>
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
                          <Upload size={32} color="#0b3c75" />
                          <p style={{ fontWeight: 700, margin: '6px 0 2px' }}>मोबाईल / कॉम्प्युटरमधून फोटो निवडा</p>
                          <small style={{ color: '#64748b' }}>JPG, PNG किंवा WebP फोटो (कमाल 5MB)</small>
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
                      {editingNewsId ? 'बदल सेव्ह करा (Update)' : 'पोर्टलवर प्रकाशित करा (Publish News)'}
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
                        रद्द करा (Cancel)
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Published Stories Table */}
              <div className="admin-card">
                <h3 className="admin-card-title">
                  {lang === 'mr' ? 'प्रकाशित बातम्यांची यादी' : 'Published Stories'} ({news.length})
                </h3>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>फोटो</th>
                        <th>शीर्षक (Title)</th>
                        <th>विभाग</th>
                        <th>कृती (Actions)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {news.map(item => (
                        <tr key={item.id}>
                          <td>
                            <img 
                              src={item.image || '/logo.jpg'} 
                              alt="thumb" 
                              className="admin-table-thumb"
                              onError={(e) => { e.target.src = '/logo.jpg'; }}
                            />
                          </td>
                          <td>
                            <div className="admin-table-title">{item.title_mr}</div>
                            <div className="admin-table-sub">{item.title_en || '-'}</div>
                          </td>
                          <td>
                            <span className="table-badge">{item.category_mr}</span>
                          </td>
                          <td>
                            <div className="table-btns">
                              <button 
                                className="action-btn-edit" 
                                onClick={() => handleEditClick(item)}
                                title="Edit"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button 
                                className="action-btn-del" 
                                onClick={() => handleDeleteClick(item.id)}
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RASHI BHAVISHYA MANAGEMENT */}
          {adminTab === 'rashi' && (
            <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 className="admin-card-title">
                <Sparkles size={20} color="#f59e0b" />
                {lang === 'mr' ? 'दैनिक राशी भविष्य अद्ययावत करा' : 'Update Daily Zodiac Horoscope'}
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
                  {lang === 'mr' ? 'राशी भविष्य सेव्ह करा' : 'Save Horoscope Predictions'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ===================== STORY DETAIL MODAL ===================== */}
      {activeStory && (
        <div className="modal-backdrop" onClick={() => setActiveStory(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setActiveStory(null)}>
              <X size={24} />
            </button>

            <div className="modal-category-tag">
              {lang === 'mr' ? activeStory.category_mr : (activeStory.category_en || activeStory.category_mr)}
            </div>

            <h2 className="modal-title">
              {lang === 'mr' ? activeStory.title_mr : (activeStory.title_en || activeStory.title_mr)}
            </h2>

            <div className="modal-meta-bar">
              <span><Clock size={15} /> {activeStory.date}</span>
              <span><UserCheck size={15} /> {activeStory.author || 'महेश निंबरगे'}</span>
            </div>

            {activeStory.image && (
              <img 
                src={activeStory.image} 
                alt="Story" 
                className="modal-banner-img"
                onError={(e) => { e.target.src = '/logo.jpg'; }}
              />
            )}

            <div className="modal-body-text">
              {lang === 'mr' ? activeStory.content_mr : (activeStory.content_en || activeStory.content_mr)}
            </div>

            <div className="modal-footer-bar">
              <button className="btn-modal-share" onClick={() => handleShareWhatsApp(activeStory)}>
                <Share2 size={16} /> {t.shareWhatsapp}
              </button>
              <button className="btn-modal-close-action" onClick={() => setActiveStory(null)}>
                {lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADMIN LOGIN MODAL ===================== */}
      {showLoginModal && (
        <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="modal-container login-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowLoginModal(false)}>
              <X size={22} />
            </button>

            <div className="login-modal-header">
              <div className="login-icon-circle">
                <Settings size={30} color="#0b3c75" />
              </div>
              <h3 className="login-title">
                {lang === 'mr' ? 'संपादक नियंत्रण कक्ष लॉगिन' : 'Editor / Admin Login'}
              </h3>
              <p className="login-subtitle">
                {lang === 'mr' ? 'उमरगा वार्ता डिजिटल डेस्क व्यवस्थापन' : 'Authorized Access for Omerga Warta'}
              </p>
            </div>

            {loginError && (
              <div className="login-error-alert">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="admin-form" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>{lang === 'mr' ? 'युझर आयडी (User ID / Email)' : 'User ID / Email'}</label>
                <input 
                  type="text" 
                  placeholder="उदा. admin किंवा mnimbarge@gmail.com" 
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>{lang === 'mr' ? 'पासवर्ड (Password)' : 'Password'}</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <div className="login-hint-box">
                <small>
                  🔑 <strong>Default Login:</strong> ID: <code>admin</code> (किंवा <code>mnimbarge@gmail.com</code>) | Password: <code>omerga123</code>
                </small>
              </div>

              <button type="submit" className="btn-primary-action" style={{ width: '100%', marginTop: '10px' }}>
                {lang === 'mr' ? 'लॉगिन करा (Login)' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-about">
            <h4 className="footer-heading">उमरगा वार्ता</h4>
            <p className="footer-text">
              {lang === 'mr' 
                ? "'उमरगा वार्ता' हे उमरगा आणि परिसरातील अग्रगण्य व विश्वासार्ह मराठी वृत्तपत्र आणि डिजिटल न्यूज पोर्टल आहे. RNI क्र. MAHMAR/2022/85957."
                : "'Omerga Warta' is the prominent Marathi news platform and print journal serving Omerga and Dharashiv region."
              }
            </p>
            <p className="footer-credit"><strong>संपादक:</strong> महेश शिवशंकर निंबरगे</p>
            <p className="footer-credit"><strong>Email:</strong> <a href="mailto:mnimbarge@gmail.com">mnimbarge@gmail.com</a></p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-heading">{lang === 'mr' ? 'महत्त्वाचे विभाग' : 'Key Sections'}</h4>
            <ul className="footer-nav">
              <li><a href="#main-news">{lang === 'mr' ? 'ताज्या बातम्या' : 'Latest News'}</a></li>
              <li><a href="#rashi">{lang === 'mr' ? 'राशी भविष्य (Horoscope)' : 'Daily Horoscope'}</a></li>
              <li><a href="#local">{lang === 'mr' ? 'उमरगा शहर घडामोडी' : 'Omerga Town'}</a></li>
              <li><button onClick={handleAdminAccess} className="footer-admin-link">{t.adminLogin}</button></li>
            </ul>
          </div>

          <div className="footer-contact-col">
            <h4 className="footer-heading">{lang === 'mr' ? 'कार्यालय व संपर्क' : 'Bureau Office'}</h4>
            <p className="footer-text">
              उमरगा वार्ता डिजिटल डेस्क, मुख्य रोड, उमरगा, जि. धाराशिव, महाराष्ट्र - 413606.
            </p>
            <div className="footer-quick-badge">
              <Mail size={15} /> mnimbarge@gmail.com
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="container footer-bottom-inner">
            <p>&copy; 2026 Omerga Warta (उमरगा वार्ता). सर्व हक्क राखीव. Designed with React & Modern UI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
