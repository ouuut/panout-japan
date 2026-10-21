/* japan.ouuut.com · Cabinet view (single-page mount)
 * Source: sites/cabinet/index.html
 * Redesigned layout: bottom merged zoom segment + right editorial profile panel + markLine inside labels.
 */
'use strict';

const DATA_CANDIDATES = ["./app/cabinet/data.json","../app/cabinet/data.json"];
let cabForcedBase = null;
const ECHARTS_URLS = [
  "/app/cabinet/vendor/echarts.min.js",
  "./app/cabinet/vendor/echarts.min.js",
  "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js",
  "https://unpkg.com/echarts@5.5.1/dist/echarts.min.js"
];
const THEME_MAP = { mono: "editorial", sage: "editorial", dark: "tactical", tactical: "tactical", editorial: "editorial" };

const CAB_CSS = `
#v-cabinet-viewport, .cab-viewport {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.cab-host {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
#cab-chart {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
}
/* 底部标签条：左侧按钮组，右侧对齐 slider */
.cab-bottom-bar {
  position: absolute;
  bottom: 8px;
  left: 36px;
  z-index: 8;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.cab-bottom-bar > * {
  pointer-events: auto;
}
.cab-zoom {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  padding: 2px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.cab-zoom button {
  height: 24px;
  padding: 0 9px;
  border-radius: 4px;
  background: transparent;
  color: var(--muted);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}
.cab-zoom button:hover {
  color: var(--ink);
  background: color-mix(in srgb, var(--ink) 6%, transparent);
  transform: translateY(-1px);
}
.cab-zoom button.on {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}

/* 右侧深度信息面板（类似犯罪率右侧面板） */
.cab-panel {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 310px;
  max-height: calc(100% - 64px);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
  scrollbar-width: none;
}
.cab-panel::-webkit-scrollbar { display: none; }

.cab-panel-card {
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--ink) 10%, transparent);
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.cab-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 8px;
}
.cab-card-pm {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
  line-height: 1.25;
}
.cab-card-gen {
  font-size: 11px;
  color: var(--muted);
  font-family: var(--font-mono, monospace);
  margin-top: 2px;
}
.cab-card-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.cab-card-dates {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 12px;
  letter-spacing: 0.02em;
}
.cab-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.cab-stat-box {
  background: color-mix(in srgb, var(--ink) 4%, transparent);
  border-radius: 6px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--ink) 5%, transparent);
}
.cab-stat-label {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}
.cab-stat-val {
  font-family: var(--font-mono, monospace);
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
}
.cab-stat-sub {
  font-size: 9.5px;
  color: var(--muted);
  margin-top: 2px;
  font-family: var(--font-mono, monospace);
}
.cab-card-bio {
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
  border-top: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
  padding-top: 10px;
}
.cab-card-unpin {
  margin-top: 10px;
  width: 100%;
  padding: 6px 0;
  border-radius: 6px;
  background: color-mix(in srgb, var(--ink) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  color: var(--ink);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}
.cab-card-unpin:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.cab-card-hint {
  font-size: 11px;
  color: var(--muted);
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  line-height: 1.4;
}
@media (max-width: 960px) {
  .cab-panel { display: none; }
}
`;

