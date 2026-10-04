'use strict';
const $=id=>document.getElementById(id);
// 文案翻译层（i18n.js）。在没有 i18n 的环境（例如官方 vm 测试）里回退到英文原文。
function TXT(k,f,p){if(typeof T==='function')return T(k,f,p);let s=f===undefined?k:f;if(p)for(const n in p)s=s.split('{'+n+'}').join(p[n]);return s;}
function preferredSampleRate(rates=radio.rxRates){return rates.includes(80000000)?80000000:Math.max(...rates);}
function applyRadioProfile(){
 const tuning=radio.frequencyInput(),lim=typeof tuneWindow==='function'?tuneWindow():[];
 $('frequency').min=lim.length?lim[0][0]:tuning.min;$('frequency').max=lim.length?lim[lim.length-1][1]:tuning.max;$('frequency').step=tuning.step;
 const g0=Number($('gain').value);
 // 增益滑杆在未连接时 min/max 都是 0，恢复的值会被浏览器夹成 0，所以等这里补一次。
 // （官方测试会把本函数单独切出来跑，restoreSettings 不在那个切片里，故用 typeof 兜底。）
 const restored=typeof restoreSettings==='function'?restoreSettings.gain:undefined;
 if(typeof restoreSettings==='function')restoreSettings.gain=undefined;
 const want=Number.isFinite(restored)?restored:g0;
 $('gain').min=radio.gainMin;$('gain').max=radio.gainMax;$('gain').step=radio.gainStep;
 $('gain').value=Number.isFinite(want)&&want>=radio.gainMin&&want<=radio.gainMax?want:Math.min(Math.max(40,radio.gainMin),radio.gainMax);
 $('gainValue').textContent=`${$('gain').value} / ${radio.gainMax}`;
 $('gainMode').querySelector('[value=HARDWARE]').disabled=!radio.hasHardwareAgc;
 if(!radio.hasGain||(!radio.hasHardwareAgc&&$('gainMode').value==='HARDWARE'))$('gainMode').value='MANUAL';
 for(const [id,rates] of [['rate',radio.rxRates]]){
  for(const o of $(id).options)o.disabled=!rates.includes(Number(o.value));
  // 保留用户上次选的采样率，只要这块芯片支持；否则回退到首选值。
  if(!rates.includes(Number($(id).value)))$(id).value=String(preferredSampleRate(rates));
 }
 const bandwidth=radio.bandwidthRange;
 // 保留用户上次选的模拟带宽（含「全开」），前提是这块芯片的档位支持；否则回退到 20 MHz / 最大档。
 const bwSel=Number($('bandwidth').value),bwKeep=!!bandwidth&&bwSel>=bandwidth[0]&&bwSel<=bandwidth[1]&&(bwSel-bandwidth[0])%bandwidth[2]===0;
 analogBandwidth=bandwidth?($('bandwidthOpen').checked?0:bwKeep?bwSel:(bandwidth[0]<=20&&bandwidth[1]>=20&&(20-bandwidth[0])%bandwidth[2]===0?20:bandwidth[3])):0;
 $('bandwidthControl').hidden=!bandwidth;
 if(bandwidth){$('bandwidth').min=bandwidth[0];$('bandwidth').max=bandwidth[1];$('bandwidth').step=bandwidth[2];$('bandwidth').value=analogBandwidth||bandwidth[1];$('bandwidthOpen').checked=analogBandwidth===0;}
 for(const option of $('bits').options)option.disabled=!radio.sampleBits.includes(Number(option.value));
 if(!radio.sampleBits.includes(Number($('bits').value)))$('bits').value=String(radio.sampleBits[0]);

 if(!radio.validFrequency(tuneFrequency)){tuneFrequency=2412;$('frequency').value='2412';}
 state();labels();
}
let spectrumMode=false,connectionBusy=false;
let connected=false,paused=false,latest=null,trace=null,maximum=null,previous=0,key='',running=false,tuneFrequency=2412,analogBandwidth=20;
const spec=$('spectrum'),water=$('waterfall'),sc=spec.getContext('2d'),wc=water.getContext('2d');
const lut=Array.from({length:256},(_,i)=>{const stops=[[3,8,23],[18,31,81],[38,63,153],[30,139,181],[66,213,174],[217,237,103],[255,162,61],[255,244,228]];const p=i/255*(stops.length-1),j=Math.min(stops.length-2,Math.floor(p)),t=p-j;return stops[j].map((v,k)=>Math.round(v*(1-t)+stops[j+1][k]*t));});

// ---- display zoom (wheel), pan (drag), reset (double-click) -------------
// view = visible fraction [a, b] of the received span; the waterfall keeps its
// rows (newest first) so it can be redrawn for any view.
let view={a:0,b:1},waterHist=[],drag=null,suppressClick=false,keepView=false,tuneClick=null;
var specCov=0; // fraction of the received samples that went through an on-chip FFT
function viewFrac(x,el){const r=el.getBoundingClientRect();return view.a+(x-r.left)/r.width*(view.b-view.a);}
function setView(a,b,free){const nb=(latest&&latest.fft)||2048,minW=Math.max(8/nb,1/1024);let w=Math.max(minW,Math.min(1,b-a));
 if(free){b=a+w;}else if(w>=1){a=0;b=1;}else{a=Math.max(0,Math.min(1-w,a));b=a+w;}view={a,b};redrawWater();draw();labels();}
// released beyond the received span: retune the LO by whole MHz so the view centre is covered
function retuneToView(){const c=latest||config(),span=c.rate/1e6,shift=Math.round(((view.a+view.b)/2-.5)*span);
 if(!connected||!shift){setView(view.a,view.b);return;}const lo0=loFrequency();tuneFrequency=radio.nearestFrequency(tuneFrequency+shift);$('frequency').value=tuneFrequency;
 const d=(loFrequency()-lo0)/span;keepView=true;setView(view.a-d,view.b-d);}
// 拖动过程中实时调谐（上游只在松手时调谐）：整 MHz 步进 + 150 ms 节流，
// 并让瀑布图历史跨过这次调谐保留下来（内容按绝对频率对齐，仍然有效）。
function liveRetune(now){
 if(!connected||!latest||now-liveRetune.last<150)return false;
 const span=latest.rate/1e6,shift=Math.round(((view.a+view.b)/2-.5)*span);
 if(!shift)return false;
 const lo0=loFrequency();tuneFrequency=radio.nearestFrequency(tuneFrequency+shift);
 if(loFrequency()===lo0)return false;
 liveRetune.last=now;$('frequency').value=tuneFrequency;
 const d=(loFrequency()-lo0)/span;keepView=true;setView(view.a-d,view.b-d);labels();
 return true;}
liveRetune.last=0;
function wmap(W,nb){if(!waterMap||waterMap.W!==W||waterMap.nb!==nb||waterMap.a!==view.a||waterMap.b!==view.b){
 const lo=new Uint16Array(W),hi=new Uint16Array(W),span=view.b-view.a;
 for(let x=0;x<W;x++){const f0=view.a+x/W*span,f1=view.a+(x+1)/W*span;lo[x]=Math.max(0,Math.min(nb,Math.floor(f0*nb)));hi[x]=Math.max(lo[x],Math.min(nb,Math.ceil(f1*nb)));}
 waterMap={W,nb,a:view.a,b:view.b,lo,hi};}return waterMap;}
function paintRows(rows,y0){const n=rows.length;if(!n)return;const W=water.width,nb=rows[0].length,m=wmap(W,nb),floor=Number($('floor').value),range=Number($('range').value),scale=255/range;
 if(!lut32){lut32=new Uint32Array(256);for(let i=0;i<256;i++){const [r,g,b]=lut[i];lut32[i]=(255<<24|b<<16|g<<8|r)>>>0;}}
 const img=wc.createImageData(W,n),px=new Uint32Array(img.data.buffer),lo=m.lo,hi=m.hi;
 for(let r=0;r<n;r++){const row=rows[r],base=r*W;for(let x=0;x<W;x++){let v=hi[x]>lo[x]?row[lo[x]]:-Infinity;for(let j=lo[x]+1;j<hi[x];j++)if(row[j]>v)v=row[j];let q=(v-floor)*scale;q=q<0?0:q>255?255:q|0;px[base+x]=lut32[q];}}
 wc.putImageData(img,0,y0);}
