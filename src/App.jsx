import React, { useState } from 'react';

const metrics = [
  { icon: '🧬', label: 'Sugar Load', level: 'High', value: 78, tone: 'red' },
  { icon: '🧂', label: 'Sodium Load', level: 'High', value: 72, tone: 'orange' },
  { icon: '🍔', label: 'Processed Food Score', level: 'High', value: 70, tone: 'orange' },
  { icon: '🌿', label: 'Fiber Score', level: 'Good', value: 68, tone: 'green' },
  { icon: '🎨', label: 'Food Diversity', level: 'Average', value: 54, tone: 'yellow' },
];

const blameFoods = [
  { emoji: '🥤', food: 'Coke', badge: 'High Impact', risk: 'Sugar Load Very High', swap: 'Nimbu Pani', tone: 'red' },
  { emoji: '🍜', food: 'Maggi', badge: 'High Impact', risk: 'Sodium Load Very High', swap: 'Masala Oats', tone: 'red' },
  { emoji: '🍕', food: 'Pizza', badge: 'High Impact', risk: 'Calories High', swap: 'Veg Uttapam', tone: 'red' },
  { emoji: '🍟', food: 'Fries', badge: 'High Impact', risk: 'Processed Fat High', swap: 'Roasted Makhana', tone: 'red' },
  { emoji: '🍔', food: 'Burger', badge: 'High Impact', risk: 'Saturated Fat High', swap: 'Besan Chilla Roll', tone: 'red' },
  { emoji: '🥤', food: 'Cold Coffee', badge: 'Medium Impact', risk: 'Sugar Load Moderate', swap: 'Filter Coffee', tone: 'orange' },
];

const swaps = [
  ['🍚', 'White Rice', '➡', '🌾', 'Brown Rice'],
  ['🥔', 'Chips', '➡', '🫘', 'Roasted Chana'],
  ['🫓', 'Maida Paratha', '➡', '🥙', 'Multigrain Paratha'],
  ['🍨', 'Ice Cream', '➡', '🥣', 'Fruit Yogurt Bowl'],
  ['🍜', 'Noodles', '➡', '🥗', 'Veg Hakka Noodles'],
  ['🥤', 'Coke', '➡', '🥛', 'Chaas'],
  ['🍟', 'Fries', '➡', '🌰', 'Roasted Makhana'],
  ['🍔', 'Burger', '➡', '🥪', 'Protein Sandwich'],
  ['🍬', 'Packaged Sweets', '➡', '🍎', 'Fruits + Nuts'],
];

const weeklyPlan = [
  'Replace sugary drink with chaas',
  'Add fruit or sprouts snack',
  'Replace Maggi with poha/upma',
  'Add one protein-rich meal',
  'Avoid late-night fried food',
  'Add vegetables to lunch and dinner',
  'Review your Dabba Health Score',
];

const chatReplies = {
  'Why is my BP risk high?': 'Your BP risk signal is high because Maggi, pizza, fries, and packaged snacks are pushing sodium load upward. Try poha, upma, sprouts chaat, roasted makhana, and home-style meals.',
  'Why is my Dabba Health Score low?': 'Your score is affected by high sugar load, high sodium load, processed food frequency, and low fiber diversity. Small swaps can lift it quickly.',
  'What should I replace Maggi with?': 'Try masala oats, poha, vegetable upma, dalia, or homemade sevai with vegetables. They are lighter and more fiber-friendly.',
  'Give me a 7-day improvement plan': 'Day 1: replace sugary drinks. Day 2: add sprouts. Day 3: swap Maggi. Day 4: add protein. Day 5: skip late fried food. Day 6: add vegetables. Day 7: review your score.',
  'Which food caused my sugar spike?': 'Coke and cold coffee are the biggest sugar-spike contributors in this demo. They increase short-term energy crash risk and long-term diabetes/fatty-liver risk signals.',
  'Is this a medical diagnosis?': 'No. DabbaDoc does not diagnose disease. It shows early dietary risk signals from food patterns and recommends consulting a certified doctor or dietitian for medical advice.',
  'How can I reduce processed food?': 'Start with three swaps: Maggi to poha/upma, fries to roasted makhana, and packaged chips to sprouts chaat. Also keep one home-style meal daily.',
  'Give me healthier lunch ideas': 'Try dal-rice with salad, paneer roti wrap, rajma with brown rice, vegetable upma, sprouts chaat, or curd rice with vegetables.',
};