const CAB_PROFILES = {
  obuchi: {
    generation: { ja: "第84代内閣総理大臣", zh: "第84任内阁总理大臣", en: "84th Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "自公連立の基礎を築き「凡人」「ブッチホン」と親しまれ積極財政を主導。任期途中で脳梗塞に倒れ急逝。",
      zh: "奠定自公联合政权基础，倡导积极财政刺激经济，任内突发脑梗塞去世。",
      en: "Established the LDP-Komeito coalition and pursued fiscal expansion before tragically passing away from a stroke."
    }
  },
  mori: {
    generation: { ja: "第85・86代内閣総理大臣", zh: "第85-86任内阁总理大臣", en: "85th–86th Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "密室の後継選定批判や度重なる失言、えひめ丸事故対応で支持率が歴代最低7%台まで急落し1年で退陣。",
      zh: "密室推举上台，多次失言及宇和岛实习船事故应对受挫，支持率跌至历史最低7%台。",
      en: "Shadowed by backroom succession, public gaffes and the Ehime Maru disaster, sinking approval to a historic 7% low."
    }
  },
  koizumi: {
    generation: { ja: "第87・88・89代内閣総理大臣", zh: "第87-89任内阁总理大臣", en: "87th–89th Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "「自民党をぶっ壊す」と叫び郵政民営化を断行。発足直後85%の最高支持率を記録し、5年5か月の長期政権。",
      zh: "“砸烂自民党”力推邮政民营化。开局创历史最高85%支持率，执政长达5年5个月。",
      en: "Reformer who privatized postal services, soaring to an all-time record 85% approval and serving over 5 years."
    }
  },
  abe1: {
    generation: { ja: "第90代内閣総理大臣", zh: "第90任内阁总理大臣", en: "90th Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "戦後最年少で就任。「美しい国」を掲げ教育基本法改正を成し遂げるも、閣僚不祥事と参院選大敗で辞任。",
      zh: "战后最年轻首相。倡导“美丽国家”，后因内阁丑闻及参院选举大败，执政一年辞职。",
      en: "Youngest postwar PM who revised the Fundamental Law of Education, resigning after one year of scandals and election defeat."
    }
  },
  fukuda: {
    generation: { ja: "第91代内閣総理大臣", zh: "第91任内阁总理大臣", en: "91st Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "ねじれ国会と対峙し日中関係の改善に尽力。「あなたとは違うんです」の言葉を残し突如退陣。",
      zh: "面对扭曲国会推进中日关系回暖，后因施政受阻辞职，留下名言“我和你不一样”。",
      en: "Managed a divided parliament and warmed ties with China, abruptly stepping down with famous parting words."
    }
  },
  aso: {
    generation: { ja: "第92代内閣総理大臣", zh: "第92任内阁总理大臣", en: "92nd Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "リーマン危機へ定額給付金など迅速に対処。度重なる舌禍が響き、2009年衆院選で歴史的政権交代を許す。",
      zh: "应对雷曼危机发放全民定额补贴，但失言风波不断，最终在总选举中败北导致政权更迭。",
      en: "Responded to the 2008 global crisis with cash stimuli, but missteps led to a landslide defeat to the opposition."
    }
  },
  hatoyama: {
    generation: { ja: "第93代内閣総理大臣", zh: "第93任内阁总理大臣", en: "93rd Prime Minister" },
    party: { ja: "民主党", zh: "民主党", en: "Democratic Party of Japan" },
    bio: {
      ja: "歴史的政権交代を実現。「友愛」と脱官僚を唱えるも、米軍普天間基地移設問題の迷走で8か月で退陣。",
      zh: "实现历史性政权更迭。倡导“友爱”与脱离官僚政治，后因美军普天间基地搬迁陷入混乱执政8个月辞职。",
      en: "Led historic change of government, but faltered over relocating US Marine Base Futenma, resigning after 8 months."
    }
  },
  kan: {
    generation: { ja: "第94代内閣総理大臣", zh: "第94任内阁总理大臣", en: "94th Prime Minister" },
    party: { ja: "民主党", zh: "民主党", en: "Democratic Party of Japan" },
    bio: {
      ja: "東日本大震災と福島第一原発事故の危機管理を指揮。再生可能エネルギー特措法を成立させ退陣。",
      zh: "指挥应对东日本大地震与福岛核电站事故危机。力推可再生能源特别措施法通过后辞任。",
      en: "Commanded response to the 3/11 earthquake and nuclear meltdown; stepped down after enacting renewable energy bills."
    }
  },
  noda: {
    generation: { ja: "第95代内閣総理大臣", zh: "第95任内阁总理大臣", en: "95th Prime Minister" },
    party: { ja: "民主党", zh: "民主党", en: "Democratic Party of Japan" },
    bio: {
      ja: "「どじょう宰相」として消費増税の民自公三党合意とTPP交渉参加を主導。衆院解散で自民党に大敗。",
      zh: "自称“泥鳅首相”，推进消费税增税三党协议与TPP谈判。党首辩论后毅然解散总选，政权交还自民党。",
      en: "Passed consumption tax hike agreement and entered TPP talks; dissolved parliament leading to LDP's return."
    }
  },
  abe2: {
    generation: { ja: "第96・97・98代内閣総理大臣", zh: "第96-98任内阁总理大臣", en: "96th–98th Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "アベノミクス（三本の矢）と積極的平和主義を推進。連続在任2822日・憲政史上最長政権を樹立。",
      zh: "推行安倍经济学三支箭与积极和平主义。连续在任2822天，创下宪政史上最长执政纪录。",
      en: "Championed Abenomics and national security shifts; achieved the longest continuous premiership in Japanese history."
    }
  },
  suga: {
    generation: { ja: "第99代内閣総理大臣", zh: "第99任内阁总理大臣", en: "99th Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "携帯料金大幅値下げやデジタル庁創設を成し遂げ、コロナ禍下で東京五輪を開催。1年で総裁選不出馬。",
      zh: "力推手机资费降价与创设数字厅，克服疫情举办东京奥运会。执政一年宣布不再连任。",
      en: "Enacted mobile fee cuts and founded the Digital Agency; delivered the Tokyo Olympics during the pandemic."
    }
  },
  kishida: {
    generation: { ja: "第100・101代内閣総理大臣", zh: "第100-101任内阁总理大臣", en: "100th–101st Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "「新しい資本主義」や防衛費倍増、G7広島サミットを成功させるも、党内裏金問題を受け3年で退任。",
      zh: "提出“新资本主义”、防卫费倍增并成功举办G7广岛峰会，后受党内政治资金风波冲击退任。",
      en: "Spearheaded 'New Capitalism', doubled defense budget, hosted G7 Hiroshima, stepping down amidst party fund scrutiny."
    }
  },
  ishiba: {
    generation: { ja: "第102代内閣総理大臣", zh: "第102任内阁总理大臣", en: "102nd Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "地方創生と防災省創設を掲げ就任。衆院選で与党過半数割れの逆風に直面し少数与党政権を運営。",
      zh: "倡导地方创生与防灾立国就任首相。解散总选后面对执政党未过半困局，稳步舵手少数派内阁。",
      en: "Advocated regional revitalization and disaster ministry; navigated governing as a minority parliamentary coalition."
    }
  },
  takaichi: {
    generation: { ja: "第103代内閣総理大臣", zh: "第103任内阁总理大臣", en: "103rd Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "Liberal Democratic Party" },
    bio: {
      ja: "経済安全保障と戦略的危機管理投資を加速。「責任ある積極財政」を掲げ堅調な支持率でスタート。",
      zh: "加速推进经济安全保障与战略危机管理投资。倡导积极进取的稳健国策，高支持率开局执政。",
      en: "Drives economic security and strategic technology investments under an active fiscal and security framework."
    }
  }
};

const I18N = {
  ja: {
    htmlLang: 'ja',
    ranges: { '3m': '3ヶ月', '1y': '1年', '2y': '2年', '5y': '5年', '10y': '10年', 'all': '全期間' },
    yName: '支持率 (%)',
    months: 'か月',
    polls: '回調査',
    meanLabel: '平均支持率',
    highLabel: '最高支持率',
    lowLabel: '最低支持率',
    pollsLabel: '世論調査回数',
    overviewTitle: '14の内閣 · 331か月',
    overviewDesc: '1998年から2026年までのNHK放送文化研究所、選挙WEB、各社世論調査を月平均で集計。',
    overviewHint: '首相の区間や折線にマウスを合わせると、詳細な内閣データと経歴が表示されます。',
    unpin: '✕ 全首相の表示に戻す',
    chartFail: 'グラフライブラリの読み込みに失敗しました。'
  },
  zh: {
    htmlLang: 'zh-CN',
    ranges: { '3m': '3个月', '1y': '1年', '2y': '2年', '5y': '5年', '10y': '10年', 'all': '全期间' },
    yName: '支持率 (%)',
    months: '个月',
    polls: '次民调',
    meanLabel: '平均支持率',
    highLabel: '最高支持率',
    lowLabel: '最低支持率',
    pollsLabel: '民调统计数',
    overviewTitle: '14届内阁 · 331个月',
    overviewDesc: '1998年至2026年间NHK放送文化研究所、选举WEB及各主要媒体舆论调查月均汇总。',
    overviewHint: '鼠标悬停于首相任期或折线上，可查看该内阁的完整数据指标与执政档案。',
    unpin: '✕ 恢复全景概览',
    chartFail: '图表库加载失败，请检查网络链路。'
  },
  en: {
    htmlLang: 'en',
    ranges: { '3m': '3M', '1y': '1Y', '2y': '2Y', '5y': '5Y', '10y': '10Y', 'all': 'ALL' },
    yName: 'Approval (%)',
    months: 'months',
    polls: 'polls',
    meanLabel: 'Mean Approval',
    highLabel: 'Highest Approval',
    lowLabel: 'Lowest Approval',
    pollsLabel: 'Recorded Polls',
    overviewTitle: '14 Cabinets · 331 Mos',
    overviewDesc: 'Monthly aggregate of cabinet polls from NHK, Nikkei, Asahi, Yomiuri and Kyodo (1998–2026).',
    overviewHint: 'Hover over any cabinet segment or curve to inspect historical data and editorial profile.',
    unpin: '✕ Reset View',
    chartFail: 'Failed to load chart library.'
  }
};

const VARIANT_CHART = {
  tactical: {
    chart: {
      gridBorder: 'rgba(237,235,228,0.08)',
      pointBorder: '#0E0E0C',
      tooltipBg: 'rgba(20,20,18,0.94)',
      tooltipBorder: 'rgba(237,235,228,0.16)',
      tooltipText: '#EDEBE4',
      markLabelBg: 'rgba(14,14,12,0.85)',
      zoomBorder: 'rgba(237,235,228,0.14)',
      zoomFill: 'rgba(255,106,61,0.22)',
      zoomHandle: '#FF6A3D',
      zoomText: '#A09E96'
    },
    palette: [
      '#FF6A3D','#4E9B80','#E5A93C','#5B8FF9','#C27BA0',
      '#D95F4E','#2CA02C','#F28E2B','#76B7B2','#EDC948',
      '#B07AA1','#FF9DA7','#9C755F','#BAB0AC'
    ]
  },
  editorial: {
    chart: {
      gridBorder: 'rgba(20,26,21,0.08)',
      pointBorder: '#E9EDE3',
      tooltipBg: 'rgba(242,245,238,0.96)',
      tooltipBorder: 'rgba(20,26,21,0.14)',
      tooltipText: '#141A15',
      markLabelBg: 'rgba(233,237,227,0.88)',
      zoomBorder: 'rgba(20,26,21,0.12)',
      zoomFill: 'rgba(47,107,79,0.18)',
      zoomHandle: '#2F6B4F',
      zoomText: '#56635A'
    },
    palette: [
      '#C84B31','#2F6B4F','#D48806','#1D39C4','#722ED1',
      '#A8071A','#389E0D','#D46B08','#08979C','#096DD9',
      '#531DAB','#C41D7F','#614700','#595959'
    ]
  }
};

function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  return 'rgba(' + [(num >> 16) & 255, (num >> 8) & 255, num & 255, alpha].join(',') + ')';
}