function pushWater(rowsNewestFirst){waterHist=rowsNewestFirst.concat(waterHist);if(waterHist.length>water.height)waterHist.length=water.height;}
function redrawWater(){wc.fillStyle='#11191e';wc.fillRect(0,0,water.width,water.height);paintRows(waterHist.slice(0,water.height),0);}
for(const el of [spec,water,$('axisCanvas')]){
 el.addEventListener('wheel',e=>{clearTimeout(tuneClick);e.preventDefault();const f=viewFrac(e.clientX,el),k=e.deltaY<0?0.8:1.25,a=f-(f-view.a)*k;setView(a,a+(view.b-view.a)*k);},{passive:false});
 el.addEventListener('mousedown',e=>{clearTimeout(tuneClick);if(e.button===0)drag={x:e.clientX,a:view.a,b:view.b,el,moved:false};});
 el.addEventListener('dblclick',e=>{clearTimeout(tuneClick);e.preventDefault();setView(0,1);});
 el.title=TXT('canvas.title','Wheel: zoom · drag: pan (past the edge = retune) · double-click: full span · click: tune');
}
window.addEventListener('mousemove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(!drag.moved&&Math.abs(dx)<4)return;drag.moved=true;
 const r=drag.el.getBoundingClientRect(),d=dx/r.width*(drag.b-drag.a);setView(drag.a-d,drag.b-d,connected);
 if(connected&&(view.a<-1e-9||view.b>1+1e-9)&&typeof liveRetune==='function'&&liveRetune(performance.now())){drag.a=view.a;drag.b=view.b;drag.x=e.clientX;}});
window.addEventListener('mouseup',()=>{if(drag&&drag.moved)suppressClick=true;const was=drag&&drag.moved;drag=null;if(was&&(view.a<-1e-9||view.b>1+1e-9))retuneToView();});
// ---- frequency axis: nice 1-2-5 ticks, shared with the spectrum grid -------
function axisTicks(c,W){const span=(view.b-view.a)*c.rate,f0=c.frequency*1e6+(view.a-.5)*c.rate,f1=f0+span;
 const raw=span/Math.max(2,W/110),p=10**Math.floor(Math.log10(raw)),m=raw/p,step=(m<1.5?1:m<3.5?2:m<7.5?5:10)*p,minor=step/(step/p===2?4:5);
 const x=f=>(f-f0)/span*W,major=[],minors=[];for(let f=Math.ceil(f0/minor)*minor;f<=f1;f+=minor){const r=Math.round(f/minor)*minor;if(Math.abs(r/step-Math.round(r/step))<1e-6)major.push(r);else minors.push(r);}
 return {step,major,minors,x};}
function drawAxis(c){const el=$('axisCanvas');if(!el)return;const d=Math.min(devicePixelRatio||1,2),W=Math.round(el.clientWidth*d),H=Math.round(el.clientHeight*d);
 if(el.width!==W||el.height!==H){el.width=W;el.height=H;}const g=el.getContext('2d');g.fillStyle='#182126';g.fillRect(0,0,W,H);if(!c||!c.rate)return;
 const t=axisTicks(c,W),dec=Math.max(0,Math.ceil(-Math.log10(t.step/1e6)-1e-9));g.strokeStyle='#5b686e';g.lineWidth=d;g.beginPath();
 for(const f of t.minors){const x=Math.round(t.x(f))+.5;g.moveTo(x,0);g.lineTo(x,4*d);}g.stroke();g.strokeStyle='#a1adb2';g.beginPath();
 for(const f of t.major){const x=Math.round(t.x(f))+.5;g.moveTo(x,0);g.lineTo(x,9*d);}g.stroke();
 // 上排：绝对频率（GHz/MHz）
 g.textBaseline='bottom';
 const row=(txt,x,y,color,font)=>{g.font=font;const tw=g.measureText(txt).width;g.fillStyle=color;g.fillText(txt,Math.max(2*d,Math.min(W-tw-2*d,x-tw/2)),y);};
 for(const f of t.major)row((f/1e6).toFixed(dec),t.x(f),H*0.52,'#c0c9cd',`${13*d}px Carlito,sans-serif`);
 // 下排：相对中心频率的偏移（MHz），永远以中心为 0、右正左负，自成 1-2-5 步进
 const ctr=c.frequency*1e6,stepMHz=t.step/1e6,spanMHz=(view.b-view.a)*c.rate/1e6,kMax=Math.ceil(spanMHz/2/stepMHz)+1,offs=[];
 for(let k=-kMax;k<=kMax;k++){const x=t.x(ctr+k*stepMHz*1e6);if(x<-2*d||x>W+2*d)continue;offs.push([k,x]);}
 g.strokeStyle='#48535a';g.lineWidth=d;g.beginPath();
 for(const [,x] of offs){g.moveTo(Math.round(x)+.5,H);g.lineTo(Math.round(x)+.5,H-3*d);}g.stroke();
 for(const [k,x] of offs)row((k>0?'+':'')+(k*stepMHz).toFixed(dec),x,H-4*d,k===0?'#e0a040':'#7f8c93',`${12*d}px Carlito,sans-serif`);
 const mark=(fMHz,col)=>{const x=t.x(fMHz*1e6);if(x<0||x>W)return;g.fillStyle=col;g.beginPath();g.moveTo(x-5*d,0);g.lineTo(x+5*d,0);g.lineTo(x,7*d);g.closePath();g.fill();};
 mark(c.frequency,'#e0a040');if(tuneFrequency!==c.frequency)mark(tuneFrequency,'#37c964');}
// ---- 0 Hz handling / offset LO ---------------------------------------------
try{const v=localStorage.getItem('espSdrDcMode');if(v&&$('dcMode').querySelector(`option[value="${v}"]`))$('dcMode').value=v;}catch(e){}
function loOffset(rate){return $('dcMode').value==='offset'?(rate>=40000000?5:2):0;}
function loFrequency(){const o=loOffset(Number($('rate').value));if(!o)return tuneFrequency;
 for(const f of [tuneFrequency-o,tuneFrequency+o])if(radio.validFrequency(f))return f;return tuneFrequency;}
$('dcMode').onchange=()=>{try{localStorage.setItem('espSdrDcMode',$('dcMode').value);}catch(e){}labels();draw();};

