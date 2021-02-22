function sleep(r) {
  const sec = r * Math.random()
  let objDef = new $.Deferred()
  setTimeout(function () {
    objDef.resolve(sec)
  }, sec * 1000)
  return objDef.promise()
}

function selectRandom(array, num) {
  let newArray = []

  while (newArray.length < num && array.length > 0) {
    const rand = Math.floor(Math.random() * array.length)
    newArray.push(array[rand])
    array.splice(rand, 1)
  }

  return newArray
}

function getHashParams() {
  let hashParams = {}
  let e,
    r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1)
  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2])
  }
  return hashParams
}

function sliceByNumber(array, number) {
  const length = Math.ceil(array.length / number)
  return new Array(length).fill().map((_, i) =>
    array.slice(i * number, (i + 1) * number)
  )
}

// Tokenをリフレッシュする
function refleshToken(refreshToken) {
  return new Promise(function (resolve) {
    $.ajax({
      url: '/refresh_token',
      data: {
        refresh_token: refreshToken
      }
    }).then((response) => resolve(response))
  })
}

// ユーザの情報を取得する
function getUserInfo(accessToken) {
  return new Promise(function (resolve) {
    $.ajax({
      url: encodeURI('https://api.spotify.com/v1/me'),
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }).then((response) => resolve(response))
  })
}

// お気に入りに登録した曲を取得する
function getSavedTracks(limit, offset, accessToken) {
  return new Promise(function (resolve) {
    sleep(0.5).done(function () {
      $.ajax({
        url: encodeURI('https://api.spotify.com/v1/me/tracks'),
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        data: {
          limit: limit,
          offset: offset
        }
      }).then((response) => resolve(response))
    })
  })
}

// フォローしているアーティストを取得する
function getFollowingArtists(limit, accessToken) {
  return new Promise(function (resolve) {
    $.ajax({
      url: encodeURI('https://api.spotify.com/v1/me/following'),
      headers: {
        Authorization: 'Bearer ' + accessToken
      },
      data: {
        type: 'artist',
        limit: limit
      }
    }).then((response) => resolve(response))
  })
}

// アーティストのアルバムを取得する
function getArtistAlbums(artist_id, limit, offset, accessToken) {
  return new Promise(function (resolve) {
    sleep(1).done(function () {
      $.ajax({
        url: encodeURI(
          'https://api.spotify.com/v1/artists/' + artist_id + '/albums'
        ),
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        data: {
          limit: limit,
          offset: offset
        }
      }).then(
        (response) => resolve(response),
        (error) => resolve({ items: [] })
      )
    })
  })
}

// アルバムの収録曲を取得する
function getAlbumTracks(album_id, limit, offset, albumNum, accessToken) {
  return new Promise(function (resolve) {
    sleep(albumNum / 80).done(function () {
      $.ajax({
        url: encodeURI(
          'https://api.spotify.com/v1/albums/' + album_id + '/tracks'
        ),
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        data: {
          limit: limit,
          offset: offset
        }
      }).then(
        (response) => resolve(response),
        (error) => resolve({ items: [] })
      )
    })
  })
}

// 曲の特徴を取得する
function getTracksFeature(trackIds, accessToken) {
  const trackIdsStr = trackIds.join(',')
  return new Promise(function (resolve) {
    sleep(1).done(function () {
      $.ajax({
        url: encodeURI('https://api.spotify.com/v1/audio-features'),
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        data: {
          ids : trackIdsStr,
        },
        timeout: 2000
      }).then(
        (response) => resolve(response),
        (error) => resolve({ audio_features: [] })
      )
    })
  })
}

function dropUnusedInfo(items) {
  let newItems = {}
  Object.keys(items).forEach((id) => {
    const value = items[id]
    newItems[id] = {
      id: value.id,
      name: value.name,
      uri: value.uri,
      feature: value.feature,
      artist: value.artists[0].name
    }
  })
  return newItems
}