function fmtMonth(lang, y, m) {
  const mm = (m < 10 ? '0' : '') + m;
  if (lang === 'en') return y + '-' + mm;
  return y + '年' + m + '月';
}

function detectInitialLang() {
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q && I18N[q.toLowerCase()]) return q.toLowerCase();
  const saved = localStorage.getItem('cabinet-lang');
  if (saved && I18N[saved]) return saved;
  const navs = navigator.languages || [navigator.language || ''];
  for (const l of navs) {
    const s = (l || '').toLowerCase();
    if (s.startsWith('ja')) return 'ja';
    if (s.startsWith('zh')) return 'zh';
    if (s.startsWith('en')) return 'en';
  }
  return 'ja';
}

function detectInitialVariant() {
  const q = new URLSearchParams(window.location.search).get('theme');
  if (q && THEME_MAP[q]) return THEME_MAP[q];
  const dt = document.documentElement.dataset.theme;
  if (dt && THEME_MAP[dt]) return THEME_MAP[dt];
  return 'tactical';
}

let currentLang = 'ja';
let currentVariant = 'tactical';
let rawData = null;
let chart = null;
let hostEl = null;
let panelEl = null;
let zoomEl = null;
let activeRange = '10y';
let focusCabinet = null;
let activeHoverCab = null;
let cabStats = {};
let bootToken = 0;
let mounted = false;
let isInitialAnimating = true;
let resizeRaf = null;

