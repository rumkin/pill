var EVENTS = {
  onReady: 'pill:ready',
  onLoading: 'pill:loading',
  onUnmounting: 'pill:unmounting',
  onMounting: 'pill:mounting',
  onError: 'pill:error',
}

function dispatchEvent(name, info) {
  var event = new CustomEvent(name, {
    detail: info,
  })
  document.dispatchEvent(event)
}

function shouldServeDefault(href) {
  return href.origin === location.origin
}

function createPage(title, content, status, timestamp) {
  return {
    title: title || '',
    content: content || '',
    status: status || 0,
    timestamp: timestamp || new Date(),
  }
}

function setContent(root, page) {
  document.title = page.title
  root.innerHTML = page.content
}

function fromResponse(selector, response, text) {
  var fragment = document.createDocumentFragment()
  var fragRoot = document.createElement('html')
  fragment.appendChild(fragRoot)
  fragRoot.innerHTML = text

  var title = fragRoot.querySelector('title').textContent
  var root = fragRoot.querySelector(selector)
  var content = root ? root.innerHTML : ''

  return {title: title, content: content}
}

function updateState(state, url, title, push) {
  if (push) {
    history.pushState(state || {}, title, url)
  }
  else {
    history.replaceState(state || {}, title, url)
  }
}

function defaultErrorHandler() {
  return {
    title: 'Error',
    content: '<h1>Error</h1><p>Ooops. Something went wrong</p>',
    code: 500,
    timestamp: new Date(),
  }
}

function scrollToAnchor(name) {
  requestAnimationFrame(function () {
    var anchor
    if (name in document.anchors) {
      anchor = document.anchors[name]
    }
    else {
      anchor = document.getElementById(anchor)
    }

    if (anchor) {
      anchor.scrollIntoView(true)
    }
  })
}

function noop() {}

function normalizePathname(pathname) {
  return '/' + pathname.replace(/\/+/g, '/').replace(/^\/|\/$/g, '')
}

function keyFromUrlDefault(url) {
  return normalizePathname(url.pathname) + url.search
}

// Determine wether click is a new tab opening click.
var hasModifierOn = /(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/.test(navigator.platform)
  ? function hasModifierOn(event) {
    return event.metaKey
  }
  : function hasModifierOn(event) {
    return event.ctrlKey
  }

export default function pill(selector, options) {
  if (typeof window.history.pushState !== 'function') {
    return
  }
  options = options || {}
  var onReady = options.onReady || noop
  var onLoading = options.onLoading || noop
  var onUnmounting = options.onUnmounting || noop
  var onMounting = options.onMounting || noop
  var onError = options.onError || console.error.bind(console)
  var keyFromUrl = options.keyFromUrl || keyFromUrlDefault
  var fromError = options.fromError || defaultErrorHandler
  var shouldServe = options.shouldServe || shouldServeDefault
  var shouldReload = options.shouldReload || noop

  var current = 0
  var isLoading = false

  var element = document.querySelector(selector)
  if (!element) {
    throw new Error('Element "' + selector + '" not found')
  }
  var currentUrl = new URL(document.location)
  var currentPage = createPage(document.title, element.innerHTML, 200)
  var cache = {}
  cache[keyFromUrl(currentUrl)] = currentPage

  function render(url, page, push) {
    dispatchEvent(EVENTS.onUnmounting, {
      page,
      url,
      element,
    })
    onUnmounting(page, url, element)
    updateState(null, url, page.title, push)
    dispatchEvent(EVENTS.onMounting, {
      page,
      url,
      element,
    })
    onMounting(page, url, element)
    setContent(element, page)
    dispatchEvent(EVENTS.onReady, {
      page,
      url,
      element,
    })
    onReady(page, element)
    if (push && url.hash.length > 1) {
      scrollToAnchor(url.hash.slice(1))
    }
  }

  // Initial scroll
  updateState({scrollX: window.scrollX, scrollY: window.scrollY}, currentUrl, currentPage.title, false)

  function goto(url, push) {
    var cacheKey = keyFromUrl(url)
    if (cacheKey in cache) {
      var cachedPage = cache[cacheKey]

      if (shouldReload(cachedPage) !== true) {
        render(url, cachedPage, push)

        return
      }
    }

    updateState(null, url, url, push)

    var requestId = ++current

    fetch(url)
    .then(function (res) {
      return res.text()
      .then(function (text) {
        return {
          res: res,
          text: text,
        }
      })
    })
    .finally(function () {
      isLoading = false
    })
    .then(function (result) {
      var res = result.res
      var text = result.text

      var page = fromResponse(selector, res, text)

      cache[cacheKey] = page

      page.status = res.status
      page.timestamp = new Date()

      if (requestId !== current) {
        return
      }
      render(url, page, false)
    })
    .catch(function (error) {
      if (requestId === current) {
        var page = fromError(error)
        render(url, page, false)
      }

      throw error
    })
    // Handle errors, including received from previous requesterror handling
    .catch(function (error) {
      dispatchEvent(EVENTS.onError, {
        url,
        element,
        error,
      })
      onError(error)
    })

    isLoading = true
    dispatchEvent(EVENTS.onLoading, {
      url,
      element,
    })
    onLoading(url)
  }

  function onClick(event) {
    if (hasModifierOn(event)) {
      return
    }

    var target = event.target
    var isLink = false
    while (target !== document.body) {
      if (target.nodeName === 'A') {
        isLink = true
        break
      }
      target = target.parentNode
    }

    if (!isLink) {
      return
    }

    var url = new URL(target.href, document.location)

    if (!shouldServe(url, target)) {
      return
    }

    event.preventDefault()

    window.scrollTo(0, 0)
    goto(url, !isLoading)
  }

  function onPopState(event) {
    goto(new URL(document.location), false)
    requestAnimationFrame(function () {
      var scrollY = 0
      var scrollX = 0

      if (event.state) {
        scrollX = event.state.scrollX
        scrollY = event.state.scrollY
      }

      window.scrollTo(scrollX, scrollY)
    })
  }

  var scrollDebounceTimeout
  function onScroll() {
    if (scrollDebounceTimeout) {
      return
    }

    scrollDebounceTimeout = setTimeout(function () {
      updateState({scrollX: window.scrollX, scrollY: window.scrollY}, document.location, document.title, false)
      scrollDebounceTimeout = null
    }, 100)
  }

  document.body.addEventListener('click', onClick)
  window.addEventListener('popstate', onPopState)
  window.addEventListener('scroll', onScroll)
}