async function api(path,body){let value;
 if(path==='connect')value=await radio.connect({port:body.port});
 else if(path==='disconnect'){value=await radio.run(()=>radio.close());}
 else if(path==='frame')value=await radio.capture(body);
 else throw Error(TXT('err.unknown','Unknown operation'));
 return {json:async()=>value};
}
function error(e,communication=false){
 const box=$('error');box.textContent=e?.message||e;box.hidden=!e;
 if(e&&communication){const link=document.createElement('a');link.href='flash.html';link.textContent=TXT('link.install','Install / update ESP-SDR firmware');box.append(' ',link);}
}
function config(){return {frequency:loFrequency(),rate:Number($('rate').value),bits:Number($('bits').value),fft:Number($('fft').value),bandwidth:analogBandwidth,gainMode:$('gainMode').value,gain:Number($('gain').value),trigger:{mode:'free'}};}
function clear(){trace=null;maximum=null;waterHist=[];if(!keepView)view={a:0,b:1};keepView=false;wc.fillStyle='#11191e';wc.fillRect(0,0,water.width,water.height);draw();}
function resize(){const d=Math.min(devicePixelRatio||1,2);spec.width=Math.round(spec.clientWidth*d);spec.height=Math.round(spec.clientHeight*d);water.width=Math.round(water.clientWidth);water.height=Math.round(water.clientHeight);wc.fillStyle='#11191e';wc.fillRect(0,0,water.width,water.height);redrawWater();draw();labels();}
function fmtHz(hz){const a=Math.abs(hz);return a>=1e9?(hz/1e9).toFixed(6)+' GHz':a>=1e6?(hz/1e6).toFixed(3)+' MHz':a>=1e3?(hz/1e3).toFixed(1)+' kHz':hz.toFixed(0)+' Hz';}
function measBar(c){
 const spec=connected&&spectrumMode,n=spec?specConfig().fft:c.fft,center=c.frequency*1e6,span=c.rate;
 // Hann window: 3 dB bandwidth 1.44 bins
 const rbw=1.44*c.rate/n,top=Number($('floor').value)+Number($('range').value),div=Number($('range').value)/4;
 const det=spec?($('specDetector').value==='max'?TXT('det.max','max-hold'):TXT('det.avg','average')):TXT('det.avg','average');
 const acq=spec?(specLast?`${(specLast.pairs/c.rate*1e3).toFixed(2)} ms · ${specLast.ffts} FFT · ${radio.spectrumContinuous(Number($('rate').value),Number($('fft').value))?TXT('acq.continuous','continuous capture'):TXT('acq.snapshot','snapshot')}`:'—')
  :(latest?.samples?`${(latest.samples/c.rate*1e3).toFixed(3)} ms burst`:'—');
 const item=(k,v)=>`<span>${k} <b style="color:#e8eef0;font-weight:600">${v}</b></span>`;
 const wifiCh=typeof wifi24ChannelAt==='function'?wifi24ChannelAt(center/1e6):null;
 $('meas').innerHTML=[item(TXT('meas.start','Start'),fmtHz(center-span/2)),item(TXT('meas.center','Center'),fmtHz(center)+(wifiCh?` · WiFi ${wifiCh}`:'')),item(TXT('meas.span','Span'),fmtHz(span)),item(TXT('meas.stop','Stop'),fmtHz(center+span/2)),
  item(TXT('meas.rbw','RBW'),fmtHz(rbw)),item(TXT('meas.bins','Bins'),`${n}`),item(TXT('meas.ref','Ref'),`${top} dBFS`),item(TXT('meas.div','Div'),`${div} dB`),item(TXT('meas.det','Det'),det),item(TXT('meas.acq','Acq'),acq),item(TXT('meas.mode','Mode'),spec?TXT('mode.spec','SPEC on-chip'):TXT('mode.iq','burst IQ'))].join('');
}
function labels(f){const warning=connected?radio.frequencyWarning(tuneFrequency):'';$('tuningWarning').textContent=warning;$('tuningWarning').hidden=!warning;$('frequency').classList.toggle('offband',!!warning);$('frequency').title=warning;const c=f||config();drawAxis(c);measBar(c);
 // 模拟带宽比跨度窄时提醒：两侧是接收机自己削掉的，中间的台地是滤波器而不是信号
 {const bn=$('bandwidthNote');if(bn){const span=Number($('rate').value)/1e6;bn.hidden=!connected||!analogBandwidth||!(span>analogBandwidth);
  if(!bn.hidden){const p={span:span.toFixed(0),bw:analogBandwidth,half:(analogBandwidth/2).toFixed(0)};
   bn.textContent=typeof TXT==='function'?TXT('bw.note',`Span ${p.span} MHz is wider than the ${p.bw} MHz analog filter: beyond +-${p.half} MHz the receiver cuts the spectrum off by itself, so the plateau in the middle is the filter, not a signal. Tick "Wide open" to see the whole span.`,p):'';}}}
 if(typeof saveSettingsSoon==='function')saveSettingsSoon();}
// ---- 可用调谐窗口 + 频谱边界框（本副本新增）--------------------------------
// 上游只信固件上报的 RANGE（仅校验 100..6000），而本页说明过的「可尝试」范围更窄，
// 且未连接时 radio.family 默认是 C5，会让 2.7 GHz 以上、5 GHz 都进得来。
// 这里再叠一层边界：输入被吸附进窗口，窗口之外的区域在频谱上画成红色边界区。
const FAMILY_TUNE_BAND={S3:[2200,2700],S2:[2200,2700],S31:[2300,2800]};
function tuneRanges(){
 if(radio.hasExtendedTune&&radio.tuneRange)return [radio.tuneRange.slice()];
 if(radio.family==='ESP32')return [[2412,2472]];
 if(radio.family==='C61')return [[2400,2500]];
 if(radio.family==='C5')return [[2100,2700],[4800,6000]];
 if(radio.family==='S31')return [[2300,2800]];
 return [[2412,2484]];
}
function tuneWindow(){const band=FAMILY_TUNE_BAND[radio.family];
 return tuneRanges().map(([lo,hi])=>band?[Math.max(lo,band[0]),Math.min(hi,band[1])]:[lo,hi]).filter(([lo,hi])=>lo<=hi);}
function clampToWindow(f){const rs=tuneWindow();if(!rs.length)return f;
 let best=null;for(const [lo,hi] of rs){const c=Math.max(lo,Math.min(hi,f));if(best===null||Math.abs(c-f)<Math.abs(best-f))best=c;}return best;}
function drawTuneLimits(t,w,h,d){const rs=tuneWindow();if(!rs.length)return;
 // 红底：画面上落在所有可用区间之外的区域
 const segs=rs.map(([lo,hi])=>[t.x(lo*1e6),t.x(hi*1e6)]).sort((a,b)=>a[0]-b[0]);
 let x=0;sc.fillStyle='rgba(214,88,88,.12)';
 for(const [a,b] of segs){const a2=Math.max(0,Math.min(w,a)),b2=Math.max(0,Math.min(w,b));if(a2>x)sc.fillRect(x,0,a2-x,h);x=Math.max(x,b2);}
 if(x<w)sc.fillRect(x,0,w-x,h);
 // 边界线 + 角标（角标放画布底部，避免和 WiFi 信道号挤在一起）
 sc.save();sc.font=`${11*d}px Carlito,sans-serif`;sc.textAlign='center';sc.textBaseline='middle';
 const edge=(fMHz,sign)=>{const px=t.x(fMHz*1e6);if(px<0||px>w)return;
  sc.setLineDash([5*d,4*d]);sc.strokeStyle='#e06a6a';sc.lineWidth=1.5*d;sc.beginPath();sc.moveTo(Math.round(px)+.5,0);sc.lineTo(Math.round(px)+.5,h);sc.stroke();sc.setLineDash([]);
  const s=sign+fMHz,bw=sc.measureText(s).width+8*d,cx=Math.max(bw/2+2*d,Math.min(w-bw/2-2*d,px));
  sc.fillStyle='rgba(74,26,26,.95)';sc.fillRect(cx-bw/2,h-19*d,bw,16*d);
  sc.strokeStyle='#e06a6a';sc.lineWidth=d;sc.strokeRect(cx-bw/2+.5,h-19*d+.5,bw,16*d);
  sc.fillStyle='#ffb4b4';sc.fillText(s,cx,h-11*d);};
 for(const [lo,hi] of rs){edge(lo,'≥');edge(hi,'≤');}
 sc.restore();}
// ---- 2.4 GHz WiFi 信道覆盖层（本副本新增：纯显示，不参与无线电逻辑）------
// 信道 1–13：中心频率 = 2407 + 5n MHz；信道 14 = 2484 MHz（仅日本）。按 20 MHz 画宽带。
// 1 / 6 / 11 是唯一互不重叠的 20 MHz 组合，高亮显示。
const WIFI24_WIDTH=20,WIFI24_LAST=14;
function wifi24Center(n){return n===14?2484:2407+5*n;}
function wifi24Bands(t,w){const half=WIFI24_WIDTH/2,out=[];
 for(let n=1;n<=WIFI24_LAST;n++){const f=wifi24Center(n),cx=t.x(f*1e6),x0=t.x((f-half)*1e6),x1=t.x((f+half)*1e6);
  if(x1<-1||x0>w+1)continue;out.push({n,cx,x0:Math.max(-1,x0),x1:Math.min(w+1,x1),main:n%5===1});}
 return out;}