const RANGES = [
  { id: '3m' }, { id: '1y' }, { id: '2y' },
  { id: '5y' }, { id: '10y' }, { id: 'all' }
];
const RANGE_WINDOW_MONTHS = { '3m': 3, '1y': 12, '2y': 24, '5y': 60, '10y': 120, 'all': 0 };

function tchart() { return VARIANT_CHART[currentVariant].chart; }
function cabColors() { return VARIANT_CHART[currentVariant].palette; }

function injectCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('cab-style')) return;
  const st = document.createElement('style');
  st.id = 'cab-style';
  st.textContent = CAB_CSS;
  document.head.appendChild(st);
}

function onCabResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    if (!chart) return;
    if (isInitialAnimating) return;
    try { chart.resize(); } catch (e) {}
  });
}

function dismissVeil() {
  try {
    const stage = hostEl ? hostEl.closest('.stage-cabinet') : document.querySelector('.stage-cabinet');
    const veil = (stage && stage.querySelector('#cab-app-veil')) || document.getElementById('cab-app-veil');
    if (veil) {
      veil.classList.add('fade-out');
      setTimeout(() => {
        try { if (veil.parentNode) veil.parentNode.removeChild(veil); } catch (e) {}
      }, 750);
    }
  } catch (e) {}
}

function computeStats() {
  if (!rawData) return;
  const polls = rawData.polls;
  const cabinets = rawData.cabinets;
  const buckets = {};
  polls.forEach(p => {
    if (p.derived) return;
    const cab = pmByDate(p.date);
    const ym = p.date.slice(0, 7);
    const key = cab.id + '|' + ym;
    if (!buckets[key]) buckets[key] = { cab, ym, sums: 0, n: 0 };
    buckets[key].sums += p.value;
    buckets[key].n += 1;
  });

  cabStats = {};
  cabinets.forEach((c, idx) => {
    const cBuckets = Object.keys(buckets).map(k => buckets[k]).filter(b => b.cab.id === c.id);
    if (cBuckets.length > 0) {
      let high = -1, highYM = '';
      let low = 999, lowYM = '';
      let sum = 0, totalPolls = 0;
      cBuckets.forEach(b => {
        const v = b.sums / b.n;
        sum += v;
        totalPolls += b.n;
        if (v > high) { high = v; highYM = b.ym; }
        if (v < low) { low = v; lowYM = b.ym; }
      });
      cabStats[c.id] = {
        pm: c.pm,
        idx,
        color: cabColors()[idx % cabColors().length],
        start: c.start,
        end: c.end,
        months: cBuckets.length,
        mean: Math.round((sum / cBuckets.length) * 10) / 10,
        high: Math.round(high * 10) / 10,
        highYM,
        low: Math.round(low * 10) / 10,
        lowYM,
        polls: totalPolls
      };
    }
  });
}

function renderZoomSeg() {
  if (!zoomEl) return;
  const t = I18N[currentLang] || I18N.ja;
  zoomEl.innerHTML = '';
  RANGES.forEach(r => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t.ranges[r.id];
    b.classList.toggle('on', r.id === activeRange);
    b.addEventListener('click', () => {
      activeRange = r.id;
      focusCabinet = null;
      renderZoomSeg();
      renderPanel(null);
      renderChart();
    });
    zoomEl.appendChild(b);
  });
}

