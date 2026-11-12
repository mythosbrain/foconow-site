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

// Decorative motion stays optional and never runs against the system preference.
const root = document.documentElement;
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const previewStage = document.querySelector('.preview-stage');
const appWindow = document.querySelector('.app-window');
let motionPaused = false;
try { motionPaused = localStorage.getItem('foconow-site-motion') === 'paused'; } catch {}
let tiltFrame = 0;

function resetTilt() {
  cancelAnimationFrame(tiltFrame);
  tiltFrame = 0;
  for (const property of ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y', '--glare']) {
    appWindow.style.removeProperty(property);
  }
}
function updateMotion() {
  const disabled = motionPaused || reducedMotion.matches;
  root.dataset.motion = disabled || document.hidden ? 'off' : 'on';
  motionButton.disabled = reducedMotion.matches;
  motionButton.setAttribute('aria-pressed', String(disabled));
  motionButton.querySelector('.motion-label').textContent = reducedMotion.matches
    ? 'Reduced motion' : motionPaused ? 'Play motion' : 'Pause motion';
  motionButton.querySelector('.motion-symbol').textContent = disabled ? '▷' : 'Ⅱ';
  if (root.dataset.motion === 'off') resetTilt();
}
motionButton.hidden = false;
motionButton.addEventListener('click', () => {
  motionPaused = !motionPaused;
  try { localStorage.setItem('foconow-site-motion', motionPaused ? 'paused' : 'playing'); } catch {}
  updateMotion();
});
reducedMotion.addEventListener('change', updateMotion);
finePointer.addEventListener('change', resetTilt);
document.addEventListener('visibilitychange', updateMotion);
window.addEventListener('blur', resetTilt);
window.addEventListener('resize', resetTilt, { passive: true });
previewStage.addEventListener('pointerleave', resetTilt);
previewStage.addEventListener('pointercancel', resetTilt);
previewStage.addEventListener('pointermove', event => {
  if (root.dataset.motion !== 'on' || !finePointer.matches || event.pointerType === 'touch') return;
  cancelAnimationFrame(tiltFrame);
  const { clientX, clientY } = event;
  tiltFrame = requestAnimationFrame(() => {
    const bounds = previewStage.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height));
    appWindow.style.setProperty('--tilt-x', `${(0.5 - y) * 4}deg`);
    appWindow.style.setProperty('--tilt-y', `${(x - 0.5) * 4}deg`);
    appWindow.style.setProperty('--glare-x', `${x * 100}%`);
    appWindow.style.setProperty('--glare-y', `${y * 100}%`);
    appWindow.style.setProperty('--glare', '1');
    tiltFrame = 0;
  });
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    root.dataset.heroVisible = String(entries[0].isIntersecting);
  });
  observer.observe(document.querySelector('.hero-art'));
}
updateMotion();
