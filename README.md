# CellularAutomatonSuite
# https://jhntrnr.github.io/cellular-automaton-suite/

Several cellular automata implemented in typescript.

## Usage:
- Select a Simulation Mode from the dropdown
- configure the topology and dimensions of the grid
    - "Wraparound grid" connects the left-right and top-bottom edges, like pacman
- Add "teams" of different colors
    - All colored cells are considered alive in the simulations
    - Cells that are alive can change color depending on their neighbor colors
    - Dead cells that become alive choose their color based on their neighbors
- Place cells manually with left and right clicks on the grid, or place them randomly with the controls
- Start the simulation or step through it one frame at a time
- Generate a GoLTeN string (Game of Life Team Notation) to save the current simulation state

## Simulation Types
### Game of Life

https://user-images.githubusercontent.com/90057903/235777426-a392dd91-409c-4be4-bf34-51941b89d32c.mp4

This follows the standard Game of Life rules set by John Conway: https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
Additionally, different "teams" of cells--denoted by color--are supported.
Cells change color based on the majority color of their neighbors, if such a majority exists.

### Space Filling

https://user-images.githubusercontent.com/90057903/235777677-133ade01-8037-4791-9060-74c70c6b4877.mp4

In Space Filling mode, cells don't ever die. Dead cells become alive if they have any live neighbors.
Cells have a "vision" radius of 2 in Space Filling mode.
If a dead cell sees two or more teams with equivalent populations in its radius, it stays dead.
Live cells can change color if they are greatly outnumbered by live cells of another team.

### Temperature


https://user-images.githubusercontent.com/90057903/235778927-1e2b5d96-4be6-47ea-832a-ad2b6d79e788.mp4


In Temperature mode, cells have a "temperature" value applied in addition to their color.
If a cell is static (does not change between simulation steps), its temperature decreases slightly.
If a cell changes between simulation steps, its temperature increases slightly.
Cells use the temperature of neighboring cells to determine whether to change teams/colors.
Like in Space Filling mode, cells do not die in Temperature mode. Cells have a "vision" radius of 1.

>Example: a Green cell has 3 Blue neighbors, each with Temperature=0.2, and 2 Red neighbors, each with Temperature=0.5.
>The green cell will turn Red because the total Red Temperature is greater than the total Blue Temperature.

### High Energy

https://user-images.githubusercontent.com/90057903/235777896-6ef40375-a6af-4375-b1a8-272de961e7f2.mp4

High Energy mode is identical to Temperature mode, except when a cell's temperature increases, it is set to the maximum temperature rather than incrementing slightly.
This causes similar dynamic behavior, but tends towards simulations that last a very long time before settling.

