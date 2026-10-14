import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DEFAULT_NEWS, 
  DEFAULT_RASHI 
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
  Menu,
  FileText
} from 'lucide-react';
import { getEpaperPdf } from './pdfStorage';
import { fetchNewsFromSupabase } from './supabase';
import { fetchNewsFromCloud, fetchRashiFromCloud } from './cloudSync';
import './App.css';

export default function PortalPage() {
  const navigate = useNavigate();

  // Language State: 'mr' (Marathi) or 'en' (English)
  const [lang, setLang] = useState(() => localStorage.getItem('ow_lang') || 'mr');

  // Mobile navigation hamburger toggle state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // News State: Auto-filters any posts older than 7 days (1 week)
  const [news, setNews] = useState(() => {
    const saved = localStorage.getItem('ow_news');
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const initial = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(initial) || initial.length === 0) return [];
    return initial.filter(item => {
      const itemTime = item.createdAt || (typeof item.id === 'number' && item.id > 1000000 ? item.id : null) || Date.now();
      return itemTime >= oneWeekAgo;
    });
  });

  // Fetch real-time news from Cloud (syncs across laptop, phone, tablet)
  useEffect(() => {
    fetchNewsFromCloud().then(cloudPosts => {
      if (cloudPosts && Array.isArray(cloudPosts) && cloudPosts.length > 0) {
        setNews(cloudPosts);
        localStorage.setItem('ow_news', JSON.stringify(cloudPosts));
      } else {
        // Fallback to Supabase if available
        fetchNewsFromSupabase().then(supabasePosts => {
          if (supabasePosts && supabasePosts.length > 0) {
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const freshPosts = supabasePosts.filter(item => {
              if (typeof item.id === 'number' && item.id < 1000) return true;
              const itemTime = new Date(item.created_at).getTime() || item.createdAt || (typeof item.id === 'number' && item.id > 1000000 ? item.id : null) || Date.now();
              return itemTime >= oneWeekAgo;
            });
            if (freshPosts.length > 0) {
              setNews(freshPosts);
              localStorage.setItem('ow_news', JSON.stringify(freshPosts));
            }
          }
        });
      }
    });
  }, []);

  // Rashi State
  const [rashiList, setRashiList] = useState(() => {
    const saved = localStorage.getItem('ow_rashi');
    return saved ? JSON.parse(saved) : DEFAULT_RASHI;
  });

  // Sync real-time Rashi Bhavishya from Cloud
  useEffect(() => {
    fetchRashiFromCloud().then(cloudRashi => {
      if (cloudRashi && Array.isArray(cloudRashi) && cloudRashi.length > 0) {
        setRashiList(cloudRashi);
        localStorage.setItem('ow_rashi', JSON.stringify(cloudRashi));
      }
    });
  }, []);

  // E-Paper State from IndexedDB (Unlimited size & binary support)
  const [epaperInfo, setEpaperInfo] = useState({
    title_mr: "उमरगा वार्ता - आजची मुख्य आवृत्ती",
    date: new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    pdfUrl: "",
    fileName: ""
  });

  useEffect(() => {
    getEpaperPdf().then(saved => {
      if (saved && saved.pdfUrl) {
        setEpaperInfo({
          title_mr: saved.title_mr,
          date: saved.date,
          pdfUrl: saved.pdfUrl,
          fileName: saved.fileName
        });
      }
    });
  }, []);

  const handleOpenEpaperPdf = () => {
    if (epaperInfo && epaperInfo.pdfUrl) {
      window.open(epaperInfo.pdfUrl, '_blank');
    } else {
      alert(lang === 'mr' 
        ? 'आजचा ई-पेपर लवकरच अपलोड केला जाईल. कृपया थोड्या वेळाने तपासा.' 
        : "Today's e-paper PDF will be uploaded shortly. Please check back soon.");
    }
  };

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
    const interval = setInterval(updateDate, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lang]);

  const activeRashi = rashiList.find(r => r.id === selectedRashiId) || rashiList[0];

  const filteredNews = news.filter(item => {
    const title = lang === 'mr' ? item.title_mr : (item.title_en || item.title_mr);
    const category = item.category_mr;
    const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const breakingHeadline = news.length > 0 
    ? (lang === 'mr' ? news[0].title_mr : (news[0].title_en || news[0].title_mr))
    : (lang === 'mr' ? 'उमरगा वार्ता डिजिटल पोर्टलवर आपले स्वागत आहे.' : 'Welcome to Omerga Warta News Portal.');

  const handleShareWhatsApp = (story) => {
    const title = lang === 'mr' ? story.title_mr : (story.title_en || story.title_mr);
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

            {/* Hidden / Disguised Link to the Separate /admin route */}
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

          {filteredNews.length === 0 ? (
            <div className="empty-state-card">
              <p>{lang === 'mr' ? 'कोणतीही बातमी उपलब्ध नाही.' : 'No news found matching your criteria.'}</p>
            </div>
          ) : (
            <>
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

        {/* RIGHT COLUMN: RASHI BHAVISHYA */}
        <aside className="sidebar-column">
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

            {activeRashi && (
              <div className="active-rashi-card">
                <div className="active-rashi-head">
                  <div className="rashi-big-icon">{activeRashi.symbol}</div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <h4 className="active-rashi-name">
                        {lang === 'mr' ? `${activeRashi.name_mr} रास (${activeRashi.name_en})` : `${activeRashi.name_en} (${activeRashi.name_mr})`}
                      </h4>
                      <span className="rashi-date-badge">
                        <Calendar size={11} /> {activeRashi.updated_date || currentDateStr}
                      </span>
                    </div>
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

          {/* E-PAPER WIDGET */}
          <div className="sidebar-card epaper-banner">
            <h4 className="epaper-title">{lang === 'mr' ? 'उमरगा वार्ता ई-पेपर' : 'Digital E-Paper'}</h4>
            <p className="epaper-sub">
              {epaperInfo.fileName 
                ? (lang === 'mr' ? `आजची आवृत्ती उपलब्ध: ${epaperInfo.title_mr || 'मुख्य आवृत्ती'} (${epaperInfo.date})` : `Today's Edition: ${epaperInfo.date}`)
                : (lang === 'mr' ? 'आजची पूर्ण आवृत्ती आणि रविवार विशेष पुरवणी मोफत वाचा.' : 'Read and download today’s complete print edition in digital PDF format.')
              }
            </p>
            <button 
              className="epaper-download-btn"
              onClick={handleOpenEpaperPdf}
            >
              {lang === 'mr' ? 'ई-पेपर वाचा (PDF)' : 'Read E-Paper (PDF)'}
            </button>
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
