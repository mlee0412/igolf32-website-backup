/* Growth layer 2026-11-12: dataLayer click tracking + event inquiry submit to /api/inquiry (email fallback on failure) */
(function () {
  "use strict";
  window.dataLayer = window.dataLayer || [];
  function push(ev, extra) { var o = { event: ev, page_path: location.pathname }; for (var k in extra) o[k] = extra[k]; window.dataLayer.push(o); }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var h = a.getAttribute("href") || "", label = (a.textContent || "").trim().slice(0, 60);
    if (h.indexOf("book.igolf32.com") > -1 || h.indexOf("/booknow") === 0) push("booking_click", { link_text: label, link_url: h });
    else if (h.indexOf("tel:") === 0) push("phone_click", { link_text: label });
    else if (h.indexOf("square.link") > -1) push("membership_checkout_click", { link_text: label, link_url: h });
    else if (h.indexOf("events.html") > -1) push("event_cta_click", { link_text: label });
  }, true);
  var form = document.getElementById("event-inquiry-form"); if (!form) return;
  var status = form.querySelector(".inquiry-status");
  function show(msg, state) { status.hidden = false; status.setAttribute("data-state", state || "ok"); status.innerHTML = msg; }
  var btn = form.querySelector('button[type="submit"]');
  function mailtoFallback(v, reason) {
    var subject = "Event Inquiry — " + v("occasion") + " — " + v("name") + " (" + (v("date") || "date TBD") + ")";
    var body = ["Name: " + v("name"), "Phone: " + v("phone"), "Email: " + v("email"), "Date: " + v("date"), "Time: " + v("time"), "Party size: " + v("party"), "Occasion: " + v("occasion"), "", "Notes:", v("notes")].join("\n");
    var href = "mailto:hello@igolf32.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    push("event_inquiry_fallback", { reason: reason });
    show("We couldn&rsquo;t send your inquiry automatically, so we&rsquo;ve opened a pre-filled email &mdash; press <strong>Send</strong> to reach our events team. Nothing opened? <a href=\"" + href.replace(/"/g, "&quot;") + "\">Try again</a>, email <a href=\"mailto:hello@igolf32.com\">hello@igolf32.com</a> or call <a href=\"tel:+16468384004\">(646) 838-4004</a>.", "error");
    window.location.href = href;
  }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var v = function (n) { var f = form.elements[n]; return f && f.value ? f.value.trim() : ""; };
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var q = new URLSearchParams(location.search), payload = { website: v("website"), name: v("name"), phone: v("phone"), email: v("email"), date: v("date"), time: v("time"), party: v("party"), occasion: v("occasion"), notes: v("notes"), page: location.pathname + location.hash, referrer: document.referrer.slice(0, 300) };
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (k) { if (q.get(k)) payload[k] = q.get(k); });
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    var done = function () { if (btn) { btn.disabled = false; btn.textContent = "Send Inquiry"; } };
    if (!window.fetch) { done(); mailtoFallback(v, "no_fetch"); return; }
    fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        done();
        if (res.status === 201 && res.j.ok) {
          push("event_inquiry_submit", { occasion: v("occasion"), party_size: v("party"), method: "api" });
          form.reset();
          show("<strong>Thanks &mdash; your inquiry is in.</strong> Our events team will reply by email. Need us sooner? Call <a href=\"tel:+16468384004\">(646) 838-4004</a> or email <a href=\"mailto:hello@igolf32.com\">hello@igolf32.com</a>.");
        } else if (res.status === 422) {
          show("Please check: " + ((res.j.fields || []).join(", ") || "the highlighted fields") + ".", "error");
        } else if (res.status === 200 && res.j.ok) {
          show("Thanks.");
        } else { mailtoFallback(v, "http_" + res.status); }
      })
      .catch(function () { done(); mailtoFallback(v, "network"); });
  });
})();
