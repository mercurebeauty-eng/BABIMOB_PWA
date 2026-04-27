// Pure function — returns the complete SW script as a string.
// Used by ServiceWorkerRegistrar to register via blob URL (no HTTP request),
// and by the fallback file route /sw-inline.js if blob scope is rejected.
export function createServiceWorker(): string {
  return `'use strict';
const C='bm-v3';
const AX=['.js','.css','.woff2','.woff','.ttf','.png','.svg','.ico','.jpg','.webp','.avif'];
const AP=['.supabase.co/rest','.supabase.co/auth','.supabase.co/storage','localhost:8080','/otp/'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(c=>c.addAll(['/app','/offline']).catch(()=>{}))
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

function isAPI(u){return AP.some(p=>u.includes(p));}
function isAsset(u){const p=u.split('?')[0];return AX.some(x=>p.endsWith(x));}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=e.request.url;

  if(isAPI(u)){
    // Network-first for all API calls (Supabase, OTP)
    e.respondWith(
      fetch(e.request,{credentials:'include'}).catch(()=>
        new Response(JSON.stringify({offline:true}),{
          status:503,
          headers:{'Content-Type':'application/json','X-SW-Offline':'1'}
        })
      )
    );
    return;
  }

  if(isAsset(u)){
    // Cache-first for static assets (JS/CSS/images/fonts)
    e.respondWith(
      caches.match(e.request).then(cached=>{
        if(cached)return cached;
        return fetch(e.request).then(r=>{
          if(r&&r.status===200){
            const cl=r.clone();
            caches.open(C).then(ca=>ca.put(e.request,cl));
          }
          return r;
        }).catch(()=>new Response('',{status:408}));
      })
    );
    return;
  }

  // Network-first with cache fallback for navigation / pages
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r&&r.status===200&&e.request.mode==='navigate'){
        const cl=r.clone();
        caches.open(C).then(ca=>ca.put(e.request,cl));
      }
      return r;
    }).catch(()=>
      caches.match(e.request).then(c=>c||caches.match('/offline'))
    )
  );
});
`;
}