// キャッシュした曲を取得する
function getCachedTracks(cacheKeys) {
  let cacheItems = [],
    items = {}
  cacheKeys.forEach((cacheKey) => {
    cacheItems.push(JSON.parse(localStorage.getItem(cacheKey)))
  })
  cacheItems.forEach((cacheItem) => {
    if (cacheItem) {
      items = Object.assign(items, cacheItem)
    }
  })
  return items
}

// ユーザのプレイリストを取得する
function getUserPlaylists(limit, offset, accessToken) {
  return new Promise(function (resolve) {
    $.ajax({
      url: encodeURI('https://api.spotify.com/v1/me/playlists'),
      headers: {
        Authorization: 'Bearer ' + accessToken
      },
      type: 'GET',
      data: {
        limit: limit,
        offset: offset
      }
    }).then((response) => resolve(response))
  })
}

// プレイリストを作成する
function createNewPlaylist(user_id, body, accessToken) {
  return new Promise(function (resolve) {
    $.ajax({
      url: encodeURI(
        'https://api.spotify.com/v1/users/' + user_id + '/playlists'
      ),
      type: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken
      },
      dataType: 'json',
      data: JSON.stringify(body)
    }).then((response) => resolve(response))
  })
}

// プレイリストに曲を追加する
function addTracksToPlaylist(playlistId, body, accessToken) {
  return new Promise(function (resolve) {
    sleep(2).done(function () {
      $.ajax({
        url: encodeURI(
          'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks'
        ),
        type: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        dataType: 'json',
        data: JSON.stringify(body)
      }).then((response) => resolve(response))
    })
  })
}

// 曲を選ぶ1
function extractTrackIdsOfFeature(
  trackFeatures,
  targetKeys,
  thresholds,
  validComp
) {
  let items = {}
  Object.values(trackFeatures).forEach((track) => {
    if (track.hasOwnProperty('feature')) {
      if (validComp === '>=') {
        if (track.feature[targetKeys[0]] >= thresholds[0]) {
          items[track.id] = track
        }
      } else if (validComp === '<') {
        if (track.feature[targetKeys[0]] < thresholds[0]) {
          items[track.id] = track
        }
      }
    }
  })
  return items
}

// 曲を選ぶ2
function extractTrackIdsOf2Feature(
  trackFeatures,
  targetKeys,
  thresholds,
  validComp
) {
  let items = {}
  Object.values(trackFeatures).forEach((track) => {
    if (track.hasOwnProperty('feature')) {
      if (validComp === '>=') {
        if (
          track.feature[targetKeys[0]] >= thresholds[0] &&
          track.feature[targetKeys[1]] >= thresholds[1]
        ) {
          items[track.id] = track
        }
      } else if (validComp === '<') {
        if (
          track.feature[targetKeys[0]] < thresholds[0] ||
          track.feature[targetKeys[1]] < thresholds[1]
        ) {
          items[track.id] = track
        }
      }
    }
  })
  return items
}

// 曲をランダムに抽出する
function extractRandomTracks(
  items,
  maxSize
) {
  const trackIds = Object.keys(items)
  if (trackIds.length > maxSize) {
    const selectedIds = selectRandom(trackIds, maxSize)
    let restrictedItems = {}
    selectedIds.forEach((id) => {
      restrictedItems[id] = items[id]
    })
    return restrictedItems
  }
  return items
}


// css

// range slider
$(function () {
  $('[type="range"]').on('change input', function () {
    const elemId = $(this).attr('id')
    const val = $('#' + elemId + '[type="range"]').val()
    const rangePercent = 25 * val
    if (rangePercent === 50) {
      $('.' + elemId).html('<div class="slider-disabled-size">disabled</div><span></span>')
      $('#' + elemId + '[type="range"], .' + elemId + ' span').css(
        'filter',
        'grayscale(70%)'
      )
    } else {
      $('.' + elemId).html(((val - 2) / 2).toFixed(1) + '<span></span>')
      $('#' + elemId + '[type="range"], .' + elemId + ' span').css(
        'filter',
        'hue-rotate(-' + rangePercent + 'deg)'
      )
    }
    $('.' + elemId).css({
      transform: 'translateX(-50%) scale(1.5)',
      left: rangePercent + '%'
    })
  })
})
