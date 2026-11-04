# Hill Climbing Visualizer with Random Restarts

An interactive, animated visualizer that shows how **Hill Climbing** gets trapped at local maxima on a rugged landscape, and how **Random Restarts** help different attempts reach different peaks so the best result can be kept.

Built with plain HTML, CSS and JavaScript (Canvas). No libraries, no build step.

**Live demo:** https://hill-climbing-visualizer-random-restart.vercel.app/

## Features

- Rugged 2D fitness landscape with several local maxima and one global maximum
- Real Hill Climbing execution, recorded step by step and replayed in the animation
- One color per restart, with start marker, end marker and current-position marker
- Gold glow on the best path found so far
- Controls: Play, Pause, Step Forward, Step Back, Reset
- Two parameters: number of random restarts (1-10, default 5) and speed (1x-5x)
- Live panels: algorithm status, frontier (neighbors), visited list, performance statistics
- Comparison table with one row per restart (start, final, fitness, nodes expanded, path length, result)

## How to Run

1. Download or clone this repository.
2. Open `index.html` in any modern browser.

No installation or server is needed.

## Project Structure

| File | Purpose |
|---|---|
| `index.html` | Page layout, controls, panels and explanation |
| `style.css` | Styling and responsive layout |
| `script.js` | Landscape, algorithm, drawing and controls |

## Landscape

The search space is the integer positions `x = 0..100`. The fitness function (to be maximized) is a sum of four Gaussian hills plus a small sine ripple:

```
f(x) = 10 + 45*g(x,18,7) + 30*g(x,42,6) + 60*g(x,68,9) + 35*g(x,90,5) + 4*sin(0.7x)
g(x,c,w) = exp(-((x-c)/w)^2)
```

The landscape is fixed, so every attempt is evaluated on the same function. The global maximum is at **x = 66 (f = 70.30)**; the other peaks are local maxima.

## Algorithm

The neighborhood of position `x` is `{x-2, x-1, x+1, x+2}` (kept inside 0..100).

For each restart:

1. Pick a random starting position and evaluate it.
2. Evaluate all neighbors (the frontier).
3. Move to the best neighbor only if it is strictly better than the current position.
4. Repeat until no neighbor improves. This position is a local maximum.
5. Record the final position, fitness, nodes expanded and path length.

After all restarts, the final fitness values are compared and the best one is highlighted.

Random restarts improve the chance of finding the global maximum but do **not** guarantee it.

## Metrics

- **Nodes expanded:** positions whose neighbors were examined
- **Fitness evaluations:** every call to `fitness(x)`
- **Path length:** number of moves made in an attempt
- **Execution time:** measured with `performance.now()` around the algorithm run

## How to Test the Controls

- **Play / Pause:** starts and stops the automatic animation
- **Step Forward / Step Back:** moves exactly one recorded step in either direction
- **Speed slider:** changes the animation speed, even while playing
- **Restarts slider / Reset:** generates a new run with new random starting positions
