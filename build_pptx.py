#!/usr/bin/env python3
# Build a 16:9 .pptx (no external deps) mirroring the Labyrinth deck, script in speaker notes.
import os, zipfile, html

BASE=os.path.dirname(os.path.abspath(__file__))
IMG=os.path.join(BASE,"images","product")
EMU_W,EMU_H=12192000,6858000
def em(inch): return int(inch*914400)

INK="2A2622"; SUB="6F6A63"; AMBER="B06F30"; PAPER="F6F2EA"; DARK="26221E"; WHITE="FFFFFF"; TILE="EDE7DD"

def esc(t): return html.escape(t, quote=True)

# ---------- shape builders ----------
_id=[10]
def nid():
    _id[0]+=1; return _id[0]

def rect(x,y,w,h,color,alpha=None):
    a=f'<a:alpha val="{alpha}"/>' if alpha is not None else ''
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{nid()}" name="r"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            f'<a:solidFill><a:srgbClr val="{color}">{a}</a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>'
            f'<p:txBody><a:bodyPr/><a:p/></p:txBody></p:sp>')

def _runs(lines):
    # lines: list of (text, size_pt, color, bold)
    ps=[]
    for text,size,color,bold in lines:
        b=' b="1"' if bold else ''
        ps.append(f'<a:p><a:pPr/><a:r><a:rPr lang="en-US" sz="{int(size*100)}"{b}>'
                  f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
                  f'<a:latin typeface="Helvetica Neue"/></a:rPr><a:t>{esc(text)}</a:t></a:r></a:p>')
    return ''.join(ps)

def textbox(x,y,w,h,lines,anchor="t"):
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{nid()}" name="t"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            f'<p:txBody><a:bodyPr wrap="square" anchor="{anchor}"><a:normAutofit/></a:bodyPr>{_runs(lines)}</p:txBody></p:sp>')

def bullets(x,y,w,h,items,size,color):
    ps=[]
    for it in items:
        ps.append(f'<a:p><a:pPr marL="228600" indent="-228600"><a:buChar char="•"/></a:pPr>'
                  f'<a:r><a:rPr lang="en-US" sz="{int(size*100)}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
                  f'<a:latin typeface="Helvetica Neue"/></a:rPr><a:t>{esc(it)}</a:t></a:r></a:p>')
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{nid()}" name="b"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            f'<p:txBody><a:bodyPr wrap="square"><a:normAutofit/></a:bodyPr>{"".join(ps)}</p:txBody></p:sp>')

