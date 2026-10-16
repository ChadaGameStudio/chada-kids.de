(() => {
  'use strict';
  const copy = window.SITE_COPY;
  if (!copy) return;
  const supported = window.SITE_LANGUAGE.supported;
  let language = window.SITE_LANGUAGE.initial();
  let activeView = 'today';
  let lightboxKey = null;
  let previousOverflow = '';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const t = (key) => copy[language][key] || copy.de[key] || '';
  const audio = $('#brand-audio');
  const audioButton = $('#audio-button');
  const dialog = $('#screenshot-dialog');
  const video = $('#product-video');
  const videoToggle = $('#video-toggle');
  const videoOverlay = $('#video-overlay');
  const videoStatus = $('#video-status');
  let videoRequest = 0;
  let musicRequest = 0;
  let videoStarted = false;
  const titleCase = (value) => value[0].toUpperCase() + value.slice(1);
  const altKey = (key) => 'alt' + key.split('-').map(titleCase).join('');
  const screenshotPath = (key) => `assets/screenshots/${language}/${key}.jpg?v=20261016-cycle-final`;
  const videoPath = (file) => `assets/videos/${language}/${file}?v=20261016-videos`;
  function updateAudio() {
    audioButton.setAttribute('aria-pressed', String(!audio.paused));
    audioButton.setAttribute('aria-label', t(audio.paused ? 'musicPlay' : 'musicPause'));
  }
  function updateVideo() {
    const playing = !video.paused && !video.ended;
    const label = t(playing ? 'videoPause' : 'videoPlay');
    videoToggle.dataset.playing = String(playing);
    videoToggle.setAttribute('aria-label', label);
    $('#video-toggle-label').textContent = label;
    videoOverlay.setAttribute('aria-label', t('videoPlay'));
    videoOverlay.hidden = videoStarted && !video.ended;
  }
  function clearVideoSource() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.controls = false;
    video.tabIndex = -1;
    videoStarted = false;
  }
  function resetVideoLanguage() {
    videoRequest += 1;
    clearVideoSource();
    video.dataset.src = videoPath('product-film.mp4');
    video.poster = videoPath('poster.jpg');
    $('#video-download').href = video.dataset.src;
    $('#video-download').download = `1plus1-3-product-film-${language}.mp4`;
    videoStatus.textContent = '';
    updateVideo();
  }
  function videoFailed() {
    const moveFocus = document.activeElement === video;
    clearVideoSource();
    videoStatus.textContent = t('videoError');
    updateVideo();
    if (moveFocus) videoOverlay.focus({ preventScroll: true });
  }
  async function toggleVideo() {
    const request = ++videoRequest;
    if (!video.paused && !video.ended) {
      video.pause();
      updateVideo();
      return;
    }
    musicRequest += 1;
    audio.pause();
    updateAudio();
    videoStatus.textContent = '';
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.controls = true;
    video.tabIndex = 0;
    videoStarted = true;
    const moveFocus = document.activeElement === videoOverlay;
    try {
      const playback = video.play();
      updateVideo();
      if (moveFocus) video.focus({ preventScroll: true });
      await playback;
      if (request === videoRequest) updateVideo();
    } catch (error) {
      // A pause, source reset or newer play request intentionally aborts the old promise.
      if (request !== videoRequest || error.name === 'AbortError') return;
      videoFailed();
    }
  }
  function renderView() {
    const key = activeView;
    $('#preview-image').src = screenshotPath(key);
    $('#preview-image').alt = t(altKey(key));
    $('#preview-button').dataset.screenshot = key;
    $('#app-preview').setAttribute('aria-labelledby', `tab-${activeView}`);
    $('#view-title').textContent = t(`${activeView}Title`);
    $('#view-description').textContent = t(`${activeView}Description`);
    $$('[data-view]').forEach((button) => {
      const selected = button.dataset.view === activeView;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }
  function setLanguage(next) {
    if (!supported.includes(next)) return;
    language = next;
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    $('meta[name="description"]').content = t('metaDescription');
    $('meta[property="og:title"]').content = t('pageTitle');
    $('meta[property="og:description"]').content = t('metaDescription');
    $('#language-select').value = language;
    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    $$('[data-i18n-alt]').forEach((node) => { node.alt = t(node.dataset.i18nAlt); });
    $$('[data-screenshot-image]').forEach((node) => { node.src = screenshotPath(node.dataset.screenshotImage); });
    $$('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
    $$('[data-legal]').forEach((node) => { node.href = `${node.dataset.legal}?lang=${encodeURIComponent(language)}`; });
    try { localStorage.setItem('lang', language); } catch (_) { /* Language still works without storage. */ }
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lang', language);
    window.history.replaceState(window.history.state, '', currentUrl);
    if (lightboxKey) {
      $('#lightbox-image').src = screenshotPath(lightboxKey);
      $('#lightbox-image').alt = t(altKey(lightboxKey));
    }
    $('#audio-status').textContent = '';
    resetVideoLanguage();
    renderView();
    updateAudio();
  }
  $('#language-select').addEventListener('change', (event) => setLanguage(event.target.value));
  const tabs = $$('[data-view]');
  const mobileTabs = window.matchMedia('(max-width: 600px)');
  const updateTabOrientation = () => $('#view-tabs').setAttribute('aria-orientation', mobileTabs.matches ? 'horizontal' : 'vertical');
  mobileTabs.addEventListener('change', updateTabOrientation);
  updateTabOrientation();
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { activeView = tab.dataset.view; renderView(); });
    tab.addEventListener('keydown', (event) => {
      const directions = { ArrowRight: (index + 1) % tabs.length, ArrowDown: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, ArrowUp: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in directions)) return;
      event.preventDefault();
      const next = tabs[directions[event.key]];
      activeView = next.dataset.view;
      renderView();
      next.focus();
    });
  });
  $$('[data-screenshot]').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.screenshot;
    if (!/^(today|period|calendar)$/.test(key)) return;
    lightboxKey = key;
    $('#lightbox-image').src = screenshotPath(key);
    $('#lightbox-image').alt = t(altKey(key));
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }));
  $('#screenshot-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; lightboxKey = null; });
  audioButton.addEventListener('click', async () => {
    const request = ++musicRequest;
    $('#audio-status').textContent = '';
    if (!audio.paused) { audio.pause(); return; }
    videoRequest += 1;
    video.pause();
    updateVideo();
    try { await audio.play(); } catch (error) {
      if (request === musicRequest && error.name !== 'AbortError') $('#audio-status').textContent = t('musicUnavailable');
    }
    updateAudio();
  });
  audio.addEventListener('play', () => {
    if (audio.paused) return;
    videoRequest += 1;
    video.pause();
    updateVideo();
    updateAudio();
  });
  audio.addEventListener('pause', updateAudio);
  audio.addEventListener('error', () => { updateAudio(); $('#audio-status').textContent = t('musicUnavailable'); });
  videoToggle.addEventListener('click', toggleVideo);
  videoOverlay.addEventListener('click', toggleVideo);
  video.addEventListener('play', () => {
    if (video.paused) return;
    musicRequest += 1;
    audio.pause();
    videoStarted = true;
    updateAudio();
    updateVideo();
  });
  video.addEventListener('pause', updateVideo);
  video.addEventListener('ended', updateVideo);
  video.addEventListener('error', () => {
    if (!video.getAttribute('src') || !video.error) return;
    videoRequest += 1;
    videoFailed();
  });
  setLanguage(language);
})();
