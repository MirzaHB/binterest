// oneko.js: https://github.com/adryd325/oneko.js
//
// Modified so visitors can send the cat away and call it back:
//   - window.oneko.enable() / .disable() / .toggle() / .isEnabled()
//   - clicking the cat shoos it (it only accepts clicks while it is sitting
//     still, so it can't eat a click while streaking across a link)
//   - the choice is remembered in localStorage under "oneko-enabled"
//   - every change fires an "oneko:change" CustomEvent on window, which is how
//     the React nav toggle stays in sync with clicks on the cat itself.

(function oneko() {
  const STORAGE_KEY = "oneko-enabled";
  const HINT_KEY = "oneko-hint-seen";

  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  const nekoEl = document.createElement("div");
  const hintEl = document.createElement("div");
  let persistPosition = true;
  let nekoFile = "./oneko.gif";

  let nekoPosX = 32;
  let nekoPosY = 32;

  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  // Set while the cat is playing its goodbye animation. Holds the off-screen
  // point it is running towards; the chase logic targets this instead of the
  // cursor until it arrives, then the cat removes itself.
  let exitTarget = null;
  let waveFrames = 0;

  let running = false;
  let hintTimer = null;
  // Set once the cat has run after the cursor, which is the moment a visitor
  // actually registers that there's a cat.
  let hasChased = false;

  const nekoSpeed = 10;
  // The exit run uses its own speed. At the chase speed of 10px per 100ms frame
  // the cat covers only 100px/s, so leaving from mid-screen took ~10s — longer
  // than the toast explaining where it went. A dismissal has to feel immediate.
  const nekoExitSpeed = 36;
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  function readSetting() {
    try {
      // Default on: the cat is part of the site's personality, the toggle is
      // there for people who'd rather it weren't.
      return window.localStorage.getItem(STORAGE_KEY) !== "false";
    } catch (e) {
      return true;
    }
  }

  function writeSetting(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch (e) {
      /* private browsing — the cat just won't be remembered */
    }
  }

  function announce(enabled, viaCat) {
    window.dispatchEvent(
      new CustomEvent("oneko:change", { detail: { enabled, viaCat } })
    );
  }

  function readScriptConfig() {
    const curScript = document.currentScript;
    if (curScript && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat;
    }
    if (curScript && curScript.dataset.persistPosition) {
      if (curScript.dataset.persistPosition === "") {
        persistPosition = true;
      } else {
        persistPosition = JSON.parse(
          curScript.dataset.persistPosition.toLowerCase()
        );
      }
    }
  }

  function restorePosition() {
    let storedNeko = null;
    try {
      storedNeko = JSON.parse(window.localStorage.getItem("oneko"));
    } catch (e) {
      storedNeko = null;
    }
    if (storedNeko !== null) {
      nekoPosX = storedNeko.nekoPosX;
      nekoPosY = storedNeko.nekoPosY;
      mousePosX = storedNeko.mousePosX;
      mousePosY = storedNeko.mousePosY;
      frameCount = storedNeko.frameCount;
      idleTime = storedNeko.idleTime;
      idleAnimation = storedNeko.idleAnimation;
      idleAnimationFrame = storedNeko.idleAnimationFrame;
      nekoEl.style.backgroundPosition = storedNeko.bgPos;
    }
  }

  function savePosition() {
    if (!persistPosition) return;
    try {
      window.localStorage.setItem(
        "oneko",
        JSON.stringify({
          nekoPosX: nekoPosX,
          nekoPosY: nekoPosY,
          mousePosX: mousePosX,
          mousePosY: mousePosY,
          frameCount: frameCount,
          idleTime: idleTime,
          idleAnimation: idleAnimation,
          idleAnimationFrame: idleAnimationFrame,
          bgPos: nekoEl.style.backgroundPosition,
        })
      );
    } catch (e) {
      /* nothing to do */
    }
  }

  function onMouseMove(event) {
    mousePosX = event.clientX;
    mousePosY = event.clientY;
  }

  // The cat is only clickable while it is sitting still. While it's running it
  // stays pointer-events: none, so it can never swallow a click mid-dash.
  function setInteractive(interactive) {
    nekoEl.style.pointerEvents = interactive ? "auto" : "none";
    nekoEl.style.cursor = interactive ? "pointer" : "auto";
  }

  // Cached so the idle loop isn't hitting localStorage every frame.
  let hintSeen = null;

  function showHint() {
    if (hintSeen === null) {
      try {
        hintSeen = window.localStorage.getItem(HINT_KEY) === "true";
      } catch (e) {
        hintSeen = true; // treat as seen, so we never nag in private browsing
      }
    }
    // Wait until the cat has actually chased the cursor once. On load it sits
    // idle in the corner with the mouse at (0,0), and a tip pointing at a cat
    // the visitor hasn't noticed yet is just noise.
    if (hintSeen || hasChased === false || hintEl.isConnected) return;

    hintEl.textContent = "psst — click to shoo";
    hintEl.className = "oneko-hint";
    document.body.appendChild(hintEl);
    positionHint();
    // Next frame, so the transition has a start value to animate from.
    window.requestAnimationFrame(() => hintEl.classList.add("visible"));
    // Shown in full — that counts as read, so don't offer it again.
    hintTimer = window.setTimeout(() => hideHint(true), 7000);
  }

  function positionHint() {
    if (!hintEl.isConnected) return;
    hintEl.style.left = `${nekoPosX}px`;
    hintEl.style.top = `${nekoPosY - 26}px`;
  }

  // markSeen is false when the hint is dismissed by the cat simply running off
  // again — the visitor may never have read it, so it gets another chance the
  // next time the cat settles. Only a full display, or acting on it, burns it.
  function hideHint(markSeen) {
    if (hintTimer) {
      window.clearTimeout(hintTimer);
      hintTimer = null;
    }
    if (!hintEl.isConnected) return;
    if (markSeen) {
      hintSeen = true;
      try {
        window.localStorage.setItem(HINT_KEY, "true");
      } catch (e) {
        /* nothing to do */
      }
    }
    hintEl.classList.remove("visible");
    window.setTimeout(() => hintEl.remove(), 300);
  }

  function start() {
    if (running || isReducedMotion) return;
    running = true;
    exitTarget = null;
    waveFrames = 0;

    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.title = "Click to send the cat home";
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = 2147483647;
    nekoEl.style.backgroundImage = `url(${nekoFile})`;
    setInteractive(false);

    document.body.appendChild(nekoEl);
    document.addEventListener("mousemove", onMouseMove);
    nekoEl.addEventListener("click", onCatClick);
    window.addEventListener("beforeunload", savePosition);

    window.requestAnimationFrame(onAnimationFrame);
  }

  function stop() {
    running = false;
    hideHint(true);
    savePosition();
    document.removeEventListener("mousemove", onMouseMove);
    nekoEl.removeEventListener("click", onCatClick);
    window.removeEventListener("beforeunload", savePosition);
    // The RAF loop bails out on its own once the element leaves the DOM.
    nekoEl.remove();
  }

  // Send the cat off the nearest side of the screen rather than just deleting
  // it — a pet that walks out is friendlier than one that blinks out.
  function beginExit() {
    if (exitTarget) return;
    // Shooing the cat means the hint did its job.
    hideHint(true);
    idleAnimation = null;
    idleAnimationFrame = 0;
    idleTime = 0;
    setInteractive(false);
    waveFrames = 4; // ~0.4s of grooming before it bolts
    const goLeft = nekoPosX < window.innerWidth / 2;
    exitTarget = { x: goLeft ? -48 : window.innerWidth + 48, y: nekoPosY };
  }

  function onCatClick() {
    if (exitTarget) return;
    beginExit();
    writeSetting(false);
    announce(false, true);
  }

  let lastFrameTimestamp;

  function onAnimationFrame(timestamp) {
    // Stops execution if the neko element is removed from DOM
    if (!nekoEl.isConnected) {
      return;
    }
    if (!lastFrameTimestamp) {
      lastFrameTimestamp = timestamp;
    }
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    // The cat has settled, so it's safe to let it take clicks.
    setInteractive(true);
    // ~2s of sitting still. showHint() is a no-op once it has been seen.
    if (idleTime > 20) {
      showHint();
    }

    // every ~ 20 seconds
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) {
        avalibleIdleAnimations.push("scratchWallW");
      }
      if (nekoPosY < 32) {
        avalibleIdleAnimations.push("scratchWallN");
      }
      if (nekoPosX > window.innerWidth - 32) {
        avalibleIdleAnimations.push("scratchWallE");
      }
      if (nekoPosY > window.innerHeight - 32) {
        avalibleIdleAnimations.push("scratchWallS");
      }
      idleAnimation =
        avalibleIdleAnimations[
          Math.floor(Math.random() * avalibleIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;

    // Goodbye wave: groom for a beat so the exit reads as deliberate.
    if (exitTarget && waveFrames > 0) {
      waveFrames -= 1;
      setSprite("scratchSelf", frameCount);
      return;
    }

    const targetX = exitTarget ? exitTarget.x : mousePosX;
    const targetY = exitTarget ? exitTarget.y : mousePosY;

    const diffX = nekoPosX - targetX;
    const diffY = nekoPosY - targetY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    const speed = exitTarget ? nekoExitSpeed : nekoSpeed;

    if (exitTarget) {
      if (distance < speed) {
        stop();
        return;
      }
    } else if (distance < nekoSpeed || distance < 48) {
      idle();
      positionHint();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;
    setInteractive(false);
    // The cat is off again; retract the tip without burning it.
    hideHint(false);
    hasChased = true;

    if (!exitTarget && idleTime > 1) {
      setSprite("alert", 0);
      // count down after being alerted before moving
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction;
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * speed;
    nekoPosY -= (diffY / distance) * speed;

    // While leaving, the cat is allowed past the edge of the screen.
    if (!exitTarget) {
      nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
      nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);
    }

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  readScriptConfig();
  if (persistPosition) {
    restorePosition();
  }

  window.oneko = {
    // False when the browser asks for reduced motion — there is no cat to
    // toggle, so the UI hides its control entirely.
    available: !isReducedMotion,
    // A cat mid-exit is already "off" as far as the UI is concerned.
    isEnabled: () => running && !exitTarget,
    enable() {
      if (isReducedMotion) return;
      if (running) {
        // Toggled back on mid-goodbye: call the cat off its exit run instead
        // of waiting for it to leave and then re-entering.
        if (!exitTarget) return;
        exitTarget = null;
        waveFrames = 0;
        writeSetting(true);
        announce(true, false);
        return;
      }
      // Come back in from the edge nearest the cursor, so it visibly runs on
      // screen instead of popping into the middle of the page.
      const fromLeft = mousePosX < window.innerWidth / 2;
      nekoPosX = fromLeft ? -32 : window.innerWidth + 32;
      nekoPosY = Math.min(Math.max(48, mousePosY), window.innerHeight - 48);
      writeSetting(true);
      start();
      announce(true, false);
    },
    disable() {
      if (!running || exitTarget) return;
      beginExit();
      writeSetting(false);
      announce(false, false);
    },
    toggle() {
      if (window.oneko.isEnabled()) {
        window.oneko.disable();
      } else {
        window.oneko.enable();
      }
    },
  };

  if (readSetting() && !isReducedMotion) {
    start();
  }
})();
