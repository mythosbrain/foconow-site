const controls = document.querySelector('.preview-controls');
const tabs = Array.from(controls.querySelectorAll('[role="tab"]'));
const panel = document.querySelector('#preview-content');
const image = document.querySelector('#preview-image');
const fullImage = document.querySelector('#preview-full');
const label = document.querySelector('#preview-label');
const description = document.querySelector('#preview-description');
const views = {
  focus: { file: 'tasks-focus', title: 'Tasks & Focus', alt: 'FocoNow Tasks and Focus, with a prioritized task list and a Pomodoro timer in a dark glass interface.', caption: 'A clear plan. One next step. Everything you need to get going.' },
  day: { file: 'my-day', title: 'My Day', alt: 'The My Day screen with daily targets, priorities, and a short evening review.', caption: 'Start with an intention. End with a little perspective.' },
  room: { file: 'focus-room', title: 'Focus Space', alt: 'The distraction-free Focus Space with a large timer and the current task.', caption: 'Let everything else fade out. Give one thing your full attention.' },
  insights: { file: 'insights', title: 'Insights', alt: 'Focus Insights showing daily focus hours, completed tasks, and session history with sample data.', caption: 'See your focus hours and the small sessions adding up.' },
};
function showView(tab) {
  const view = views[tab.dataset.view];
  for (const option of tabs) {
    const selected = option === tab;
    option.setAttribute('aria-selected', String(selected));
    option.tabIndex = selected ? 0 : -1;
  }
  label.textContent = view.title;
  description.textContent = view.caption;
  panel.setAttribute('aria-labelledby', tab.id);
  image.alt = view.alt;
  image.src = `assets/${view.file}-preview.jpg`;
  fullImage.href = `assets/${view.file}.png`;
}
panel.setAttribute('role', 'tabpanel');
showView(tabs[0]);
controls.hidden = false;
controls.addEventListener('click', event => {
  const tab = event.target.closest('[role="tab"]');
  if (tab) showView(tab);
});
controls.addEventListener('keydown', event => {
  const index = tabs.indexOf(event.target);
  if (index < 0) return;
  let next;
  switch (event.key) {
    case 'ArrowRight': next = (index + 1) % tabs.length; break;
    case 'ArrowLeft': next = (index - 1 + tabs.length) % tabs.length; break;
    case 'Home': next = 0; break;
    case 'End': next = tabs.length - 1; break;
    default: return;
  }
  event.preventDefault();
  showView(tabs[next]);
  tabs[next].focus();
});

