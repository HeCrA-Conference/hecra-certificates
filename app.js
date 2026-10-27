'use strict';
const form = document.getElementById('certificate-form');
const nameInput = document.getElementById('participant-name');
const button = document.getElementById('generate-btn');
const message = document.getElementById('message');

function status(text, kind) {
  message.textContent = text;
  message.className = kind;
}
function verifyName(fullName) {
  const endpoint = window.HECRA_CONFIG && window.HECRA_CONFIG.verificationEndpoint;
  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\//.test(endpoint)) {
    return Promise.reject(new Error('The certificate service is not yet configured. Please contact the conference organizers.'));
  }
  // Apps Script ContentService redirects to a different origin, so its HTTPS JSONP response
  // is used instead of cross-origin fetch. The callback provides eligibility only.
  return new Promise((resolve, reject) => {
    const cb = 'hecra_cb_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    let settled = false;
    const tidy = () => { clearTimeout(timer); script.remove(); delete window[cb]; };
    window[cb] = result => { if (settled) return; settled=true; tidy(); resolve(result); };
    script.onerror = () => { if (settled) return; settled=true; tidy(); reject(new Error('Unable to connect to the attendance verification service.')); };
    const url = new URL(endpoint);
    url.searchParams.set('name', fullName);
    url.searchParams.set('callback', cb);
    script.src = url.toString();
    const timer = setTimeout(() => { if (settled) return; settled=true; tidy(); reject(new Error('Verification timed out. Please try again.')); }, 15000);
    document.head.appendChild(script);
  });
}
function namePicture(name, fontSizePoints=28) {
  // Rasterize only the participant name, allowing correct Greek and Latin glyphs
  // without uploading any font file. 4x raster makes the inserted name print sharply.
  const c=document.createElement('canvas'); const ctx=c.getContext('2d');
  const scale=4, widthPts=670, heightPts=49;
  c.width=widthPts*scale;c.height=heightPts*scale;
  ctx.scale(scale,scale);
  let font=fontSizePoints;
  do {ctx.font=`700 ${font}px Georgia, "Times New Roman", serif`;if(ctx.measureText(name).width<=widthPts-20)break;font-=1;}while(font>15);
  ctx.fillStyle='#0a2949';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(name,widthPts/2,heightPts/2);
  return c.toDataURL('image/png');
}
async function createCertificate(fullName) {
  const template = await fetch('./certificate-template.pdf', {cache:'force-cache'});
  if (!template.ok) throw new Error('Certificate template could not be loaded.');
  if (!window.PDFLib) throw new Error('PDF generator library did not load.');
  const pdf=await PDFLib.PDFDocument.load(await template.arrayBuffer());
  const page=pdf.getPages()[0];
  const {width,height}=page.getSize();
  const png=await pdf.embedPng(namePicture(fullName));
  // Original PowerPoint was 10.833 x 7.5 inches; name slot is centered around y=35.5% from top.
  const nameWidth=Math.min(width-80,670);
  const nameHeight=49*nameWidth/670;
  page.drawImage(png,{x:(width-nameWidth)/2,y:height*0.645-nameHeight/2,width:nameWidth,height:nameHeight});
  const bytes=await pdf.save();
  const blob=new Blob([bytes],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='HeCrA_2026_Certificate_of_Attendance.pdf';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const name=nameInput.value.normalize('NFC').replace(/\s+/g,' ').trim();
  if(name.length<3||name.length>120){status('Please enter your full first and last name.','error');return;}
  button.disabled=true;button.textContent='Verifying attendance…';message.className='';message.textContent='';
  try {
    const data=await verifyName(name);
    if(data.error)throw new Error(data.error);
    if(!data.eligible){status('Name not found. Please check the spelling on your conference badge, or contact the organizing committee.','error');return;}
    button.textContent='Creating your PDF…';
    // Always use canonical name from the private attendance sheet.
    await createCertificate(data.displayName || name);
    status('Your personalized certificate has been downloaded.','success');
  } catch(e) {status(e.message || 'Could not generate the certificate. Please try again.','error');}
  finally {button.disabled=false;button.textContent='Verify name & download PDF';}
});