function wifi24ChannelAt(mhz){let best=null;for(let n=1;n<=WIFI24_LAST;n++){const d=Math.abs(mhz-wifi24Center(n));if(d<=WIFI24_WIDTH/2&&(!best||d<best.d))best={n,d};}return best?best.n:null;}
function drawWifi24Bands(bands,w,h,d){for(const b of bands){
 sc.fillStyle=b.main?'rgba(96,160,224,.16)':'rgba(96,160,224,.09)';sc.fillRect(b.x0,0,b.x1-b.x0,h);
 sc.save();sc.setLineDash([3*d,3*d]);sc.strokeStyle=b.main?'rgba(130,190,245,.85)':'rgba(130,170,200,.6)';sc.lineWidth=d;sc.beginPath();
 sc.moveTo(Math.round(b.x0)+.5,0);sc.lineTo(Math.round(b.x0)+.5,h);sc.moveTo(Math.round(b.x1)+.5,0);sc.lineTo(Math.round(b.x1)+.5,h);sc.stroke();sc.restore();}}
// 编号只画在「信道真实中心频率」所在的位置上，因此缩放不会让编号跑偏：
// 中心在画面内的才标注（挤在一起时跳过靠后的）；如果一个中心都不在画面内
// （缩放到两个信道之间），就在最近的一侧贴边标出最近的信道号，保留参照。
function drawWifi24Chips(bands,w,d){sc.save();sc.font=`${11*d}px Carlito,sans-serif`;sc.textAlign='center';sc.textBaseline='middle';
 const chip=(cx,n,main)=>{const s=String(n),bw=sc.measureText(s).width+8*d;
  sc.fillStyle=main?'rgba(29,63,102,.95)':'rgba(26,45,58,.95)';sc.fillRect(cx-bw/2,3*d,bw,16*d);
  sc.strokeStyle=main?'#7db4ec':'#5c7d94';sc.lineWidth=d;sc.strokeRect(cx-bw/2+.5,3*d+.5,bw,16*d);
  sc.fillStyle=main?'#dceaff':'#b9c9d4';sc.fillText(s,cx,11*d);return bw;};
 let last=-1e9,drawn=0,near=null;
 for(const b of bands){
  if(b.cx<0||b.cx>w){const dist=Math.min(-b.cx,b.cx-w);if(!near||dist<near.dist)near={b,dist};continue;}
  const bw=sc.measureText(String(b.n)).width+8*d,cx=Math.max(bw/2+2*d,Math.min(w-bw/2-2*d,b.cx));
  if(cx-bw/2<last+3*d)continue;
  last=cx+bw/2;chip(cx,b.n,b.main);drawn++;}
 if(!drawn&&near){const b=near.b,bw=sc.measureText(String(b.n)).width+8*d;chip(b.cx<0?bw/2+2*d:w-bw/2-2*d,b.n,b.main);}
 sc.restore();}
