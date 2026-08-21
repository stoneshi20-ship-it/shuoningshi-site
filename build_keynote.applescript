set outPath to (POSIX file "/Users/stoneshi/Desktop/Labyrinth.key")
set imgDir to "/Users/stoneshi/Desktop/shuoningshi-site/images/product/"
tell application "Keynote"
  activate
  set doc to make new document
  set W to width of doc
  set H to height of doc
  -- remove default slides except one we will reuse
  tell doc
    set s to slide 1
    set the current slide of doc to s
    tell s
      set presenter notes to "Hey — so this is Labyrinth. The brief was simple on paper: a desk device that helps busy executives find a little calm in the middle of the day. But the more I dug in, the more I realized the hard part isn't relaxation — it's everything around it. Let me walk you through it."
      set im to make new image with properties {file:(imgDir & "hero.png")}
      set width of im to (W*0.42)
      set position of im to {W*0.54, H*0.13}
      set eb to make new text item
      delay 0.12
      set object text of eb to "DESIGNING AN EXPERIENCE, NOT JUST AN OBJECT"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "Labyrinth"
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.44
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "A desk ritual that gives a busy executive three minutes to breathe, trace, and come back down."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.44
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "First, the mindset I went in with. I didn't want to design a machine. I wanted to design a moment — three quiet minutes someone can actually take at their desk. So the whole time, the question wasn't what features it has, it was what that pause feels like."
      set eb to make new text item
      delay 0.12
      set object text of eb to "THE INTENT"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "We set out to shape a moment, not a machine."
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.82
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "A meditation app asks for your attention. Labyrinth asks for almost nothing.
You reach out, your finger falls into the groove, a warm light breathes ahead of it, and for three minutes the day goes quiet.
That feeling is the product; the ceramic disc is just how it reaches you."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.8
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "Here's the real problem. Executives don't actually lack breaks — they lack a break they feel allowed to take. Their day is chopped into three-to-eight-minute gaps. They're often in a glass office, so anything they do is on show. And they've got zero patience for setup. So the bar was high: fast, low-key, basically invisible."
      set eb to make new text item
      delay 0.12
      set object text of eb to "THE PROBLEM"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "Executives don't lack breaks. They lack a break they're allowed to take."
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.82
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "Fragmented — 3–8 min between meetings, easily interrupted.
Low-key — open, glass-walled offices; the reset stays discreet.
Zero setup — no pairing, no screen, one gesture."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.8
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "To get there I kept research small but real — desk research, a short survey, a couple interviews, usability testing. Every quote pointed at a design move. 'I never step away' — so it happens right at the desk. 'Apps? too long, another screen' — so no screen, no audio. 'It has to be low-key' — so it looks like touching an object. And here's the prototype — you follow the warm light: inward as you breathe in, back out as you breathe out. No instructions, nothing to learn."
      set im to make new image with properties {file:(imgDir & "demo-poster.jpg")}
      set width of im to (W*0.42)
      set position of im to {W*0.54, H*0.13}
      set eb to make new text item
      delay 0.12
      set object text of eb to "USER STUDY"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "What people told us — and what it changed"
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.44
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "“I never step away.” → a reset right at the desk, under 3 min.
“Apps? Too long, another screen.” → no screen, no audio.
“It has to be low-key.” → reads as touching a desk object.
“It sits on my desk.” → aesthetics & material matter.
Hands already fidget → give them a groove to trace.
“Can't switch off on command.” → the light leads the breath."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.44
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "Those conversations boiled down to six truths — and I treated each as a hard constraint. Low-key. Apps get abandoned, so no screen. Hands already fidget, so give them something better. People can't just decide to relax, so something external leads. It has to survive interruption — stop and resume, no guilt. And taste and material matter, because this lives on their desk."
      set eb to make new text item
      delay 0.12
      set object text of eb to "WHAT WE LEARNED"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "Six truths that became design constraints"
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.82
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "01  Low-key — discreet; touching an object, not doing wellness.
02  Apps get abandoned — no screen, no audio, under 3 min.
03  Hands already fidget — redirect the behaviour.
04  Guide me, don't ask me — the light leads.
05  Stop & resume anytime — no timer, no fail state.
06  Taste & material matter — it lives on their desk."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.8
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "So the interaction is one gesture. Your finger falls into a single spiral groove and follows the light. The groove limits how fast you can move, so you slow down whether you mean to or not. Keep pace with the light and the path glows warmer — a quiet 'you've got it.'"
      set im to make new image with properties {file:(imgDir & "hand.png")}
      set width of im to (W*0.42)
      set position of im to {W*0.54, H*0.13}
      set eb to make new text item
      delay 0.12
      set object text of eb to "THE INTERACTION"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "One gesture. Trace, and slow down."
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.44
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "Your finger follows a warm light inward as you breathe in, outward as you breathe out.
The groove limits your speed, so you can't rush.
Keep pace and the path glows warmer — a quiet “you've got it.”"
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.44
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "Form-wise, I wanted a soft pebble, not a device. A smooth white-ceramic saucer, palm-sized, rounded everywhere — no sharp edges. One spiral groove flowing into a little dish in the center. And no buttons on show — you just lift it to wake it."
      set im to make new image with properties {file:(imgDir & "views.png")}
      set width of im to (W*0.42)
      set position of im to {W*0.54, H*0.13}
      set eb to make new text item
      delay 0.12
      set object text of eb to "FORM"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "A soft pebble, not a device."
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.44
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "Ø140 × 24 mm smooth white-ceramic saucer.
Rounded everywhere — no sharp corner.
One spiral groove flowing into a center dish.
Lift-to-wake, no visible buttons."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.44
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "This is it on a desk. It doesn't read as tech — it reads as a quiet object you'd want to keep there. That was the point: it invites you in without demanding anything."
      set im to make new image with properties {file:(imgDir & "context.png")}
      set position of im to {0,0}
      set width of im to W
      set height of im to H
      set eb to make new text item
      delay 0.12
      set object text of eb to "IN CONTEXT"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "It lives on the desk like a quiet invitation."
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.82
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "Under the calm, it is engineered. A ring of LEDs feeds a diffuser in the floor of the groove, so the light looks like it lives inside the channel — you never see a bulb. A soft point travels the groove to pace your breath, in warm amber, never a cold notification. Plus a gentle warming layer and a weighted base."
      set im to make new image with properties {file:(imgDir & "exploded.png")}
      set width of im to (W*0.42)
      set position of im to {W*0.54, H*0.13}
      set eb to make new text item
      delay 0.12
      set object text of eb to "LIGHT & BUILD"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "The calm is engineered."
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.44
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "LEDs feed a diffuser in the groove floor — light lives inside the channel.
A soft point travels the groove to set the breath; warm amber, never cold.
Warming layer + weighted base; USB-C, lift-to-wake."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.44
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "One ritual, but it can suit any desk — ceramic, marble, amber resin, aluminium, walnut, dark stone. Same object, different personalities."
      set im to make new image with properties {file:(imgDir & "variants.png")}
      set position of im to {0,0}
      set width of im to W
      set height of im to H
      set eb to make new text item
      delay 0.12
      set object text of eb to "MATERIALS"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "One ritual, made for any desk."
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.82
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "Ceramic · marble · amber resin · aluminium · walnut · dark stone."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.8
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
    set s to make new slide at end of slides
    delay 0.15
    set the current slide of doc to s
    tell s
      set presenter notes to "So to wrap up — I didn't really design a disc. I designed three quiet minutes. Next would be a physical prototype with the real engraved groove and light, and validating the calming effect with heart-rate data. But the core idea is here: something small and beautiful that gives a busy person permission to breathe. Thanks — happy to take questions."
      set eb to make new text item
      delay 0.12
      set object text of eb to "THE TAKEAWAY"
      set position of eb to {W*0.06, H*0.10}
      set width of eb to W*0.8
      tell object text of eb
        set size of every character to 18
        set color of every character to {45232,28527,12336}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set ti to make new text item
      delay 0.12
      set object text of ti to "We didn't design a disc. We designed three quiet minutes."
      set position of ti to {W*0.06, H*0.16}
      set width of ti to W*0.82
      tell object text of ti
        set size of every character to 40
        set color of every character to {10794,9766,8738}
        set font of every character to "HelveticaNeue-Bold"
      end tell
      set bd to make new text item
      delay 0.12
      set object text of bd to "Next: a physical prototype with a real engraved groove and warm light band,
HRV validation of the calm effect, and a short field study."
      set position of bd to {W*0.06, H*0.38}
      set width of bd to W*0.8
      tell object text of bd
        set size of every character to 20
        set color of every character to {28527,27242,25443}
        set font of every character to "HelveticaNeue"
      end tell
    end tell
  end tell
  save doc in outPath
end tell
return "OK"