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
  font-family: var(--font-sans, system-ui);
  font-size: 12px;
  font-weight: 350;
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
  font-weight: 350;
}

/* 右侧深度信息面板（类似犯罪率右侧面板） */
.cab-panel {
  position: absolute;
  top: 14px;
  right: 18px;
  width: 360px;
  height: calc(100% - 56px);
  max-height: calc(100% - 56px);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 24px;
  pointer-events: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  font-family: var(--font-sans, "MiSans VF", "MiSans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif);
}
.cab-panel::-webkit-scrollbar { width: 0; height: 0; display: none; }

.cab-panel .panel-card {
  flex-shrink: 0;
  background: var(--bg-card, rgba(233, 237, 227, 0.88));
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border: 1px solid var(--line-main, rgba(20, 26, 21, 0.12));
  border-radius: 8px;
  padding: 16px 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  color: var(--ink);
  transition: all 0.2s ease;
}
.cab-panel .card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.cab-panel .card-title {
  margin: 0;
  font-size: 22px;
  font-weight: 250;
  line-height: 1.25;
  color: var(--ink);
  letter-spacing: -0.3px;
  font-family: var(--font-sans, "MiSans VF", "MiSans", system-ui, sans-serif);
}
.cab-panel .card-subtitle {
  font-size: 12.5px;
  color: var(--muted);
  font-weight: 350;
  margin-top: 4px;
  line-height: 1.45;
}
.cab-panel .card-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.5px;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}
.cab-panel .stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 14px 0 10px 0;
}
.cab-panel .stat-box {
  background: var(--bg-subcard, rgba(0, 0, 0, 0.035));
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid var(--line-subcard, rgba(0, 0, 0, 0.04));
}
.cab-panel .stat-num {
  font-size: 32px;
  font-weight: 200;
  line-height: 1.05;
  letter-spacing: -0.8px;
  color: var(--ink);
  font-family: var(--font-sans, "MiSans VF", "MiSans", system-ui, sans-serif);
}
.cab-panel .stat-label {
  font-size: 11px;
  color: var(--muted);
  margin-top: 5px;
  font-weight: 350;
}
.cab-panel .policy-item {
  margin-bottom: 11px;
  padding-left: 10px;
  border-left: 2.5px solid var(--accent, #FF6A3D);
}
.cab-panel .policy-item:last-child {
  margin-bottom: 0;
}
.cab-panel .policy-title {
  font-size: 14.5px;
  font-weight: 300;
  color: var(--ink);
  margin-bottom: 2px;
}
.cab-panel .policy-desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
  font-weight: 350;
}
.cab-panel .back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  padding: 7px 14px;
  border-radius: 4px;
  border: 1px solid var(--line-main, rgba(20, 26, 21, 0.15));
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
}
.cab-panel .back-btn:hover {
  background: var(--accent, #FF6A3D);
  color: #fff;
  border-color: var(--accent, #FF6A3D);
}
@media (max-width: 960px) {
  .cab-panel { display: none; }
}
`;

const CAB_PROFILES = {
  "obuchi": {
    "id": "obuchi",
    "nameZh": "小渊惠三",
    "nameJa": "小渕恵三",
    "nameEn": "Keizo Obuchi",
    "eraNumberZh": "第84任内阁总理大臣",
    "eraNumberJa": "第84代内閣総理大臣",
    "eraNumberEn": "84th Prime Minister of Japan",
    "partyZh": "自由民主党（平成研究会 / 竹下派）",
    "partyJa": "自由民主党（平成研究会・竹下派）",
    "partyEn": "Liberal Democratic Party (Heisei Kenkyukai)",
    "period": "1998-07-30 — 2000-04-05",
    "months": 20,
    "days": 616,
    "trendBadgeZh": "稳步回升 · 突发脑梗",
    "trendBadgeJa": "支持率回復・病に倒れる",
    "trendBadgeEn": "Gradual Recovery · Sudden Collapse",
    "originZh": "群马县吾妻郡中之条町 · 早稻田大学大学院政治学研究科",
    "originJa": "群馬県中之条町出身・早稲田大学大学院政治学研究科",
    "originEn": "Gunma Pref. · Waseda University Graduate School",
    "bioZh": "早年作为官房长官公布“平成”年号，被民众亲切称为“平成大叔”。就任初期因缺乏领袖光芒被外媒嘲弄为“冷披萨”、“凡人首相”，但凭借极度诚恳的人格魅力与勤勉作风，广泛打电话联络各界人士（“电话魔”），支持率逆势大幅反弹。",
    "bioJa": "官房長官時代に「平成」の新元号を発表し「平成おじさん」として親しまれる。就任当初は「冷めたピザ」「凡人」と揶揄されるも、「ブッチホン」と呼ばれる電話攻勢と誠実な人柄で世論を味方につけ、支持率を大きく押し上げた。",
    "bioEn": "Announced the 'Heisei' era as Chief Cabinet Secretary ('Heisei Uncle'). Mocked as 'cold pizza' and an 'ordinary man' upon taking office, he reversed public skepticism through tireless telephone outreach and sincere pragmatism.",
    "policiesZh": [
      {
        "title": "自自公联合政权",
        "desc": "打破参议院捻转困局，先后联合自由党与公明党组建稳固的联合执政构架，奠定此后自公联盟长达数十年的合作基础。"
      },
      {
        "title": "发行地域振兴券",
        "desc": "面对亚洲金融危机与通缩压力，向全国特定家庭发放每人2万日元消费券刺激内需，开创日本消费券刺激经济先河。"
      },
      {
        "title": "金融再生与减税对策",
        "desc": "通过金融再生两法，成立金融再生委员会，全力处置泡沫破裂后的巨额不良债权；实施超10万亿日元规模的减税与公共事业投入。"
      }
    ],
    "crisisZh": "2000年4月2日凌晨，因连日繁重政务在首相官邸突发脑梗塞紧急送医，陷入昏迷。4月5日内阁总辞职，同年5月14日逝世，享年62岁。"
  },
  "mori": {
    "id": "mori",
    "nameZh": "森喜朗",
    "nameJa": "森喜朗",
    "nameEn": "Yoshiro Mori",
    "eraNumberZh": "第85·86任内阁总理大臣",
    "eraNumberJa": "第85・86代内閣総理大臣",
    "eraNumberEn": "85th–86th Prime Minister of Japan",
    "partyZh": "自由民主党（清和政策研究会 / 森派）",
    "partyJa": "自由民主党（清和政策研究会・森派）",
    "partyEn": "Liberal Democratic Party (Seiwa Seisaku Kenkyukai)",
    "period": "2000-04-05 — 2001-04-26",
    "months": 13,
    "days": 387,
    "trendBadgeZh": "失言风波 · 暴跌至7%",
    "trendBadgeJa": "失言連発・支持率7%急落",
    "trendBadgeEn": "Gaffes & Historical Low 7%",
    "originZh": "石川县能美市 · 早稻田大学商学部 · 日本橄榄球协会长年会长",
    "originJa": "石川県能美市出身・早稲田大学商学部",
    "originEn": "Ishikawa Pref. · Waseda University",
    "bioZh": "小渊突发脑梗后，由自民党干事长野中广务等五位实力派大佬在东京酒店闭门密室选定继任。执政期间虽大力推动信息技术立国，但因屡次发表不慎失言引发舆论强烈反弹，内阁支持率一路坠跌至日本宪政历史最低点 7.0%。",
    "bioJa": "小渕首相の急病に伴い「自民党五人組」の密室協議により就任。「IT基本法」制定などIT立国を掲げ成果を上げたが、「神の国発言」やえひめ丸事故時のゴルフ継続など度重なる舌禍事件で支持率は憲政史上最低水准の7%台まで暴落した。",
    "bioEn": "Selected in a backroom deal by five party heavyweights after Obuchi's sudden illness. Despite pushing the IT Basic Act, serial gaffes (calling Japan a 'divine nation') and golfing during the Ehime Maru submarine disaster plunged his support to an all-time low of 7.0%.",
    "policiesZh": [
      {
        "title": "中央省厅重大统合再编",
        "desc": "完成战后最大规模的中央行政机构改革，将原有的1府22省厅精简整合为现在的1府12省厅，于2001年1月正式启动运作。"
      },
      {
        "title": "IT基本法与信息革命",
        "desc": "主导制定《高度信息通信网络社会形成基本法》（IT基本法），设立IT战略本部，推进光纤普及与日本高速宽带网络飞跃发展。"
      },
      {
        "title": "主办冲绳八国峰会",
        "desc": "顺利举行2000年九州·冲绳 G8 首脑峰会，并在日本发行面值两千日元的纪念纸币。"
      }
    ],
    "crisisZh": "2001年2月美军核潜艇撞沉爱媛县立水产高中练习船“爱媛丸号”，森喜朗接报后仍继续打高尔夫球，招致全国愤怒舆论，党内“倒森”声浪汹涌，被迫宣布提前举行总裁大选引咎退职。"
  },
  "koizumi": {
    "id": "koizumi",
    "nameZh": "小泉纯一郎",
    "nameJa": "小泉純一郎",
    "nameEn": "Junichiro Koizumi",
    "eraNumberZh": "第87·88·89任内阁总理大臣",
    "eraNumberJa": "第87〜89代内閣総理大臣",
    "eraNumberEn": "87th–89th Prime Minister of Japan",
    "partyZh": "自由民主党（清和政策研究会）",
    "partyJa": "自由民主党（清和政策研究会）",
    "partyEn": "Liberal Democratic Party (Seiwa Kenkyukai)",
    "period": "2001-04-26 — 2006-09-26",
    "months": 65,
    "days": 1980,
    "trendBadgeZh": "破格长命 · 邮政旋风",
    "trendBadgeJa": "小泉旋風・郵政解散・長期政権",
    "trendBadgeEn": "Koizumi Theater · 1980 Days",
    "originZh": "神奈川县横须贺市 · 庆应义塾大学经济学部 · 伦敦大学留学生",
    "originJa": "神奈川県横須賀市出身・慶應義塾大学経済学部",
    "originEn": "Kanagawa Pref. · Keio University",
    "bioZh": "打出“打破自民党”、“没有圣域的结构改革”口号，凭借超凡的演讲感染力与剧场型政治手法，首创 85.2% 的内阁支持率历史纪录。在位长达 5 年 5 个月，带领自民党摆脱派阀垄断，开创日本政治新格局，任期届满主动潇洒隐退。",
    "bioJa": "「自民党をぶっ壊す」「聖域なき構造改革」を掲げ、歴代最高の85.2%という驚異的な支持率で発足。ワンフレーズ・ポリティクスと劇場型政治で圧倒的な国民的人気を誇り、1,980日に及ぶ長期政権を築いた後、任期満了に伴い自ら退陣した。",
    "bioEn": "Took power with an all-time record 85.2% approval promising to 'destroy the old LDP' without sanctuary. Master of theatre politics and punchy slogans, he served 1,980 days—one of Japan's longest post-war tenures—and stepped down voluntarily at peak popularity.",
    "policiesZh": [
      {
        "title": "不良债权最终清理",
        "desc": "任用竹中平藏推行金融再生计划，强力督促各大都市银行处置巨额呆账坏账，彻底拆除日本平成金融危机的核心定时炸弹。"
      },
      {
        "title": "邮政民营化与道路公团改革",
        "desc": "把庞大的日本邮政储蓄与简保资金由国家手中推向市场；解散重组道路公团，遏制地方无度基建财政赤字。"
      },
      {
        "title": "2005年“邮政解散”大选",
        "desc": "参议院否决邮政法案后毅然解散众院，取消反对法案党内议员的公认资格并派遣“刺客候选人”，率自民党赢得296席历史性压倒性狂胜。"
      }
    ],
    "crisisZh": "靖国神社参拜引发邻国外交僵局，改革带来的城乡贫富差距扩大受到在野党抨击，但他坚守自民党总裁任期上限规定，2006年9月光荣引退。"
  },
  "abe1": {
    "id": "abe1",
    "nameZh": "安倍晋三 (第一次)",
    "nameJa": "安倍晋三(1次)",
    "nameEn": "Shinzo Abe (1st)",
    "eraNumberZh": "第90任内阁总理大臣",
    "eraNumberJa": "第90代内閣総理大臣",
    "eraNumberEn": "90th Prime Minister of Japan",
    "partyZh": "自由民主党（清和政策研究会）",
    "partyJa": "自由民主党（清和政策研究会）",
    "partyEn": "Liberal Democratic Party (Seiwa Kenkyukai)",
    "period": "2006-09-26 — 2007-09-26",
    "months": 12,
    "days": 366,
    "trendBadgeZh": "高开低走 · 肠炎猝辞",
    "trendBadgeJa": "消えた年金・参院選大敗・辞任",
    "trendBadgeEn": "Pension Crisis · Sudden Resignation",
    "originZh": "东京都（山口县长门市选区）· 成蹊大学法学部",
    "originJa": "東京都出身・成蹊大学法学部",
    "originEn": "Tokyo · Seikei University",
    "bioZh": "战后出生的第一位首相，提出“建设美丽的日本”口号，受到保守派与年轻一代寄予厚望。但上任后阁僚丑闻不断，叠加社会保险厅“消失的5000万份养老金记录”爆发，2007年参议院大选遭遇历史性惨败，陷入参众两院对立的“捻转国会”。",
    "bioJa": "戦後生まれ初の首相として「美しい国、日本」を掲げて若々しく登場。しかし閣僚の不祥事・自殺が相次ぎ、「消えた年金問題」で国民の怒りが爆発。2007年参院選で大敗し、所信表明演説直後に潰瘍性大腸炎の悪化で突如辞任を発表した。",
    "bioEn": "First prime minister born after WWII, championing 'a beautiful Japan'. Crippled by cabinet scandals, minister suicides, and the '50 million missing pensions' scandal, the LDP was routed in the 2007 Upper House election; he resigned abruptly due to ulcerative colitis.",
    "policiesZh": [
      {
        "title": "防卫厅升格为防卫省",
        "desc": "实现了防卫厅自1954年设立以来的长年夙愿，将其升格为正式的国家省厅，提升自卫队的国际地位与法制完备性。"
      },
      {
        "title": "通过国民投票法",
        "desc": "制定确立宪法修改手续的《国民投票法》，为日后修宪辩论奠定首个法定程序基石；修改时隔60年的《教育基本法》。"
      },
      {
        "title": "构想日美澳印四边机制",
        "desc": "在印度国会发表“两洋交汇”著名演讲，首次提出印太四边安全合作（QUAD）雏形。"
      }
    ],
    "crisisZh": "参院大选惨败后，在国会发表施政演说仅两天后，因溃疡性大肠炎剧烈恶化无法正常履职，于2007年9月12日突然在记者会宣布辞职，引发政坛震荡。"
  },
  "fukuda": {
    "id": "fukuda",
    "nameZh": "福田康夫",
    "nameJa": "福田康夫",
    "nameEn": "Yasuo Fukuda",
    "eraNumberZh": "第91任内阁总理大臣",
    "eraNumberJa": "第91代内閣総理大臣",
    "eraNumberEn": "91st Prime Minister of Japan",
    "partyZh": "自由民主党（清和政策研究会）",
    "partyJa": "自由民主党（清和政策研究会）",
    "partyEn": "Liberal Democratic Party (Seiwa Kenkyukai)",
    "period": "2007-09-26 — 2008-09-24",
    "months": 12,
    "days": 365,
    "trendBadgeZh": "捻转国会 · 客观看待自己",
    "trendBadgeJa": "ねじれ国会・消費者庁創設",
    "trendBadgeEn": "Twisted Diet · Resignation",
    "originZh": "群马县高崎市 · 早稻田大学第一政治经济学部 · 宪政史上首对父子首相",
    "originJa": "群馬県高崎市出身・早稲田大学政治経済学部",
    "originEn": "Gunma Pref. · Waseda University",
    "bioZh": "其父福田赳夫曾任首相，两人成为日本宪政史上首对父子宰相。性格稳健低调、擅长调和，提出“消费者行政”新理念。但面临民主党掌控参议院的“捻转国会”，政权运营举步维艰，日银总长人事案屡遭参院否决长达数月。",
    "bioJa": "父・福田赳夫に続く憲政史上初の「父子2代首相」。安定した調整力で消費者庁の創設や洞爺湖サミットを成功させるも、民主党が多数を握る「ねじれ国会」の泥沼に苦悶。辞任会見で「あなたとは違うんです」の流行語を残し退陣した。",
    "bioEn": "Son of Takeo Fukuda, marking Japan's first father-son prime minister dynasty. Despite creating the Consumer Affairs Agency and hosting the Toyako G8 summit, a Diet deadlock led him to resign after one year, uttering the famous retort: 'I can see myself objectively; I'm not like you.'",
    "policiesZh": [
      {
        "title": "创设消费者厅",
        "desc": "鉴于毒饺子事件等食品与产品安全隐患，大刀阔斧冲破各省厅行政壁垒，创设统筹全国消费者权益保护的专门行政机关“消费者厅”。"
      },
      {
        "title": "提出“福田愿景”",
        "desc": "在洞爷湖 G8 峰会前提倡温室气体减排60%-80%的长远环境愿景，树立日本低碳发展国家标杆。"
      },
      {
        "title": "积极改善中日关系",
        "desc": "主张重视亚洲外交，实现中日首脑互访并签署第四个政治文件，使中日关系重新步入春暖花开轨道。"
      }
    ],
    "crisisZh": "参议院在野党多数频繁否决关键人事与法案，2008年9月1日因自民党支持率持续低迷且政权停滞，宣布内阁总辞职以打破国会僵局。"
  },
  "aso": {
    "id": "aso",
    "nameZh": "麻生太郎",
    "nameJa": "麻生太郎",
    "nameEn": "Taro Aso",
    "eraNumberZh": "第92任内阁总理大臣",
    "eraNumberJa": "第92代内閣総理大臣",
    "eraNumberEn": "92nd Prime Minister of Japan",
    "partyZh": "自由民主党（为公会 / 麻生派）",
    "partyJa": "自由民主党（為公会・麻生派）",
    "partyEn": "Liberal Democratic Party (Shikokai)",
    "period": "2008-09-24 — 2009-09-16",
    "months": 12,
    "days": 358,
    "trendBadgeZh": "金融海啸 · 自民党野党陷落",
    "trendBadgeJa": "リーマンショック・定額給付金・下野",
    "trendBadgeEn": "Lehman Shock · Historic Defeat",
    "originZh": "福冈县饭冢市 · 学习院大学政经学部 · 吉田茂外孙 · 蒙特利尔奥运飞碟射击国手",
    "originJa": "福岡県飯塚市出身・学習院大学政経学部",
    "originEn": "Fukuoka Pref. · Gakushuin University",
    "bioZh": "日本前首相吉田茂的外孙，酷爱漫画且心直口快。刚就任便迎头撞上雷曼兄弟倒闭引发的百年一遇全球金融危机。尽管全力出台了超大规模的经济刺激对策，但因口误读错汉字风波与自民党内部内讧，最终在 2009 年众院大选彻底失去半个世纪的政权。",
    "bioJa": "名門政治家一族出身で吉田茂元首相の孫。就任直後にリーマン・ショックが直撃し、4次にわたる総額75兆円規模の経済対策と全世帯への定額給付金を断行。しかし漢字誤読や自民党内の足の引っ張り合いで求心力を失い、歴史的下野を迎えた。",
    "bioEn": "Grandson of Shigeru Yoshida. Hit by the Lehman Brothers collapse weeks after taking office, he rolled out massive stimulus packages and nationwide cash handouts, but was undermined by gaffes and party infighting, culminating in the LDP's catastrophic 2009 election loss.",
    "policiesZh": [
      {
        "title": "雷曼危机应对与定额给付金",
        "desc": "先后出台四波总规模达 75 万亿日元的巨额经济刺激方案，向全国全体国民发放每人 1.2 万日元（老人儿童 2 万日元）的定额给付金。"
      },
      {
        "title": "扩大 IMF 紧急融资",
        "desc": "在华盛顿首届 G20 金融峰会上承诺向国际货币基金组织（IMF）出资高达 1000 亿美元外汇储备，稳定全球外汇金融体系。"
      },
      {
        "title": "推动动漫文化外交",
        "desc": "积极提倡“动漫外交”与流行文化外宣（Cool Japan 构想），规划设立国立媒体艺术综合中心。"
      }
    ],
    "crisisZh": "2009年8月30日第45届众议院大选，民主党赢得308席历史性大胜，自民党仅获119席惨败，自1955年自民党建党以来首度真正丢掉第一大党执政权。"
  },
  "hatoyama": {
    "id": "hatoyama",
    "nameZh": "鸠山由纪夫",
    "nameJa": "鳩山由紀夫",
    "nameEn": "Yukio Hatoyama",
    "eraNumberZh": "第93任内阁总理大臣",
    "eraNumberJa": "第93代内閣総理大臣",
    "eraNumberEn": "93rd Prime Minister of Japan",
    "partyZh": "民主党",
    "partyJa": "民主党",
    "partyEn": "Democratic Party of Japan (DPJ)",
    "period": "2009-09-16 — 2010-06-08",
    "months": 9,
    "days": 266,
    "trendBadgeZh": "政权轮替 · 普天间辞职",
    "trendBadgeJa": "歴史的政権交代・友愛・普天間混迷",
    "trendBadgeEn": "Historic Power Shift · Futenma Crisis",
    "originZh": "东京都 · 东京大学工学部 · 斯坦福大学工学博士 · 鸠山四代政治名门",
    "originJa": "東京都出身・東京大学工学部・スタンフォード大Ph.D.",
    "originEn": "Tokyo · University of Tokyo · Stanford Ph.D.",
    "bioZh": "民主党创始人之一，以“友爱”理念与“国民生活第一”的竞选纲领，终结自民党半世纪独大，以 72.0% 的极高民调华丽组阁。但其宣称美军普天间基地“至少移至冲绳县外”的承诺在日美交涉中彻底碰壁，引发外交与执政联盟全面瓦解。",
    "bioJa": "「友愛」と「生活が第一」を掲げ、戦後初となる本格的な政権交代を成し遂げ72%の高支持率で船出。「子ども手当」や「事業仕分け」を進めたが、普天間基地移設の「最低でも県外」発言が迷走して日米関係を悪化させ、わずか8ヶ月余りで辞任した。",
    "bioEn": "Spearheaded the DPJ's historic 2009 electoral triumph with 72% initial support under the banner of 'Fraternity' and 'People's Lives First'. His unrealistic pledge to move the US Futenma air base out of Okinawa collapsed in diplomatic gridlock, forcing his resignation after eight months.",
    "policiesZh": [
      {
        "title": "推行儿童津贴与学费全免",
        "desc": "贯彻“从水泥到人”的政策转向，向全国家庭发放每月儿童津贴，全面免除公立高中学费，重塑家庭福利政策。"
      },
      {
        "title": "行政刷新会议“事业甄别”",
        "desc": "在公众和媒体众目睽睽之下对各省厅预算进行公开质询与审查削减，创造莲舫“做世界第二难道不行吗”的名场面。"
      },
      {
        "title": "倡导“东亚共同体”",
        "desc": "提出构建紧密的东亚共同体构想，承诺日本到2020年温室气体排放比1990年削减25%的雄心目标。"
      }
    ],
    "crisisZh": "普天间基地迁移案被迫回归美日原案引发冲绳民众抗议，社民党党首福岛瑞穗被罢免导致执政联盟破裂，加之个人母亲伪造政治献金丑闻，于2010年6月与小泽一郎双双辞职。"
  },
  "kan": {
    "id": "kan",
    "nameZh": "菅直人",
    "nameJa": "菅直人",
    "nameEn": "Naoto Kan",
    "eraNumberZh": "第94任内阁总理大臣",
    "eraNumberJa": "第94代内閣総理大臣",
    "eraNumberEn": "94th Prime Minister of Japan",
    "partyZh": "民主党",
    "partyJa": "民主党",
    "partyEn": "Democratic Party of Japan (DPJ)",
    "period": "2010-06-08 — 2011-09-02",
    "months": 15,
    "days": 452,
    "trendBadgeZh": "311东日本大震灾 · 去核电",
    "trendBadgeJa": "東日本大震災・福島原発・脱原発",
    "trendBadgeEn": "3.11 Triple Disaster · FIT Law",
    "originZh": "山口县宇部市 · 东京工业大学理学部 · 专利代理人 · 市民运动领袖出身",
    "originJa": "山口県宇部市出身・東京工業大学理学部",
    "originEn": "Yamaguchi Pref. · Tokyo Institute of Technology",
    "bioZh": "从草根市民运动家奋斗至国家宰相的传奇人物。执政第9个月突然遭遇 2011 年 3 月 11 日东日本大地震、海啸与福岛第一核电站特大事故的三重复合灾难，亲临第一线危机指挥，并在战后首次发布核能紧急事态宣言。",
    "bioJa": "市民運動家から首相へ上り詰めた異色のリーダー。2011年3月11日の東日本大震災および福島第一原発事故という未曾有の国難に直面。官邸主導の危機対応にあたり、事故後は再生可能エネルギー固定価格買取制度（FIT法）の成立に政治生命を賭けた。",
    "bioEn": "A former patent attorney and grassroots civic activist who rose to the premiership. He faced Japan's darkest post-war moment: the catastrophic March 11, 2011 Tohoku earthquake, tsunami, and Fukushima nuclear meltdowns. He staked his tenure on passing renewable energy legislation.",
    "policiesZh": [
      {
        "title": "311震灾应对与原子力灾害对策",
        "desc": "设立紧急灾害对策总部，出动10万自卫队员抗震救灾；果断成立福岛第一核电站事故统括官邸应急小组。"
      },
      {
        "title": "通过《再生能源特别措施法》",
        "desc": "在辞任前排除党内和电力巨头巨大阻力，强行推动通过可再生能源固定价格收购制度（FIT制度），彻底引爆日本光伏产业大爆发。"
      },
      {
        "title": "主张加入 TPP 谈判",
        "desc": "首次在亚太经合组织提出日本参与跨太平洋战略经济伙伴关系协定（TPP）谈判的构想。"
      }
    ],
    "crisisZh": "核电站事故初期的指挥沟通备受自民党与舆论指责，在野党提出不信任案后，菅直人承诺以公债发行特例法案与再生能源法案通过为辞职条件，于2011年8月底辞职。"
  },
  "noda": {
    "id": "noda",
    "nameZh": "野田佳彦",
    "nameJa": "野田佳彦",
    "nameEn": "Yoshihiko Noda",
    "eraNumberZh": "第95任内阁总理大臣",
    "eraNumberJa": "第95代内閣総理大臣",
    "eraNumberEn": "95th Prime Minister of Japan",
    "partyZh": "民主党",
    "partyJa": "民主党",
    "partyEn": "Democratic Party of Japan (DPJ)",
    "period": "2011-09-02 — 2012-12-26",
    "months": 16,
    "days": 482,
    "trendBadgeZh": "三党合意 · 决断解散",
    "trendBadgeJa": "社会保障・税一体改革・党首討論解散",
    "trendBadgeEn": "Tax Reform · Dramatic Dissolution",
    "originZh": "千叶县船桥市 · 早稻田大学政治经济学部 · 松下政经塾第一期生",
    "originJa": "千葉県船橋市出身・早稲田大学政治経済学部",
    "originEn": "Chiba Pref. · Waseda University",
    "bioZh": "松下政经塾首位首相，以相貌朴实自谦为“泥鳅首相”。为人刚毅沉稳，深知国家财政危如累卵，宁肯民主党内部大分裂，也要联手自民党公明党达成“三党合意”通过消费税增税法案；最终在党首辩论中当场决断解散众议院。",
    "bioJa": "松下政経塾出身者として初の首相。「ドジョウ宰相」を自認し実直な政治を貫く。民主党分裂の危機を冒して自民・公明との「三党合意」を結び、消費税率10%引き上げを可決。国会党首討論で安倍晋三氏に突如解散を宣言し、自公へ政権を明け渡した。",
    "bioEn": "First prime minister educated at the Matsushita Institute of Government and Management. Styling himself as a humble 'loach fish', he sacrificed party unity to pass a consumption tax hike with LDP-Komeito support. In a dramatic live Diet debate, he challenged Shinzo Abe and dissolved parliament.",
    "policiesZh": [
      {
        "title": "社会保障与税制一体化改革",
        "desc": "跨越朝野党派分歧，与自民党总裁谷垣祯一、公明党达成历史性三党协议，确立消费税分两阶段上调至10%以充实社会保障金。"
      },
      {
        "title": "正式推动灾后复兴厅成立",
        "desc": "设立统辖东日本大地震灾后重建的内阁复兴厅，投入25万亿日元实施为期10年的集中复兴重构项目。"
      },
      {
        "title": "推进钓鱼岛国有化",
        "desc": "为防止东京都知事石原慎太郎民间购岛激化矛盾，采取由国家直接出资买断国有化方针，导致中日关系陷入严峻冰点。"
      }
    ],
    "crisisZh": "消费税法案导致小泽一郎带数十名议员脱党出走；2012年11月14日在与安倍晋三党首辩论中当场提出解散众院，12月大选民主党仅剩57席惨败，政权彻底终结。"
  },
  "abe2": {
    "id": "abe2",
    "nameZh": "安倍晋三 (第二次)",
    "nameJa": "安倍晋三(2次)",
    "nameEn": "Shinzo Abe (2nd–4th)",
    "eraNumberZh": "第96·97·98任内阁总理大臣",
    "eraNumberJa": "第96〜98代内閣総理大臣",
    "eraNumberEn": "96th–98th Prime Minister of Japan",
    "partyZh": "自由民主党（清和政策研究会）",
    "partyJa": "自由民主党（清和政策研究会）",
    "partyEn": "Liberal Democratic Party (Seiwa Kenkyukai)",
    "period": "2012-12-26 — 2020-09-16",
    "months": 93,
    "days": 2822,
    "trendBadgeZh": "宪政史上最长 · 安倍经济学",
    "trendBadgeJa": "憲政史上最長2822日・アベノミクス",
    "trendBadgeEn": "Record 2822 Days · Abenomics",
    "originZh": "东京都（山口县第4区）· 成蹊大学法学部 · 通算在任3188天战后第一",
    "originJa": "東京都出身・成蹊大学法学部",
    "originEn": "Tokyo · Seikei University",
    "bioZh": "日本宪政史上连续在任时间最长（2,822天）、通算在位时间最长（3,188天）的首相。推行“安倍经济学”三支箭打破通缩魔咒，连续赢下 6 次全国大选打造“安倍独大”政局；通过和平安全法制解禁集体自卫权，提出“印太构想”深刻重塑全球地缘格局。",
    "bioJa": "通算在職3,188日、連続在職2,822日で憲政史上最長記録を樹立。「三本の矢」からなるアベノミクスで株高と雇用改善を達成。国政選挙で6連勝して強固な政治基盤を誇り、集団的自衛権の行使容認や「自由で開かれたインド太平洋（FOIP）」を提唱した。",
    "bioEn": "Japan's longest-serving prime minister in constitutional history (3,188 total days, 2,822 consecutive). His signature 'Abenomics' revitalized stock markets and employment, while security legislation and the 'Free and Open Indo-Pacific' strategy redefined global diplomacy.",
    "policiesZh": [
      {
        "title": "“安倍经济学”三支箭",
        "desc": "黑田东彦央行推行超宽松量化质化货币宽松（异次元金融缓和）、机动财政扩张及规制缓和成长战略，日经指数从8000点飙升至23000点。"
      },
      {
        "title": "成立国家安全保障会议 (NSC)",
        "desc": "打破省厅藩篱设立统辖外交国防的日本版 NSC，主导通过《和平安全法制》，自战后首次有限解禁集体自卫权。"
      },
      {
        "title": "签署 CPTPP 与引领 FOIP",
        "desc": "在美国退出 TPP 后毅然主导完成 11 国 CPTPP 协议生效，签署日欧 EPA，确立自由开放印太愿景。"
      }
    ],
    "crisisZh": "遭遇森友学园、加计学园及“赏樱会”公金私用丑闻反复审查；2020年新冠疫情应对受挫，叠加溃疡性大肠炎旧疾复发，于2020年8月28日正式辞职。（注：2022年7月8日在奈良街头演说时遭枪击不幸遇刺身亡）。"
  },
  "suga": {
    "id": "suga",
    "nameZh": "菅义伟",
    "nameJa": "菅義偉",
    "nameEn": "Yoshihide Suga",
    "eraNumberZh": "第99任内阁总理大臣",
    "eraNumberJa": "第99代内閣総理大臣",
    "eraNumberEn": "99th Prime Minister of Japan",
    "partyZh": "自由民主党（无派阀）",
    "partyJa": "自由民主党（無派閥）",
    "partyEn": "Liberal Democratic Party (Independent)",
    "period": "2020-09-16 — 2021-10-04",
    "months": 13,
    "days": 384,
    "trendBadgeZh": "手机降价 · 举办东京奥运",
    "trendBadgeJa": "デジタル庁・携帯値下げ・五輪開催",
    "trendBadgeEn": "Digital Agency · Tokyo 2020",
    "originZh": "秋田县雄胜町 · 法政大学第二法学部 · 长期担任内阁官房长官（任期战后最长）",
    "originJa": "秋田県湯沢市出身・法政大学法学部",
    "originEn": "Akita Pref. · Hosei University",
    "bioZh": "秋田县草莓农家之子，无世家背景白手起家。长年担任安倍内阁不可或缺的“大管家”官房长官。上任后展现雷厉风行的务实行政效率，强推手机话费暴降七成并设立数字厅。顶住疫情空前重压成功举办 2020 东京夏季奥运会与残奥会。",
    "bioJa": "秋田の農家出身の「叩き上げ」リーダー。官房長官として安倍政権を黒子で支え続け就任。携帯電話料金の大幅引き下げ、デジタル庁の新設、不妊治療の保険適用など生活密着の改革を次々と実現。コロナ禍の猛威の中、東京2020五輪・パラリンピックを完遂した。",
    "bioEn": "A self-made politician from a strawberry farming family in Akita. As Abe's long-serving Chief Cabinet Secretary, he slashed cell phone bills by up to 70%, launched the Digital Agency, expanded fertility treatment insurance coverage, and successfully delivered the Tokyo 2020 Olympics amid COVID.",
    "policiesZh": [
      {
        "title": "创设数字厅 (Digital Agency)",
        "desc": "克服省厅数字化条块分割恶习，仅用一年时间火速组建国家数字厅，统筹国家系统公共云与个人番号卡（My Number Card）普及。"
      },
      {
        "title": "手机资费强制下调",
        "desc": "打破三大电信运营商价格同盟，迫使各大电信巨头推出每月 20GB/2980 日元廉价方案，惠及全国千家万户。"
      },
      {
        "title": "2050 碳中和国家宣言",
        "desc": "在国会施政演说中正式向全世界宣布日本将于 2050 年实现温室气体净零排放目标，制定绿色成长战略。"
      }
    ],
    "crisisZh": "疫情反复导致医疗资源紧张，支持率随疫苗接种初期的混乱下滑；2021年9月在面临自民党总裁换届前夕，出人意料宣布专注防疫不谋求连任，执政一年功成退居二线。"
  },
  "kishida": {
    "id": "kishida",
    "nameZh": "岸田文雄",
    "nameJa": "岸田文雄",
    "nameEn": "Fumio Kishida",
    "eraNumberZh": "第100·101任内阁总理大臣",
    "eraNumberJa": "第100・101代内閣総理大臣",
    "eraNumberEn": "100th–101st Prime Minister of Japan",
    "partyZh": "自由民主党（宏池会 / 岸田派）",
    "partyJa": "自由民主党（宏池会・岸田派）",
    "partyEn": "Liberal Democratic Party (Kōchikai)",
    "period": "2021-10-04 — 2024-10-01",
    "months": 36,
    "days": 1094,
    "trendBadgeZh": "新资本主义 · 防卫费翻倍",
    "trendBadgeJa": "新しい資本主義・防衛費増額・G7広島",
    "trendBadgeEn": "New Capitalism · Defense Boost",
    "originZh": "东京都（广岛县第1区）· 早稻田大学法学部 · 外务大臣长年连续任期战后第二",
    "originJa": "東京都出身・早稲田大学法学部",
    "originEn": "Tokyo · Waseda University",
    "bioZh": "自民党名门宏池会领袖，外表温文尔雅但作风果断。提出“新资本主义”以期实现分配与增长双循环；在俄乌战争与地缘危机下，历史性决定将防卫预算翻倍增至 GDP 2% 并保有对敌基地反击能力；主场圆满承办广岛 G7 首脑峰会。",
    "bioJa": "名門・宏池会会長。穏健な「聞く力」を掲げつつ、防衛費GDP比2%への増額や反撃能力の保有、原発再稼働への大転換など歴代政権が避けてきた重要課題で決断を下した。G7広島サミットを成功させ、ウクライナのゼレンスキー大統領来日を実現させた。",
    "bioEn": "Leader of the dovish Kochikai faction who governed with surprising decisiveness. Enacted a historic doubling of Japan's defense budget to 2% of GDP, welcomed Volodymyr Zelenskyy to the Hiroshima G7 Summit, and spearheaded domestic wage-growth and green nuclear policy transitions.",
    "policiesZh": [
      {
        "title": "防卫力量历史性根本强化",
        "desc": "修订国家安保战略等安保三文件，将防卫预算大幅提高至 GDP 2%，拥有远程打击能力的对敌基地反击能力。"
      },
      {
        "title": "主办 G7 广岛峰会与改善日韩关系",
        "desc": "在被爆地广岛成功凝聚七国首脑发布无核愿景，乌克兰总统泽连斯基亲临；与韩国总统尹锡悦重启穿梭外交恢复军情协定。"
      },
      {
        "title": "推行新 NISA 与结构性大幅加薪",
        "desc": "全面扩容个人免税投资账户（新 NISA）促进“储蓄向投资”转化；春斗实现 30 余年来最大幅度工资增长（超5%）。"
      }
    ],
    "crisisZh": "自民党派阀政治资金“黑金”宴会丑闻全面暴发，民调长期跌至20%危险水域，岸田毅然带头解散自民党宏池会并处分多名骨干，2024年8月宣布不参选自民党总裁，主动承担政治责任让位。"
  },
  "ishiba": {
    "id": "ishiba",
    "nameZh": "石破茂",
    "nameJa": "石破茂",
    "nameEn": "Shigeru Ishiba",
    "eraNumberZh": "第102任内阁总理大臣",
    "eraNumberJa": "第102代内閣総理大臣",
    "eraNumberEn": "102nd Prime Minister of Japan",
    "partyZh": "自由民主党（水月会 / 石破派）",
    "partyJa": "自由民主党（水月会・石破派）",
    "partyEn": "Liberal Democratic Party (Suigetsukai)",
    "period": "2024-10-02 — 2025-10-21",
    "months": 13,
    "days": 384,
    "trendBadgeZh": "地方创生 · 少数派执政",
    "trendBadgeJa": "地方創生・防災庁構想・少数与党運営",
    "trendBadgeEn": "Regional Revitalization · Minority Govt",
    "originZh": "鸟取县八头郡八头町 · 庆应义塾大学法学部 · 防卫相·农水相·地方创生相",
    "originJa": "鳥取県八頭町出身・慶應義塾大学法学部",
    "originEn": "Tottori Pref. · Keio University",
    "bioZh": "自民党内著名的军武与防卫通、铁道迷，五度挑战自民党总裁大位终获登顶。就任后火速解散众议院，面对执政联盟未过半的少见政局，展现出极强的韧性与跨党派谈判耐心，推进地方振兴与防灾体制改革。",
    "bioJa": "防衛・農政の政策通で、5回目の挑戦で自民党総裁に就任。就任直後の衆院選で与党過半数割れの逆風に直面するも、野党各党との丁寧な政策協議による少数与党運営を展開。「防災庁」創設や地方経済再生に注力した。",
    "bioEn": "Noted security specialist and policy heavyweight who won the LDP leadership on his fifth attempt. Faced with a hung parliament after snap elections, he demonstrated seasoned pragmatism navigating minority government coalition compromises.",
    "policiesZh": [
      {
        "title": "创设专门“防灾厅”",
        "desc": "针对能登半岛地震等重大自然灾害教训，力推整合跨省厅应急响应体制，加快设立独立的防灾厅组织法案审议。"
      },
      {
        "title": "地方创生 2.0 战略",
        "desc": "将地方振兴交付金规模倍增，重点支持农林水产业、地方中小型制造业与数字游民下沉地方。"
      },
      {
        "title": "推进安全保障法制细化",
        "desc": "审慎研究日美地位协定修订，强化日本本土及西南诸岛自卫队防卫设施与军工产能基础。"
      }
    ],
    "crisisZh": "国会执政党席位未过半，面临在野党提出的国民所得门槛调整及预算博弈，政权运作如履薄冰，2025年自民党迎来新一轮激荡重组。"
  },
  "takaichi": {
    "id": "takaichi",
    "nameZh": "高市早苗",
    "nameJa": "高市早苗",
    "nameEn": "Sanae Takaichi",
    "eraNumberZh": "第103任内阁总理大臣",
    "eraNumberJa": "第103代内閣総理大臣",
    "eraNumberEn": "103rd Prime Minister of Japan",
    "partyZh": "自由民主党（保守派）",
    "partyJa": "自由民主党（保守派）",
    "partyEn": "Liberal Democratic Party (Conservative)",
    "period": "2025-10-21 — 2030-12-31",
    "months": 12,
    "days": 365,
    "trendBadgeZh": "首位女首相 · 危机管理投资",
    "trendBadgeJa": "憲政史上初の女性首相・危機管理投資",
    "trendBadgeEn": "First Female PM · Economic Security",
    "originZh": "奈良县奈良市 · 神户大学经营学部 · 松下政经塾五期生",
    "originJa": "奈良県奈良市出身・神戸大学経営学部",
    "originEn": "Nara Pref. · Kobe University",
    "bioZh": "日本宪政史上首位女性内阁总理大臣，继承保守派正统精神。主张“危机管理投资”，将国家防务、粮食安全、前沿尖端科技与防灾基础设施视为驱动经济增长的综合国力发动机，推行强硬的经济安保法规。",
    "bioJa": "日本憲政史上初の女性内閣総理大臣。強固な国家観と明晰な安全保障論を持ち、サプライチェーン強靭化や先端AI・量子技術への国家戦略投資を主導。「サナエノミクス」による積極財政と技術立国を推進する。",
    "bioEn": "Historic first female prime minister of Japan. A staunch conservative and protege of Shinzo Abe, she champions 'crisis management investment', aggressive fiscal policy, supply chain security, and advanced technology R&D.",
    "policiesZh": [
      {
        "title": "“危机管理投资”新战略",
        "desc": "将国家安全危机转化为投资动能，针对半导体制造、人工智能、量子计算及空间技术实施国家级资本补贴。"
      },
      {
        "title": "国家经济安全保障法制升级",
        "desc": "完善关键基础设施安全审查体制，建立完备的机密涉密人员安全许可资格（Security Clearance）法治化落地。"
      },
      {
        "title": "强化网络防御与太空自卫力量",
        "desc": "组建统合网络防卫指挥部，赋予自卫队主动网络防御（Active Cyber Defense）职能。"
      }
    ],
    "crisisZh": "在极化复杂的国会中力主积极财政引发央行加息抗通胀博弈，直面老龄化加深与财政纪律两难抉择。"
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
      <!-- 卡片 1: 全景大盘核心数据卡 -->
      <div class="panel-card">
        <div class="card-head">
          <span class="card-badge" style="background:var(--accent-soft, rgba(47,107,79,0.12));color:var(--accent);border:1px solid var(--accent-soft, rgba(47,107,79,0.25))">${langKey==='zh'?'大盘总览':langKey==='en'?'OVERVIEW':'政権全体'}</span>
          <span class="card-badge" style="background:rgba(0,0,0,0.05);color:var(--muted)">1998 — 2026</span>
        </div>
        <h2 class="card-title" style="margin-top:6px">${t.overviewTitle}</h2>
        <div class="card-subtitle">14${langKey==='zh'?'届内阁 · 331个月民调脉搏':langKey==='en'?' Cabinets · 331 Months of Polls':'内閣・331ヶ月の世論推移'}</div>

        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-num">${avgAll}<span style="font-size:16px;font-weight:300">%</span></div>
            <div class="stat-label">${t.meanLabel} (14${langKey==='zh'?'内阁总均值':langKey==='en'?'Cabinets Mean':'内閣平均'})</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${totalPolls}</div>
            <div class="stat-label">${t.pollsLabel} (NHK/日経/朝日各社)</div>
          </div>
          <div class="stat-box">
            <div class="stat-num" style="color:#2F6B4F">85.2<span style="font-size:16px;font-weight:300">%</span></div>
            <div class="stat-label">${t.highLabel} (小泉純一郎 2001)</div>
          </div>
          <div class="stat-box">
            <div class="stat-num" style="color:#C84B31">7.0<span style="font-size:16px;font-weight:300">%</span></div>
            <div class="stat-label">${t.lowLabel} (森喜朗 2001)</div>
          </div>
        </div>

        <div style="font-size:12.5px;line-height:1.65;color:var(--muted);margin-top:10px">
          ${langKey==='zh'?'从平成金融危机到后疫情时代，记录日本政权更迭、派阀盛衰与国民信任度起伏的28年一手连续调查轨迹。':langKey==='en'?'28 years of continuous first-hand poll tracking across post-bubble Japan, documenting regime shifts, faction dynamics, and public sentiment.':'平成の金融危機からポストコロナまで、政権交代・派閥抗争・国民の信認を記録した28年間の連続世論調査データ。'}
        </div>
      </div>

      <!-- 卡片 2: 执政时长排行榜 -->
      <div class="panel-card">
        <div style="font-size:15px;font-weight:250;letter-spacing:-0.2px;color:var(--ink);margin-bottom:12px;display:flex;align-items:center;gap:6px">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 13h12v1H2zm2-3h2v2H4zm3-4h2v6H7zm3-2h2v8h-2z"/></svg>
          ${langKey==='zh'?'政权稳定性与在任天数记录':langKey==='en'?'Tenure & Stability Records':'歴代内閣 在職日数記録'}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px dashed var(--line-main, rgba(0,0,0,0.08))">
            <span>${langKey==='zh'?'最长政权 · 安倍晋三 (2次)':langKey==='en'?'Longest: Shinzo Abe (2nd)':'最長政権：安倍晋三(2次)'}</span>
            <span style="font-size:14px;font-weight:250;color:var(--accent)">2,822 ${langKey==='zh'?'天':langKey==='en'?'days':'日'} (93${langKey==='zh'?'个月':langKey==='en'?'mo':'ヶ月'})</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px dashed var(--line-main, rgba(0,0,0,0.08))">
            <span>${langKey==='zh'?'结构改革 · 小泉纯一郎':langKey==='en'?'Structure: Junichiro Koizumi':'構造改革：小泉純一郎'}</span>
            <span style="font-size:14px;font-weight:250;color:var(--ink)">1,980 ${langKey==='zh'?'天':langKey==='en'?'days':'日'} (65${langKey==='zh'?'个月':langKey==='en'?'mo':'ヶ月'})</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px dashed var(--line-main, rgba(0,0,0,0.08))">
            <span>${langKey==='zh'?'最短短命 · 鸠山由纪夫':langKey==='en'?'Shortest: Yukio Hatoyama':'最短退任：鳩山由紀夫'}</span>
            <span style="font-size:14px;font-weight:250;color:#C84B31">266 ${langKey==='zh'?'天':langKey==='en'?'days':'日'} (9${langKey==='zh'?'个月':langKey==='en'?'mo':'ヶ月'})</span>
          </div>
        </div>
      </div>

      <!-- 卡片 3: 操作引导与数据源 -->
      <div class="panel-card" style="background:transparent;border:1px dashed var(--line-main, rgba(0,0,0,0.15));box-shadow:none">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);line-height:1.5">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" style="flex-shrink:0"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 7v4M8 4.5h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          <span>${langKey==='zh'?'鼠标在左侧图表移动可查看每位首相的详尽生平、政绩与支持率档案；点击可固定锁定。':langKey==='en'?'Hover over the chart to inspect any Prime Minister profile and historical milestones. Click to pin.':'グラフ上にマウスを移動すると、各首相の生平・主要政策・危機詳細が閲覧できます。クリックで固定。'}</span>
        </div>
      </div>
    `;
    return;
  }

  const s = cabStats[cabId];
  const p = CAB_PROFILES[cabId] || {
    id: cabId,
    nameZh: s.pm, nameJa: s.pm, nameEn: s.pm,
    eraNumberZh: "内阁总理大臣", eraNumberJa: "内閣総理大臣", eraNumberEn: "Prime Minister",
    partyZh: "自由民主党", partyJa: "自由民主党", partyEn: "LDP",
    originZh: "", originJa: "", originEn: "",
    bioZh: "", bioJa: "", bioEn: "",
    policiesZh: [],
    trendBadgeZh: "", trendBadgeJa: "", trendBadgeEn: "",
    crisisZh: ""
  };
  const color = s.color || '#FF6A3D';
  const isPinned = focusCabinet === cabId;

  const pmTitle = langKey === 'zh' ? (p.nameZh || s.pm) : (langKey === 'en' ? (p.nameEn || s.pm) : (p.nameJa || s.pm));
  const eraTitle = langKey === 'zh' ? p.eraNumberZh : (langKey === 'en' ? p.eraNumberEn : p.eraNumberJa);
  const partyTitle = langKey === 'zh' ? p.partyZh : (langKey === 'en' ? p.partyEn : p.partyJa);
  const trendTitle = langKey === 'zh' ? p.trendBadgeZh : (langKey === 'en' ? p.trendBadgeEn : p.trendBadgeJa);
  const originTitle = langKey === 'zh' ? p.originZh : (langKey === 'en' ? p.originEn : p.originJa);
  const bioTitle = langKey === 'zh' ? p.bioZh : (langKey === 'en' ? p.bioEn : (p.bioJa || p.bioZh));
  const policies = p.policiesZh || [];
  const crisisTitle = langKey === 'zh' ? p.crisisZh : (langKey === 'en' ? (p.crisisZh || '') : (p.crisisZh || ''));

  panelEl.innerHTML = `
    <!-- 卡片 1: 领导人抬头与支持率四宫格 -->
    <div class="panel-card">
      <div class="card-head">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span class="card-badge" style="background:${hexToRgba(color, 0.12)};color:${color};border:1px solid ${hexToRgba(color, 0.3)}">${partyTitle.split('（')[0]}</span>
          ${trendTitle ? `<span class="card-badge" style="background:rgba(0,0,0,0.04);color:var(--muted)">${trendTitle}</span>` : ''}
        </div>
        <span class="card-badge" style="background:${isPinned ? 'var(--accent)' : 'rgba(0,0,0,0.05)'};color:${isPinned ? '#fff' : 'var(--muted)'};border:1px solid ${isPinned ? 'var(--accent)' : 'var(--line-main, rgba(0,0,0,0.1))'}">
          ${isPinned ? (langKey==='zh'?'已锁定':langKey==='en'?'PINNED':'固定中') : (langKey==='zh'?'内阁档案':langKey==='en'?'CABINET':'内閣')}
        </span>
      </div>

      <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
        <span style="display:inline-block;width:4px;height:22px;border-radius:2px;background:${color}"></span>
        <h2 class="card-title">${pmTitle}</h2>
      </div>
      <div class="card-subtitle">${eraTitle} · ${partyTitle}</div>
      <div style="font-size:12px;color:var(--muted);font-family:var(--font-sans);margin-top:4px">
        ${s.start.slice(0, 7)} — ${s.end.slice(0, 7)} (${s.months}${langKey==='zh'?'个月':langKey==='en'?' months':'ヶ月'} / ${p.days || (s.months * 30)}${langKey==='zh'?'天':langKey==='en'?' days':'日'})
      </div>

      <!-- 四宫格数据块 -->
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-num" style="color:${color}">${s.mean}<span style="font-size:16px;font-weight:300">%</span></div>
          <div class="stat-label">${t.meanLabel} (${s.polls}${langKey==='zh'?'次民调':langKey==='en'?' polls':'回'})</div>
        </div>
        <div class="stat-box">
          <div class="stat-num" style="color:#2F6B4F">${s.high}<span style="font-size:16px;font-weight:300">%</span></div>
          <div class="stat-label">${t.highLabel} (${s.highYM})</div>
        </div>
        <div class="stat-box">
          <div class="stat-num" style="color:#C84B31">${s.low}<span style="font-size:16px;font-weight:300">%</span></div>
          <div class="stat-label">${t.lowLabel} (${s.lowYM})</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">${s.polls}</div>
          <div class="stat-label">${t.pollsLabel} (一次世論)</div>
        </div>
      </div>
    </div>

    <!-- 卡片 2: 领导人生平档案与政治出身 -->
    <div class="panel-card">
      <div style="font-size:13.5px;font-weight:300;letter-spacing:0.3px;color:var(--accent);margin-bottom:6px;display:flex;align-items:center;gap:6px">
        <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 1H6a4 4 0 00-4 4v1h12v-1a4 4 0 00-4-4z"/></svg>
        ${langKey==='zh'?'生平档案与政治派阀':langKey==='en'?'BIOGRAPHY & BACKGROUND':'生平・政治的出自'}
      </div>
      ${originTitle ? `<div style="font-size:13px;color:var(--ink);font-weight:300;margin-bottom:8px;padding-bottom:6px;border-bottom:1px dashed var(--line-main, rgba(0,0,0,0.08))">${originTitle}</div>` : ''}
      <div style="font-size:13px;line-height:1.7;color:var(--ink);font-weight:350">
        ${bioTitle}
      </div>
    </div>

    <!-- 卡片 3: 核心政策与关键历史战役 -->
    ${policies.length > 0 ? `
      <div class="panel-card">
        <div style="font-size:13.5px;font-weight:300;letter-spacing:0.3px;color:var(--accent);margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M3 2h10v2H3zm0 4h10v2H3zm0 4h7v2H3z"/></svg>
          ${langKey==='zh'?'核心政策举措与重大战役':langKey==='en'?'SIGNATURE POLICIES':'主要政策と歴史的改革'}
        </div>
        <div>
          ${policies.map(pol => `
            <div class="policy-item" style="border-left-color:${color}">
              <div class="policy-title">${pol.title}</div>
              <div class="policy-desc">${pol.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- 卡片 4: 辞职转折危机与操作栏 -->
    <div class="panel-card" style="padding:14px 16px">
      ${crisisTitle ? `
        <div style="font-size:13.5px;font-weight:300;color:#C84B31;margin-bottom:4px;display:flex;align-items:center;gap:6px">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M8 2l6 12H2L8 2zm0 3.5a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 008 5.5zm0 6a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>
          ${langKey==='zh'?'政权转折与辞任危机':langKey==='en'?'TURNING POINT & EXIT':'退陣・政権交代の契機'}
        </div>
        <div style="font-size:12.5px;line-height:1.6;color:var(--muted);margin-bottom:12px">
          ${crisisTitle}
        </div>
      ` : ''}
      <button type="button" class="back-btn" id="cab-btn-back">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${langKey==='zh'?'返回大盘总览':langKey==='en'?'Back to Overview':'大盤全体に戻る'}
      </button>
    </div>
  `;

  const backBtn = panelEl.querySelector('#cab-btn-back');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.stopPropagation();
      focusCabinet = null;
      renderPanel(null);
      if (chart) {
        chart.dispatchAction({ type: 'downplay' });
      }
    };
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
          opacity: 0.9,
          shadowBlur: currentVariant === 'tactical' ? (focused ? 10 : 4) : 0,
          shadowColor: currentVariant === 'tactical' ? hexToRgba(color, 0.45) : 'transparent'
        },
        itemStyle: {
          color: color,
          borderColor: T.pointBorder,
          borderWidth: 1.5,
          opacity: 1
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, currentVariant === 'editorial' ? 0.20 : 0.24) },
            { offset: 0.85, color: hexToRgba(color, 0.02) },
            { offset: 1, color: hexToRgba(color, 0.0) }
          ]),
          opacity: 0.8
        },
        emphasis: { focus: 'none', scale: 1.25 },
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
            opacity: 0.65
          },
          data: [
            [
              { coord: [c.start, 0], symbol: 'none' },
              {
                coord: [c.start, 97],
                symbol: 'none',
                label: {
                  show: true,
                  position: 'end',
                  distance: 12,
                  align: 'left',
                  formatter: String(c.pm),
                  fontSize: isNarrow ? 17 : 24,
                  fontWeight: 300,
                  letterSpacing: 1.5,
                  color: color,
                  fontFamily: 'var(--ja-sans), system-ui, sans-serif',
                  padding: [3, 8],
                  backgroundColor: currentVariant === 'editorial' ? 'rgba(250,252,246,0.95)' : 'rgba(28,28,24,0.95)',
                  borderColor: hexToRgba(color, 0.45),
                  borderWidth: 1.2,
                  borderRadius: 4
                }
              }
            ],
            [
              { coord: [c.start, 97], symbol: 'none' },
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
      backgroundColor: currentVariant === 'editorial' ? 'rgba(250, 252, 246, 0.96)' : 'rgba(20, 20, 18, 0.96)',
      borderColor: currentVariant === 'editorial' ? 'rgba(20, 26, 21, 0.12)' : 'rgba(237, 235, 228, 0.14)',
      borderWidth: 1,
      padding: [12, 16],
      extraCssText: 'border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.12);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);pointer-events:none;',
      textStyle: { color: T.tooltipText, fontSize: 13, fontFamily: 'var(--font-sans, "MiSans VF", "MiSans", "PingFang SC", system-ui, sans-serif)' },
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
        const pmName = cab ? cab.pm : '';
        const fontSans = 'var(--font-sans, "MiSans VF", "MiSans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif)';

        let html = '<div style="min-width:220px;font-family:' + fontSans + ';color:' + T.tooltipText + '">';
        
        // 顶栏：彩标 + 首相大名（优雅极细无衬线 16px）+ 发生年月
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:12px">';
        html += '<div style="display:flex;align-items:center;gap:8px">';
        html += '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + col + ';box-shadow:0 0 8px ' + hexToRgba(col, 0.6) + '"></span>';
        html += '<span style="font-weight:300;font-size:16px;letter-spacing:-0.2px;color:' + T.tooltipText + '">' + pmName + '</span>';
        html += '</div>';
        html += '<span style="color:' + (currentVariant === 'editorial' ? '#56635A' : '#A09E96') + ';font-size:12px;font-weight:350">' + ymStr + '</span>';
        html += '</div>';

        // 核心支持率：超大 28px 极细无衬线数字（绝非 monospace / Times 粗衬线）
        if (avg !== null) {
          html += '<div style="display:flex;align-items:baseline;gap:6px;margin:6px 0 10px 0">';
          html += '<span style="font-size:28px;font-weight:200;line-height:1;color:' + col + ';font-family:' + fontSans + ';letter-spacing:-0.5px">' + avg.toFixed(1) + '<span style="font-size:16px;font-weight:300">%</span></span>';
          html += '<span style="font-size:12px;font-weight:350;color:' + (currentVariant === 'editorial' ? '#56635A' : '#A09E96') + '">' + n + (lang==='en'?' polls avg':'社平均') + '</span>';
          html += '</div>';
        }

        // 各社明细数据：拉升至 12px 药丸胶囊，各社名字用 350 细体
        if (sources.length > 0) {
          html += '<div style="display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid ' + (currentVariant === 'editorial' ? 'rgba(20,26,21,0.08)' : 'rgba(237,235,228,0.1)') + ';padding-top:8px;margin-top:2px">';
          sources.forEach(function(s) {
            html += '<span style="font-size:12px;font-weight:350;padding:2px 8px;border-radius:4px;background:' + (currentVariant === 'editorial' ? 'rgba(20,26,21,0.05)' : 'rgba(255,255,255,0.06)') + ';color:' + (currentVariant === 'editorial' ? '#2b382d' : '#d2cfc4') + '">';
            html += s.src + ' <span style="font-size:13px;font-weight:250;color:' + col + ';margin-left:3px">' + s.v.toFixed(1) + '%</span>';
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
