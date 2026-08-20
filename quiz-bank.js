
(() => {
  const esc = v => String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const code = v => `<pre class="quiz-code"><code>${esc(v)}</code></pre>`;

  function shuffle(a) {
    a = [...a];
    for (let i=a.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function sampleBalanced(bank,n) {
    if (n===20) return shuffle(bank);
    const p1=shuffle(bank.filter(x=>x.topic==="SQL Part 1"));
    const p2=shuffle(bank.filter(x=>x.topic==="SQL Part 2"));
    const n1=Math.floor(n/2);
    const n2=n-n1;
    return shuffle([...p1.slice(0,n1),...p2.slice(0,n2)]);
  }

  function init(el,data) {
    let qs=[],i=0,right=0,wrong=0,locked=false;

    function setup() {
      el.innerHTML=`<div class="quiz-shell"><h2>Choose your quiz length</h2>
      <p>Each attempt draws from the same 20-question bank.</p>
      <div class="length-grid">
        <button data-n="5"><strong>5 questions</strong><span>Quick check</span></button>
        <button data-n="10"><strong>10 questions</strong><span>Standard practice</span></button>
        <button data-n="20"><strong>20 questions</strong><span>Full review</span></button>
      </div>
      <p class="bank-note">The bank contains 10 questions from SQL Part 1 and 10 from SQL Part 2. Shorter quizzes sample across both parts.</p></div>`;
      el.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>start(Number(b.dataset.n)));
    }

    function start(n) {
      qs=sampleBalanced(data.questions,n); i=0; right=0; wrong=0;
      el.innerHTML=`<div class="quiz-shell">
        <div class="top"><strong>${esc(data.title)}</strong><span id="prog"></span></div>
        <div class="score" id="score"></div>
        <div class="track"><div class="fill" id="fill"></div></div>
        <div class="card">
          <div id="question"></div><div id="options"></div><div id="feedback"></div><div id="actions"></div>
        </div></div>`;
      render();
    }

    function render() {
      locked=false;
      if (i>=qs.length) return finish();
      const q=qs[i];
      el.querySelector("#prog").textContent=`${i+1}/${qs.length}`;
      el.querySelector("#score").textContent=`Correct: ${right} · Incorrect: ${wrong}`;
      el.querySelector("#fill").style.width=`${i/qs.length*100}%`;
      el.querySelector("#question").innerHTML=`<div class="meta"><span>Question ${i+1}</span><span class="topic">${esc(q.topic)}</span></div><h2>${esc(q.q)}</h2>${q.code?code(q.code):""}`;
      const opt=el.querySelector("#options"); opt.innerHTML="";
      q.opts.forEach((o,k)=>{
        const b=document.createElement("button"); b.className="option";
        b.innerHTML=`<span class="letter">${String.fromCharCode(65+k)}</span><span>${o[0].includes("SELECT")||o[0].includes("WHERE")||o[0].includes("RANK()")||o[0].includes("IFNULL")||o[0].includes("AVG(")||o[0].includes("SUM(")||o[0].includes("COUNT(")||o[0].includes("MAX(")?code(o[0]):esc(o[0])}</span>`;
        b.onclick=()=>answer(k); opt.appendChild(b);
      });
      el.querySelector("#feedback").innerHTML="";
      el.querySelector("#actions").innerHTML="";
    }

    function answer(k) {
      if (locked) return; locked=true;
      const q=qs[i], ok=k===q.a;
      ok?right++:wrong++;
      [...el.querySelectorAll(".option")].forEach((b,x)=>{
        b.disabled=true;
        if(x===q.a)b.classList.add("correct");
        if(x===k&&!ok)b.classList.add("wrong");
      });
      const correct=q.opts[q.a];
      el.querySelector("#score").textContent=`Correct: ${right} · Incorrect: ${wrong}`;
      el.querySelector("#fill").style.width=`${(i+1)/qs.length*100}%`;
      el.querySelector("#feedback").innerHTML=`<div class="feedback ${ok?"yes":"no"}"><h3>${ok?"Correct":"Not quite"}</h3><p>${esc(q.opts[k][1])}</p>${ok?"":`<p><strong>Correct answer:</strong> ${esc(correct[0])}</p><p>${esc(correct[1])}</p>`}</div>`;
      const b=document.createElement("button"); b.className="next"; b.textContent=i===qs.length-1?"See my result":"Next";
      b.onclick=()=>{i++;render();el.scrollIntoView({behavior:"smooth",block:"start"});};
      el.querySelector("#actions").appendChild(b);
    }

    function finish() {
      const pct=Math.round(right/qs.length*100);
      el.querySelector("#prog").textContent=`${qs.length}/${qs.length}`;
      el.querySelector("#fill").style.width="100%";
      el.querySelector("#question").innerHTML=`<h2>Your score: ${right}/${qs.length} (${pct}%)</h2><p>${pct>=80?"Strong understanding. Try another set or explain one of the harder queries to someone else.":pct>=50?"Good progress. Review the feedback for the questions you missed, then try another set.":"Use the feedback to guide your review, then try a shorter set again."}</p><p><strong>Remember:</strong> SQL running successfully does not necessarily mean it answers the business question correctly.</p>`;
      el.querySelector("#options").innerHTML=""; el.querySelector("#feedback").innerHTML=""; el.querySelector("#actions").innerHTML="";
      const b=document.createElement("button");b.className="next";b.textContent="Choose another quiz";b.onclick=setup;el.querySelector("#actions").appendChild(b);
    }
    setup();
  }

  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll(".sql-quiz-bank").forEach(el=>{
      const d=el.nextElementSibling;
      init(el,JSON.parse(d.textContent));
    });
  });
})();
