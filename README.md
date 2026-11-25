# NEON RUSH

A mobile-friendly browser arcade game built with HTML, CSS, vanilla JavaScript,
and the Canvas API.

## Run locally

Open `index.html` in a modern browser. There are no build steps or JavaScript
dependencies. The display font is loaded from Google Fonts; the game still uses
system fallbacks if the font service is unavailable.

## Milestones

The game now includes a responsive neon start screen, animated canvas
background, score and timer HUD, and ready, playing, paused, and game-over
states. During each 60-second run, tap green targets for 10 points and avoid
red targets, which deduct 5 points. Missed targets do not change the score.

- Select **START GAME** or press **Enter** to start.
- Select **PAUSE** or press **Space** or **P** to pause or resume.
- Click or tap targets in the arena. Touch input uses Pointer Events.
- At game over, select **PLAY AGAIN** to restart or **RETURN TO TITLE** to go
  back to the start screen.

Target spawn frequency and lifetime increase in difficulty gradually as the
timer counts down. The game pauses automatically when its browser tab is
hidden.

## Project files

- `index.html` contains the accessible game layout and screen elements.
- `style.css` contains the responsive layout and neon visual theme.
- `game.js` manages game state, target rules and rendering, canvas sizing,
  particles, and input.
- `tests/game.test.js` checks scoring, target lifetimes, timer, difficulty,
  game-over flow, pointer input, and resize behavior.

## Run tests

Run `node --test tests/game.test.js` from this folder. The tests use Node's
built-in test runner and need no third-party packages.
