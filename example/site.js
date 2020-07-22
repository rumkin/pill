const indicator = document.getElementById('indicator')

let timeout = 0
pill('#page', {
  onLoading() {

    if (timeout) {
      clearTimeout(timeout)
      timeout = 0
    }

    indicator.style.display = 'block'
  },
  onUnmounting(page, url, element) {
    PreserveFormPlugin(element)
  },
  onReady(page, element) {
    // Delay to simulate long content loading
    timeout = setTimeout(() => {
      indicator.style.display = 'none'
    }, 1000)
    PopulateFormPlugin(element)
  },
  onMounting() {
    console.log('updating content')
  }
})

const PopulateFormPlugin = element =>{
  const key = location.pathname;
  const fields = Array.from(element.querySelectorAll('input, textarea, select'))
  if (fields.length > 0) {
    const obj = JSON.parse(localStorage.getItem(key) || '[]')
    obj.forEach((field) => {
      const input = document.querySelector('[name=' + field.fieldName + ']')
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = field.value
      } else if (input.nodeName === 'TEXTAREA') {
        input.textContent = field.value
      } else {
        input.value = field.value
      }
    })
  }
}

const PreserveFormPlugin = (element) =>{
  const key = location.pathname
  const fields = Array.from(element.querySelectorAll('input, textarea, select'))
  if (fields.length > 0) {
    const values = fields.map((val) => {
      return {
        fieldName: val.name,
        value: val.type == 'checkbox' || val.type == 'radio' ? val.checked : val.value
      }
    })
    localStorage.setItem(key, JSON.stringify(values))
  }
}
