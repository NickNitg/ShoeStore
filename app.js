const $ = id => document.getElementById(id);
const API = window.CONFIG.api;
const COLORS = {Black:"#1b1b1f",White:"#f4f4f4",Red:"#e5383b",Blue:"#2f5bff",Green:"#2e9e5b",Grey:"#98a2b3"};
const CATS = ["Running","Casual","Hiking"];
const SPORTS = ["Football","Basketball","Tennis","Training","Cycling"];
const SIZES = [6,7,8,9,10,11,12];

// Demo data: [name, category, sport, color, price]. Real data comes from SharePoint.
const DEMO = [
 ["Tempo Pro","Running","","Blue",140],["Road Glide","Running","","Black",120],["Sprint Lite","Running","","Red",95],
 ["Street Low","Casual","","White",75],["Canvas Daily","Casual","","Grey",60],["Loft Slip-on","Casual","","Black",65],
 ["Ridge Trek","Hiking","","Green",160],["Summit GTX","Hiking","","Black",210],["Trail Mid","Hiking","","Grey",130],
 ["Pitch Striker","","Football","Red",110],["Court Jump","","Basketball","White",150],["Baseline Ace","","Tennis","Blue",125],
 ["Iron Trainer","","Training","Black",100],["Spin Clip","","Cycling","Green",135]
].map((p,i)=>({id:i+1,name:p[0],category:p[1],sport:p[2],color:p[3],price:p[4],sizes:SIZES.join(",")}));

let products = [], cart = JSON.parse(localStorage.cart||"[]"), user = JSON.parse(localStorage.user||"null");
const F = {cat:"", sport:"", colors:new Set(), size:0, max:250};