try{const v=localStorage.getItem('espSdrWifi');if(v!==null)$('wifiChannels').checked=v==='1';}catch(e){}
$('wifiChannels').onchange=()=>{try{localStorage.setItem('espSdrWifi',$('wifiChannels').checked?'1':'0');}catch(e){}draw();};
function draw(){const w=spec.width,h=spec.height,d=Math.min(devicePixelRatio||1,2),floor=Number($('floor').value),range=Number($('range').value);sc.fillStyle='#182126';sc.fillRect(0,0,w,h);sc.lineWidth=d;sc.font=`${14*d}px Carlito,sans-serif`;
for(let i=0;i<=4;i++){const y=i*h/4;sc.strokeStyle='#344047';sc.beginPath();sc.moveTo(0,y);sc.lineTo(w,y);sc.stroke();sc.fillStyle='#a1adb2';sc.fillText(`${Math.round(floor+range-i*range/4)}`,8*d,Math.max(16*d,y-5*d));}
let wifi=null;
{const c=latest?{frequency:latest.frequency,rate:latest.rate}:config(),t=axisTicks(c,w);sc.strokeStyle='#202a2f';sc.beginPath();for(const f of t.minors){const x=Math.round(t.x(f))+.5;sc.moveTo(x,0);sc.lineTo(x,h);}sc.stroke();sc.strokeStyle='#33424a';sc.beginPath();for(const f of t.major){const x=Math.round(t.x(f))+.5;sc.moveTo(x,0);sc.lineTo(x,h);}sc.stroke();
 if($('wifiChannels')?.checked)wifi=wifi24Bands(t,w);
 if(wifi)drawWifi24Bands(wifi,w,h,d);
 if(connected&&typeof drawTuneLimits==='function')drawTuneLimits(t,w,h,d);
 if(tuneFrequency!==c.frequency){const x=t.x(tuneFrequency*1e6);sc.save();sc.setLineDash([4*d,4*d]);sc.strokeStyle='#37c96490';sc.beginPath();sc.moveTo(x,0);sc.lineTo(x,h);sc.stroke();sc.restore();}drawAxis(c);}
function line(values,color,fill){if(!values)return;sc.beginPath();const L=values.length-1,sp=view.b-view.a,i0=Math.max(0,Math.floor(view.a*L)-1),i1=Math.min(L,Math.ceil(view.b*L)+1);for(let i=i0;i<=i1;i++){const v=values[i],x=(i/L-view.a)/sp*w,y=Math.max(0,Math.min(h,(1-(v-floor)/range)*h));if(i>i0)sc.lineTo(x,y);else sc.moveTo(x,y);}sc.strokeStyle=color;sc.lineWidth=1.2*d;sc.stroke();if(fill){sc.lineTo(w,h);sc.lineTo(0,h);sc.closePath();const g=sc.createLinearGradient(0,0,0,h);g.addColorStop(0,'#37c96445');g.addColorStop(1,'#37c96403');sc.fillStyle=g;sc.fill();}}
if($('hold').checked)line(maximum,'#e6b969',false);line(trace,'#37c964',true);
if(wifi)drawWifi24Chips(wifi,w,d);}
// ---- 调谐时平移历史（本副本新增）------------------------------------------
// 换中心频率后，只要频点数和跨度没变，老数据就是整体平移了若干个 bin。
// 把迹线、最大保持、瀑布图历史一起平移，换频后立刻就能看到满血的最大保持，
// 而不用每次清零重新累积。频点数/跨度变了、或平移超过一整屏，才退回清空。
function shiftedHistory(frequency,fft,rate){
 const p=shiftedHistory.last;shiftedHistory.last={frequency,fft,rate};
 if(!p||p.fft!==fft||p.rate!==rate||p.frequency===frequency)return null;
 const k=Math.round((frequency-p.frequency)*1e6*fft/rate);
 if(!k||Math.abs(k)>=fft)return null;
 const mv=arr=>{const n=arr.length,out=new Float32Array(n);for(let i=0;i<n;i++){const j=i+k;out[i]=j>=0&&j<n?arr[j]:-Infinity;}return out;};
 return {trace:trace&&trace.length===fft?mv(trace):null,maximum:maximum&&maximum.length===fft?mv(maximum):null,
  water:waterHist.map(r=>r.length===fft?mv(r):r)};
}
function render(f){const k=[f.frequency,f.rate,f.bits,f.fft,f.bandwidth,f.gainMode,f.gainMode==='MANUAL'?f.gain:'HARDWARE'].join('/');if(key!==k){const sh=shiftedHistory(f.frequency,f.fft,f.rate);key=k;clear();if(sh){trace=sh.trace;maximum=sh.maximum;waterHist=sh.water;redrawWater();}}latest=f;const a=Number($('average').value);trace=f.spectrum.map((v,i)=>trace?10*Math.log10(a*10**(trace[i]/10)+(1-a)*10**(v/10)):v);maximum=f.spectrum.map((v,i)=>maximum?Math.max(maximum[i],v):v);draw();
wc.drawImage(water,0,0,water.width,water.height-1,0,1,water.width,water.height-1);pushWater([Float32Array.from(f.spectrum)]);paintRows([waterHist[0]],0);autoScale(trace);
$('gainStatus').textContent=f.gain_actual?.mode==='HARDWARE'?TXT('gain.statusAgc','Hardware AGC'):f.gain_actual?TXT('gain.statusManual',`Manual · index ${f.gain_actual.index}`,{index:f.gain_actual.index}):TXT('gain.needUpdate','Update SDR firmware for gain control.');$('empty').hidden=true;labels(f);$('fpsLabel').textContent=TXT('footer.frames','frames/s');$('throughputLabel').textContent=TXT('footer.ksps','kS/s delivered');$('latencyLabel').textContent=TXT('footer.latencyIq','ms / capture + transfer');const now=performance.now();$('fps').textContent=previous?(1000/(now-previous)).toFixed(1):'—';previous=now;$('throughput').textContent=f.delivered_ksps.toFixed(1);$('latency').textContent=f.elapsed_ms.toFixed(1);$('peak').textContent=(f.peak_hz/1e6).toFixed(4);$('crc').textContent=TXT('crc.ok','CRC OK · #{seq}',{seq:f.sequence})+(f.dropped_captures?TXT('crc.dropped',' · {n} dropped · {samples} samples',{n:f.dropped_captures,samples:f.samples}):'');}
async function loop(){
 const TXT=(k,f,p)=>(typeof T==='function'?T(k,f,p):String(f===undefined?k:f).replace(/\{(\w+)\}/g,(m,n)=>p&&n in p?p[n]:m));
 if(running)return;
 running=true;
 try{
  while(connected&&!paused){
   try{
    if(spectrumMode&&radio.hasSpec)await specLoop();
    else{
    const f=await(await api('frame',config())).json();
    if(connected&&!paused&&!radio.changingBaud&&selectRxFrame(f))render(f);
    }
    if(!radio.changingBaud)error('');
   }catch(e){
    if(radio.changingBaud)break;
    paused=true;
    const disconnected=!!radio.failed;
    if(disconnected){connected=false;await radio.run(()=>radio.close()).catch(()=>{});}
    state();
    error(disconnected?e:`${e?.message||e} ${TXT('err.resume','Change the settings and select Resume.')}`,disconnected);
    break;
   }
   if(connected&&!paused)await new Promise(r=>setTimeout(r,10));
  }
 }finally{running=false;}
}
function serialWarning(){
 const TXT=(k,f,p)=>(typeof T==='function'?T(k,f,p):String(f===undefined?k:f).replace(/\{(\w+)\}/g,(m,n)=>p&&n in p?p[n]:m));
 const warning=$('serialWarning'),button=$('lowerBaud');
 warning.hidden=!connected||radio.droppedCaptures+radio.spectrumCrcErrors<3;
 const available=radio.supportsBaudChange&&radio.transport==='UART'&&radio.baudRate>1000000;
 button.hidden=!available;button.disabled=!!radio.changingBaud;
 button.textContent=radio.changingBaud?TXT('btn.switching','Switching…'):TXT('btn.switchBaud','Switch to 1 MBaud');
 $('serialWarningText').textContent=available
  ?TXT('warn.crcSlower','Repeated capture / CRC errors. A slower serial connection may help; the RF sample rate stays the same.')
  :radio.transport==='UART'&&radio.baudRate===1000000
   ?TXT('warn.crc1M','Capture / CRC errors continue at 1 MBaud. Check the USB connection or try a smaller FFT.')
   :radio.transport==='USB'?TXT('warn.crcUsb','Repeated capture / CRC errors. Check the USB connection or try a smaller FFT.')
   :TXT('warn.crcGeneric','Repeated capture / CRC errors. Check the USB connection. Updated firmware enables a slower UART connection.');
}
function state(){
 const TXT=(k,f,p)=>(typeof T==='function'?T(k,f,p):String(f===undefined?k:f).replace(/\{(\w+)\}/g,(m,n)=>p&&n in p?p[n]:m));
 if(!connected||!spectrumMode)$('chipStats').hidden=true;
 serialWarning();
 $('baudStatus').hidden=!connected||radio.transport!=='UART';
 $('baudStatus').textContent=radio.transport==='UART'?`${radio.baudRate/1000000} MBaud`:'';
 $('connect').disabled=connectionBusy||!!radio.changingBaud;
 $('openOther').disabled=connected||$('connect').disabled;
 $('openRecent').disabled=$('openOther').disabled||!savedPort();
 const warning=connected?radio.frequencyWarning(tuneFrequency):'';$('tuningWarning').textContent=warning;$('tuningWarning').hidden=!warning;$('frequency').classList.toggle('offband',!!warning);$('frequency').title=warning;
 for(const control of document.querySelectorAll('aside input,aside select'))control.disabled=!connected||!!radio.changingBaud;
 const specOk=connected&&radio.canStreamSpectrum;
 $('specControls').hidden=!specOk;$('specMode').disabled=!specOk||!!radio.changingBaud;
 $('iqMode').disabled=!connected||!!radio.changingBaud;
 if(!specOk)spectrumMode=false;
 $('iqMode').setAttribute('aria-pressed',String(!spectrumMode));$('specMode').setAttribute('aria-pressed',String(spectrumMode));
 $('iqControls').hidden=spectrumMode;$('specOptions').hidden=!spectrumMode;
 const options=$(spectrumMode?'specOptions':'iqControls');
 if($('fftControl').parentElement!==options)options.prepend($('fftControl'));
 $('specRow').disabled=!specOk||!spectrumMode||!!radio.changingBaud;$('specDetector').disabled=$('specRow').disabled;
 if(connected&&spectrumMode)$('bits').disabled=true;
 {const specOn=connected&&spectrumMode;
  for(const o of $('rate').options){o.disabled=specOn&&!radio.spectrumProfiles(Number(o.value)).length;o.hidden=o.disabled;}
  if(specOn&&!radio.spectrumProfiles(Number($('rate').value)).length)$('rate').value=String(radio.specCapabilities.profiles[0][0]);
  const sizes=specOn?specSizes(Number($('rate').value)):[512,1024,2048,4096];
  for(const o of $('fft').options){o.disabled=!sizes.includes(Number(o.value));o.hidden=o.disabled;}
  $('specNote').hidden=!specOn;
  $('specNote').textContent=radio.spectrumContinuous(Number($('rate').value),Number($('fft').value))
   ?TXT('spec.note.continuous','Continuous RF capture; only selected FFT windows are analyzed. Skipped work and dropped frames are reported.')
   :TXT('spec.note.snapshot','On-chip FFT of repeated snapshots. Reception has gaps between snapshots.');
  if(!sizes.includes(Number($('fft').value)))$('fft').value=String(specOn?sizes[sizes.length-1]:2048);}
 $('deviceModel').textContent=connected?(radio.deviceName||'ESP32-'+radio.family):'';$('deviceModel').hidden=!connected;$('chipIdentity').hidden=!connected;
 $('status').textContent=connected?(paused?TXT('state.paused','Paused'):TXT('state.receiving','Receiving')):TXT('state.disconnected','Disconnected');
 $('connect').textContent=connected?TXT('btn.disconnect','Disconnect'):TXT('btn.connect','Connect ESP-SDR');$('light').classList.toggle('on',connected&&!paused);
 $('pause').disabled=!connected||!!radio.changingBaud;$('pause').textContent=paused?TXT('btn.resume','Resume'):TXT('btn.pause','Pause');
 
 for(const b of document.querySelectorAll('[data-freq]'))b.disabled=!connected||!!radio.changingBaud||(+b.dataset.freq===5500&&radio.family!=='C5')||!radio.validFrequency(+b.dataset.freq);
 $('gainMode').querySelector('[value=HARDWARE]').disabled=connected&&!radio.hasHardwareAgc;$('gainMode').disabled=!connected||!!radio.changingBaud||!radio.hasGain;
 $('gain').disabled=!connected||!!radio.changingBaud||$('gainMode').value!=='MANUAL'||!radio.hasGain;
 $('bandwidthOpen').disabled=!connected||!!radio.changingBaud||!radio.bandwidthRange;$('bandwidth').disabled=!connected||!!radio.changingBaud||!radio.bandwidthRange||$('bandwidthOpen').checked;
}
function bandwidthChanged(){if(!$('bandwidthOpen').checked&&!$('bandwidth').checkValidity()){$('bandwidth').reportValidity();return;}analogBandwidth=$('bandwidthOpen').checked?0:Number($('bandwidth').value);clear();}
$('bandwidthOpen').onchange=()=>{state();bandwidthChanged();};$('bandwidth').onchange=bandwidthChanged;
$('bandwidth').closest('label').addEventListener('wheel',e=>{
 const input=$('bandwidth');if(input.disabled||!e.deltaY||e.ctrlKey)return;
 e.preventDefault();const previous=input.value;
 if(e.deltaY<0)input.stepUp();else input.stepDown();
 if(input.value!==previous)bandwidthChanged();
},{passive:false});
$('gainMode').onchange=()=>{state();clear();};$('gain').oninput=()=>{$('gainValue').textContent=`${$('gain').value} / ${radio.gainMax}`;clear();};
radio.onCaptureError=serialWarning;
$('lowerBaud').onclick=async()=>{
 if(!connected||radio.changingBaud)return;
 paused=true;radio.changingBaud=true;state();
 try{
  await radio.setBaudRate(1000000);
  paused=false;previous=0;latest=null;clear();error('');
 }catch(e){connected=!!radio.port&&!radio.failed;error(e,!connected);}
 finally{radio.changingBaud=false;state();if(connected&&!paused)loop();}
};
// Reuse a previously granted port only when its USB identity is unambiguous.
// The picker includes UART bridges as well as native USB boards.
const PORT_KEY='espSdrPort';
function savedPort(){try{return JSON.parse(localStorage.getItem(PORT_KEY)||'null');}catch(e){return null;}}
function rememberPort(p){try{const i=p.getInfo?.()||{};if(i.usbVendorId)localStorage.setItem(PORT_KEY,JSON.stringify({vid:i.usbVendorId,pid:i.usbProductId}));}catch(e){}}
async function choosePort(ev){
 const TXT=(k,f,p)=>(typeof T==='function'?T(k,f,p):String(f===undefined?k:f).replace(/\{(\w+)\}/g,(m,n)=>p&&n in p?p[n]:m));
 if(!navigator.serial)throw Error(TXT('err.webserial','WebSerial support is required in this browser.'));
 if(!ev?.choosePort){const saved=savedPort(),ports=await navigator.serial.getPorts();
  const matches=saved?ports.filter(p=>{const i=p.getInfo?.()||{};return i.usbVendorId===saved.vid&&i.usbProductId===saved.pid;}):[];
  if(matches.length===1)return matches[0];if(ev?.auto)return null;}
 return navigator.serial.requestPort();
}
$('connect').title=TXT('connect.title','Connect to the remembered port');
function closeConnectMenu(focus=false){$('connectMenu').hidden=true;$('choosePort').setAttribute('aria-expanded','false');if(focus)$('choosePort').focus();}
function openConnectMenu(){state();$('connectMenu').hidden=false;$('choosePort').setAttribute('aria-expanded','true');$('connectMenu').querySelector('button:not(:disabled),a').focus();}
$('choosePort').onclick=()=>{$('connectMenu').hidden?openConnectMenu():closeConnectMenu(true);};
$('choosePort').onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();openConnectMenu();}};
$('openRecent').onclick=()=>{closeConnectMenu(true);return $('connect').onclick();};
$('openOther').onclick=()=>{closeConnectMenu(true);return $('connect').onclick({choosePort:true});};
$('openFlasher').onclick=()=>closeConnectMenu(true);
$('connectMenu').onkeydown=e=>{
 if(e.key==='Escape'){e.preventDefault();closeConnectMenu(true);}
 else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
  e.preventDefault();const items=Array.from($('connectMenu').querySelectorAll('button:not(:disabled),a')),at=items.indexOf(document.activeElement);
  items[e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();
 }
};
document.addEventListener('click',e=>{if(!e.target.closest('.connect-buttons'))closeConnectMenu();});
document.addEventListener('focusin',e=>{if(!e.target.closest('.connect-buttons'))closeConnectMenu();});
$('connect').onclick=async(ev)=>{closeConnectMenu();if(connectionBusy||radio.changingBaud||(ev?.auto&&connected))return;connectionBusy=true;state();try{if(connected){connected=false;state();const done=api('disconnect',{});
 const timedOut=await Promise.race([done.then(()=>false),new Promise(r=>setTimeout(()=>r(true),2000))]);
 if(timedOut){await radio.closePort().catch(()=>{});await done.catch(()=>{});}}else{const port=await choosePort(ev);if(!port)return;await api('connect',{port});rememberPort(port);connected=true;spectrumMode=radio.canStreamSpectrum;applyRadioProfile();paused=false;previous=0;latest=null;clear();loop();}error('');}catch(e){error(e,!['NotFoundError','AbortError'].includes(e?.name));}finally{connectionBusy=false;state();}};
