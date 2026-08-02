#!/usr/bin/env python3
from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parent.parent
BASE={"vorlage/dokument.js":33,"vorlage/erfassen.js":14,"vorlage/onboarding.js":0,"vorlage/ordnung.js":0,"vorlage/sheets.js":50,"vorlage/sperre.js":0,"vorlage/tabs.js":34,"vorlage/verwaltung.js":31}
TAG=re.compile(r"<(div|span)\b[^>`]*?\bonClick=", re.S); BTN=re.compile(r"<button\b[^>`]*?\bonClick=", re.S); NOTYPE=re.compile(r"<button\b(?![^>`]*\btype=)", re.S)
def main():
 print("Barrierefreiheits-Leitplanken"); err=[]; dt=bt=0
 for p in sorted((ROOT/"vorlage").glob("*.js")):
  name=p.relative_to(ROOT).as_posix(); s=p.read_text(); d=len(TAG.findall(s)); b=len(BTN.findall(s)); dt+=d; bt+=b
  if d>BASE.get(name,0): err.append(f"{name}: klickbare div/span gestiegen")
  if NOTYPE.search(s): err.append(f"{name}: button ohne type")
  print(f"  ok      {name}: {d} klickbare div/span, {b} button")
 if bt<25: err.append("Button-Migration nicht nachweisbar (erwartet mindestens 25)")
 if err: print("\nFehler:\n"+"\n".join("  - "+e for e in err)); return 1
 print(f"\nA11y-Baseline steht: {bt} Buttons, {dt} verbleibende klickbare div/span"); return 0
if __name__=="__main__": sys.exit(main())
