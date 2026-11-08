import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DEFAULT_NEWS, 
  DEFAULT_RASHI,
  DEFAULT_ADS
} from './mockData';
import { 
  Globe, 
  Flame, 
  Calendar, 
  MapPin, 
  Share2, 
  Clock, 
  Eye, 
  Sparkles, 
  X, 
  Mail, 
  Phone,
  UserCheck, 
  TrendingUp, 
  Search, 
  Lock, 
  Menu
} from 'lucide-react';
import CloudImage from './CloudImage';
import { fetchNewsFromSupabase } from './supabase';
import { fetchNewsFromCloud, fetchRashiFromCloud, fetchAstroFromCloud, fetchAdsFromCloud } from './cloudSync';
import { DEFAULT_ASTRO_TEXT, parseAstrologyScript } from './astroHelper';
import './App.css';

export default function PortalPage() {
  const navigate = useNavigate();

  // Language State: 'mr' (Marathi) or 'en' (English)
  const [lang, setLang] = useState(() => localStorage.getItem('ow_lang') || 'mr');

  // Mobile navigation hamburger toggle state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // News State: Only loads real news from Database / Cloud
  const [isLoadingNews, setIsLoadingNews] = useState(() => {
    try {
      const saved = localStorage.getItem('ow_news_v2');
      return !saved || JSON.parse(saved).length === 0;
    } catch (e) {
      return true;
    }
  });

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
      console.warn('Initial news parse note:', e);
      return [];
    }
  });

  // Fetch real-time news from Cloud (syncs across laptop, phone, tablet)
  useEffect(() => {
    try {
      if (localStorage.getItem('ow_news')) {
        localStorage.removeItem('ow_news');
      }
    } catch (e) {}

    fetchNewsFromCloud().then(cloudPosts => {
      setIsLoadingNews(false);
      if (cloudPosts && Array.isArray(cloudPosts)) {
        const cleanPosts = cloudPosts.filter(item => item && !(typeof item.id === 'number' && item.id < 1000));
        setNews(cleanPosts);
        try {
          localStorage.setItem('ow_news_v2', JSON.stringify(cleanPosts));
        } catch (e) {}
      }
    }).catch(() => {
      setIsLoadingNews(false);
    });
  }, []);

  // Rashi State
  const [rashiList, setRashiList] = useState(() => {
    try {
      const saved = localStorage.getItem('ow_rashi');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validRashi = parsed.filter(r => r && typeof r.id === 'number');
        if (validRashi.length > 0) return validRashi;
      }
      return DEFAULT_RASHI;
    } catch (e) {
      return DEFAULT_RASHI;
    }
  });

  // Sync real-time Rashi Bhavishya from Cloud
  useEffect(() => {
    fetchRashiFromCloud().then(cloudRashi => {
      if (cloudRashi && Array.isArray(cloudRashi) && cloudRashi.length > 0) {
        const validCloudRashi = cloudRashi.filter(r => r && typeof r.id === 'number');
        if (validCloudRashi.length > 0) {
          setRashiList(validCloudRashi);
          try {
            localStorage.setItem('ow_rashi', JSON.stringify(validCloudRashi));
          } catch (e) {}
        }
      }
    });
  }, []);

  // Daily Astrology & Panchang Bulletin State
  const [astroData, setAstroData] = useState(() => {
    try {
      const saved = localStorage.getItem('ow_astro_text');
      return parseAstrologyScript(saved || DEFAULT_ASTRO_TEXT);
    } catch (e) {
      return parseAstrologyScript(DEFAULT_ASTRO_TEXT);
    }
  });

  const [astroActiveTab, setAstroActiveTab] = useState('panchang'); // 'panchang', 'rashifal', 'full'
  const [selectedZodiacSign, setSelectedZodiacSign] = useState('मेष');

  // Sync real-time Astrology Bulletin from Cloud
  useEffect(() => {
    fetchAstroFromCloud().then(cloudAstro => {
      if (cloudAstro && (cloudAstro.raw || cloudAstro.panchang)) {
        setAstroData(cloudAstro);
        if (cloudAstro.raw) {
          try {
            localStorage.setItem('ow_astro_text', cloudAstro.raw);
          } catch (e) {}
        }
      }
    });
  }, []);

  // Ads State
  const [adsConfig, setAdsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ow_ads');
      return saved ? JSON.parse(saved) : DEFAULT_ADS;
    } catch (e) {
      return DEFAULT_ADS;
    }
  });

  useEffect(() => {
    fetchAdsFromCloud().then(cloudAds => {
      if (cloudAds) {
        setAdsConfig(cloudAds);
        try {
          localStorage.setItem('ow_ads', JSON.stringify(cloudAds));
        } catch (e) {}
      }
    });
  }, []);

  // Selected Rashi for widget view
  const [selectedRashiId, setSelectedRashiId] = useState(1);

  // Modal State for reading a news story in full
  const [activeStory, setActiveStory] = useState(null);

  // Category filter on main portal
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('ow_lang', lang);
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === 'mr' ? 'en' : 'mr');
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
    readMore: lang === 'mr' ? 'सविस्तर बातमी वाचा →' : 'Read Full Story →',
    adminLogin: lang === 'mr' ? 'संपादक कक्ष' : 'Staff Login',
    filterAll: lang === 'mr' ? 'सर्व बातम्या' : 'All Stories',
    shareWhatsapp: lang === 'mr' ? 'व्हॉट्सॲपवर शेअर करा' : 'Share on WhatsApp',
    contactEditor: lang === 'mr' ? 'संपादकांशी संपर्क:' : 'Contact Bureau:'
  };

  // Dynamic Live Date that updates regularly
  const [currentDateStr, setCurrentDateStr] = useState(() => {
    return new Date().toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  useEffect(() => {
    const updateDate = () => {
      setCurrentDateStr(new Date().toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, [lang]);

  const activeRashi = (Array.isArray(rashiList) && rashiList.find(r => r && r.id === selectedRashiId)) 
    || (Array.isArray(rashiList) && rashiList[0]) 
    || DEFAULT_RASHI[0];

  // Filter out any draft articles from the public view
  const publishedNews = news.filter(item => item && item.status !== 'draft');

  const filteredNews = publishedNews.filter(item => {
    if (!item) return false;
    const title = (lang === 'mr' ? item.title_mr : (item.title_en || item.title_mr)) || '';
    const category = item.category_mr || '';
    const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const breakingHeadline = (publishedNews.length > 0 && publishedNews[0])
    ? ((lang === 'mr' ? publishedNews[0].title_mr : (publishedNews[0].title_en || publishedNews[0].title_mr)) || 'उमरगा वार्ता')
    : (lang === 'mr' ? 'उमरगा वार्ता डिजिटल पोर्टलवर आपले स्वागत आहे.' : 'Welcome to Omerga Warta News Portal.');

  const handleShareWhatsApp = (story) => {
    if (!story) return;
    const title = (lang === 'mr' ? story.title_mr : (story.title_en || story.title_mr)) || 'उमरगा वार्ता';
    const text = encodeURIComponent(`*${title}*\n\nसविस्तर वाचा 'उमरगा वार्ता' डिजिटल वर:\n${window.location.origin}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const categories = ['ALL', 'उमरगा विशेष', 'महाराष्ट्र / जिल्हा', 'कृषी व बाजारभाव', 'शिक्षण व करिअर'];

  return (
    <div className="news-app">
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

            {/* Link to the Separate /admin route */}
            <button className="admin-nav-btn" onClick={() => navigate('/admin')} title="Staff Login">
              <Lock size={13} />
              <span>{t.adminLogin}</span>
            </button>
          </div>
        </div>
      </div>

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
              <p className="brand-rni">RNI NO-MAHMAR/2022/85957 | मोबा. +91 98902 88228</p>
            </div>
          </div>
        </div>
      </header>

      {/* NAVBAR */}
      <nav className="site-navbar">
        <div className="container nav-container">
          {/* Mobile Hamburger Toggle Button */}
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation Links */}
          <div className={`nav-links ${isMobileNavOpen ? 'mobile-open' : ''}`}>
            <a href="#main-news" className="nav-item active" onClick={() => setIsMobileNavOpen(false)}>
              {lang === 'mr' ? 'मुख्य बातमी' : 'Top News'}
            </a>
            <a href="#rashi" className="nav-item" onClick={() => setIsMobileNavOpen(false)}>
              {lang === 'mr' ? 'राशी भविष्य' : 'Horoscope'}
            </a>
            <a href="#local" className="nav-item" onClick={() => setIsMobileNavOpen(false)}>
              {lang === 'mr' ? 'उमरगा शहर' : 'Omerga City'}
            </a>
            <a href="#dharashiv" className="nav-item" onClick={() => setIsMobileNavOpen(false)}>
              {lang === 'mr' ? 'धाराशिव जिल्हा' : 'Dharashiv'}
            </a>
            <a href="#agri" className="nav-item" onClick={() => setIsMobileNavOpen(false)}>
              {lang === 'mr' ? 'बाजारभाव व शेती' : 'Agriculture'}
            </a>
            <div className="mobile-admin-drawer-link" onClick={() => { setIsMobileNavOpen(false); navigate('/admin'); }}>
              <Lock size={15} /> <span>{t.adminLogin}</span>
            </div>
          </div>

          {/* Search Bar */}
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

      {/* BREAKING TICKER */}
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

      {/* HEADER BANNER ADVERTISEMENT */}
      {adsConfig?.headerBanner?.enabled && adsConfig.headerBanner.imageUrl && (
        <div className="container" style={{ margin: '12px auto' }}>
          <a 
            href={adsConfig.headerBanner.linkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <img 
              src={adsConfig.headerBanner.imageUrl} 
              alt={adsConfig.headerBanner.altText || 'Advertisement'} 
              style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </a>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <main className="container portal-layout">
        
        {/* LEFT COLUMN: NEWS */}
        <section className="news-main-column" id="main-news">
          <div className="section-head-bar">
            <div className="section-title-wrap">
              <h2 className="section-title-text">{t.mainNews}</h2>
              <span className="section-count-tag">{filteredNews.length} {lang === 'mr' ? 'बातम्या' : 'Stories'}</span>
            </div>

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

          {isLoadingNews && filteredNews.length === 0 ? (
            <div className="empty-state-card" style={{ padding: '30px', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#b91c1c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '10px' }} />
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{lang === 'mr' ? 'बातम्या लोड होत आहेत...' : 'Loading news...'}</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="empty-state-card">
              <p>{lang === 'mr' ? 'कोणतीही बातमी उपलब्ध नाही.' : 'No news found matching your criteria.'}</p>
            </div>
          ) : (
            <>
              {filteredNews[0] && (
                <article className="lead-hero-story" onClick={() => setActiveStory(filteredNews[0])}>
                  <div className="hero-img-wrap">
                    <CloudImage 
                      src={filteredNews[0].image} 
                      alt={filteredNews[0].title_mr || 'News'} 
                    />
                    <span className="hero-tag">
                      {lang === 'mr' ? (filteredNews[0].category_mr || 'उमरगा विशेष') : (filteredNews[0].category_en || filteredNews[0].category_mr || 'News')}
                    </span>
                  </div>
                  <div className="hero-details">
                    <div className="story-meta-line">
                      <span><Clock size={14} /> {filteredNews[0].date || currentDateStr}</span>
                      <span><Eye size={14} /> {filteredNews[0].views || 1200} वाचन</span>
                    </div>
                    <h3 className="hero-title">
                      {lang === 'mr' ? filteredNews[0].title_mr : (filteredNews[0].title_en || filteredNews[0].title_mr)}
                    </h3>
                    <p className="hero-snippet">
                      {((lang === 'mr' ? filteredNews[0].content_mr : (filteredNews[0].content_en || filteredNews[0].content_mr)) || '').slice(0, 200)}...
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

              <div className="news-cards-grid">
                {filteredNews.slice(1).map(story => {
                  if (!story) return null;
                  const displayTitle = lang === 'mr' ? story.title_mr : (story.title_en || story.title_mr);
                  const displaySnippet = ((lang === 'mr' ? story.content_mr : (story.content_en || story.content_mr)) || '');
                  const displayCat = lang === 'mr' ? (story.category_mr || 'उमरगा वार्ता') : (story.category_en || story.category_mr || 'News');

                  return (
                    <article 
                      key={story.id || Math.random()} 
                      className="news-grid-card"
                      onClick={() => setActiveStory(story)}
                    >
                      <div className="card-thumb-wrap">
                        <CloudImage 
                          src={story.image} 
                          alt={displayTitle || 'News'} 
                        />
                        <span className="card-cat-badge">{displayCat}</span>
                      </div>
                      <div className="card-body">
                        <div className="card-time"><Clock size={13} /> {story.date || currentDateStr}</div>
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

        {/* RIGHT COLUMN: RASHI BHAVISHYA & SIDEBAR ADS */}
        <aside className="sidebar-column">
          {/* SIDEBAR BANNER AD */}
          {adsConfig?.sidebarBanner?.enabled && adsConfig.sidebarBanner.imageUrl && (
            <div className="sidebar-card" style={{ padding: '8px', overflow: 'hidden' }}>
              <a 
                href={adsConfig.sidebarBanner.linkUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'block', borderRadius: '8px', overflow: 'hidden' }}
              >
                <img 
                  src={adsConfig.sidebarBanner.imageUrl} 
                  alt={adsConfig.sidebarBanner.altText || 'Advertisement'} 
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '6px' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </a>
            </div>
          )}

          {/* DAILY ASTROLOGY & PANCHANG SECTION */}
          <div className="rashi-glass-box" id="rashi" style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.08)' }}>
            <div className="rashi-widget-header" style={{ marginBottom: '14px', borderBottom: '1px solid #fef08a', paddingBottom: '10px' }}>
              <div>
                <h3 className="rashi-widget-title" style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', fontWeight: 800 }}>
                  <Sparkles size={20} color="#d97706" />
                  दैनिक पञ्चाङ्ग व राशी भविष्य
                </h3>
                <p className="rashi-widget-desc" style={{ color: '#b45309', margin: '3px 0 0', fontSize: '0.82rem' }}>
                  {currentDateStr} • तिथी, नक्षत्र, मुहूर्त व १२ राशींचे भविष्य
                </p>
              </div>
              <span className="daily-pill" style={{ background: '#d97706', color: '#fff', fontWeight: 700 }}>दैनिक</span>
            </div>

            {/* Interactive View Selector Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: '#fef3c7', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setAstroActiveTab('panchang')}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: astroActiveTab === 'panchang' ? '#b45309' : 'transparent',
                  color: astroActiveTab === 'panchang' ? '#ffffff' : '#92400e'
                }}
              >
                📅 आजचे पंचांग
              </button>
              <button
                type="button"
                onClick={() => setAstroActiveTab('rashifal')}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: astroActiveTab === 'rashifal' ? '#b45309' : 'transparent',
                  color: astroActiveTab === 'rashifal' ? '#ffffff' : '#92400e'
                }}
              >
                ♈ राशी भविष्य
              </button>
              <button
                type="button"
                onClick={() => setAstroActiveTab('full')}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: astroActiveTab === 'full' ? '#b45309' : 'transparent',
                  color: astroActiveTab === 'full' ? '#ffffff' : '#92400e'
                }}
              >
                📜 संपूर्ण पंचांग
              </button>
            </div>

            {/* TAB 1: PANCHANG & MUHURAT */}
            {astroActiveTab === 'panchang' && (
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #fef08a' }}>
                <div style={{ maxHeight: '420px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.86rem', lineHeight: '1.8', color: '#1e293b' }}>
                  {astroData?.panchang || 'पंचांग लोड होत आहे...'}
                </div>
              </div>
            )}

            {/* TAB 2: 12 RASHI ZODIAC PREDICTIONS */}
            {astroActiveTab === 'rashifal' && (
              <div>
                {/* Horizontal Scrolling Sign Selector */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px' }}>
                  {(astroData?.rashis || []).map(r => {
                    const isSelected = r.name === selectedZodiacSign;
                    return (
                      <button
                        key={r.id || r.name}
                        onClick={() => setSelectedZodiacSign(r.name)}
                        style={{
                          flexShrink: 0,
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: isSelected ? '1.5px solid #b45309' : '1px solid #fde68a',
                          background: isSelected ? '#b45309' : '#fff',
                          color: isSelected ? '#fff' : '#78350f',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <span>{r.symbol}</span>
                        <span>{r.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Zodiac Sign Card */}
                {(() => {
                  const currentSign = (astroData?.rashis || []).find(s => s.name === selectedZodiacSign) || (astroData?.rashis?.[0]);
                  if (!currentSign) return <p style={{ color: '#92400e' }}>राशी भविष्य उपलब्ध नाही.</p>;
                  return (
                    <div style={{ background: '#ffffff', borderRadius: '10px', padding: '16px', border: '1.5px solid #fed7aa', boxShadow: '0 2px 8px rgba(180, 83, 9, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', borderBottom: '1px solid #ffedd5', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{currentSign.symbol}</span>
                        <div>
                          <h4 style={{ margin: 0, color: '#9a3412', fontSize: '1.1rem', fontWeight: 800 }}>
                            {currentSign.name} रास
                          </h4>
                          {currentSign.letters && (
                            <span style={{ fontSize: '0.78rem', color: '#9a3412', opacity: 0.85 }}>
                              अक्षरे: {currentSign.letters}
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.7', color: '#1e293b' }}>
                        {currentSign.text || 'आजचे राशी भविष्य उपलब्ध नाही.'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 3: FULL SCRIPTURE VIEW */}
            {astroActiveTab === 'full' && (
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #fef08a' }}>
                <div style={{ maxHeight: '420px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: '1.75', color: '#1e293b' }}>
                  {astroData?.raw || DEFAULT_ASTRO_TEXT}
                </div>
              </div>
            )}

            {/* WhatsApp Share Button for Panchang */}
            <button
              type="button"
              onClick={() => {
                const text = encodeURIComponent(`*🕉️ उमरगा वार्ता दैनिक पञ्चाङ्ग व राशी भविष्य*\n\nआजचे संपूर्ण पंचांग व राशी भविष्य वाचण्यासाठी खालील लिंकवर क्लिक करा:\n${window.location.origin}#rashi`);
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              style={{
                marginTop: '12px',
                width: '100%',
                background: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Share2 size={16} /> पञ्चाङ्ग व राशी भविष्य व्हॉट्सॲपवर शेअर करा
            </button>
          </div>

          {/* EDITORIAL PROFILE */}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <a href="tel:+919890288228" className="editor-contact-btn" style={{ background: '#16a34a' }}>
                <Phone size={15} /> +91 98902 88228
              </a>
              <a href="mailto:mnimbarge@gmail.com" className="editor-contact-btn">
                <Mail size={15} /> mnimbarge@gmail.com
              </a>
            </div>
          </div>
        </aside>
      </main>

      {/* FULL STORY MODAL */}
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
              <CloudImage 
                src={activeStory.image} 
                alt="Story" 
                className="modal-banner-img"
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
              <li><button onClick={() => navigate('/admin')} className="footer-admin-link">{t.adminLogin}</button></li>
            </ul>
          </div>

          <div className="footer-contact-col">
            <h4 className="footer-heading">{lang === 'mr' ? 'कार्यालय व संपर्क' : 'Bureau Office'}</h4>
            <p className="footer-text">
              <strong>{lang === 'mr' ? 'डिजिटल डेस्क:' : 'Digital Desk:'}</strong> {lang === 'mr' ? 'उमरगा वार्ता' : 'Omerga Warta'}
            </p>
            <p className="footer-text">
              मुख्य कार्यालय: बसवेश्वर चौक, मुरुम, ता. उमरगा, जि. धाराशिव, महाराष्ट्र - 413606.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div className="footer-quick-badge">
                <Phone size={15} /> <a href="tel:+919890288228" style={{ color: 'inherit' }}>+91 98902 88228</a>
              </div>
              <div className="footer-quick-badge">
                <Mail size={15} /> <a href="mailto:mnimbarge@gmail.com" style={{ color: 'inherit' }}>mnimbarge@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="container footer-bottom-inner">
            <p>&copy; 2026 Omerga Warta (उमरगा वार्ता). सर्व हक्क राखीव. Designed with React & Modern UI.</p>
          </div>
        </div>
      </footer>

      {/* FLOATING / HANGING SOCIAL MEDIA BAR (RIGHT PANEL) */}
      <aside className="hanging-social-bar" aria-label="Social Media Links">
        <a 
          href="https://api.whatsapp.com/send?phone=919890288228&text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%95%E0%A4%BE%E0%A4%B0%20%E0%A4%89%E0%A4%AE%E0%A4%B0%E0%A4%97%E0%A4%BE%20%E0%A4%B5%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%A4%E0%A4%BE" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hanging-social-btn hanging-whatsapp"
          title="WhatsApp वर कनेक्ट व्हा"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span className="hanging-label">WhatsApp</span>
        </a>

        <a 
          href="https://www.facebook.com/profile.php?id=100004806277045" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hanging-social-btn hanging-facebook"
          title="Facebook वर फॉलो करा"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span className="hanging-label">Facebook</span>
        </a>

        <a 
          href="https://www.youtube.com/@murum7171" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hanging-social-btn hanging-youtube"
          title="YouTube वर सबस्क्राईब करा"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span className="hanging-label">YouTube</span>
        </a>

        <a 
          href="https://umargawarta.blogspot.com/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hanging-social-btn hanging-blogspot"
          title="आमचा Blogspot ब्लॉग वाचा"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M19.5 0h-15C2.015 0 0 2.015 0 4.5v15C0 21.985 2.015 24 4.5 24h15c2.485 0 4.5-2.015 4.5-4.5v-15C24 2.015 21.985 0 19.5 0zM14.4 7.2h-3.6c-.66 0-1.2.54-1.2 1.2v1.2c0 .66.54 1.2 1.2 1.2h3.6c.66 0 1.2-.54 1.2-1.2V8.4c0-.66-.54-1.2-1.2-1.2zm1.2 7.2c0 .66-.54 1.2-1.2 1.2H9.6c-.66 0-1.2-.54-1.2-1.2v-2.4c0-.66.54-1.2 1.2-1.2h4.8c.66 0 1.2.54 1.2 1.2v2.4z"/>
          </svg>
          <span className="hanging-label">Blogspot</span>
        </a>
      </aside>
    </div>
  );
}