$('pause').onclick=()=>{paused=!paused;previous=0;state();if(!paused){error('');loop();}};$('clear').onclick=clear;
for(const id of ['rate','bits','fft'])$(id).onchange=()=>{state();labels();};
// 中心频率输入框：超出该芯片/固件的可用范围时自动吸附到最近可用频点。
// 上游只靠 <input min/max> 提示（浏览器画红框），值本身仍然会被接受，直到发送时才报错。
function snapFrequency(v){
 if(!Number.isFinite(v))return tuneFrequency;
 let r=Math.round(v);
 if(!connected)return r;                        // 未连接时不干预，等连接后再校准
 r=clampToWindow(r);                            // 先收进「芯片说明过的可尝试范围 × 固件范围」
 if(radio.validFrequency(r))return r;
 const n=radio.nearestFrequency(r);
 return radio.validFrequency(n)?n:clampToWindow(tuneFrequency);
}
function freqSnapNote(raw,value){
 const el=$('freqNote');if(!el)return;
 if(!Number.isFinite(raw)||raw===value||typeof TXT!=='function'){el.hidden=true;return;}
 el.textContent=TXT('freq.snapped','{raw} MHz is outside the range this chip and firmware support; snapped to the nearest usable frequency, {value} MHz.',{raw:Math.round(raw),value});
 el.hidden=false;clearTimeout(freqSnapNote.t);freqSnapNote.t=setTimeout(()=>{el.hidden=true;},7000);
}
$('frequency').onchange=()=>{const raw=Number($('frequency').value),value=snapFrequency(raw);$('frequency').value=value;tuneFrequency=value;freqSnapNote(raw,value);labels();};
$('frequency').onkeydown=e=>{if(e.key==='Enter')$('frequency').blur();};
$('frequency').closest('label').addEventListener('wheel',e=>{
 const input=$('frequency');if(input.disabled||!e.deltaY||e.ctrlKey)return;
 e.preventDefault();
 const value=Number(input.value),current=input.value!==''&&Number.isFinite(value)?value:tuneFrequency;
 tuneFrequency=radio.nearestFrequency(Math.round(current)-Math.sign(e.deltaY));
 input.value=tuneFrequency;labels();
},{passive:false});
for(const b of document.querySelectorAll('[data-freq]'))b.onclick=()=>{$('frequency').value=b.dataset.freq;tuneFrequency=Number(b.dataset.freq);labels();};
for(const id of ['floor','range'])$(id).oninput=()=>{$('floorValue').textContent=$('floor').value+' dBFS';$('rangeValue').textContent=$('range').value+' dB';$('scale').textContent=`${$('floor').value} → ${Number($('floor').value)+Number($('range').value)} dBFS`;redrawWater();draw();};
$('hold').onchange=()=>{maximum=null;draw();};
spec.onmousemove=e=>{if(!latest)return;const x=viewFrac(e.clientX,spec),i=Math.max(0,Math.min(latest.fft-1,Math.floor(x*latest.fft))),mhz=(latest.frequency*1e6+(x-.5)*latest.rate)/1e6,ch=typeof wifi24ChannelAt==='function'?wifi24ChannelAt(mhz):null;$('cursor').textContent=`${mhz.toFixed(5)} MHz${ch?` · WiFi ${ch}`:''} · ${latest.spectrum[i].toFixed(1)} dBFS`;};
function queueTune(e,el){if(suppressClick){suppressClick=false;return;}if(e.detail>1)return;clearTimeout(tuneClick);const x=e.clientX;tuneClick=setTimeout(()=>{if(connected&&latest){tuneFrequency=radio.nearestFrequency(latest.frequency+(viewFrac(x,el)-.5)*latest.rate/1e6);$('frequency').value=tuneFrequency;labels();}},250);}
spec.onclick=e=>queueTune(e,spec);
water.onclick=e=>queueTune(e,water);$('axisCanvas').onclick=e=>queueTune(e,$('axisCanvas'));
new ResizeObserver(resize).observe(spec);labels();state();

