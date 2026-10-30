'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Zap,
  TrendingUp,
  Wallet,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  ChevronDown,
  Users,
  FileSpreadsheet,
  Layers,
  Clock,
  HelpCircle,
  DollarSign,
} from 'lucide-react';
import styles from '@/components/landing/LandingPage.module.css';

/* ------------------------------------------------------------ */
/* PRESET DATA FOR INTERACTIVE CROP SIMULATOR                   */
/* ------------------------------------------------------------ */
type CropPreset = {
  id: string;
  name: string;
  emoji: string;
  yieldPerAcre: number; // in quintals or tons
  yieldUnit: string;
  pricePerUnit: number; // in INR
  costPerAcre: number;  // in INR
  breakdown: {
    seeds: number;
    fertilizers: number;
    labor: number;
    machinery: number;
  };
};

const CROP_PRESETS: CropPreset[] = [
  {
    id: 'paddy',
    name: 'Paddy / Rice',
    emoji: '🌾',
    yieldPerAcre: 26,
    yieldUnit: 'Quintals',
    pricePerUnit: 2350,
    costPerAcre: 28500,
    breakdown: { seeds: 3500, fertilizers: 9000, labor: 11000, machinery: 5000 },
  },
  {
    id: 'cotton',
    name: 'Cotton',
    emoji: '⚪',
    yieldPerAcre: 12,
    yieldUnit: 'Quintals',
    pricePerUnit: 7200,
    costPerAcre: 36000,
    breakdown: { seeds: 5000, fertilizers: 11000, labor: 14000, machinery: 6000 },
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    emoji: '🎋',
    yieldPerAcre: 45,
    yieldUnit: 'Tons',
    pricePerUnit: 3200,
    costPerAcre: 54000,
    breakdown: { seeds: 9000, fertilizers: 16000, labor: 21000, machinery: 8000 },
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    emoji: '🌽',
    yieldPerAcre: 32,
    yieldUnit: 'Quintals',
    pricePerUnit: 2150,
    costPerAcre: 24500,
    breakdown: { seeds: 4000, fertilizers: 8000, labor: 8000, machinery: 4500 },
  },
  {
    id: 'groundnut',
    name: 'Groundnut',
    emoji: '🥜',
    yieldPerAcre: 15,
    yieldUnit: 'Quintals',
    pricePerUnit: 6400,
    costPerAcre: 32000,
    breakdown: { seeds: 6500, fertilizers: 9500, labor: 11000, machinery: 5000 },
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    emoji: '🍅',
    yieldPerAcre: 16,
    yieldUnit: 'Tons',
    pricePerUnit: 17500,
    costPerAcre: 92000,
    breakdown: { seeds: 12000, fertilizers: 26000, labor: 38000, machinery: 16000 },
  },
];

/* ------------------------------------------------------------ */
/* FAQ DATA                                                     */
/* ------------------------------------------------------------ */
const FAQ_ITEMS = [
  {
    question: 'Is AgriTrack free to start using?',
    answer:
      'Yes, absolutely! You can sign up and start tracking your farm plots, crop cycles, and daily income/expense ledger for free. There are no credit card requirements to begin.',
  },
  {
    question: 'Does AgriTrack work on budget Android mobile phones?',
    answer:
      'Yes! AgriTrack is engineered to be exceptionally fast and lightweight. It works directly in Chrome, Safari, or any mobile browser with crisp text, easy tap targets, and no heavy app downloads needed.',
  },
  {
    question: 'Can I export my farm accounts for bank loans or Kisan Credit Card (KCC)?',
    answer:
      'Yes. AgriTrack generates organized, bank-ready PDF and Excel ledger statements with one tap, showing complete income, expenses, and net profit per crop season.',
  },
  {
    question: 'How does AgriTrack keep my farm financial records secure?',
    answer:
      'Every farmer account is strictly isolated and protected with password and mobile verification. Your data is encrypted and permanently backed up in the cloud, so you never lose records even if you lose your phone.',
  },
  {
    question: 'Can I manage multiple plots or leased land separately?',
    answer:
      'Yes. You can create separate records for each land parcel (e.g., North Field, Borewell Plot, Leased 5 Acres) and assign specific crops to each for accurate per-plot profit accounting.',
  },
];

