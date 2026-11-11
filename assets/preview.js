const controls = document.querySelector('.preview-controls');
const tabs = Array.from(controls.querySelectorAll('[role="tab"]'));
const panel = document.querySelector('#preview-content');
const image = document.querySelector('#preview-image');
const fullImage = document.querySelector('#preview-full');
const label = document.querySelector('#preview-label');

const views = {
  day: ['assets/my-day.png', 1600, 1062, image.alt],
  focus: ['assets/tasks-focus.png', 1440, 956, 'The Tasks and Focus screen with a prioritized task list next to the Pomodoro timer.'],
  insights: ['assets/insights.png', 1440, 1104, 'Focus Insights with daily focus time, totals, and completed sessions.'],
};

function showView(tab) {
  const [source, width, height, alt] = views[tab.dataset.view];
  for (const option of tabs) {
    const selected = option === tab;
    option.setAttribute('aria-selected', String(selected));
    option.tabIndex = selected ? 0 : -1;
  }
  label.textContent = tab.textContent;
  panel.setAttribute('aria-labelledby', tab.id);
  image.width = width;
  image.height = height;
  image.alt = alt;
  image.src = source;
  fullImage.href = source;
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
