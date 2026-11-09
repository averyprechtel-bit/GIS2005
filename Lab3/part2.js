const [Basemap, OpenStreetMapLayer, reactiveUtils] = await $arcgis.import(['@arcgis/core/Basemap.js','@arcgis/core/layers/OpenStreetMapLayer.js','@arcgis/core/core/reactiveUtils.js']);
const element=document.querySelector('#myMap'),status=document.querySelector('#status');
try{
  await element.viewOnReady();
  const map=element.map;await map.loadAll();
  const stores=map.layers.find(l=>/Food_Stores/i.test(l.title));
  const buildings=map.layers.find(l=>/Bldgs/i.test(l.title));
  stores.title='Food stores';stores.popupEnabled=true;
  stores.renderer={type:'simple',symbol:{type:'picture-marker',url:new URL('groceries.svg',import.meta.url).href,width:24,height:24}};
  stores.popupTemplate={title:'{name}',content:[{type:'fields',fieldInfos:[{fieldName:'type',label:'Store type'},{fieldName:'addr_1',label:'Address'},{fieldName:'city',label:'City'},{fieldName:'state',label:'State'}]}]};
  buildings.title='Buildings by type';buildings.opacity=0.5;buildings.minScale=150000;buildings.maxScale=1128;
  buildings.popupEnabled=true;buildings.popupTemplate={title:'Building',content:[{type:'fields',fieldInfos:[{fieldName:'type',label:'Building type'}]}]};
  const usgs=map.basemap,osm=new Basemap({title:'OpenStreetMap',baseLayers:[new OpenStreetMapLayer()]});
  document.querySelector('#basemap').addEventListener('change',e=>{map.basemap=e.target.value==='usgs'?usgs:osm;});
  document.querySelector('#opacity').addEventListener('change',e=>{buildings.opacity=Number(e.target.value);});
  const storeToggle=document.querySelector('#stores-visible'),buildingToggle=document.querySelector('#buildings-visible');
  storeToggle.addEventListener('change',()=>{stores.visible=storeToggle.checked;});
  buildingToggle.addEventListener('change',()=>{buildings.visible=buildingToggle.checked;});
  reactiveUtils.watch(()=>stores.visible,v=>{storeToggle.checked=v;});
  reactiveUtils.watch(()=>buildings.visible,v=>{buildingToggle.checked=v;});
  await element.view.goTo({center:[-104.95,39.75],zoom:14},{animate:false});status.textContent='Ready';
}catch(error){status.textContent='Map unavailable';console.error(error);}
