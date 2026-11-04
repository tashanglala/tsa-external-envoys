#!/usr/bin/env python3
"""
Usage:  python patch_index.py index.html
Creates index.patched.html (your original is not modified).
Each step prints OK or a WARNING if the text it looks for was not found.
"""
import re, sys

src_path = sys.argv[1] if len(sys.argv) > 1 else "index.html"
out_path = "index.patched.html"
s = open(src_path, encoding="utf-8").read()


def rep(label, old, new, count=None):
    """Plain string replace with a check."""
    global s
    n = s.count(old)
    if n == 0 or (count is not None and n != count):
        print(f"WARNING  {label}: found {n} match(es)" + (f", expected {count}" if count else ""))
        if n == 0:
            return
    s = s.replace(old, new)
    print(f"OK       {label} ({n})")


def rep_re(label, pattern, new, flags=re.S):
    global s
    s2, n = re.subn(pattern, lambda m: new, s, count=1, flags=flags)
    if n == 0:
        print(f"WARNING  {label}: pattern not found")
        return
    s = s2
    print(f"OK       {label}")


# ---------------------------------------------------------------
# 1. WELCOME PAGE (inside the iframe srcdoc) - Lucide icons
# ---------------------------------------------------------------
FEATS_NEW = r"""const I=(d,s)=>html`<svg viewBox='0 0 24 24' width=${s||36} height=${s||36} fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' dangerouslySetInnerHTML=${{__html:d}}></svg>`;
const IC={
  landmark:`<line x1='3' x2='21' y1='22' y2='22'/><line x1='6' x2='6' y1='18' y2='11'/><line x1='10' x2='10' y1='18' y2='11'/><line x1='14' x2='14' y1='18' y2='11'/><line x1='18' x2='18' y1='18' y2='11'/><polygon points='12 2 20 7 4 7'/>`,
  file:`<path d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'/><path d='M14 2v4a2 2 0 0 0 2 2h4'/><path d='M10 9H8'/><path d='M16 13H8'/><path d='M16 17H8'/>`,
  send:`<path d='m22 2-7 20-4-9-9-4Z'/><path d='M22 2 11 13'/>`,
  mic:`<path d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z'/><path d='M19 10v2a7 7 0 0 1-14 0v-2'/><line x1='12' x2='12' y1='19' y2='22'/>`,
  news:`<path d='M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2'/><path d='M18 14h-8'/><path d='M15 18h-5'/><path d='M10 6h8v4h-8V6Z'/>`,
  camera:`<path d='M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'/><circle cx='12' cy='13' r='3'/>`,
  hand:`<path d='M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16'/><path d='m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9'/><path d='m2 15 6 6'/><path d='M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z'/>`,
  badge:`<path d='M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.77 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z'/><path d='m9 12 2 2 4-4'/>`
};
const FEATS=[
  [IC.landmark,'Partnerships','Build institutional bridges with universities, agencies and tech companies.'],
  [IC.file,'MOAs','Draft, negotiate and secure bilateral agreements, then keep every record organized.'],
  [IC.send,'Outreach','Coordinate invitations, follow-ups and logistics for events and delegations.'],
  [IC.mic,'Representation','Carry the name of TSA beyond campus walls with professionalism.']
];"""

rep_re("FEATS array -> Lucide icons", r"const FEATS=\[.*?\n\];", FEATS_NEW)
rep("What(): render SVG", "${f[0]}", "${I(f[0],38)}", 1)
rep("BEN emoji 1", "['📰',", "[IC.news,", 1)
rep("BEN emoji 2", "['📸',", "[IC.camera,", 1)
rep("BEN emoji 3", "['🤝','Co-branded", "[IC.hand,'Co-branded", 1)
rep("BEN emoji 4", "['⭐',", "[IC.badge,", 1)
rep("Media(): render SVG", "${b[0]}", "${I(b[0],26)}", 1)

IFRAME_CSS = """
/* ---- patch: icons, logo, footer ---- */
.fc .e{display:block;line-height:0;color:#2B1206}
.fc .e svg{display:block}
.c2 .e{color:#2B1206}
.me{line-height:0;color:#C2410C;flex:none}
.mlogo{filter:brightness(0) invert(10%) sepia(60%) saturate(1800%) hue-rotate(350deg) brightness(.9)}
.credit{text-align:center;font-weight:600;letter-spacing:.02em}
.crew{display:grid;grid-template-columns:repeat(3,auto);justify-content:center;gap:1rem 3.5rem;margin-top:1rem}
.crew span{display:flex;flex-direction:column;align-items:center;gap:.2rem}
.crew b{font-size:1rem}
.crew small{font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#7C3A10}
@media(max-width:640px){.crew{grid-template-columns:1fr}}
"""
m = re.search(r"</style>\s*</head>\s*<body>\s*<div id=&quot;root&quot;>", s)
if m:
    s = s[:m.start()] + IFRAME_CSS + s[m.start():]
    print("OK       iframe CSS (icons, logo, footer)")
