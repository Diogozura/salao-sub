/* API */
let busyCount = 0;
function busy(on){ busyCount += on?1:-1; $("#busy").classList.toggle("on", busyCount>0); }
class ApiError extends Error { constructor(msg,codigo){ super(msg); this.codigo=codigo; } }

async function api(action, dados={}, {silencioso=false}={}){
  if(!silencioso) busy(true);
  try{
    let r;
    try{
      r = await fetch(API_URL,{ method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"},
        body: JSON.stringify({ action, token: lsGet(LS.token), ...dados }) });
    }catch(e){ throw new ApiError("Sem conexão com o servidor. Verifique a internet.","REDE"); }
    let j; try{ j = await r.json(); }catch(e){ throw new ApiError("Resposta inesperada do servidor.","REDE"); }
    if(!j.ok){
      if(j.codigo==="SESSAO" && action!=="login"){ sair(j.erro); }
      throw new ApiError(j.erro, j.codigo);
    }
    return j.data;
  } finally { if(!silencioso) busy(false); }
}
