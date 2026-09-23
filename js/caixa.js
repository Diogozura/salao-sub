/* Profissional: lançamento de atendimentos e fila offline */
let catalogo = lsGet(LS.catalogo);   // cache para abrir rápido
let selProc = null;
const procById = id => (catalogo?.procedimentos||[]).find(p=>p.id===id);

async function carregarCatalogo(){
  if(catalogo) renderProcs();
  try{ catalogo = await api("catalogo",{},{silencioso:!!catalogo}); lsSet(LS.catalogo,catalogo); renderProcs(); }
  catch(err){ if(!catalogo) $("#procs").innerHTML=`<p class="loading">${esc(err.message)}</p>`; }
}
function renderProcs(){
  const procs = catalogo?.procedimentos||[];
  if(selProc && !procById(selProc)) selProc=null;
  $("#procs").innerHTML = catOrder([...new Set(procs.map(p=>p.categoria))]).map(c=>
    `<div class="cat">${esc(c)}</div><div class="procs">${procs.filter(p=>p.categoria===c).map(p=>
      `<button type="button" data-p="${esc(p.id)}" aria-pressed="${selProc===p.id}"><span class="pn">${esc(p.nome)}</span><span class="pv num">${priceLabel(p)}</span></button>`).join("")}</div>`
  ).join("") || `<p class="empty">Nenhum procedimento cadastrado.</p>`;
  updateSummary();
}
function updateSummary(){
  const p = selProc && procById(selProc);
  $("#charge").hidden = !(p && p.variavel);
  $("#sum-left").hidden = !!(p && p.variavel);
  $("#sel-total").textContent = brl(p ? p.valor : 0);
  $("#sel-desc").textContent = p ? p.nome : "Nenhum procedimento selecionado";
  $("#btn-add").disabled = !p;
  $("#charge-err").textContent = "";
}
$("#procs").addEventListener("click",e=>{
  const b=e.target.closest("button[data-p]"); if(!b) return;
  selProc=b.dataset.p; renderProcs();
  const p=procById(selProc);
  if(p.variavel){ $("#charge-val").value=fmtNum(p.valor); $("#charge-val").focus(); $("#charge-val").select(); }
});

$("#btn-add").addEventListener("click", async ()=>{
  const p = procById(selProc); if(!p) return;
  const req = { procedimentoId:p.id, clientId:uid() };
  if(p.variavel){
    const v = parseMoney($("#charge-val").value);
    if(!(v>0)){ $("#charge-err").textContent="Digite o valor cobrado, ex.: 550,00."; return; }
    if(v<p.valor || (p.ate!=null && v>p.ate)){ $("#charge-err").textContent=`O valor de ${p.nome} deve ficar ${p.ate!=null?`entre ${brl(p.valor)} e ${brl(p.ate)}`:`a partir de ${brl(p.valor)}`}.`; return; }
    req.valor = v;
  }
  const b=$("#btn-add"); b.disabled=true; b.textContent="Salvando…";
  try{
    const d = await api("lancar", req);
    toast(`${d.lancamento.procedimento} lançado · ${brl(d.lancamento.valor)}`);
    selProc=null; renderProcs(); carregarMeuDia();
  }catch(err){
    if(err.codigo==="REDE"){
      const fila = lsGet(LS.fila,[]); fila.push({...req, nome:p.nome, valorPrevisto:req.valor??p.valor}); lsSet(LS.fila,fila);
      toast("Sem internet — o lançamento foi guardado e será enviado sozinho.");
      selProc=null; renderProcs(); renderFila();
    } else { $("#charge-err").textContent = err.message; }
  }finally{ b.textContent="Lançar"; updateSummary(); }
});

async function carregarMeuDia(){
  try{
    const d = await api("meuDia",{},{silencioso:true});
    $("#mine").innerHTML = `Você lançou <b>${d.quantidade}</b> atendimento${d.quantidade===1?"":"s"} hoje.`;
    $("#mine-list").innerHTML = d.lancamentos.slice(0,5).map(l=>`<li><span>${esc(l.hora)} · <b>${esc(l.procedimento)}</b></span><span class="num">${brl(l.valor)}</span></li>`).join("");
  }catch(e){}
}

/* Fila offline: reenvia com o mesmo clientId (o servidor não duplica) */
let enviandoFila=false;
function renderFila(){
  const fila = lsGet(LS.fila,[]);
  $("#pending").hidden = !fila.length || !user || user.papel==="admin";
  $("#pending").innerHTML = `<span><b>${fila.length}</b> lançamento${fila.length===1?"":"s"} aguardando internet (${esc(fila.map(f=>f.nome).join(", "))})</span><button class="btn ghost" type="button" id="btn-fila">Enviar agora</button>`;
}
async function enviarFila(){
  if(enviandoFila || !lsGet(LS.token)) return;
  let fila = lsGet(LS.fila,[]); if(!fila.length) return;
  enviandoFila=true;
  try{
    while(fila.length){
      const {nome, valorPrevisto, ...req} = fila[0];
      try{ await api("lancar", req, {silencioso:true}); }
      catch(err){
        if(err.codigo==="REDE" || err.codigo==="SESSAO") break;
        toast(`Não foi possível lançar ${nome}: ${err.message}`);
      }
      fila.shift(); lsSet(LS.fila,fila);
    }
  } finally { enviandoFila=false; renderFila(); if(user && user.papel!=="admin") carregarMeuDia(); }
}
$("#pending").addEventListener("click",e=>{ if(e.target.id==="btn-fila") enviarFila(); });
window.addEventListener("online", enviarFila);
setInterval(enviarFila, 30000);