def pic(rid,x,y,w,h):
    return (f'<p:pic><p:nvPicPr><p:cNvPr id="{nid()}" name="p"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>'
            f'<p:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
            f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>')

# ---------- slide + notes content ----------
M=em(0.85)
def slide_text(eyebrow,title,body_lines,bg=PAPER,titlecolor=INK):
    s=[rect(0,0,EMU_W,EMU_H,bg)]
    y=em(1.0)
    if eyebrow: s.append(textbox(M,y,EMU_W-2*M,em(0.4),[(eyebrow,13,AMBER,True)])); y+=em(0.55)
    s.append(textbox(M,y,EMU_W-2*M,em(1.6),[(title,40,titlecolor,True)])); y+=em(1.9)
    s.append(textbox(M,y,em(10.2),em(3.4),[(l,20,SUB if bg==PAPER else "D8CFC6",False) for l in body_lines]))
    return ''.join(s)

slides=[]

# 1 cover  (hero full bleed + veil + title)
def s_cover():
    s=[pic("rId2",0,0,EMU_W,EMU_H),
       rect(0,0,em(7.2),EMU_H,"140F0C",alpha=42000),
       textbox(M,em(2.4),em(6.6),em(0.5),[("DESIGNING AN EXPERIENCE, NOT JUST AN OBJECT",13,"F0C088",True)]),
       textbox(M,em(2.9),em(6.6),em(1.6),[("Labyrinth",60,WHITE,True)]),
       textbox(M,em(4.5),em(6.2),em(1.6),[("A desk ritual that gives a busy executive three minutes to breathe, trace, and come back down.",22,"F3ECE1",False)])]
    return ''.join(s), ["hero.png","rId2"]

# helper: two-column text + image
def s_img_right(eyebrow,title,body,imgfile,rid,darkbg=False,bg=PAPER):
    s=[rect(0,0,EMU_W,EMU_H,bg)]
    s.append(rect(em(6.55),em(0.7),em(6.0),em(6.1),TILE))
    s.append(pic(rid,em(6.55),em(0.7),em(6.0),em(6.1)))
    s.append(textbox(M,em(1.1),em(5.4),em(0.4),[(eyebrow,13,AMBER,True)]))
    s.append(textbox(M,em(1.6),em(5.4),em(1.6),[(title,34,INK,True)]))
    s.append(textbox(M,em(3.3),em(5.4),em(3.2),[(l,18,SUB,False) for l in body]))
    return ''.join(s)

def s_img_left(eyebrow,title,body,rid):
    s=[rect(0,0,EMU_W,EMU_H,PAPER)]
    s.append(rect(em(0.55),em(0.7),em(6.0),em(6.1),TILE))
    s.append(pic(rid,em(0.55),em(0.7),em(6.0),em(6.1)))
    x=em(7.0)
    s.append(textbox(x,em(1.4),em(4.7),em(0.4),[(eyebrow,13,AMBER,True)]))
    s.append(textbox(x,em(1.9),em(4.7),em(1.6),[(title,32,INK,True)]))
    s.append(textbox(x,em(3.5),em(4.7),em(3.0),[(l,18,SUB,False) for l in body]))
    return ''.join(s)

def s_fullbleed(rid,eyebrow,title,dark_text=False):
    col=WHITE if dark_text==False else INK
    s=[pic(rid,0,0,EMU_W,EMU_H)]
    yy=em(5.2)
    tc=WHITE
    s.append(textbox(M,yy,em(7.5),em(0.4),[(eyebrow,13,"F0C088",True)]))
    s.append(textbox(M,yy+em(0.5),em(7.5),em(1.2),[(title,30,tc,True)]))
    return ''.join(s)

# NOTES (spoken script per slide)
NOTES=[
"Hey — so this is Labyrinth. The brief was simple on paper: a desk device that helps busy executives find a little calm in the middle of the day. But the more I dug in, the more I realized the hard part isn't relaxation — it's everything around it. Let me walk you through it.",
"First, the mindset I went in with. I didn't want to design a machine. I wanted to design a moment — three quiet minutes someone can actually take at their desk. So the whole time, the question wasn't 'what features does it have,' it was 'what does that pause feel like.'",
"Here's the real problem. Executives don't actually lack breaks — they lack a break they feel allowed to take. Their day is chopped into three-to-eight-minute gaps. They're often in a glass office, so anything they do is on show. And they've got zero patience for setup. So the bar was high: fast, low-key, basically invisible.",
"To get there I kept the research small but real — desk research, a short survey, a couple interviews, and usability testing. And every quote pointed at a design move. 'I never actually step away' — so it happens right at the desk. 'Apps? too long, another screen' — so no screen, no audio. 'It has to be low-key' — so it looks like you're just touching an object. And here's the prototype — you follow this warm light: inward as you breathe in, back out as you breathe out. No instructions, nothing to learn.",
"Those conversations boiled down to six truths — and I treated each as a hard constraint. It has to be low-key. Apps get abandoned, so no screen. Hands already fidget, so give them something better to do. People can't just decide to relax, so something external should lead. It has to survive interruption — stop and resume, no guilt. And taste and material matter, because this lives on their desk.",
"So the interaction is one gesture. Your finger falls into a single spiral groove and follows the light. The groove limits how fast you can move, so you slow down whether you mean to or not. And when you keep pace, the path glows warmer — a quiet 'you've got it.'",
"Form-wise, I wanted a soft pebble, not a device. A smooth white-ceramic saucer, palm-sized, rounded everywhere — no sharp edges. One spiral groove flowing into a little dish in the center. And no buttons on show — you just lift it to wake it.",
"This is it on a desk. It doesn't read as tech — it reads as a quiet object you'd want to keep there. That was the point: it invites you in without demanding anything.",
"Under the calm, it is engineered. A ring of LEDs feeds a diffuser in the floor of the groove, so the light looks like it lives inside the channel — you never see a bulb. A soft point travels the groove to pace your breath, in warm amber, never a cold notification. Plus a gentle warming layer and a weighted base.",
"One ritual, but it can suit any desk — ceramic, marble, amber resin, aluminium, walnut, dark stone. Same object, different personalities.",
"So to wrap up — I didn't really design a disc. I designed three quiet minutes. Next would be a physical prototype with the real engraved groove and light, and validating the calming effect with heart-rate data. But the core idea is here: something small and beautiful that gives a busy person permission to breathe. Thanks — happy to take questions.",
]

# Build each slide's spTree + its image list [(file, rid), ...]
defs=[]
# 1
c,imgs=s_cover(); defs.append((c,[("hero.png","rId2")]))
# 2 intent
defs.append((slide_text("THE INTENT","We set out to shape a moment, not a machine.",
   ["A meditation app asks for your attention. Labyrinth asks for almost nothing.",
    "You reach out, your finger falls into the groove, a warm light breathes ahead of it, and for three minutes the day goes quiet.",
    "That feeling is the product; the ceramic disc is just how it reaches you."]),[]))
# 3 problem
defs.append((slide_text("THE PROBLEM","Executives don't lack breaks. They lack a break they're allowed to take.",
   ["Fragmented — 3–8 min between meetings, easily interrupted.",
    "Low-key — open, glass-walled offices; the reset has to stay discreet.",
    "Zero setup — no pairing, no screen, one gesture."]),[]))
# 4 user study + demo poster
def s_userstudy():
    s=[rect(0,0,EMU_W,EMU_H,PAPER)]
    s.append(rect(em(6.55),em(0.7),em(6.0),em(6.1),PAPER))
    s.append(pic("rId2",em(6.55),em(0.7),em(6.0),em(6.1)))
    s.append(textbox(M,em(0.9),em(5.4),em(0.4),[("USER STUDY",13,AMBER,True)]))
    s.append(textbox(M,em(1.4),em(5.4),em(1.2),[("What people told us — and what it changed",30,INK,True)]))
    s.append(bullets(M,em(2.9),em(5.4),em(3.6),[
      "“I never step away.” → a reset right at the desk, under 3 minutes.",
      "“Apps? Too long, another screen.” → no screen, no audio.",
      "“It has to be low-key.” → reads as touching a desk object.",
      "“It sits on my desk.” → aesthetics & material matter.",
      "Hands already fidget → give them a groove to trace.",
      "“Can't switch off on command.” → the light leads the breath.",
    ],15,SUB))
    return ''.join(s)
defs.append((s_userstudy(),[("demo-poster.jpg","rId2")]))
# 5 insights
def s_insights():
    s=[rect(0,0,EMU_W,EMU_H,PAPER)]
    s.append(textbox(M,em(0.8),em(10),em(0.4),[("WHAT WE LEARNED",13,AMBER,True)]))
    s.append(textbox(M,em(1.3),em(10),em(0.9),[("Six truths that became design constraints",30,INK,True)]))
    items=[("01 It has to be low-key","Discreet in a shared office — touching an object, not “doing wellness.”"),
     ("02 Apps get abandoned","Too long, needs headphones, another screen. So: no screen, no audio, <3 min."),
     ("03 Hands already fidget","Pens, phones. Redirect the behaviour, don't invent a habit."),
     ("04 Guide me, don't ask me","No willpower left to relax on command — the light leads."),
     ("05 Stop & resume anytime","Breaks get cut short — no timer, no “session failed” guilt."),
     ("06 Taste & material matter","It lives on their desk — finish and material carry the value.")]
    col_w=em(3.7); gap=em(0.25); x0=M; y0=em(2.5); rh=em(1.9)
    for i,(t,d) in enumerate(items):
        cx=x0+(i%3)*(col_w+gap); cy=y0+(i//3)*(rh+em(0.2))
        s.append(rect(cx,cy,col_w,rh,TILE))
        s.append(textbox(cx+em(0.2),cy+em(0.18),col_w-em(0.4),em(0.5),[(t,15,INK,True)]))
        s.append(textbox(cx+em(0.2),cy+em(0.72),col_w-em(0.4),em(1.0),[(d,12,SUB,False)]))
    return ''.join(s)
defs.append((s_insights(),[]))
# 6 interaction (hand left)
defs.append((s_img_left("THE INTERACTION","One gesture. Trace, and slow down.",
   ["Your finger follows a warm light inward as you breathe in, outward as you breathe out.",
    "The groove limits your speed, so you can't rush.",
    "Keep pace and the path glows warmer — a quiet “you've got it.”"],"rId2"),[("hand.png","rId2")]))
# 7 form (views right)
defs.append((s_img_right("FORM","A soft pebble, not a device.",
   ["Ø140 × 24 mm smooth white-ceramic saucer.",
    "Rounded everywhere — no sharp corner.",
    "One spiral groove flowing into a center dish.",
    "Lift-to-wake, no visible buttons."],"views.png","rId2"),[("views.png","rId2")]))
# 8 context full bleed
defs.append((s_fullbleed("rId2","IN CONTEXT","It lives on the desk like a quiet invitation."),[("context.png","rId2")]))
# 9 light & build (exploded right)
defs.append((s_img_right("LIGHT & BUILD","The calm is engineered.",
   ["LEDs feed a diffuser in the groove floor — light lives inside the channel, no visible bulbs.",
    "A soft point travels the groove to set the breath; warm amber, never a cold notification.",
    "Warming layer + weighted base; USB-C, lift-to-wake."],"exploded.png","rId2"),[("exploded.png","rId2")]))
# 10 materials full bleed
defs.append((s_fullbleed("rId2","MATERIALS","One ritual, made for any desk."),[("variants.png","rId2")]))
# 11 closing (dark)
defs.append((slide_text("THE TAKEAWAY","We didn't design a disc. We designed three quiet minutes.",
   ["Next: a physical prototype with a real engraved groove and warm light band,",
    "HRV validation of the calm effect, and a short field study to see if it survives the novelty-fade."],bg=DARK,titlecolor=WHITE),[]))

# ---------- assemble pptx ----------
def ct_xml(n):
    ov=""
    for i in range(1,n+1):
        ov+=f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        ov+=f'<Override PartName="/ppt/notesSlides/notesSlide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      '<Default Extension="xml" ContentType="application/xml"/>'
      '<Default Extension="png" ContentType="image/png"/>'
      '<Default Extension="jpeg" ContentType="image/jpeg"/>'
      '<Default Extension="jpg" ContentType="image/jpeg"/>'
      '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
      '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
      '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
      '<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>'
      '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
      +ov+'</Types>')

RELS_ROOT=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
  '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
  '</Relationships>')