// One motion preference controls the entire spatial experience.
const root = document.documentElement;
const motionButtons = [...document.querySelectorAll('.motion-toggle')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const surfaces = [...document.querySelectorAll('.depth-surface')];
const previewStage = document.querySelector('.preview-stage');
const appWindow = document.querySelector('.app-window');
const targets = [appWindow, ...surfaces];
const visibleSurfaces = new Set();
const frames = new Map();
let scrollFrame = 0;
let motionPaused = false;
try { motionPaused = localStorage.getItem('foconow-site-motion') === 'paused'; } catch {}

function resetTarget(target) {
  cancelAnimationFrame(frames.get(target) || 0);
  frames.delete(target);
  for (const property of ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y', '--glare']) target.style.removeProperty(property);
}
function resetAll() {
  targets.forEach(resetTarget);
  cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  surfaces.forEach(surface => surface.style.removeProperty('--depth-scroll'));
  root.style.removeProperty('--space-y');
}
function updateMotion() {
  const disabled = motionPaused || reducedMotion.matches;
  root.dataset.motion = disabled || document.hidden ? 'off' : 'on';
  for (const button of motionButtons) {
    button.disabled = reducedMotion.matches;
    button.setAttribute('aria-pressed', String(disabled));
    button.querySelector('.motion-label').textContent = reducedMotion.matches
      ? 'Reduced motion' : motionPaused ? 'Play motion' : 'Pause motion';
    button.querySelector('.motion-symbol').textContent = disabled ? '▷' : 'Ⅱ';
    button.title = button.querySelector('.motion-label').textContent;
  }
  if (root.dataset.motion === 'off') resetAll();
  else updateDepth();
}
for (const button of motionButtons) {
  button.hidden = false;
  button.addEventListener('click', () => {
    motionPaused = !motionPaused;
    try { localStorage.setItem('foconow-site-motion', motionPaused ? 'paused' : 'playing'); } catch {}
    updateMotion();
  });
}
reducedMotion.addEventListener('change', updateMotion);
finePointer.addEventListener('change', resetAll);
document.addEventListener('visibilitychange', updateMotion);
window.addEventListener('blur', resetAll);
window.addEventListener('resize', resetAll, { passive: true });

function attachTilt(stage, target, strength) {
  stage.addEventListener('pointerleave', () => resetTarget(target));
  stage.addEventListener('pointercancel', () => resetTarget(target));
  stage.addEventListener('focusin', () => resetTarget(target));
  stage.addEventListener('pointermove', event => {
    if (root.dataset.motion !== 'on' || !finePointer.matches || event.pointerType === 'touch') return;
    cancelAnimationFrame(frames.get(target) || 0);
    const { clientX, clientY } = event;
    frames.set(target, requestAnimationFrame(() => {
      const bounds = stage.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height));
      target.style.setProperty('--tilt-x', `${(0.5 - y) * strength}deg`);
      target.style.setProperty('--tilt-y', `${(x - 0.5) * strength}deg`);
      target.style.setProperty('--glare-x', `${x * 100}%`);
      target.style.setProperty('--glare-y', `${y * 100}%`);
      target.style.setProperty('--glare', '1');
      frames.delete(target);
    }));
  });
}
attachTilt(previewStage, appWindow, 4);
surfaces.forEach(surface => attachTilt(surface, surface, surface.matches('.feature-card') ? 8 : 4));

function updateDepth() {
  if (scrollFrame || root.dataset.motion !== 'on' || !finePointer.matches) return;
  scrollFrame = requestAnimationFrame(() => {
    // Read all geometry first, then write: no continuous rendering loop.
    const positions = [...visibleSurfaces].map(surface => {
      const bounds = surface.getBoundingClientRect();
      const distance = (bounds.top + bounds.height / 2 - innerHeight / 2) / innerHeight;
      return [surface, Math.max(-7, Math.min(7, distance * 10))];
    });
    for (const [surface, offset] of positions) surface.style.setProperty('--depth-scroll', `${offset}px`);
    root.style.setProperty('--space-y', `${-Math.min(scrollY, 6000) * 0.015}px`);
    scrollFrame = 0;
  });
}
window.addEventListener('scroll', updateDepth, { passive: true });
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target.matches('.hero-art')) root.dataset.heroVisible = String(entry.isIntersecting);
      else {
        entry.target.dataset.visible = String(entry.isIntersecting);
        if (entry.isIntersecting) visibleSurfaces.add(entry.target);
        else { visibleSurfaces.delete(entry.target); resetTarget(entry.target); }
      }
    }
    updateDepth();
  }, { rootMargin: '40px' });
  observer.observe(document.querySelector('.hero-art'));
  surfaces.forEach(surface => observer.observe(surface));
}
updateMotion();

// Copy visible text only; opening Terminal and running it are the user's actions.
const commandField = document.querySelector('#launch-command');
const copyButton = document.querySelector('.copy-command');
const copyStatus = document.querySelector('#copy-status');
if (commandField && copyButton && copyStatus) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(commandField.value);
      copyButton.textContent = 'Copied ✓';
      copyStatus.textContent = 'Copied. Open Terminal, paste with ⌘ V, then press Return.';
    } catch {
      commandField.focus({ preventScroll: true });
      commandField.select();
      copyButton.textContent = 'Copy command';
      copyStatus.textContent = 'Command selected. Press ⌘ C to copy, then paste it in Terminal.';
    }
  });
}
