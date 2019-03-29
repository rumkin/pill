const indicator = document.getElementById('indicator');

let timeout = 0;

pill('#page', {
  onLoading() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = 0
    }

    addClass(indicator, 'is-loading');
    indicator.style.display = 'block';
  },
  onReady() {
    timeout = setTimeout(() => {
      removeClass(indicator, 'is-loading')
      indicator.style.display = 'none';
    }, 2000)
  }
})

function addClass(target, className) {
  target.className = target.className.trim().split(/\s+/)
  .concat(className)
  .join(' ');
}

function removeClass(indicator, className) {
  indicator.className = indicator.className.trim().split(/\s+/)
  .filter(item => item !== className)
  .join(' ');
}