async function call(name, body){
  if(!API[name]) return null;
  const r = await fetch(API[name], {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body||{})});
  if(!r.ok) throw new Error("Server error ("+r.status+")");
  return r.json();
}
async function sha(t){
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
const money = n => "$"+n.toFixed(2);
const save = () => { localStorage.cart = JSON.stringify(cart); localStorage.user = JSON.stringify(user); };

function chips(el, items, key){
  el.innerHTML = "";
  ["All",...items].forEach(v=>{
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = v;
    b.setAttribute("aria-pressed", (F[key]||"All")===v);
    b.onclick = () => { F[key] = v==="All" ? "" : v; render(); };
    el.append(b);
  });
}
function filterUI(){
  $("colors").innerHTML = ""; $("sizes").innerHTML = "";
  Object.entries(COLORS).forEach(([n,hex])=>{
    const b = document.createElement("button"); b.className="dot"; b.style.background=hex; b.title=n; b.ariaLabel=n;
    b.setAttribute("aria-pressed", F.colors.has(n));
    b.onclick = () => { F.colors.has(n) ? F.colors.delete(n) : F.colors.add(n); render(); };
    $("colors").append(b);
  });
  SIZES.forEach(s=>{
    const b = document.createElement("button"); b.className="chip"; b.textContent=s;
    b.setAttribute("aria-pressed", F.size===s);
    b.onclick = () => { F.size = F.size===s ? 0 : s; render(); };
    $("sizes").append(b);
  });
  $("pv").textContent = F.max;
}
function render(){
  chips($("cats"), CATS, "cat"); chips($("sports"), SPORTS, "sport"); filterUI();
  const list = products.filter(p =>
    (!F.cat || p.category===F.cat) && (!F.sport || p.sport===F.sport) &&
    (!F.colors.size || F.colors.has(p.color)) &&
    (!F.size || p.sizes.split(",").map(Number).includes(F.size)) && p.price<=F.max);
  $("result").textContent = list.length + " pair" + (list.length===1?"":"s");
  $("grid").innerHTML = list.length ? "" : "<p>No shoes match these filters. Try clearing one.</p>";
  list.forEach(p=>{
    const sizes = p.sizes.split(",");
    const d = document.createElement("div"); d.className = "card";
    d.innerHTML = `<div class="pic" style="background:${COLORS[p.color]||"#ccc"}33">👟</div>
      <h4></h4><div class="meta">${p.category||p.sport} · ${p.color}</div><div class="price">${money(+p.price)}</div>
      <div class="buy"><select aria-label="Size">${sizes.map(s=>`<option>${s}</option>`).join("")}</select><button class="btn pri">Add</button></div>`;
    d.querySelector("h4").textContent = p.name;
    d.querySelector("button").onclick = () => addToCart(p.id, +d.querySelector("select").value);
    $("grid").append(d);
  });
  $("count").textContent = cart.reduce((a,i)=>a+i.qty,0);
  $("who").textContent = user ? "Hi, "+user.name : "";
  $("acctBtn").textContent = user ? "Sign out" : "Sign in";
}

function addToCart(id, size){
  const hit = cart.find(i=>i.id===id && i.size===size);
  hit ? hit.qty++ : cart.push({id,size,qty:1});
  save(); render(); openCart();
}
const total = () => cart.reduce((a,i)=>a+i.qty*(products.find(p=>p.id===i.id)?.price||0),0);
function openCart(){
  const box = $("cartList"); box.innerHTML = cart.length ? "" : "<p>Your cart is empty. Add a pair to get started.</p>";
  cart.forEach((i,ix)=>{
    const p = products.find(x=>x.id===i.id); if(!p) return;
    const r = document.createElement("div"); r.className="line";
    r.innerHTML = `<span><b>${p.name}</b><br><span class="meta">Size ${i.size} · ${money(+p.price)}</span></span>
      <span><button class="chip" data-d="-1" aria-label="Fewer">−</button> ${i.qty} <button class="chip" data-d="1" aria-label="More">+</button></span>`;
    r.querySelectorAll("button").forEach(b=>b.onclick=()=>{ i.qty+=+b.dataset.d; if(i.qty<1) cart.splice(ix,1); save(); render(); openCart(); });
    box.append(r);
  });
  $("total").textContent = "Total " + money(total());
  $("toCheckout").disabled = !cart.length;
  if(!$("cartD").open) $("cartD").showModal();
}

// ---- Accounts ----
let mode = "login";
function authMode(m){
  mode = m; $("authT").textContent = m==="login" ? "Sign in" : "Create account";
  $("nameWrap").hidden = m==="login"; $("authGo").textContent = m==="login" ? "Sign in" : "Create account";
  $("authSwap").textContent = m==="login" ? "Create account" : "I have an account"; $("authErr").textContent = "";
}
$("acctBtn").onclick = () => { if(user){ user=null; save(); render(); } else { authMode("login"); $("authD").showModal(); } };
$("authSwap").onclick = () => authMode(mode==="login" ? "register" : "login");
$("authGo").onclick = async () => {
  const email = $("aEmail").value.trim().toLowerCase(), pass = $("aPass").value, name = $("aName").value.trim();
  if(!email || pass.length<6 || (mode==="register" && !name)) return $("authErr").textContent = "Enter your email and a password of 6+ characters" + (mode==="register" ? ", plus your name." : ".");
  const hash = await sha(email+":"+pass);
  try{
    let res = await call(mode, {name, email, hash});
    if(!res){ // demo mode
      const db = JSON.parse(localStorage.users||"{}");
      if(mode==="register"){ if(db[email]) res={error:"That email already has an account."}; else { db[email]={name,hash}; localStorage.users=JSON.stringify(db); res={name,email}; } }
      else res = db[email]?.hash===hash ? {name:db[email].name,email} : {error:"Email or password is incorrect."};
    }
    if(res.error) return $("authErr").textContent = res.error;
    user = {name:res.name, email:res.email}; save(); $("authD").close(); render();
  }catch(e){ $("authErr").textContent = e.message; }
};

// ---- Checkout (guest or signed in) ----
$("toCheckout").onclick = () => {
  $("cartD").close();
  $("coWho").textContent = user ? "Ordering as "+user.email : "Checking out as a guest. Sign in first to link this order to an account.";
  $("cName").value = user?.name||""; $("cEmail").value = user?.email||"";
  $("coTotal").textContent = "Total " + money(total()); $("coErr").textContent = "";
  $("coD").showModal();
};
$("placeBtn").onclick = async () => {
  const f = {name:$("cName").value.trim(), email:$("cEmail").value.trim(), address:$("cAddr").value.trim(), city:$("cCity").value.trim()};
  if(Object.values(f).some(v=>!v)) return $("coErr").textContent = "Fill in every field so we can ship your order.";
  const items = cart.map(i=>{const p=products.find(x=>x.id===i.id); return {id:i.id,name:p.name,size:i.size,qty:i.qty,price:+p.price};});
  const order = {...f, items:JSON.stringify(items), total:total(), accountEmail:user?.email||"", guest:!user, placed:new Date().toISOString()};
  try{
    await call("order", order);
    cart = []; save(); $("coD").close(); render();
    alert("Order placed. A confirmation will go to "+f.email+".");
  }catch(e){ $("coErr").textContent = "Couldn't place the order: "+e.message; }
};

$("cartBtn").onclick = openCart;
$("price").oninput = e => { F.max = +e.target.value; render(); };
$("reset").onclick = () => { F.cat=F.sport=""; F.colors.clear(); F.size=0; F.max=250; $("price").value=250; render(); };

(async () => {
  try{ const r = await call("products"); products = (r||DEMO).map(p=>({...p, id:+p.id, price:+p.price, sizes:String(p.sizes)})); }
  catch(e){ products = DEMO; }
  render();
})();
