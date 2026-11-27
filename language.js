'use strict';
(async function(){
 const response=await fetch('ru-map.json?v=lab1');if(!response.ok)return;
 const dictionary=await response.json();const normalize=s=>s.replace(/\s+/g,' ').trim();const lookup=new Map(Object.entries(dictionary).map(([k,v])=>[normalize(k),v]));
 const phrases=[...lookup.entries()].filter(([k,v])=>k.length>=14&&k!==v).sort((a,b)=>b[0].length-a[0].length);
 let language='kk';try{if(localStorage.getItem('bioenglish-language')==='ru')language='ru';}catch{}
 const origins=new WeakMap(),attributeOrigins=new WeakMap();let scheduled=false;
 function translate(text){const key=normalize(text);if(!key)return text;let result=lookup.get(key);if(result===undefined){result=key;
  for(const [source,target] of phrases)if(result.includes(source))result=result.split(source).join(target);
  result=result.replace(/^(?:Оқу кеңістігі|Учебное пространство)\s*\/\s*(.*)$/,(_,route)=>'Учебное пространство / '+(lookup.get(route)||route))
   .replace(/^(.*) · BioEnglish Tandem$/,(_,page)=>(lookup.get(page)||page)+' · BioEnglish Tandem')
   .replace(/^(\d+)[–-]?(\d+)? минут$/,(_,a,b)=>a+(b?'–'+b:'')+' минут')
   .replace(/MODULE (\d) · (\d+[–-]\d+) ББ\./g,'MODULE $1 · С. $2')
   .replace(/\b(\d+) кездесу\/сағ/g,'$1 встреч/час').replace(/\/сағ/g,'/час')
   .replace(/(\d+) сағат/g,'$1 час.')
   .replace(/Доминантты фенотип:/g,'Доминантный фенотип:').replace(/Рецессивті фенотип:/g,'Рецессивный фенотип:')
   .replace(/ықтимал генотиптер/g,'возможные генотипы')
   .replace(/Қаріп өлшемі:/g,'Размер шрифта:')
   .replace(/Ғылыми:/g,'Научное понимание:').replace(/ағылшын мәтіні:/g,'английский текст:')
   .replace(/Ағылшын тілін түсіну:/g,'Понимание английского:')
   .replace(/Қайта қара:/g,'Повтори:').replace(/^(.*?) ✓$/,(_,term)=>(lookup.get(term)||term)+' ✓');
 }
 if(result===key)return text;const leading=text.match(/^\s*/)[0],trailing=text.match(/\s*$/)[0];return leading+result+trailing;
 }
 const switcher=document.createElement('div');switcher.className='language-switch';switcher.setAttribute('role','group');switcher.innerHTML='<button type="button" data-language="kk" lang="kk">Қазақша</button><button type="button" data-language="ru" lang="ru">Русский</button>';document.body.append(switcher);
 function eligible(element){return element&&!element.closest('script,style,textarea,[contenteditable="true"],[data-user-text],.language-switch');}
 function apply(){scheduled=false;observer.disconnect();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){if(!eligible(node.parentElement))continue;let record=origins.get(node);if(!record||node.nodeValue!==record.last)record={kk:node.nodeValue};const target=language==='ru'?(node.parentElement.matches('.cinema-numbers a[href="#cases"] span')?'Жизненных кейсов':translate(record.kk)):record.kk;if(node.nodeValue!==target)node.nodeValue=target;record.last=target;origins.set(node,record);}
  document.querySelectorAll('[aria-label],[placeholder],[title]').forEach(element=>{if(!eligible(element))return;const records=attributeOrigins.get(element)||{};for(const name of ['aria-label','placeholder','title']){if(!element.hasAttribute(name))continue;const current=element.getAttribute(name);let record=records[name];if(!record||current!==record.last)record={kk:current};const target=language==='ru'?translate(record.kk):record.kk;if(current!==target)element.setAttribute(name,target);record.last=target;records[name]=record;}attributeOrigins.set(element,records);});
  let titleRecord=origins.get(document.querySelector('title'));if(!titleRecord||document.title!==titleRecord.last)titleRecord={kk:document.title};document.title=language==='ru'?translate(titleRecord.kk):titleRecord.kk;titleRecord.last=document.title;origins.set(document.querySelector('title'),titleRecord);
  document.documentElement.lang=language;switcher.setAttribute('aria-label',language==='ru'?'Язык интерфейса':'Интерфейс тілі');switcher.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label']});
 }
 const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(apply);}});
 switcher.addEventListener('click',event=>{const button=event.target.closest('[data-language]');if(!button)return;language=button.dataset.language;try{localStorage.setItem('bioenglish-language',language);}catch{}apply();const search=document.querySelector('#word-search');if(search?.value)search.dispatchEvent(new Event('input',{bubbles:true}));});
 // Match the displayed Russian glossary, preserving the English terms and quiz data.
 document.addEventListener('input',event=>{if(language!=='ru'||event.target.id!=='word-search')return;event.stopImmediatePropagation();const term=event.target.value.toLocaleLowerCase().trim();const found=words.filter(word=>word.map(value=>translate(value)).join(' ').toLocaleLowerCase().includes(term));document.querySelector('#words').innerHTML=found.length?found.map(wordCard).join(''):'<p class="empty">Сөз табылмады. Басқа сөзді немесе қысқа бөлігін іздеп көр.</p>';},true);
 window.bioEnglishI18n={get language(){return language;},translate};apply();
})().catch(()=>{ /* Keep the original Kazakh interface if the translation file is unavailable. */ });
