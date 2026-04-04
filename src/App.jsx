import { useState, useEffect, useCallback } from "react";

const C = {
  bg: "#0a0a0a", surface: "#101010", card: "#151515", cardHover: "#1a1a1a",
  border: "#1e1e1e", borderLight: "#2a2a2a", accent: "#00ff41", accentDim: "#00cc34",
  accentBg: "rgba(0,255,65,0.06)", text: "#e2e2e2", textSec: "#777", textMuted: "#444",
  red: "#ff3b3b", amber: "#f0a000", blue: "#3b8bff", purple: "#a78bfa",
};

const mono = "'SF Mono','Cascadia Code','Fira Code','JetBrains Mono','Consolas',monospace";

const POOLS = [
  { id:"foundry", name:"Foundry USA", slug:"Foundry USA", hq:"Rochester, NY", operator:"Digital Currency Group", founded:2019, focus:"Institutional US miners", notes:"Largest pool by hashrate. Dominant in North American institutional mining. Close ties to DCG ecosystem (Grayscale, Genesis). Aggressively onboarding enterprise clients. Recently announced Zcash mining pool expansion for H1 2026.", threat:"high", tags:["institutional","US-regulated","custody","KYC-required"] },
  { id:"antpool", name:"AntPool", slug:"AntPool", hq:"Beijing, CN", operator:"Bitmain Technologies", founded:2014, focus:"Bitmain hardware buyers", notes:"Vertically integrated with Bitmain hardware manufacturing. Strong in Asia-Pacific. Recently expanding MEV-like strategies with transaction selection. Hardware bundle deals lock in miners.", threat:"high", tags:["hardware-integrated","APAC","vertical"] },
  { id:"f2pool", name:"F2Pool", slug:"F2Pool", hq:"Beijing, CN", operator:"Chun Wang & team", founded:2013, focus:"Multi-coin, global reach", notes:"One of the oldest pools. Historically strong brand. Multi-coin support (40+ coins). Transparent fee structure. High FPPS fees (4%) but reliable payouts. No Stratum V2 support yet.", threat:"medium", tags:["multi-coin","veteran","global","40+-coins"] },
  { id:"viabtc", name:"ViaBTC", slug:"ViaBTC", hq:"Shenzhen, CN", operator:"ViaBTC Technology", founded:2016, focus:"Full-stack crypto services", notes:"Runs CoinEx exchange alongside pool. Offers cloud mining, exchange, wallet ecosystem. Most flexible payout options (PPS+, PPLNS, SOLO). Very low minimum payout (0.0001 BTC). Smart mining auto-switches strategies.", threat:"high", tags:["exchange","cloud-mining","ecosystem","flexible-payouts"] },
  { id:"binance", name:"Binance Pool", slug:"Binance Pool", hq:"Global (Dubai)", operator:"Binance", founded:2020, focus:"Exchange-integrated mining", notes:"Leverages massive Binance user base. Near-zero switching cost for existing Binance users. Lowest FPPS fee in the market at 0.5%. Auto-conversion to altcoins. Custodial tradeoff — funds stay on Binance.", threat:"medium", tags:["exchange","auto-convert","massive-userbase","custodial"] },
  { id:"mara", name:"MARA Pool", slug:"MARA Pool", hq:"Fort Lauderdale, FL", operator:"Marathon Digital Holdings", founded:2021, focus:"Public company, self-mining + 3rd party", notes:"Publicly traded (MARA). Operates own mining fleet plus accepts third-party hashrate. Active in energy partnerships. Recently opened pool to outside miners. Fees not publicly disclosed.", threat:"medium", tags:["public-company","self-mining","energy"] },
  { id:"ocean", name:"OCEAN", slug:"OCEAN", hq:"US (Decentralized)", operator:"Jack Dorsey / Luke Dashjr", founded:2023, focus:"Decentralized, transparent mining", notes:"Non-custodial payouts via TIDES system. Block template transparency — miners can construct own templates via DATUM protocol. Backed by Jack Dorsey. Philosophical appeal to Bitcoin maximalists. 0% fee on block subsidy, 2% on tx fees only.", threat:"low", tags:["decentralized","non-custodial","cypherpunk","DATUM","Stratum-V2"] },
  { id:"braiins", name:"Braiins Pool", slug:"Braiins Pool", hq:"Prague, CZ", operator:"Braiins (ex-Slush Pool)", founded:2010, focus:"The OG pool + firmware", notes:"First ever mining pool (Slush Pool). Braiins OS firmware is widely deployed. Co-developed Stratum V2 protocol. Only major pool with Lightning payouts (no minimum, no fees). Technical credibility is their moat. 0% PPLNS or 2% FPPS.", threat:"medium", tags:["firmware","stratum-v2","OG","lightning-payouts"] },
  { id:"luxor", name:"Luxor Mining", slug:"Luxor", hq:"Seattle, WA", operator:"Luxor Technology", founded:2018, focus:"NA miners, hashrate derivatives", notes:"Hashrate forward contracts and derivatives. Luxor Hashprice index is industry standard. LuxOS firmware (2.8% dev fee). SOC 2 Type 2 certified. Stratum V2 ready. Very low or 0% pool fee depending on tier.", threat:"medium", tags:["derivatives","hashprice-index","firmware","SOC2","stratum-v2"] },
  { id:"sbicrypto", name:"SBI Crypto", slug:"SBI Crypto", hq:"Tokyo, JP", operator:"SBI Holdings", founded:2017, focus:"Japanese institutional market", notes:"Backed by Japanese financial conglomerate SBI. Strong in Japan/Asia institutional segment. Conservative growth, regulatory compliance focus.", threat:"low", tags:["institutional","Japan","regulated"] },
];

