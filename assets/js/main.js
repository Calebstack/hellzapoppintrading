const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#primary-nav");
const navDropdowns = document.querySelectorAll(".nav-dropdown");
const mobileNavigation = window.matchMedia("(max-width: 880px)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let pageNavigationPending = false;

function setMenuOpen(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  siteNav.classList.toggle("is-open", isOpen);
  siteNav.inert = mobileNavigation.matches && !isOpen;
  document.body.classList.toggle("menu-open", isOpen);

  if (!isOpen) navDropdowns.forEach((dropdown) => { dropdown.open = false; });
}

siteNav.inert = mobileNavigation.matches && menuToggle.getAttribute("aria-expanded") !== "true";
mobileNavigation.addEventListener("change", (event) => {
  siteNav.inert = event.matches && menuToggle.getAttribute("aria-expanded") !== "true";
});

menuToggle.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    setMenuOpen(false);
    return;
  }

  if (!event.target.closest(".nav-dropdown > summary")) {
    navDropdowns.forEach((dropdown) => {
      if (!dropdown.contains(event.target)) dropdown.open = false;
    });
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-dropdown")) {
    navDropdowns.forEach((dropdown) => { dropdown.open = false; });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    navDropdowns.forEach((dropdown) => { dropdown.open = false; });
    if (menuToggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuToggle.focus();
    }
  }
});

document.addEventListener("click", (event) => {
  if (prefersReducedMotion || pageNavigationPending || event.defaultPrevented || event.button !== 0) return;

  const link = event.target.closest("a[href]");
  if (!link || link.hasAttribute("download") || link.target && link.target !== "_self") return;

  const destination = new URL(link.href, window.location.href);
  const current = new URL(window.location.href);
  if (destination.origin !== current.origin || destination.protocol !== current.protocol) return;
  if (destination.pathname === current.pathname && destination.search === current.search) return;

  event.preventDefault();
  pageNavigationPending = true;
  document.documentElement.classList.add("page-leaving");
  window.setTimeout(() => window.location.assign(destination.href), 170);
});

window.addEventListener("pageshow", () => {
  pageNavigationPending = false;
  document.documentElement.classList.remove("page-leaving");
});

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const artworkInput = document.querySelector("#design-upload");
const selectedFiles = document.querySelector("#selected-files");

if (artworkInput && selectedFiles) {
  artworkInput.addEventListener("change", () => {
    const files = Array.from(artworkInput.files || []);
    selectedFiles.textContent = files.length
      ? `Selected: ${files.map((file) => file.name).join(", ")}. Attach these artwork files to your email too.`
      : "No files selected yet. If your email app opens, attach these files to your message.";
  });
}

const shopVideo = document.querySelector("#shop-video");
const videoPlayPrompt = document.querySelector("#video-play-prompt");
const videoSoundToggle = document.querySelector("#video-sound-toggle");

if (shopVideo && videoPlayPrompt) {
  const updateSoundToggle = () => {
    if (!videoSoundToggle) return;
    videoSoundToggle.hidden = !shopVideo.muted;
    videoSoundToggle.setAttribute("aria-label", shopVideo.muted ? "Turn video sound on" : "Mute video");
    videoSoundToggle.setAttribute("aria-pressed", String(!shopVideo.muted));
    videoSoundToggle.textContent = shopVideo.muted ? "♪ SOUND OFF · TURN ON" : "♪ SOUND ON · MUTE";
  };

  const playVideo = () => {
    shopVideo.muted = false;
    shopVideo.play().then(() => {
      videoPlayPrompt.hidden = true;
    }).catch((error) => {
      videoPlayPrompt.hidden = false;

      if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        videoPlayPrompt.querySelector(".video-play-prompt__copy small").textContent =
          "Unable to play this video here. Use the Vimeo link to watch it.";
      }
    });
  };

  const startVideoMuted = () => {
    shopVideo.muted = true;
    shopVideo.play().catch((error) => {
      videoPlayPrompt.hidden = false;

      if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        videoPlayPrompt.querySelector(".video-play-prompt__copy small").textContent =
          "Unable to play this video here. Use the Vimeo link to watch it.";
      }
    });
  };

  videoSoundToggle?.addEventListener("click", () => {
    shopVideo.muted = false;
    shopVideo.play().catch((error) => {
      videoPlayPrompt.hidden = false;

      if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        videoPlayPrompt.querySelector(".video-play-prompt__copy small").textContent =
          "Unable to play this video here. Use the Vimeo link to watch it.";
      }
    });
  });
  shopVideo.addEventListener("volumechange", updateSoundToggle);
  videoPlayPrompt.addEventListener("click", playVideo);
  shopVideo.addEventListener("play", () => {
    videoPlayPrompt.hidden = true;
  });
  shopVideo.addEventListener("error", () => {
    videoPlayPrompt.hidden = false;
    videoPlayPrompt.querySelector(".video-play-prompt__copy small").textContent =
      "Unable to play this video here. Use the Vimeo link to watch it.";
  });

  updateSoundToggle();
  startVideoMuted();
}

const quoteForm = document.querySelector("#quote-form");
const formMessage = document.querySelector("#form-message");

if (quoteForm) {
  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(quoteForm);
    const lines = [
      "HELLZAPOPPIN TRADING CO. — CUSTOM PRINT QUOTE REQUEST",
      `Prepared: ${new Date().toLocaleString()}`,
      "",
    ];

    for (const [name, value] of formData.entries()) {
      if (value instanceof File || value === "Yes" || !String(value).trim()) continue;
      lines.push(`${name}:\n${String(value).trim()}`, "");
    }

    const attachments = Array.from(artworkInput?.files || []);
    if (attachments.length) {
      lines.push("ARTWORK TO ATTACH:", ...attachments.map((file) => `- ${file.name} (${Math.ceil(file.size / 1024)} KB)`));
    }

    if (formData.get("Email newsletter")) lines.push("", "Newsletter signup: Yes");

    const brief = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const briefUrl = URL.createObjectURL(brief);
    const downloadLink = document.createElement("a");
    const safeName = String(formData.get("Name") || "customer")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    downloadLink.href = briefUrl;
    downloadLink.download = `hellzapoppin-quote-${safeName || "request"}.txt`;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(briefUrl), 1000);

    if (formMessage) {
      formMessage.hidden = false;
      formMessage.textContent = "Your quote brief has been downloaded. Your email app should open a message to Brittany—attach the downloaded brief and any artwork files before sending. If no email app opens, email Brittany@Hellzapoppin.com and attach your brief.";
    }

    const subject = encodeURIComponent(`Custom print quote — ${formData.get("Name")}`);
    const body = encodeURIComponent(
      "Hi Brittany,\n\nI've filled out the attached custom print quote brief. I've also attached any artwork referenced in my request.\n\nThank you!",
    );
    window.location.href = `mailto:Brittany@Hellzapoppin.com?subject=${subject}&body=${body}`;
  });
}

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