function Logo() {
  return (
    <div className="logo">
      <span className="mini-mascot">👨‍⚕️</span>
      <span>Dabba<span>Doc</span></span>
    </div>
  );
}

function Mascot({ small = false }) {
  return (
    <div className={small ? 'mascot small' : 'mascot'} aria-label="DabbaBot mascot">
      <div className="cap"><span>✚</span></div>
      <div className="tiffin-lines"><i></i><i></i><i></i></div>
      <div className="face">
        <span className="eye left"></span>
        <span className="eye right"></span>
        <span className="smile"></span>
      </div>
      <div className="headset"></div>
      <div className="stethoscope"><span></span></div>
      <div className="cape"></div>
    </div>
  );
}

function FloatingFoods() {
  const items = [
    ['🥟', 'float-1'], ['🧾', 'float-2'], ['🍲', 'float-3'], ['🛍️', 'float-4'],
    ['🧀', 'float-5'], ['☕', 'float-6'], ['🍎', 'float-7'], ['🍟', 'float-8'],
    ['🥤', 'float-9'], ['🍕', 'float-10'], ['🌶️', 'float-11'], ['🍃', 'float-12'],
    ['🥭', 'float-13'], ['🥛', 'float-14'], ['🥗', 'float-15'], ['🫓', 'float-16'],
    ['🍋', 'float-17'], ['🥕', 'float-18']
  ];
  return (
    <>
      <div className="food-orbit orbit-one"><span>🍱</span><span>🥦</span><span>🧾</span></div>
      <div className="food-orbit orbit-two"><span>🍕</span><span>🥤</span><span>🌿</span></div>
      {items.map(([emoji, cls]) => <span key={cls} className={`floating-food ${cls}`}>{emoji}</span>)}
    </>
  );
}

function TopNav() {
  return (
    <nav className="top-nav">
      <Logo />
      <div className="nav-links">
        <a className="active" href="#dashboard">Dashboard</a>
        <a href="#receipts">Receipts</a>
        <a href="#foods">Foods</a>
        <a href="#insights">Insights</a>
        <a href="#plan">Health Plan</a>
        <a href="#community">Community</a>
      </div>
      <div className="profile-area">
        <button className="icon-btn">🔔</button>
        <div className="avatar"></div>
        <span>Hi, Ananya</span>
        <b>⌄</b>
      </div>
    </nav>
  );
}

function Hero({ onDemo, onUpload }) {
  return (
    <header className="hero">
      <FloatingFoods />
      <div className="hero-copy">
        <div className="pill purple">AI-Powered Preventive Healthcare</div>
        <h1>Dabba<span>Doc</span></h1>
        <h2>Your dabba knows your health<br />before your reports do.</h2>
        <p>
          We analyse your grocery receipts, packaged foods and food delivery history
          to predict health risks early and help you make smarter food choices.
        </p>
        <div className="hero-actions">
          <button className="btn primary" onClick={onDemo}>✦ Try Demo Analysis</button>
          <button className="btn upload" onClick={onUpload}>⇧ Upload Receipt</button>
        </div>
        <div className="feature-chips">
          <div><b>🧠 AI Food Intelligence</b><small>Deep learning models trained on Indian diets</small></div>
          <div><b>🧾 Receipt-Based Health Insights</b><small>Because your bills reveal your habits</small></div>
          <div><b>🔒 Privacy First</b><small>Your data is safe, secure & private</small></div>
        </div>
        <div className="trust-row">
          <span>Trusted by <b>50,000+</b> users across India</span>
          <div className="tiny-avatars"><i></i><i></i><i></i><i></i></div>
          <b>4.8</b>
          <span className="stars">★★★★★</span>
        </div>
      </div>
      <div className="hero-art">
        <div className="dotted-path"></div>
        <Mascot />
      </div>
    </header>
  );
}

