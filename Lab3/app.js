const [GraphicsLayer, Graphic, webMercatorUtils] = await $arcgis.import(['@arcgis/core/layers/GraphicsLayer.js','@arcgis/core/Graphic.js','@arcgis/core/geometry/support/webMercatorUtils.js']);
const mapElement=document.querySelector('#myMap'), popup=document.querySelector('arcgis-popup'), status=document.querySelector('#status');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function distanceKm(a,b){
  const geo=p=>p.spatialReference.isWebMercator?webMercatorUtils.webMercatorToGeographic(p):p;
  const p=geo(a),q=geo(b),r=Math.PI/180,h=Math.sin((q.y-p.y)*r/2)**2+Math.cos(p.y*r)*Math.cos(q.y*r)*Math.sin((q.x-p.x)*r/2)**2;
  return 6371.0088*2*Math.asin(Math.min(1,Math.sqrt(h)));
}
try{
  await mapElement.viewOnReady(); await popup.componentOnReady();
  const map=mapElement.map; await map.loadAll();
  const stores=map.layers.find(l=>/Food_Stores/i.test(l.title));
  stores.title='Food stores';
  stores.renderer={type:'simple',symbol:{type:'picture-marker',url:new URL('groceries.svg',import.meta.url).href,width:24,height:24}};
  const buildings=map.layers.find(l=>/Bldgs/i.test(l.title)); if(buildings){buildings.title='Buildings by type';buildings.minScale=150000;buildings.maxScale=1128;}
  const highlights=new GraphicsLayer({title:'Highlighted stores',listMode:'hide'});map.add(highlights);
  await mapElement.view.goTo({center:[-104.95,39.75],zoom:14},{animate:false});status.textContent='Ready';
  let request=0;
  mapElement.addEventListener('arcgisViewClick',async event=>{
    const current=++request,{mapPoint}=event.detail;
    status.textContent='Finding food stores…';
    const query=stores.createQuery();query.geometry=mapElement.view.extent.clone();query.spatialRelationship='intersects';query.returnGeometry=true;query.outFields=['*'];query.outSpatialReference=mapElement.view.spatialReference;
    try{
      const results=await stores.queryFeatures(query);if(current!==request)return;
      highlights.removeAll();
      const ranked=results.features.map(feature=>({feature,distance:distanceKm(mapPoint,feature.geometry)})).sort((a,b)=>a.distance-b.distance);
      highlights.addMany(ranked.map(({feature})=>new Graphic({geometry:feature.geometry,symbol:{type:'simple-marker',size:30,color:[255,200,0,0.1],outline:{color:'#d64a21',width:2}}})));
      const nearest=ranked[0],address=a=>[a.addr_1,a.addr_2,a.city,a.state,a.zip].map(v=>String(v??'').trim()).filter(Boolean).join(', ');
      popup.location=mapPoint;popup.heading='Food stores in view';
      popup.content=nearest?`<h3>Nearest store in view</h3><b>${esc(nearest.feature.attributes.name)}</b><br>${esc(address(nearest.feature.attributes))}<br>Straight-line distance: ${nearest.distance.toFixed(2)} km (${(nearest.distance/1.609344).toFixed(2)} mi)<h3>Stores in view (${ranked.length})</h3><ul>${ranked.map(({feature})=>`<li>${esc(feature.attributes.name)}</li>`).join('')}</ul>`:'<p>No food stores in view</p>';
      popup.open=true;status.textContent=`${ranked.length} stores in view`;
    }catch(error){if(current!==request)return;status.textContent='Store query unavailable';console.error(error);}
  });
}catch(error){status.textContent='Map unavailable';console.error(error);}