export default function LandingPage() {
  // Mobile Nav State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Crop Simulator State
  const [selectedCropId, setSelectedCropId] = useState<string>('paddy');
  const [acres, setAcres] = useState<number>(5);

  // App Preview Tab State
  const [activeTab, setActiveTab] = useState<'crops' | 'ledger' | 'analytics'>('crops');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Calculation Math
  const currentCrop = CROP_PRESETS.find((c) => c.id === selectedCropId) || CROP_PRESETS[0];
  const totalYield = currentCrop.yieldPerAcre * acres;
  const estimatedRevenue = totalYield * currentCrop.pricePerUnit;
  const estimatedExpense = currentCrop.costPerAcre * acres;
  const estimatedNetProfit = estimatedRevenue - estimatedExpense;
  const profitMargin = Math.round((estimatedNetProfit / Math.max(estimatedRevenue, 1)) * 100);

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ---------------------------------------------------- */}
      {/* STICKY HEADER & RESPONSIVE NAVIGATION                */}
      {/* ---------------------------------------------------- */}
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Link href="/" className={styles.brand} aria-label="AgriTrack Home">
            <span className={styles.brandIcon}>
              <Sprout size={22} strokeWidth={2.4} />
            </span>
            <span>AgriTrack</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className={styles.navLinks} aria-label="Main Navigation">
            <a href="#simulator" className={styles.navLink}>Profit Calculator</a>
            <a href="#preview" className={styles.navLink}>App Tour</a>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#comparison" className={styles.navLink}>Why AgriTrack</a>
            <a href="#faq" className={styles.navLink}>FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className={styles.headerActions}>
            <Link href="/login" className={styles.loginBtn}>
              Sign In
            </Link>
            <Link href="/register" className={styles.ctaBtn}>
              Get Started <ArrowRight size={15} />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className={styles.mobileOverlay}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.mobileDrawer} role="dialog" aria-label="Mobile Navigation">
            <a
              href="#simulator"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              🌾 Profit Calculator
            </a>
            <a
              href="#preview"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              📱 Live App Tour
            </a>
            <a
              href="#features"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              ⚡ Farm Management Tools
            </a>
            <a
              href="#comparison"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              📖 Diary vs AgriTrack
            </a>
            <a
              href="#faq"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              ❓ Questions &amp; Answers
            </a>

            <div className={styles.mobileActionRow}>
              <Link
                href="/login"
                className={styles.heroSecondaryBtn}
                onClick={() => setMobileMenuOpen(false)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={styles.heroPrimaryBtn}
                onClick={() => setMobileMenuOpen(false)}
                style={{ width: '100%', justifyContent: 'center', padding: '12px 16px' }}
              >
                Create Account
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* HERO SECTION WITH EMBEDDED PROFIT SIMULATOR          */}
      {/* ---------------------------------------------------- */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            {/* Left Column: Headline & Value Proposition */}
            <div className={styles.heroContent}>
              <div className={styles.heroPill}>
                <span className={styles.heroPillIcon}>
                  <Sparkles size={16} />
                </span>
                <span>Smart Farm Accounting &amp; Crop Lifecycle</span>
              </div>

              <h1 className={styles.heroTitle}>
                Turn Farm Chaos into <em>Clear Profit.</em>
              </h1>

              <p className={styles.heroDescription}>
                Stop losing money to forgotten labor wages, misplaced fertilizer receipts, and damp paper diaries.
                AgriTrack gives you a clean, 10-second mobile ledger tailored for Indian farmers.
              </p>

              <div className={styles.heroActions}>
                <Link href="/register" className={styles.heroPrimaryBtn}>
                  Start Free Ledger <ArrowRight size={18} />
                </Link>
                <a href="#simulator" className={styles.heroSecondaryBtn}>
                  Try Calculator Below
                </a>
              </div>

              {/* Trust Badges */}
              <div className={styles.heroTrustBadges}>
                <div className={styles.trustItem}>
                  <ShieldCheck size={18} />
                  <span>Cloud &amp; Mobile Secure</span>
                </div>
                <div className={styles.trustItem}>
                  <Smartphone size={18} />
                  <span>100% Mobile Ready</span>
                </div>
                <div className={styles.trustItem}>
                  <Zap size={18} />
                  <span>10-Sec Daily Logging</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Crop Profit Simulator */}
            <div className={styles.calculatorCard} id="simulator">
              <div className={styles.calcHeader}>
                <div className={styles.calcTitle}>
                  <TrendingUp size={20} color="#10b981" />
                  <span>Crop Profit Simulator</span>
                </div>
                <span className={styles.calcBadge}>Interactive</span>
              </div>

              {/* Crop Selector Pills */}
              <div className={styles.cropSelectorGroup}>
                <label className={styles.calcLabel}>1. Select Your Crop</label>
                <div className={styles.cropPills}>
                  {CROP_PRESETS.map((crop) => (
                    <button
                      key={crop.id}
                      type="button"
                      className={`${styles.cropPill} ${
                        selectedCropId === crop.id ? styles.cropPillActive : ''
                      }`}
                      onClick={() => setSelectedCropId(crop.id)}
                    >
                      <span>{crop.emoji}</span>
                      <span>{crop.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Acreage Range Slider */}
              <div className={styles.acreControlGroup}>
                <div className={styles.acreHeaderRow}>
                  <label className={styles.calcLabel}>2. Cultivation Area</label>
                  <div className={styles.acreValueDisplay}>
                    {acres} <span>Acres</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={acres}
                  onChange={(e) => setAcres(parseInt(e.target.value, 10) || 1)}
                  className={styles.rangeSlider}
                  aria-label="Cultivation Area in Acres"
                />

                <div className={styles.acrePresets}>
                  {[2, 5, 10, 20].map((presetVal) => (
                    <button
                      key={presetVal}
                      type="button"
                      className={`${styles.acrePresetBtn} ${
                        acres === presetVal ? styles.acrePresetBtnActive : ''
                      }`}
                      onClick={() => setAcres(presetVal)}
                    >
                      {presetVal} Acres
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Calculated Result Box */}
              <div className={styles.calcResultBox}>
                <div className={styles.calcResultHeader}>
                  <span className={styles.calcResultLabel}>Projected Net Season Profit</span>
                  <span className={styles.marginPill}>+{profitMargin}% Margin</span>
                </div>

                <div className={styles.profitNumber}>{formatRupees(estimatedNetProfit)}</div>

                <div className={styles.calcBreakdownRow}>
                  <div className={styles.calcMiniStat}>
                    <small>Est. Gross Sales ({totalYield} {currentCrop.yieldUnit})</small>
                    <strong>{formatRupees(estimatedRevenue)}</strong>
                  </div>
                  <div className={styles.calcMiniStat}>
                    <small>Est. Input &amp; Labor Costs</small>
                    <strong>{formatRupees(estimatedExpense)}</strong>
                  </div>
                </div>
              </div>

              {/* Interactive CTA */}
              <Link
                href={`/register?crop=${currentCrop.id}&acres=${acres}`}
                className={styles.calcActionBtn}
              >
                Track {currentCrop.name} in AgriTrack <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* INTERACTIVE LIVE PLATFORM DEMO                       */}
      {/* ---------------------------------------------------- */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="preview">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>Interactive Preview</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Designed for the Field. <em>Mastered in Seconds.</em>
            </h2>
            <p className={styles.sectionSubtitle}>
              Experience how AgriTrack organizes your active crop cycles, daily expenses, and seasonal income in one clean view.
            </p>
          </div>

          <div className={styles.appDemoWrapper}>
            {/* Interactive Tab Controls */}
            <div className={styles.demoTabBar}>
              <button
                type="button"
                className={`${styles.demoTabBtn} ${
                  activeTab === 'crops' ? styles.demoTabBtnActive : ''
                }`}
                onClick={() => setActiveTab('crops')}
              >
                <Sprout size={17} />
                <span>Active Crop Cycles</span>
              </button>
              <button
                type="button"
                className={`${styles.demoTabBtn} ${
                  activeTab === 'ledger' ? styles.demoTabBtnActive : ''
                }`}
                onClick={() => setActiveTab('ledger')}
              >
                <Wallet size={17} />
                <span>Daily Farm Ledger</span>
              </button>
              <button
                type="button"
                className={`${styles.demoTabBtn} ${
                  activeTab === 'analytics' ? styles.demoTabBtnActive : ''
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 size={17} />
                <span>Harvest Analytics</span>
              </button>
            </div>

            {/* Mock Application Window */}
            <div className={styles.mockWindow}>
              <div className={styles.mockWindowBar}>
                <div className={styles.mockWindowDots}>
                  <span className={styles.mockDot} />
                  <span className={styles.mockDot} />
                  <span className={styles.mockDot} />
                </div>
                <div className={styles.mockWindowAddress}>agritrack.app/dashboard</div>
                <span className={styles.mockWindowTag}>LIVE PREVIEW</span>
              </div>

              <div className={styles.mockWindowBody}>
                {/* TAB 1: CROPS */}
                {activeTab === 'crops' && (
                  <div className={styles.cropCycleCards}>
                    <div className={styles.cropCycleCard}>
                      <div className={styles.cycleCardTop}>
                        <div className={styles.cycleCropName}>
                          <span>🌾</span>
                          <span>Ponni Paddy — Field A</span>
                        </div>
                        <span className={styles.cycleBadge}>Day 58 / 120</span>
                      </div>
                      <div className={styles.cyclePlotInfo}>8.0 Acres • Sown Nov 12 • Vegetative Stage</div>
                      <div className={styles.cycleProgressBar}>
                        <div className={styles.cycleProgressFill} style={{ width: '55%' }} />
                      </div>
                      <div className={styles.cycleProgressLabels}>
                        <span>Sowing</span>
                        <span>Panicle Initiation</span>
                        <span>Harvest</span>
                      </div>
                      <div className={styles.cycleNextTask}>
                        <Clock size={15} />
                        <span>Next: Top dressing fertilizer spray in 3 days</span>
                      </div>
                    </div>

                    <div className={styles.cropCycleCard}>
                      <div className={styles.cycleCardTop}>
                        <div className={styles.cycleCropName}>
                          <span>⚪</span>
                          <span>Bt Cotton — North Parcel</span>
                        </div>
                        <span className={styles.cycleBadge}>Day 92 / 160</span>
                      </div>
                      <div className={styles.cyclePlotInfo}>4.5 Acres • Sown Oct 05 • Boll Formation</div>
                      <div className={styles.cycleProgressBar}>
                        <div className={styles.cycleProgressFill} style={{ width: '68%' }} />
                      </div>
                      <div className={styles.cycleProgressLabels}>
                        <span>Germination</span>
                        <span>Flowering</span>
                        <span>Picking</span>
                      </div>
                      <div className={styles.cycleNextTask}>
                        <Clock size={15} />
                        <span>Next: Drip irrigation scheduled tomorrow morning</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LEDGER */}
                {activeTab === 'ledger' && (
                  <div>
                    <div className={styles.ledgerSummaryBar}>
                      <div className={styles.ledgerSummaryItem}>
                        <small>Total Income</small>
                        <strong className={styles.inflowColor}>+₹1,85,000</strong>
                      </div>
                      <div className={styles.ledgerSummaryItem}>
                        <small>Total Expenses</small>
                        <strong className={styles.outflowColor}>-₹74,200</strong>
                      </div>
                      <div className={styles.ledgerSummaryItem}>
                        <small>Net Cash Balance</small>
                        <strong className={styles.balanceColor}>+₹1,10,800</strong>
                      </div>
                    </div>

                    <div className={styles.ledgerTransactions}>
                      <div className={styles.ledgerRow}>
                        <div className={styles.ledgerRowLeft}>
                          <span className={`${styles.ledgerIconCircle} ${styles.ledgerExpenseIcon}`}>
                            <Users size={16} />
                          </span>
                          <div>
                            <div className={styles.ledgerRowTitle}>Sowing &amp; Weeding Labor (14 Workers)</div>
                            <div className={styles.ledgerRowMeta}>
                              <span>Field A</span> • <span>Today, 11:30 AM</span>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.ledgerRowAmount} ${styles.outflowColor}`}>-₹5,600</div>
                      </div>

                      <div className={styles.ledgerRow}>
                        <div className={styles.ledgerRowLeft}>
                          <span className={`${styles.ledgerIconCircle} ${styles.ledgerExpenseIcon}`}>
                            <Layers size={16} />
                          </span>
                          <div>
                            <div className={styles.ledgerRowTitle}>DAP &amp; Urea Fertilizer (8 Bags)</div>
                            <div className={styles.ledgerRowMeta}>
                              <span>Agri Store Bill #492</span> • <span>Yesterday</span>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.ledgerRowAmount} ${styles.outflowColor}`}>-₹12,400</div>
                      </div>

                      <div className={styles.ledgerRow}>
                        <div className={styles.ledgerRowLeft}>
                          <span className={`${styles.ledgerIconCircle} ${styles.ledgerIncomeIcon}`}>
                            <DollarSign size={16} />
                          </span>
                          <div>
                            <div className={styles.ledgerRowTitle}>Mandi Trader Advance — Cotton Harvest</div>
                            <div className={styles.ledgerRowMeta}>
                              <span>Direct Bank Transfer</span> • <span>24 Oct</span>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.ledgerRowAmount} ${styles.inflowColor}`}>+₹65,000</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: ANALYTICS */}
                {activeTab === 'analytics' && (
                  <div className={styles.analyticsGrid}>
                    <div className={styles.analyticsCard}>
                      <h4>Seasonal Cultivation Cost Breakdown</h4>

                      <div className={styles.costBarItem}>
                        <div className={styles.costBarMeta}>
                          <span>Labor &amp; Worker Wages</span>
                          <span>38% (₹28,200)</span>
                        </div>
                        <div className={styles.costBarTrack}>
                          <div
                            className={styles.costBarFill}
                            style={{ width: '38%', background: '#10b981' }}
                          />
                        </div>
                      </div>

                      <div className={styles.costBarItem}>
                        <div className={styles.costBarMeta}>
                          <span>Fertilizers, Nutrients &amp; Sprays</span>
                          <span>29% (₹21,500)</span>
                        </div>
                        <div className={styles.costBarTrack}>
                          <div
                            className={styles.costBarFill}
                            style={{ width: '29%', background: '#3b82f6' }}
                          />
                        </div>
                      </div>

                      <div className={styles.costBarItem}>
                        <div className={styles.costBarMeta}>
                          <span>Tractor Tilling &amp; Diesel Fuel</span>
                          <span>19% (₹14,100)</span>
                        </div>
                        <div className={styles.costBarTrack}>
                          <div
                            className={styles.costBarFill}
                            style={{ width: '19%', background: '#f59e0b' }}
                          />
                        </div>
                      </div>

                      <div className={styles.costBarItem}>
                        <div className={styles.costBarMeta}>
                          <span>Certified Seeds &amp; Seedlings</span>
                          <span>14% (₹10,400)</span>
                        </div>
                        <div className={styles.costBarTrack}>
                          <div
                            className={styles.costBarFill}
                            style={{ width: '14%', background: '#8b5cf6' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.roiCard}>
                      <span className={styles.roiPill}>Calculated ROI</span>
                      <div className={styles.roiBigNumber}>+149%</div>
                      <p className={styles.roiNote}>
                        Total net profit generated on working capital across Kharif &amp; Rabi cycles.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* FEATURE BENTO GRID                                   */}
      {/* ---------------------------------------------------- */}
      <section className={styles.section} id="features">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>Core Platform Tools</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Everything You Need to Run a <em>Thriving Farm.</em>
            </h2>
            <p className={styles.sectionSubtitle}>
              Built from real conversations with farmers across India. Zero complicated jargon—just practical tools that save time and money.
            </p>
          </div>

          <div className={styles.bentoGrid}>
            {/* Card 1: Crop Lifecycle */}
            <div className={styles.bentoCard}>
              <div>
                <span className={styles.bentoNumber}>01</span>
                <div className={styles.bentoIcon}>
                  <CalendarDays size={24} />
                </div>
                <h3 className={styles.bentoTitle}>Crop Lifecycle Timelines</h3>
                <p className={styles.bentoText}>
                  Keep planting dates, crop stages, and expected harvest targets in one structured view.
                </p>
              </div>
              <ul className={styles.bentoList}>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Stage-by-stage growth tracking</span>
                </li>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Spray &amp; irrigation reminders</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Farm Cashbook Ledger (Wide) */}
            <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
              <div>
                <span className={styles.bentoNumber}>02</span>
                <div className={styles.bentoIcon}>
                  <Wallet size={24} />
                </div>
                <h3 className={styles.bentoTitle}>Smart Dual-Entry Farm Ledger</h3>
                <p className={styles.bentoText}>
                  Log agricultural expenses as they happen: fertilizer sacks, diesel for pumps, machinery repairs, and mandi trader payments. Filter instantly by crop, field, or date range.
                </p>
              </div>
              <ul className={styles.bentoList}>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Customizable agricultural expense categories</span>
                </li>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Separate cash, bank, and trader credit balances</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Labor & Wage Management */}
            <div className={styles.bentoCard}>
              <div>
                <span className={styles.bentoNumber}>03</span>
                <div className={styles.bentoIcon}>
                  <Users size={24} />
                </div>
                <h3 className={styles.bentoTitle}>Worker Wage &amp; Advance Records</h3>
                <p className={styles.bentoText}>
                  Manage seasonal laborers, daily wages, and cash advances given with complete transparency.
                </p>
              </div>
              <ul className={styles.bentoList}>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Track advance payments per worker</span>
                </li>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Prevent double wage payouts</span>
                </li>
              </ul>
            </div>

            {/* Card 4: KCC & Bank Ready Reports */}
            <div className={styles.bentoCard}>
              <div>
                <span className={styles.bentoNumber}>04</span>
                <div className={styles.bentoIcon}>
                  <FileSpreadsheet size={24} />
                </div>
                <h3 className={styles.bentoTitle}>Bank &amp; KCC Loan Reports</h3>
                <p className={styles.bentoText}>
                  Download clean, official PDF &amp; Excel statements for Kisan Credit Card renewal and crop insurance claims.
                </p>
              </div>
              <ul className={styles.bentoList}>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>One-click PDF statement export</span>
                </li>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Audited profit &amp; loss summary</span>
                </li>
              </ul>
            </div>

            {/* Card 5: Multi-Plot Support */}
            <div className={styles.bentoCard}>
              <div>
                <span className={styles.bentoNumber}>05</span>
                <div className={styles.bentoIcon}>
                  <Layers size={24} />
                </div>
                <h3 className={styles.bentoTitle}>Multi-Plot &amp; Leased Land</h3>
                <p className={styles.bentoText}>
                  Track your own land and leased parcels under separate ledgers to know exact per-acre profitability.
                </p>
              </div>
              <ul className={styles.bentoList}>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Independent cost accounting per plot</span>
                </li>
                <li className={styles.bentoListItem}>
                  <CheckCircle2 size={16} />
                  <span>Lease rental vs profit analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* COMPARISON: OLD PAPER DIARY VS AGRITRACK             */}
      {/* ---------------------------------------------------- */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="comparison">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>Real Comparison</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Paper Diaries Waste Money. <em>AgriTrack Protects It.</em>
            </h2>
            <p className={styles.sectionSubtitle}>
              See why farmers are ditching messy notebooks and WhatsApp messages for an effortless digital ledger.
            </p>
          </div>

          <div className={styles.comparisonGrid}>
            {/* The Old Way */}
            <div className={styles.comparisonCardOld}>
              <div className={styles.comparisonHeaderOld}>
                <span className={styles.comparisonTitleOld}>Old Paper Diary &amp; Memory</span>
                <span className={styles.comparisonBadgeOld}>High Risk</span>
              </div>
              <ul className={styles.comparisonList}>
                <li className={styles.comparisonItem}>
                  <XCircle size={20} className={styles.crossIcon} />
                  <span>Pages get soaked, torn, or lost during monsoon rains.</span>
                </li>
                <li className={styles.comparisonItem}>
                  <XCircle size={20} className={styles.crossIcon} />
                  <span>Small cash expenses (diesel, labor tea, bolts) are forgotten.</span>
                </li>
                <li className={styles.comparisonItem}>
                  <XCircle size={20} className={styles.crossIcon} />
                  <span>You only know your true profit or loss weeks after harvest.</span>
                </li>
                <li className={styles.comparisonItem}>
                  <XCircle size={20} className={styles.crossIcon} />
                  <span>No backup if your notebook is misplaced or destroyed.</span>
                </li>
              </ul>
            </div>

            {/* The AgriTrack Way */}
            <div className={styles.comparisonCardNew}>
              <div className={styles.comparisonHeaderNew}>
                <span className={styles.comparisonTitleNew}>AgriTrack Smart Ledger</span>
                <span className={styles.comparisonBadgeNew}>Protected &amp; Clear</span>
              </div>
              <ul className={styles.comparisonList}>
                <li className={styles.comparisonItem}>
                  <CheckCircle2 size={20} className={styles.checkIcon} />
                  <span>10-second entry right from the field on your smartphone.</span>
                </li>
                <li className={styles.comparisonItem}>
                  <CheckCircle2 size={20} className={styles.checkIcon} />
                  <span>Instant per-crop profit meter calculated in real time.</span>
                </li>
                <li className={styles.comparisonItem}>
                  <CheckCircle2 size={20} className={styles.checkIcon} />
                  <span>Permanent cloud backup—your records are safe forever.</span>
                </li>
                <li className={styles.comparisonItem}>
                  <CheckCircle2 size={20} className={styles.checkIcon} />
                  <span>One-click PDF statements ready for Kisan Credit Card loans.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4-STEP FARMER WORKFLOW                               */}
      {/* ---------------------------------------------------- */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>Simple 4-Step Flow</span>
            </div>
            <h2 className={styles.sectionTitle}>
              A Clear Rhythm for <em>Every Season.</em>
            </h2>
            <p className={styles.sectionSubtitle}>
              From the day you buy seeds to the day you sell at the mandi, AgriTrack guides your seasonal bookkeeping.
            </p>
          </div>

          <div className={styles.workflowGrid}>
            <div className={styles.workflowStepCard}>
              <span className={styles.workflowStepNumber}>01</span>
              <h3 className={styles.workflowStepTitle}>Map Your Plots</h3>
              <p className={styles.workflowStepText}>
                Create your fields, select crop varieties, and set target harvest dates in 2 minutes.
              </p>
            </div>

            <div className={styles.workflowStepCard}>
              <span className={styles.workflowStepNumber}>02</span>
              <h3 className={styles.workflowStepTitle}>Log Daily Costs</h3>
              <p className={styles.workflowStepText}>
                Tap your phone to record daily labor wages, fertilizer bags, diesel, and spray costs.
              </p>
            </div>

            <div className={styles.workflowStepCard}>
              <span className={styles.workflowStepNumber}>03</span>
              <h3 className={styles.workflowStepTitle}>Track Growth</h3>
              <p className={styles.workflowStepText}>
                Monitor vegetative and flowering stages with automatic reminders for scheduled tasks.
              </p>
            </div>

            <div className={styles.workflowStepCard}>
              <span className={styles.workflowStepNumber}>04</span>
              <h3 className={styles.workflowStepTitle}>Settle &amp; Celebrate</h3>
              <p className={styles.workflowStepText}>
                Record mandi sale receipts and immediately know your exact net profit per acre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* TRUST NUMBERS & TESTIMONIALS                         */}
      {/* ---------------------------------------------------- */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          {/* Trust Metrics */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <div className={styles.metricBig}>10,000+</div>
              <div className={styles.metricLabel}>Acres Managed</div>
            </div>
            <div className={styles.metricBox}>
              <div className={styles.metricBig}>₹45,000</div>
              <div className={styles.metricLabel}>Avg. Cost Leak Saved / Yr</div>
            </div>
            <div className={styles.metricBox}>
              <div className={styles.metricBig}>10-Sec</div>
              <div className={styles.metricLabel}>Fast Daily Logging</div>
            </div>
            <div className={styles.metricBox}>
              <div className={styles.metricBig}>100%</div>
              <div className={styles.metricLabel}>Mobile &amp; PC Compatible</div>
            </div>
          </div>

          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>Farmer Stories</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Trusted by Farmers <em>Across India.</em>
            </h2>
          </div>

          <div className={styles.testimonialsGrid}>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                &ldquo;Earlier I had no idea whether my cotton crop actually made money after paying heavy labor wages. With AgriTrack, I knew my exact profit down to the last rupee.&rdquo;
              </p>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorAvatar}>R</span>
                <div className={styles.authorInfo}>
                  <strong>Ramesh Kumar</strong>
                  <span>Cotton &amp; Paddy Farmer • 12 Acres</span>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                &ldquo;The best part is how fast it is on my phone. Even with greasy hands on the tractor, I can type in diesel and fertilizer bills in ten seconds.&rdquo;
              </p>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorAvatar}>S</span>
                <div className={styles.authorInfo}>
                  <strong>Senthil Nathan</strong>
                  <span>Sugarcane &amp; Maize • 8.5 Acres</span>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                &ldquo;When applying for my Kisan Credit Card renewal, the bank manager was impressed by the neat PDF printout of my seasonal farm expenses. Approved without hassle.&rdquo;
              </p>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorAvatar}>P</span>
                <div className={styles.authorInfo}>
                  <strong>Praveen Deshmukh</strong>
                  <span>Horticulture &amp; Vegetables • 6 Acres</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* INTERACTIVE FAQ ACCORDION                            */}
      {/* ---------------------------------------------------- */}
      <section className={styles.section} id="faq">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>Questions &amp; Answers</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Frequently Asked <em>Questions.</em>
            </h2>
            <p className={styles.sectionSubtitle}>
              Have questions about getting started? Here are answers to common questions from farmers and land managers.
            </p>
          </div>

          <div className={styles.faqWrapper}>
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQuestionBtn}
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}
                    />
                  </button>
                  {isOpen && <div className={styles.faqAnswer}>{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM CONVERSION CTA BANNER                         */}
      {/* ---------------------------------------------------- */}
      <div className={styles.container}>
        <div className={styles.ctaBanner}>
          <h2 className={styles.ctaBannerTitle}>Ready to Bring Your Farm into Focus?</h2>
          <p className={styles.ctaBannerText}>
            Join thousands of progressive farmers who manage their crops, expenses, and harvests with confidence. No credit card required.
          </p>
          <div className={styles.ctaBannerActions}>
            <Link href="/register" className={styles.ctaBannerPrimary}>
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={styles.ctaBannerSecondary}>
              I Already Have an Account
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FOOTER                                               */}
      {/* ---------------------------------------------------- */}
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div className={styles.footerTop}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandIcon}>
                <Sprout size={20} strokeWidth={2.4} />
              </span>
              <span>AgriTrack</span>
            </Link>

            <nav className={styles.footerNav} aria-label="Footer Navigation">
              <a href="#simulator">Profit Simulator</a>
              <a href="#preview">App Demo</a>
              <a href="#features">Features</a>
              <a href="#comparison">Paper vs AgriTrack</a>
              <a href="#faq">FAQ</a>
              <Link href="/login">Sign In</Link>
              <Link href="/register">Create Account</Link>
            </nav>
          </div>

          <div className={styles.footerBottom}>
            <div>
              &copy; {new Date().getFullYear()} AgriTrack. All rights reserved. Smart agricultural accounting platform.
            </div>
            <div>Built for precision farm management on mobile and desktop.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