function Sidebar() {
  const links = [
    ['⌂', 'Overview', ''], ['♢', 'Health Score', ''], ['⌁', 'Risk Spectrum', ''],
    ['❖', 'Food Blame Map', ''], ['♡', 'Healthy Swaps', ''], ['▣', 'Receipts', '12'],
    ['▤', 'Orders', '24'], ['▥', 'Pantry', 'New'], ['▦', 'Health Plan', ''],
    ['☷', 'Reports', ''], ['♧', 'Community', ''], ['⚙', 'Settings', ''],
  ];

  return (
    <aside className="sidebar">
      <Logo />
      <div className="side-links">
        {links.map(([icon, label, badge], idx) => (
          <a key={label} className={idx === 0 ? 'selected' : ''} href={`#${label.toLowerCase().replaceAll(' ', '-')}`}>
            <span>{icon}</span>{label}{badge && <b className={badge === 'New' ? 'new' : ''}>{badge}</b>}
          </a>
        ))}
      </div>
      <div className="pro-card">
        <strong>✦ Unlock Pro Insights</strong>
        <p>Go Premium for deeper AI insights & trends</p>
        <button>Upgrade Now</button>
      </div>
    </aside>
  );
}

function MetricCard({ metric }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-icon">{metric.icon}</span>
        <div><strong>{metric.label}</strong></div>
        <b className={`level ${metric.tone}`}>{metric.level}</b>
      </div>
      <div className="progress-line"><span className={metric.tone} style={{ width: `${metric.value}%` }}></span></div>
      <small>{metric.value}/100</small>
    </div>
  );
}

function HealthScore() {
  return (
    <div className="score-card">
      <div className="card-title">Dabba Health Score <span>ⓘ</span></div>
      <div className="score-content">
        <div className="score-ring" style={{ '--score': '62%' }}>
          <strong>62</strong><span>/100</span>
        </div>
        <div>
          <div className="status-face">😟</div>
          <h4>Needs<br />Improvement</h4>
          <p>You're on the right track. Small changes can make a big difference!</p>
          <button>View Full Report</button>
        </div>
      </div>
    </div>
  );
}

