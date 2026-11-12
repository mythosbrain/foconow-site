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