function renderPanel(targetCabId) {
  if (!panelEl || !rawData) return;
  const t = I18N[currentLang] || I18N.ja;
  const langKey = currentLang;

  const cabId = targetCabId || focusCabinet;
  if (!cabId || !cabStats[cabId]) {
    const totalPolls = rawData.polls.length;
    const allMeans = Object.values(cabStats).map(s => s.mean);
    const avgAll = allMeans.length ? (Math.round((allMeans.reduce((a, b) => a + b, 0) / allMeans.length) * 10) / 10) : 41.2;
    panelEl.innerHTML = `
      <div class="cab-panel-card">
        <div class="cab-card-header">
          <div>
            <div class="cab-card-pm">${t.overviewTitle}</div>
            <div class="cab-card-gen">1998.07 — 2026.10</div>
          </div>
          <span class="cab-card-badge" style="background:var(--accent);color:#fff">OVERVIEW</span>
        </div>
        <div class="cab-stats-grid">
          <div class="cab-stat-box">
            <div class="cab-stat-label">${t.meanLabel}</div>
            <div class="cab-stat-val">${avgAll}%</div>
            <div class="cab-stat-sub">14内閣全体平均</div>
          </div>
          <div class="cab-stat-box">
            <div class="cab-stat-label">${t.pollsLabel}</div>
            <div class="cab-stat-val">${totalPolls}</div>
            <div class="cab-stat-sub">644回一次調査</div>
          </div>
          <div class="cab-stat-box">
            <div class="cab-stat-label">${t.highLabel}</div>
            <div class="cab-stat-val" style="color:#2F6B4F">85.2%</div>
            <div class="cab-stat-sub">小泉純一郎 (2001)</div>
          </div>
          <div class="cab-stat-box">
            <div class="cab-stat-label">${t.lowLabel}</div>
            <div class="cab-stat-val" style="color:#C84B31">7.0%</div>
            <div class="cab-stat-sub">森喜朗 (2001)</div>
          </div>
        </div>
        <div class="cab-card-bio">${t.overviewDesc}</div>
        <div class="cab-card-hint">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="flex-shrink:0"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4M8 5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>${t.overviewHint}</span>
        </div>
      </div>
    `;
    return;
  }

  const s = cabStats[cabId];
  const p = CAB_PROFILES[cabId] || {
    generation: { ja: "内閣総理大臣", zh: "内阁总理大臣", en: "Prime Minister" },
    party: { ja: "自由民主党", zh: "自由民主党", en: "LDP" },
    bio: { ja: "", zh: "", en: "" }
  };
  const color = s.color || '#FF6A3D';
  const genStr = p.generation[langKey] || p.generation.ja;
  const partyStr = p.party[langKey] || p.party.ja;
  const bioStr = p.bio[langKey] || p.bio.ja;
  const isPinned = focusCabinet === cabId;

  panelEl.innerHTML = `
    <div class="cab-panel-card">
      <div class="cab-card-header">
        <div>
          <div class="cab-card-pm" style="color:${color}">${s.pm}</div>
          <div class="cab-card-gen">${genStr} · ${partyStr}</div>
        </div>
        <span class="cab-card-badge" style="background:${hexToRgba(color, 0.15)};color:${color};border:1px solid ${hexToRgba(color, 0.35)}">
          ${isPinned ? 'PINNED' : 'CABINET'}
        </span>
      </div>
      <div class="cab-card-dates">
        ${s.start.slice(0, 7)} — ${s.end.slice(0, 7)} (${s.months}${t.months})
      </div>
      <div class="cab-stats-grid">
        <div class="cab-stat-box">
          <div class="cab-stat-label">${t.meanLabel}</div>
          <div class="cab-stat-val" style="color:${color}">${s.mean}%</div>
          <div class="cab-stat-sub">${s.polls} ${t.polls}</div>
        </div>
        <div class="cab-stat-box">
          <div class="cab-stat-label">${t.highLabel}</div>
          <div class="cab-stat-val" style="color:#2F6B4F">${s.high}%</div>
          <div class="cab-stat-sub">${s.highYM}</div>
        </div>
        <div class="cab-stat-box">
          <div class="cab-stat-label">${t.lowLabel}</div>
          <div class="cab-stat-val" style="color:#C84B31">${s.low}%</div>
          <div class="cab-stat-sub">${s.lowYM}</div>
        </div>
        <div class="cab-stat-box">
          <div class="cab-stat-label">${t.pollsLabel}</div>
          <div class="cab-stat-val">${s.polls}</div>
          <div class="cab-stat-sub">NHK/日経/朝日各社</div>
        </div>
      </div>
      <div class="cab-card-bio">${bioStr}</div>
      ${isPinned ? `<button type="button" class="cab-card-unpin" id="cab-unpin-btn">${t.unpin}</button>` : ''}
    </div>
  `;

  if (isPinned) {
    const unpinBtn = panelEl.querySelector('#cab-unpin-btn');
    if (unpinBtn) {
      unpinBtn.addEventListener('click', () => {
        focusCabinet = null;
        activeHoverCab = null;
        renderPanel(null);
        renderChart();
      });
    }
  }
}

function pmByDate(dateStr) {
  if (!rawData || !rawData.cabinets) return null;
  const d = new Date(dateStr);
  for (let i = rawData.cabinets.length - 1; i >= 0; i--) {
    if (d >= new Date(rawData.cabinets[i].start)) return rawData.cabinets[i];
  }
  return rawData.cabinets[0];
}

