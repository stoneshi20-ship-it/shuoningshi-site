#!/usr/bin/env python3
# Generate an AppleScript that builds the Labyrinth deck natively in Keynote (valid .key).
import os
BASE=os.path.dirname(os.path.abspath(__file__))
IMG=os.path.join(BASE,"images","product")

INK="{10794,9766,8738}"; SUB="{28527,27242,25443}"; AMBER="{45232,28527,12336}"; WHITE="{65535,65535,65535}"

NOTES=[
"Hey — so this is Labyrinth. The brief was simple on paper: a desk device that helps busy executives find a little calm in the middle of the day. But the more I dug in, the more I realized the hard part isn't relaxation — it's everything around it. Let me walk you through it.",
"First, the mindset I went in with. I didn't want to design a machine. I wanted to design a moment — three quiet minutes someone can actually take at their desk. So the whole time, the question wasn't what features it has, it was what that pause feels like.",
"Here's the real problem. Executives don't actually lack breaks — they lack a break they feel allowed to take. Their day is chopped into three-to-eight-minute gaps. They're often in a glass office, so anything they do is on show. And they've got zero patience for setup. So the bar was high: fast, low-key, basically invisible.",
"To get there I kept research small but real — desk research, a short survey, a couple interviews, usability testing. Every quote pointed at a design move. 'I never step away' — so it happens right at the desk. 'Apps? too long, another screen' — so no screen, no audio. 'It has to be low-key' — so it looks like touching an object. And here's the prototype — you follow the warm light: inward as you breathe in, back out as you breathe out. No instructions, nothing to learn.",
"Those conversations boiled down to six truths — and I treated each as a hard constraint. Low-key. Apps get abandoned, so no screen. Hands already fidget, so give them something better. People can't just decide to relax, so something external leads. It has to survive interruption — stop and resume, no guilt. And taste and material matter, because this lives on their desk.",
"So the interaction is one gesture. Your finger falls into a single spiral groove and follows the light. The groove limits how fast you can move, so you slow down whether you mean to or not. Keep pace with the light and the path glows warmer — a quiet 'you've got it.'",
"Form-wise, I wanted a soft pebble, not a device. A smooth white-ceramic saucer, palm-sized, rounded everywhere — no sharp edges. One spiral groove flowing into a little dish in the center. And no buttons on show — you just lift it to wake it.",
"This is it on a desk. It doesn't read as tech — it reads as a quiet object you'd want to keep there. That was the point: it invites you in without demanding anything.",
"Under the calm, it is engineered. A ring of LEDs feeds a diffuser in the floor of the groove, so the light looks like it lives inside the channel — you never see a bulb. A soft point travels the groove to pace your breath, in warm amber, never a cold notification. Plus a gentle warming layer and a weighted base.",
"One ritual, but it can suit any desk — ceramic, marble, amber resin, aluminium, walnut, dark stone. Same object, different personalities.",
"So to wrap up — I didn't really design a disc. I designed three quiet minutes. Next would be a physical prototype with the real engraved groove and light, and validating the calming effect with heart-rate data. But the core idea is here: something small and beautiful that gives a busy person permission to breathe. Thanks — happy to take questions.",
]

# slide defs: (eyebrow, title, body_lines, bullets, image, mode)  mode: 'right'|'full'|None
S=[
 ("DESIGNING AN EXPERIENCE, NOT JUST AN OBJECT","Labyrinth",
  ["A desk ritual that gives a busy executive three minutes to breathe, trace, and come back down."],[],"hero.png","right"),
 ("THE INTENT","We set out to shape a moment, not a machine.",
  ["A meditation app asks for your attention. Labyrinth asks for almost nothing.",
   "You reach out, your finger falls into the groove, a warm light breathes ahead of it, and for three minutes the day goes quiet.",
   "That feeling is the product; the ceramic disc is just how it reaches you."],[],None,None),
 ("THE PROBLEM","Executives don't lack breaks. They lack a break they're allowed to take.",
  [],["Fragmented — 3–8 min between meetings, easily interrupted.",
   "Low-key — open, glass-walled offices; the reset stays discreet.",
   "Zero setup — no pairing, no screen, one gesture."],None,None),
 ("USER STUDY","What people told us — and what it changed",
  [],["“I never step away.” → a reset right at the desk, under 3 min.",
   "“Apps? Too long, another screen.” → no screen, no audio.",
   "“It has to be low-key.” → reads as touching a desk object.",
   "“It sits on my desk.” → aesthetics & material matter.",
   "Hands already fidget → give them a groove to trace.",
   "“Can't switch off on command.” → the light leads the breath."],"demo-poster.jpg","right"),
 ("WHAT WE LEARNED","Six truths that became design constraints",
  [],["01  Low-key — discreet; touching an object, not doing wellness.",
   "02  Apps get abandoned — no screen, no audio, under 3 min.",
   "03  Hands already fidget — redirect the behaviour.",
   "04  Guide me, don't ask me — the light leads.",
   "05  Stop & resume anytime — no timer, no fail state.",
   "06  Taste & material matter — it lives on their desk."],None,None),
 ("THE INTERACTION","One gesture. Trace, and slow down.",
  ["Your finger follows a warm light inward as you breathe in, outward as you breathe out.",
   "The groove limits your speed, so you can't rush.",
   "Keep pace and the path glows warmer — a quiet “you've got it.”"],[],"hand.png","right"),
 ("FORM","A soft pebble, not a device.",
  [],["Ø140 × 24 mm smooth white-ceramic saucer.",
   "Rounded everywhere — no sharp corner.",
   "One spiral groove flowing into a center dish.",
   "Lift-to-wake, no visible buttons."],"views.png","right"),
 ("IN CONTEXT","It lives on the desk like a quiet invitation.",
  [],[],"context.png","full"),
 ("LIGHT & BUILD","The calm is engineered.",
  [],["LEDs feed a diffuser in the groove floor — light lives inside the channel.",
   "A soft point travels the groove to set the breath; warm amber, never cold.",
   "Warming layer + weighted base; USB-C, lift-to-wake."],"exploded.png","right"),
 ("MATERIALS","One ritual, made for any desk.",
  ["Ceramic · marble · amber resin · aluminium · walnut · dark stone."],[],"variants.png","full"),
 ("THE TAKEAWAY","We didn't design a disc. We designed three quiet minutes.",
  ["Next: a physical prototype with a real engraved groove and warm light band,",
   "HRV validation of the calm effect, and a short field study."],[],None,None),
]

