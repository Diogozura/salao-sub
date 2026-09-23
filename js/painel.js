/* Admin: painel */
let periodo="semana", painel=null, pendingDel=null;
const nomePeriodo = {hoje:"hoje", semana:"nesta semana", mes:"neste mês"};
async function carregarPainel(silencioso=false){
  try{
    painel = await api("painel",{periodo},{silencioso});
    renderPainel();
  }catch(err){ $("#data-note").textContent = err.message; }
}
function rankHTML(rows, metric, fmt, note){
  const max = Math.max(1,...rows.map(metric));
  return rows.length ? rows.map((r,i)=>`<li><span class="pos">${i+1}</span><div><div class="nm">${esc(r.nome)}<span>${note(r)}</span></div><div class="track"><div class="fill" style="width:${(metric(r)/max*100).toFixed(1)}%"></div></div></div><span class="val num">${fmt(r)}</span></li>`).join("")
    : `<li class="empty">Sem lançamentos ${nomePeriodo[periodo]}.</li>`;
}
function renderPainel(){
  const d=painel, k=d.kpis;
  const fmtD = s => new Date(s+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
  $("#admin-period").textContent = `Semana de ${fmtD(d.semana.inicio)} a ${fmtD(d.semana.fim)} · rankings ${nomePeriodo[periodo]}`;
  $("#k-today").textContent = brl(k.hojeTotal);
  $("#k-today-n").textContent = `${k.hojeQuantidade} atendimento${k.hojeQuantidade===1?"":"s"}`;
  $("#k-week").textContent = brl(k.semanaTotal);
  $("#k-week-n").textContent = k.variacaoSemanaPct===null ? "desde segunda" : `${k.variacaoSemanaPct>=0?"▲":"▼"} ${Math.abs(k.variacaoSemanaPct)}% vs. semana passada`;
  $("#k-ticket").textContent = brl(k.ticketMedio); $("#k-ticket-n").textContent = nomePeriodo[periodo];
  $("#k-count").textContent = k.periodoQuantidade; $("#k-count-n").textContent = nomePeriodo[periodo];

  const max = Math.max(1,...d.semanaPorDia.map(x=>x.total));
  $("#chart").innerHTML = d.semanaPorDia.map(x=>{ const hj=x.data===d.hoje;
    const curto = x.total>=1000 ? (x.total/1000).toLocaleString("pt-BR",{maximumFractionDigits:1})+"k" : Math.round(x.total);
    return `<div class="bar${hj?" today":""}"><span class="amt num">${x.total?`<span class="amt-l">R$ ${Math.round(x.total).toLocaleString("pt-BR")}</span><span class="amt-s">${curto}</span>`:(x.futuro?"":"—")}</span><div class="col" style="height:${(x.total/max*78).toFixed(1)}%"></div></div>`;}).join("");
  $("#days").innerHTML = d.semanaPorDia.map(x=>`<span class="${x.data===d.hoje?"today":""}">${x.dia}</span>`).join("");

  $("#rank-proc").innerHTML = rankHTML(d.procedimentos.slice(0,8), r=>r.quantidade, r=>r.quantidade+"×", r=>brl(r.total));
  $("#proc-sub").textContent = `Por quantidade ${nomePeriodo[periodo]}`;
  $("#rank-staff").innerHTML = rankHTML(d.profissionais, r=>r.total, r=>brl(r.total), r=>r.quantidade+" atend.");
  $("#staff-sub").textContent = `Faturamento por profissional ${nomePeriodo[periodo]}`;

  $("#today-total").textContent = brl(k.hojeTotal);
  $("#today-list").innerHTML = d.lancamentosHoje.length ? d.lancamentosHoje.map(l=>{
    const conf=pendingDel===l.id;
    return `<li><span class="time num">${esc(l.hora)}</span><div class="what"><b>${esc(l.procedimento)}</b><span>${esc(l.profissional)}</span></div><span class="val num">${brl(l.valor)}</span><button class="del${conf?" confirm":""}" data-id="${esc(l.id)}" type="button" aria-label="Excluir">${conf?"Excluir?":"×"}</button></li>`;
  }).join("") : `<li class="empty">Nenhum atendimento lançado hoje.</li>`;
  $("#data-note").textContent = "Atualizado às " + new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) + " · atualiza sozinho a cada minuto.";
}
$("#range").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;periodo=b.dataset.r;document.querySelectorAll("#range button").forEach(x=>x.setAttribute("aria-pressed",x===b));carregarPainel();});
$("#btn-refresh").addEventListener("click",()=>carregarPainel());
$("#today-list").addEventListener("click", async e=>{
  const b=e.target.closest(".del"); if(!b) return;
  const id=b.dataset.id;
  if(pendingDel!==id){ pendingDel=id; renderPainel(); setTimeout(()=>{ if(pendingDel===id){pendingDel=null;renderPainel();} },3000); return; }
  pendingDel=null;
  try{ await api("excluirLancamento",{id}); toast("Lançamento excluído"); carregarPainel(); }
  catch(err){ toast(err.message); renderPainel(); }
});
setInterval(()=>{ if(user?.papel==="admin" && admTab==="painel" && !document.hidden) carregarPainel(true); }, 60000);
