const indicator = document.getElementById('indicator');

let timeout = 0;
pill('#page', {
  onLoading() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = 0
    }

    indicator.style.display = 'block';
  },
  onReady() {
    timeout = setTimeout(() => {
      indicator.style.display = 'none';
    }, 1000)
  }
})
