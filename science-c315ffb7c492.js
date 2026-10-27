// New topic scenes keep their SVG nodes and update attributes instead of rebuilding each frame.
let visualView = null;
const visualOptions = {
  triangle:[["all","All three present"],["heat","Remove heat (virtual)"],["fuel","Remove fuel (virtual)"],["oxygen","Remove oxygen (virtual)"]],
  "cell-compare":[["leaf","Photosynthetic plant cell"],["onion","Onion-bulb cell"]],
  "cell-parts":[["membrane","Membrane"],["nucleus","Nucleus"],["cytoplasm","Cytoplasm"],["wall","Cell wall"],["vacuole","Central vacuole"],["chloroplast","Chloroplasts"]],
  microscope:[["4","4-times objective"],["10","10-times objective"],["40","40-times objective"]],
  "water-cell":[["dilute","More dilute outside"],["equal","Equal model conditions"],["concentrated","More concentrated outside"]]
};
function prepareVisualControls(scene) {
  visualView=null;
  const choices=visualOptions[scene];
  $("scene-controls").hidden=!choices;
  $("scene-choice").replaceChildren();
  if(choices)for(const [value,label] of choices){const option=el("option",label);option.value=value;$("scene-choice").append(option);}
}
function vNode(tag,attrs={},parent=$("mission-art")) {
  const n=document.createElementNS("http://www.w3.org/2000/svg",tag);
  for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);
  parent.append(n);return n;
}
function vText(x,y,value,size=20,color="#eaf3df",parent) {
  const n=vNode("text",{x,y,"text-anchor":"middle",fill:color,"font-size":size},parent);
  n.textContent=value;return n;
}
function vBox(x,y,w,h,fill="#498d91",parent) {return vNode("rect",{x,y,width:w,height:h,rx:12,fill},parent);}
function vDot(x,y,r=9,fill="#d8ef88",parent) {return vNode("circle",{cx:x,cy:y,r,fill},parent);}
function vArrow(x1,y1,x2,y2,color="#d8ef88",parent) {
  const angle=Math.atan2(y2-y1,x2-x1),len=9;
  return vNode("path",{d:`M${x1} ${y1}L${x2} ${y2}M${x2-len*Math.cos(angle-.6)} ${y2-len*Math.sin(angle-.6)}L${x2} ${y2}L${x2-len*Math.cos(angle+.6)} ${y2-len*Math.sin(angle+.6)}`,stroke:color,"stroke-width":3,fill:"none"},parent);
}
function vCell(x,y,w,h,plant=true,chloroplasts=true) {
  const group=vNode("g");
  const wall=plant?vNode("rect",{x,y,width:w,height:h,rx:16,fill:"#739d69",stroke:"#b5d786","stroke-width":5},group):null;
  const membrane=plant?vNode("rect",{x:x+8,y:y+8,width:w-16,height:h-16,rx:13,fill:"#d6dfb4",stroke:"#dceecb","stroke-width":2},group):
    vNode("ellipse",{cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2,fill:"#b6d5bd",stroke:"#dceecb","stroke-width":3},group);
  const vacuole=plant?vNode("rect",{x:x+w*.35,y:y+h*.2,width:w*.48,height:h*.62,rx:16,fill:"#72b5c3"},group):null;
  const nucleus=vDot(x+w*.24,y+h*.52,18,"#86659b",group);
  const chloros=[];
  if(plant&&chloroplasts)for(let i=0;i<5;i++)chloros.push(vNode("ellipse",{cx:x+23+(i%2)*(w-46),cy:y+30+Math.floor(i/2)*45,rx:10,ry:6,fill:"#285e3b"},group));
  return {group,wall,membrane,vacuole,nucleus,chloros};
}
function buildVisual(scene) {
  const art=$("mission-art");art.replaceChildren();
  const m=MISSIONS[activeUnit], choice=$("scene-choice").value;
  if(scene==="molecules"){
    const dots=[vDot(140,110,23),vDot(240,110,23),vDot(390,110,28,"#f2b68a")];
    const labels=dots.map((_,i)=>vText([140,240,390][i],117,["H","H","O"][i],21,"#163c39"));
    const status=vText(300,235,"Separate model atoms",23);
    return p=>{
      const phase=Math.min(2,Math.floor(p/34));
      const positions=phase===0?[[140,110],[240,110],[390,110]]:phase===1?[[160,110],[202,110],[420,110]]:[[262,107],[338,107],[300,145]];
      dots.forEach((n,i)=>{n.setAttribute("cx",positions[i][0]);n.setAttribute("cy",positions[i][1]);labels[i].setAttribute("x",positions[i][0]);labels[i].setAttribute("y",positions[i][1]+7);});
      status.textContent=["Separate model atoms","Hydrogen molecule + separate oxygen atom","Water molecule: two element types"][phase];
    };
  }
  if(scene==="symbols"){
    vBox(215,45,170,135);const symbol=vText(300,135,"O",64,"#d8ef88"),name=vText(300,225,"Oxygen",26);
    const items=[["O","Oxygen"],["C","Carbon"],["H","Hydrogen"],["N","Nitrogen"],["Fe","Iron"],["Al","Aluminium"],["Cu","Copper"],["Ag","Silver"],["Au","Gold"],["Cl","Chlorine"],["Na","Sodium"],["Hg","Mercury"],["Pb","Lead"]];
    return p=>{const item=items[Math.min(items.length-1,Math.floor(p/100*items.length))];symbol.textContent=item[0];name.textContent=item[1];};
  }
  if(scene==="reaction"){
    const start=[[100,95],[134,95],[100,165],[134,165],[385,110],[385,154]];
    const end=[[185,100],[255,100],[385,100],[455,100],[220,142],[420,142]];
    const bonds=Array.from({length:4},()=>vNode("path",{stroke:"#9dbca6","stroke-width":4,fill:"none"}));
    const dots=start.map(([x,y],i)=>vDot(x,y,i<4?17:23,i<4?"#d8ef88":"#f2b68a"));
    const labels=start.map(([x,y],i)=>vText(x,y+6,i<4?"H":"O",16,"#163c39"));
    const status=vText(300,232,"Two hydrogen molecules + one oxygen molecule",18);
    vText(300,270,"4 hydrogen atoms + 2 oxygen atoms throughout",17,"#d8ef88");
    return p=>{
      const t=Math.max(0,Math.min(1,(p-20)/60));
      const pairs=p<34?[[0,1],[2,3],[4,5]]:p>=68?[[0,4],[1,4],[2,5],[3,5]]:[];
      bonds.forEach((n,i)=>{const pair=pairs[i];n.setAttribute("visibility",pair?"visible":"hidden");if(pair){const [a,b]=pair;n.setAttribute("d",`M${start[a][0]+(end[a][0]-start[a][0])*t} ${start[a][1]+(end[a][1]-start[a][1])*t}L${start[b][0]+(end[b][0]-start[b][0])*t} ${start[b][1]+(end[b][1]-start[b][1])*t}`);}});
      dots.forEach((n,i)=>{const x=start[i][0]+(end[i][0]-start[i][0])*t,y=start[i][1]+(end[i][1]-start[i][1])*t;n.setAttribute("cx",x);n.setAttribute("cy",y);labels[i].setAttribute("x",x);labels[i].setAttribute("y",y+6);});
      status.textContent=p<34?"Two hydrogen molecules + one oxygen molecule":p<68?"The same atoms rearrange":"Two water molecules";
    };
  }
  if(scene==="compound"){
    const group=vNode("g"),status=vText(300,250,"",22);let last=-1;
    return p=>{
      const phase=Math.min(2,Math.floor(p/34));if(phase===last)return;last=phase;group.replaceChildren();
      const coords=phase===0?[[260,105,"H"],[340,105,"H"],[300,150,"O"]]:phase===1?[[215,125,"O"],[300,125,"C"],[385,125,"O"]]:
        Array.from({length:12},(_,i)=>[190+(i%4)*70,65+Math.floor(i/4)*55,(i+Math.floor(i/4))%2?"Cl":"Na"]);
      coords.forEach(([x,y,label])=>{vDot(x,y,phase===2?21:28,label==="H"?"#d8ef88":"#f2b68a",group);vText(x,y+6,label,18,"#163c39",group);});
      status.textContent=["Water: 2 element types, 3 atoms","Carbon dioxide: 2 types, 3 atoms","Salt: part of an extended ionic structure"][phase];
    };
  }
  if(["materials","hazards","fuels","care","health-choices"].includes(scene)){
    const group=vNode("g");vBox(90,45,420,155,"#498d91",group);
    const title=vText(300,107,"",27,"#d8ef88",group),detail=vText(300,150,"",19,"#eaf3df",group);
    const footer=vText(300,250,"",18);
    const sets={
      materials:[["Copper","Conducts electricity","Wiring example, not a practical task"],["Aluminium","Relatively light","Frames and containers"],["Gold","Durable decorative material","A real object may be an alloy"]],
      hazards:[["Damaged wiring","Stay away; tell an adult","Do not touch or repair"],["Fuel near a heat source","Recognise risk from a safe place","Do not investigate or test"],["A safe report","Follow the emergency plan","No fire is needed for this lesson"]],
      fuels:[["Paper and wood","Ordinary solid combustibles","Fuel names, not universal class letters"],["Petrol","Flammable liquid","Do not handle fuels"],["Fuel gas","Flammable gas","Do not adjust a leaking supply"],["Combustible metals","Specialist hazards","Do not test samples"],["Cooking oils and fats","Require suitable trained response","Never put water on a cooking-oil fire"]],
      care:[["A concern deserves support","Do not dismiss disruptive pain","Severe symptoms need prompt medical help"],["A practical school plan","Products, private facilities, trusted help","No medicine is prescribed here"],["Protect dignity","No public symptom or date lists","No personal health data is requested"]],
      "health-choices":[["Appearance is not a test","Infections can have no symptoms","No diagnosis from a diagram"],["Prevention matters","Risks can be reduced, not universally erased","Ask qualified health services"],["Care without stigma","Protect privacy and access to help","Do not blame, exclude or share rumours"]]
    };
    const items=sets[scene];
    return p=>{const row=items[Math.min(items.length-1,Math.floor(p/100*items.length))];title.textContent=row[0];detail.textContent=row[1];footer.textContent=row[2];};
  }
  if(scene==="triangle"||scene==="control"){
    vNode("path",{d:"M300 40L100 215H500Z",fill:"none",stroke:"#8daf96","stroke-width":5});
    const points=[[300,40],[100,215],[500,215]],names=["Heat","Fuel","Oxygen"];
    const dots=points.map(([x,y])=>vDot(x,y,28,"#d8ef88"));
    names.forEach((n,i)=>vText(points[i][0],points[i][1]+6,n,17,"#163c39"));
    const status=vText(300,270,"All three present",19);
    return p=>{
      const removed=scene==="triangle"?$("scene-choice").value:["heat","fuel","oxygen"][Math.min(2,Math.floor(p/34))];
      dots.forEach((n,i)=>n.setAttribute("fill",names[i].toLowerCase()===removed?"#c9b0a4":"#d8ef88"));
      status.textContent=removed==="all"?"Simple model supports combustion":"Virtual removal: "+removed+" / combustion not sustained";
      return scene==="triangle"?(removed==="all"?"The virtual model has heat, fuel and oxygen.":"The necessary "+removed+" component is removed in the model. This is not a real-world procedure."):undefined;
    };
  }
  if(scene==="evacuate"){
    vBox(35,65,530,145,"#355e4e");
    vNode("path",{d:"M65 170H255V110H495",fill:"none",stroke:"#d8ef88","stroke-width":5});
    vText(105,100,"Alarm",23);vText(470,250,"Assembly",22);
    const marker=vDot(65,170,12,"#f2b68a");vArrow(500,110,540,110);
    return p=>{let x,y;if(p<45){x=65+p/45*190;y=170;}else if(p<60){x=255;y=170-(p-45)/15*60;}else{x=255+(p-60)/40*240;y=110;}marker.setAttribute("cx",x);marker.setAttribute("cy",y);};
  }
  if(scene==="cell-compare"){
    const plant=vCell(50,50,220,170,true,choice!=="onion"),animal=vCell(345,65,190,145,false);
    vText(160,255,choice==="onion"?"Onion-bulb model":"Plant model",21);vText(440,255,"Animal model",21);
    return p=>{
      const phase=Math.min(2,Math.floor(p/34));
      for(const cell of [plant,animal])for(const part of [cell.membrane,cell.nucleus]){
        part.setAttribute("stroke",(phase===0&&part===cell.membrane)||(phase===1&&part===cell.nucleus)?"#f5b77e":"#dceecb");
        part.setAttribute("stroke-width",phase===0&&part===cell.membrane?4:2);
      }
      return phase===0?"Both typical models have a membrane. The plant membrane is inside its wall.":phase===1?"Both typical models have cytoplasm and a nucleus. Highlights are teaching cues, not growth.":choice==="onion"?"This onion-bulb model has a wall but no chloroplasts. It is still a plant cell.":"The plant model has a wall and chloroplasts; the animal model does not. Not all plant cells have chloroplasts.";
    };
  }
  if(scene==="cell-parts"){
    const cell=vCell(160,35,280,185,true),label=vText(300,265,"",20);
    const jobs={membrane:"Membrane: regulates entry and exit",nucleus:"Nucleus: genetic material and activity control",cytoplasm:"Cytoplasm: many cell reactions",wall:"Wall: support outside the membrane",vacuole:"Vacuole: cell sap and support",chloroplast:"Chloroplasts: photosynthesis"};
    return p=>{
      const selected=$("scene-choice").value;
      for(const node of [cell.wall,cell.membrane,cell.vacuole,cell.nucleus,...cell.chloros]){node.setAttribute("stroke-width","2");node.setAttribute("stroke","none");}
      const nodes=selected==="wall"?[cell.wall]:selected==="membrane"||selected==="cytoplasm"?[cell.membrane]:selected==="nucleus"?[cell.nucleus]:selected==="vacuole"?[cell.vacuole]:cell.chloros;
      nodes.forEach(n=>{n.setAttribute("stroke","#f5b77e");n.setAttribute("stroke-width",3+Math.sin(p/12));});
      label.textContent=jobs[selected];return jobs[selected]+". The highlight is a schematic cue, not a real microscope measurement.";
    };
  }
  if(scene==="microscope"){
    const field=vNode("g"),clipId="virtual-field-"+TOPIC.kind;
    const defs=vNode("defs");const clip=vNode("clipPath",{id:clipId},defs);vDot(300,130,98,"white",clip);
    vDot(300,130,100,"#d9e6d0");art.append(field);field.setAttribute("clip-path",`url(#${clipId})`);
    const grid=vNode("g",{},field);
    for(let i=0;i<16;i++)vNode("rect",{x:180+(i%4)*65,y:10+Math.floor(i/4)*65,width:60,height:60,rx:5,fill:"#79a56f",stroke:"#e5efda","stroke-width":2},grid);
    const label=vText(300,267,"",23);
    return ()=>{
      const objective=Number($("scene-choice").value),scale=objective/10;
      grid.setAttribute("transform",`translate(300 130) scale(${scale}) translate(-300 -130)`);
      label.textContent="10-times eyepiece x "+objective+" = "+objective*10+" times";
      return "Total magnification is "+objective*10+" times. The drawing is illustrative; magnification is not the same as resolution.";
    };
  }
  if(scene==="focus"){
    const grid=vNode("g");
    for(let i=0;i<8;i++){const c=vCell(70+(i%4)*120,45+Math.floor(i/4)*90,105,75,true,false);grid.append(c.group);}
    vText(300,265,"Generated specimen illustration",19);
    return p=>{grid.style.filter=`blur(${(100-p)/25}px)`;};
  }
  if(scene==="diffusion"){
    vBox(35,35,530,195,"#2f594b");
    const dots=Array.from({length:24},(_,i)=>vDot(80+(i%4)*25,65+Math.floor(i/4)*25,7));
    vText(300,265,"Particle size stays the same",19);
    return p=>{dots.forEach((n,i)=>{const t=p/100,x0=80+(i%4)*25,y0=65+Math.floor(i/4)*25;n.setAttribute("cx",x0+(65+(i%8)*65-x0)*t+Math.sin(p/8+i)*3);n.setAttribute("cy",y0+(65+Math.floor(i/8)*65-y0)*t+Math.cos(p/7+i)*3);});};
  }
  if(scene==="membrane"||scene==="osmosis"){
    vBox(35,35,530,195,"#2f594b");vNode("path",{d:"M300 35V230",stroke:"#d7e5cd","stroke-width":5,"stroke-dasharray":"10 8"});
    const waters=Array.from({length:24},(_,i)=>vDot(70+(i%12)*18,75+Math.floor(i/12)*100,6,"#91d5e0"));
    const solutes=Array.from({length:scene==="osmosis"?10:6},(_,i)=>vDot(scene==="osmosis"&&i<2?110+i*70:350+(i%4)*48,115+Math.floor(i/4)*35,11,"#f2b68a"));
    const label=vText(300,264,"",19);
    return p=>{
      const transfer=scene==="osmosis"?Math.floor(p/100*6):0,leftCount=12-transfer;
      waters.forEach((n,i)=>{
        const right=i>=leftCount,local=right?i-leftCount:i;
        const x=right?335+(local%6)*36:65+(local%6)*36,y=65+Math.floor(local/6)*48;
        n.setAttribute("cx",x+Math.sin(p/9+i)*3);n.setAttribute("cy",y+Math.cos(p/11+i)*3);
      });
      label.textContent=scene==="osmosis"?`Water markers: left ${leftCount}, right ${24-leftCount}; total 24`:"Blue water can cross / amber solute is blocked";
      if(scene==="membrane"){
        const first=waters[0];first.setAttribute("cx",230+p/100*140);first.setAttribute("cy",90);
      }
    };
  }
  if(scene==="water-cell"){
    const cell=vCell(170,35,260,185,true,false),caption=vText(300,265,"",20);
    return p=>{
      const selected=$("scene-choice").value,f=selected==="dilute"?1+p/250:selected==="concentrated"?1-p/230:1;
      const s=selected==="concentrated"?f:1,w=110*f,h=110*f;
      cell.membrane.setAttribute("x",300-244*s/2);cell.membrane.setAttribute("y",127.5-169*s/2);
      cell.membrane.setAttribute("width",244*s);cell.membrane.setAttribute("height",169*s);
      cell.nucleus.setAttribute("cx",300-68*s);
      cell.vacuole.setAttribute("x",300+29*s-w/2);cell.vacuole.setAttribute("y",128-h/2);cell.vacuole.setAttribute("width",w);cell.vacuole.setAttribute("height",h);
      caption.textContent=selected==="dilute"?"Net water entry: contents expand":selected==="concentrated"?"Net water loss: contents shrink":"No net transfer in the balanced model";
      return caption.textContent+". The wall remains a separate supporting structure; changes are exaggerated.";
    };
  }
  if(scene==="gas-exchange"){
    vBox(35,60,220,140,"#72aeb6");vBox(345,60,220,140,"#a65f68");
    vText(145,95,"Lung air",24);vText(455,95,"Blood",24);
    vArrow(220,125,380,125);vArrow(380,165,220,165,"#f2b68a");
    const oxygen=vDot(220,125,8),carbon=vDot(380,165,8,"#f2b68a");
    vText(300,240,"Oxygen towards blood / carbon dioxide towards air",17);
    return p=>{oxygen.setAttribute("cx",220+p/100*160);carbon.setAttribute("cx",380-p/100*160);};
  }
  if(scene==="cycle"){
    vDot(195,135,90,"#355e4e");vNode("circle",{cx:195,cy:135,r:80,fill:"none",stroke:"#a5c4aa","stroke-width":12});
    const marker=vDot(195,55,10,"#f2b68a"),day=vText(195,143,"Day 1",27);
    const event=vText(430,115,"",19),note=vText(430,153,"Example only",18,"#d8ef88");
    vText(300,268,"Not a personal prediction or safe-days calculator",17);
    return p=>{
      const d=Math.min(28,1+Math.floor(p/100*28)),a=(d-1)/28*Math.PI*2-Math.PI/2;
      marker.setAttribute("cx",195+80*Math.cos(a));marker.setAttribute("cy",135+80*Math.sin(a));day.textContent="Day "+d;
      event.textContent=d<=5?"Menstruation":d<14?"Lining rebuilds":d===14?"Example ovulation":"Lining maintained";
      note.textContent="Timing varies in real people";
      return "Example day "+d+": "+event.textContent.toLowerCase()+". Real cycles vary; this is not a personal prediction.";
    };
  }
  if(scene==="fertilisation"){
    vText(300,40,"Usual site: oviduct / fallopian tube",21);
    const egg=vDot(355,125,36,"#f2b68a"),sperm=vDot(105,125,11,"#d8ef88");
    const tail=vNode("path",{d:"M94 125L65 115L40 125",stroke:"#d8ef88","stroke-width":3,fill:"none"});
    const label=vText(300,245,"Egg and sperm are reproductive cells",21);
    return p=>{
      const x=105+Math.min(p/75,1)*250;sperm.setAttribute("cx",x);tail.setAttribute("transform",`translate(${x-105} 0)`);
      const fused=p>=75;sperm.setAttribute("opacity",fused?0:1);tail.setAttribute("opacity",fused?0:1);egg.setAttribute("fill",fused?"#d8ef88":"#f2b68a");
      label.textContent=fused?"Fusion: fertilised egg / zygote":"Schematic approach, not a measured journey";
    };
  }
  if(scene==="implantation"){
    vNode("path",{d:"M255 55Q220 105 245 170Q260 205 300 225Q340 205 355 170Q380 105 345 55Z",fill:"#a65f68",stroke:"#edbdad","stroke-width":12});
    vText(460,145,"Uterine lining",21);
    const marker=vDot(95,65,12,"#d8ef88");vText(300,275,"Possible attachment, not guaranteed implantation",17);
    return p=>{const t=p/100;marker.setAttribute("cx",95+Math.min(t/.7,1)*232);marker.setAttribute("cy",65+Math.min(t/.7,1)*100);return p<70?"The early embryo marker approaches the model uterus.":"The marker illustrates possible attachment in the lining, not proof of pregnancy.";};
  }
  throw new Error("Unknown visual scene: "+scene);
}
function renderVisualFrame() {
  const m=MISSIONS[activeUnit];
  if(!visualView)visualView=buildVisual(m.scene);
  const override=visualView(missionPosition),phase=Math.min(2,Math.floor(missionPosition/34));
  const caption=override||m.captions[phase];
  if($("mission-caption").textContent!==caption)$("mission-caption").textContent=caption;
  $("mission-svg-description").textContent=caption;
  $("mission-timeline").value=Math.round(missionPosition);
  $("mission-timeline").setAttribute("aria-valuetext",Math.round(missionPosition)+" percent through the conceptual story. "+caption);
}




