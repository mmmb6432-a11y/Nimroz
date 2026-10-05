import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
const $=id=>document.getElementById(id);
let ads=[]; let category="همه"; let registerMode=false;

function modal(id,on=true){$(id).classList.toggle("show",on)}
document.querySelectorAll(".close").forEach(x=>x.onclick=()=>document.querySelectorAll(".modal").forEach(m=>m.classList.remove("show")));

$("loginBtn").onclick=()=>{registerMode=false; updateAuthUI(); modal("authModal")};
$("switchAuth").onclick=()=>{registerMode=!registerMode; updateAuthUI()};
function updateAuthUI(){
 $("authTitle").textContent=registerMode?"ساخت حساب جدید":"ورود به حساب";
 $("authAction").textContent=registerMode?"ثبت‌نام":"ورود";
 $("switchAuth").textContent=registerMode?"قبلاً حساب دارم":"ساخت حساب جدید";
 $("authMsg").textContent="";
}
$("authAction").onclick=async()=>{
 const email=$("authEmail").value.trim(), pass=$("authPassword").value;
 if(!email||pass.length<6){$("authMsg").textContent="ایمیل و رمز حداقل ۶ حرف وارد کنید.";return}
 try{
  if(registerMode) await createUserWithEmailAndPassword(auth,email,pass);
  else await signInWithEmailAndPassword(auth,email,pass);
  modal("authModal",false);
 }catch(e){$("authMsg").textContent="خطا: "+(e.code||e.message)}
};

onAuthStateChanged(auth,user=>{
 $("userBar").innerHTML=user
 ? `👤 ${user.email} <button id="logout">خروج</button>`
 : "برای ثبت آگهی و مدیریت آن، وارد حساب شوید.";
 if(user) $("logout").onclick=()=>signOut(auth);
 $("addBtn").onclick=$("navAdd").onclick=()=> user?modal("modal"):modal("authModal");
});

async function loadAds(){
 const snap=await getDocs(query(collection(db,"ads"),orderBy("createdAt","desc")));
 ads=snap.docs.map(d=>({id:d.id,...d.data()}));
 render();
}
function render(){
 const q=$("search").value.trim().toLowerCase();
 const list=ads.filter(a=>(category==="همه"||a.cat===category)&&(!q||(a.title+a.desc+a.place).toLowerCase().includes(q)));
 $("ads").innerHTML=list.length?list.map(a=>`<article class="card"><div class="pic" ${a.image?`style="background-image:url('${a.image}')"`:""}>${a.image?"":"📦"}</div><div class="cardbody"><h3>${a.title}</h3><div class="price">${Number(a.price||0).toLocaleString()} افغانی</div><div class="meta">📍 ${a.place||"نیمروز"} · ${a.cat}</div></div></article>`).join(""):"<p>هنوز آگهی‌ای پیدا نشد.</p>";
}
document.querySelectorAll(".cats button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".cats button").forEach(x=>x.classList.remove("active"));b.classList.add("active");category=b.dataset.cat;render()});
$("search").oninput=render;

$("adForm").onsubmit=async e=>{
 e.preventDefault();
 if(!auth.currentUser){modal("modal",false);modal("authModal");return}
 const ad={title:$("title").value,price:Number($("price").value),cat:$("category").value,place:$("place").value||"نیمروز",desc:$("desc").value,image:$("image").value||"",owner:auth.currentUser.uid,createdAt:serverTimestamp()};
 try{await addDoc(collection(db,"ads"),ad);e.target.reset();modal("modal",false);await loadAds();alert("آگهی منتشر شد.");}
 catch(err){alert("خطا در ذخیره آگهی: "+err.message)}
};

$("saveProfile").onclick=()=>{alert("حساب Firebase فعال است. پروفایل کامل را در مرحله بعد اضافه می‌کنیم.")};
$("navProfile").onclick=()=>auth.currentUser?modal("profileModal"):modal("authModal");
loadAds().catch(()=>{$("ads").innerHTML="<p>ابتدا Firestore را در Firebase فعال کنید.</p>"});
