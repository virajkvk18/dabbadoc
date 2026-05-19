<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
import Auth, { getCurrentUser, clearSession } from './Auth.jsx';
import './styles.css'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b'];
const geminiUrl = (model) =>`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const DEFAULT_METRICS = [
=======
import React, { useState } from 'react';

const metrics = [
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  { icon: '🧬', label: 'Sugar Load', level: 'High', value: 78, tone: 'red' },
  { icon: '🧂', label: 'Sodium Load', level: 'High', value: 72, tone: 'orange' },
  { icon: '🍔', label: 'Processed Food Score', level: 'High', value: 70, tone: 'orange' },
  { icon: '🌿', label: 'Fiber Score', level: 'Good', value: 68, tone: 'green' },
  { icon: '🎨', label: 'Food Diversity', level: 'Average', value: 54, tone: 'yellow' },
];

<<<<<<< HEAD
const DEFAULT_BLAME_FOODS = [
=======
const blameFoods = [
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
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

<<<<<<< HEAD
// ─── Gemini helpers ───────────────────────────────────────────────────────────
const responseCache = new Map();

async function callGemini(prompt) {
  if (responseCache.has(prompt)) return responseCache.get(prompt);

  for (let m = 0; m < MODELS.length; m++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(geminiUrl(MODELS[m]), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Gemini API Error:", {
            status: res.status,
            model: MODELS[m],
            data
          });

          if (res.status === 429) {
            await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
            continue;
          }

          continue;
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (text) {
          responseCache.set(prompt, text);
          return text;
        }
      } catch (error) {
        console.error("Gemini fetch failed:", error);
      }
    }
  }

  return null;
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, []);
  const bg = type === 'error' ? '#ff4d3d' : type === 'warn' ? '#ff9d16' : '#34a853';
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: bg, color: '#fff', borderRadius: 16, padding: '14px 24px', fontWeight: 800, fontSize: 15, boxShadow: '0 12px 32px rgba(0,0,0,.18)', maxWidth: 420, textAlign: 'center' }}>
      {message}
    </div>
  );
}

// ─── Generic MVP Modal ────────────────────────────────────────────────────────
function MVPModal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="processing-card" style={{ textAlign: 'left', maxHeight: '80vh', overflowY: 'auto' }}>
        <button className="close" onClick={onClose}>×</button>
        <h2 style={{ marginBottom: 18, marginTop: 8 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
=======
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

>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
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
<<<<<<< HEAD
    ['🥟','float-1'],['🧾','float-2'],['🍲','float-3'],['🛍️','float-4'],
    ['🧀','float-5'],['☕','float-6'],['🍎','float-7'],['🍟','float-8'],
    ['🥤','float-9'],['🍕','float-10'],['🌶️','float-11'],['🍃','float-12'],
    ['🥭','float-13'],['🥛','float-14'],['🥗','float-15'],['🫓','float-16'],
    ['🍋','float-17'],['🥕','float-18'],
=======
    ['🥟', 'float-1'], ['🧾', 'float-2'], ['🍲', 'float-3'], ['🛍️', 'float-4'],
    ['🧀', 'float-5'], ['☕', 'float-6'], ['🍎', 'float-7'], ['🍟', 'float-8'],
    ['🥤', 'float-9'], ['🍕', 'float-10'], ['🌶️', 'float-11'], ['🍃', 'float-12'],
    ['🥭', 'float-13'], ['🥛', 'float-14'], ['🥗', 'float-15'], ['🫓', 'float-16'],
    ['🍋', 'float-17'], ['🥕', 'float-18']
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  ];
  return (
    <>
      <div className="food-orbit orbit-one"><span>🍱</span><span>🥦</span><span>🧾</span></div>
      <div className="food-orbit orbit-two"><span>🍕</span><span>🥤</span><span>🌿</span></div>
      {items.map(([emoji, cls]) => <span key={cls} className={`floating-food ${cls}`}>{emoji}</span>)}
    </>
  );
}

<<<<<<< HEAD
// ─── Nav ──────────────────────────────────────────────────────────────────────
function TopNav({ onNotif, onProfile, userName }) {
=======
function TopNav() {
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  return (
    <nav className="top-nav">
      <Logo />
      <div className="nav-links">
        <a className="active" href="#dashboard">Dashboard</a>
<<<<<<< HEAD
        <a href="#insights">Risk Insights</a>
        <a href="#foods">Food Map</a>
        <a href="#healthy-swaps">Swaps</a>
        <a href="#plan">Health Plan</a>
        <a href="#reports">Reports</a>
      </div>
      <div className="profile-area">
        <button className="icon-btn" onClick={onNotif}>🔔</button>
        <div className="avatar" onClick={onProfile} style={{ cursor: 'pointer' }}></div>
        <span>Hi, {userName?.split(' ')[0] || 'there'}</span>
=======
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
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
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
<<<<<<< HEAD
        <p>We analyse your grocery receipts, packaged foods and food delivery history to predict health risks early and help you make smarter food choices.</p>
=======
        <p>
          We analyse your grocery receipts, packaged foods and food delivery history
          to predict health risks early and help you make smarter food choices.
        </p>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
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
<<<<<<< HEAD
          <b>4.8</b><span className="stars">★★★★★</span>
=======
          <b>4.8</b>
          <span className="stars">★★★★★</span>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
        </div>
      </div>
      <div className="hero-art">
        <div className="dotted-path"></div>
        <Mascot />
      </div>
    </header>
  );
}

<<<<<<< HEAD
// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ onUpgrade }) {
  const links = [
    ['⌂','Overview',''],['♢','Health Score',''],['⌁','Risk Spectrum',''],
    ['❖','Food Blame Map',''],['♡','Healthy Swaps',''],['▣','Receipts','12'],
    ['▤','Orders','24'],['▥','Pantry','New'],['▦','Health Plan',''],
    ['☷','Reports',''],['♧','Community',''],['⚙','Settings',''],
  ];
=======
function Sidebar() {
  const links = [
    ['⌂', 'Overview', ''], ['♢', 'Health Score', ''], ['⌁', 'Risk Spectrum', ''],
    ['❖', 'Food Blame Map', ''], ['♡', 'Healthy Swaps', ''], ['▣', 'Receipts', '12'],
    ['▤', 'Orders', '24'], ['▥', 'Pantry', 'New'], ['▦', 'Health Plan', ''],
    ['☷', 'Reports', ''], ['♧', 'Community', ''], ['⚙', 'Settings', ''],
  ];

>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  return (
    <aside className="sidebar">
      <Logo />
      <div className="side-links">
        {links.map(([icon, label, badge], idx) => (
<<<<<<< HEAD
          <a key={label} className={idx === 0 ? 'selected' : ''} href={`#${label.toLowerCase().replaceAll(' ','-')}`}>
            <span>{icon}</span>{label}{badge && <b className={badge==='New'?'new':''}>{badge}</b>}
