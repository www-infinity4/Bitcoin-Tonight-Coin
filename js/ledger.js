export const WALLET_KEY = 'infinity_unified_wallet_v1'
export const APP_KEY = 'bitcoinTonightService'

export const seedCreators = [
  {id:'bitcoin-tonight',name:'Bitcoin Tonight Roundtable',handle:'',bio:'Group discussions, live conversation, community topics, and entertainment.',topics:['discussion','community'],claim:'unclaimed'},
  {id:'jaimie',name:'Jaimie',handle:'',bio:'Creator directory profile awaiting its owner and service description.',topics:['conversation'],claim:'unclaimed'},
  {id:'dj-vertigo',name:'DJ Vertigo',handle:'',bio:'Music, live performance, and audience-driven entertainment requests.',topics:['music','live'],claim:'unclaimed'},
  {id:'fred',name:'Fred',handle:'',bio:'Creator directory profile awaiting its owner and service description.',topics:['conversation'],claim:'unclaimed'},
  {id:'darkside',name:'Darkside',handle:'',bio:'Late-night topics, entertainment, and community-requested sessions.',topics:['night show','discussion'],claim:'unclaimed'},
  {id:'gary',name:'Gary',handle:'',bio:'Creator directory profile awaiting its owner and service description.',topics:['conversation'],claim:'unclaimed'}
]

const clone = value => JSON.parse(JSON.stringify(value))

export function freshAppState(){return{schemaVersion:'1.0',mode:'local-prototype',wallet:{available:10,locked:0,earned:0,allocation:'development-service-units'},creators:clone(seedCreators),requests:[],entries:[{id:`entry-${Date.now()}`,at:new Date().toISOString(),type:'development-allocation',amount:10,note:'Local service-unit allocation for testing; no external exchange value.'}]}}

export function loadState(storage=globalThis.localStorage){
  let root={}
  try{root=JSON.parse(storage?.getItem(WALLET_KEY)||'{}')}catch{root={}}
  if(!root.apps) root.apps={}
  if(!root.apps[APP_KEY]) root.apps[APP_KEY]=freshAppState()
  return {root,app:root.apps[APP_KEY]}
}

export function saveState(root,storage=globalThis.localStorage){storage?.setItem(WALLET_KEY,JSON.stringify(root));return root.apps[APP_KEY]}

export function addCreator(root,input,storage=globalThis.localStorage){
  const app=root.apps[APP_KEY]; const name=String(input.name||'').trim(); if(!name) throw new Error('Creator name is required')
  const creator={id:`creator-${Date.now()}`,name,handle:String(input.handle||'').trim(),bio:String(input.bio||'').trim(),topics:String(input.topics||'').split(',').map(x=>x.trim()).filter(Boolean),claim:'local-unverified'}
  app.creators.push(creator); app.entries.unshift({id:`entry-${Date.now()}`,at:new Date().toISOString(),type:'creator-added',creatorId:creator.id,amount:0,note:`${creator.name} added a local creator profile.`}); saveState(root,storage); return creator
}

export function createRequest(root,input,storage=globalThis.localStorage){
  const app=root.apps[APP_KEY]; if(app.wallet.available<1) throw new Error('No available Infinity service units')
  const creator=app.creators.find(c=>c.id===input.creatorId); if(!creator) throw new Error('Choose a creator')
  if(!String(input.title||'').trim()||!String(input.purpose||'').trim()) throw new Error('Title and purpose are required')
  const request={id:`request-${Date.now()}`,createdAt:new Date().toISOString(),creatorId:creator.id,creatorName:creator.name,title:String(input.title).trim(),purpose:String(input.purpose).trim(),potential:String(input.potential||'').trim(),product:String(input.product||'').trim(),tags:String(input.tags||'').split(',').map(x=>x.trim()).filter(Boolean),spaceLink:String(input.spaceLink||'').trim(),status:'requested',units:1,history:[{at:new Date().toISOString(),status:'requested',reason:'Viewer created a structured service request.'}]}
  app.wallet.available-=1; app.wallet.locked+=1; app.requests.unshift(request); app.entries.unshift({id:`entry-${Date.now()}`,at:request.createdAt,type:'service-requested',requestId:request.id,creatorId:creator.id,amount:-1,note:`1 Infinity service unit locked for ${creator.name}.`}); saveState(root,storage); return request
}

export function decideRequest(root,requestId,decision,storage=globalThis.localStorage){
  const app=root.apps[APP_KEY]; const request=app.requests.find(r=>r.id===requestId); if(!request) throw new Error('Request not found'); if(request.status!=='requested') throw new Error('Request already decided')
  if(decision==='accepted'){request.status='accepted';app.wallet.locked-=1;app.wallet.earned+=1;request.history.push({at:new Date().toISOString(),status:'accepted',reason:'Creator accepted the service request.'});app.entries.unshift({id:`entry-${Date.now()}`,at:new Date().toISOString(),type:'service-accepted',requestId,creatorId:request.creatorId,amount:1,note:`Creator accepted “${request.title}”.`})}
  else if(decision==='declined'){request.status='declined';app.wallet.locked-=1;app.wallet.available+=1;request.history.push({at:new Date().toISOString(),status:'declined',reason:'Creator declined; locked unit returned.'});app.entries.unshift({id:`entry-${Date.now()}`,at:new Date().toISOString(),type:'service-declined',requestId,creatorId:request.creatorId,amount:1,note:`Request declined; 1 Infinity service unit returned.`})}
  else throw new Error('Unknown decision')
  saveState(root,storage);return request
}

export function markLive(root,requestId,storage=globalThis.localStorage){const app=root.apps[APP_KEY];const r=app.requests.find(x=>x.id===requestId);if(!r||r.status!=='accepted')throw new Error('Only accepted requests can go live');r.status='live';r.history.push({at:new Date().toISOString(),status:'live',reason:'Creator marked the service live.'});app.entries.unshift({id:`entry-${Date.now()}`,at:new Date().toISOString(),type:'service-live',requestId,creatorId:r.creatorId,amount:0,note:`“${r.title}” marked live.`});saveState(root,storage);return r}
