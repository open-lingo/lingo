import { chromium } from "@playwright/test";
const BASE="http://localhost:5173";
const HAN=/\p{Script=Han}/u;
const lessons=["ja-m14-3-1","ja-m21-4-1","ja-m15-4-1","ja-m22-2-2","ja-m16-1-2","ja-m17-8-1"];
const b=await chromium.launch({channel:"chromium",headless:true});
const ctx=await b.newContext({viewport:{width:1366,height:900}});
const page=await ctx.newPage();
for(const id of lessons){
  for(let n=1;n<=8;n++){
    const url=`${BASE}/ja/learn/lessons/${id}?step=match_pairs.${n}`;
    try{
      await page.goto(url,{waitUntil:"domcontentloaded",timeout:12000});
      await page.waitForTimeout(700);
      const r=await page.evaluate((HANs)=>{
        const re=new RegExp(HANs,"u");
        // source tiles: buttons in the match grid. Grab all rubies + their base.
        const rubies=[...document.querySelectorAll("ruby")].map(r=>{
          const rt=r.querySelector("rt"); const base=(r.textContent||"").replace(rt?.textContent||"","");
          return base;
        });
        const kanjiRuby=rubies.filter(bs=>re.test(bs));
        const bodyHasHanWord=/[一-鿿]/.test(document.body.textContent||"");
        return {rubies:rubies.length, kanjiRuby, sample:rubies.slice(0,8)};
      }, HAN.source);
      if(r.kanjiRuby.length||r.rubies) console.log(id,`m.${n}`,"rubies",r.rubies,"KANJI",JSON.stringify(r.kanjiRuby),"sample",JSON.stringify(r.sample));
      if(r.kanjiRuby.length) break;
    }catch(e){/*skip*/}
  }
}
await b.close();