CORE=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
  'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
  '<dc:title>Labyrinth</dc:title><dc:creator>Shuoning Shi</dc:creator>'
  '<cp:lastModifiedBy>Shuoning Shi</cp:lastModifiedBy></cp:coreProperties>')

def APP(n):
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
      'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
      f'<TotalTime>0</TotalTime><Words>0</Words><Application>Labyrinth Deck</Application>'
      f'<PresentationFormat>Widescreen</PresentationFormat><Slides>{n}</Slides>'
      '<Company></Company><AppVersion>16.0000</AppVersion></Properties>')

def pres_xml(n):
    sids="".join(f'<p:sldId id="{255+i}" r:id="rIdS{i}"/>' for i in range(1,n+1))
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
      'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
      '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdM"/></p:sldMasterIdLst>'
      '<p:notesMasterIdLst><p:notesMasterId r:id="rIdNM"/></p:notesMasterIdLst>'
      f'<p:sldIdLst>{sids}</p:sldIdLst>'
      f'<p:sldSz cx="{EMU_W}" cy="{EMU_H}" type="screen16x9"/>'
      f'<p:notesSz cx="{EMU_H}" cy="{EMU_W}"/></p:presentation>')

def pres_rels(n):
    r=['<Relationship Id="rIdM" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',
       '<Relationship Id="rIdNM" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="notesMasters/notesMaster1.xml"/>',
       '<Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>']
    for i in range(1,n+1):
        r.append(f'<Relationship Id="rIdS{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>')
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+''.join(r)+'</Relationships>'

