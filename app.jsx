const { useState, useEffect } = React;

const CATEGORIES = [
  { id: "ohf",  label: "Online Sports", dailyRate: 47.29 },
  { id: "oc",   label: "Online Casino", dailyRate: 5.37  },
  { id: "shop", label: "Shop",          dailyRate: 1.42  },
  { id: "rc",   label: "Racecourse",    dailyRate: 2.70  },
  { id: "lc",   label: "Live Casino",   dailyRate: null  },
];

const TRIGGERS_EMOTIONAL = [
  { id: "boredom",    label: "Boredom/Loneliness"    },
  { id: "pointless",  label: "Pointlessness"         },
  { id: "worthless",  label: "Worthlessness"         },
  { id: "avoidance",  label: "Avoidance"             },
  { id: "reward",     label: "Reward"                },
  { id: "emotional",  label: "Emotional deprivation" },
  { id: "escape",     label: "Escape"                },
  { id: "anger",      label: "Anger"                 },
];

const TRIGGERS_GAMBLING = [
  { id: "winitback",  label: "Win it back"       },
  { id: "cracked",    label: "Cracked the code"  },
  { id: "event",      label: "Event driven"      },
  { id: "challenge",  label: "Challenge"         },
  { id: "thefix",     label: "Financial Fantasy" },
  { id: "easymoney",  label: "Account Availability" },
  { id: "cashneed",   label: "Cash is King"      },
  { id: "proveit",    label: "Prove it/worth"    },
];

const START_DATE  = "2026-06-22";
const ACCOUNTS_START = "2026-07";
const INITIAL_PB  = 30;
const STORAGE_KEY = "gamble_tracker_v2";
const ACCOUNTS_KEY = "gamble_tracker_accounts_v1";

const BOOKMAKERS = [
  { id:"betfair",    label:"Betfair"     },
  { id:"wh",         label:"WH"          },
  { id:"skybet",     label:"Skybet"      },
  { id:"betvictor",  label:"Bet Victor"  },
  { id:"tote",       label:"Tote"        },
  { id:"boyles",     label:"Boyles"      },
  { id:"ak",         label:"AK"          },
  { id:"betfred",    label:"Betfred"     },
  { id:"betgoodwin", label:"Betgoodwin"  },
  { id:"netbet",     label:"Netbet"      },
  { id:"sbk",        label:"SBK"         },
];

function loadAccounts() {
  try { const r = localStorage.getItem(ACCOUNTS_KEY); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
function saveAccounts(d) { try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(d)); } catch {} }

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseDate(str) {
  const [y,m,d] = str.split("-").map(Number);
  return new Date(y, m-1, d);
}
function addDays(str, n) {
  const d = parseDate(str);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
function formatDisplay(str) {
  return parseDate(str).toLocaleDateString("en-GB", { weekday:"short", day:"2-digit", month:"short", year:"numeric" });
}
function startOfWeekKey(str) {
  const d = parseDate(str);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return dateKey(d);
}
function startOfMonthKey(str) {
  const d = parseDate(str);
  return dateKey(new Date(d.getFullYear(), d.getMonth(), 1));
}
function startOfYearKey(str) {
  return `${parseDate(str).getFullYear()}-01-01`;
}
function getWeekNum(str) {
  const d = parseDate(str);
  const thu = new Date(d); thu.setDate(d.getDate() + 4 - (d.getDay()||7));
  const yr = new Date(thu.getFullYear(),0,1);
  return Math.ceil((((thu-yr)/86400000)+1)/7);
}

function loadData() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

const C = {
  bg:       "#0f1623",
  surface:  "#182030",
  card:     "#1e2a3d",
  border:   "#2a3a52",
  green:    "#10b981",
  greenDim: "#064e3b",
  red:      "#ef4444",
  text:     "#e2e8f0",
  muted:    "#64748b",
  muted2:   "#94a3b8",
  accent:   "#6366f1",
  accentDim:"#312e81",
  gold:     "#f59e0b",
  amber:    "#f59e0b",
  amberDim: "#78350f",
  navy:     "#111827",
  purple:   "#a855f7",
  purpleDim:"#3b0764",
};

const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard", icon:"⊞" },
  { id:"track",     label:"Track",     icon:"◎" },
  { id:"progress",  label:"Progress",  icon:"↗" },
  { id:"history",   label:"History",   icon:"⏱" },
  { id:"accounts",  label:"Accounts",  icon:"🏦" },
  { id:"savings",   label:"Saved",     icon:"£" },
];

const SETUP_KEY = "gamble_tracker_setup_done";

