(function () {
  const APP_ID = 'PIPVIDEOCONTROLLER';
  const W = h.getWidth();
  const H = h.getHeight();

  // --- VIDEO PLAYLIST ---
  const videoList = [
    // --- ADD VIDEOS HERE ---
  ];

  let redrawInterval;
  let removed = false;
  let leftWheelPressWatch;

  const state = {
    phase: 'WAITING', // "WAITING" or "LIST"
    selectedIndex: 0,
  };

  function mark() {
    if (Pip.playSound) Pip.playSound('TAB');
    draw();
  }

  function draw() {
    h.clear(1);

    h.setColor(3)
      .setFontMonofonto28()
      .setFontAlign(0, 0)
      .drawString('PipVideoController', W / 2, 30);

    h.drawLine(0, 50, W, 50);

    if (state.phase === 'WAITING') {
      h.setFontMonofonto18()
        .setFontAlign(0, 0)
        .drawString('SYSTEM READY', W / 2, 110)
        .drawString('PRESS SELECT TO SYNC', W / 2, 140);
    } else if (state.phase === 'LIST') {
      h.setFontMonofonto18().setFontAlign(-1, -1); // Left alignment for lists

      videoList.forEach(function (v, i) {
        let y = 75 + i * 30;
        if (i === state.selectedIndex) {
          h.drawString('> [ ' + v.name + ' ]', 25, y);
        } else {
          h.drawString('  ' + v.name, 25, y);
        }
      });
    }

    h.flip();
    if (typeof getTime !== 'undefined') Pip.lastFlip = getTime();
  }

  function onLeftWheel(dir) {
    if (state.phase === 'LIST') {
      if (dir < 0 && state.selectedIndex > 0) {
        state.selectedIndex--;
        mark();
      } else if (dir > 0 && state.selectedIndex < videoList.length - 1) {
        state.selectedIndex++;
        mark();
      }
    }
  }

  function onRightWheel(dir) {
    // Leave right wheel optional or unused
  }

  function onLeftWheelPress() {
    if (state.phase === 'WAITING') {
      // 1. Handshake to PC
      USB.print('START_SELECT\n');
      state.phase = 'LIST';
      mark();
    } else if (state.phase === 'LIST') {
      // 2. Send path to play
      let path = videoList[state.selectedIndex].path;
      USB.print('PLAY:' + path + '\n');

      h.clear(1);
      h.setColor(3)
        .setFontMonofonto18()
        .setFontAlign(0, 0)
        .drawString('PLAYING...', W / 2, H / 2);
      h.flip();

      setTimeout(function () {
        draw();
      }, 1500);
    }
  }

  function start() {
    h.clear();
    if (Pip.audioStop) Pip.audioStop();

    Pip.onExclusive('knob1', onLeftWheel);
    Pip.onExclusive('knob2', onRightWheel);

    if (typeof ENC1_PRESS !== 'undefined') {
      leftWheelPressWatch = setWatch(onLeftWheelPress, ENC1_PRESS, {
        repeat: true,
        edge: 'rising',
        debounce: 50,
      });
    }

    draw();
    redrawInterval = setInterval(draw, 1000);
  }

  function remove() {
    if (removed) return;
    removed = true;

    if (redrawInterval) clearInterval(redrawInterval);
    if (leftWheelPressWatch) clearWatch(leftWheelPressWatch);

    Pip.removeListener('knob1', onLeftWheel);
    Pip.removeListener('knob2', onRightWheel);

    if (Pip.audioStop) Pip.audioStop();
    h.clear();
    h.flip();
  }

  start();

  return {
    id: APP_ID,
    notDefault: true,
    fullscreen: true,
    remove: remove,
  };
});