else:
    print("WARNING  iframe CSS insertion point not found")

# ---------------------------------------------------------------
# 2. MAIN PAGE CSS: "or" spacing + search icon
# ---------------------------------------------------------------
MAIN_CSS = """
  /* ---- patch: login "or" divider ---- */
  .oauth-divider{display:flex;align-items:center;gap:.8rem;margin:1.2rem 0;font-size:.85rem;font-weight:600;color:var(--text-muted)}
  .oauth-divider::before,.oauth-divider::after{content:"";flex:1;height:1px;background:rgba(232,89,12,.3)}
  .oauth-hint{font-size:.82rem;line-height:1.5;margin:1rem 0 1.1rem;color:var(--text-muted)}
"""
m = re.search(r'</style>(\s*<script type="text/javascript" src="https://cdn\.jsdelivr\.net/npm/@emailjs)', s)
if m:
    s = s[:m.start()] + MAIN_CSS + s[m.start():]
    print("OK       main CSS (or divider)")
else:
    print("WARNING  main CSS insertion point not found")

SEARCH_SVG = ("content:\"\";width:15px;height:15px;opacity:.75;"
              "background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
              "fill='none' stroke='%237C3A10' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E"
              "%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E\") center/contain no-repeat;")
rep("search icon emoji -> SVG", 'content:"🔍";', SEARCH_SVG, 1)

# ---------------------------------------------------------------
# 3. DASHBOARD emojis -> Lucide
# ---------------------------------------------------------------
HELPER = r"""
  const P={
    bell:`<path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/><path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'/>`,
    cal:`<path d='M8 2v4'/><path d='M16 2v4'/><rect width='18' height='18' x='3' y='4' rx='2'/><path d='M3 10h18'/>`,
    clip:`<path d='m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'/>`,
    mail:`<rect width='20' height='16' x='2' y='4' rx='2'/><path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'/>`,
    trash:`<path d='M3 6h18'/><path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'/><path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'/><line x1='10' x2='10' y1='11' y2='17'/><line x1='14' x2='14' y1='11' y2='17'/>`,
    pen:`<path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'/><path d='m15 5 4 4'/>`,
    lock:`<rect width='18' height='11' x='3' y='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/>`,
    file:`<path d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'/><path d='M14 2v4a2 2 0 0 0 2 2h4'/><path d='M10 9H8'/><path d='M16 13H8'/><path d='M16 17H8'/>`
  };
  const ic=(n,s=15)=>`<svg viewBox='0 0 24 24' width='${s}' height='${s}' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px;margin-right:.3rem'>${P[n]}</svg>`;
"""
anchor = "const $ = id => document.getElementById(id);"
if s.count(anchor) == 1:
    s = s.replace(anchor, anchor + HELPER)
    print("OK       dashboard icon helper")
else:
    print("WARNING  could not find the `const $ =` line")

rep("🎪 event chip", "🎪 ${esc(t.event)}", "${ic('cal')}${esc(t.event)}")
rep("📎 attached MOA", "📎 Attached MOA:", "${ic('clip')}Attached MOA:")
rep("✉️ reset text (JS)", 'btn.textContent="✉️ Email Member Directly"', 'btn.innerHTML=ic(\'mail\')+"Email Member Directly"')
rep("✉️ email button", "✉️ Email Member Directly", "${ic('mail')}Email Member Directly")
rep("✎ edit", "✎ Edit", "${ic('pen')}Edit")
rep("🗑 delete", "🗑 Delete submission", "${ic('trash')}Delete submission")
rep("🔒 approved", "🔒 Approved by the Council", "${ic('lock')}Approved by the Council")
rep("📕/📄 doc icon", '${final?"📕":"📄"}', "${ic('file',22)}")

BELL = ("<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" "
        "stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\"/>"
        "<path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\"/></svg>")
rep("🔔 bell", 'aria-label="Notifications">🔔<span', 'aria-label="Notifications">' + BELL + '<span', 1)

open(out_path, "w", encoding="utf-8").write(s)
print(f"\nDone -> {out_path}")