/* Sessão e login */
let user = lsGet(LS.user);
function sair(msg){
  const tok = lsGet(LS.token);
  lsSet(LS.token,null); lsSet(LS.user,null); user=null;
  if(tok && !msg) fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"logout",token:tok})}).catch(()=>{});
  route();
  if(msg) $("#login-err").textContent = msg;
}
$("#btn-logout").addEventListener("click",()=>sair());

$("#login-nome").value = lsGet(LS.nome,"");
$("#login-form").addEventListener("submit", async e=>{
  e.preventDefault();
  const nome=$("#login-nome").value.trim(), pin=$("#pin").value.trim();
  if(!nome || !pin){ $("#login-err").textContent="Preencha nome e senha."; return; }
  const b=$("#btn-login"); b.disabled=true; b.textContent="Entrando…"; $("#login-err").textContent="";
  try{
    const d = await api("login",{nome,pin});
    lsSet(LS.token,d.token); lsSet(LS.user,d.user); lsSet(LS.nome,nome); user=d.user;
    $("#pin").value=""; route(); enviarFila();
  }catch(err){ $("#login-err").textContent=err.message; $("#pin").select(); }
  finally{ b.disabled=false; b.textContent="Entrar"; }
});
