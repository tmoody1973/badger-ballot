import { useState, useEffect } from "react";

const CANDIDATES = [
  // GOVERNOR — Democratic Primary
  { id: "barnes", name: "Mandela Barnes", party: "D", office: "Governor", current: "Fmr Lt. Governor", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Mandela_Barnes.jpg/440px-Mandela_Barnes.jpg", keyFact: "Lost 2022 Senate race by 1pt. Frontrunner.", findings: 5, severity: "medium" },
  { id: "rodriguez", name: "Sara Rodriguez", party: "D", office: "Governor", current: "Lt. Governor", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Sara_Rodriguez_%28cropped%29.jpg/440px-Sara_Rodriguez_%28cropped%29.jpg", keyFact: "First Latina elected statewide in WI.", findings: 3, severity: "low" },
  { id: "crowley", name: "David Crowley", party: "D", office: "Governor", current: "Milwaukee County Exec", photo: null, keyFact: "First Black county exec. Won 2024 re-election 5-to-1.", findings: 3, severity: "low" },
  { id: "hong", name: "Francesca Hong", party: "D", office: "Governor", current: "State Rep, 76th", photo: null, keyFact: "First Asian American WI legislator. Democratic Socialist.", findings: 4, severity: "medium" },
  // GOVERNOR — Republican Primary
  { id: "tiffany", name: "Tom Tiffany", party: "R", office: "Governor", current: "U.S. Rep, WI-7", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Rep._Tom_Tiffany_-_117th_Congress_%28cropped%29.jpeg/440px-Rep._Tom_Tiffany_-_117th_Congress_%28cropped%29.jpeg", keyFact: "Freedom Caucus. Trump-endorsed. Only major R.", findings: 8, severity: "high" },
  // STATE SENATE — Key competitive races
  { id: "sd5", name: "SD-5 (Waukesha suburbs)", party: "X", office: "State Senate", current: "Open — top D pickup target", photo: null, keyFact: "Lean Dem. Suburbs shifting since 2016.", findings: 2, severity: "medium" },
  { id: "sd15", name: "SD-15 (Fox Valley)", party: "X", office: "State Senate", current: "Competitive swing district", photo: null, keyFact: "One of 3 districts that decides Senate control.", findings: 2, severity: "medium" },
  // U.S. HOUSE — WI-3 TOSS-UP
  { id: "vanorden", name: "Derrick Van Orden", party: "R", office: "U.S. House WI-3", current: "Incumbent (51.4% in 2024)", photo: null, keyFact: "Jan 6 rally attendee. Cursed at staffers and pages.", findings: 7, severity: "high" },
  { id: "cooke", name: "Rebecca Cooke", party: "D", office: "U.S. House WI-3", current: "Challenger", photo: null, keyFact: "Outraised Van Orden Q4 2025. $1.1M vs $931K.", findings: 4, severity: "medium" },
  // U.S. HOUSE — WI-1 LEAN R
  { id: "steil", name: "Bryan Steil", party: "R", office: "U.S. House WI-1", current: "Incumbent ($4.2M on hand)", photo: null, keyFact: "DCCC flip target. SE Wisconsin.", findings: 5, severity: "medium" },
  // U.S. HOUSE — WI-7 OPEN SEAT
  { id: "felzkowski", name: "Mary Felzkowski", party: "R", office: "U.S. House WI-7", current: "State Senate president", photo: null, keyFact: "Open seat — Tiffany leaving for governor.", findings: 3, severity: "low" },
  // STATEWIDE
  { id: "kaul", name: "Josh Kaul", party: "D", office: "Attorney General", current: "AG (incumbent)", photo: null, keyFact: "Running for 3rd term. Key on PFAS, gun safety.", findings: 4, severity: "low" },
  // BALLOT MEASURES (Certified per Ballotpedia, Feb 18, 2026)
  { id: "dei-amend", name: "Discrimination/Preferential Treatment Amendment", party: "M", office: "Ballot Measure", current: "Nov 2026 Ballot", photo: null, keyFact: "Bans race/sex/ethnicity criteria in public employment, education, contracting.", findings: 4, severity: "high" },
  { id: "worship-amend", name: "Places of Worship Emergency Closure Amendment", party: "M", office: "Ballot Measure", current: "Nov 2026 Ballot", photo: null, keyFact: "Bans government from closing worship gatherings during emergencies.", findings: 2, severity: "medium" },
];

const PC = {
  R: { bg: "#DC2626", accent: "#FCA5A5", muted: "#7F1D1D", label: "REP" },
  D: { bg: "#2563EB", accent: "#93C5FD", muted: "#1E3A5F", label: "DEM" },
  M: { bg: "#D97706", accent: "#FCD34D", muted: "#78350F", label: "MEASURE" },
  X: { bg: "#8B5CF6", accent: "#C4B5FD", muted: "#4C1D95", label: "SWING" },
};
const SEV = { high: "#EF4444", medium: "#F59E0B", low: "#525252" };
const S = { mono: "'JetBrains Mono', 'SF Mono', monospace", serif: "'Libre Baskerville', Georgia, serif" };

const TRANSCRIPTS = {
  tiffany: [
    { role: "agent", text: "Pulling up the records on Tom Tiffany and public lands..." },
    { role: "agent", text: "Here\u2019s what I found. Congress.gov shows Tiffany co-sponsored multiple bills to transfer federal land management to states. He chairs the House Subcommittee on Federal Lands. His campaign frames this as giving Wisconsin more local control." },
    { role: "agent", text: "But here\u2019s where it gets interesting. OpenSecrets data shows his top donors include extractive industry PACs \u2014 Club for Growth at $15,000, Koch Industries at $10,000 in the 2022 cycle. Conservation groups rate him poorly." },
    { role: "agent", text: "I found 11 sources across Congressional records, campaign finance databases, and news coverage. Want me to dig deeper on the bills, the donors, or check another candidate?" },
  ],
  vanorden: [
    { role: "agent", text: "Looking into Derrick Van Orden\u2019s record..." },
    { role: "agent", text: "Van Orden won the WI-3 seat in 2022, flipping a district Democrats held for 26 years under Ron Kind. He won re-election in 2024 with just 51.4% \u2014 the narrowest margin in Wisconsin\u2019s House races." },
    { role: "agent", text: "The controversy file is significant. He attended the Stop the Steal rally on January 6, 2021, though he says he left before the breach. He\u2019s been reported for yelling at a teenage library page over a Pride display, cursing at White House staff, and confrontations on the House floor." },
    { role: "agent", text: "Cook Political Report rates this seat a toss-up for 2026. His challenger Rebecca Cooke outraised him last quarter. I found 9 sources. Want me to dig into his voting record, donors, or the Jan 6 details?" },
  ],
  cooke: [
    { role: "agent", text: "Searching for Rebecca Cooke\u2019s record..." },
    { role: "agent", text: "Cooke is challenging Van Orden for the second time in WI-3. She ran in 2024 and lost by about 3 points. She\u2019s positioned herself as a moderate Democrat, emphasizing rural economic issues." },
    { role: "agent", text: "On the money side, she outraised Van Orden in Q4 2025 \u2014 $1.1 million to his $931,000. That\u2019s significant for a challenger. The DCCC has identified WI-3 as a top flip target for taking back the House." },
    { role: "agent", text: "I found 6 sources. Want me to go deeper on her policy positions or the fundraising breakdown?" },
  ],
  barnes: [
    { role: "agent", text: "Looking into Mandela Barnes\u2019 record..." },
    { role: "agent", text: "Barnes served as Lieutenant Governor under Evers from 2019 to 2023. He ran for U.S. Senate in 2022, losing to Ron Johnson by about 27,000 votes \u2014 just 1 point." },
    { role: "agent", text: "PolitiFact checked several claims from that Senate race. His claim about Johnson voting against law enforcement was rated False. But his cash bail reform plan was rated Mostly True for keeping dangerous suspects detained \u2014 a provision critics often overlook." },
    { role: "agent", text: "He raised $555,000 in his first 29 days in the governor\u2019s race and is considered the frontrunner. I found 8 sources. Want me to go deeper?" },
  ],
  default: [
    { role: "agent", text: "Searching public records, news coverage, and campaign finance databases..." },
    { role: "agent", text: "I found several sources on this candidate. Let me walk through the key findings." },
    { role: "agent", text: "Want me to dig deeper on any specific finding \u2014 voting record, donors, or fact-checks?" },
  ],
};

function MiniCard({ c, isSelected, onClick }) {
  const col = PC[c.party];
  return (
    <div onClick={onClick} style={{
      padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
      border: `1.5px solid ${isSelected ? col.bg : "#1E1E1E"}`,
      background: isSelected ? `${col.bg}0D` : "#0E0E0E",
      transition: "all 0.2s", display: "flex", gap: "10px", alignItems: "center",
    }}>
      <div style={{
        width: "38px", height: "38px", borderRadius: "6px", overflow: "hidden",
        background: col.muted, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {c.photo ? (
          <img src={c.photo} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(30%)" }} />
        ) : (
          <span style={{ fontSize: "13px", color: col.accent, opacity: 0.25, fontFamily: S.mono, fontWeight: 700 }}>
            {c.party === "M" ? "\u00A7" : c.party === "X" ? "\u2694" : c.name.split(" ").map(w => w[0]).join("")}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#E5E5E5", fontFamily: S.serif, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
          <span style={{ fontSize: "7px", fontWeight: 700, letterSpacing: "0.1em", color: col.bg, fontFamily: S.mono, flexShrink: 0 }}>{col.label}</span>
        </div>
        <div style={{ fontSize: "9px", color: "#666", fontFamily: S.mono, marginTop: "1px" }}>{c.office}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: SEV[c.severity] }} />
        <span style={{ fontSize: "7px", color: "#555", fontFamily: S.mono }}>{c.findings}</span>
      </div>
    </div>
  );
}

function VoicePanel({ candidate, transcript, isActive, onStart }) {
  const col = candidate ? PC[candidate.party] : { bg: "#555", accent: "#888" };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#080808", borderRadius: "10px", border: "1px solid #1A1A1A", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #1A1A1A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.15em", color: "#EF4444", fontFamily: S.mono, marginBottom: "2px" }}>BALLOT BADGER</div>
          <div style={{ fontSize: "10px", color: isActive ? "#E5E5E5" : "#555", fontFamily: S.mono, transition: "color 0.3s" }}>
            {isActive ? "Investigating..." : candidate ? `Ready \u2014 ${candidate.name}` : "Select a candidate"}
          </div>
        </div>
        {isActive && (
          <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ width: "3px", borderRadius: "2px", background: "#EF4444", animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite alternate` }} />
            ))}
            <style>{`@keyframes wave { from { height: 4px; } to { height: 16px; } }`}</style>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "12px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Empty state */}
        {!candidate && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.12 }}>{"\u{1F50D}"}</div>
            <div style={{ fontSize: "13px", color: "#444", fontFamily: S.serif, fontStyle: "italic", lineHeight: 1.6 }}>
              Select a candidate from the directory, then pull their receipts to start a live investigation.
            </div>
          </div>
        )}

        {/* Selected but not started */}
        {candidate && !isActive && transcript.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", background: col.muted, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {candidate.photo ? (
                <img src={candidate.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(30%)" }} />
              ) : (
                <span style={{ fontSize: "16px", color: col.accent, opacity: 0.3, fontFamily: S.mono, fontWeight: 700 }}>
                  {candidate.party === "M" ? "\u00A7" : candidate.party === "X" ? "\u2694" : candidate.name.split(" ").map(w => w[0]).join("")}
                </span>
              )}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#E5E5E5", fontFamily: S.serif, marginBottom: "4px" }}>{candidate.name}</div>
            <div style={{ fontSize: "9px", color: "#888", fontFamily: S.mono, marginBottom: "4px" }}>{candidate.office} \u00B7 {candidate.current}</div>
            <div style={{ fontSize: "10px", color: "#666", fontFamily: S.serif, fontStyle: "italic", marginBottom: "16px", maxWidth: "280px" }}>{candidate.keyFact}</div>
            <button
              onClick={onStart}
              style={{
                padding: "10px 24px", borderRadius: "8px", border: "none",
                background: col.bg, color: "#fff", fontSize: "11px", fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: S.mono,
                cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: `0 0 20px ${col.bg}33`,
              }}
              onMouseEnter={e => { e.target.style.transform = "scale(1.03)"; e.target.style.boxShadow = `0 0 30px ${col.bg}55`; }}
              onMouseLeave={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = `0 0 20px ${col.bg}33`; }}
            >
              {"\u{1F399}"} Pull the receipts
            </button>
            <div style={{ fontSize: "8px", color: "#383838", fontFamily: S.mono, marginTop: "8px" }}>Voice \u00B7 ElevenLabs + Firecrawl</div>
          </div>
        )}

        {/* Transcript */}
        {transcript.map((msg, i) => (
          <div key={i} style={{
            padding: "10px 12px", borderRadius: "8px",
            background: msg.role === "agent" ? "#111" : "#1A1A1A",
            borderLeft: `2px solid ${msg.role === "agent" ? "#EF4444" : "#555"}`,
            animation: "msgIn 0.3s ease",
          }}>
            <div style={{ fontSize: "7px", fontWeight: 700, letterSpacing: "0.1em", color: msg.role === "agent" ? "#EF4444" : "#888", fontFamily: S.mono, marginBottom: "4px", textTransform: "uppercase" }}>
              {msg.role === "agent" ? "Ballot Badger" : "You"}
            </div>
            <div style={{ fontSize: "12px", color: "#C8C8C8", lineHeight: 1.6, fontFamily: S.serif }}>{msg.text}</div>
          </div>
        ))}
        <style>{`@keyframes msgIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>

      {/* Input bar */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #1A1A1A", display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={candidate && !isActive ? onStart : undefined}
          style={{
            width: "36px", height: "36px", borderRadius: "50%", border: "none",
            background: isActive ? "#EF4444" : candidate ? col.bg : "#222",
            color: "#fff", fontSize: "14px", cursor: candidate ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
            boxShadow: isActive ? "0 0 16px #EF444444" : "none",
            animation: isActive ? "pulse 2s ease infinite" : "none",
          }}
        >{isActive ? "\u23F8" : "\u{1F399}"}</button>
        <style>{`@keyframes pulse { 0%,100% { box-shadow: 0 0 16px #EF444433; } 50% { box-shadow: 0 0 28px #EF444466; } }`}</style>
        <div style={{
          flex: 1, padding: "8px 12px", borderRadius: "8px",
          background: "#111", border: "1px solid #1E1E1E",
          fontSize: "10px", color: isActive ? "#888" : "#444", fontFamily: S.mono,
        }}>
          {isActive ? "Listening... say 'go deeper' or ask a follow-up" : candidate ? `Ask about ${candidate.name}'s record...` : "Select a candidate first"}
        </div>
      </div>
    </div>
  );
}

export default function BallotBadger() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [simIdx, setSimIdx] = useState(0);

  const filtered = filter === "all" ? CANDIDATES
    : CANDIDATES.filter(c =>
        filter === "governor" ? c.office === "Governor"
        : filter === "senate" ? c.office === "State Senate"
        : filter === "house" ? c.office.startsWith("U.S. House")
        : filter === "statewide" ? c.office === "Attorney General"
        : c.office === "Ballot Measure"
      );

  const selectedCandidate = CANDIDATES.find(c => c.id === selected);
  const activeTranscript = TRANSCRIPTS[selected] || TRANSCRIPTS.default;

  function startConversation() {
    setIsActive(true);
    setTranscript([]);
    setSimIdx(0);
  }

  useEffect(() => {
    if (isActive && simIdx < activeTranscript.length) {
      const delay = simIdx === 0 ? 1500 : 3000;
      const t = setTimeout(() => {
        setTranscript(prev => [...prev, activeTranscript[simIdx]]);
        setSimIdx(i => i + 1);
      }, delay);
      return () => clearTimeout(t);
    }
    if (isActive && simIdx >= activeTranscript.length) {
      setTimeout(() => setIsActive(false), 2000);
    }
  }, [isActive, simIdx, activeTranscript]);

  function selectCandidate(id) {
    setSelected(id);
    setIsActive(false);
    setTranscript([]);
    setSimIdx(0);
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "governor", label: "Governor" },
    { key: "house", label: "U.S. House" },
    { key: "senate", label: "State Senate" },
    { key: "statewide", label: "Statewide" },
    { key: "ballot", label: "Ballot" },
  ];

  return (
    <div style={{ height: "100vh", background: "#0A0A0A", color: "#F5F5F5", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #151515", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em", color: "#EF4444", fontFamily: S.mono }}>WI 2026</span>
          <h1 style={{ fontSize: "15px", fontWeight: 700, fontFamily: S.serif, margin: 0 }}>Ballot Badger</h1>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: "3px" }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "3px 9px", borderRadius: "12px",
              border: `1px solid ${filter === f.key ? "#F5F5F5" : "#222"}`,
              background: filter === f.key ? "#F5F5F5" : "transparent",
              color: filter === f.key ? "#0A0A0A" : "#555",
              fontSize: "8px", fontWeight: 600, fontFamily: S.mono, cursor: "pointer", transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Split layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT: Directory */}
        <div style={{ width: "300px", flexShrink: 0, borderRight: "1px solid #151515", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "8px 10px 4px" }}>
            <span style={{ fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", color: "#444", fontFamily: S.mono }}>
              {filtered.length} RACE{filtered.length !== 1 ? "S" : ""} \u00B7 {filter === "all" ? "ALL" : filter.toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {filtered.map(c => (
              <MiniCard key={c.id} c={c} isSelected={selected === c.id} onClick={() => selectCandidate(c.id)} />
            ))}
          </div>
          <div style={{ padding: "6px 10px", borderTop: "1px solid #151515", textAlign: "center" }}>
            <span style={{ fontSize: "7px", color: "#252525", fontFamily: S.mono }}>NO U.S. SENATE RACE IN WI 2026 {"\u00B7"} CONGRESS.GOV {"\u00B7"} OPENSECRETS {"\u00B7"} POLITIFACT {"\u00B7"} FIRECRAWL SEARCH</span>
          </div>
        </div>

        {/* RIGHT: Voice panel */}
        <div style={{ flex: 1, padding: "8px", overflow: "hidden" }}>
          <VoicePanel
            candidate={selectedCandidate}
            transcript={transcript}
            isActive={isActive}
            onStart={startConversation}
          />
        </div>
      </div>
    </div>
  );
}