function App() {
  const [logs, setLogs]             = useState(loadData);
  const [accounts, setAccounts]     = useState(loadAccounts);
  const [tab, setTab]               = useState("dashboard");
  const [trackDate, setTrackDate]   = useState(todayKey());
  const [histPeriod, setHistPeriod] = useState("weekly");
  const [setupDone, setSetupDone]   = useState(() => {
    try { return localStorage.getItem(SETUP_KEY) === "true"; } catch { return false; }
  });
  const [setupIdx, setSetupIdx]     = useState(0);

  const TODAY      = todayKey();
  const weekStart  = startOfWeekKey(TODAY);
  const monthStart = startOfMonthKey(TODAY);
  const yearStart  = startOfYearKey(TODAY);

  const [viewMonth, setViewMonth]           = useState(startOfMonthKey(TODAY).slice(0,7));
  const [expandedBookie, setExpandedBookie] = useState(null);

  useEffect(() => { saveData(logs); }, [logs]);
  useEffect(() => { saveAccounts(accounts); }, [accounts]);

  const setupDays = [];
  { let d = START_DATE; while (d < TODAY) { setupDays.push(d); d = addDays(d,1); } }
  const needsSetup = !setupDone;

  function setGFD(dateStr) {
    setLogs(p => ({ ...p, [dateStr]: { ...p[dateStr], gfd:true, cats:[] } }));
  }
  function clearGFD(dateStr) {
    setLogs(p => ({ ...p, [dateStr]: { ...p[dateStr], gfd:false } }));
  }
  function toggleCat(dateStr, catId) {
    setLogs(p => {
      const ex = p[dateStr] || { gfd:false, cats:[], urge:false, triggers:[] };
      const cats = ex.cats?.includes(catId) ? ex.cats.filter(c=>c!==catId) : [...(ex.cats||[]), catId];
      return { ...p, [dateStr]: { ...ex, gfd:false, cats } };
    });
  }
  function setUrge(dateStr, val) {
    setLogs(p => {
      const ex = p[dateStr] || { gfd:false, cats:[], urge:false, triggers:[] };
      return { ...p, [dateStr]: { ...ex, urge:val, triggers: val ? (ex.triggers||[]) : [] } };
    });
  }
  function toggleTrigger(dateStr, tid) {
    setLogs(p => {
      const ex = p[dateStr] || { gfd:false, cats:[], urge:true, triggers:[] };
      const triggers = ex.triggers?.includes(tid) ? ex.triggers.filter(t=>t!==tid) : [...(ex.triggers||[]), tid];
      return { ...p, [dateStr]: { ...ex, triggers } };
    });
  }

  function catStreak(catId) {
    let streak = 0, d = TODAY;
    while (d >= START_DATE) {
      const log = logs[d];
      if (log && log.cats && log.cats.includes(catId)) break;
      streak++; d = addDays(d,-1);
    }
    return streak;
  }
  function catPB(catId) {
    let pb = INITIAL_PB, cur = 0, d = START_DATE;
    while (d <= TODAY) {
      const log = logs[d];
      if (log && log.cats && log.cats.includes(catId)) { pb = Math.max(pb,cur); cur=0; }
      else cur++;
      d = addDays(d,1);
    }
    return Math.max(pb, cur, INITIAL_PB);
  }

  function periodStats(from, to) {
    let gfds=0, gambled=0, urges=0, urgeScore=0, strong=0, moderate=0, minor=0;
    const catsUsed = new Set();
    let d = from > START_DATE ? from : START_DATE;
    while (d <= to && d <= TODAY) {
      const log = logs[d];
      if (log && log.gfd) gfds++;
      else if (log && log.cats && log.cats.length > 0) { gambled++; log.cats.forEach(c=>catsUsed.add(c)); }
      if (log && log.urge) {
        urges++;
        const s = log.urgeStrength || 0;
        urgeScore += s;
        if (s === 3) strong++;
        else if (s === 2) moderate++;
        else if (s === 1) minor++;
      }
      d = addDays(d,1);
    }
    return { gfds, gambled, catsUsed:[...catsUsed], urges, urgeScore, strong, moderate, minor };
  }

  function catSavings(catId, from, to) {
    const cat = CATEGORIES.find(c=>c.id===catId);
    if (!cat || !cat.dailyRate) return null;
    let free = 0, d = from > START_DATE ? from : START_DATE;
    while (d <= to && d <= TODAY) {
      const log = logs[d];
      if (!log || !log.cats || !log.cats.includes(catId)) free++;
      d = addDays(d,1);
    }
    return free * cat.dailyRate;
  }
  function totalSavings(from, to) {
    return CATEGORIES.filter(c=>c.dailyRate).reduce((s,cat)=>s+(catSavings(cat.id,from,to)||0),0);
  }
  function fmt(n) { return `£${n.toLocaleString("en-GB",{minimumFractionDigits:0,maximumFractionDigits:0})}`; }

  function last7Dots() {
    return Array.from({length:7},(_,i)=>{
      const k = addDays(TODAY, i-6);
      const log = logs[k];
      const gambled = log && !log.gfd && log.cats?.length > 0;
      const gfd     = log && log.gfd;
      const urge    = log && log.urge;
      const dayLabel = parseDate(k).toLocaleDateString("en-GB",{weekday:"short"}).slice(0,2);
      return { k, gfd, gambled, urge, isToday:k===TODAY, dayLabel };
    });
  }

  function buildHistory(period) {
    const items = [];
    if (period === "weekly") {
      let ws = startOfWeekKey(TODAY), safety=0;
      while (ws >= startOfWeekKey(START_DATE) && safety++<104) {
        const we = addDays(ws,6);
        items.push({ label:`Week ${getWeekNum(ws)}`,
          sub: formatDisplay(ws).split(",")[1]?.trim()||ws,
          stats: periodStats(ws,we), inProgress: ws===startOfWeekKey(TODAY) });
        ws = addDays(ws,-7);
      }
    } else if (period === "monthly") {
      let ms = startOfMonthKey(TODAY), safety=0;
      while (ms >= startOfMonthKey(START_DATE) && safety++<60) {
        const me = dateKey(new Date(parseDate(ms).getFullYear(), parseDate(ms).getMonth()+1, 0));
        const label = parseDate(ms).toLocaleDateString("en-GB",{month:"short",year:"numeric"});
        items.push({ label, stats:periodStats(ms,me), inProgress:ms===startOfMonthKey(TODAY) });
        const pd = parseDate(ms); pd.setMonth(pd.getMonth()-1); ms = dateKey(pd);
      }
    } else {
      let yr = parseDate(TODAY).getFullYear();
      const startYr = parseDate(START_DATE).getFullYear();
      while (yr >= startYr) {
        items.push({ label:String(yr),
          stats:periodStats(`${yr}-01-01`,`${yr}-12-31`),
          inProgress: yr===parseDate(TODAY).getFullYear() });
        yr--;
      }
    }
    return items;
  }

  const base = {
    app:    { background:C.bg, minHeight:"100vh", color:C.text,
              fontFamily:"'Inter',system-ui,sans-serif", maxWidth:430, margin:"0 auto", paddingBottom:80 },
    header: { padding:"14px 20px 10px", borderBottom:`1px solid ${C.border}`,
              background:C.surface, position:"sticky", top:0, zIndex:10 },
    hTitle: { fontSize:17, fontWeight:700, color:C.text, letterSpacing:"-0.3px" },
    hSub:   { fontSize:11, color:C.muted, marginTop:1 },
    section:{ padding:"14px 20px" },
    card:   { background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
              padding:"12px 14px", marginBottom:10 },
    label:  { fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase",
              letterSpacing:"0.7px", marginBottom:8 },
    nav:    { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
              width:"100%", maxWidth:430, background:C.navy,
              borderTop:`1px solid ${C.border}`, display:"flex", zIndex:20 },
    navBtn: (a) => ({ flex:1, padding:"9px 2px", border:"none", background:"none",
              color:a?C.accent:C.muted, cursor:"pointer", display:"flex",
              flexDirection:"column", alignItems:"center", gap:2,
              fontSize:9, fontWeight:a?700:400 }),
    navIcon:{ fontSize:16 },
    tabRow: { display:"flex", background:C.surface, borderBottom:`1px solid ${C.border}` },
    tabBtn: (a) => ({ flex:1, padding:"11px", border:"none", background:"none",
              color:a?C.text:C.muted, fontWeight:a?700:400, fontSize:12, cursor:"pointer",
              borderBottom:a?`2px solid ${C.accent}`:"2px solid transparent" }),
    statRow:{ display:"flex", gap:8, marginBottom:10 },
    statBox:{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
              padding:"10px 8px", textAlign:"center" },
    statN:  (col) => ({ fontSize:24, fontWeight:800, color:col||C.text, letterSpacing:"-0.5px" }),
    statL:  { fontSize:9, color:C.muted, marginTop:2, lineHeight:1.3 },
  };

  const dots = last7Dots();

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (needsSetup && setupIdx < setupDays.length) {
    const sk   = setupDays[setupIdx];
    const slog = logs[sk] || { gfd:false, cats:[], urge:false, triggers:[], quality:null };
    return (
      <div style={base.app}>
        <div style={base.header}>
          <div style={base.hTitle}>Setup — log past days</div>
          <div style={base.hSub}>{setupIdx+1} of {setupDays.length}</div>
        </div>
        <div style={base.section}>
          <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:12 }}>{formatDisplay(sk)}</div>
          <div style={{ height:4, background:C.border, borderRadius:2, marginBottom:18 }}>
            <div style={{ height:4, background:C.accent, borderRadius:2,
              width:`${(setupIdx/setupDays.length)*100}%` }}/>
          </div>

          {/* Did I gamble? */}
          <div style={base.label}>Did I gamble?</div>
          <button onClick={()=>slog.gfd?clearGFD(sk):setGFD(sk)}
            style={{ width:"100%", padding:13, borderRadius:12,
              border:`2px solid ${slog.gfd?C.green:C.border}`,
              background:slog.gfd?C.greenDim:C.card, color:slog.gfd?C.green:C.muted2,
              fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:10 }}>
            {slog.gfd ? "✓ Gambling-free day" : "Mark as gambling-free day"}
          </button>

          {!slog.gfd && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
                {CATEGORIES.map(cat => {
                  const active = slog.cats?.includes(cat.id);
                  return (
                    <button key={cat.id} onClick={()=>toggleCat(sk,cat.id)}
                      style={{ padding:"10px 12px", borderRadius:10,
                        border:`1px solid ${active?C.red:C.border}`,
                        background:active?"#450a0a":C.card, color:active?C.red:C.muted2,
                        fontSize:12, fontWeight:active?600:400, cursor:"pointer", textAlign:"left" }}>
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {slog.cats?.length > 0 && (
                <>
                  <div style={{ height:1, background:C.border, margin:"4px 0 14px" }}/>
                  <div style={base.label}>How did it go?</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:14 }}>
                    {[
                      { id:"pringles", label:"Pringles", desc:"Couldn't stop", col:C.red,   bg:"#450a0a" },
                      { id:"nike",     label:"Nike",     desc:"Just did it",   col:C.amber, bg:C.amberDim },
                      { id:"bloom",    label:"Bloom",    desc:"In control",    col:C.green, bg:C.greenDim },
                    ].map(opt=>{
                      const active = slog.quality === opt.id;
                      return (
                        <button key={opt.id}
                          onClick={()=>setLogs(p=>({
                            ...p, [sk]:{ ...p[sk]||{gfd:false,cats:[],urge:false,triggers:[]},
                              quality: active ? null : opt.id }
                          }))}
                          style={{ padding:"10px 8px", borderRadius:10,
                            border:`1px solid ${active?opt.col:C.border}`,
                            background:active?opt.bg:C.card, color:active?opt.col:C.muted2,
                            fontSize:12, fontWeight:active?700:400,
                            cursor:"pointer", textAlign:"center" }}>
                          <div style={{ fontWeight:700 }}>{opt.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Did I feel like gambling? */}
          <div style={{ height:1, background:C.border, margin:"4px 0 14px" }}/>
          <div style={base.label}>Did I feel like gambling?</div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {[true,false].map(val=>(
              <button key={String(val)} onClick={()=>setUrge(sk,val)}
                style={{ flex:1, padding:11, borderRadius:10,
                  border:`1px solid ${slog.urge===val?(val?C.purple:C.green):C.border}`,
                  background:slog.urge===val?(val?C.purpleDim:C.greenDim):C.card,
                  color:slog.urge===val?(val?C.purple:C.green):C.muted2,
                  fontSize:12, fontWeight:slog.urge===val?700:400, cursor:"pointer" }}>
                {val ? "Yes" : "No"}
              </button>
            ))}
          </div>

          {/* Triggers */}
          {slog.urge && (
            <>
              <div style={{ height:1, background:C.border, margin:"4px 0 14px" }}/>
              <div style={base.label}>Strength of urge</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:14 }}>
                {[
                  { val:1, label:"1", desc:"Minor",    col:C.green, bg:C.greenDim },
                  { val:2, label:"2", desc:"Moderate", col:C.amber, bg:C.amberDim },
                  { val:3, label:"3", desc:"Strong",   col:C.red,   bg:"#450a0a"  },
                ].map(opt=>{
                  const active = slog.urgeStrength === opt.val;
                  return (
                    <button key={opt.val}
                      onClick={()=>setLogs(p=>({
                        ...p, [sk]:{ ...p[sk]||{gfd:false,cats:[],urge:true,triggers:[]},
                          urgeStrength: active ? null : opt.val }
                      }))}
                      style={{ padding:"5px 8px", borderRadius:10,
                        border:`1px solid ${active?opt.col:C.border}`,
                        background:active?opt.bg:C.card,
                        color:active?opt.col:C.muted2,
                        fontSize:13, fontWeight:active?700:400,
                        cursor:"pointer", textAlign:"center" }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{opt.label}</div>
                      <div style={{ fontSize:9, opacity:0.8 }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div style={base.label}>Triggers</div>
              <div style={{ fontSize:10, color:C.muted, marginBottom:6,
                textTransform:"uppercase", letterSpacing:"0.5px" }}>Emotional</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
                {TRIGGERS_EMOTIONAL.map(t=>{
                  const active = slog.triggers?.includes(t.id);
                  return (
                    <button key={t.id} onClick={()=>toggleTrigger(sk,t.id)}
                      style={{ padding:"9px 12px", borderRadius:9,
                        border:`1px solid ${active?C.amber:C.border}`,
                        background:active?C.amberDim:C.card, color:active?C.amber:C.muted2,
                        fontSize:11, fontWeight:active?600:400, cursor:"pointer", textAlign:"left" }}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize:10, color:C.muted, marginBottom:6,
                textTransform:"uppercase", letterSpacing:"0.5px" }}>Gambling</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                {TRIGGERS_GAMBLING.map(t=>{
                  const active = slog.triggers?.includes(t.id);
                  return (
                    <button key={t.id} onClick={()=>toggleTrigger(sk,t.id)}
                      style={{ padding:"9px 12px", borderRadius:9,
                        border:`1px solid ${active?C.red:C.border}`,
                        background:active?"#450a0a":C.card, color:active?C.red:C.muted2,
                        fontSize:11, fontWeight:active?600:400, cursor:"pointer", textAlign:"left" }}>
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Notes */}
              <div style={{ height:1, background:C.border, margin:"4px 0 14px" }}/>
              <div style={base.label}>Notes</div>
              <textarea
                maxLength={500}
                value={slog.notes||""}
                onChange={e=>setLogs(p=>({
                  ...p, [sk]:{ ...p[sk]||{gfd:false,cats:[],urge:true,triggers:[]},
                    notes: e.target.value }
                }))}
                placeholder="Add any context or thoughts..."
                style={{ width:"100%", minHeight:80, padding:"10px 12px",
                  background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                  color:C.text, fontSize:13, fontFamily:"inherit", resize:"vertical",
                  outline:"none", lineHeight:1.5, marginBottom:4 }}
              />
              <div style={{ fontSize:10, color:C.muted, textAlign:"right", marginBottom:14 }}>
                {(slog.notes||"").length} / 500
              </div>
            </>
          )}

          {/* Navigation */}
          <div style={{ display:"flex", gap:8 }}>
            {setupIdx > 0 && (
              <button onClick={()=>setSetupIdx(i=>i-1)}
                style={{ flex:1, padding:13, borderRadius:12,
                  border:`1px solid ${C.border}`, background:C.card,
                  color:C.muted2, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                ← Previous
              </button>
            )}
            <button onClick={()=>{
              if (setupIdx < setupDays.length-1) setSetupIdx(i=>i+1);
              else {
                try { localStorage.setItem(SETUP_KEY, "true"); } catch {}
                setSetupDone(true);
              }
            }} style={{ flex:1, padding:13, borderRadius:12, border:"none",
              background:C.accent, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {setupIdx < setupDays.length-1 ? "Next day →" : "Finish setup →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  const DashboardTab = () => {
    const ohf       = CATEGORIES.find(c=>c.id==="ohf");
    const ohfStreak = catStreak("ohf");
    const ohfPB     = catPB("ohf");
    const ohfPct    = Math.min((ohfStreak/ohfPB)*100,100);
    const ohfCol    = ohfStreak===0?C.red:ohfStreak>=ohfPB?C.gold:C.green;

    function ohfFreeDays(from,to) {
      let free=0, d=from>START_DATE?from:START_DATE;
      while (d<=to && d<=TODAY) {
        const log=logs[d];
        if (!log||!log.cats||!log.cats.includes("ohf")) free++;
        d=addDays(d,1);
      }
      return free;
    }

    const ohfFree7 = ohfFreeDays(addDays(TODAY,-6),TODAY);
    const ohfFreeM = ohfFreeDays(monthStart,TODAY);
    const ohfFreeY = ohfFreeDays(yearStart,TODAY);
    const urge7    = dots.filter(d=>d.urge).length;
    const urgeResisted7 = dots.filter(d=>d.urge && !d.gambled).length;

    return (
      <>
        <div style={base.header}>
          <div style={base.hTitle}>myBetTracker</div>
          <div style={base.hSub}>{formatDisplay(TODAY)}</div>
        </div>
        <div style={base.section}>

          {/* Online Sports hero */}
          <div style={{ background:"#0d1f14", border:`1px solid ${C.green}40`,
            borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.green,
              textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:12 }}>
              Online Sports
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:10 }}>
              <div style={{ fontSize:52, fontWeight:800, color:ohfCol,
                lineHeight:1, letterSpacing:"-2px" }}>{ohfStreak}</div>
              <div style={{ paddingBottom:6 }}>
                <div style={{ fontSize:13, color:C.muted2, fontWeight:500 }}>day streak</div>
                {ohfStreak>=ohfPB && ohfStreak>0 &&
                  <div style={{ fontSize:10, color:C.gold, fontWeight:700 }}>Personal best</div>}
              </div>
            </div>
            <div style={{ height:6, background:C.border, borderRadius:3, marginBottom:4 }}>
              <div style={{ height:6, background:ohfCol, borderRadius:3,
                width:`${ohfPct}%`, transition:"width 0.4s ease" }}/>
            </div>
            <div style={{ fontSize:9, color:C.muted, marginBottom:14 }}>
              {ohfStreak>=ohfPB?`Personal best — ${ohfPB}d`:`${ohfStreak} / ${ohfPB}d`}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              {[
                { label:"Last 7 days", free:ohfFree7, saved:fmt(ohfFree7*ohf.dailyRate) },
                { label:"This month",  free:ohfFreeM, saved:fmt(ohfFreeM*ohf.dailyRate) },
                { label:"Year to date",free:ohfFreeY, saved:fmt(ohfFreeY*ohf.dailyRate) },
              ].map(p=>(
                <div key={p.label} style={{ background:"#0a1a0f", borderRadius:10,
                  padding:"9px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:C.muted, marginBottom:5, lineHeight:1.3 }}>{p.label}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:C.green,
                    letterSpacing:"-0.5px" }}>{p.free}d</div>
                  <div style={{ fontSize:11, fontWeight:700, color:C.gold, marginTop:3 }}>{p.saved}</div>
                  <div style={{ fontSize:8, color:C.muted, marginTop:1 }}>saved</div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-day dot grid with urge overlay */}
          <div style={base.card}>
            <div style={base.label}>Last 7 days</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              {dots.map(({k,gfd,gambled,urge,isToday,dayLabel})=>(
                <div key={k} style={{ display:"flex", flexDirection:"column",
                  alignItems:"center", gap:5 }}>
                  <div style={{ position:"relative", width:34, height:34 }}>
                    <div style={{ width:34, height:34, borderRadius:"50%",
                      background: gfd?C.green:gambled?C.red:"transparent",
                      border:`2px solid ${gfd?C.green:gambled?C.red:isToday?C.accent:C.border}` }}/>
                    {urge && (
                      <div style={{ position:"absolute", bottom:1, right:1,
                        width:10, height:10, borderRadius:"50%",
                        background:C.purple, border:`1.5px solid ${C.bg}` }}/>
                    )}
                  </div>
                  <div style={{ fontSize:10, color:isToday?C.accent:C.muted,
                    fontWeight:isToday?700:400 }}>{dayLabel}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px" }}>
              {[[C.green,"GFD"],[C.red,"Gambled"],[C.purple,"Felt urge"]].map(([col,lbl])=>(
                <div key={lbl} style={{ display:"flex", alignItems:"center",
                  gap:4, fontSize:10, color:C.muted }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:col }}/>{lbl}
                </div>
              ))}
            </div>
            {urge7 > 0 && (
              <div style={{ marginTop:10, padding:"8px 10px", background:C.surface,
                borderRadius:8, fontSize:11, color:C.muted2 }}>
                Urge felt <span style={{ color:C.purple, fontWeight:700 }}>{urge7}x</span> this week
                {urgeResisted7 > 0 &&
                  <span> — resisted <span style={{ color:C.green, fontWeight:700 }}>{urgeResisted7}x</span></span>}
              </div>
            )}
          </div>

          {/* All categories dimmed */}
          <div style={base.label}>All activity</div>
          <div style={{ ...base.card, opacity:0.72 }}>
            {CATEGORIES.map((cat,i)=>{
              const streak = catStreak(cat.id);
              const pb     = catPB(cat.id);
              const pct    = Math.min((streak/pb)*100,100);
              const col    = streak===0?C.red:streak>=pb?C.gold:C.green;
              return (
                <div key={cat.id} style={{ paddingBottom:i<CATEGORIES.length-1?10:0,
                  marginBottom:i<CATEGORIES.length-1?10:0,
                  borderBottom:i<CATEGORIES.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"baseline", marginBottom:4 }}>
                    <div style={{ fontSize:12, color:C.muted2 }}>{cat.label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:col }}>
                      {streak}d
                      {streak>=pb && streak>0 &&
                        <span style={{ fontSize:9, color:C.gold, marginLeft:3 }}>PB</span>}
                    </div>
                  </div>
                  <div style={{ height:4, background:C.border, borderRadius:2 }}>
                    <div style={{ height:4, background:col, borderRadius:2,
                      width:`${pct}%`, transition:"width 0.4s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  // ── TRACK ─────────────────────────────────────────────────────────────────
  const TrackTab = () => {
    const tlog = logs[trackDate] || { gfd:false, cats:[], urge:false, triggers:[], notes:"" };
    const isFuture = trackDate > TODAY;
    const [localNotes, setLocalNotes] = useState(tlog.notes||"");

    useEffect(() => { setLocalNotes(tlog.notes||""); }, [trackDate]);

    function saveNotes(val) {
      setLogs(p=>({ ...p, [trackDate]:{ ...p[trackDate]||{gfd:false,cats:[],urge:true,triggers:[]}, notes:val } }));
    }
    return (
      <>
        <div style={base.header}>
          <div style={base.hTitle}>Track</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          background:C.surface, padding:"10px 20px", borderBottom:`1px solid ${C.border}` }}>
          <button onClick={()=>{ if(trackDate>START_DATE) setTrackDate(addDays(trackDate,-1)); }}
            style={{ background:"none", border:"none",
              color:trackDate<=START_DATE?C.border:C.muted2,
              fontSize:22, cursor:"pointer", padding:"2px 8px" }}>‹</button>
          <div style={{ textAlign:"center", flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{formatDisplay(trackDate)}</div>
            {trackDate===TODAY && <div style={{ fontSize:10, color:C.accent }}>Today</div>}
            <input
              type="date"
              min={START_DATE}
              max={TODAY}
              value={trackDate}
              onChange={e=>{ if(e.target.value) setTrackDate(e.target.value); }}
              style={{ position:"absolute", opacity:0, width:0, height:0, pointerEvents:"none" }}
              id="track-date-picker"
            />
            <button onClick={()=>document.getElementById("track-date-picker").showPicker?.() ||
              document.getElementById("track-date-picker").click()}
              style={{ background:"none", border:"none", color:C.muted, cursor:"pointer",
                fontSize:11, marginTop:2, padding:"2px 6px", borderRadius:6,
                border:`1px solid ${C.border}` }}>
              📅 Pick date
            </button>
          </div>
          <button onClick={()=>{ if(trackDate<TODAY) setTrackDate(addDays(trackDate,1)); }}
            style={{ background:"none", border:"none",
              color:trackDate>=TODAY?C.border:C.muted2,
              fontSize:22, cursor:"pointer", padding:"2px 8px" }}>›</button>
        </div>

        <div style={base.section}>
          {isFuture ? (
            <div style={{ textAlign:"center", color:C.muted, padding:40, fontSize:13 }}>
              Can't log future dates
            </div>
          ) : (
            <>
              <div style={base.label}>Did I gamble?</div>
              <button onClick={()=>tlog.gfd?clearGFD(trackDate):setGFD(trackDate)}
                style={{ width:"100%", padding:13, borderRadius:12,
                  border:`2px solid ${tlog.gfd?C.green:C.border}`,
                  background:tlog.gfd?C.greenDim:C.card, color:tlog.gfd?C.green:C.muted2,
                  fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:10 }}>
                {tlog.gfd ? "✓ Gambling-free day" : "Mark as gambling-free day"}
              </button>

              {!tlog.gfd && (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
                    {CATEGORIES.map(cat=>{
                      const active = tlog.cats?.includes(cat.id);
                      return (
                        <button key={cat.id} onClick={()=>toggleCat(trackDate,cat.id)}
                          style={{ padding:"11px 12px", borderRadius:10,
                            border:`1px solid ${active?C.red:C.border}`,
                            background:active?"#450a0a":C.card, color:active?C.red:C.muted2,
                            fontSize:12, fontWeight:active?600:400, cursor:"pointer", textAlign:"left" }}>
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {tlog.cats?.length > 0 && (
                    <>
                      <div style={{ height:1, background:C.border, margin:"4px 0 14px" }}/>
                      <div style={base.label}>How did it go?</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:14 }}>
                        {[
                          { id:"pringles", label:"Pringles", desc:"Couldn't stop", col:C.red,    bg:"#450a0a" },
                          { id:"nike",     label:"Nike",     desc:"Just did it",   col:C.amber,   bg:C.amberDim },
                          { id:"bloom",    label:"Bloom",    desc:"In control",    col:C.green,   bg:C.greenDim },
                        ].map(opt=>{
                          const active = tlog.quality === opt.id;
                          return (
                            <button key={opt.id}
                              onClick={()=>setLogs(p=>({
                                ...p,
                                [trackDate]:{ ...p[trackDate]||{gfd:false,cats:[],urge:false,triggers:[]},
                                  quality: active ? null : opt.id }
                              }))}
                              style={{ padding:"10px 8px", borderRadius:10,
                                border:`1px solid ${active?opt.col:C.border}`,
                                background:active?opt.bg:C.card,
                                color:active?opt.col:C.muted2,
                                fontSize:12, fontWeight:active?700:400,
                                cursor:"pointer", textAlign:"center" }}>
                              <div style={{ fontWeight:700 }}>{opt.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              <div style={{ height:1, background:C.border, margin:"4px 0 14px" }}/>
              <div style={base.label}>Did I feel like gambling?</div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {[true,false].map(val=>(
                  <button key={String(val)} onClick={()=>setUrge(trackDate,val)}
                    style={{ flex:1, padding:11, borderRadius:10,
                      border:`1px solid ${tlog.urge===val?(val?C.purple:C.green):C.border}`,
                      background:tlog.urge===val?(val?C.purpleDim:C.greenDim):C.card,
                      color:tlog.urge===val?(val?C.purple:C.green):C.muted2,
                      fontSize:12, fontWeight:tlog.urge===val?700:400, cursor:"pointer" }}>
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>

              {/* Notes — always visible once urge is answered */}
              {tlog.urge !== undefined && tlog.urge !== null && (
                <>
                  <div style={base.label}>Notes</div>
                  <textarea
                    maxLength={500}
                    value={localNotes}
                    onChange={e=>setLocalNotes(e.target.value)}
                    onBlur={e=>saveNotes(e.target.value)}
                    placeholder="Add any context or thoughts..."
                    style={{ width:"100%", minHeight:80, padding:"10px 12px",
                      background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                      color:C.text, fontSize:13, fontFamily:"inherit", resize:"vertical",
                      outline:"none", lineHeight:1.5 }}
                  />
                  <div style={{ fontSize:10, color:C.muted, textAlign:"right", marginTop:4, marginBottom:12 }}>
                    {localNotes.length} / 500
                  </div>
                </>
              )}

              {tlog.urge && (
                <>
                  <div style={{ height:1, background:C.border, margin:"4px 0 14px" }}/>
                  <div style={base.label}>Strength of urge</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:14 }}>
                    {[
                      { val:1, label:"1", desc:"Minor",    col:C.green, bg:C.greenDim },
                      { val:2, label:"2", desc:"Moderate", col:C.amber, bg:C.amberDim },
                      { val:3, label:"3", desc:"Strong",   col:C.red,   bg:"#450a0a"  },
                    ].map(opt=>{
                      const active = tlog.urgeStrength === opt.val;
                      return (
                        <button key={opt.val}
                          onClick={()=>setLogs(p=>({
                            ...p, [trackDate]:{ ...p[trackDate]||{gfd:false,cats:[],urge:true,triggers:[]},
                              urgeStrength: active ? null : opt.val }
                          }))}
                          style={{ padding:"5px 8px", borderRadius:10,
                            border:`1px solid ${active?opt.col:C.border}`,
                            background:active?opt.bg:C.card,
                            color:active?opt.col:C.muted2,
                            fontSize:13, fontWeight:active?700:400,
                            cursor:"pointer", textAlign:"center" }}>
                          <div style={{ fontWeight:700, fontSize:14 }}>{opt.label}</div>
                          <div style={{ fontSize:9, opacity:0.8 }}>{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={base.label}>Triggers</div>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:6,
                    textTransform:"uppercase", letterSpacing:"0.5px" }}>Emotional</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
                    {TRIGGERS_EMOTIONAL.map(t=>{
                      const active = tlog.triggers?.includes(t.id);
                      return (
                        <button key={t.id} onClick={()=>toggleTrigger(trackDate,t.id)}
                          style={{ padding:"9px 12px", borderRadius:9,
                            border:`1px solid ${active?C.amber:C.border}`,
                            background:active?C.amberDim:C.card, color:active?C.amber:C.muted2,
                            fontSize:11, fontWeight:active?600:400, cursor:"pointer", textAlign:"left" }}>
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:6,
                    textTransform:"uppercase", letterSpacing:"0.5px" }}>Gambling</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                    {TRIGGERS_GAMBLING.map(t=>{
                      const active = tlog.triggers?.includes(t.id);
                      return (
                        <button key={t.id} onClick={()=>toggleTrigger(trackDate,t.id)}
                          style={{ padding:"9px 12px", borderRadius:9,
                            border:`1px solid ${active?C.red:C.border}`,
                            background:active?"#450a0a":C.card, color:active?C.red:C.muted2,
                            fontSize:11, fontWeight:active?600:400, cursor:"pointer", textAlign:"left" }}>
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </>
    );
  };

  // ── PROGRESS ──────────────────────────────────────────────────────────────
  const ProgressTab = () => {
    const periods = [
      { label:"Last 7 days",  from:addDays(TODAY,-6), to:TODAY },
      { label:"This month",   from:monthStart,         to:TODAY },
      { label:"Year to date", from:yearStart,           to:TODAY },
    ];
    return (
      <>
        <div style={base.header}>
          <div style={base.hTitle}>Progress</div>
        </div>
        <div style={base.section}>
          {periods.map(p=>{
            const stats = periodStats(p.from, p.to);
            const catDays = {};
            CATEGORIES.forEach(cat=>{
              let count=0, d=p.from>START_DATE?p.from:START_DATE;
              while (d<=p.to && d<=TODAY) {
                const log=logs[d];
                if (log&&log.cats&&log.cats.includes(cat.id)) count++;
                d=addDays(d,1);
              }
              catDays[cat.id]=count;
            });
            return (
              <div key={p.label} style={{ marginBottom:18 }}>
                <div style={base.label}>{p.label}</div>
                <div style={base.statRow}>
                  <div style={base.statBox}>
                    <div style={base.statN(C.green)}>{stats.gfds}</div>
                    <div style={base.statL}>GFDs</div>
                  </div>
                  <div style={base.statBox}>
                    <div style={base.statN(stats.gambled>0?C.red:C.text)}>{stats.gambled}</div>
                    <div style={base.statL}>Days<br/>gambled</div>
                  </div>
                  <div style={base.statBox}>
                    <div style={base.statN(C.purple)}>{stats.urges}</div>
                    <div style={base.statL}>Urge<br/>days</div>
                  </div>
                </div>
                {stats.urges > 0 && (
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                    {[
                      { count:stats.strong,   col:C.red,   label:"Strong"   },
                      { count:stats.moderate, col:C.amber, label:"Moderate" },
                      { count:stats.minor,    col:C.green, label:"Minor"    },
                    ].map(s=>(
                      <div key={s.label} style={{ flex:1, background:C.card,
                        border:`1px solid ${C.border}`, borderRadius:10,
                        padding:"7px 6px", textAlign:"center" }}>
                        <div style={{ fontSize:16, fontWeight:800, color:s.col }}>{s.count}</div>
                        <div style={{ fontSize:9, color:C.muted, marginTop:1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={base.card}>
                  {CATEGORIES.map((cat,i)=>(
                    <div key={cat.id} style={{ display:"flex", alignItems:"center", padding:"7px 0",
                      borderBottom:i<CATEGORIES.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ flex:1, fontSize:12,
                        color:catDays[cat.id]>0?C.text:C.muted }}>{cat.label}</div>
                      <div style={{ fontSize:12, fontWeight:700,
                        color:catDays[cat.id]===0?C.green:C.red }}>
                        {catDays[cat.id]===0?"Clean":`${catDays[cat.id]}d`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // ── HISTORY ───────────────────────────────────────────────────────────────
  const HistoryTab = () => {
    const items = buildHistory(histPeriod);
    return (
      <>
        <div style={base.header}>
          <div style={base.hTitle}>History</div>
        </div>
        <div style={base.tabRow}>
          {["weekly","monthly","yearly"].map(p=>(
            <button key={p} style={base.tabBtn(histPeriod===p)} onClick={()=>setHistPeriod(p)}>
              {p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", padding:"7px 20px", background:C.surface,
          borderBottom:`1px solid ${C.border}` }}>
          <div style={{ flex:1, fontSize:9, color:C.muted, textTransform:"uppercase" }}>Period</div>
          {["GFDs","Gambled","Urge score"].map(h=>(
            <div key={h} style={{ width:52, fontSize:9, color:C.muted,
              textTransform:"uppercase", textAlign:"right" }}>{h}</div>
          ))}
        </div>
        {items.length===0 ? (
          <div style={{ textAlign:"center", color:C.muted, padding:50, fontSize:13 }}>No history yet.</div>
        ) : items.map((item,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", padding:"12px 20px",
            borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:3, height:32, borderRadius:2,
              background:item.inProgress?C.accent:C.green, marginRight:12, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>
                {item.label}
                {item.inProgress && (
                  <span style={{ fontSize:9, color:C.accent, background:C.accentDim,
                    borderRadius:4, padding:"1px 5px", marginLeft:6 }}>In progress</span>
                )}
              </div>
              {item.sub && <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{item.sub}</div>}
            </div>
            <div style={{ width:52, textAlign:"right" }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.green }}>{item.stats.gfds}</div>
            </div>
            <div style={{ width:52, textAlign:"right" }}>
              <div style={{ fontSize:14, fontWeight:700,
                color:item.stats.gambled>0?C.red:C.muted }}>{item.stats.gambled}</div>
            </div>
            <div style={{ width:52, textAlign:"right" }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.purple }}>{item.stats.urgeScore}</div>
            </div>
          </div>
        ))}
      </>
    );
  };

  // ── ACCOUNTS ──────────────────────────────────────────────────────────────
  const AccountsTab = () => {

    function getMonths() {
      const months = [];
      let m = ACCOUNTS_START;
      const end = startOfMonthKey(TODAY).slice(0,7);
      while (m <= end) {
        months.push(m);
        const d = parseDate(m+"-01"); d.setMonth(d.getMonth()+1);
        m = dateKey(d).slice(0,7);
      }
      return months;
    }
    const months = getMonths();
    const isCurrentMonth = viewMonth === startOfMonthKey(TODAY).slice(0,7);

    function getStatus(bookieId, monthKey) {
      return accounts[monthKey]?.[bookieId] || "green";
    }

    function cycleStatus(bookieId, monthKey) {
      const current = getStatus(bookieId, monthKey);
      const next = current === "green" ? "amber" : current === "amber" ? "red" : "green";
      setAccounts(p => ({
        ...p,
        [monthKey]: { ...(p[monthKey]||{}), [bookieId]: next }
      }));
    }

    function statusColor(s) {
      return s === "green" ? C.green : s === "amber" ? C.amber : C.red;
    }
    function statusBg(s) {
      return s === "green" ? C.greenDim : s === "amber" ? C.amberDim : "#450a0a";
    }
    function statusLabel(s) {
      return s === "green" ? "Unused" : s === "amber" ? "Partial" : "Maxed";
    }

    function navigateMonth(dir) {
      const d = parseDate(viewMonth+"-01");
      d.setMonth(d.getMonth()+dir);
      const newM = dateKey(d).slice(0,7);
      if (newM >= ACCOUNTS_START && newM <= startOfMonthKey(TODAY).slice(0,7)) {
        setViewMonth(newM);
      }
    }

    const monthLabel = parseDate(viewMonth+"-01").toLocaleDateString("en-GB", { month:"long", year:"numeric" });
    const summary = { green:0, amber:0, red:0 };
    BOOKMAKERS.forEach(b => { summary[getStatus(b.id, viewMonth)]++; });

    return (
      <>
        <div style={base.header}>
          <div style={base.hTitle}>Accounts</div>
        </div>

        {/* Month navigator */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          background:C.surface, padding:"10px 20px", borderBottom:`1px solid ${C.border}` }}>
          <button onClick={()=>navigateMonth(-1)}
            style={{ background:"none", border:"none", color:C.muted2,
              fontSize:22, cursor:"pointer", padding:"2px 8px" }}>‹</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{monthLabel}</div>
            {isCurrentMonth && <div style={{ fontSize:10, color:C.accent }}>Current month</div>}
          </div>
          <button onClick={()=>navigateMonth(1)}
            style={{ background:"none", border:"none",
              color:viewMonth>=startOfMonthKey(TODAY).slice(0,7)?C.border:C.muted2,
              fontSize:22, cursor:"pointer", padding:"2px 8px" }}>›</button>
        </div>

        {/* Summary row */}
        <div style={{ display:"flex", gap:8, padding:"12px 20px",
          borderBottom:`1px solid ${C.border}` }}>
          {[["green",C.green,"Unused"],["amber",C.amber,"Partial"],["red",C.red,"Maxed"]].map(([s,col,lbl])=>(
            <div key={s} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`,
              borderRadius:10, padding:"8px", textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:800, color:col }}>{summary[s]}</div>
              <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Bookmaker list */}
        <div style={{ padding:"12px 20px" }}>
          <div style={base.label}>Tap to update status</div>
          {BOOKMAKERS.map((b,i)=>{
            const status = getStatus(b.id, viewMonth);
            const col = statusColor(status);
            const isExpanded = expandedBookie === b.id;
            const bMonths = months.slice().reverse();

            return (
              <div key={b.id} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12,
                  background:C.card, border:`1px solid ${C.border}`,
                  borderRadius: isExpanded ? "10px 10px 0 0" : 10,
                  padding:"11px 14px" }}>
                  <button onClick={()=>cycleStatus(b.id, viewMonth)}
                    style={{ width:28, height:28, borderRadius:"50%",
                      background:statusBg(status), cursor:"pointer", flexShrink:0,
                      border:`2px solid ${col}` }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{b.label}</div>
                    <div style={{ fontSize:10, color:col, marginTop:1 }}>{statusLabel(status)}</div>
                  </div>
                  <button onClick={()=>setExpandedBookie(isExpanded ? null : b.id)}
                    style={{ background:"none", border:`1px solid ${C.border}`,
                      borderRadius:6, padding:"3px 8px", color:C.muted,
                      fontSize:10, cursor:"pointer" }}>
                    {isExpanded ? "▲" : "▼"}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`,
                    borderTop:"none", borderRadius:"0 0 10px 10px",
                    padding:"10px 14px" }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:8,
                      textTransform:"uppercase", letterSpacing:"0.5px" }}>History</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {bMonths.map(m=>{
                        const ms = getStatus(b.id, m);
                        const mc = statusColor(ms);
                        const ml = parseDate(m+"-01").toLocaleDateString("en-GB",
                          {month:"short", year:"2-digit"});
                        return (
                          <div key={m} style={{ display:"flex", flexDirection:"column",
                            alignItems:"center", gap:3 }}>
                            <div style={{ width:20, height:20, borderRadius:"50%",
                              background:statusBg(ms), border:`2px solid ${mc}` }}/>
                            <div style={{ fontSize:8, color:C.muted }}>{ml}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // ── SAVINGS ───────────────────────────────────────────────────────────────
  const SavingsTab = () => {
    const periods = [
      { label:"Last 7 days",  from:addDays(TODAY,-6), to:TODAY },
      { label:"This month",   from:monthStart,         to:TODAY },
      { label:"Year to date", from:yearStart,           to:TODAY },
      { label:"All time",     from:START_DATE,          to:TODAY },
    ];
    return (
      <>
        <div style={base.header}>
          <div style={base.hTitle}>Savings</div>
          <div style={base.hSub}>Days free × daily rate per category</div>
        </div>
        <div style={base.section}>
          {periods.map(p=>{
            const total = totalSavings(p.from, p.to);
            return (
              <div key={p.label} style={{ marginBottom:18 }}>
                <div style={base.label}>{p.label}</div>
                <div style={base.card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    paddingBottom:10, marginBottom:10, borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:13, color:C.muted2 }}>Total saved</div>
                    <div style={{ fontSize:22, fontWeight:800, color:C.gold,
                      letterSpacing:"-0.5px" }}>{fmt(total)}</div>
                  </div>
                  {CATEGORIES.filter(c=>c.dailyRate).map((cat,i,arr)=>{
                    const saved = catSavings(cat.id, p.from, p.to);
                    return (
                      <div key={cat.id} style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", padding:"6px 0",
                        borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                        <div style={{ fontSize:12, color:C.muted2 }}>{cat.label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.green }}>{fmt(saved||0)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize:10, color:C.muted, lineHeight:1.6, marginTop:4 }}>
            Rates based on total losses Jan 2023 – Jun 2026 ÷ 1,267 days.
            Live Casino excluded (no rate set).
          </div>
          <button onClick={()=>{
            const data = JSON.stringify(logs, null, 2);
            const blob = new Blob([data], {type:"application/json"});
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href=url; a.download=`gt2-backup-${TODAY}.json`; a.click();
            URL.revokeObjectURL(url);
          }} style={{ width:"100%", marginTop:16, padding:12, borderRadius:12,
            border:`1px solid ${C.border}`, background:C.card, color:C.muted2,
            fontSize:13, fontWeight:600, cursor:"pointer" }}>
            ↓ Export data backup
          </button>
        </div>
      </>
    );
  };

  return (
    <div style={base.app}>
      {tab==="dashboard" && <DashboardTab/>}
      {tab==="track"     && <TrackTab/>}
      {tab==="progress"  && <ProgressTab/>}
      {tab==="history"   && <HistoryTab/>}
      {tab==="accounts"  && <AccountsTab/>}
      {tab==="savings"   && <SavingsTab/>}
      <nav style={base.nav}>
        {NAV_ITEMS.map(({id,label,icon})=>(
          <button key={id} style={base.navBtn(tab===id)}
            onClick={()=>{ if(id==="track") setTrackDate(todayKey()); setTab(id); }}>
            <span style={base.navIcon}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
