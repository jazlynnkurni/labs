/* ============================================================================
 * site-mark.js  the jaz mark as a component.
 *
 * Drop it in the head once and use the element anywhere:
 *     <site-mark></site-mark>            the mark, on the home page
 *     <site-mark href="/"></site-mark>   the mark as the way home
 *
 * It stands alone at the head's left: the mark carries the name. The mark is
 * her signature, jazlynn in a brush pen, drawn in the sign lab. Two files,
 * ink for paper and paper for charcoal, both in the DOM so the swap is instant. Loaded
 * from the head so it paints styled without a flash. Keep the tag empty.
 * ========================================================================= */
(function () {
  'use strict';
  /* the mark is her signature, drawn with a brush pen in the sign lab. Two files, ink for
     paper and paper for charcoal, both in the DOM so the mode swap is instant. */
  var script = document.currentScript;
  var base = script && script.src ? new URL('.', script.src).href : new URL('.', document.baseURI).href;
  function img(id, file) {
    return '<img class="sm-' + id + '" src="' + base + file + '?v=ox1" alt="" aria-hidden="true" draggable="false">';
  }
  if (!document.getElementById('site-mark-styles')) {
    var st = document.createElement('style');
    st.id = 'site-mark-styles';
    st.textContent =
      'site-mark{display:inline-block;line-height:0;pointer-events:auto}' +
      'site-mark .sm{display:inline-block;text-decoration:none;line-height:0}' +
      'site-mark{position:relative}' +
      /* THE REVEAL. Hover the name: it settles back a little and the line drops out from
         under it, on the site's spring. The text is not in the flow, so nothing else moves. */
      'site-mark img{display:block;height:clamp(28px,2.6vw,38px);width:auto;-webkit-user-drag:none;transform-origin:left center;' +
        'transition:transform .46s cubic-bezier(.33,1.18,.37,1)}' +
      'site-mark:hover img{transform:scale(.9)}' +
      /* it drops over the wall, so it sits on the nav's own pill: paper lifted, the same
         shadow as the links, never a border */
      'site-mark .sm-blurb{position:absolute;left:-14px;top:calc(100% + 8px);width:max-content;max-width:min(44ch,calc(100vw - 60px));margin:0;' +
        'padding:12px 16px;border-radius:14px;background:var(--pill,#fff);box-shadow:var(--pill-shadow,0 6px 20px rgba(20,23,27,.07));' +
        'font:400 13.5px/1.55 "Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink2,rgba(20,23,27,.66));pointer-events:none;' +
        'opacity:0;transform:translateY(-8px);clip-path:inset(0 0 100% 0);' +
        'transition:opacity .3s ease,transform .5s cubic-bezier(.22,1,.36,1),clip-path .5s cubic-bezier(.22,1,.36,1)}' +
      'site-mark:hover .sm-blurb{opacity:1;transform:none;clip-path:inset(0 0 -20% 0);transition-delay:.06s}' +
      'site-mark .sm-blurb b span{display:inline;margin:0}' +
      'site-mark .sm-blurb b,site-mark .sm-blurb span{display:block}' +
      'site-mark .sm-blurb span{margin-top:3px}' +
      'site-mark .sm-blurb b{font-weight:400;color:var(--ink,#14171B);margin-bottom:6px}' +
      'html[data-theme="dark"] site-mark .sm-blurb{outline:1px solid var(--outline,rgba(255,255,255,.1));outline-offset:-1px}' +
      'site-mark .sm-paper{display:none}' +
      'html[data-theme="dark"] site-mark .sm-ink{display:none}' +
      'html[data-theme="dark"] site-mark .sm-paper{display:block}';
    document.head.appendChild(st);
  }
  function markup(el) {
    var href = el.getAttribute('href');
    var inner = img('ink', 'jaz-signature.svg') + img('paper', 'jaz-signature-paper.svg');
    /* four facts, four rows: what she does, where she is, where she was, where she studies */
    var blurb = '<p class="sm-blurb"><b><span style="color:#A99939">Design engineer</span> who creates <span style="color:#A99939">charming products</span>.</b>' +
      '<span>Prev @ Manus AI.</span>' +
      '<span>HCI @ Columbia University \u201927.</span></p>';
    return href
      ? '<a class="sm" href="' + href + '" aria-label="Home, Jazlynn">' + inner + '</a>' + blurb
      : '<span class="sm" role="img" aria-label="Jazlynn">' + inner + '</span>' + blurb;
  }
  if (window.customElements && !customElements.get('site-mark')) {
    customElements.define('site-mark', class extends HTMLElement {
      connectedCallback() {
        if (this.__r) return; this.__r = true; this.innerHTML = markup(this);
        /* the page may want to make room under the line: it is told when the line shows
           and where its foot is, and again when it goes */
        var el = this, blurb = el.querySelector('.sm-blurb');
        var say = function (on) { el.dispatchEvent(new CustomEvent('markpeek', { bubbles: true, detail: { on: on, bottom: blurb ? blurb.getBoundingClientRect().bottom : 0 } })); };
        el.addEventListener('pointerenter', function () { say(true); });
        el.addEventListener('pointerleave', function () { say(false); });
      }
    });
  }
})();