=======
          <a key={label} className={idx === 0 ? 'selected' : ''} href={`#${label.toLowerCase().replaceAll(' ', '-')}`}>
            <span>{icon}</span>{label}{badge && <b className={badge === 'New' ? 'new' : ''}>{badge}</b>}
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
          </a>
        ))}
      </div>
      <div className="pro-card">
        <strong>✦ Unlock Pro Insights</strong>
        <p>Go Premium for deeper AI insights & trends</p>
<<<<<<< HEAD
        <button onClick={onUpgrade}>Upgrade Now</button>
=======
        <button>Upgrade Now</button>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
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
<<<<<<< HEAD
      <div className="progress-line"><span className={metric.tone} style={{ width:`${metric.value}%` }}></span></div>
=======
      <div className="progress-line"><span className={metric.tone} style={{ width: `${metric.value}%` }}></span></div>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
      <small>{metric.value}/100</small>
    </div>
  );
}

<<<<<<< HEAD
function HealthScore({ score, onViewReport }) {
  const face = score >= 75 ? '😊' : score >= 55 ? '😟' : '😰';
  const label = score >= 75 ? 'Good' : score >= 55 ? 'Needs Improvement' : 'Needs Attention';
=======
function HealthScore() {
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  return (
    <div className="score-card">
      <div className="card-title">Dabba Health Score <span>ⓘ</span></div>
      <div className="score-content">
<<<<<<< HEAD
        <div className="score-ring" style={{'--score':`${score}%`}}>
          <strong>{score}</strong><span>/100</span>
        </div>
        <div>
          <div className="status-face">{face}</div>
          <h4>{label}</h4>
          <p>Small changes to your daily diet can make a big difference!</p>
          <button onClick={onViewReport}>View Full Report</button>
=======
        <div className="score-ring" style={{ '--score': '62%' }}>
          <strong>62</strong><span>/100</span>
        </div>
        <div>
          <div className="status-face">😟</div>
          <h4>Needs<br />Improvement</h4>
          <p>You're on the right track. Small changes can make a big difference!</p>
          <button>View Full Report</button>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
function RiskSpectrum({ onInsights }) {
  const zones = [
    { title:'Short-term Risk', days:'0 – 7 days', status:'Moderate', icon:'⚡', text:'High sodium & low fiber may cause bloating, fatigue, acidity, constipation, and sugar spikes.', tone:'yellow' },
    { title:'30-day Risk', days:'8 – 30 days', status:'High', icon:'📅', text:'High sugar & processed foods may impact energy, gut health, insulin response, and skin.', tone:'red' },
    { title:'Long-term Risk', days:'30+ days', status:'High', icon:'❤️', text:'Risk of weight gain, insulin resistance, heart issues, fatty liver, and lifestyle disease patterns.', tone:'purple' },
=======
function RiskSpectrum() {
  const zones = [
    { title: 'Short-term Risk', days: '0 – 7 days', status: 'Moderate', icon: '⚡', text: 'High sodium & low fiber may cause bloating, fatigue, acidity, constipation, and sugar spikes.', tone: 'yellow' },
    { title: '30-day Risk', days: '8 – 30 days', status: 'High', icon: '📅', text: 'High sugar & processed foods may impact energy, gut health, insulin response, and skin.', tone: 'red' },
    { title: 'Long-term Risk', days: '30+ days', status: 'High', icon: '❤️', text: 'Risk of weight gain, insulin resistance, heart issues, fatty liver, and lifestyle disease patterns.', tone: 'purple' },
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  ];
  return (
    <section className="risk-card" id="insights">
      <div className="section-heading">
        <div><h3>Risk Spectrum</h3><p>AI-predicted risk signals based on your current eating patterns</p></div>
<<<<<<< HEAD
        <button className="outline-purple" onClick={onInsights}>View Detailed Insights →</button>
      </div>
      <div className="timeline"><i></i><span></span><span></span><span></span></div>
      <div className="risk-zones">
        {zones.map(z => (
          <div className={`risk-zone ${z.tone}`} key={z.title}>
            <div className="zone-top"><strong>{z.title}</strong><b>{z.status}</b></div>
            <small>{z.days}</small><p>{z.text}</p><em>{z.icon}</em>
=======
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
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
          </div>
        ))}
      </div>
    </section>
  );
}

<<<<<<< HEAD
function FoodBlameMap({ blameFoods, onViewAll }) {
=======
function FoodBlameMap() {
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  return (
    <section className="blame-section" id="foods">
      <div className="section-heading">
        <div><h3>Food Blame Map</h3><p>These foods are pulling your health score down</p></div>
<<<<<<< HEAD
        <button className="green-outline" onClick={onViewAll}>View All Food Insights →</button>
      </div>
      <div className="blame-grid">
        {blameFoods.map(item => (
=======
        <button className="green-outline">View All Food Insights →</button>
      </div>
      <div className="blame-grid">
        {blameFoods.map((item) => (
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
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

<<<<<<< HEAD
function HealthySwaps({ onExplore }) {
  const [idx, setIdx] = useState(0);
  const visible = 3;
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(swaps.length - visible, i + 1));
=======
function HealthySwaps() {
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  return (
    <section className="swaps-section" id="healthy-swaps">
      <h3>Healthy Swaps For You</h3>
      <p>Delicious Indian swaps that can boost your health</p>
      <div className="swap-carousel">
<<<<<<< HEAD
        <button className="round-arrow" onClick={prev}>‹</button>
        <div className="swap-row">
          {swaps.slice(idx, idx + visible).map(([e1,f1,arrow,e2,f2]) => (
=======
        <button className="round-arrow">‹</button>
        <div className="swap-row">
          {swaps.map(([e1, f1, arrow, e2, f2]) => (
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
            <div className="swap-card" key={`${f1}-${f2}`}>
              <div><span>{e1}</span><small>{f1}</small></div>
              <b>{arrow}</b>
              <div><span>{e2}</span><small>{f2}</small></div>
            </div>
          ))}
        </div>
<<<<<<< HEAD
        <button className="round-arrow" onClick={next}>›</button>
      </div>
      <button className="explore-btn" onClick={onExplore}>⟳ Explore All Healthy Swaps</button>
=======
        <button className="round-arrow">›</button>
      </div>
      <button className="explore-btn">⟳ Explore 200+ Healthy Swaps</button>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
    </section>
  );
}

<<<<<<< HEAD
function SimulatorAndPlan({ score, onSimulate, onPlanDay }) {
  const improved = Math.min(score + 16, 100);
=======
function SimulatorAndPlan() {
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  return (
    <section className="extras-grid" id="plan">
      <div className="sim-card">
        <h3>What If You Swap These Foods?</h3>
        <div className="score-compare">
<<<<<<< HEAD
          <div><small>Current Score</small><strong>{score}</strong></div>
          <span>→</span>
          <div><small>After Swaps</small><strong>{improved}</strong></div>
        </div>
        {[
          ['Sugar Load reduced','25%','red'],['Sodium Load reduced','30%','orange'],
          ['Processed Food reduced','35%','purple'],['Fiber Score improved','20%','green'],
        ].map(([label,val,tone]) => (
          <div className="mini-progress" key={label}><span>{label}</span><b>{val}</b><i><em className={tone}></em></i></div>
        ))}
        <button className="btn primary compact" onClick={onSimulate}>Simulate Healthier Week</button>
=======
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
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
      </div>
      <div className="plan-card">
        <h3>7-Day Dabba Reset Plan</h3>
        <p>Week Progress: <b>3/7 days completed</b></p>
        <div className="week-list">
          {weeklyPlan.map((item, index) => (
<<<<<<< HEAD
            <div className={index < 3 ? 'done' : ''} key={item} onClick={() => onPlanDay(index, item)} style={{ cursor:'pointer' }}>
              <b>Day {index + 1}</b><span>{item}</span>
            </div>
=======
            <div className={index < 3 ? 'done' : ''} key={item}><b>Day {index + 1}</b><span>{item}</span></div>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
          ))}
        </div>
      </div>
    </section>
  );
}

<<<<<<< HEAD
function AnalyticsReport({ onDownloadReport, onShare, onSave }) {
  const bars = [
    ['Sugar Load Chart',78,'red'],['Sodium Load Chart',72,'orange'],['Processed Food Frequency',70,'purple'],
    ['Fiber Deficiency Meter',64,'yellow'],['Protein Balance Meter',58,'green'],['Healthy Diversity Score',54,'green'],
=======
function AnalyticsReport({ onDownloadReport }) {
  const bars = [
    ['Sugar Load Chart', 78, 'red'], ['Sodium Load Chart', 72, 'orange'], ['Processed Food Frequency', 70, 'purple'],
    ['Fiber Deficiency Meter', 64, 'yellow'], ['Protein Balance Meter', 58, 'green'], ['Healthy Diversity Score', 54, 'green'],
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  ];
  return (
    <section className="analytics-report">
      <div className="analytics-card">
        <h3>Food Pattern Analytics</h3>
        <div className="analytics-bars">
<<<<<<< HEAD
          {bars.map(([name,val,tone]) => (
            <div key={name}><span>{name}</span><i><em className={tone} style={{width:`${val}%`}}></em></i><b>{val}%</b></div>
          ))}
=======
          {bars.map(([name, val, tone]) => <div key={name}><span>{name}</span><i><em className={tone} style={{ width: `${val}%` }}></em></i><b>{val}%</b></div>)}
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
        </div>
      </div>
      <div className="report-card" id="reports">
        <h3>DabbaDoc Health Insight Report</h3>
        <ul>
<<<<<<< HEAD
          <li>Dabba Health Score</li><li>Short-Term Alerts</li>
          <li>Medium-Term Pattern Risks</li><li>Long-Term Risk Signals</li>
          <li>Top Food Contributors</li><li>Healthy Indian Swaps</li>
          <li>7-Day Dabba Reset Plan</li><li>DabbaBot AI Summary</li>
        </ul>
        <div className="report-actions">
          <button onClick={onDownloadReport}>⬇ Download Report</button>
          <button onClick={onShare}>↗ Share with Nutritionist</button>
          <button onClick={onSave}>♡ Save Analysis</button>
        </div>
=======
          <li>Dabba Health Score</li><li>Short-Term Alerts</li><li>Medium-Term Pattern Risks</li><li>Long-Term Risk Signals</li>
          <li>Top Food Contributors</li><li>Healthy Indian Swaps</li><li>7-Day Dabba Reset Plan</li><li>DabbaBot AI Summary</li>
        </ul>
        <div className="report-actions"><button onClick={onDownloadReport}>⬇ Download Report</button><button>↗ Share with Nutritionist</button><button>♡ Save Analysis</button></div>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
      </div>
    </section>
  );
}

<<<<<<< HEAD
function ImpactBanner({ onInvite }) {
=======

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
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  return (
    <section className="impact-banner">
      <div><b>💸 Save Today</b><strong>₹2,340</strong><span>On healthier swaps</span></div>
      <div><b>🌿 CO₂ Saved</b><strong>12.4 kg</strong><span>By eating better</span></div>
      <div><b>🔥 Streak</b><strong>7 Days</strong><span>Healthy logging</span></div>
<<<<<<< HEAD
      <div><b>🎁 Better Together</b><span>Invite friends & earn rewards!</span><button onClick={onInvite}>Invite Now</button></div>
=======
      <div><b>🎁 Better Together</b><span>Invite friends & earn rewards!</span><button>Invite Now</button></div>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="community">
      <div className="monuments"><span>🏛️</span><span>🕌</span><span>🏰</span><span>🛕</span></div>
      <h2>❤️ Small Swaps. Big Impact. Better You.</h2>
      <p>DabbaDoc — Your everyday food, your lifelong health.</p>
<<<<<<< HEAD
      <div className="footer-links">
        <a href="#about">About Us</a>
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
        <a href="#contact">Contact</a>
      </div>
=======
      <div className="footer-links"><a>About Us</a><a>Privacy</a><a>Terms</a><a>Contact</a></div>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
      <div className="socials"><span>📸</span><span>▶️</span><span>𝕏</span><span>in</span></div>
    </footer>
  );
}

<<<<<<< HEAD
function Dashboard({ score, metrics, blameFoods, onDownloadReport, onShare, onSave, onInsights, onViewAll, onExplore, onSimulate, onPlanDay, onViewReport, onUpgrade, onInvite }) {
  return (
    <main className="dashboard-shell" id="dashboard">
      <Sidebar onUpgrade={onUpgrade} />
=======
function Dashboard({ onDownloadReport }) {
  return (
    <main className="dashboard-shell" id="dashboard">
      <Sidebar />
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
      <div className="dashboard-content">
        <div className="dash-head">
          <div><h2>Your Dabba Health Dashboard 👋</h2><p>Analysed from 18 receipts, 24 orders & 312 unique items</p></div>
          <button className="date-btn">May 1 – May 31, 2024 📅</button>
        </div>
        <div className="score-metrics-grid">
<<<<<<< HEAD
          <HealthScore score={score} onViewReport={onViewReport} />
          <div className="metrics-grid">{metrics.map(m => <MetricCard metric={m} key={m.label} />)}</div>
        </div>
        <RiskSpectrum onInsights={onInsights} />
        <FoodBlameMap blameFoods={blameFoods} onViewAll={onViewAll} />
        <HealthySwaps onExplore={onExplore} />
        <SimulatorAndPlan score={score} onSimulate={onSimulate} onPlanDay={onPlanDay} />
        <AnalyticsReport onDownloadReport={onDownloadReport} onShare={onShare} onSave={onSave} />
        <ImpactBanner onInvite={onInvite} />
=======
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
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
      </div>
    </main>
  );
}

<<<<<<< HEAD
// ─── Processing Overlay ───────────────────────────────────────────────────────
function ProcessingOverlay({ show, onClose, steps }) {
  if (!show) return null;
  const allDone = steps.every(s => s.done);
  return (
    <div className="overlay">
      <div className="processing-card">
=======
function ProcessingOverlay({ show, onClose }) {
  if (!show) return null;
  return (
    <div className="overlay">
      <div className="processing-card">
        <button className="close" onClick={onClose}>×</button>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
        <Mascot small />
        <h2>DabbaDoc AI is analysing your food pattern</h2>
        <div className="scan-box"><div className="scan-line"></div><span>🧾</span></div>
        <ul>
<<<<<<< HEAD
          {steps.map((s, i) => (
            <li key={i} style={{ opacity: s.done ? 1 : 0.4, transition: 'opacity .3s' }}>
              {s.done ? '✅' : '⏳'} {s.label}
            </li>
          ))}
        </ul>
        {allDone && <button className="btn primary" onClick={onClose} style={{ marginTop: 18 }}>Show Dashboard →</button>}
=======
          <li>Scanning receipt...</li>
          <li>Extracting food items...</li>
          <li>Mapping Indian nutrition scores...</li>
          <li>Building short-term & long-term risk signals...</li>
          <li>Generating DabbaBot recommendations...</li>
        </ul>
        <button className="btn primary" onClick={onClose}>Show Dashboard</button>
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
      </div>
    </div>
  );
}

<<<<<<< HEAD
// ─── Upload Modal with real Gemini Vision food detection ──────────────────────
function UploadModal({ show, onClose, onUploadComplete, onToast }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | scanning | done | error | not-food
  const [fileName, setFileName] = useState('');
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg','image/png','image/webp','image/heic','application/pdf'];
    if (!allowed.includes(file.type)) {
      onToast('Please upload an image or PDF receipt.', 'warn');
      return;
    }
    setFileName(file.name);
    setStatus('scanning');
    try {
      const b64 = await fileToBase64(file);
      const mime = file.type === 'application/pdf' ? 'image/png' : file.type;
      const prompt = `Look at this image carefully.

1. Is this a food receipt, grocery bill, restaurant bill, food order, or any image containing food items/products? Answer with only YES or NO on the first line.
2. If YES, list all food items you can identify from the image, one per line, in this format:
ITEM: <item name>

If it is NOT a food receipt or does not contain food items, just answer NO and nothing else.`;
      const result = await callGeminiVision(b64, mime, prompt);
      const firstLine = result.trim().split('\n')[0].trim().toUpperCase();
      if (firstLine.includes('NO')) {
        setStatus('not-food');
        return;
      }
      // extract items
      const items = result.split('\n')
        .filter(l => l.trim().startsWith('ITEM:'))
        .map(l => l.replace('ITEM:','').trim())
        .filter(Boolean);
      setStatus('done');
      setTimeout(() => {
        onClose();
        onUploadComplete({ items, fileName: file.name });
      }, 800);
    } catch (e) {
      setStatus('error');
      onToast('Could not connect to AI. Using sample data.', 'warn');
      setTimeout(() => { onClose(); onUploadComplete({ sample: true }); }, 1200);
    }
  }

  function reset() { setStatus('idle'); setFileName(''); }

  if (!show) return null;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="upload-modal">
        <button className="close" onClick={onClose}>×</button>
        <h2>Upload Receipt or Order History</h2>
        <p>
          {status === 'not-food'
            ? '❌ No food items detected. Please upload a grocery bill, restaurant receipt, or food delivery order.'
            : status === 'scanning'
            ? '🔍 AI is scanning your receipt for food items...'
            : status === 'done'
            ? '✅ Food items found! Loading your analysis...'
            : 'Upload a receipt image — AI will detect food items and generate your health analysis.'}
        </p>
        {status === 'not-food' && (
          <button className="btn primary" onClick={reset} style={{ marginBottom: 16 }}>Try Another Image</button>
        )}
        {(status === 'idle' || status === 'not-food') && (
          <div className="upload-options">
            <div
              className={`drop-zone${dragging ? ' dragging' : ''}`}
              onClick={() => { reset(); inputRef.current.click(); }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display:'none' }}
                onChange={e => handleFile(e.target.files[0])} />
              ⇧<strong>{fileName || 'Drag & drop receipt image'}</strong>
              <span>PNG, JPG, HEIC or PDF</span>
            </div>
            <div className="drop-zone json" onClick={() => { onClose(); onUploadComplete({ sample: true }); }}>
              📊<strong>Use Sample Data</strong>
              <span>See a full demo analysis</span>
            </div>
          </div>
        )}
        {status === 'scanning' && (
          <div className="scan-box" style={{ margin: '22px 0' }}>
            <div className="scan-line"></div><span>🧾</span>
          </div>
        )}
=======
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
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
      </div>
    </div>
  );
}

<<<<<<< HEAD
function getLocalDabbaBotReply(question) {
  const q = question.toLowerCase();

  if (q.includes("sugar") || q.includes("coke") || q.includes("diabetes")) {
    return "Your sugar load is high mainly because of sugary drinks like Coke, cold coffee, desserts, and refined carbs. Try chaas, nimbu pani, coconut water, or unsweetened milk coffee instead. This is a food-risk signal, not a diagnosis. 🍋";
  }

  if (q.includes("bp") || q.includes("hypertension") || q.includes("blood pressure") || q.includes("sodium")) {
    return "Your BP risk signal is high because of high-sodium foods like Maggi, chips, pizza, fries, and packaged snacks. Try poha, upma, sprouts chaat, roasted makhana, and home-style meals. Consult a doctor for medical concerns. 🧂";
  }

  if (q.includes("maggi")) {
    return "Maggi is increasing your sodium and ultra-processed food score. Better Indian swaps are poha, vegetable upma, masala oats, dalia, or homemade sevai. Small swaps can improve your Dabba Health Score. 🍜";
  }

  if (q.includes("fatty") || q.includes("liver")) {
    return "Fatty liver risk signals can rise with frequent sugary drinks, fried foods, refined carbs, and ultra-processed meals. Reduce fries, pizza, burgers, Coke, and late-night junk food. Add dal, roti, veggies, fruits, and protein-rich meals. 🥗";
  }

  if (q.includes("7") || q.includes("plan") || q.includes("week")) {
    return "Your 7-day Dabba Reset Plan: Day 1 replace Coke with chaas, Day 2 add fruit, Day 3 replace Maggi with poha, Day 4 add protein, Day 5 avoid fried food, Day 6 add vegetables, Day 7 review your score. ✅";
  }

  if (q.includes("doctor") || q.includes("diagnosis") || q.includes("medical")) {
    return "DabbaDoc does not diagnose disease. It only gives dietary risk signals based on your food pattern. For medical decisions, always consult a certified doctor or dietitian. 🩺";
  }

  return "Your main improvement areas are sugar load, sodium load, processed food dependency, and food diversity. Start with simple swaps: Coke to chaas, Maggi to poha, fries to makhana, and pizza to paneer roti wrap. 🍱";
}
// ─── DabbaBot powered by Gemini ───────────────────────────────────────────────
function Chatbot({ score, metrics }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: "Namaste! 👋 I'm DabbaBot, your AI food health assistant! Ask me anything about your diet and health."
    },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  const SUGGESTIONS = [
    'Why is my sugar load high?',
    'Healthy lunch ideas for me',
    'Give me a 7-day plan',
    'Is Maggi bad for me?',
  ];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function askGemini(question) {
    const context = `You are DabbaBot, a friendly AI food health assistant for DabbaDoc — an Indian preventive healthcare app that analyses food receipts.

User's current health data:
- Dabba Health Score: ${score}/100
- Sugar Load: ${metrics.find(m => m.label === 'Sugar Load')?.value ?? 78}/100 (High) — from Coke, sweets, cold coffee
- Sodium Load: ${metrics.find(m => m.label === 'Sodium Load')?.value ?? 72}/100 (High) — from Maggi, chips, processed foods
- Processed Food Score: 70/100 (High)
- Fiber Score: 68/100 (Good)
- Food Diversity: 54/100 (Average)
- Main culprit foods: Coke, Maggi, Pizza, Fries, Burger, Cold Coffee

Rules:
- You are NOT a doctor. Never diagnose diseases.
- Always recommend consulting a doctor for medical concerns.
- Keep responses SHORT — max 4 sentences.
- Be warm and use Indian food context like chaas, poha, dal, sprouts, makhana, idli, upma.
- Use 1-2 emojis naturally.

User question: ${question}`;

    const raw = await callGemini(context);
    if (!raw) throw new Error('rate limited');
    return raw;
  }

  async function ask(question) {
    const q = question.trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { from: 'user', text: q }]);
    setInput('');
    setOpen(true);
    setLoading(true);

    try {
      const reply = await askGemini(q);
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          from: 'bot',
          text: 'I had a tiny connection issue, but here is a safe suggestion: reduce sugary drinks, avoid high-sodium packaged food, and choose chaas, poha, dal, sprouts, makhana, fruits, and home-style meals. 🍱'
        }
      ]);
    }

    setLoading(false);
  }

  return (
    <div className={`chatbot-compact ${open ? 'open' : ''}`}>
      {!open && (
        <button className="chatbot-fab" onClick={() => setOpen(true)}>
          <span className="fab-face">🍱</span>
          <span>Ask DabbaBot</span>
        </button>
      )}

      {open && (
        <div className="chatbot-box">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <div className="chatbot-avatar">🍱</div>
              <div>
                <strong>DabbaBot</strong>
                <span>AI Food Health Assistant</span>
              </div>
            </div>

            <button className="chatbot-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="chatbot-suggestions-inside">
            {SUGGESTIONS.map(q => (
              <button key={q} onClick={() => ask(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className="chatbot-messages">
            {messages.slice(-8).map((m, i) => (
              <div
                className={`chatbot-message ${m.from === 'user' ? 'user' : 'bot'}`}
                key={i}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className="chatbot-message bot loading">
                DabbaBot is thinking... 🤔
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form
            className="chatbot-input"
            onSubmit={e => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your food..."
              disabled={loading}
            />

            <button type="submit" disabled={loading}>
              ↗
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { label:'Scanning receipt...', done:false },
  { label:'Extracting food items...', done:false },
  { label:'Mapping Indian nutrition scores...', done:false },
  { label:'Building short & long-term risk signals...', done:false },
  { label:'Generating AI recommendations...', done:false },
];

export default function App() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [processing, setProcessing] = useState(false);
  const [upload, setUpload] = useState(false);
  const [score, setScore] = useState(62);
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [blameFoods, setBlameFoods] = useState(DEFAULT_BLAME_FOODS);
  const [steps, setSteps] = useState(DEMO_STEPS.map(s => ({...s})));
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  // ── If not logged in, show auth screen ──
  if (!user) return <Auth onAuthComplete={u => setUser(u)} />;

  function showToast(message, type='success') { setToast({ message, type }); }
  function showModal(title, body) { setModal({ title, body }); }

  function scrollToDashboard() {
    document.getElementById('dashboard')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  async function runSteps(onDone) {
    const fresh = DEMO_STEPS.map(s => ({...s, done:false}));
    setSteps(fresh);
    setProcessing(true);
    for (let i = 0; i < fresh.length; i++) {
      await new Promise(r => setTimeout(r, 380 + i * 190));
      setSteps(prev => prev.map((s, idx) => idx === i ? {...s, done:true} : s));
    }
    if (onDone) onDone();
  }

  function startDemo() { runSteps(null); }
  function handleProcessingClose() { setProcessing(false); scrollToDashboard(); }

  function handleUploadComplete({ items, fileName, sample }) {
    if (sample) { runSteps(null); return; }
    if (items && items.length > 0) {
      const unhealthy = ['coke','pizza','burger','fries','chips','maggi','noodles','biscuit','candy','chocolate','ice cream','cold coffee','soda','processed'];
      const healthy = ['dal','salad','fruit','oats','sprouts','makhana','chaas','poha','upma','idli','roti','rice','vegetable','paneer','curd'];
      let unhealthyCount = 0, healthyCount = 0;
      items.forEach(item => {
        const lower = item.toLowerCase();
        if (unhealthy.some(u => lower.includes(u))) unhealthyCount++;
        if (healthy.some(h => lower.includes(h))) healthyCount++;
      });
      const newScore = Math.max(30, Math.min(90, 62 - unhealthyCount * 4 + healthyCount * 3));
      setScore(newScore);
      showToast(`Found ${items.length} food items! Generating your analysis...`, 'success');
    }
    runSteps(null);
  }

  function downloadReport() {
    const text = `DabbaDoc Health Insight Report\n${'─'.repeat(40)}\n\nUser: ${user.name}\nDabba Health Score: ${score}/100\n\nShort-Term Alerts:\n• Sugar Spike Risk: High\n• Bloating / Sodium Retention: High\n• Low Fiber Risk: Moderate\n\nLong-Term Risk Signals:\n• Type 2 Diabetes Risk: Medium\n• Hypertension Risk: High\n• Fatty Liver Risk: Medium\n\nTop Culprit Foods:\n• Coke — high sugar\n• Maggi — high sodium + ultra processed\n• Pizza — refined carbs + sodium + fat\n• Fries — fried + processed fat\n\nRecommended Indian Swaps:\n• Coke → Chaas / Nimbu Pani\n• Maggi → Poha / Upma / Masala Oats\n• Fries → Roasted Makhana\n• Pizza → Paneer Roti Wrap\n\nDisclaimer: DabbaDoc does not diagnose, treat, or cure any medical condition.`;
    const blob = new Blob([text], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'DabbaDoc-Health-Report.txt'; a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded! 📄');
  }

  function handleShare() {
    const text = `My DabbaDoc Health Score: ${score}/100 🍱\nCheck your food health at DabbaDoc!`;
    if (navigator.share) { navigator.share({ title:'DabbaDoc Health Report', text }); }
    else { navigator.clipboard?.writeText(text); showToast('Report link copied! 📋'); }
  }

  function handleSave() { showToast('Analysis saved to your profile! ♡', 'success'); }

  function handleInsights() {
    showModal('Detailed Risk Insights', (
      <div style={{lineHeight:1.7,color:'#596171',fontWeight:700}}>
        <h4 style={{color:'#ff4d3d',marginBottom:8}}>⚡ Short-Term (0–7 days)</h4>
        <p>High sodium from Maggi & chips is causing water retention, bloating, and fatigue. Sugar spikes from Coke cause energy crashes mid-day.</p>
        <h4 style={{color:'#ff9d16',margin:'16px 0 8px'}}>📅 Medium-Term (8–30 days)</h4>
        <p>Continued high sugar & processed food impacts gut microbiome, insulin response, and skin health. Fiber-rich foods will help within 2 weeks.</p>
        <h4 style={{color:'#8c4df6',margin:'16px 0 8px'}}>❤️ Long-Term (30+ days)</h4>
        <p>Current pattern shows elevated risk signals for insulin resistance, hypertension, and non-alcoholic fatty liver. All preventable with dietary changes now.</p>
        <p style={{marginTop:16,fontSize:13,color:'#9aa0ad'}}>⚠️ These are dietary risk signals, not medical diagnoses. Consult a doctor for medical advice.</p>
      </div>
    ));
  }

  function handleViewAll() {
    showModal('All Food Insights', (
      <div>
        {DEFAULT_BLAME_FOODS.map(f => (
          <div key={f.food} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #f0e8dc'}}>
            <span style={{fontSize:36}}>{f.emoji}</span>
            <div style={{flex:1}}>
              <strong>{f.food}</strong>
              <p style={{margin:'2px 0',color:'#e03e32',fontWeight:800,fontSize:13}}>{f.risk}</p>
              <span style={{fontSize:12,color:'#34a853',fontWeight:800}}>→ Swap: {f.swap}</span>
            </div>
            <b style={{background:f.tone==='red'?'#ff4d3d':'#ff9d16',color:'#fff',borderRadius:999,padding:'4px 10px',fontSize:11}}>{f.badge}</b>
          </div>
        ))}
      </div>
    ));
  }

  function handleExplore() {
    showModal('Healthy Indian Swaps', (
      <div style={{display:'grid',gap:10}}>
        {[...swaps,
          ['🍞','White Bread','➡','🥙','Multigrain Roti'],
          ['🧃','Packaged Juice','➡','🍊','Fresh Fruit'],
          ['🍩','Donut','➡','🍌','Banana + Peanut Butter'],
          ['☕','Sugary Tea','➡','🍵','Tulsi/Green Tea'],
          ['🥫','Canned Soup','➡','🥣','Homemade Dal'],
          ['🍰','Cake','➡','🍮','Fruit Custard'],
        ].map(([e1,f1,arrow,e2,f2]) => (
          <div key={f1} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#fffaf0',borderRadius:14,border:'1px solid #efd6bb'}}>
            <span style={{fontSize:28}}>{e1}</span>
            <span style={{fontWeight:800,flex:1}}>{f1}</span>
            <span style={{color:'#34a853',fontWeight:900}}>{arrow}</span>
            <span style={{fontWeight:800,flex:1,textAlign:'right'}}>{f2}</span>
            <span style={{fontSize:28}}>{e2}</span>
          </div>
        ))}
      </div>
    ));
  }

  function handleSimulate() {
    const improved = Math.min(score + 16, 100);
    showModal('Simulated Healthier Week', (
      <div style={{lineHeight:1.7}}>
        <div style={{display:'flex',gap:24,justifyContent:'center',margin:'0 0 20px',textAlign:'center'}}>
          <div style={{background:'#fff6e6',borderRadius:16,padding:'16px 28px'}}>
            <small style={{display:'block',color:'#7a8494',fontWeight:900}}>Current Score</small>
            <strong style={{fontSize:48}}>{score}</strong>
          </div>
          <div style={{display:'grid',placeItems:'center',fontSize:28,color:'#34a853'}}>→</div>
          <div style={{background:'#eaffea',borderRadius:16,padding:'16px 28px'}}>
            <small style={{display:'block',color:'#7a8494',fontWeight:900}}>After 7 Days</small>
            <strong style={{fontSize:48}}>{improved}</strong>
          </div>
        </div>
        <ul style={{fontWeight:700,color:'#596171',lineHeight:2}}>
          <li>Replace Coke with chaas or nimbu pani</li>
          <li>Replace Maggi with poha or upma</li>
          <li>Add one portion of sprouts or dal daily</li>
          <li>Skip late-night fried snacking</li>
        </ul>
        <p style={{marginTop:12,fontSize:13,color:'#9aa0ad'}}>Simulation based on nutritional impact estimates. Actual results vary.</p>
      </div>
    ));
  }

  function handlePlanDay(idx, item) {
    const tips = [
      'Try chaas, nimbu pani, jaljeera, or coconut water instead of Coke or soda today!',
      'Add a handful of roasted chana, sprouts chaat, or a fruit as your evening snack.',
      'Swap Maggi for poha, vegetable upma, masala oats, or dalia. Takes the same time!',
      'Add a boiled egg, paneer bhurji, or moong dal to one meal today for extra protein.',
      'Kitchen closes at 9pm today! If hungry, try warm milk or a small fruit.',
      'Add a katori of salad or stir-fried sabzi to both lunch and dinner.',
      'Review your Dabba Health Score — see how this week moved the needle!',
    ];
    showModal(`Day ${idx+1} Tip`, (
      <div style={{textAlign:'center',padding:'8px 0'}}>
        <div style={{fontSize:48,marginBottom:12}}>{idx < 3 ? '✅' : '🎯'}</div>
        <h3 style={{marginBottom:12}}>{item}</h3>
        <p style={{color:'#596171',fontWeight:700,lineHeight:1.7}}>{tips[idx]}</p>
        {idx < 3 && <p style={{color:'#34a853',fontWeight:900,marginTop:12}}>Completed! Great work 🎉</p>}
      </div>
    ));
  }

  function handleViewReport() { downloadReport(); }

  function handleUpgrade() {
    showModal('DabbaDoc Pro ✦', (
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>🚀</div>
        <h3>Unlock Pro Insights</h3>
        <p style={{color:'#596171',fontWeight:700,margin:'12px 0 20px',lineHeight:1.7}}>
          Deeper AI analysis, weekly trend charts, nutritionist chat, PDF reports, and family health tracking.
        </p>
        <div style={{background:'linear-gradient(135deg,#f0e3ff,#fffdf7)',borderRadius:16,padding:16,marginBottom:16}}>
          <strong style={{fontSize:28,color:'#6c36d8'}}>₹99 / month</strong>
          <p style={{color:'#6e6090',margin:'4px 0 0',fontWeight:800}}>Cancel anytime</p>
        </div>
        <button className="btn primary" style={{width:'100%'}} onClick={() => { setModal(null); showToast('Pro plan coming soon! You\'ll be notified 🚀'); }}>
          Get Pro Access
        </button>
      </div>
    ));
  }

  function handleNotif() {
    showModal('Notifications 🔔', (
      <div style={{display:'grid',gap:12}}>
        {[
          {icon:'⚠️', text:'Your sodium intake was high today — try chaas instead of packaged drinks.', time:'2h ago'},
          {icon:'🎉', text:'7-day streak! You\'ve logged meals for 7 days in a row.', time:'1d ago'},
          {icon:'📊', text:'Your Dabba Health Score improved by 3 points this week.', time:'3d ago'},
          {icon:'🥗', text:'New swap discovered: Poha is 4x healthier than Maggi for your profile.', time:'5d ago'},
        ].map((n,i) => (
          <div key={i} style={{display:'flex',gap:12,padding:12,background:'#fffaf0',borderRadius:14,border:'1px solid #efd6bb'}}>
            <span style={{fontSize:24}}>{n.icon}</span>
            <div>
              <p style={{margin:0,fontWeight:700,fontSize:14,color:'#26272b'}}>{n.text}</p>
              <small style={{color:'#9aa0ad',fontWeight:800}}>{n.time}</small>
            </div>
          </div>
        ))}
      </div>
    ));
  }

  function handleProfile() {
    const p = user.profile;
    const bmi = p ? (p.weight / ((p.height/100) ** 2)).toFixed(1) : '—';
    showModal('Your Profile', (
      <div style={{textAlign:'center'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'radial-gradient(circle at 35% 20%,#ffd9bd,#b46636 45%,#3d1d16 47%)',margin:'0 auto 16px',border:'3px solid white',boxShadow:'0 8px 24px rgba(0,0,0,.15)'}}></div>
        <h3>{user.name}</h3>
        <p style={{color:'#7a8494',fontWeight:700,margin:'4px 0 20px'}}>{user.email}</p>
        {[
          ['Age', p?.age ? `${p.age} years` : '—'],
          ['Height', p?.height ? `${p.height} cm` : '—'],
          ['Weight', p?.weight ? `${p.weight} kg` : '—'],
          ['BMI', bmi],
          ['City', p?.city || '—'],
          ['Goal', p?.goal || '—'],
        ].map(([k,v]) => (
          <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f0e8dc',fontWeight:700}}>
            <span style={{color:'#7a8494'}}>{k}</span><span>{v}</span>
          </div>
        ))}
        <button
          style={{marginTop:20,border:'1.5px solid #ffccc8',background:'#fff5f4',color:'#c0392b',borderRadius:12,padding:'10px 20px',fontWeight:900,cursor:'pointer',width:'100%'}}
          onClick={() => { clearSession(); setUser(null); setModal(null); }}
        >
          Log Out
        </button>
      </div>
    ));
  }

  function handleInvite() {
    const msg = 'Try DabbaDoc — it analyses your food receipts to predict health risks! 🍱 Join me: https://dabbadoc.app';
    if (navigator.share) { navigator.share({ title:'Join DabbaDoc', text:msg }); }
    else { navigator.clipboard?.writeText(msg); showToast('Invite link copied! Share it with friends 🎁'); }
=======
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
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
  }

  return (
    <div className="app-frame">
<<<<<<< HEAD
      <TopNav onNotif={handleNotif} onProfile={handleProfile} userName={user.name} />
      <Hero onDemo={startDemo} onUpload={() => setUpload(true)} />
      <Dashboard
        score={score} metrics={metrics} blameFoods={blameFoods}
        onDownloadReport={downloadReport} onShare={handleShare} onSave={handleSave}
        onInsights={handleInsights} onViewAll={handleViewAll} onExplore={handleExplore}
        onSimulate={handleSimulate} onPlanDay={handlePlanDay} onViewReport={handleViewReport}
        onUpgrade={handleUpgrade} onInvite={handleInvite}
      />
      <Footer />
      <Chatbot score={score} metrics={metrics} userName={user.name} userProfile={user.profile} />
      <ProcessingOverlay show={processing} onClose={handleProcessingClose} steps={steps} />
      <UploadModal show={upload} onClose={() => setUpload(false)} onUploadComplete={handleUploadComplete} onToast={showToast} />
      {modal && (
        <MVPModal show={!!modal} onClose={() => setModal(null)} title={modal.title}>
          {modal.body}
        </MVPModal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
=======
      <TopNav />
      <Hero onDemo={startDemo} onUpload={() => setUpload(true)} />
      <Dashboard onDownloadReport={downloadReport} />
      <Footer />
      <Chatbot />
      <ProcessingOverlay show={processing} onClose={() => { setProcessing(false); scrollToDashboard(); }} />
      <UploadModal show={upload} onClose={() => setUpload(false)} />
>>>>>>> 7f4a527f1ae333281ea4a371dc2536cfa1ef6dca
    </div>
  );
}