const FEE_DATA = [
  { pool:"Foundry USA", fpps:"Tiered*", pplns:"—", ppsPlus:"—", other:"—", minPayout:"Varies (hash-dependent)", payoutFreq:"Daily", lightning:false, stratumV2:false, kyc:true, notes:"Institutional pricing not publicly posted. Tiered by quarterly avg hashrate. KYC/AML required. 0% advertised on some aggregators — verify directly." },
  { pool:"AntPool", fpps:"~4%", pplns:"0%", ppsPlus:"4% reward + 2% tx fees", other:"—", minPayout:"0.001 BTC", payoutFreq:"Daily", lightning:false, stratumV2:false, kyc:false, notes:"0% PPLNS is the loss-leader. PPS+ effectively ~4% total. Bitmain hardware bundle deals may include fee discounts." },
  { pool:"F2Pool", fpps:"4%", pplns:"2%", ppsPlus:"2.5%", other:"—", minPayout:"0.005 BTC", payoutFreq:"Daily", lightning:false, stratumV2:false, kyc:false, notes:"Highest FPPS fee among majors. Transparent published rates. Supports 40+ coins. Higher min payout than most competitors." },
  { pool:"ViaBTC", fpps:"4%", pplns:"2%", ppsPlus:"4%", other:"SOLO available", minPayout:"0.0001 BTC", payoutFreq:"Daily", lightning:false, stratumV2:false, kyc:false, notes:"Lowest min payout in the industry. Smart Mining mode auto-switches between strategies. Also offers SOLO mining option." },
  { pool:"Binance Pool", fpps:"0.5%", pplns:"—", ppsPlus:"—", other:"—", minPayout:"0.0005 BTC", payoutFreq:"Daily", lightning:false, stratumV2:false, kyc:true, notes:"Lowest FPPS fee by far — but custodial. Funds stay on Binance. Seamless conversion to altcoins. Exchange integration is the real product." },
  { pool:"MARA Pool", fpps:"Undisclosed", pplns:"—", ppsPlus:"—", other:"—", minPayout:"Undisclosed", payoutFreq:"Daily", lightning:false, stratumV2:false, kyc:true, notes:"Publicly traded (MARA). Primarily self-mining. Recently opened to 3rd party miners. Terms not publicly available — contact directly." },
  { pool:"OCEAN", fpps:"—", pplns:"—", ppsPlus:"—", other:"TIDES: 0% subsidy + 2% tx fees", minPayout:"No minimum", payoutFreq:"Per block found", lightning:false, stratumV2:true, kyc:false, notes:"Non-custodial. TIDES payout system. Miners can build own block templates via DATUM protocol. 0% on block subsidy, only 2% on transaction fees." },
  { pool:"Braiins Pool", fpps:"2%", pplns:"0%", ppsPlus:"—", other:"—", minPayout:"0.001 BTC / No min (LN)", payoutFreq:"Daily", lightning:true, stratumV2:true, kyc:false, notes:"Only major pool with Lightning payouts (no min, no fees). Co-developed Stratum V2. 0% PPLNS is genuinely free. BraiinsOS firmware gives up to 25% efficiency gain." },
  { pool:"Luxor Mining", fpps:"0–0.7%*", pplns:"—", ppsPlus:"—", other:"LuxOS: 2.8% dev fee", minPayout:"0.001 BTC", payoutFreq:"Daily", lightning:false, stratumV2:true, kyc:false, notes:"Tiered FPPS fees. SOC 2 Type 2 certified. Hashrate derivatives & hedging tools. LuxOS firmware carries separate 2.8% dev fee — factor into total cost." },
  { pool:"SBI Crypto", fpps:"~2%", pplns:"—", ppsPlus:"—", other:"—", minPayout:"0.005 BTC", payoutFreq:"Daily", lightning:false, stratumV2:false, kyc:true, notes:"Japanese institutional pool. Backed by SBI Holdings. Limited public fee documentation — contact for enterprise terms." },
];

const TICKER_ITEMS = ["HASHRATE DISTRIBUTION","FEE COMPARISON","POOL RANKINGS","DIFFICULTY ADJUSTMENT","COMPETITOR INTELLIGENCE","TEAM INTEL","MARKET OVERVIEW","MEMPOOL STATUS","PAYOUT STRATEGIES","BLOCK REWARDS"];

// Supabase config
const SUPABASE_URL = "https://jbxytpedbjtxitmglscf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieHl0cGVkYmp0eGl0bWdsc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTUyNDcsImV4cCI6MjA5MDg5MTI0N30.nPwQNG7H9Q4k2c89EaI0m-5GgLiziznxFFgmdCNXn9o";
const sbHeaders = {"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json","Prefer":"return=minimal"};

