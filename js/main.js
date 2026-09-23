/* Rotas e inicialização */
function paintWho(){
  const isAdmin = user.papel==="admin";
  $("#who-av").textContent = initials(user.nome);
  $("#who-nm").innerHTML = `${esc(user.nome)}<small>${esc(user.funcao || (isAdmin?"Administração":"Profissional"))}</small>`;
}
function route(){
  const logado = !!(user && lsGet(LS.token));
  const isAdmin = logado && user.papel==="admin";
  $("#view-login").hidden = logado;
  $("#view-caixa").hidden = !logado || isAdmin;
  $("#view-admin").hidden = !isAdmin;
  $("#who").hidden = !logado;
  if(!logado){ setTimeout(()=>($("#login-nome").value?$("#pin"):$("#login-nome")).focus(),50); return; }
  paintWho();
  if(isAdmin) showAdmTab();
  else { selProc=null; carregarCatalogo(); carregarMeuDia(); renderFila(); }
}

$("#today-label").textContent = new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
route();
if(user) enviarFila();
