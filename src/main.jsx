import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './shell.css';

function App(){
 const host=useRef(null);
 useEffect(()=>{
  let cancelled=false; const added=[];
  async function mount(){
   try{
    const res=await fetch(`${import.meta.env.BASE_URL}site.html`); if(!res.ok) throw new Error('Could not load site content');
    const html=await res.text(); const doc=new DOMParser().parseFromString(html,'text/html');
    document.title=doc.title || 'Kastura Pharma';
    doc.querySelectorAll('meta[name="description"],link[rel="preconnect"],link[href*="fonts.googleapis.com"]').forEach(n=>{const c=document.importNode(n,true);document.head.appendChild(c);added.push(c)});
    doc.querySelectorAll('style').forEach(n=>{const c=document.createElement('style');c.textContent=n.textContent;document.head.appendChild(c);added.push(c)});
    if(cancelled)return;
    host.current.innerHTML=doc.body.innerHTML;
    // Recreate scripts after markup is mounted so the original page interactions initialise.
    for(const old of [...doc.body.querySelectorAll('script')]){
      if(cancelled) return;
      const script=document.createElement('script');
      if(old.src){script.src=new URL(old.getAttribute('src'),window.location.href).href;script.async=false;}
      else script.textContent=old.textContent;
      document.body.appendChild(script);added.push(script);
    }
    // Form capture runs in capture phase before the original demo-only handlers.
    document.addEventListener('submit', handleSubmit, true); added.push({remove:()=>document.removeEventListener('submit',handleSubmit,true)});
   }catch(e){ if(host.current)host.current.innerHTML='<main style="padding:40px;font-family:system-ui"><h1>Unable to load Kastura Pharma</h1><p>Please refresh the page. If this keeps happening, check that <code>public/site.html</code> is present in the deployment.</p></main>'; }
  }
  const endpoint=()=>window.KASTURA_CONFIG?.GOOGLE_APPS_SCRIPT_URL?.trim() || '';
  function status(el,msg,state){if(!el)return;el.textContent=msg;el.dataset.state=state||'';}
  async function send(payload){const url=endpoint();if(!url)throw new Error('The enquiry form is not connected yet. Please configure the Google Apps Script URL.');
    // Apps Script web apps accept text/plain POSTs without a CORS preflight. no-cors responses are opaque.
    await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
  }
  function value(id){return host.current?.querySelector(`#${id}`)?.value?.trim()||'';}
  function handleSubmit(e){
   const form=e.target;if(!(form instanceof HTMLFormElement))return;
   const id=form.id;
   if(!['contactForm','cbForm','coForm','newsForm','heroCapture'].includes(id))return;
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   const submit=form.querySelector('button[type="submit"]'); if(submit?.disabled)return;
   const now=new Date().toISOString(); let payload={submittedAt:now,formType:id,page:location.href}; let statusEl=null;
   if(id==='contactForm'){
    const name=value('ctName'),email=value('ctEmail'),phone=value('ctPhone'),topic=value('ctTopic'),message=value('ctMessage'),consent=!!host.current.querySelector('#ctConsent')?.checked;
    statusEl=host.current.querySelector('#ctStatus');
    if(name.length<2){status(statusEl,'Please enter your name.','error');host.current.querySelector('#ctName').focus();return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){status(statusEl,'Please enter a valid email address.','error');host.current.querySelector('#ctEmail').focus();return}
    if(!message){status(statusEl,'Please enter a message.','error');host.current.querySelector('#ctMessage').focus();return}
    if(!consent){status(statusEl,'Please provide consent before sending.','error');return}
    payload={...payload,formType:'Contact Us',name,email,phone,topic,message,consent:true};
   } else if(id==='cbForm'){
    const name=value('cbName'),phone=value('cbPhone'),slot=host.current.querySelector('.slot[aria-pressed="true"]')?.textContent||'',topic=value('cbTopic');
    const nameInput=host.current.querySelector('#cbName'), phoneInput=host.current.querySelector('#cbPhone'), consent=host.current.querySelector('#cbConsent');
    const consentErr=host.current.querySelector('#cbConsentErr');
    const cleanPhone=phone.replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');
    if(name.length<2){const err=nameInput?.closest('.fld')?.querySelector('.err');if(err)err.textContent='Enter your name.';nameInput?.focus();return;}
    if(!/^[6-9]\d{9}$/.test(cleanPhone)){const err=phoneInput?.closest('.fld')?.querySelector('.err');if(err)err.textContent='Enter a valid 10-digit Indian mobile number.';phoneInput?.focus();return;}
    if(!consent?.checked){if(consentErr)consentErr.textContent='Please agree so we can call you.';consent?.focus();return;}
    if(consentErr)consentErr.textContent='';
    payload={...payload,formType:'Callback Request',name,phone:cleanPhone,preferredTime:slot,topic,consent:true};
   } else if(id==='heroCapture'){
    const phone=value('heroPhone');
    if(!/^[6-9]\d{9}$/.test(phone.replace(/\D/g,'').slice(-10))){const err=host.current.querySelector('#heroErr');if(err)err.textContent='Enter a valid 10-digit Indian mobile number, starting with 6, 7, 8 or 9.';host.current.querySelector('#heroPhone')?.focus();return;}
    payload={...payload,formType:'Hero Callback Request',phone:phone.replace(/\D/g,'').slice(-10)};
   } else if(id==='newsForm'){
    const email=value('newsEmail');if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){const m=host.current.querySelector('#newsMsg');if(m)m.textContent='Please enter a valid email address.';return;}
    payload={...payload,formType:'Newsletter',email};
   } else if(id==='coForm'){
    payload={...payload,formType:'Checkout Order',name:value('coName'),phone:value('coPhone'),address:value('coAddr'),city:value('coCity'),pin:value('coPin'),paymentMethod:host.current.querySelector('input[name="pay"]:checked')?.value||'',items:host.current.querySelector('#coSummary')?.textContent||''};
   }
   if(submit)submit.disabled=true;
   if(id==='contactForm')status(statusEl,'Sending your message…','pending');
   if(id==='heroCapture'){const err=host.current.querySelector('#heroErr');if(err)err.textContent='Submitting your callback request…';}
   send(payload).then(()=>{
    if(id==='contactForm'){status(statusEl,'Thank you. Your message has been submitted.','success');form.reset();}
    else if(id==='newsForm'){const m=host.current.querySelector('#newsMsg');if(m){m.textContent='You are subscribed. Thank you.';m.style.color='#6fe0a4'}form.reset();}
    else if(id==='cbForm'){const done=host.current.querySelector('#cbDoneTxt');if(done)done.textContent='Thank you. Your callback request has been submitted.';form.hidden=true;const d=host.current.querySelector('#cbDone');if(d)d.hidden=false;}
    else if(id==='heroCapture'){const err=host.current.querySelector('#heroErr');if(err)err.textContent='Thank you. Your callback request has been submitted.';form.reset();}
    else if(id==='coForm'){const t=host.current.querySelector('#coDoneTxt');if(t)t.textContent='Your order details have been received. Our team will contact you shortly to confirm your order and delivery.';form.hidden=true;const d=host.current.querySelector('#coDone');if(d)d.hidden=false;}
   }).catch(err=>{if(id==='contactForm')status(statusEl,err.message||'Unable to submit. Please try again.','error');else alert(err.message||'Unable to submit this form. Please try again.');})
    .finally(()=>{if(submit)submit.disabled=false;});
  }
  mount(); return ()=>{cancelled=true;for(const x of added.reverse()){if(x.remove)x.remove();else x.remove?.()} if(host.current)host.current.innerHTML='';};
 },[]);
 return <div ref={host} className="legacy-site"/>;
}

createRoot(document.getElementById('root')).render(<App/>);