def slide_xml(sp):
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
      'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>'
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
      '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
      +sp+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>')

def slide_rels(i,imgs):
    r=[f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
       f'<Relationship Id="rIdN" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide{i}.xml"/>']
    for f,rid in imgs:
        r.append(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/{f}"/>')
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+''.join(r)+'</Relationships>'

def notes_xml(text):
    body=(f'<a:p><a:r><a:rPr lang="en-US" sz="1400"/><a:t>{esc(text)}</a:t></a:r></a:p>')
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
      'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>'
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
      '<p:grpSpPr/>'
      '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
      '<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/>'
      f'<p:txBody><a:bodyPr/><a:lstStyle/>{body}</p:txBody></p:sp>'
      '</p:spTree></p:cSld></p:notes>')

def notes_rels(i):
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide{i}.xml"/>'
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>'
      '</Relationships>')

def blank_tree():
    return ('<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
      '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>')

MASTER=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
  'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="'+PAPER+'"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>'
  +blank_tree()+'</p:spTree></p:cSld>'
  '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
  '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
  '<p:txStyles>'
  '<p:titleStyle><a:lvl1pPr><a:defRPr sz="4400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>'
  '<a:latin typeface="+mj-lt"/></a:defRPr></a:lvl1pPr></p:titleStyle>'
  '<p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>'
  '<a:latin typeface="+mn-lt"/></a:defRPr></a:lvl1pPr>'
  '<a:lvl2pPr><a:defRPr sz="1600"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl2pPr>'
  '<a:lvl3pPr><a:defRPr sz="1400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl3pPr>'
  '<a:lvl4pPr><a:defRPr sz="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl4pPr>'
  '<a:lvl5pPr><a:defRPr sz="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl5pPr></p:bodyStyle>'
  '<p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl1pPr></p:otherStyle>'
  '</p:txStyles></p:sldMaster>')