function RiskSpectrum() {
  const zones = [
    { title: 'Short-term Risk', days: '0 – 7 days', status: 'Moderate', icon: '⚡', text: 'High sodium & low fiber may cause bloating, fatigue, acidity, constipation, and sugar spikes.', tone: 'yellow' },
    { title: '30-day Risk', days: '8 – 30 days', status: 'High', icon: '📅', text: 'High sugar & processed foods may impact energy, gut health, insulin response, and skin.', tone: 'red' },
    { title: 'Long-term Risk', days: '30+ days', status: 'High', icon: '❤️', text: 'Risk of weight gain, insulin resistance, heart issues, fatty liver, and lifestyle disease patterns.', tone: 'purple' },
  ];
  return (
    <section className="risk-card" id="insights">
      <div className="section-heading">
        <div><h3>Risk Spectrum</h3><p>AI-predicted risk signals based on your current eating patterns</p></div>
        <button className="outline-purple">View Detailed Insights →</button>
      </div>
      <div className="timeline"><i></i><span></span><span></span><span></span></div>
      <div className="risk-zones">
        {zones.map((z) => (
          <div className={`risk-zone ${z.tone}`} key={z.title}>
            <div className="zone-top"><strong>{z.title}</strong><b>{z.status}</b></div>
            <small>{z.days}</small>
            <p>{z.text}</p>
            <em>{z.icon}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function FoodBlameMap() {
  return (
    <section className="blame-section" id="foods">
      <div className="section-heading">
        <div><h3>Food Blame Map</h3><p>These foods are pulling your health score down</p></div>
        <button className="green-outline">View All Food Insights →</button>
      </div>
      <div className="blame-grid">
        {blameFoods.map((item) => (
          <div className="blame-card" key={item.food}>
            <div className="food-emoji">{item.emoji}</div>
            <strong>{item.food}</strong>
            <b className={item.tone}>{item.badge}</b>
            <p>{item.risk}</p>
            <span className="down-arrow">↓</span>
            <div className="swap-box"><small>Swap with</small><strong>{item.swap}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HealthySwaps() {
  return (
    <section className="swaps-section" id="healthy-swaps">
      <h3>Healthy Swaps For You</h3>
      <p>Delicious Indian swaps that can boost your health</p>
      <div className="swap-carousel">
        <button className="round-arrow">‹</button>
        <div className="swap-row">
          {swaps.map(([e1, f1, arrow, e2, f2]) => (
            <div className="swap-card" key={`${f1}-${f2}`}>
              <div><span>{e1}</span><small>{f1}</small></div>
              <b>{arrow}</b>
              <div><span>{e2}</span><small>{f2}</small></div>
            </div>
          ))}
        </div>
        <button className="round-arrow">›</button>
      </div>
      <button className="explore-btn">⟳ Explore 200+ Healthy Swaps</button>
    </section>
  );
}

function SimulatorAndPlan() {
  return (
    <section className="extras-grid" id="plan">
      <div className="sim-card">
        <h3>What If You Swap These Foods?</h3>
        <div className="score-compare">
          <div><small>Current Score</small><strong>62</strong></div>
          <span>→</span>
          <div><small>After Swaps</small><strong>78</strong></div>
        </div>
        {[
          ['Sugar Load reduced', '25%', 'red'], ['Sodium Load reduced', '30%', 'orange'],
          ['Processed Food reduced', '35%', 'purple'], ['Fiber Score improved', '20%', 'green']
        ].map(([label, val, tone]) => (
          <div className="mini-progress" key={label}><span>{label}</span><b>{val}</b><i><em className={tone}></em></i></div>
        ))}
        <button className="btn primary compact">Simulate Healthier Week</button>
      </div>
      <div className="plan-card">
        <h3>7-Day Dabba Reset Plan</h3>
        <p>Week Progress: <b>3/7 days completed</b></p>
        <div className="week-list">
          {weeklyPlan.map((item, index) => (
            <div className={index < 3 ? 'done' : ''} key={item}><b>Day {index + 1}</b><span>{item}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyticsReport({ onDownloadReport }) {
  const bars = [
    ['Sugar Load Chart', 78, 'red'], ['Sodium Load Chart', 72, 'orange'], ['Processed Food Frequency', 70, 'purple'],
    ['Fiber Deficiency Meter', 64, 'yellow'], ['Protein Balance Meter', 58, 'green'], ['Healthy Diversity Score', 54, 'green'],
  ];
  return (
    <section className="analytics-report">
      <div className="analytics-card">
        <h3>Food Pattern Analytics</h3>
        <div className="analytics-bars">
          {bars.map(([name, val, tone]) => <div key={name}><span>{name}</span><i><em className={tone} style={{ width: `${val}%` }}></em></i><b>{val}%</b></div>)}
        </div>
      </div>
      <div className="report-card" id="reports">
        <h3>DabbaDoc Health Insight Report</h3>
        <ul>
          <li>Dabba Health Score</li><li>Short-Term Alerts</li><li>Medium-Term Pattern Risks</li><li>Long-Term Risk Signals</li>
          <li>Top Food Contributors</li><li>Healthy Indian Swaps</li><li>7-Day Dabba Reset Plan</li><li>DabbaBot AI Summary</li>
        </ul>
        <div className="report-actions"><button onClick={onDownloadReport}>⬇ Download Report</button><button>↗ Share with Nutritionist</button><button>♡ Save Analysis</button></div>
      </div>
    </section>
  );
}


function BuildVerseSection() {
  return (
    <section className="buildverse-section" id="buildverse">
      <div>
        <span className="pill orange-pill">BuildVerse Healthcare Innovation</span>
        <h3>Hackathon MVP Mode → 30-Hour Build Mode</h3>
        <p>DabbaDoc is ready as a visual MVP now. In the offline round, the same frontend can connect with OCR, ML risk engine, GenAI, report generation and CLI.</p>
      </div>
      <div className="buildverse-grid">
        <article><b>Round 1 MVP</b><span>Animated UI + mock food history + demo dashboard</span></article>
        <article><b>30-Hour Finale</b><span>FastAPI backend + OCR + real scoring + PDF report</span></article>
        <article><b>Deep-Tech Track</b><span>GenAI recommendations + ML/DL roadmap + explainable risk</span></article>
      </div>
      <div className="tech-badges">
        {['React', 'Vite', 'Tailwind-ready CSS', 'FastAPI', 'Python', 'OCR', 'ML Risk Engine', 'GenAI', 'CLI'].map((tech) => <span key={tech}>{tech}</span>)}
      </div>
    </section>
  );
}

function ImpactBanner() {
  return (
    <section className="impact-banner">
      <div><b>💸 Save Today</b><strong>₹2,340</strong><span>On healthier swaps</span></div>
      <div><b>🌿 CO₂ Saved</b><strong>12.4 kg</strong><span>By eating better</span></div>
      <div><b>🔥 Streak</b><strong>7 Days</strong><span>Healthy logging</span></div>
      <div><b>🎁 Better Together</b><span>Invite friends & earn rewards!</span><button>Invite Now</button></div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="community">
      <div className="monuments"><span>🏛️</span><span>🕌</span><span>🏰</span><span>🛕</span></div>
      <h2>❤️ Small Swaps. Big Impact. Better You.</h2>
      <p>DabbaDoc — Your everyday food, your lifelong health.</p>
      <div className="footer-links"><a>About Us</a><a>Privacy</a><a>Terms</a><a>Contact</a></div>
      <div className="socials"><span>📸</span><span>▶️</span><span>𝕏</span><span>in</span></div>
    </footer>
  );
}

function Dashboard({ onDownloadReport }) {
  return (
    <main className="dashboard-shell" id="dashboard">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dash-head">
          <div><h2>Your Dabba Health Dashboard 👋</h2><p>Analysed from 18 receipts, 24 orders & 312 unique items</p></div>
          <button className="date-btn">May 1 – May 31, 2024 📅</button>
        </div>
        <div className="score-metrics-grid">
          <HealthScore />
          <div className="metrics-grid">{metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}</div>
        </div>
        <RiskSpectrum />
        <FoodBlameMap />
        <HealthySwaps />
        <SimulatorAndPlan />
        <AnalyticsReport onDownloadReport={onDownloadReport} />
        <BuildVerseSection />
        <ImpactBanner />
      </div>
    </main>
  );
}

function ProcessingOverlay({ show, onClose }) {
  if (!show) return null;
  return (
    <div className="overlay">
      <div className="processing-card">
        <button className="close" onClick={onClose}>×</button>
        <Mascot small />
        <h2>DabbaDoc AI is analysing your food pattern</h2>
        <div className="scan-box"><div className="scan-line"></div><span>🧾</span></div>
        <ul>
          <li>Scanning receipt...</li>
          <li>Extracting food items...</li>
          <li>Mapping Indian nutrition scores...</li>
          <li>Building short-term & long-term risk signals...</li>
          <li>Generating DabbaBot recommendations...</li>
        </ul>
        <button className="btn primary" onClick={onClose}>Show Dashboard</button>
      </div>
    </div>
  );
}

function UploadModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div className="overlay">
      <div className="upload-modal">
        <button className="close" onClick={onClose}>×</button>
        <h2>Upload Receipt or Order History</h2>
        <p>MVP mode uses sample data. Backend OCR will be connected after Round 1.</p>
        <div className="upload-options">
          <div className="drop-zone">⇧<strong>Drag & drop receipt image</strong><span>PNG, JPG or PDF receipt</span></div>
          <div className="drop-zone json">{}<strong>Upload order JSON</strong><span>Swiggy/Zomato-style demo history</span></div>
        </div>
        <button className="btn primary" onClick={onClose}>Use Sample Data</button>
      </div>
    </div>
  );
}

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Namaste! 👋 I’m DabbaBot! Ask me anything about your food & health.' },
  ]);

  function getBotReply(question) {
    const q = question.toLowerCase();
    if (chatReplies[question]) return chatReplies[question];
    if (q.includes('bp') || q.includes('blood') || q.includes('hypertension')) return chatReplies['Why is my BP risk high?'];
    if (q.includes('maggi')) return chatReplies['What should I replace Maggi with?'];
    if (q.includes('sugar') || q.includes('coke')) return chatReplies['Which food caused my sugar spike?'];
    if (q.includes('diagnosis') || q.includes('medical')) return chatReplies['Is this a medical diagnosis?'];
    if (q.includes('processed')) return chatReplies['How can I reduce processed food?'];
    if (q.includes('lunch') || q.includes('meal')) return chatReplies['Give me healthier lunch ideas'];
    return 'Based on this demo pattern, focus on reducing sugary drinks, high-sodium packaged foods, and fried snacks. Replace them with chaas, poha, upma, sprouts, dal, paneer, fruits and roasted makhana.';
  }

  function ask(question) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    setMessages((prev) => [...prev, { from: 'user', text: cleanQuestion }, { from: 'bot', text: getBotReply(cleanQuestion) }]);
    setInput('');
    setOpen(true);
  }

  function submitInput(event) {
    event.preventDefault();
    ask(input);
  }

  return (
    <>
      <div className="chat-suggestions">
        {Object.keys(chatReplies).map((q) => <button key={q} onClick={() => ask(q)}>{q}</button>)}
      </div>
      <div className="chat-widget">
        <button className="chat-close" onClick={() => setOpen(!open)}>{open ? '×' : '💬'}</button>
        <Mascot small />
        {open && <div className="chat-panel">
          <div className="chat-messages">
            {messages.slice(-6).map((m, i) => <div className={m.from} key={`${m.text}-${i}`}>{m.text}</div>)}
          </div>
          <form className="chat-input" onSubmit={submitInput}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask DabbaBot anything..." /><button type="submit">↗</button></form>
        </div>}
        {!open && <div className="chat-bubble"><b>Namaste! 👋<br />I'm DabbaBot!</b><span>Ask me anything about your food & health.</span></div>}
      </div>
    </>
  );
}

export default function App() {
  const [processing, setProcessing] = useState(false);
  const [upload, setUpload] = useState(false);

  function scrollToDashboard() {
    const dash = document.getElementById('dashboard');
    if (dash) dash.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function startDemo() {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      scrollToDashboard();
    }, 2100);
  }

  function downloadReport() {
    const report = `DabbaDoc Health Insight Report\n\nDabba Health Score: 62/100 - Needs Improvement\n\nShort-Term Alerts:\n- Sugar Spike Risk: High\n- Bloating / Sodium Water Retention: High\n- Constipation / Low Fiber Risk: High\n\nLong-Term Risk Signals:\n- Type 2 Diabetes Risk Signal: Medium\n- Hypertension Risk Signal: High\n- Fatty Liver Risk Signal: Medium\n\nTop Food Contributors:\n- Coke: High sugar beverage\n- Maggi: High sodium + ultra processed\n- Pizza: Sodium + refined carbs + fat\n- Fries: Fried + processed fat\n\nSuggested Indian Swaps:\n- Coke → Chaas / Nimbu Pani\n- Maggi → Poha / Upma / Masala Oats\n- Fries → Roasted Makhana\n- Pizza → Paneer Roti Wrap\n\nDisclaimer: DabbaDoc does not diagnose, treat, or cure medical conditions. It provides early dietary risk signals based on food patterns.`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DabbaDoc-Health-Insight-Report.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-frame">
      <TopNav />
      <Hero onDemo={startDemo} onUpload={() => setUpload(true)} />
      <Dashboard onDownloadReport={downloadReport} />
      <Footer />
      <Chatbot />
      <ProcessingOverlay show={processing} onClose={() => { setProcessing(false); scrollToDashboard(); }} />
      <UploadModal show={upload} onClose={() => setUpload(false)} />
    </div>
  );
}