def esc(s): return s.replace("\\","\\\\").replace('"','\\"')

lines=[]
a=lines.append
a('set outPath to (POSIX file "'+os.path.join(os.path.expanduser("~"),"Desktop","Labyrinth.key")+'")')
a('set imgDir to "'+IMG+'/"')
a('tell application "Keynote"')
a('  activate')
a('  set doc to make new document')
a('  set W to width of doc')
a('  set H to height of doc')
a('  -- remove default slides except one we will reuse')
a('  tell doc')
for i,(eb,title,body,bul,img,mode) in enumerate(S):
    if i==0:
        a('    set s to slide 1')
    else:
        a('    set s to make new slide at end of slides')
        a('    delay 0.15')
    a('    set the current slide of doc to s')
    a('    tell s')
    a('      set presenter notes to "'+esc(NOTES[i])+'"')
    # image
    if img and mode=="full":
        a('      set im to make new image with properties {file:(imgDir & "'+img+'")}')
        a('      set position of im to {0,0}')
        a('      set width of im to W')
        a('      set height of im to H')
    elif img and mode=="right":
        a('      set im to make new image with properties {file:(imgDir & "'+img+'")}')
        a('      set width of im to (W*0.42)')
        a('      set position of im to {W*0.54, H*0.13}')
    # eyebrow
    a('      set eb to make new text item')
    a('      delay 0.12')
    a('      set object text of eb to "'+esc(eb)+'"')
    a('      set position of eb to {W*0.06, H*0.10}')
    a('      set width of eb to W*0.8')
    a('      tell object text of eb')
    a('        set size of every character to 18')
    a('        set color of every character to '+AMBER)
    a('        set font of every character to "HelveticaNeue-Bold"')
    a('      end tell')
    # title
    tw = 0.44 if mode=="right" else 0.82
    a('      set ti to make new text item')
    a('      delay 0.12')
    a('      set object text of ti to "'+esc(title)+'"')
    a('      set position of ti to {W*0.06, H*0.16}')
    a('      set width of ti to W*'+str(tw))
    a('      tell object text of ti')
    a('        set size of every character to 40')
    a('        set color of every character to '+INK)
    a('        set font of every character to "HelveticaNeue-Bold"')
    a('      end tell')
    # body / bullets
    blob=""
    if body: blob="\n".join(body)
    if bul: blob=("\n".join(bul)) if not body else blob+"\n"+"\n".join(bul)
    if blob:
        bw = 0.44 if mode=="right" else 0.80
        a('      set bd to make new text item')
        a('      delay 0.12')
        a('      set object text of bd to "'+esc(blob)+'"')
        a('      set position of bd to {W*0.06, H*0.38}')
        a('      set width of bd to W*'+str(bw))
        a('      tell object text of bd')
        a('        set size of every character to 20')
        a('        set color of every character to '+SUB)
        a('        set font of every character to "HelveticaNeue"')
        a('      end tell')
    a('    end tell')
a('  end tell')
a('  save doc in outPath')
a('end tell')
a('return "OK"')

script="\n".join(lines)
open(os.path.join(BASE,"build_keynote.applescript"),"w").write(script)
print("wrote build_keynote.applescript ("+str(len(script))+" chars)")
