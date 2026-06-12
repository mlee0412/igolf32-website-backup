/* iGolf By Space — shared site behavior */
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");

  /* Header background after scroll */
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile navigation */
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Scroll-reveal */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Count-up stats: <span data-count="367" data-suffix="+"> */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if (!reduceMotion && "IntersectionObserver" in window) {
      var cio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              animateCount(e.target);
              cio.unobserve(e.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(function (el) {
        el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
      });
    }
  }

  /* Hero background video — mirrors the original Elementor hero:
     autoplay muted (mobile too), fade in over the poster photo, and
     loop the 0–70s segment. Falls back to the photo if no source loads. */
  var heroVideo = document.querySelector(".hero-media video");
  if (heroVideo) {
    var loopEnd = parseFloat(heroVideo.getAttribute("data-loop-end")) || 0;

    heroVideo.addEventListener("playing", function () {
      heroVideo.classList.add("is-playing");
    });

    if (loopEnd > 0) {
      heroVideo.addEventListener("timeupdate", function () {
        if (heroVideo.currentTime >= loopEnd) {
          heroVideo.currentTime = 0;
          heroVideo.play();
        }
      });
    }

    /* Remove only when EVERY <source> has failed (error on the last source
       or on the video element itself) so fallback sources still get tried. */
    var lastSource = heroVideo.querySelector("source:last-of-type");
    function dropVideo() {
      if (heroVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || heroVideo.error) {
        heroVideo.remove();
      }
    }
    heroVideo.addEventListener("error", dropVideo);
    if (lastSource) lastSource.addEventListener("error", function () { setTimeout(dropVideo, 0); });

    var p = heroVideo.play && heroVideo.play();
    if (p && p.catch) p.catch(function () { /* poster remains */ });
  }

  /* Reservation request form → opens a prefilled email (static site, no backend) */
  var form = document.getElementById("reserve-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = function (name) {
        var f = form.elements[name];
        return f && f.value ? f.value.trim() : "";
      };
      var subject = "Reservation Request — " + v("name") + " (" + v("date") + ")";
      var body = [
        "Name: " + v("name"),
        "Phone: " + v("phone"),
        "Email: " + v("email"),
        "Date: " + v("date"),
        "Time: " + v("time"),
        "Party size: " + v("party"),
        "Occasion: " + v("occasion"),
        "",
        "Notes:",
        v("notes")
      ].join("\n");
      window.location.href =
        "mailto:hello@igolf32.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
    });
  }

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