// Keep a frame-selection boundary for future signal-based triggering.
function selectRxFrame(f){
 return f.frequency===loFrequency()&&f.rate===Number($('rate').value)&&
  (!f.trigger||f.trigger.mode==='free');
}

// Firmware-computed spectrum stream.
let specPending=[],specLast=null,specRAF=0,specCount=[],specInfo=null,autoT=0,waterMap=null,lut32=null;
// Firmware bins are |FFT(I+jQ)|^2 in FFT order; this app displays conj(I+jQ)
// (see capture(): q is negated), so web bin j holds firmware bin (n/2-j) mod n.
// code/step = 10log10|X|^2 with X = FFT(IQ10*64*hann)/n; 84.3 dB maps that to
// the dBFS scale of spectrum() (full scale 512, Hann power normalization), for any n.
// Code 0 includes below-floor powers; display it at the nominal encoding floor.
function specToDbfs(bins,step,n){const out=new Float32Array(n);for(let j=0;j<n;j++){const v=bins[(n/2-j+n)%n];out[j]=v/step-84.3;}
 // zero-IF DC offset / LO leakage (35-45 dB over the floor, VSG60 test): bridge DC +-1 bin
 if($('dcMode').value==='fill'){const c=n/2,m=10*Math.log10((10**(out[c-2]/10)+10**(out[c+2]/10))/2);out[c-1]=out[c]=out[c+1]=m;}return out;}
function specSizes(rate){return radio.spectrumProfiles(rate).map(p=>p[2]);}
function specConfig(){
 const c=config(),profiles=radio.spectrumProfiles(c.rate);
 const profile=profiles.find(p=>p[2]===c.fft)||profiles[0];
 if(!profile)return {...c,stride:1,upf:1};
 const [rate,,fft,stride,upf0]=profile;
 // S3/S31 continuous: one bank unit is 12288 pairs (0.77 ms at 16 MS/s). ~2 frames per
 // waterfall row are enough; the chip merges the rest (far less dB coding/CRC/USB work).
 const unitMs=12288e3/rate,rowMs=Number($('specRow').value)||0;
 const upf=['S3','S31'].includes(radio.family)&&radio.spectrumContinuous(rate,fft)?Math.min(1000,Math.max(upf0,Math.floor(rowMs/unitMs/2))):upf0;
 return {...c,rate,fft,bits:10,stride,upf,maxHold:$('specDetector').value==='max'};
}
async function specLoop(){
 specPending=[];specLast=null;specCount=[];specCov=null;
 const c=specConfig(),n=c.fft,rowMs=Number($('specRow').value);let agg=null,aggN=0,aggT=0;
 const changed=()=>{const m=specConfig();return m.frequency!==c.frequency||m.gainMode!==c.gainMode||m.gain!==c.gain||m.bandwidth!==c.bandwidth||m.maxHold!==c.maxHold||m.rate!==c.rate||m.fft!==c.fft||Number($('specRow').value)!==rowMs;};
 if(!specRAF)specRAF=requestAnimationFrame(specFrame);
 specInfo=await radio.spec(c,(h,bins,info)=>{
  specInfo=info;if(info.stats)specCov=info.stats.coverage/100;else if(h.pairs&&radio.spectrumContinuous(c.rate,n))specCov=h.ffts*n/h.pairs;else specCov=null;const s=specToDbfs(bins,h.step,n);
  if(!agg){agg=s;aggN=1;aggT=h.t;}else if(c.maxHold){for(let i=0;i<n;i++)if(s[i]>agg[i])agg[i]=s[i];}
  else{aggN++;for(let i=0;i<n;i++)agg[i]=10*Math.log10(((aggN-1)*10**(agg[i]/10)+10**(s[i]/10))/aggN);}
  specLast=h;specCount.push(performance.now());
  if(h.t-aggT>=rowMs/1000){specPending.push(agg);agg=null;}
  // hidden tab: no animation frames, so bound the backlog here
  if(specPending.length>1024)specPending.splice(0,specPending.length-512);
  if(specCount.length>4096){const t=performance.now()-1000;let i=0;while(i<specCount.length&&specCount[i]<t)i++;specCount.splice(0,i);}
 },()=>!connected||paused||!spectrumMode||changed());
}
function specFrame(){specRAF=0;if(specPending.length){let rows=specPending;specPending=[];if(rows.length>water.height)rows=rows.slice(-water.height);renderSpec(rows);}if(connected&&!paused&&spectrumMode)specRAF=requestAnimationFrame(specFrame);}
function renderSpec(rows){
 const c=specConfig(),nb=rows[0].length,k=['spec',c.rate,nb,c.frequency,c.bandwidth,c.gainMode,c.gain,$('specRow').value].join('/');
 if(key!==k){const sh=shiftedHistory(c.frequency,nb,c.rate);key=k;clear();if(sh){trace=sh.trace;maximum=sh.maximum;waterHist=sh.water;redrawWater();}}
 const cur=Float32Array.from(rows[0]);if(c.maxHold){for(const r of rows)for(let i=0;i<nb;i++)if(r[i]>cur[i])cur[i]=r[i];}
 else for(let i=0;i<nb;i++){let p=0;for(const r of rows)p+=10**(r[i]/10);cur[i]=10*Math.log10(p/rows.length);}
 const a=Number($('average').value);
 if(trace&&trace.length!==nb){trace=null;maximum=null;}
 trace=Array.from(cur,(v,i)=>trace?10*Math.log10(a*10**(trace[i]/10)+(1-a)*10**(v/10)):v);
 maximum=Array.from(cur,(v,i)=>maximum?Math.max(maximum[i],v):v);
 latest={frequency:c.frequency,rate:c.rate,fft:nb,spectrum:trace};draw();
 const n=Math.min(rows.length,water.height),floor=Number($('floor').value),range=Number($('range').value),W=water.width;
 wc.drawImage(water,0,0,W,water.height-n,0,n,W,water.height-n);
 // one pixel column = max of the bins it covers in the current view
 const newest=[];for(let r=0;r<n;r++)newest.push(rows[rows.length-1-r]);pushWater(newest);paintRows(newest,0);
 autoScale(trace);
 let peak=0;for(let j=1;j<nb;j++)if(cur[j]>cur[peak])peak=j;
 const now=performance.now();while(specCount.length&&specCount[0]<now-1000)specCount.shift();
 $('empty').hidden=true;labels(c);
 $('fps').textContent=`${specCount.length}`;$('fpsLabel').textContent=TXT('footer.spectra','spectra/s');
 {const st=specInfo&&specInfo.stats,el=$('chipStats');el.hidden=!st||performance.now()-st.t>3000;if(!el.hidden)el.textContent=`Core 0: ${st.core0.toFixed(0)} % · Core 1: ${st.dual?st.core1.toFixed(0)+' %':'off'}\nFFT coverage: ${st.coverage.toFixed(1)} % (${(st.fftsPerS/1e3).toFixed(1)} k/s)\nRAM free: ${(st.heapFree/1024).toFixed(0)} KB · Largest block: ${(st.heapLargest/1024).toFixed(0)} KB\nMax lateness: ${st.lateMax} · Skipped: ${st.abandoned}\nQueue: ${st.queue.toFixed(0)} %`;}
 $('throughput').textContent=(specCount.length*(32+nb)/1e3).toFixed(0);$('throughputLabel').textContent=TXT('footer.throughput','kB/s over {transport}',{transport:radio.transport})+' · '+TXT('footer.onChip','{rate} MS/s on chip',{rate:c.rate/1e6})+(specCov===null?'':' · '+TXT('footer.fftCoverage','FFT on {pct}% of samples',{pct:Math.round(specCov*100)}));
 $('latency').textContent=specLast?(specLast.pairs/c.rate*1e3).toFixed(2):'—';$('latencyLabel').textContent=TXT('footer.latencySpec','ms / spectrum')+' · '+TXT('footer.latencySpecDetail','{mode} of {ffts} FFT',{mode:c.maxHold?TXT('footer.modeMax','max'):TXT('footer.modeMean','mean'),ffts:specLast?.ffts??'—'});
 $('peak').textContent=((c.frequency*1e6+(peak-nb/2)*c.rate/nb)/1e6).toFixed(4);
 const g=specInfo?.gain;$('gainStatus').textContent=(g?.mode==='HARDWARE'?TXT('gain.statusAgc','Hardware AGC'):g?TXT('gain.statusManual',`Manual · index ${g.index}`,{index:g.index}):'');
 $('crc').textContent=TXT('crc.spec','SPEC · ')+(radio.spectrumContinuous(Number($('rate').value),Number($('fft').value))?TXT('crc.specContinuous','continuous capture'):TXT('crc.specSnapshot','snapshots with gaps'))+TXT('crc.specFrame',' · #{frame}',{frame:specLast?.frame??0})+(specLast?.drops?TXT('crc.specDrops',' · {n} dropped',{n:specLast.drops}):'')+(specInfo?.crcErrors?TXT('crc.specErrors',' · {n} CRC err',{n:specInfo.crcErrors}):'')+(specInfo?.hostDropped?TXT('crc.specHost',' · {n} kB skipped (page busy)',{n:Math.round(specInfo.hostDropped/1024)}):'');
}
$('iqMode').onclick=()=>{spectrumMode=false;state();labels();};
$('specMode').onclick=()=>{if(!radio.canStreamSpectrum)return;spectrumMode=true;state();labels();};
// Auto scale: floor a little under the noise (20th percentile), top a little
// above the strongest bin; applied at most twice a second, smoothed, without
// clearing the waterfall.
let autoPk=null;
// Calm auto scale: floor = 20th percentile - 10 dB in 5 dB steps (4 dB hysteresis),
// top = slowly decaying peak hold + 5 dB in 10 dB steps; evaluated once a second.
function autoScale(values){
 if(!$('autoscale').checked||!values?.length)return;
 const now=performance.now();if(now-autoT<1000)return;autoT=now;
 const v=Array.from(values).filter(Number.isFinite).sort((a,b)=>a-b);if(v.length<8)return;
 const nf=v[Math.floor(v.length*.2)]-10,pk=v[v.length-1];autoPk=autoPk===null?pk:Math.max(pk,autoPk-2);
 const f0=Number($('floor').value),r0=Number($('range').value);
 let floor=Math.abs(nf-f0)>4?Math.round(nf/5)*5:f0,top=f0+r0;
 if(autoPk+5>top||autoPk+25<top)top=Math.ceil((autoPk+5)/10)*10;
 floor=Math.max(-140,Math.min(-40,floor));const range=Math.max(20,Math.min(120,top-floor));
 if(floor===f0&&range===r0)return;
 $('floor').value=floor;$('range').value=range;
 $('floorValue').textContent=floor+' dBFS';$('rangeValue').textContent=range+' dB';
 $('scale').textContent=`${floor} → ${floor+range} dBFS`;redrawWater();draw();
}
$('autoscale').onchange=()=>{autoT=0;autoPk=null;};
// ---- spectrum / waterfall splitter ----------------------------------------
{const sp=$('splitter'),def=[220,380],set=(hs,hw)=>{spec.style.height=hs+'px';water.style.height=hw+'px';resize();redrawWater();};
 try{const v=JSON.parse(localStorage.getItem('espSdrSplit')||'null');if(Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&n>=80&&n<=1200))set(v[0],v[1]);}catch(e){}
 let sd=null;sp.addEventListener('pointerdown',e=>{sd={y:e.clientY,hs:spec.clientHeight,hw:water.clientHeight};sp.setPointerCapture(e.pointerId);sp.classList.add('drag');e.preventDefault();});
 sp.addEventListener('pointermove',e=>{if(!sd)return;const tot=sd.hs+sd.hw,hs=Math.max(80,Math.min(tot-80,sd.hs+e.clientY-sd.y));set(hs,tot-hs);});
 sp.addEventListener('pointercancel',()=>{sd=null;sp.classList.remove('drag');});
 sp.addEventListener('pointerup',()=>{if(!sd)return;sd=null;sp.classList.remove('drag');try{localStorage.setItem('espSdrSplit',JSON.stringify([spec.clientHeight,water.clientHeight]));}catch(e){}});
 sp.addEventListener('dblclick',()=>{set(def[0],def[1]);try{localStorage.removeItem('espSdrSplit');}catch(e){}});}