function renderChart() {
  if (!window.echarts || !rawData) return;
  const t = I18N[currentLang] || I18N.ja;
  const chartBox = hostEl ? hostEl.querySelector('#cab-chart') : document.getElementById('cab-chart');
  if (!chartBox) return;
  if (!chart) chart = echarts.init(chartBox, null, { renderer: 'canvas' });

  const polls = rawData.polls;
  const cabinets = rawData.cabinets;
  const C = cabColors();
  const T = tchart();
  const isNarrow = window.innerWidth <= 960;
  const gridL = isNarrow ? 36 : 48;
  const gridR = isNarrow ? 20 : 344;

  const buckets = {};
  polls.forEach(p => {
    if (p.derived) return;
    const cab = pmByDate(p.date);
    const ym = p.date.slice(0, 7);
    const key = cab.id + '|' + ym;
    if (!buckets[key]) buckets[key] = { cab, ym, sums: 0, n: 0, sources: [] };
    buckets[key].sums += p.value;
    buckets[key].n += 1;
    buckets[key].sources.push({ src: p.source, v: p.value, kind: p.kind || '' });
  });

  const markAreaData = cabinets.map((c, idx) => {
    const isEven = idx % 2 === 0;
    const bg = isEven
      ? (currentVariant === 'editorial' ? 'rgba(0,0,0,0.026)' : 'rgba(255,255,255,0.026)')
      : 'transparent';
    return [
      { xAxis: c.start, itemStyle: { color: bg } },
      { xAxis: c.end }
    ];
  });

  const series = [];
  cabinets.forEach((c, i) => {
    const color = C[i % C.length];
    const points = [];
    Object.keys(buckets).sort().forEach(key => {
      const rec = buckets[key];
      if (rec.cab.id !== c.id) return;
      const d = rec.ym + '-15';
      const avg = Math.round((rec.sums / rec.n) * 10) / 10;
      points.push([d, avg, rec.n, rec.sources]);
    });

    if (points.length > 0) {
      const focused = focusCabinet === c.id;
      series.push({
        name: c.pm,
        type: 'line',
        data: points,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: focused ? 8 : 5,
        smooth: 0.15,
        connectNulls: false,
        lineStyle: {
          color: color,
          width: focused ? 3.5 : 2.2,
          type: 'solid',
          opacity: focusCabinet ? (focused ? 1 : 0.18) : 0.95,
          shadowBlur: currentVariant === 'tactical' ? (focused ? 10 : 4) : 0,
          shadowColor: currentVariant === 'tactical' ? hexToRgba(color, 0.45) : 'transparent'
        },
        itemStyle: {
          color: color,
          borderColor: T.pointBorder,
          borderWidth: 1.5,
          opacity: focusCabinet ? (focused ? 1 : 0.18) : 1
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, currentVariant === 'editorial' ? 0.20 : 0.24) },
            { offset: 0.85, color: hexToRgba(color, 0.02) },
            { offset: 1, color: hexToRgba(color, 0.0) }
          ]),
          opacity: focusCabinet ? (focused ? 1 : 0.04) : 0.85
        },
        emphasis: { focus: 'series', scale: 1.5 },
        z: focused ? 6 : 3,
        markArea: i === 0 ? {
          silent: true,
          data: markAreaData
        } : undefined,
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          lineStyle: {
            color: currentVariant === 'editorial' ? 'rgba(23,33,26,0.18)' : 'rgba(237,235,228,0.16)',
            type: 'dashed',
            width: focused ? 2.5 : 1.2,
            opacity: focusCabinet ? (focused ? 0.95 : 0.15) : 0.65
          },
          data: [
            [
              { coord: [c.start, 0], symbol: 'none' },
              {
                coord: [c.start, 88],
                symbol: 'none',
                label: {
                  show: true,
                  position: 'end',
                  distance: 10,
                  align: 'left',
                  formatter: String(c.pm),
                  fontSize: isNarrow ? 11.5 : 14,
                  fontWeight: 700,
                  color: color,
                  fontFamily: 'var(--ja-sans), system-ui, sans-serif',
                  padding: [2, 6],
                  backgroundColor: currentVariant === 'editorial' ? 'rgba(233,237,227,0.88)' : 'rgba(14,14,12,0.88)',
                  borderRadius: 4
                }
              }
            ],
            [
              { coord: [c.start, 88], symbol: 'none' },
              { coord: [c.start, 100], symbol: 'none' }
            ]
          ]
        }
      });
    }
  });

  const allDates = polls.map(p => p.date).sort();
  const startDate = allDates[0];
  const endDate = allDates[allDates.length - 1];
  const bucketDates = Object.values(buckets).map(r => r.ym + '-15').sort();
  const lastBucket = bucketDates[bucketDates.length - 1];
  const axisMaxTime = Math.max(new Date(endDate).getTime(), new Date(lastBucket).getTime()) + 18 * 86400000;
  const axisMaxISO = new Date(axisMaxTime).toISOString().slice(0, 10);

  const wMonths = RANGE_WINDOW_MONTHS[activeRange];
  let zoomStart = 0;
  if (wMonths > 0) {
    const spanMs = new Date(endDate) - new Date(startDate);
    const winMs = wMonths * 30.44 * 86400000;
    zoomStart = Math.max(0, Math.round((1 - winMs / spanMs) * 1000) / 10);
  }

  const focusCab = focusCabinet ? rawData.cabinets.find(c => c.id === focusCabinet) : null;
  let focusWindow = null;
  if (focusCab && wMonths > 0) {
    const winMs = wMonths * 30.44 * 86400000;
    const tMin = new Date(startDate).getTime();
    const tMax = new Date(endDate).getTime();
    const cStart = new Date(focusCab.start).getTime();
    const cEnd = new Date(focusCab.end).getTime();
    const center = (cStart + cEnd) / 2;
    let ws = center - winMs / 2;
    let we = center + winMs / 2;
    if (ws < tMin) { ws = tMin; we = tMin + winMs; }
    if (we > tMax) { we = tMax; ws = tMax - winMs; }
    focusWindow = { startValue: new Date(ws), endValue: new Date(we) };
  }

  // 底部长条 slider：左侧留出标签按钮空间 (366px)，右侧留出面板空间 (344px)！
  const sliderDZ = {
    type: 'slider', xAxisIndex: 0,
    left: isNarrow ? 36 : 366,
    right: gridR,
    height: 24, bottom: 8,
    borderRadius: 6,
    borderColor: T.zoomBorder,
    backgroundColor: T.zoomFill,
    fillerColor: T.zoomFill,
    handleSize: 14,
    brushSelect: false,
    dataBackground: { lineStyle: { color: 'rgba(0,0,0,0)' }, areaStyle: { color: 'rgba(0,0,0,0)' } },
    selectedDataBackground: { lineStyle: { color: 'rgba(0,0,0,0)' }, areaStyle: { color: 'rgba(0,0,0,0)' } },
    moveHandleSize: 0,
    handleIcon: 'path://M-8,-9h16a4,4 0 0 1 4,4v10a4,4 0 0 1 -4,4h-16a4,4 0 0 1 -4,-4v-10a4,4 0 0 1 4,-4z',
    handleStyle: {
      color: T.zoomHandle, borderColor: 'rgba(0,0,0,0.28)', borderWidth: 1,
      shadowBlur: 5, shadowColor: 'rgba(0,0,0,0.35)', shadowOffsetY: 1.5
    },
    emphasis: { handleStyle: { color: T.zoomHandle, borderColor: T.zoomHandle, shadowBlur: 7 } },
    textStyle: { color: T.zoomText, fontSize: 10 }
  };
  if (focusWindow) {
    sliderDZ.startValue = focusWindow.startValue;
    sliderDZ.endValue = focusWindow.endValue;
  } else {
    sliderDZ.start = zoomStart;
    sliderDZ.end = 100;
  }

  const lang = currentLang;
  const option = {
    backgroundColor: 'transparent',
    grid: { left: gridL, right: gridR, top: 28, bottom: 54, borderColor: T.gridBorder },
    legend: { show: false },
    tooltip: {
      trigger: 'axis',
      backgroundColor: T.tooltipBg,
      borderColor: T.tooltipBorder,
      borderWidth: 1,
      padding: [10, 14],
      extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.18);backdrop-filter:blur(8px);',
      textStyle: { color: T.tooltipText, fontSize: 12 },
      formatter: function(params) {
        if (!params || params.length === 0) return '';
        const d = new Date(params[0].axisValue);
        const cab = pmByDate(params[0].axisValue);
        const ymStr = fmtMonth(lang, d.getFullYear(), d.getMonth() + 1);
        const p = params[0];
        const avg = p.data ? p.data[1] : null;
        const n = p.data ? p.data[2] : 0;
        const sources = p.data ? (p.data[3] || []) : [];
        const cabIdx = cab ? cabinets.findIndex(x => x.id === cab.id) : 0;
        const col = C[cabIdx % C.length] || '#FF6A3D';
        let html = '<div style="min-width:180px;font-family:var(--font-sans),system-ui,sans-serif">';
        html += '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px">';
        html += '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + col + ';box-shadow:0 0 6px ' + hexToRgba(col, 0.6) + '"></span>';
        html += '<span style="font-weight:700;font-size:13px;color:' + T.tooltipText + '">' + (cab ? cab.pm : '') + '</span>';
        html += '<span style="color:' + (currentVariant === 'editorial' ? '#56635A' : '#A09E96') + ';font-size:11px;margin-left:auto">' + ymStr + '</span>';
        html += '</div>';
        if (avg !== null) {
          html += '<div style="display:flex;align-items:baseline;gap:6px;margin:4px 0 8px">';
          html += '<span style="font-size:22px;font-weight:800;color:' + col + ';font-family:var(--font-mono,monospace)">' + avg.toFixed(1) + '%</span>';
          html += '<span style="font-size:11px;color:' + (currentVariant === 'editorial' ? '#56635A' : '#A09E96') + '">' + n + '社平均</span>';
          html += '</div>';
        }
        if (sources.length > 0) {
          html += '<div style="display:flex;flex-wrap:wrap;gap:4px;border-top:1px solid ' + (currentVariant === 'editorial' ? 'rgba(20,26,21,0.1)' : 'rgba(237,235,228,0.12)') + ';padding-top:6px;margin-top:4px">';
          sources.forEach(function(s) {
            html += '<span style="font-size:10.5px;padding:1px 6px;border-radius:3px;background:' + (currentVariant === 'editorial' ? 'rgba(20,26,21,0.06)' : 'rgba(237,235,228,0.08)') + ';color:' + (currentVariant === 'editorial' ? '#2b382d' : '#d2cfc4') + '">';
            html += s.src + ' <b style="color:' + col + '">' + s.v.toFixed(1) + '%</b>';
            html += '</span>';
          });
          html += '</div>';
        }
        html += '</div>';
        return html;
      }
    },
    xAxis: {
      type: 'time', min: startDate, max: axisMaxISO,
      axisLine: { lineStyle: { color: T.gridBorder } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        color: currentVariant === 'editorial' ? '#56635A' : '#A09E96',
        fontSize: 10.5,
        formatter: function(val) {
          const d = new Date(val);
          return String(d.getFullYear());
        }
      }
    },
    yAxis: {
      type: 'value', min: 0, max: 100, interval: 20,
      name: t.yName,
      nameTextStyle: { color: currentVariant === 'editorial' ? '#56635A' : '#A09E96', fontSize: 10.5, padding: [0, 0, 4, 0] },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: T.gridBorder, type: 'dashed' } },
      axisLabel: {
        color: currentVariant === 'editorial' ? '#56635A' : '#A09E96',
        fontSize: 10.5,
        formatter: function(val) { return val + '%'; }
      }
    },
    dataZoom: [
      sliderDZ,
      {
        type: 'inside', xAxisIndex: 0,
        start: focusWindow ? undefined : zoomStart,
        end: focusWindow ? undefined : 100,
        startValue: focusWindow ? focusWindow.startValue : undefined,
        endValue: focusWindow ? focusWindow.endValue : undefined,
        zoomOnMouseWheel: 'shift', moveOnMouseWheel: true
      }
    ],
    animation: true,
    animationDuration: 1100,
    animationDurationUpdate: 650,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicOut',
    series: series
  };

  chart.setOption(option, true);

  // 鼠标交互：更新右侧深度面板
  chart.off('updateAxisPointer');
  chart.on('updateAxisPointer', (event) => {
    if (!event.axesInfo || !event.axesInfo[0]) return;
    const val = event.axesInfo[0].value;
    const cab = pmByDate(val);
    if (cab && cab.id !== activeHoverCab) {
      activeHoverCab = cab.id;
      renderPanel(cab.id);
    }
  });

  chart.getZr().off('globalout');
  chart.getZr().on('globalout', () => {
    activeHoverCab = null;
    renderPanel(focusCabinet || null);
  });

  chart.off('click');
  chart.on('click', (params) => {
    if (params.seriesName) {
      const cab = rawData.cabinets.find(c => c.pm === params.seriesName);
      if (cab) {
        focusCabinet = (focusCabinet === cab.id) ? null : cab.id;
        renderPanel(focusCabinet);
        renderChart();
      }
    }
  });
}

