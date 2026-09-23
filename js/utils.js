/* Utilitários */
const $ = s => document.querySelector(s);
const brl = v => Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtNum = v => Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const esc = s => String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const initials = n => String(n||"").trim().slice(0,2).toUpperCase();
const parseMoney = t => { let s=String(t).replace(/[^\d,.]/g,""); if(s.includes(",")) s=s.replace(/\./g,"").replace(",","."); else if(/\.\d{3}$/.test(s)) s=s.replace(/\./g,""); const v=parseFloat(s); return isFinite(v)?Math.round(v*100)/100:NaN; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2));
const lsGet = (k,def=null) => { try{ const v=localStorage.getItem(k); return v===null?def:JSON.parse(v); }catch(e){ return def; } };
const lsSet = (k,v) => { try{ v===null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const priceLabel = p => p.ate!=null ? `${brl(p.valor)} a ${brl(p.ate)}` : p.aPartirDe ? `a partir de ${brl(p.valor)}` : brl(p.valor);
const catOrder = cats => [...CATS.filter(c=>cats.includes(c)), ...cats.filter(c=>!CATS.includes(c))];
let tt; function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),2600);}