// Start without a click: connect to the remembered port as soon as the page
// loads and whenever a device is plugged in (only ports this site was granted).
if(navigator.serial){navigator.serial.addEventListener?.('connect',()=>setTimeout(()=>$('connect').onclick({auto:true}),500));
 setTimeout(()=>$('connect').onclick({auto:true}),300);}

// ---- 中文增强版：语言切换后重刷动态文案 ------------------------------------
window.refreshTexts=()=>{state();labels();};

// ---- 设置记忆（本副本新增）：刷新/关掉再开也保留上次的配置 -------------------
// 存的都是纯界面参数；语言、零中频处理、WiFi 信道开关、分栏高度各自另有键，互不干扰。
const SETTINGS_KEY='espSdrSettings';
const SETTINGS_FIELDS=['rate','fft','bits','gainMode','gain','average','floor','range','specRow','specDetector','bandwidth','bandwidthOpen'];
function saveSettings(){
 try{
  const s={frequency:tuneFrequency};
  for(const id of SETTINGS_FIELDS){const el=$(id);if(el)s[id]=el.type==='checkbox'?el.checked:el.value;}
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));
 }catch(e){}
}
function saveSettingsSoon(){const now=Date.now();if(now-saveSettingsSoon.t<3000)return;saveSettingsSoon.t=now;saveSettings();}
function restoreSettings(){
 const s=(()=>{try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{};}catch(e){return {};}})();
 if(Number.isFinite(s.frequency)&&s.frequency>0){tuneFrequency=s.frequency;$('frequency').value=s.frequency;}
 if(Number.isFinite(Number(s.gain)))restoreSettings.gain=Number(s.gain);
 for(const id of SETTINGS_FIELDS){const v=s[id];if(v===undefined||v===null)continue;const el=$(id);
  if(!el)continue;
  if(el.type==='checkbox'){if(typeof v==='boolean')el.checked=v;}
  else if(el.tagName==='SELECT'){if([...el.options].some(o=>o.value===String(v)))el.value=String(v);}
  else el.value=String(v);}
 // 底部读数与瀑布图色标跟着恢复后的值重算
 $('floorValue').textContent=$('floor').value+' dBFS';$('rangeValue').textContent=$('range').value+' dB';
 $('scale').textContent=`${$('floor').value} → ${Number($('floor').value)+Number($('range').value)} dBFS`;
 redrawWater();draw();labels();
}
restoreSettings();
// 界面上任何控件被改动都记一笔；调谐（点击 / 滚轮 / 预设）走 labels() 的节流路径。
document.addEventListener('change',e=>{if(e.target.closest?.('aside'))saveSettings();});
document.addEventListener('input',e=>{if(e.target.closest?.('aside'))saveSettings();});