async function boot(token) {
  try {
    await ensureEcharts();
  } catch (e) {
    const t = I18N[currentLang] || I18N.ja;
    console.error('echarts load failed', e);
    return null;
  }
  if (!rawData) {
    let lastErr = null;
    const dataList = cabForcedBase ? [cabForcedBase + 'app/cabinet/data.json'] : DATA_CANDIDATES;
    for (const u of dataList) {
      try {
        const resp = await fetch(u);
        if (!resp.ok) throw new Error('http ' + resp.status);
        rawData = await resp.json();
        lastErr = null;
        break;
      } catch (e) { lastErr = e; }
    }
    if (!rawData) {
      console.error('data.json load failed', lastErr);
      return null;
    }
  }
  if (token !== bootToken || !mounted) return null;
  computeStats();
  renderZoomSeg();
  renderPanel(focusCabinet || null);
  renderChart();

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (hostEl) hostEl.classList.remove('cab-init-hidden');
        dismissVeil();
        setTimeout(() => {
          isInitialAnimating = false;
          if (chart) try { chart.resize(); } catch (e) {}
        }, 1250);
      });
    });
  } else {
    if (hostEl) hostEl.classList.remove('cab-init-hidden');
    dismissVeil();
  }
  return true;
}

function ensureEcharts() {
  const g = (typeof window !== 'undefined') ? window : globalThis;
  if (g.echarts) return Promise.resolve(g.echarts);
  const viaImport = async () => {
    for (const u of ECHARTS_URLS) {
      try { await import(/* @vite-ignore */u); if (g.echarts) return g.echarts; } catch (e) {}
    }
    throw new Error('echarts import failed');
  };
  const viaScript = () => new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('echarts: no dom'));
    const libs = ECHARTS_URLS.slice();
    const next = () => {
      const u = libs.shift();
      if (!u) return reject(new Error('echarts CDN failed'));
      const s = document.createElement('script');
      s.src = u; s.async = true;
      s.onload = () => { if (g.echarts) resolve(g.echarts); else { try { s.remove(); } catch (e) {} next(); } };
      s.onerror = () => { try { s.remove(); } catch (e) {} next(); };
      document.head.appendChild(s);
    };
    next();
  });
  return viaImport().catch(viaScript);
}

