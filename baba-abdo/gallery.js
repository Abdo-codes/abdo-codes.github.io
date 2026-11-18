(() => {
  const navigation = document.querySelector('.scene-tabs');
  const tabs = [...navigation.querySelectorAll('a')];
  const panels = tabs.map(tab => document.querySelector(tab.hash));
  if (panels.some(panel => !panel)) return;

  const select = index => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  };

  navigation.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(i);
      history.replaceState(null, '', tab.hash);
    });
    tab.addEventListener('keydown', event => {
      const forward = document.documentElement.dir === 'rtl' ? -1 : 1;
      let next;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === 'ArrowRight') next = (i + forward + tabs.length) % tabs.length;
      if (event.key === 'ArrowLeft') next = (i - forward + tabs.length) % tabs.length;
      if (next === undefined) return;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  });
  const matchLocation = () => {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    if (index !== -1) select(index);
  };
  select(0);
  matchLocation();
  window.addEventListener('hashchange', matchLocation);
  document.querySelector('.game').classList.add('enhanced');

  const box = document.querySelector('.lightbox');
  if (typeof box.showModal !== 'function') return;
  const enlarged = box.querySelector('img');
  document.querySelectorAll('.still').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      enlarged.src = link.href;
      enlarged.alt = link.querySelector('img').alt;
      box.showModal();
    });
  });
  box.addEventListener('click', event => {
    if (event.target !== box) return;
    const bounds = box.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) box.close();
  });
})();
