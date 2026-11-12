/* =========================================================
   SPECIALIZE DIGITAL — animações
   GSAP + ScrollTrigger + Lenis
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Modo leve: celulares e computadores fracos ficam sem os efeitos mais pesados */
  const lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const touch = matchMedia("(hover: none)").matches;
  const lite = !!(lowEnd || touch);
  document.documentElement.classList.toggle("lite", lite);
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desktopMQ = "(min-width: 901px)";

  /* ---------- Contatos (config.js) ---------- */
  const cfg = window.SPECIALIZE || {};
  const waNumber = (cfg.whatsapp || "").replace(/\D/g, "");
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(cfg.mensagem || "")}` : null;
  /* Sem número de WhatsApp, os botões de ação abrem o Instagram */
  const actionLink = waLink || cfg.instagram || null;
  $$("[data-whatsapp]").forEach((a) => {
    if (!waLink && a.hasAttribute("data-wa-only")) { a.remove(); return; }
    if (actionLink) { a.href = actionLink; a.target = "_blank"; a.rel = "noopener"; }
    else { a.href = "#contato"; a.removeAttribute("target"); }
  });
  if (!waLink && cfg.instagram) {
    const wa = $(".btn--wa");
    if (wa) {
      $(".btn__text", wa).textContent = "Chamar no Instagram";
      $(".btn__icon", wa).innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" class="fill-dot" /></svg>';
    }
  }
  $$("[data-instagram]").forEach((a) => {
    if (cfg.instagram) { a.href = cfg.instagram; a.target = "_blank"; a.rel = "noopener"; }
    else { a.href = "#topo"; a.removeAttribute("target"); }
  });

  const preloader = $(".preloader");
  const finishLoading = () => {
    preloader && preloader.remove();
    document.body.classList.remove("is-loading");
  };

  /* ---------- Vídeos: tocam só quando aparecem ---------- */
  const autoVideos = $$("video[data-autoplay]");
  /* HD (1080p) só nos vídeos grandes dos cartões de serviço, em computador bom.
     Os vídeos do trilho de trabalho são pequenos na tela: usam sempre a versão leve (720p). */
  const useHD = !lite && matchMedia("(min-width: 901px)").matches;
  if (useHD) $$(".card__visual video[data-autoplay]").forEach((v) => { v.src = v.getAttribute("src").replace(/\.mp4$/, "-hd.mp4"); });

  /* 1) começa a carregar um pouco antes de aparecer, para não engasgar ao entrar na tela */
  const warm = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting && v.preload !== "auto") { v.preload = "auto"; v.load(); }
    });
  }, { rootMargin: "400px 700px" });
  /* 2) só toca quando boa parte do vídeo está visível; fora disso, pausa (menos vídeos ao mesmo tempo) */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, intersectionRatio }) => {
      /* no trilho, vídeos cortados nas bordas ficam pausados: no máximo ~3 tocando juntos */
      const need = v.closest(".tile") ? 0.6 : 0.35;
      if (intersectionRatio >= need) {
        const p = v.play();
        p && p.catch(() => {});
        v.closest(".tile")?.classList.add("is-playing");
      } else {
        v.pause();
        v.closest(".tile")?.classList.remove("is-playing");
      }
    });
  }, { threshold: [0, 0.35, 0.6] });
  if (!reduce) autoVideos.forEach((v) => { warm.observe(v); io.observe(v); });

  /* ---------- Showreel: som e play ---------- */
  const reel = $(".reel");
  const reelVideo = $(".reel__video");
  const reelPlay = $(".reel__play");
  const reelSound = $(".reel__sound");
  const setSound = (on) => {
    reelVideo.muted = !on;
    reelSound.querySelector("b").textContent = on ? "on" : "off";
  };
  reelPlay.addEventListener("click", (e) => {
    e.stopPropagation();
    reelVideo.currentTime = 0;
    setSound(true);
    reelVideo.loop = false;
    reelVideo.play().catch(() => {});
    reel.classList.add("is-playing");
  });
  reelSound.addEventListener("click", (e) => { e.stopPropagation(); setSound(reelVideo.muted); });
  $(".reel__frame").addEventListener("click", () => {
    if (!reel.classList.contains("is-playing")) return reelPlay.click();
    reelVideo.paused ? reelVideo.play() : reelVideo.pause();
  });
  reelVideo.addEventListener("ended", () => {
    reel.classList.remove("is-playing");
    setSound(false);
    reelVideo.loop = true;
    reelVideo.play().catch(() => {});
  });
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!reel.classList.contains("is-playing") && !reduce) reelVideo.play().catch(() => {});
    } else {
      reelVideo.pause();
      if (reel.classList.contains("is-playing")) { reel.classList.remove("is-playing"); setSound(false); reelVideo.loop = true; }
    }
  }, { threshold: 0.2 }).observe($(".reel__frame"));

  /* ---------- Sem GSAP ou com movimento reduzido: tudo visível ---------- */
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    $$("[data-split]").forEach((el) => el.classList.add("is-split"));
    $$(".about__statement .sw").forEach((w) => (w.style.opacity = 1));
    $$(".ads-panel__bars span").forEach((b) => b.style.setProperty("--s", 1));
    $$(".journey__step").forEach((s) => s.classList.add("is-on"));
    $(".journey__line i")?.style.setProperty("--p", 1);
    $(".hero__name")?.remove();
    finishLoading();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: "expo.out" });

  /* ---------- Separar texto em palavras ---------- */
  function splitWords(el, cls = "word") {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = cls;
            if (cls === "word") {
              const inner = document.createElement("span");
              inner.className = "word__in";
              inner.textContent = part;
              w.appendChild(inner);
            } else {
              w.textContent = part;
            }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add("is-split");
    return cls === "word" ? $$(".word__in", el) : $$("." + cls, el);
  }

  /* ---------- Lenis (rolagem suave) ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      /* No showreel, para no ponto em que o vídeo já está grande (fim da animação presa) */
      let dest = target;
      if (id === "#showreel") {
        const pin = ScrollTrigger.getAll().find((s) => s.trigger === $(".reel__stage") && s.pin);
        dest = pin ? pin.end : target; /* no celular para no título "Assista ao showreel" */
      }
      if (lenis) lenis.scrollTo(dest, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else if (typeof dest === "number") window.scrollTo({ top: dest, behavior: "smooth" });
      else dest.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Cursor ---------- */
  if (finePointer) {
    document.documentElement.classList.add("has-cursor");
    const cursor = $(".cursor");
    const label = $(".cursor__label");
    const dx = gsap.quickTo(".cursor__dot", "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(".cursor__dot", "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(".cursor__ring", "x", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(".cursor__ring", "y", { duration: 0.5, ease: "power3" });
    window.addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button");
      if (lab && !link) { label.textContent = lab.dataset.cursor; cursor.classList.add("is-label"); cursor.classList.remove("is-hover"); }
      else if (link) { cursor.classList.add("is-hover"); cursor.classList.remove("is-label"); }
      else { cursor.classList.remove("is-label", "is-hover"); }
    });
    document.addEventListener("pointerleave", () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));
    document.addEventListener("pointerenter", () => gsap.to(cursor, { opacity: 1, duration: 0.3 }));

    /* Botões magnéticos */
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener("pointerleave", () => { gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.4)" }); });
    });
  }

  /* ---------- Nav ---------- */
  const nav = $(".nav");
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle("is-scrolled", y > 40);
      nav.classList.toggle("is-hidden", self.direction === 1 && y > 500);
    },
  });

  const mm = gsap.matchMedia();

  /* ---------- Preparar textos ---------- */
  const heroWords = splitWords($(".hero__title"));
  const scrollSplits = $$('[data-split="scroll"]').map((el) => ({ el, words: splitWords(el) }));
  const statement = $("[data-scrub-words]");
  const statementWords = splitWords(statement, "sw");

  /* =========================================================
     PRELOADER  →  ABERTURA DO HERO
     ========================================================= */

  gsap.set(".hero__logo", { clipPath: "inset(0 100% 0 0)" });
  gsap.set(heroWords, { yPercent: 115, rotate: 5 });
  gsap.set("[data-hero-fade]", { y: 30, opacity: 0 });
  gsap.set(".hero__media-inner img", { scale: lite ? 1.12 : 1.3, opacity: 0 });
  gsap.set(".hero__name-logo", { clipPath: "inset(0 100% 0 0)" });
  gsap.set(nav, { autoAlpha: 0 });

  gsap.timeline()
    .to(".preloader__logo", { clipPath: "inset(0 0% 0 0)", duration: 1.3, ease: "expo.inOut" })
    .add(() => $(".preloader__logo .shine").classList.add("is-on"), "-=0.25");

  const heroImg = $(".hero__media-inner img");
  const waitFor = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
  Promise.all([
    waitFor(document.fonts ? document.fonts.ready : Promise.resolve(), 3000),
    waitFor(heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(), 5000),
    new Promise((r) => setTimeout(r, 1700)),
  ]).then(exitPreloader);

  /* No celular a abertura é um esmaecer suave; no computador as cortinas se abrem */
  const smallScreen = matchMedia("(max-width: 900px)").matches;

  function exitPreloader() {
    const tl = gsap.timeline({
      onComplete() {
        finishLoading();
        lenis && lenis.start();
        ScrollTrigger.refresh();
      },
    });
    if (smallScreen) {
      gsap.set(".hero__name-logo", { clipPath: "none", opacity: 0, scale: 0.94 });
      tl.to(".preloader__logo", { opacity: 0, scale: 0.96, duration: 0.45, ease: "power2.in" })
        .to(".preloader", { opacity: 0, duration: 0.9, ease: "power2.out" }, "-=0.05")
        .add(heroIntro(true), "<");
    } else {
      tl.to(".preloader__logo", { scale: 1.08, opacity: 0, duration: 0.7, ease: "power3.in" })
        .to(".preloader__panel--top", { yPercent: -100, duration: 1.3, ease: "expo.inOut" }, "-=0.3")
        .to(".preloader__panel--bottom", { yPercent: 100, duration: 1.3, ease: "expo.inOut" }, "<")
        .add(heroIntro(false), "<0.1");
    }
  }

  function heroIntro(soft) {
    const tl = gsap.timeline()
      .to(".hero__media-inner img", { scale: 1, opacity: 1, duration: soft ? 1.8 : 2.6, ease: soft ? "power3.out" : "expo.out" }, 0);
    if (soft) {
      tl.to(".hero__name-logo", { opacity: 1, scale: 1, duration: 1.2, ease: "power3.out" }, 0.3)
        .add(() => $(".hero__name .shine").classList.add("is-on"), 1.1);
    } else {
      tl.to(".hero__name-logo", { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "expo.inOut" }, 0.35)
        .add(() => $(".hero__name .shine").classList.add("is-on"), 1.45);
    }
    return tl.from(".hero__scroll", { opacity: 0, duration: 1 }, soft ? 1 : 1.4);
  }

  /* ---------- Hero: começa só com a foto no centro; o texto surge ao rolar ---------- */
  gsap.set(".hero__media", { "--shade": 0 });
  mm.add({ desk: desktopMQ, mob: "(max-width: 900px)" }, (ctx) => {
    const { desk } = ctx.conditions;
    gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true },
    })
      .to(".hero__scroll", { opacity: 0, duration: 0.1 }, 0)
      /* 1) o nome some e a dupla acende */
      .to(".hero__name", { opacity: 0, scale: 0.9, duration: 0.28, ease: "power2.in" }, 0)
      .fromTo(".hero__media-inner", { opacity: 0.32 }, { opacity: 1, duration: 0.32 }, 0.06)
      /* 2) a foto vai para o lado e o texto aparece */
      .fromTo(".hero__media",
        desk ? { xPercent: -33.4, scale: 1.06 } : { y: () => innerHeight * 0.2, scale: 1.06 },
        desk ? { xPercent: 0, scale: 1, duration: 0.6 } : { y: 0, scale: 1, duration: 0.6 }, 0.32)
      .to(".hero__media", { "--shade": 1, duration: 0.5 }, 0.42)
      .to(".hero__logo", { clipPath: "inset(0 0% 0 0)", duration: 0.35, ease: "power3.inOut" }, 0.62)
      .add(() => $(".hero__logo .shine").classList.add("is-on"), 0.87)
      .to(heroWords, { yPercent: 0, rotate: 0, duration: 0.35, stagger: 0.02 }, 0.72)
      .to("[data-hero-fade]", { y: 0, opacity: 1, duration: 0.3, stagger: 0.07 }, 0.92)
      .to(nav, { autoAlpha: 1, duration: 0.25 }, 1.02)
      .to({}, { duration: 0.25 });
  });

  if (finePointer && !lite) {
    const mx = gsap.quickTo(".hero__media-inner", "x", { duration: 1.4, ease: "power3" });
    const my = gsap.quickTo(".hero__media-inner", "y", { duration: 1.4, ease: "power3" });
    $(".hero").addEventListener("pointermove", (e) => {
      mx((e.clientX / innerWidth - 0.5) * -22);
      my((e.clientY / innerHeight - 0.5) * -14);
    });
  }

  /* ---------- Marquee (velocidade reage à rolagem) ---------- */
  const marqueeTweens = [];
  $$(".marquee__row").forEach((row) => {
    const track = $(".marquee__track", row);
    row.appendChild(track.cloneNode(true));
    row.appendChild(track.cloneNode(true));
    const dir = Number(row.dataset.dir) || -1;
    const tracks = $$(".marquee__track", row);
    tracks.slice(1).forEach((t) => t.setAttribute("aria-hidden", "true"));
    marqueeTweens.push(
      gsap.fromTo(tracks, { xPercent: dir < 0 ? 0 : -100 }, { xPercent: dir < 0 ? -100 : 0, duration: dir < 0 ? 26 : 34, ease: "none", repeat: -1 })
    );
  });
  const skewTo = gsap.quickTo(".marquee__track", "skewX", { duration: 0.5, ease: "power3" });
  let lastDir = 1;
  ScrollTrigger.create({
    trigger: ".marquee",
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => marqueeTweens.forEach((t) => (self.isActive ? t.resume() : t.pause())),
    onUpdate(self) {
      if (lite) return;
      const v = self.getVelocity();
      if (self.direction !== lastDir) lastDir = self.direction;
      const boost = 1 + Math.min(Math.abs(v) / 400, 5);
      marqueeTweens.forEach((t) => gsap.to(t, { timeScale: boost * lastDir, duration: 0.4, overwrite: true }));
      skewTo(gsap.utils.clamp(-10, 10, v / -180));
      clearTimeout(self._t);
      self._t = setTimeout(() => {
        marqueeTweens.forEach((t) => gsap.to(t, { timeScale: lastDir, duration: 1.2, overwrite: true }));
        skewTo(0);
      }, 120);
    },
  });
  gsap.from(".marquee__row", { xPercent: (i) => (i ? -12 : 12), opacity: 0, duration: 1.6, stagger: 0.15, scrollTrigger: { trigger: ".marquee", start: "top 90%" } });

  /* ---------- Revelações genéricas ---------- */
  $$("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1.2,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
    const line = $(".eyebrow__line", el);
    if (line) gsap.from(line, { scaleX: 0, duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  scrollSplits.forEach(({ el, words }) => {
    gsap.from(words, {
      yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.035,
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });

  $$("[data-stagger]").forEach((el) => {
    gsap.from(el.children, { y: 24, opacity: 0, duration: 1, stagger: 0.09, scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* Frase de impacto: palavras acendem conforme rola */
  gsap.to(statementWords, {
    opacity: 1, ease: "none", stagger: 0.12,
    scrollTrigger: { trigger: statement, start: "top 82%", end: "bottom 40%", scrub: true },
  });

  /* Fotos com cortina + parallax */
  $$("[data-clip]").forEach((fig) => {
    const img = $("img", fig);
    gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 85%" } })
      .fromTo(fig, { clipPath: "inset(100% 0% 0% 0% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.6, ease: "expo.inOut" })
      .from(img, { scale: 1.35, duration: 2, ease: "expo.out" }, 0.2);
  });
  $$("[data-parallax]").forEach((img) => {
    const amt = Number(img.dataset.parallax) || 8;
    gsap.fromTo(img, { yPercent: -amt }, {
      yPercent: amt, ease: "none",
      scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  /* =========================================================
     SERVIÇOS — cartões empilhados
     ========================================================= */
  const cards = $$("[data-card]");
  cards.forEach((card, i) => {
    card.style.setProperty("--i", i);
    const inner = $(".card__inner", card);
    const dim = document.createElement("div");
    dim.className = "card__dim";
    inner.appendChild(dim);

    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 72%" } });
    tl.from([$(".card__tag", card), $(".card__title", card), $(".card__lead", card), $(".card__text", card)], { y: 30, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.1)
      .from($$(".card__list li", card), { x: -24, opacity: 0, duration: 0.9, stagger: 0.07 }, 0.35)
      .fromTo($(".card__visual", card), { clipPath: "inset(0% 0% 100% 0% round 20px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1.5, ease: "expo.inOut" }, 0);
  });

  mm.add(desktopMQ, () => {
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      gsap.to($(".card__inner", card), {
        scale: 0.9 + i * 0.025, ease: "none",
        scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 14%", scrub: true },
      });
      gsap.to($(".card__dim", card), {
        opacity: 0.6, ease: "none",
        scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 14%", scrub: true },
      });
    });
  });

  /* Barras do painel Meta Ads */
  const bars = $$(".ads-panel__bars span");
  gsap.timeline({ scrollTrigger: { trigger: ".card__visual--ads", start: "top 75%" } })
    .from(".ads-panel", { y: 40, opacity: 0, duration: 1.2 }, 0.5)
    .to(bars, { "--s": 1, duration: 1.4, stagger: 0.08, ease: "expo.out" }, 0.8)
    .add(() => {
      const breathe = bars.map((b, i) =>
        gsap.to(b, { "--s": () => gsap.utils.random(0.72, 1.08), duration: () => gsap.utils.random(1.4, 2.4), ease: "sine.inOut", repeat: -1, yoyo: true, repeatRefresh: true, delay: i * 0.1 })
      );
      ScrollTrigger.create({
        trigger: ".card__visual--ads", start: "top bottom", end: "bottom top",
        onToggle: (self) => breathe.forEach((t) => (self.isActive ? t.resume() : t.pause())),
      });
    });

  /* Timecode da câmera */
  const tc = $("[data-timecode]");
  const tcVideo = $(".card__visual--film video");
  const pad = (n) => String(n).padStart(2, "0");
  /* atualiza o contador poucas vezes por segundo (antes era a cada quadro) */
  let tcLast = 0;
  gsap.ticker.add((time) => {
    if (!tcVideo || tcVideo.paused || time - tcLast < 0.12) return;
    tcLast = time;
    const t = tcVideo.currentTime + 3723;
    tc.textContent = `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(Math.floor(t) % 60)}:${pad(Math.floor((t % 1) * 24))}`;
  });

  /* Jornada do lead */
  const steps = $$(".journey__step");
  const jLine = $(".journey__line i");
  ScrollTrigger.create({
    trigger: ".card__visual--journey",
    start: "top 70%",
    end: "bottom 45%",
    scrub: true,
    onUpdate(self) {
      jLine.style.setProperty("--p", self.progress);
      steps.forEach((s, i) => s.classList.toggle("is-on", self.progress >= i / (steps.length - 1) - 0.02));
    },
  });
  gsap.from(steps, { x: 40, opacity: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: ".card__visual--journey", start: "top 78%" } });

  /* =========================================================
     NOSSO TRABALHO — trilho horizontal
     ========================================================= */
  const track = $("[data-track]");
  const tiles = $$(".tile", track);
  const progressBar = $(".work__progress span");

  mm.add(desktopMQ, () => {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const hTween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: ".work__rail", start: "top top", end: () => "+=" + dist(),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => gsap.set(progressBar, { scaleX: self.progress }),
      },
    });
    gsap.from(tiles, {
      yPercent: 30, opacity: 0, rotate: 2, duration: 1.4, stagger: 0.08,
      scrollTrigger: { trigger: ".work__rail", start: "top 85%" },
    });
  });
  mm.add("(max-width: 900px)", () => {
    gsap.from(tiles.slice(0, 3), { x: 60, opacity: 0, duration: 1.2, stagger: 0.1, scrollTrigger: { trigger: ".work__rail", start: "top 85%" } });
  });

  /* =========================================================
     SHOWREEL
     ========================================================= */
  mm.add(desktopMQ, () => {
    gsap.timeline({
      scrollTrigger: { trigger: ".reel__stage", start: "top top", end: "+=110%", pin: true, scrub: 1 },
    })
      .fromTo(".reel__frame", { scale: 0.52, rotate: -5, yPercent: 8 }, { scale: 1, rotate: 0, yPercent: 0, ease: "power2.out" }, 0)
      .fromTo(".reel__bigword span:first-child", { xPercent: 0 }, { xPercent: -38, ease: "none" }, 0)
      .fromTo(".reel__bigword span:last-child", { xPercent: 0 }, { xPercent: 38, ease: "none" }, 0)
      .from(".reel__side--left", { x: -80, opacity: 0, ease: "power2.out" }, 0.35)
      .from(".reel__side--right", { x: 80, opacity: 0, ease: "power2.out" }, 0.35);
  });
  mm.add("(max-width: 900px)", () => {
    gsap.from(".reel__frame", { scale: 0.8, opacity: 0, rotate: -3, duration: 1.6, scrollTrigger: { trigger: ".reel__stage", start: "top 80%" } });
    gsap.from(".reel__bigword span", { xPercent: (i) => (i ? 30 : -30), opacity: 0, duration: 1.6, scrollTrigger: { trigger: ".reel__stage", start: "top 80%" } });
  });

  /* =========================================================
     CONTATO — a foto abre como uma cortina de cinema
     ========================================================= */
  gsap.from(".contact__title", { scale: 0.92, duration: 1.6, scrollTrigger: { trigger: ".contact", start: "top 75%" } });

  /* ---------- Rodapé ---------- */
  gsap.from(".footer__brand > *", {
    y: 20, opacity: 0, duration: 1, stagger: 0.1,
    scrollTrigger: { trigger: ".footer", start: "top 92%" },
  });

  /* Recalcula depois que tudo carregar */
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