const $ = id => document.getElementById(id);
const KEY = TOPIC.storageKey || "science-explorer-physical-chemical-v1";
let progress = {lessons: [], answers: {}}, activeUnit = 0, index = 0, filter = "all";
function storageMessage(message) {$("storage-status").textContent = message;}
try {
  const raw = localStorage.getItem(KEY);
  if (raw !== null) {
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.lessons) || !saved.answers || typeof saved.answers !== "object" || Array.isArray(saved.answers)) throw new Error("Invalid saved progress format.");
    if (saved.lessons.some(x => !Number.isInteger(x) || x < 0 || x >= DATA.units.length)) throw new Error("Invalid saved lesson.");
    for (const [id, value] of Object.entries(saved.answers)) {
      if (!DATA.questions.some(q => String(q.id) === id) || !["correct", "review"].includes(value)) throw new Error("Invalid saved answer.");
    }
    progress = saved;
  }
} catch (error) {
  storageMessage("Saved progress could not be loaded. This session starts fresh; use Export to keep a copy. " + error.message);
}
function save() {
  try {localStorage.setItem(KEY, JSON.stringify(progress));}
  catch (error) {storageMessage("Browser storage is unavailable. Progress lasts only for this open page; use Export before closing. " + error.message);}
  updateProgress();
}
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function updateProgress() {
  $("completed-count").textContent = new Set(progress.lessons).size + " / 5";
  const values = Object.values(progress.answers), total = values.length;
  const correct = values.filter(x => x === "correct").length;
  $("practice-summary").textContent = total + " / 100 reviewed";
  $("score-summary").textContent = correct + " correct / self-confirmed; " + (total-correct) + " to revisit. Not a verified grade.";
  $("quiz-bar").style.width = total + "%";
  $("quiz-progress").setAttribute("aria-valuenow", total);
}
const MISSIONS = TOPIC.missions || [
  {title:"Meet the shape-shifters", takeaway:"Same-sized particles. Different spacing and movement.",
   captions:["Solid: close together, vibrating in fixed positions.","Liquid: close together, sliding past one another.","Gas: far apart, moving around the whole container."],
   caveat:"A simplified model, not to scale. The slider changes the model's state; it is not an actual temperature measurement.",
   question:"Why is a gas easier to squeeze?", options:["There are bigger gaps between particles","Its particles are softer"], answer:0,
   explanation:"Exactly: compression reduces gaps. It does not squash the particles themselves."},
  {title:"Find the flat bits", takeaway:"During a pure substance's state change, energy can enter without temperature rising.",
   captions:["Energy warms the solid: temperature rises.","Melting: energy enters, but temperature stays steady.","Energy warms the liquid: temperature rises.","Boiling: temperature stays steady while liquid becomes gas.","Energy warms the gas: temperature rises again."],
   caveat:"Ideal pure-water model at standard atmospheric pressure. Axes and plateau lengths are schematic, not measured data.",
   question:"At a flat section, has energy stopped entering?", options:["Yes, no energy enters","No, energy is changing the state"], answer:1,
   explanation:"Energy still enters. It changes the particles' arrangement and separation rather than raising average kinetic energy."},
  {title:"A pinch of salt. A different boiling point.", takeaway:"Dissolved non-volatile salt raises water's boiling point at the same pressure.",
   captions:["Both samples warm. The right-hand sample contains dissolved salt.","Pure water reaches its boiling point. The salt solution is not boiling yet.","The salt solution reaches a higher boiling temperature."],
   caveat:"Same standard atmospheric pressure. The temperature gap is exaggerated. This is a conceptual comparison, not a cooking timer, concentration calculator or measured heating-rate experiment.",
   question:"With dissolved salt added, which has the higher boiling point?", options:["Pure water","The salt solution"], answer:1,
   explanation:"The salt solution. This applies to dissolved non-volatile solutes at the same external pressure."},
  {title:"New shape, or new substance?", takeaway:"Ask 'Did a new substance form?' Reversibility alone is not the test.",
   captions:["Start with a sheet of paper and a piece of iron.","Paper is cut: new shape, same material. A physical change.","Iron rusts in the presence of oxygen and water: new substances form. A chemical change."],
   caveat:"Changes are time-compressed illustrations, not experiments to perform. Rusting normally takes much longer than the animation.",
   question:"Cut paper is hard to put back. Does that make cutting chemical?", options:["Yes, because it is hard to reverse","No, the paper remains the same substance"], answer:1,
   explanation:"Correct: no new substance is created just by cutting. Difficulty reversing a change is not its definition."},
  {title:"Where did the puddle go?", takeaway:"Evaporation changes liquid water into water vapour, not into a new substance.",
   captions:["A wet cloth holds liquid water.","Water particles escape from the surface into the air.","Less liquid remains: the cloth is drying."],
   caveat:"A time-compressed model. Real drying depends on temperature, humidity, airflow and exposed surface area.",
   question:"Has the water disappeared from existence?", options:["Yes, it is destroyed","No, it has entered the air as vapour"], answer:1,
   explanation:"The water remains water. Its state and distribution have changed."}
];
let missionPosition=0, missionFrame=null, missionLastTime=null,missionLastDraw=null;
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)");
function stopMission() {
  if(missionFrame!==null) cancelAnimationFrame(missionFrame);
  missionFrame=null;missionLastTime=null;missionLastDraw=null;
  $("mission-play").textContent=missionPosition>=100?"Replay animation":"Play animation";
  $("mission-play").setAttribute("aria-pressed","false");
}
function svgText(x,y,text,size=18,fill="#eaf3df") {
  const node=document.createElementNS("http://www.w3.org/2000/svg","text");
  node.setAttribute("x",x);node.setAttribute("y",y);node.setAttribute("text-anchor","middle");
  node.setAttribute("fill",fill);node.setAttribute("font-size",size);node.textContent=text;return node;
}
function svgCircle(x,y,r,fill) {
  const node=document.createElementNS("http://www.w3.org/2000/svg","circle");
  for(const [key,value] of Object.entries({cx:x,cy:y,r,fill}))node.setAttribute(key,value);
  return node;
}
function renderEnergyFrame() {
  const m=MISSIONS[activeUnit],p=missionPosition,art=$("mission-art");
  let phase=Math.min(2,Math.floor(p/34)),caption=m.captions[phase];
  art.replaceChildren();
  if(activeUnit===0){
    if(phase===0){
      art.append(svgCircle(145,110,45,"#d8ef88"));
      art.innerHTML+='<path d="M215 110H285" stroke="#d8ef88" stroke-width="4"/><rect x="320" y="65" width="160" height="100" rx="8" fill="#498d91"/><path d="M360 65V165M400 65V165M440 65V165M320 115H480" stroke="#bce0ce" stroke-width="2"/>';
      art.append(svgText(300,220,"Sunlight: renewable source",24),svgText(300,255,"Light energy can supply a solar panel",18));
    }else if(phase===1){
      const angle=p*5;
      art.innerHTML=`<path d="M300 95V225" stroke="#d3e2d4" stroke-width="8"/><g transform="rotate(${angle} 300 95)"><path d="M300 95L305 25L318 95ZM300 95L235 130L292 110ZM300 95L365 130L312 87Z" fill="#d8ef88"/></g>`;
      art.append(svgCircle(300,95,10,"#f2b68a"),svgText(300,260,"Wind: renewable source",24));
    }else{
      art.innerHTML='<path d="M205 160L230 90L290 65L340 100L380 165Z" fill="#899b93" stroke="#c3d4c6" stroke-width="3"/>';
      art.append(svgText(300,220,"Coal: non-renewable source",24),svgText(300,255,"Forms far more slowly than we use it",18));
    }
  }else if(activeUnit===1){
    if($("energy-example").value==="fall"){
      const fraction=(p/100)**2,y=55+fraction*175;
      art.innerHTML='<path d="M60 245H275" stroke="#b5cbb7" stroke-width="4"/><path d="M165 32V235" stroke="#5d8474" stroke-dasharray="5 6"/>';
      art.append(svgCircle(165,y,13,"#f2b68a"));
      const bars=[{x:340,f:1-fraction,c:"#d8ef88",label:"Potential"},{x:450,f:fraction,c:"#f2b68a",label:"Kinetic"}];
      for(const b of bars){
        const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
        for(const [k,v] of Object.entries({x:b.x,y:220-150*b.f,width:65,height:150*b.f,fill:b.c,rx:5}))rect.setAttribute(k,v);
        art.append(rect,svgText(b.x+32,250,b.label,18),svgText(b.x+32,40,Math.round(b.f*100)+"%",20,b.c));
      }
      caption=p<5?"At release: energy is stored gravitationally. The ball starts from rest.":p<99?"As the ball falls, gravitational potential energy decreases and kinetic energy increases.":"Just before impact: the model's mechanical energy is kinetic. Impact is not shown.";
      art.append(svgText(165,278,"No air resistance",17));
    }else{
      art.innerHTML='<rect x="35" y="65" width="145" height="100" rx="12" fill="#498d91"/><rect x="220" y="65" width="145" height="100" rx="12" fill="#498d91"/><circle cx="480" cy="112" r="44" fill="#d8ef88"/><path d="M185 115H215M370 115H430" stroke="#f2b68a" stroke-width="4"/>';
      art.append(svgText(108,105,"Battery",22),svgText(108,137,"chemical",17),svgText(292,106,"Circuit",22),svgText(292,137,"electrical",17),svgText(480,118,"Light",22,"#163c39"),svgText(300,225,"Some energy also warms the surroundings",19));
      art.append(svgCircle(188+(p*2.35)%235,115,5,"#f2b68a"));
      caption="Torch: chemical energy in the battery supplies an electrical transfer. The lamp gives light and warms its surroundings.";
    }
  }else if(activeUnit===2){
    const force=Number($("contact-force").value),area=Number($("contact-area").value);
    const pressure=force/area*10,width=60+area*2;
    art.innerHTML=`<rect x="60" y="215" width="480" height="25" rx="5" fill="#74957a"/><rect x="${300-width/2}" y="135" width="${width}" height="80" rx="8" fill="#498d91"/><path d="M300 55V115M285 100L300 115L315 100" fill="none" stroke="#f2b68a" stroke-width="6"/>`;
    const measured=$("show-measurements").checked,level=value=>["Small","Medium-small","Medium","Medium-large","Large"][value/20-1];
    art.append(svgCircle(300,62+(p*.5)%50,5,"#d8ef88"),svgText(300,35,measured?force+" N downward":"Downward push",22),svgText(300,183,measured?area+" square cm":"Contact surface",20),svgText(300,272,measured?"Pressure: "+Number(pressure.toFixed(1))+" kPa":"Same push + wider area = less pressure",measured?24:20,"#d8ef88"));
    $("force-value").textContent=measured?force+" N":level(force);$("area-value").textContent=measured?area+" square cm":level(area);
    for(const [id,value] of [["contact-force",force],["contact-area",area]])$(id).setAttribute("aria-valuetext",measured?(id==="contact-force"?value+" newtons":value+" square centimetres"):level(value));
    caption=(measured?"Pressure is "+Number(pressure.toFixed(1))+" kPa. ":"")+"Increase the push to raise pressure; increase contact area to lower pressure, keeping the other variable fixed.";
  }else if(activeUnit===3){
    const depth=p,y=60+depth*1.6,length=15+depth*.7;
    art.innerHTML='<path d="M90 35V235Q90 245 100 245H370Q380 245 380 235V35" stroke="#b7d5c1" fill="none" stroke-width="4"/><path d="M93 60H377V235Q377 242 368 242H102Q93 242 93 235Z" fill="#498d91"/><path d="M93 60H377" stroke="#c0e0d1" stroke-dasharray="5 5"/>';
    art.innerHTML+=`<path d="M${110+length} ${y}H110M${360-length} ${y}H360" stroke="#d8ef88" stroke-width="5"/><rect x="460" y="${230-depth*1.6}" width="45" height="${depth*1.6}" fill="#f2b68a" rx="4"/>`;
    art.append(svgCircle(110,y,8,"#f2b68a"),svgCircle(360,y,8,"#f2b68a"),svgText(235,275,"Same depth = same liquid pressure",20),svgText(485,35,"Relative",17),svgText(485,57,"pressure",17),svgText(235,25,"Water surface",18));
    $("probe-depth").value=Math.round(depth);$("probe-depth").setAttribute("aria-valuetext",Math.round(depth)+" percent of the model depth");
    caption=depth<25?"Near the surface: the pressure due to the water is small.":depth<70?"Deeper in the same still liquid: pressure due to the liquid is greater.":"Deeper still: pressure is greater. Both probes at the same depth show equal pressure.";
  }else{
    art.innerHTML='<rect x="35" y="80" width="135" height="90" rx="10" fill="#498d91"/><rect x="232" y="80" width="135" height="90" rx="10" fill="#498d91"/><path d="M175 125H225M375 125H425" stroke="#d8ef88" stroke-width="5"/><circle cx="485" cy="125" r="45" fill="none" stroke="#a9c5ad" stroke-width="9"/>';
    art.append(svgText(102,118,"Pedal",22),svgText(102,145,"push",18),svgText(300,118,"Brake fluid",20),svgText(300,145,"pressure",18));
    const angle=p*3*Math.PI/180;
    const spoke=document.createElementNS("http://www.w3.org/2000/svg","path");
    spoke.setAttribute("d",`M${485-Math.cos(angle)*38} ${125-Math.sin(angle)*38}L${485+Math.cos(angle)*38} ${125+Math.sin(angle)*38}`);
    spoke.setAttribute("stroke","#d8ef88");spoke.setAttribute("stroke-width","4");art.append(spoke);
    art.append(svgText(485,205,"Brake pads",19),svgText(300,262,phase<2?"Pressure is transmitted through liquid":"Friction transfers energy to thermal stores",20,phase<2?"#eaf3df":"#f2b68a"));
    art.append(svgCircle(175+(p*2.5)%250,125,5,"#f2b68a"));
  }
  $("mission-caption").textContent=caption;$("mission-svg-description").textContent=caption;
  $("mission-timeline").value=Math.round(p);
  $("mission-timeline").setAttribute("aria-valuetext",Math.round(p)+" percent through the conceptual story. "+caption);
}
function renderMissionFrame() {
  if(TOPIC.visualLibrary){renderVisualFrame();return;}
  if(TOPIC.kind==="force-energy"){renderEnergyFrame();return;}
  const m=MISSIONS[activeUnit], p=missionPosition, art=$("mission-art");
  let phase=activeUnit===1?Math.min(4,Math.floor(p/20)):Math.min(2,Math.floor(p/34));
  if(activeUnit===2)phase=p<50?0:p<85?1:2;
  art.replaceChildren();
  if(activeUnit===0){
    art.innerHTML='<rect x="90" y="35" width="420" height="210" rx="20" fill="none" stroke="#90b49c" stroke-width="2"/>';
    for(let i=0;i<24;i++){
      let x,y;
      if(phase===0){x=210+(i%6)*35+Math.sin(p+i)*1.5;y=105+Math.floor(i/6)*32;}
      else if(phase===1){x=130+(i%8)*45+Math.sin(p/4+i)*8;y=160+Math.floor(i/8)*29;}
      else{x=120+(i%6)*66+Math.sin(p/5+i)*12;y=70+Math.floor(i/6)*46+Math.cos(p/5+i)*10;}
      art.append(svgCircle(x,y,10,"#d8ef88"));
    }
    art.append(svgText(300,276,["SOLID","LIQUID","GAS"][phase],22));
  } else if(activeUnit===1){
    art.innerHTML='<path d="M75 25V245H560" fill="none" stroke="#91b299" stroke-width="2"/><path d="M85 225L155 190H240L355 85H460L535 40" fill="none" stroke="#d8ef88" stroke-width="4"/>';
    const points=[[85,225],[155,190],[240,190],[355,85],[460,85],[535,40]];
    const f=Math.min(p/20,4.99999), segment=Math.floor(f), t=f-segment;
    art.append(svgCircle(points[segment][0]+(points[segment+1][0]-points[segment][0])*t,points[segment][1]+(points[segment+1][1]-points[segment][1])*t,9,"#f2b68a"));
    art.append(svgText(38,195,"0 C",16),svgText(35,90,"100 C",16),svgText(300,278,"Energy supplied",19),svgText(195,218,"Melting",16),svgText(408,114,"Boiling",16),svgText(150,24,"Temperature",17));
  } else if(activeUnit===2){
    const salted=$("add-salt").checked, rightThreshold=salted?85:50;
    art.innerHTML='<path d="M70 45V222Q70 234 82 234H228Q240 234 240 222V45M360 45V222Q360 234 372 234H518Q530 234 530 222V45" fill="none" stroke="#b7d5c1" stroke-width="4"/><path d="M73 135H237V222Q237 231 225 231H85Q73 231 73 222ZM363 135H527V222Q527 231 515 231H375Q363 231 363 222Z" fill="#498d91" opacity=".8"/>';
    for(let side=0;side<2;side++){
      const threshold=side===0?50:rightThreshold, boiling=p>=threshold;
      const center=side===0?155:445, height=20+Math.min(p/threshold,1)*90;
      const bar=document.createElementNS("http://www.w3.org/2000/svg","rect");
      for(const [key,value] of Object.entries({x:center+65,y:225-height,width:9,height,rx:4,fill:boiling?"#f2b68a":"#d8ef88"}))bar.setAttribute(key,value);
      art.append(bar);
      if(boiling) for(let j=0;j<7;j++){
        const rise=((p-threshold)*4+j*13)%82;
        art.append(svgCircle(center-55+j*16,220-rise,3+j%3,"#d2f3ed"));
      }
      art.append(svgText(center,30,side===0?"Pure water":salted?"Salt solution":"Pure water",20));
      art.append(svgText(center,265,boiling?(side===1&&salted?"Boiling: above 100 C":"Boiling: about 100 C"):"Warming",18));
    }
    if(salted)for(let j=0;j<10;j++)art.append(svgText(385+(j%5)*27,165+Math.floor(j/5)*36,"+",19,"#f2d995"));
    if(!salted)phase=p<50?0:2;
  } else if(activeUnit===3){
    const cut=phase>=1,rusted=phase>=2;
    art.innerHTML=`<path d="${cut?'M85 60H205V112H85ZM85 130H205V190H85Z':'M85 60H205V190H85Z'}" fill="#f3f0d7" stroke="#d7d4be" stroke-width="3"/><rect x="365" y="85" width="160" height="65" rx="12" fill="${rusted?'#b66f3c':'#a9b5b7'}"/>`;
    if(rusted)for(let j=0;j<14;j++)art.append(svgCircle(380+(j%7)*21,100+Math.floor(j/7)*30,5,"#d39555"));
    art.append(svgText(145,232,cut?"Cut paper":"Paper",22),svgText(445,232,rusted?"Rust forming":"Iron",22));
    art.append(svgText(145,267,cut?"Same substance":"Before",17,"#d8ef88"),svgText(445,267,rusted?"New substances":"Before",17,rusted?"#f2b68a":"#d8ef88"));
  } else {
    art.innerHTML='<path d="M70 80H530" stroke="#a9c5ad" stroke-width="4"/><path d="M170 82L140 115V230H460V115L430 82L380 108H220Z" fill="#69aeb5"/>';
    art.append(svgCircle(510,40,22,"#f2d995"));
    const count=Math.max(0,18-Math.floor(p/6));
    for(let i=0;i<count;i++)art.append(svgCircle(180+(i%6)*45,140+Math.floor(i/6)*31,6,"#d5f3ed"));
    for(let i=0;i<8;i++){
      const rise=(p*2+i*19)%120;
      if(p>8)art.append(svgCircle(185+i*31,155-rise,3,"#e5f4e4"));
    }
    art.append(svgText(300,270,phase===0?"Wet cloth":phase===1?"Evaporation":"Drier cloth",22));
  }
  let caption=m.captions[phase];
  if(activeUnit===2&&!$("add-salt").checked)caption=p<50?"No salt: both samples are pure water.":"No salt: both have the same boiling point at the same pressure.";
  if($("mission-caption").textContent!==caption)$("mission-caption").textContent=caption;
  $("mission-svg-description").textContent=caption;
  $("mission-timeline").value=Math.round(p);
  $("mission-timeline").setAttribute("aria-valuetext",Math.round(p)+" percent through the conceptual story. "+caption);
}
function renderMission() {
  stopMission();missionPosition=0;
  const m=MISSIONS[activeUnit];
  $("mission-title").textContent=m.title;$("mission-svg-title").textContent=m.title;
  $("mission-caveat").textContent=m.caveat;$("mission-takeaway").textContent=m.takeaway;
  $("prediction-question").textContent=m.question;$("prediction-result").textContent="";
  $("prediction-options").replaceChildren();
  $("salt-control").hidden=!!TOPIC.kind||activeUnit!==2;$("add-salt").checked=true;
  prepareVisualControls(m.scene);
  $("energy-control").hidden=TOPIC.kind!=="force-energy"||activeUnit!==1;
  $("solid-controls").hidden=TOPIC.kind!=="force-energy"||activeUnit!==2;
  $("measurement-controls").hidden=TOPIC.kind!=="force-energy"||activeUnit!==2;
  $("liquid-controls").hidden=TOPIC.kind!=="force-energy"||activeUnit!==3;
  $("mission-stage").classList.toggle("static-motion",reducedMotion.matches);
  m.options.forEach((text,i)=>{
    const b=el("button",text,"secondary");b.setAttribute("aria-pressed","false");
    b.addEventListener("click",()=>{
      [...$("prediction-options").children].forEach(x=>x.setAttribute("aria-pressed",x===b));
      $("prediction-result").textContent=i===m.answer?m.explanation:"Not quite. "+m.explanation;
    });$("prediction-options").append(b);
  });
  renderMissionFrame();stopMission();
}
$("mission-play").addEventListener("click",()=>{
  if(missionFrame!==null){stopMission();return;}
  if(missionPosition>=100)missionPosition=0;
  if(reducedMotion.matches){missionPosition=100;renderMissionFrame();stopMission();return;}
  $("mission-play").textContent="Pause animation";$("mission-play").setAttribute("aria-pressed","true");
  function tick(now){
    if(missionLastTime!==null)missionPosition=Math.min(100,missionPosition+(now-missionLastTime)/150);
    missionLastTime=now;
    if(missionLastDraw===null||now-missionLastDraw>=1000/30||missionPosition>=100){renderMissionFrame();missionLastDraw=now;}
    if(missionPosition<100)missionFrame=requestAnimationFrame(tick);else stopMission();
  }
  missionFrame=requestAnimationFrame(tick);
});
$("mission-timeline").addEventListener("input",e=>{stopMission();missionPosition=Number(e.target.value);renderMissionFrame();stopMission();});
$("mission-step").addEventListener("click",()=>{stopMission();missionPosition=Math.min(100,missionPosition+20);renderMissionFrame();stopMission();});
$("mission-restart").addEventListener("click",()=>{stopMission();missionPosition=0;renderMissionFrame();stopMission();});
$("add-salt").addEventListener("change",()=>{stopMission();renderMissionFrame();});
$("scene-choice").addEventListener("change",()=>{stopMission();visualView=null;renderMissionFrame();});
$("show-measurements").addEventListener("change",()=>{stopMission();renderMissionFrame();});
$("energy-example").addEventListener("change",()=>{stopMission();renderMissionFrame();});
for(const id of ["contact-force","contact-area"])$(id).addEventListener("input",()=>{stopMission();renderMissionFrame();});
$("probe-depth").addEventListener("input",e=>{stopMission();missionPosition=Number(e.target.value);renderMissionFrame();stopMission();});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopMission();});
reducedMotion.addEventListener("change",()=>{stopMission();$("mission-stage").classList.toggle("static-motion",reducedMotion.matches);});
function renderLesson() {
  const unit = DATA.units[activeUnit];
  $("lesson-number").textContent = "MINI-LESSON " + (activeUnit + 1) + " / 5";
  $("lesson-title").textContent = unit.title;
  $("lesson-goal").textContent = unit.goal;
  $("lesson-text").replaceChildren(...unit.text.map(t => el("p", t)));
  $("challenge").textContent = unit.challenge;
  $("heating-visual").hidden = !!TOPIC.kind || activeUnit !== 1;
  $("lesson-complete").checked = progress.lessons.includes(activeUnit);
  $("lesson-details").open=false;
  renderMission();
  document.querySelectorAll("[data-unit]").forEach(b => b.setAttribute("aria-pressed", Number(b.dataset.unit) === activeUnit));
}
DATA.units.forEach((unit, i) => {
  const b = el("button", String(i+1).padStart(2,"0") + " / " + unit.title);
  b.dataset.unit = i; b.setAttribute("aria-pressed", i === 0);
  b.append(el("span", "Watch + one quick challenge"));
  b.addEventListener("click", () => {activeUnit = i; renderLesson();});
  $("route").append(b);
  const option = el("option", unit.title + " (20)"); option.value = i; $("topic-filter").append(option);
});
$("lesson-complete").addEventListener("change", e => {
  progress.lessons = progress.lessons.filter(x => x !== activeUnit);
  if (e.target.checked) progress.lessons.push(activeUnit);
  save();
});
const descriptions = {
  solid:"Close together. Vibrating around fixed positions. A fixed shape and approximately fixed volume.",
  liquid:"Close together, but able to move past one another. A fixed volume, not a fixed shape.",
  gas:"Far apart and moving randomly. Fills the container and is relatively easy to compress."
};
function renderParticles(state) {
  const group = $("particles"); group.replaceChildren(); group.setAttribute("class", state);
  $("particle-title").textContent = "Simplified model of particles in a " + state;
  for (let i=0; i<24; i++) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    let x,y;
    if(state === "solid"){x=108+(i%6)*26;y=80+Math.floor(i/6)*26;}
    else if(state === "liquid"){x=62+(i%8)*30+(Math.floor(i/8)%2)*8;y=136+Math.floor(i/8)*22;}
    else {x=50+(i%6)*46+((Math.floor(i/6)%2)*8);y=48+Math.floor(i/6)*44;}
    c.setAttribute("cx",x);c.setAttribute("cy",y);c.setAttribute("r",8);c.setAttribute("class","particle");
    c.style.animationDelay = -(i*.17)+"s";group.append(c);
  }
  $("state-description").textContent = descriptions[state] + " Simplified model, not to scale.";
  document.querySelectorAll("[data-state]").forEach(b => b.setAttribute("aria-pressed", b.dataset.state === state));
}
document.querySelectorAll("[data-state]").forEach(b => b.addEventListener("click", () => renderParticles(b.dataset.state)));
$("motion").addEventListener("click", () => {
  const paused = $("particle-model").classList.toggle("paused");
  $("motion").setAttribute("aria-pressed", paused);$("motion").textContent = paused ? "Resume motion" : "Pause motion";
});
function pool() {return DATA.questions.filter(q => filter === "all" || q.unit === Number(filter));}
function current() {return pool()[index];}
function feedback(q, result) {
  $("feedback").hidden = false; $("feedback").dataset.result = result || "";
  $("retry-question").hidden = !result;
  $("feedback").replaceChildren(el("strong", result === "correct" ? "Correct / self-confirmed. " : result === "review" ? "Keep practising. " : "Model answer. "),
    document.createTextNode(q.answer + " " + q.explanation));
}
function renderQuestion() {
  const questions = pool(), q = current(), saved = progress.answers[q.id];
  $("question-meta").textContent = DATA.units[q.unit].title + " / Question " + (index+1) + " of " + questions.length + " / Bank #" + q.id;
  $("question-prompt").textContent = q.prompt;
  $("answer-area").replaceChildren();$("feedback").hidden=true;$("self-mark").hidden=true;$("retry-question").hidden=true;
  $("check-answer").hidden = !q.options;$("reveal-answer").hidden=!!q.options;
  $("check-answer").disabled = !!saved;$("reveal-answer").disabled = !!saved;
  if(q.options) {
    q.options.forEach((option,i) => {
      const label=el("label", undefined, "option"), input=el("input");
      input.type="radio";input.name="answer";input.value=option;input.required=true;
      input.disabled=!!saved;label.append(input,el("span",String.fromCharCode(65+i)+". "+option));$("answer-area").append(label);
    });
  } else {
    const label=el("label","Your explanation (optional):"), answer=el("textarea");
    answer.id="written-answer";answer.placeholder="Think first, then compare with the model answer.";answer.disabled=!!saved;
    label.htmlFor=answer.id;$("answer-area").append(label,answer);
    $("answer-area").append(el("p","Written drafts are not saved or sent anywhere. Export saves completion statuses only.","small muted"));
  }
  if(saved) feedback(q,saved);
  $("previous-question").disabled=index===0;$("next-question").disabled=index===questions.length-1;
}
$("quiz-form").addEventListener("submit",e => {
  e.preventDefault();const q=current();if(!q.options || progress.answers[q.id]) return;
  const selected=document.querySelector('input[name="answer"]:checked');
  if(!selected) return;
  progress.answers[q.id]=selected.value===q.answer?"correct":"review";save();
  feedback(q,progress.answers[q.id]);$("check-answer").disabled=true;
  document.querySelectorAll('input[name="answer"]').forEach(x=>x.disabled=true);
});
$("reveal-answer").addEventListener("click",()=>{const q=current();feedback(q);$("self-mark").hidden=false;$("reveal-answer").disabled=true;});
function selfMark(result){const q=current();progress.answers[q.id]=result;save();feedback(q,result);$("self-mark").hidden=true;$("written-answer").disabled=true;}
$("self-correct").addEventListener("click",()=>selfMark("correct"));
$("self-review").addEventListener("click",()=>selfMark("review"));
$("retry-question").addEventListener("click",()=>{delete progress.answers[current().id];save();renderQuestion();});
$("previous-question").addEventListener("click",()=>{if(index>0){index--;renderQuestion();}});
$("next-question").addEventListener("click",()=>{if(index<pool().length-1){index++;renderQuestion();}});
$("topic-filter").addEventListener("change",e=>{filter=e.target.value;index=0;renderQuestion();});
DATA.flashcards.forEach(([front,back])=>{const d=el("details");d.append(el("summary",front),el("p",back));$("flashcards").append(d);});
$("share").addEventListener("click",async()=>{
  const hosted=/^https?:$/.test(location.protocol);
  const text=(TOPIC.shareText || "Science Explorer: Grade 8 physical and chemical changes. Five visual missions, 100 practice questions and an original lesson PDF. Key idea: ask whether a new substance forms, not just whether a change is reversible.")+(hosted?"\n"+location.href:"\nTo share offline, send the complete Science Explorer site folder.");
  try{await navigator.clipboard.writeText(text);$("action-status").textContent="Learning summary copied. No personal scores included.";}
  catch(error){$("action-status").textContent="Clipboard unavailable. Copy this summary manually: "+text;}
});
$("export").addEventListener("click",()=>{
  const data={resource:TOPIC.title || "Science Explorer / Physical and chemical changes",exportedAt:new Date().toISOString(),...progress};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  const a=el("a");a.href=url;a.download=TOPIC.kind?"my-"+TOPIC.kind+"-progress.json":"my-science-progress.json";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);$("action-status").textContent="Progress exported. This file contains local completion and review statuses, not written answers.";
});
$("reset").addEventListener("click",()=>{
  if(!confirm("Reset all lesson completion and question statuses on this browser? Export first if you need a copy.")) return;
  progress={lessons:[],answers:{}};save();renderLesson();renderQuestion();$("action-status").textContent="Progress reset on this browser.";
});
const VIDEOS=TOPIC.videos || {
  demo:{id:"ym1ggwU3lDY",title:"Boiling Point Demo Video - Water vs Salt Water",credit:"Matthew Robinson / Holly Grove Middle School",prompt:"Predict which sample has the higher boiling temperature. Watch for thermometer evidence; do not copy the heating experiment without a teacher."},
  short:{id:"cBkvORRSSuo",title:"Boiling Point Elevation | Colligative Properties",credit:"The Science Classroom / YouTube Short",prompt:"Watch for the main idea: dissolved non-volatile solutes raise boiling point. Formula work and vocabulary in this clip are optional extensions."}
};
let selectedVideo="demo";
function unloadVideo(){
  $("video-box").replaceChildren(el("p","Video is not loaded. Choose Load to contact YouTube."));
  $("load-video").hidden=false;$("unload-video").hidden=true;
  $("video-status").textContent="Internet required. Local-file embeds may be blocked; use Watch on YouTube if playback fails.";
}
function selectVideo(key){
  selectedVideo=key;unloadVideo();const v=VIDEOS[key];
  $("video-title").textContent=v.title;$("video-credit").textContent=v.credit;$("video-prompt").textContent=v.prompt;
  $("video-link").href="https://www.youtube.com/watch?v="+v.id;
}
$("load-video").addEventListener("click",()=>{
  const v=VIDEOS[selectedVideo],iframe=el("iframe");
  iframe.src="https://www.youtube-nocookie.com/embed/"+v.id+"?autoplay=0&playsinline=1";
  iframe.title=v.title+" - YouTube video";iframe.allow="encrypted-media; picture-in-picture; fullscreen";
  iframe.allowFullscreen=true;iframe.referrerPolicy="strict-origin-when-cross-origin";
  iframe.addEventListener("error",()=>{$("video-status").textContent="The video frame could not load. Use Watch on YouTube instead.";});
  $("video-box").replaceChildren(iframe);$("load-video").hidden=true;$("unload-video").hidden=false;
  $("video-status").textContent="YouTube has been contacted. Press Play in the player. If it reports a playback error (including local-file restrictions), use Watch on YouTube instead.";
});
$("unload-video").addEventListener("click",unloadVideo);
$("select-short").addEventListener("click",()=>selectVideo("short"));
$("select-demo").addEventListener("click",()=>selectVideo("demo"));
if(TOPIC.kind){
  document.title=TOPIC.title;
  const lines=TOPIC.heroLines||["Small pushes.","Big discoveries."];
  $("hero-heading").replaceChildren(document.createTextNode(lines[0]),el("br"),el("em",lines[1]));
  $("hero-lead").textContent=TOPIC.lead||"Follow energy transformations and explore how a force spreads over an area. Force and Energy includes energy transformations and pressure.";
  $("particle-hero").hidden=true;$("energy-hero").hidden=TOPIC.kind!=="force-energy";$("topic-hero").hidden=TOPIC.kind==="force-energy";
  $("pdf-link").href=TOPIC.pdf;
  $("scope-note").textContent=TOPIC.scope;$("source-reference").textContent=TOPIC.reference;
  $("safety-note").textContent=TOPIC.safety||"Virtual lab only. No mains electricity, flames, heights, pressurised containers, sharp tools or vehicle experiments. Real practical work needs a teacher.";
  $("alternate-video-heading").textContent="Switch the science focus";
  $("alternate-video-note").textContent="Choose energy conservation or pressure in liquids. Both are FuseSchool videos; teacher review is still required.";
  $("select-short").textContent="Choose pressure in liquids";$("select-demo").textContent="Choose energy conservation";
  $("search-resources").replaceChildren(...TOPIC.searches.map(item=>{
    const card=el("article",undefined,"panel"),a=el("a","Search YouTube");
    a.href="https://www.youtube.com/results?search_query="+encodeURIComponent(item.query);a.target="_blank";a.rel="noopener noreferrer";
    card.append(el("div","WATCH / EXPLORE","eyebrow"),el("h3",item.title),el("p",item.note),a);return card;
  }));
  if(TOPIC.searchOnly){
    document.querySelector(".video-layout").hidden=true;
    $("resources-title").textContent="Watch thoughtfully. Keep asking.";
    document.querySelector("#resources > p").textContent="These are YouTube topic searches, not vetted individual videos. A teacher should preview results for scientific accuracy, safety and age suitability. External sites need internet and may show adverts or track visits.";
  }else selectVideo("demo");
  if(TOPIC.readingLinks&&TOPIC.readingLinks.length){
    $("external-reading").hidden=false;$("external-reading").append(el("strong","General information from health organisations (not personal medical advice)"));
    for(const [label,url] of TOPIC.readingLinks){const a=el("a",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";$("external-reading").append(a);}
  }
}
renderLesson();renderParticles("solid");renderQuestion();updateProgress();
if(typeof IntersectionObserver!=="undefined"){
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stopMission();}).observe($("mission-stage"));
  new IntersectionObserver(entries=>$("particle-hero").classList.toggle("offscreen",!entries[0].isIntersecting)).observe($("particle-hero"));
}