MASTER_RELS=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
  '<Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
  '</Relationships>')
LAYOUT=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
  'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>'
  +blank_tree()+'</p:spTree></p:cSld>'
  '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>')
LAYOUT_RELS=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
  '</Relationships>')
NOTESMASTER=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  '<p:notesMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
  'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>'
  +blank_tree()+
  '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
  '<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>'
  f'<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{EMU_H}" cy="{EMU_W}"/></a:xfrm></p:spPr>'
  '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>'
  '</p:spTree></p:cSld>'
  '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
  '<p:notesStyle>'
  '<a:lvl1pPr><a:defRPr sz="1400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl1pPr>'
  '<a:lvl2pPr><a:defRPr sz="1400"/></a:lvl2pPr><a:lvl3pPr><a:defRPr sz="1400"/></a:lvl3pPr>'
  '<a:lvl4pPr><a:defRPr sz="1400"/></a:lvl4pPr><a:lvl5pPr><a:defRPr sz="1400"/></a:lvl5pPr>'
  '</p:notesStyle>'
  '</p:notesMaster>')
NOTESMASTER_RELS=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  '<Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
  '</Relationships>')
THEME=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office"><a:themeElements>'
  '<a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'
  '<a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>'
  '<a:accent1><a:srgbClr val="'+AMBER+'"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>'
  '<a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6>'
  '<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>'
  '<a:fontScheme name="Office"><a:majorFont><a:latin typeface="Helvetica Neue"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>'
  '<a:minorFont><a:latin typeface="Helvetica Neue"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'
  '<a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
  '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
  '<a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>'
  '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
  '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>'
  '</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>')

N=len(defs)
out=os.path.join(BASE,"Labyrinth.pptx")
media_used={}
with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml",ct_xml(N))
    z.writestr("_rels/.rels",RELS_ROOT)
    z.writestr("docProps/core.xml",CORE)
    z.writestr("docProps/app.xml",APP(N))
    z.writestr("ppt/presentation.xml",pres_xml(N))
    z.writestr("ppt/_rels/presentation.xml.rels",pres_rels(N))
    z.writestr("ppt/theme/theme1.xml",THEME)
    z.writestr("ppt/slideMasters/slideMaster1.xml",MASTER)
    z.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels",MASTER_RELS)
    z.writestr("ppt/slideLayouts/slideLayout1.xml",LAYOUT)
    z.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels",LAYOUT_RELS)
    z.writestr("ppt/notesMasters/notesMaster1.xml",NOTESMASTER)
    z.writestr("ppt/notesMasters/_rels/notesMaster1.xml.rels",NOTESMASTER_RELS)
    for i,(sp,imgs) in enumerate(defs,1):
        z.writestr(f"ppt/slides/slide{i}.xml",slide_xml(sp))
        z.writestr(f"ppt/slides/_rels/slide{i}.xml.rels",slide_rels(i,imgs))
        z.writestr(f"ppt/notesSlides/notesSlide{i}.xml",notes_xml(NOTES[i-1]))
        z.writestr(f"ppt/notesSlides/_rels/notesSlide{i}.xml.rels",notes_rels(i))
        for f,rid in imgs: media_used[f]=1
    for f in media_used:
        with open(os.path.join(IMG,f),"rb") as fh: z.writestr(f"ppt/media/{f}",fh.read())
print("wrote",out,"slides:",N,"media:",list(media_used))