function mountCabinet(root, opts) {
  opts = opts || {};
  if (opts.base) cabForcedBase = opts.base;
  if (mounted) unmountCabinet();
  const host = typeof root === 'string' ? document.querySelector(root) : root;
  if (!host) throw new Error('cab: mount root missing');
  hostEl = host;
  host.classList.add('cab-host');
  host.classList.add('cab-init-hidden');
  isInitialAnimating = true;
  injectCss();

  const viewport = host.querySelector('#v-cabinet-viewport') || host.querySelector('.stage') || host;
  viewport.innerHTML = '';
  viewport.classList.add('cab-viewport');

  // 1. 图表容器
  const box = document.createElement('div');
  box.id = 'cab-chart';
  viewport.appendChild(box);

  // 2. 右侧深度信息面板（类似犯罪率右侧面板）
  const panel = document.createElement('div');
  panel.className = 'cab-panel';
  panel.id = 'cab-panel';
  viewport.appendChild(panel);
  panelEl = panel;

  // 3. 底部工具栏（左侧标签按钮，右侧 ECharts slider 自然贴合）
  const bottomBar = document.createElement('div');
  bottomBar.className = 'cab-bottom-bar';
  const zoom = document.createElement('div');
  zoom.className = 'cab-zoom';
  zoom.id = 'cab-zoom';
  bottomBar.appendChild(zoom);
  viewport.appendChild(bottomBar);
  zoomEl = zoom;

  currentLang = (opts.lang && I18N[opts.lang]) ? opts.lang : detectInitialLang();
  currentVariant = (opts.theme && THEME_MAP[opts.theme]) ? THEME_MAP[opts.theme] : detectInitialVariant();

  mounted = true;
  const token = ++bootToken;
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', onCabResize);
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => onCabResize());
    try { ro.observe(box); } catch (e) {}
  }
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => onCabResize());
  return boot(token);
}

let ro = null;

function unmountCabinet() {
  bootToken++;
  mounted = false;
  if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('resize', onCabResize);
  if (ro) { try { ro.disconnect(); } catch (e) {} ro = null; }
  if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = null; }
  isInitialAnimating = false;
  if (chart) { try { chart.dispose(); } catch (e) {} chart = null; }
  if (hostEl) {
    try {
      const vp = hostEl.querySelector('.cab-viewport');
      if (vp) vp.innerHTML = '';
    } catch (e) {}
  }
  panelEl = null;
  zoomEl = null;
}

function setCabinetLang(lang) {
  if (!I18N[lang]) return false;
  currentLang = lang;
  if (!rawData) return true;
  renderZoomSeg();
  renderPanel(focusCabinet || null);
  renderChart();
  return true;
}

function setCabinetTheme(t) {
  const id = THEME_MAP[t] || 'tactical';
  currentVariant = id;
  if (chart && rawData) {
    computeStats();
    renderPanel(focusCabinet || null);
    renderChart();
  }
  return id;
}

function setCabinetRange(id) {
  if (!RANGE_WINDOW_MONTHS.hasOwnProperty(id)) return false;
  activeRange = id;
  focusCabinet = null;
  if (!rawData) return true;
  renderZoomSeg();
  renderPanel(null);
  renderChart();
  return true;
}

function getCabinetSummary() {
  return rawData ? { cabinets: rawData.cabinets.length, polls: rawData.polls.length } : null;
}

export { mountCabinet, unmountCabinet, setCabinetLang, setCabinetTheme, setCabinetRange, getCabinetSummary };
