/* Admin: ajustes (procedimentos e equipe) */
let admTab="painel", config=null, armedRm=null;
$("#adm-tabs").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;admTab=b.dataset.t;showAdmTab();});
function showAdmTab(){
  document.querySelectorAll("#adm-tabs button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.t===admTab));
  $("#adm-painel").hidden = admTab!=="painel"; $("#adm-ajustes").hidden = admTab!=="ajustes";
  if(admTab==="painel") carregarPainel(); else carregarConfig();
}
async function carregarConfig(){
  try{ config = await api("config"); renderAjustes(); }
  catch(err){ $("#cfg-procs").innerHTML=`<p class="loading">${esc(err.message)}</p>`; }
}
function catOptions(sel){ const cats=catOrder([...new Set([...CATS, ...(config?.categorias||[])])]); return cats.map(c=>`<option${c===sel?" selected":""}>${esc(c)}</option>`).join(""); }
function renderAjustes(){
  const procs = config.procedimentos.filter(p=>p.ativo);
  $("#cfg-procs").innerHTML = catOrder([...new Set(procs.map(p=>p.categoria))]).map(c=>
    `<div class="cat">${esc(c)}</div><ul class="cfg-list">${procs.filter(p=>p.categoria===c).map(p=>`<li class="cfg-row" data-id="${esc(p.id)}">
      <input class="field grow" data-f="nome" value="${esc(p.nome)}" aria-label="Nome do procedimento">
      <label class="money w-money"><span>R$</span><input class="field" data-f="valor" inputmode="decimal" value="${fmtNum(p.valor)}" aria-label="Valor de ${esc(p.nome)}"></label>
      <span class="ate">até</span>
      <label class="money w-money"><span>R$</span><input class="field" data-f="ate" inputmode="decimal" value="${p.ate!=null?fmtNum(p.ate):""}" placeholder="—" aria-label="Valor máximo de ${esc(p.nome)}"></label>
      <label class="chk"><input type="checkbox" data-f="aPartirDe"${p.aPartirDe?" checked":""}> a partir de</label>
      <select class="field" data-f="categoria" aria-label="Categoria de ${esc(p.nome)}">${catOptions(p.categoria)}</select>
      <button type="button" class="rm${armedRm===p.id?" confirm":""}" data-rm="${esc(p.id)}" aria-label="Remover ${esc(p.nome)}">${armedRm===p.id?"Remover?":"×"}</button></li>`).join("")}</ul>`
  ).join("") || `<p class="empty">Nenhum procedimento cadastrado.</p>`;
  $("#np-cat").innerHTML = catOptions($("#np-cat").value || CATS[0]);
  $("#cfg-staff").innerHTML = config.equipe.filter(x=>x.ativo).map(x=>`<li class="cfg-row" data-id="${esc(x.id)}">
    <input class="field grow" data-f="nome" value="${esc(x.nome)}" aria-label="Nome">
    <input class="field w-role" data-f="funcao" value="${esc(x.funcao)}" placeholder="Função" aria-label="Função de ${esc(x.nome)}">
    <input class="field w-mail" data-f="email" value="${esc(x.email)}" placeholder="E-mail Google (opcional)" aria-label="E-mail de ${esc(x.nome)}">
    <select class="field w-papel" data-f="papel" aria-label="Acesso de ${esc(x.nome)}"><option value="profissional"${x.papel!=="admin"?" selected":""}>Profissional</option><option value="admin"${x.papel==="admin"?" selected":""}>Admin</option></select>
    <input class="field w-pin" data-f="pin" inputmode="numeric" placeholder="nova senha" autocomplete="new-password" aria-label="Nova senha de ${esc(x.nome)}">
    <button type="button" class="rm${armedRm===x.id?" confirm":""}" data-rm="${esc(x.id)}" aria-label="Remover ${esc(x.nome)}">${armedRm===x.id?"Remover?":"×"}</button></li>`).join("")
    || `<li class="empty">Nenhuma pessoa cadastrada.</li>`;
}
function armOrDo(key, fn){
  if(armedRm===key){ armedRm=null; renderAjustes(); fn(); return; }
  armedRm=key; renderAjustes();
  setTimeout(()=>{ if(armedRm===key){ armedRm=null; renderAjustes(); } },3000);
}
const val = (row,f) => row.querySelector(`[data-f="${f}"]`);

$("#cfg-procs").addEventListener("change", async e=>{
  const row=e.target.closest(".cfg-row"); if(!row) return;
  const ateRaw = val(row,"ate").value.trim();
  const dados = { id:row.dataset.id, nome:val(row,"nome").value.trim(), categoria:val(row,"categoria").value,
    valor:parseMoney(val(row,"valor").value), ate: ateRaw?parseMoney(ateRaw):null, aPartirDe:val(row,"aPartirDe").checked };
  try{
    const d = await api("salvarProcedimento", dados);
    const i = config.procedimentos.findIndex(p=>p.id===d.procedimento.id); config.procedimentos[i]=d.procedimento;
    lsSet(LS.catalogo,null); toast("Procedimento salvo");
    if(e.target.dataset.f==="categoria") renderAjustes();
    else { val(row,"valor").value=fmtNum(d.procedimento.valor); val(row,"ate").value=d.procedimento.ate!=null?fmtNum(d.procedimento.ate):""; val(row,"aPartirDe").checked=d.procedimento.aPartirDe; }
  }catch(err){ toast(err.message); renderAjustes(); }
});
$("#cfg-procs").addEventListener("click",e=>{
  const b=e.target.closest("[data-rm]"); if(!b) return;
  const id=b.dataset.rm;
  armOrDo(id, async ()=>{
    try{ await api("removerProcedimento",{id}); config.procedimentos.find(p=>p.id===id).ativo=false; lsSet(LS.catalogo,null); renderAjustes(); toast("Procedimento removido"); }
    catch(err){ toast(err.message); }
  });
});
$("#add-proc").addEventListener("submit", async e=>{
  e.preventDefault();
  const mRaw=$("#np-max").value.trim();
  const dados={ nome:$("#np-name").value.trim(), categoria:$("#np-cat").value, valor:parseMoney($("#np-val").value), ate:mRaw?parseMoney(mRaw):null, aPartirDe:$("#np-from").checked };
  if(!dados.nome){ $("#np-err").textContent="Digite o nome do procedimento."; return; }
  if(!(dados.valor>0)){ $("#np-err").textContent="Digite um valor maior que zero, ex.: 85,00."; return; }
  try{
    const d = await api("salvarProcedimento", dados);
    config.procedimentos.push(d.procedimento); lsSet(LS.catalogo,null);
    $("#np-err").textContent=""; ["#np-name","#np-val","#np-max"].forEach(s=>$(s).value=""); $("#np-from").checked=false;
    renderAjustes(); toast(`${d.procedimento.nome} adicionado`);
  }catch(err){ $("#np-err").textContent=err.message; }
});

$("#cfg-staff").addEventListener("change", async e=>{
  const row=e.target.closest(".cfg-row"); if(!row) return;
  const pin = val(row,"pin").value.trim();
  const dados = { id:row.dataset.id, nome:val(row,"nome").value.trim(), funcao:val(row,"funcao").value.trim(),
    email:val(row,"email").value.trim(), papel:val(row,"papel").value };
  if(pin) dados.pin = pin;
  if(e.target.dataset.f==="pin" && !pin) return;
  try{
    const d = await api("salvarProfissional", dados);
    const i = config.equipe.findIndex(x=>x.id===d.profissional.id);
    Object.assign(config.equipe[i], d.profissional, {email:dados.email});
    val(row,"pin").value="";
    toast(pin ? "Senha alterada" : "Equipe atualizada");
    if(d.profissional.id===user.id){ user={...user, ...d.profissional}; lsSet(LS.user,user); if(user.papel!=="admin") return sair("Seu acesso mudou. Entre novamente."); paintWho(); }
  }catch(err){ toast(err.message); renderAjustes(); }
});
$("#cfg-staff").addEventListener("click",e=>{
  const b=e.target.closest("[data-rm]"); if(!b) return;
  const id=b.dataset.rm;
  armOrDo(id, async ()=>{
    try{ await api("removerProfissional",{id}); config.equipe.find(x=>x.id===id).ativo=false; renderAjustes(); toast("Pessoa removida — o histórico continua no painel"); }
    catch(err){ toast(err.message); }
  });
});
$("#add-staff").addEventListener("submit", async e=>{
  e.preventDefault();
  const dados={ nome:$("#ns-name").value.trim(), funcao:$("#ns-role").value.trim(), pin:$("#ns-pin").value.trim(), papel:$("#ns-papel").value };
  if(!dados.nome){ $("#ns-err").textContent="Digite o nome."; return; }
  if(!dados.pin){ $("#ns-err").textContent="Defina uma senha para ela entrar."; return; }
  try{
    const d = await api("salvarProfissional", dados);
    config.equipe.push({...d.profissional, email:"", ativo:true, temSenha:true});
    $("#ns-err").textContent=""; ["#ns-name","#ns-role","#ns-pin"].forEach(s=>$(s).value="");
    renderAjustes(); toast(`${d.profissional.nome} adicionada`);
  }catch(err){ $("#ns-err").textContent=err.message; }
});

