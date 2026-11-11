import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const configured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = (s) => document.querySelector(s);
const esc = (v="") => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateFmt = d => d ? new Date(d+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}) : "";
const timeFmt = t => t ? new Date("1970-01-01T"+t).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}) : "";
function notify(message, error=false){const el=$("#toast");if(!el)return;el.hidden=false;el.textContent=message;el.className=error?"alert":"alert success";el.scrollIntoView({behavior:"smooth",block:"center"});}
function formData(form){return Object.fromEntries(new FormData(form).entries());}
async function getUser(){if(!supabase)return null;const {data:{user}}=await supabase.auth.getUser();return user;}
async function profile(user){if(!user)return null;const {data}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();return data;}
function nav(user,prof){
 const root=document.body.dataset.page?.startsWith("student")||document.body.dataset.page==="event-detail"?"../":"";
 const links=user?`${prof?.role==="admin"?`<a href="${root}admin/dashboard.html">ADMINISTRATION</a>`:""}${prof?.role==="student"?`<a href="${root}student/dashboard.html">MY REGISTRATIONS</a>`:""}<a href="#" id="logout-link">LOG OUT</a>`:`<a href="${root}login.html">LOGIN</a><a href="${root}register.html">STUDENT SIGN UP</a>`;
 const el=$("#site-nav"); if(!el)return;
 el.innerHTML=`<nav class="navbar"><div class="brand-wrap"><div class="brand-seal"><img src="${root}assets/uep-seal.jpg" alt="University emblem"></div><div class="brand">UNIVERSITY EVENT PORTAL<small>STUDENT ACTIVITIES & CAMPUS LIFE</small></div></div><div class="navlinks"><a href="${root}index.html">HOME</a>${links}</div></nav>`;
 $("#logout-link")?.addEventListener("click",async e=>{e.preventDefault();await supabase.auth.signOut();location.href=root+"index.html";});
}
function requireConfigured(){if(!supabase){document.body.insertAdjacentHTML("afterbegin",`<div class="alert">Setup required: edit <b>assets/js/config.js</b> and add your Supabase Project URL and anon/public key.</div>`);return false;}return true;}
async function home(){
 const [{data:events,error},{data:counts}] = await Promise.all([
  supabase.from("events").select("*").order("event_date").order("event_time"),
  supabase.rpc("get_event_registration_counts")
 ]);
 const countMap=new Map((counts||[]).map(x=>[x.event_id,Number(x.registered_count)]));
 const list=$("#events-list"); if(error){list.innerHTML=`<div class="card">${esc(error.message)}</div>`;return;}
 if(!events?.length){list.innerHTML='<div class="card"><h3>No events posted yet</h3><p class="muted">Please check again soon.</p></div>';return;}
 list.innerHTML=events.map(e=>{const count=countMap.get(e.id)||0,remaining=Math.max(0,e.capacity-count);return `<article class="card"><span class="badge">${dateFmt(e.event_date)}</span><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p><p class="muted"><strong>Time:</strong> ${timeFmt(e.event_time)}<br><strong>Venue:</strong> ${esc(e.location)}<br><strong>Available slots:</strong> ${remaining} / ${e.capacity}</p><a class="btn" href="${window.__user?"student/event.html?id="+e.id:"login.html"}">${window.__user?"EVENT DETAILS":"LOGIN TO REGISTER"}</a></article>`;}).join("");
}
async function login(){
 $("#login-form").addEventListener("submit",async e=>{e.preventDefault();const f=formData(e.currentTarget);const {error}=await supabase.auth.signInWithPassword({email:f.email,password:f.password});if(error)return notify(error.message,true);const u=await getUser(),p=await profile(u);location.href=p?.role==="admin"?"admin/dashboard.html":"student/dashboard.html";});
}
async function register(){
 $("#register-form").addEventListener("submit",async e=>{e.preventDefault();const f=formData(e.currentTarget);if(f.password!==f.confirm_password)return notify("Passwords do not match.",true);if(f.password.length<6)return notify("Password must be at least 6 characters.",true);
 const {error}=await supabase.auth.signUp({email:f.email,password:f.password,options:{data:{full_name:f.full_name}}});if(error)return notify(error.message,true);notify("Account created. If email confirmation is enabled, check your inbox to confirm your account before logging in.");e.currentTarget.reset();});
}
async function studentDashboard(user,prof){
 $("#welcome").textContent=`Welcome, ${prof?.full_name||user.email}`;
 const {data,error}=await supabase.from("registrations").select("id,registered_at,events(id,title,event_date,event_time,location)").eq("user_id",user.id).order("registered_at",{ascending:false});
 if(error)return notify(error.message,true);
 $("#my-registrations").innerHTML=data.length?data.map(r=>`<tr><td>${esc(r.events.title)}</td><td>${dateFmt(r.events.event_date)}</td><td>${timeFmt(r.events.event_time)}</td><td>${esc(r.events.location)}</td><td><button class="btn danger small" data-cancel="${r.id}">Cancel</button></td></tr>`).join(""):'<tr><td colspan="5">You have no registrations yet. <a href="../index.html">View events</a>.</td></tr>';
 $("#my-registrations").addEventListener("click",async e=>{const id=e.target.dataset.cancel;if(!id)return;if(!confirm("Cancel this registration?"))return;const {error}=await supabase.from("registrations").delete().eq("id",id);if(error)notify(error.message,true);else location.reload();});
}
async function eventDetail(user){
 const id=new URLSearchParams(location.search).get("id");const box=$("#event-detail");
 if(!id){box.textContent="No event selected.";return;}
 const {data:e,error}=await supabase.from("events").select("*").eq("id",id).single();
 if(error){box.textContent="Event not found.";return;}
 const {data:countRows}=await supabase.rpc("get_event_registration_counts");const count=Number(countRows?.find(x=>x.event_id===e.id)?.registered_count||0),remaining=Math.max(0,e.capacity-count);
 const {data:mine}=await supabase.from("registrations").select("id").eq("event_id",id).eq("user_id",user.id).maybeSingle();
 box.innerHTML=`<span class="badge">${dateFmt(e.event_date)}</span><h2>${esc(e.title)}</h2><p>${esc(e.description)}</p><p><strong>Date:</strong> ${dateFmt(e.event_date)}<br><strong>Time:</strong> ${timeFmt(e.event_time)}<br><strong>Location:</strong> ${esc(e.location)}<br><strong>Available slots:</strong> ${remaining}</p>${mine?'<div class="alert success">You are already registered for this event.</div>':remaining<=0?'<div class="alert">This event is full.</div>':'<button class="btn" id="register-event">Register for Event</button>'}`;
 $("#register-event")?.addEventListener("click",async()=>{const {error}=await supabase.rpc("register_for_event",{p_event_id:Number(id)});if(error)notify(error.message,true);else{notify("Registration successful!");eventDetail(user);}});
}
async function adminDashboard(){
 const [{count:students},{data:events,error},{count:registrations}] = await Promise.all([
 supabase.from("profiles").select("*",{count:"exact",head:true}).eq("role","student"),
 supabase.from("events").select("*").order("event_date",{ascending:false}),
 supabase.from("registrations").select("*",{count:"exact",head:true})
 ]);
 if(error)return notify(error.message,true);
 $("#student-count").textContent=students??0;$("#event-count").textContent=events.length;$("#registration-count").textContent=registrations??0;
 const {data:counts}=await supabase.rpc("get_event_registration_counts");const countMap=new Map((counts||[]).map(x=>[x.event_id,Number(x.registered_count)]));\n $("#admin-events").innerHTML=events.map(e=>{const n=countMap.get(e.id)||0;return `<tr><td>${esc(e.title)}</td><td>${dateFmt(e.event_date)}</td><td>${esc(e.location)}</td><td>${n} / ${e.capacity}</td><td class="actions"><a class="btn small" href="participants.html?id=${e.id}">Participants</a> <a class="btn secondary small" href="edit-event.html?id=${e.id}">Edit</a> <button class="btn danger small" data-delete="${e.id}">Delete</button></td></tr>`;}).join("")||'<tr><td colspan="5">No events yet.</td></tr>';
 $("#admin-events").addEventListener("click",async e=>{const id=e.target.dataset.delete;if(!id)return;if(!confirm("Delete this event and its registrations?"))return;const {error}=await supabase.from("events").delete().eq("id",id);if(error)notify(error.message,true);else location.reload();});
}
async function eventForm(){
 const id=new URLSearchParams(location.search).get("id"),editing=!!id;
 if(editing){$("#event-form-title").textContent="Edit Event";const {data,error}=await supabase.from("events").select("*").eq("id",id).single();if(error)return notify(error.message,true);for(const [k,v] of Object.entries(data)){const el=$(`[name="${k}"]`);if(el)el.value=v??"";}}
 $("#event-form").addEventListener("submit",async e=>{e.preventDefault();const f=formData(e.currentTarget);f.capacity=Number(f.capacity);const result=editing?await supabase.from("events").update(f).eq("id",id):await supabase.from("events").insert(f);if(result.error)return notify(result.error.message,true);location.href="dashboard.html";});
}
async function participants(){
 const id=new URLSearchParams(location.search).get("id");
 const [{data:event,error:eerr},{data:rows,error}] = await Promise.all([
 supabase.from("events").select("title").eq("id",id).single(),
 supabase.from("registrations").select("registered_at,profiles(full_name,email)").eq("event_id",id).order("registered_at")
 ]);
 if(eerr||error)return notify((eerr||error).message,true);
 $("#participants-title").textContent=`${event.title} — ${rows.length} participant(s)`;
 $("#participants-list").innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.profiles?.full_name||"")}</td><td>${esc(r.profiles?.email||"")}</td><td>${new Date(r.registered_at).toLocaleString()}</td></tr>`).join("")||'<tr><td colspan="4">No participants registered yet.</td></tr>';
}
(async()=>{
 const page=document.body.dataset.page;
 if(!requireConfigured())return;
 const user=await getUser(),prof=await profile(user);window.__user=!!user;nav(user,prof);
 if(page==="home")return home();
 if(page==="login")return login();
 if(page==="register")return register();
 if(page==="student-dashboard"){if(!user){location.href="../login.html";return;}if(prof?.role!=="student"){location.href="../index.html";return;}return studentDashboard(user,prof);}
 if(page==="event-detail"){if(!user){location.href="../login.html";return;}return eventDetail(user);}
 if(page==="admin-dashboard"||page==="event-form"||page==="participants"){if(!user){location.href="../login.html";return;}if(prof?.role!=="admin"){location.href="../index.html";return;}if(page==="admin-dashboard")return adminDashboard();if(page==="event-form")return eventForm();return participants();}
})();
