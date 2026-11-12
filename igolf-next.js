/* iGolf By Space — per-person price check ([data-calc] cards). Static defaults render without JS. */
(function () {
  "use strict";
  document.querySelectorAll("[data-calc]").forEach(function (card) {
    var guests = parseInt(card.getAttribute("data-guests"), 10) || 4;
    var rate = parseInt(card.getAttribute("data-rate"), 10) || 80;
    var per = card.querySelector("[data-calc-per]");
    var bay = card.querySelector("[data-calc-rate]");
    var bayBox = card.querySelector("[data-calc-bay]");
    var groupBox = card.querySelector("[data-calc-group]");
    function render() {
      card.querySelectorAll("[data-set-guests]").forEach(function (b) {
        b.setAttribute("aria-pressed", parseInt(b.getAttribute("data-set-guests"), 10) === guests ? "true" : "false");
      });
      card.querySelectorAll("[data-set-rate]").forEach(function (b) {
        b.setAttribute("aria-pressed", parseInt(b.getAttribute("data-set-rate"), 10) === rate ? "true" : "false");
      });
      var group = guests > 6;
      if (groupBox) groupBox.hidden = !group;
      if (bayBox) bayBox.hidden = group;
      if (!group) {
        var each = rate / guests;
        if (per) per.textContent = "$" + (each % 1 === 0 ? each : each.toFixed(2));
        if (bay) bay.textContent = "$" + rate;
      }
    }
    card.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button");
      if (!b || !card.contains(b)) return;
      if (b.hasAttribute("data-set-guests")) guests = parseInt(b.getAttribute("data-set-guests"), 10);
      else if (b.hasAttribute("data-set-rate")) rate = parseInt(b.getAttribute("data-set-rate"), 10);
      else return;
      render();
      (window.dataLayer = window.dataLayer || []).push({ event: "price_check", guests: guests, bay_rate: rate, page_path: location.pathname });
    });
    render();
  });
})();