const supabase = {
  async getAll() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/intel_notes?order=ts.desc`, {headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}});
      if(!res.ok) return [];
      return await res.json();
    } catch { return []; }
  },
  async insert(note) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/intel_notes`, {method:"POST",headers:sbHeaders,body:JSON.stringify(note)});
    } catch(e) { console.error(e); }
  },
  async remove(id) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/intel_notes?id=eq.${id}`, {method:"DELETE",headers:sbHeaders});
    } catch(e) { console.error(e); }
  },
};

function StatusDot({color}){return <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:color,marginRight:6,boxShadow:`0 0 6px ${color}`}}/>}

function SectionHeader({num,title,subtitle,live}){
  return(
    <div style={{marginBottom:24,display:"flex",alignItems:"baseline",gap:16,flexWrap:"wrap"}}>
      <span style={{fontFamily:mono,fontSize:42,fontWeight:600,color:C.border,lineHeight:1}}>{num}</span>
      <div>
        <div style={{fontFamily:mono,fontSize:13,fontWeight:500,color:C.text,letterSpacing:"0.08em",display:"flex",alignItems:"center",gap:8}}>
          {title}
          {live&&<span style={{fontSize:9,background:C.accent,color:"#000",padding:"2px 6px",borderRadius:2,fontWeight:700,letterSpacing:"0.1em"}}>LIVE</span>}
        </div>
        {subtitle&&<div style={{fontFamily:mono,fontSize:11,color:C.textMuted,marginTop:2}}>{subtitle}</div>}
      </div>
    </div>
  );
}

function MetricCard({label,value,sub,accent}){
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,padding:"14px 16px",fontFamily:mono,minWidth:0}}>
      <div style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em",marginBottom:6}}>{label}</div>
      <div style={{fontSize:20,fontWeight:600,color:accent?C.accent:C.text,lineHeight:1.2}}>{value||"—"}</div>
      {sub&&<div style={{fontSize:10,color:C.textSec,marginTop:4}}>{sub}</div>}
    </div>
  );
}

function ThreatBadge({level}){
  const colors={high:C.red,medium:C.amber,low:C.textSec};
  return <span style={{fontFamily:mono,fontSize:9,color:colors[level],border:`1px solid ${colors[level]}`,padding:"2px 6px",letterSpacing:"0.08em"}}>{level.toUpperCase()}</span>;
}

function Tag({text}){return <span style={{fontFamily:mono,fontSize:9,color:C.textSec,background:C.surface,border:`1px solid ${C.border}`,padding:"2px 6px",letterSpacing:"0.04em"}}>{text}</span>}

function BoolBadge({val}){
  return val
    ? <span style={{fontSize:9,color:C.accent,border:`1px solid ${C.accent}`,padding:"1px 5px",letterSpacing:"0.06em"}}>YES</span>
    : <span style={{fontSize:9,color:C.textMuted}}>NO</span>;
}

export default function App(){
  const [authenticated,setAuthenticated]=useState(()=>{
    try { return sessionStorage.getItem("inteldash_auth")==="1"; } catch { return false; }
  });
  const [pwInput,setPwInput]=useState("");
  const [pwError,setPwError]=useState(false);

  const ACCESS_PASSWORD = "inteldash2026";

  const handleLogin=()=>{
    if(pwInput===ACCESS_PASSWORD){
      setAuthenticated(true);
      try { sessionStorage.setItem("inteldash_auth","1"); } catch {}
    } else {
      setPwError(true);
      setTimeout(()=>setPwError(false),2000);
    }
  };

  if(!authenticated){
    return(
      <div style={{background:C.bg,color:C.text,fontFamily:mono,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:360,padding:32}}>
          <div style={{fontSize:24,fontWeight:700,letterSpacing:"0.12em",marginBottom:8,textAlign:"center"}}>YOUNES INTELDASH</div>
          <div style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em",textAlign:"center",marginBottom:32}}>MINING POOL INTELLIGENCE // RESTRICTED ACCESS</div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9,color:C.textMuted,letterSpacing:"0.08em",marginBottom:6}}>ACCESS CODE</div>
            <input
              type="password"
              value={pwInput}
              onChange={e=>{setPwInput(e.target.value);setPwError(false)}}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="Enter access code"
              autoFocus
              style={{width:"100%",fontFamily:mono,fontSize:13,padding:"10px 12px",background:C.surface,border:`1px solid ${pwError?C.red:C.border}`,color:C.text,outline:"none",boxSizing:"border-box",transition:"border-color 0.2s"}}
            />
          </div>
          {pwError&&<div style={{fontSize:10,color:C.red,marginBottom:12}}>Invalid access code. Try again.</div>}
          <button onClick={handleLogin} style={{width:"100%",fontFamily:mono,fontSize:11,padding:"10px 20px",background:"transparent",color:pwInput?C.accent:C.textMuted,border:`1px solid ${pwInput?C.accent:C.border}`,cursor:pwInput?"pointer":"default",letterSpacing:"0.06em"}}>
            {">"} AUTHENTICATE
          </button>
          <div style={{fontSize:9,color:C.textMuted,textAlign:"center",marginTop:24}}>INTERNAL USE ONLY</div>
        </div>
      </div>
    );
  }

  const [activeTab,setActiveTab]=useState("overview");
  const [pools,setPools]=useState([]);
  const [fees,setFees]=useState(null);
  const [difficulty,setDifficulty]=useState(null);
  const [btcPrice,setBtcPrice]=useState(null);
  const [mempoolInfo,setMempoolInfo]=useState(null);
  const [networkHashrate,setNetworkHashrate]=useState(null);
  const [intelNotes,setIntelNotes]=useState([]);
  const [noteForm,setNoteForm]=useState({author:"",pool:"",content:"",type:"general"});
  const [loading,setLoading]=useState(true);
  const [lastUpdate,setLastUpdate]=useState(null);
  const [expandedPool,setExpandedPool]=useState(null);
  const [filterThreat,setFilterThreat]=useState("all");
  const [feeSort,setFeeSort]=useState("pool");
  const [feeExpanded,setFeeExpanded]=useState(null);
  const [feePayout,setFeePayout]=useState("fpps");

  const fetchData=useCallback(async()=>{
    try{
      const [poolsRes,feesRes,diffRes,priceRes,mempoolRes,hashRes]=await Promise.allSettled([
        fetch("https://mempool.space/api/v1/mining/pools/1w").then(r=>r.json()),
        fetch("https://mempool.space/api/v1/fees/recommended").then(r=>r.json()),
        fetch("https://mempool.space/api/v1/difficulty-adjustment").then(r=>r.json()),
        fetch("https://mempool.space/api/v1/prices").then(r=>r.json()),
        fetch("https://mempool.space/api/mempool").then(r=>r.json()),
        fetch("https://mempool.space/api/v1/mining/hashrate/3d").then(r=>r.json()),
      ]);
      if(poolsRes.status==="fulfilled")setPools(poolsRes.value.pools||[]);
      if(feesRes.status==="fulfilled")setFees(feesRes.value);
      if(diffRes.status==="fulfilled")setDifficulty(diffRes.value);
      if(priceRes.status==="fulfilled")setBtcPrice(priceRes.value);
      if(mempoolRes.status==="fulfilled")setMempoolInfo(mempoolRes.value);
      if(hashRes.status==="fulfilled")setNetworkHashrate(hashRes.value.currentHashrate);
      setLastUpdate(new Date());
    }catch(e){console.error(e)}
    setLoading(false);
  },[]);

  useEffect(()=>{
    fetchData();
    supabase.getAll().then(setIntelNotes);
    const iv=setInterval(fetchData,120000);
    const intelIv=setInterval(()=>supabase.getAll().then(setIntelNotes),30000);
    return()=>{clearInterval(iv);clearInterval(intelIv)};
  },[fetchData]);

  const submitNote=async()=>{
    if(!noteForm.content.trim()||!noteForm.author.trim())return;
    const note={...noteForm,id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),ts:Date.now()};
    setIntelNotes(prev=>[note,...prev]);
    setNoteForm({author:noteForm.author,pool:"",content:"",type:"general"});
    await supabase.insert(note);
    const fresh=await supabase.getAll();
    setIntelNotes(fresh);
  };

  const deleteNote=async(id)=>{
    setIntelNotes(prev=>prev.filter(n=>n.id!==id));
    await supabase.remove(id);
  };

  const fmtHash=(h)=>{if(!h)return"—";if(h>=1e18)return(h/1e18).toFixed(1)+" EH/s";if(h>=1e15)return(h/1e15).toFixed(1)+" PH/s";return h.toFixed(0)};
  const fmtNum=(n)=>n?n.toLocaleString():"—";
  const fmtTime=(d)=>d?d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}):"—";
  const fmtDate=(ts)=>new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const totalBlocks=pools.reduce((s,p)=>s+(p.blockCount||0),0);

  const tabs=[
    {id:"overview",label:"OVERVIEW"},
    {id:"fees",label:"FEE_MATRIX"},
    {id:"pools",label:"POOL_RANKINGS"},
    {id:"competitors",label:"COMPETITOR_INTEL"},
    {id:"intel",label:"TEAM_NOTES"},
  ];

  const sortedFees=[...FEE_DATA].sort((a,b)=>{
    if(feeSort==="pool")return a.pool.localeCompare(b.pool);
    const parseF=(v)=>{if(!v||v==="—"||v.includes("Tiered")||v.includes("Undisclosed"))return 99;return parseFloat(v)};
    if(feeSort==="fpps")return parseF(a.fpps)-parseF(b.fpps);
    if(feeSort==="pplns")return parseF(a.pplns)-parseF(b.pplns);
    return 0;
  });

  const filteredCompetitors=filterThreat==="all"?POOLS:POOLS.filter(p=>p.threat===filterThreat);

  return(
    <div style={{background:C.bg,color:C.text,fontFamily:mono,minHeight:"100vh",fontSize:13}}>
      {/* STATUS BAR */}
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontWeight:700,fontSize:20,letterSpacing:"0.12em",color:C.text}}>YOUNES INTELDASH</span>
          <span style={{fontSize:10,color:C.textMuted}}>|</span>
          <span style={{fontSize:10,color:C.accent,display:"flex",alignItems:"center"}}><StatusDot color={C.accent}/>STATUS: ONLINE</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,fontSize:10,color:C.textMuted}}>
          <span>LAST SYNC: {fmtTime(lastUpdate)}</span>
          <span>UTC {new Date().toISOString().slice(11,16)}</span>
        </div>
      </div>

      {/* TICKER */}
      <div style={{borderBottom:`1px solid ${C.border}`,overflow:"hidden",height:28,display:"flex",alignItems:"center",background:C.surface}}>
        <div style={{display:"flex",gap:40,animation:"tickerScroll 30s linear infinite",whiteSpace:"nowrap",paddingLeft:20}}>
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((t,i)=>(
            <span key={i} style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em"}}>
              <span style={{color:C.accent,marginRight:6}}>{">"}</span>{t}
            </span>
          ))}
        </div>
        <style>{`@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      </div>

      {/* NAV */}
      <div style={{borderBottom:`1px solid ${C.border}`,display:"flex",gap:0,background:C.surface,overflowX:"auto"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            fontFamily:mono,fontSize:11,letterSpacing:"0.06em",padding:"10px 20px",background:activeTab===t.id?C.bg:"transparent",
            color:activeTab===t.id?C.accent:C.textSec,border:"none",borderBottom:activeTab===t.id?`1px solid ${C.accent}`:"1px solid transparent",
            cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"
          }}>{t.label}</button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={fetchData} style={{fontFamily:mono,fontSize:10,padding:"10px 16px",background:"transparent",color:C.textSec,border:"none",cursor:"pointer",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>[REFRESH_DATA]</button>
      </div>

      <div style={{padding:"28px 20px",maxWidth:1200,margin:"0 auto"}}>

        {/* OVERVIEW */}
        {activeTab==="overview"&&(
          <div>
            <SectionHeader num="01" title="MARKET_OVERVIEW" subtitle="Real-time Bitcoin mining network metrics" live/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",gap:10,marginBottom:32}}>
              <MetricCard label="BTC PRICE" value={btcPrice?`$${fmtNum(btcPrice.USD)}`:null} accent/>
              <MetricCard label="NETWORK HASHRATE" value={networkHashrate?fmtHash(networkHashrate):null}/>
              <MetricCard label="DIFFICULTY" value={difficulty?(difficulty.difficultyChange>0?"+":"")+difficulty.difficultyChange?.toFixed(2)+"%":null} sub={difficulty?`Next adj: ~${Math.abs(difficulty.remainingBlocks||0)} blocks`:""}/>
              <MetricCard label="FASTEST FEE" value={fees?`${fees.fastestFee} sat/vB`:null}/>
              <MetricCard label="MEMPOOL SIZE" value={mempoolInfo?`${(mempoolInfo.vsize/1e6).toFixed(1)} MvB`:null} sub={mempoolInfo?`${fmtNum(mempoolInfo.count)} txns`:""}/>
              <MetricCard label="POOLS TRACKED (7D)" value={pools.length>0?pools.length:null} sub={`${totalBlocks} blocks mined`}/>
            </div>
            <SectionHeader num="02" title="FEE_ENVIRONMENT" subtitle="Current recommended fee tiers" live/>
            {fees&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:10,marginBottom:32}}>
                {[{label:"NO PRIORITY",val:fees.economyFee,tag:"60+ min"},{label:"LOW PRIORITY",val:fees.hourFee,tag:"~60 min"},{label:"MEDIUM",val:fees.halfHourFee,tag:"~30 min"},{label:"HIGH PRIORITY",val:fees.fastestFee,tag:"~10 min"}].map(f=>(
                  <div key={f.label} style={{background:C.card,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
                    <div style={{fontSize:9,color:C.textMuted,letterSpacing:"0.1em",marginBottom:4}}>{f.label}</div>
                    <div style={{fontSize:22,fontWeight:600,color:C.text}}>{f.val}<span style={{fontSize:11,color:C.textSec,marginLeft:4}}>sat/vB</span></div>
                    <div style={{fontSize:10,color:C.textSec,marginTop:2}}>{f.tag}</div>
                  </div>
                ))}
              </div>
            )}
            <SectionHeader num="03" title="TOP_POOLS // 7D" subtitle="Hashrate distribution — last 7 days"/>
            <div style={{border:`1px solid ${C.border}`,background:C.card,marginBottom:32}}>
              <div style={{display:"grid",gridTemplateColumns:"40px 1fr 100px 80px 80px",padding:"8px 14px",fontSize:9,color:C.textMuted,borderBottom:`1px solid ${C.border}`,letterSpacing:"0.08em"}}><span>#</span><span>POOL</span><span>BLOCKS</span><span>SHARE</span><span>EMPTY</span></div>
              {pools.slice(0,12).map((p,i)=>{const share=totalBlocks>0?((p.blockCount/totalBlocks)*100):0;return(
                <div key={p.slug} style={{display:"grid",gridTemplateColumns:"40px 1fr 100px 80px 80px",padding:"8px 14px",borderBottom:`1px solid ${C.border}`,alignItems:"center",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{color:i<3?C.accent:C.textSec,fontSize:11}}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{color:C.text,fontSize:12,fontWeight:500}}>{p.name}</span>
                  <span style={{color:C.textSec}}>{p.blockCount}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{flex:1,height:3,background:C.border,borderRadius:2,maxWidth:40}}><div style={{height:3,background:i<3?C.accent:C.textSec,borderRadius:2,width:`${Math.min(share*2.5,100)}%`}}/></div>
                    <span style={{fontSize:11,color:i<3?C.accent:C.textSec}}>{share.toFixed(1)}%</span>
                  </div>
                  <span style={{color:C.textSec}}>{p.emptyBlocks||0}</span>
                </div>)})}
            </div>
            <SectionHeader num="04" title="RECENT_INTEL" subtitle="Latest team submissions"/>
            {intelNotes.length===0?<div style={{padding:20,color:C.textMuted,fontSize:11,border:`1px dashed ${C.border}`,textAlign:"center"}}>No intel yet. Go to TEAM_NOTES to add.</div>
            :<div style={{display:"flex",flexDirection:"column",gap:8}}>{intelNotes.slice(0,5).map(n=>(
              <div key={n.id} style={{background:C.card,border:`1px solid ${C.border}`,padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:10,color:C.accent}}>@{n.author} {n.pool&&<span style={{color:C.textSec}}>// {n.pool}</span>}</span>
                  <span style={{fontSize:9,color:C.textMuted}}>{fmtDate(n.ts)}</span>
                </div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{n.content}</div>
              </div>))}</div>}
          </div>
        )}

        {/* FEE MATRIX */}
        {activeTab==="fees"&&(
          <div>
            <SectionHeader num="01" title="FEE_COMPARISON_MATRIX" subtitle="Side-by-side fee structures, payout models, and thresholds for all major pools"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:10,marginBottom:28}}>
              <div style={{background:C.accentBg,border:`1px solid ${C.accent}`,padding:"12px 14px"}}>
                <div style={{fontSize:9,color:C.accent,letterSpacing:"0.1em",marginBottom:4}}>LOWEST FPPS FEE</div>
                <div style={{fontSize:18,fontWeight:600,color:C.accent}}>0.5%</div>
                <div style={{fontSize:10,color:C.textSec,marginTop:2}}>Binance Pool (custodial)</div>
              </div>
              <div style={{background:C.accentBg,border:`1px solid ${C.accent}`,padding:"12px 14px"}}>
                <div style={{fontSize:9,color:C.accent,letterSpacing:"0.1em",marginBottom:4}}>LOWEST PPLNS FEE</div>
                <div style={{fontSize:18,fontWeight:600,color:C.accent}}>0%</div>
                <div style={{fontSize:10,color:C.textSec,marginTop:2}}>AntPool / Braiins Pool</div>
              </div>
              <div style={{background:"rgba(59,139,255,0.06)",border:`1px solid ${C.blue}`,padding:"12px 14px"}}>
                <div style={{fontSize:9,color:C.blue,letterSpacing:"0.1em",marginBottom:4}}>LOWEST MIN PAYOUT</div>
                <div style={{fontSize:18,fontWeight:600,color:C.blue}}>0.0001 BTC</div>
                <div style={{fontSize:10,color:C.textSec,marginTop:2}}>ViaBTC</div>
              </div>
              <div style={{background:"rgba(167,139,250,0.06)",border:`1px solid ${C.purple}`,padding:"12px 14px"}}>
                <div style={{fontSize:9,color:C.purple,letterSpacing:"0.1em",marginBottom:4}}>LIGHTNING PAYOUTS</div>
                <div style={{fontSize:18,fontWeight:600,color:C.purple}}>1 pool</div>
                <div style={{fontSize:10,color:C.textSec,marginTop:2}}>Braiins Pool (no min, no fee)</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              <span style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em"}}>HIGHLIGHT:</span>
              {["fpps","pplns","ppsPlus"].map(m=>(
                <button key={m} onClick={()=>setFeePayout(m)} style={{fontFamily:mono,fontSize:10,padding:"4px 10px",cursor:"pointer",background:feePayout===m?C.accentBg:"transparent",color:feePayout===m?C.accent:C.textSec,border:`1px solid ${feePayout===m?C.accent:C.border}`}}>
                  {m==="ppsPlus"?"PPS+":m.toUpperCase()}
                </button>
              ))}
              <div style={{flex:1}}/>
              <span style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em"}}>SORT:</span>
              {["pool","fpps","pplns"].map(s=>(
                <button key={s} onClick={()=>setFeeSort(s)} style={{fontFamily:mono,fontSize:10,padding:"4px 10px",cursor:"pointer",background:feeSort===s?C.accentBg:"transparent",color:feeSort===s?C.accent:C.textSec,border:`1px solid ${feeSort===s?C.accent:C.border}`}}>
                  {s==="fpps"?"BY FPPS":s==="pplns"?"BY PPLNS":"BY NAME"}
                </button>
              ))}
            </div>
            <div style={{border:`1px solid ${C.border}`,background:C.card,marginBottom:28,overflowX:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:"130px 65px 65px 65px 110px 140px 65px 50px 50px 50px",minWidth:850,padding:"10px 14px",fontSize:9,color:C.textMuted,borderBottom:`1px solid ${C.border}`,letterSpacing:"0.08em",gap:4}}>
                <span>POOL</span><span>FPPS</span><span>PPLNS</span><span>PPS+</span><span>OTHER</span><span>MIN PAYOUT</span><span>FREQ</span><span style={{textAlign:"center"}}>LN</span><span style={{textAlign:"center"}}>SV2</span><span style={{textAlign:"center"}}>KYC</span>
              </div>
              {sortedFees.map(row=>{
                const expanded=feeExpanded===row.pool;
                return(
                  <div key={row.pool}>
                    <div style={{display:"grid",gridTemplateColumns:"130px 65px 65px 65px 110px 140px 65px 50px 50px 50px",minWidth:850,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,alignItems:"center",gap:4,cursor:"pointer",transition:"background 0.1s"}}
                      onClick={()=>setFeeExpanded(expanded?null:row.pool)}
                      onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{color:C.text,fontSize:11,fontWeight:500,display:"flex",alignItems:"center",gap:4}}>
                        <span style={{color:C.textMuted,fontSize:9}}>{expanded?"[-]":"[+]"}</span>
                        {row.pool.replace(" Mining","").replace(" Pool","")}
                      </span>
                      <span style={{fontSize:11,color:feePayout==="fpps"&&row.fpps!=="—"&&!row.fpps.includes("Tiered")&&!row.fpps.includes("Undisclosed")?C.accent:row.fpps==="—"||row.fpps.includes("Tiered")||row.fpps.includes("Undisclosed")?C.textMuted:C.text,fontWeight:feePayout==="fpps"?600:400}}>{row.fpps}</span>
                      <span style={{fontSize:11,color:feePayout==="pplns"&&row.pplns!=="—"?C.accent:row.pplns==="—"?C.textMuted:C.text,fontWeight:feePayout==="pplns"?600:400}}>{row.pplns}</span>
                      <span style={{fontSize:11,color:feePayout==="ppsPlus"&&row.ppsPlus!=="—"?C.accent:row.ppsPlus==="—"?C.textMuted:C.text,fontWeight:feePayout==="ppsPlus"?600:400}}>{row.ppsPlus}</span>
                      <span style={{fontSize:10,color:row.other!=="—"?C.blue:C.textMuted}}>{row.other}</span>
                      <span style={{fontSize:10,color:C.textSec}}>{row.minPayout}</span>
                      <span style={{fontSize:10,color:C.textSec}}>{row.payoutFreq}</span>
                      <span style={{textAlign:"center"}}><BoolBadge val={row.lightning}/></span>
                      <span style={{textAlign:"center"}}><BoolBadge val={row.stratumV2}/></span>
                      <span style={{textAlign:"center"}}>{row.kyc?<span style={{fontSize:9,color:C.amber}}>YES</span>:<span style={{fontSize:9,color:C.textMuted}}>NO</span>}</span>
                    </div>
                    {expanded&&(
                      <div style={{padding:"12px 14px 14px 40px",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
                        <div style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em",marginBottom:4}}>ANALYST NOTES</div>
                        <div style={{fontSize:12,color:C.textSec,lineHeight:1.6,maxWidth:800}}>{row.notes}</div>
                        {intelNotes.filter(n=>row.pool.toLowerCase().includes((n.pool||"---").split(" ")[0].toLowerCase())).length>0&&(
                          <div style={{marginTop:10,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                            <div style={{fontSize:9,color:C.accent,letterSpacing:"0.08em",marginBottom:4}}>TEAM INTEL</div>
                            {intelNotes.filter(n=>row.pool.toLowerCase().includes((n.pool||"---").split(" ")[0].toLowerCase())).slice(0,3).map(n=>(
                              <div key={n.id} style={{fontSize:11,color:C.textSec,marginBottom:2}}><span style={{color:C.accent}}>@{n.author}</span>: {n.content}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <SectionHeader num="02" title="PAYOUT_MODELS" subtitle="How each model works"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:10,marginBottom:28}}>
              {[
                {model:"FPPS",full:"Full Pay Per Share",desc:"Pool pays block reward AND estimated tx fees per share. Most predictable. Pool absorbs all variance. Typically 2–4% fee.",color:C.accent},
                {model:"PPS+",full:"Pay Per Share Plus",desc:"Block reward at fixed PPS rate. Tx fees via PPLNS (variable). Stable base + upside from high-fee periods.",color:C.blue},
                {model:"PPLNS",full:"Pay Per Last N Shares",desc:"Paid only when pool finds block, proportional to recent shares. Lower fees (0–2%) but variance with pool luck.",color:C.amber},
                {model:"TIDES",full:"Transparent Index of Distinct Extended Shares",desc:"OCEAN's model. Non-custodial payouts from coinbase tx. 0% on subsidy, 2% on tx fees. Miners build own templates.",color:C.purple},
              ].map(m=>(
                <div key={m.model} style={{background:C.card,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:14,fontWeight:600,color:m.color}}>{m.model}</span>
                    <span style={{fontSize:9,color:C.textMuted}}>{m.full}</span>
                  </div>
                  <div style={{fontSize:11,color:C.textSec,lineHeight:1.6}}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POOL RANKINGS */}
        {activeTab==="pools"&&(
          <div>
            <SectionHeader num="01" title="POOL_RANKINGS" subtitle="Detailed mining pool performance — 7 day window" live/>
            <div style={{border:`1px solid ${C.border}`,background:C.card}}>
              <div style={{display:"grid",gridTemplateColumns:"40px 1fr 80px 80px 80px 70px",padding:"10px 14px",fontSize:9,color:C.textMuted,borderBottom:`1px solid ${C.border}`,letterSpacing:"0.08em"}}><span>#</span><span>POOL</span><span>BLOCKS</span><span>SHARE</span><span>EMPTY</span><span>AVG/DAY</span></div>
              {pools.map((p,i)=>{const share=totalBlocks>0?((p.blockCount/totalBlocks)*100):0;return(
                <div key={p.slug} style={{display:"grid",gridTemplateColumns:"40px 1fr 80px 80px 80px 70px",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{color:i<3?C.accent:C.textMuted}}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{color:C.text,fontSize:12,fontWeight:500}}>{p.name}</span>
                  <span style={{color:C.text}}>{p.blockCount}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:40,height:3,background:C.border,borderRadius:2}}><div style={{height:3,background:share>20?C.accent:share>10?C.blue:C.textSec,borderRadius:2,width:`${Math.min(share*2.5,100)}%`}}/></div>
                    <span style={{fontSize:11,color:C.text}}>{share.toFixed(1)}%</span>
                  </div>
                  <span style={{color:(p.emptyBlocks||0)>2?C.amber:C.textSec}}>{p.emptyBlocks||0}</span>
                  <span style={{color:C.textSec}}>{(p.blockCount/7).toFixed(1)}</span>
                </div>)})}
            </div>
            {pools.length===0&&loading&&<div style={{padding:40,textAlign:"center",color:C.textMuted}}>Loading from mempool.space...</div>}
          </div>
        )}

        {/* COMPETITORS */}
        {activeTab==="competitors"&&(
          <div>
            <SectionHeader num="01" title="COMPETITOR_INTELLIGENCE" subtitle="Profiles of major mining pool operators"/>
            <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
              {["all","high","medium","low"].map(f=>(
                <button key={f} onClick={()=>setFilterThreat(f)} style={{
                  fontFamily:mono,fontSize:10,padding:"5px 12px",letterSpacing:"0.06em",
                  background:filterThreat===f?(f==="high"?"rgba(255,59,59,0.12)":f==="medium"?"rgba(240,160,0,0.12)":f==="low"?"rgba(119,119,119,0.12)":C.accentBg):"transparent",
                  color:filterThreat===f?(f==="high"?C.red:f==="medium"?C.amber:f==="low"?C.textSec:C.accent):C.textMuted,
                  border:`1px solid ${filterThreat===f?(f==="high"?C.red:f==="medium"?C.amber:f==="low"?C.textSec:C.accent):C.border}`,cursor:"pointer"
                }}>{f==="all"?"ALL":`THREAT: ${f.toUpperCase()}`}</button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filteredCompetitors.map(comp=>{
                const livePool=pools.find(p=>p.name?.toLowerCase().includes(comp.slug.split(" ")[0].toLowerCase()));
                const share=livePool&&totalBlocks>0?((livePool.blockCount/totalBlocks)*100):null;
                const expanded=expandedPool===comp.id;
                return(
                  <div key={comp.id} style={{background:C.card,border:`1px solid ${expanded?C.borderLight:C.border}`,cursor:"pointer"}}
                    onClick={()=>setExpandedPool(expanded?null:comp.id)}>
                    <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:14,fontWeight:600,color:C.text}}>{comp.name}</span>
                          <ThreatBadge level={comp.threat}/>
                          {share!==null&&<span style={{fontSize:10,color:C.accent,background:C.accentBg,padding:"2px 8px"}}>{share.toFixed(1)}% HASHRATE</span>}
                        </div>
                        <div style={{fontSize:10,color:C.textSec,display:"flex",gap:12,flexWrap:"wrap"}}>
                          <span>{comp.hq}</span><span style={{color:C.textMuted}}>|</span><span>{comp.operator}</span><span style={{color:C.textMuted}}>|</span><span>EST. {comp.founded}</span>
                        </div>
                      </div>
                      <span style={{fontSize:11,color:C.textMuted}}>{expanded?"[-]":"[+]"}</span>
                    </div>
                    {expanded&&(
                      <div style={{padding:"0 16px 16px",borderTop:`1px solid ${C.border}`,paddingTop:14}}>
                        <div style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em",marginBottom:6}}>FOCUS</div>
                        <div style={{fontSize:12,color:C.text,marginBottom:12}}>{comp.focus}</div>
                        <div style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em",marginBottom:6}}>INTELLIGENCE NOTES</div>
                        <div style={{fontSize:12,color:C.textSec,lineHeight:1.6,marginBottom:12}}>{comp.notes}</div>
                        {livePool&&(
                          <div style={{marginBottom:12}}>
                            <div style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em",marginBottom:6}}>LIVE METRICS (7D)</div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))",gap:8}}>
                              {[{l:"BLOCKS",v:livePool.blockCount,c:C.accent},{l:"SHARE",v:share?.toFixed(2)+"%",c:C.text},{l:"EMPTY",v:livePool.emptyBlocks||0,c:(livePool.emptyBlocks||0)>0?C.amber:C.textSec},{l:"AVG/DAY",v:(livePool.blockCount/7).toFixed(1),c:C.textSec}].map(m=>(
                                <div key={m.l} style={{background:C.surface,padding:"8px 10px"}}><div style={{fontSize:9,color:C.textMuted}}>{m.l}</div><div style={{fontSize:16,fontWeight:600,color:m.c}}>{m.v}</div></div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{comp.tags.map(t=><Tag key={t} text={t}/>)}</div>
                        {intelNotes.filter(n=>n.pool?.toLowerCase()===comp.name.toLowerCase()).length>0&&(
                          <div style={{marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                            <div style={{fontSize:10,color:C.accent,letterSpacing:"0.08em",marginBottom:6}}>TEAM INTEL</div>
                            {intelNotes.filter(n=>n.pool?.toLowerCase()===comp.name.toLowerCase()).map(n=>(
                              <div key={n.id} style={{fontSize:11,color:C.textSec,marginBottom:4,lineHeight:1.5}}><span style={{color:C.accent}}>@{n.author}</span> ({fmtDate(n.ts)}): {n.content}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TEAM NOTES */}
        {activeTab==="intel"&&(
          <div>
            <SectionHeader num="01" title="SUBMIT_INTEL" subtitle="Add insider data, observations, or competitive intelligence"/>
            <div style={{background:C.card,border:`1px solid ${C.border}`,padding:16,marginBottom:28}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div>
                  <div style={{fontSize:9,color:C.textMuted,letterSpacing:"0.08em",marginBottom:4}}>YOUR NAME *</div>
                  <input value={noteForm.author} onChange={e=>setNoteForm(p=>({...p,author:e.target.value}))} placeholder="e.g. Younes"
                    style={{width:"100%",fontFamily:mono,fontSize:12,padding:"8px 10px",background:C.surface,border:`1px solid ${C.border}`,color:C.text,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:9,color:C.textMuted,letterSpacing:"0.08em",marginBottom:4}}>RELATED POOL</div>
                  <select value={noteForm.pool} onChange={e=>setNoteForm(p=>({...p,pool:e.target.value}))}
                    style={{width:"100%",fontFamily:mono,fontSize:12,padding:"8px 10px",background:C.surface,border:`1px solid ${C.border}`,color:C.text,outline:"none",boxSizing:"border-box"}}>
                    <option value="">General / Market-wide</option>
                    {POOLS.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:9,color:C.textMuted,letterSpacing:"0.08em",marginBottom:4}}>INTEL TYPE</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["general","rumor","confirmed","strategic"].map(t=>(
                    <button key={t} onClick={()=>setNoteForm(p=>({...p,type:t}))} style={{fontFamily:mono,fontSize:10,padding:"4px 10px",cursor:"pointer",background:noteForm.type===t?C.accentBg:"transparent",color:noteForm.type===t?C.accent:C.textSec,border:`1px solid ${noteForm.type===t?C.accent:C.border}`}}>{t.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:9,color:C.textMuted,letterSpacing:"0.08em",marginBottom:4}}>CONTENT *</div>
                <textarea value={noteForm.content} onChange={e=>setNoteForm(p=>({...p,content:e.target.value}))}
                  placeholder="Share what you know — market moves, insider info, rumors, observations..." rows={3}
                  style={{width:"100%",fontFamily:mono,fontSize:12,padding:"8px 10px",background:C.surface,border:`1px solid ${C.border}`,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.5}}/>
              </div>
              <button onClick={submitNote} style={{fontFamily:mono,fontSize:11,padding:"8px 20px",background:"transparent",letterSpacing:"0.06em",color:(noteForm.content.trim()&&noteForm.author.trim())?C.accent:C.textMuted,border:`1px solid ${(noteForm.content.trim()&&noteForm.author.trim())?C.accent:C.border}`,cursor:(noteForm.content.trim()&&noteForm.author.trim())?"pointer":"default"}}>{">"} SUBMIT_INTEL</button>
            </div>
            <SectionHeader num="02" title="INTEL_FEED" subtitle={`${intelNotes.length} entries from the team`}/>
            {intelNotes.length===0?<div style={{padding:40,textAlign:"center",color:C.textMuted,border:`1px dashed ${C.border}`}}>No intelligence yet. Use the form above.</div>
            :<div style={{display:"flex",flexDirection:"column",gap:8}}>
              {intelNotes.map(n=>(
                <div key={n.id} style={{background:C.card,border:`1px solid ${C.border}`,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:C.accent,fontWeight:500}}>@{n.author}</span>
                      {n.pool&&<span style={{fontSize:10,color:C.blue,background:"rgba(59,139,255,0.1)",padding:"1px 6px"}}>{n.pool}</span>}
                      <span style={{fontSize:9,color:n.type==="confirmed"?C.accent:n.type==="rumor"?C.amber:n.type==="strategic"?C.blue:C.textMuted,border:"1px solid",padding:"1px 5px"}}>{n.type?.toUpperCase()}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:9,color:C.textMuted}}>{fmtDate(n.ts)}</span>
                      <button onClick={e=>{e.stopPropagation();deleteNote(n.id)}} style={{fontFamily:mono,fontSize:9,color:C.textMuted,background:"transparent",border:"none",cursor:"pointer",padding:0}}>[x]</button>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{n.content}</div>
                </div>
              ))}
            </div>}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginTop:40}}>
        <div style={{fontSize:10,color:C.textMuted,display:"flex",gap:16,alignItems:"center"}}>
          <span style={{fontWeight:600,color:C.textSec}}>YOUNES INTELDASH</span>
          <span>STATUS: <span style={{color:C.accent}}>ONLINE</span></span>
        </div>
        <div style={{fontSize:9,color:C.textMuted}}>DATA: MEMPOOL.SPACE API // REFRESH: 120s // INTERNAL USE ONLY</div>
      </div>
    </div>
  );
}
