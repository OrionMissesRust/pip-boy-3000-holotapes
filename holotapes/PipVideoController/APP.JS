(function () {
  const APP_ID = 'PIPVIDEOCONTROLLER';
  const displayWidth = h.getWidth();
  const displayHeight = h.getHeight();
  const videoList = [];

  let renderInterval;
  let isClosed = !1;
  let buttonWatchId;
  let playTimeoutId; // Tracks the timeout to prevent background memory leaks

  const appState = { phase: 'WAITING', selectedIndex: 0 };

  function playSoundAndRender() {
    (Pip.playSound && Pip.playSound('TAB'), renderUI());
  }

  function renderUI() {
    (h.clear(1),
      h
        .setColor(3)
        .setFontMonofonto28()
        .setFontAlign(0, 0)
        .drawString('PipVideo', displayWidth / 2, 30),
      h.drawLine(0, 50, displayWidth, 50),
      'WAITING' === appState.phase
        ? h
            .setFontMonofonto18()
            .setFontAlign(0, 0)
            .drawString('SYSTEM READY', displayWidth / 2, 110)
            .drawString('PRESS SELECT TO SYNC', displayWidth / 2, 140)
        : 'LIST' === appState.phase &&
          (h.setFontMonofonto18().setFontAlign(-1, -1),
          videoList.forEach(function (video, index) {
            let yPosition = 75 + 30 * index;
            index === appState.selectedIndex
              ? h.drawString('> [ ' + video.name + ' ]', 25, yPosition)
              : h.drawString('  ' + video.name, 25, yPosition);
          })),
      h.flip(),
      'undefined' != typeof getTime && (Pip.lastFlip = getTime()));
  }

  function handleKnob1(direction) {
    'LIST' === appState.phase &&
      (direction < 0 && appState.selectedIndex > 0
        ? (appState.selectedIndex--, playSoundAndRender())
        : direction > 0 &&
          appState.selectedIndex < videoList.length - 1 &&
          (appState.selectedIndex++, playSoundAndRender()));
  }

  function handleKnob2(direction) {}

  function handleSelectButton() {
    if ('WAITING' === appState.phase)
      (USB.print('START_SELECT\n'),
        (appState.phase = 'LIST'),
        playSoundAndRender());
    else if ('LIST' === appState.phase) {
      let videoPath = videoList[appState.selectedIndex].path;
      (USB.print('PLAY:' + videoPath + '\n'),
        h.clear(1),
        h
          .setColor(3)
          .setFontMonofonto18()
          .setFontAlign(0, 0)
          .drawString('PLAYING...', displayWidth / 2, displayHeight / 2),
        h.flip(),
        (playTimeoutId = setTimeout(function () {
          renderUI();
        }, 1500)));
    }
  }

  function init() {
    (h.clear(),
      Pip.audioStop && Pip.audioStop(),
      Pip.onExclusive('knob1', handleKnob1),
      Pip.onExclusive('knob2', handleKnob2),
      'undefined' != typeof ENC1_PRESS &&
        (buttonWatchId = setWatch(handleSelectButton, ENC1_PRESS, {
          repeat: !0,
          edge: 'rising',
          debounce: 50,
        })),
      renderUI(),
      (renderInterval = setInterval(renderUI, 1e3)));
  }

  function remove() {
    isClosed ||
      ((isClosed = !0),
      renderInterval && clearInterval(renderInterval),
      buttonWatchId && clearWatch(buttonWatchId),
      playTimeoutId && clearTimeout(playTimeoutId), // Safely clears the timeout loop
      Pip.removeListener('knob1', handleKnob1),
      Pip.removeListener('knob2', handleKnob2),
      Pip.audioStop && Pip.audioStop(),
      h.clear(),
      h.flip());
  }

  init();

  return {
    id: 'PIPVIDEOCONTROLLER',
    notDefault: !0,
    fullscreen: !0,
    remove: remove,
  };
});
