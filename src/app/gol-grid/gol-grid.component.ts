// gol-grid.component.ts
import { NodeWithI18n } from '@angular/compiler';
import { Component, Input, OnInit } from '@angular/core';
import { Team } from '../team-creator/team-creator.component';
import { TeamCreatorComponent } from '../team-creator/team-creator.component';
interface Cell {
    x: number;
    y: number;
    team: number,
    desiredTeam: number,
    color: string;
    desiredColor: string;
    alive: boolean;
    desiredAlive: boolean;
    temperature: number;
}

enum SimulationMode {
    GameOfLife = "Game of Life",
    SpaceFilling = "Space Filling",
    Temperature = "Temperature",
    HighEnergy = "High Energy"
}

@Component({
    selector: 'app-gol-grid',
    templateUrl: './gol-grid.component.html',
    styleUrls: ['./gol-grid.component.css']
})
export class GolGridComponent implements OnInit {
    @Input() width = 10;
    @Input() height = 10;
    @Input() territorySize = 4;
    @Input() teams: Team[] = [];
    @Input() numberOfRandomPieces = 9;
    @Input() numberOfTeams = -1;
    grid: Cell[][] = [];
    isSimulationRunning = false;
    simulationDelay = 0.5;
    goltenString: string = '';
    simulationMode: SimulationMode = SimulationMode.GameOfLife;
    wrapAroundGrid = true;
    totalSimulationSteps = 0;
    hideCellOutlines = false;
    simulationDescription: string = '';
    checkForRepeatStates = false;
    startingGoLTeNString: string = '';
    private simulationInterval: any;
    private startingTeamColors = ['#ffffff','#1F618D','#B03A2E'];
    private deadCell = 0;
    private pastStateStrings: String[] = [];
    constructor(private teamCreator: TeamCreatorComponent) {}

    ngOnInit(): void {
        this.setupTeams();
        this.createGrid();
        this.updateSimulationDescription();
    }

    applyGridSize(): void {
        this.clearGrid();
        this.createGrid();
    }
    
    placeRandomCells(): void {
        this.applyGridSize();
        const territorySize = this.width * this.height;
        const occupiedCells = new Set<number>();
        let randomPiecesPerTeam = this.numberOfRandomPieces;
        if(territorySize < ((this.teams.length-1) * randomPiecesPerTeam)){
            randomPiecesPerTeam = Math.floor(territorySize/(this.teams.length-1));
        }
        for (const team of this.teams) {
            if (team.id === 0) {
                continue;
            }
      
            let placedPieces = this.generateUniqueRandomIndices(randomPiecesPerTeam, territorySize, occupiedCells);
            placedPieces.forEach(cellIndex => occupiedCells.add(cellIndex));
        
            let territoryIndex = 0;
        
            for (let row = 0; row < this.height; row++) {
                for (let column = 0; column < this.width; column++) {
                    if (placedPieces.has(territoryIndex)) {
                        this.becomeAlive(this.grid[row][column], team.id);
                    }
                    territoryIndex++;
                }
            }
        }
    }

    generateUniqueRandomIndices(numIndices: number, maxValue: number, occupiedCells: Set<number>): Set<number> {
        const indices = new Set<number>();
        while (indices.size < numIndices) {
            const randomIndex = Math.floor(Math.random() * maxValue);
            if (!occupiedCells.has(randomIndex)) {
                indices.add(randomIndex);
            }
        }
        return indices;
    }

    clearGrid(): void {
        this.stopSimulation();
        for (let row = 0; row < this.grid.length; row++) {
            for (let column = 0; column < this.grid[row].length; column++) {
                const currentCell = this.grid[row][column];
                this.setDesiredState(currentCell,0,false);
                this.applyDesiredState(currentCell);
            }
        }
        this.clearPastSimulationStates()
        this.updateSimulationDescription();
    }

    createGrid(): void {
        this.grid = Array.from({ length: this.height }, (_, y) =>
            Array.from({ length: this.width }, (_, x) => {
                const cellData: Cell = {
                    x: x,
                    y: y,
                    team: this.deadCell,
                    desiredTeam: this.deadCell,
                    color: this.teams[this.deadCell].color,
                    desiredColor: this.teams[this.deadCell].color,
                    alive: false,
                    desiredAlive: false,
                    temperature: 1
                };
                return cellData;
            }),
        );
    }
    
    setupTeams(): void {
        for(let team = 0; team < this.startingTeamColors.length; team++){
            const newTeam: Team = {
                id: team,
                color: this.startingTeamColors[team],
                count: 0
            }
            this.addTeam(newTeam);
        }
    }

    addTeam(team: Team): void {
        if(this.numberOfTeams > 250){
            return;
        }
        this.teams.push(team);
        this.numberOfTeams++;
    }

    clearTeams(): void {
        this.teams = [];
        const deadTeam: Team = { id: 0, color: '#ffffff', count: 0 };
        this.teams.push(deadTeam);
    }

    updateTeamColor(teamIndex: number, newColor: string): void {
        this.teams[teamIndex].color = newColor;
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                const currentCell = this.grid[row][column];
                if(currentCell.team == teamIndex){
                    currentCell.color = newColor;
                }
            }
        }
    }
      
    toggleSimulation(): void {
        if (this.isSimulationRunning) {
            this.stopSimulation();
        } else {
            this.startSimulation();
        }
    }

    startSimulation(): void {
        this.clearPastSimulationStates();
        this.startingGoLTeNString = this.generateGoLTeN();
        this.isSimulationRunning = true;
        this.simulationInterval = setInterval(() => {
            this.singleStep();
        }, this.simulationDelay * 1000);
    }

    stopSimulation(): void {
        this.isSimulationRunning = false;
        clearInterval(this.simulationInterval);
    }

    clearPastSimulationStates(): void {
        this.pastStateStrings.length = 0;
        this.totalSimulationSteps = 0;
    }

    logAndCheckSimulationState(): boolean {
        let currentState = this.generateGoLTeN().split('!')[1];
        if(this.pastStateStrings.includes(currentState)){
            return true;
        }
        this.pastStateStrings.push(currentState);
        return false;
    }

    singleStep(): void {
        if(this.checkForRepeatStates){
            if(this.logAndCheckSimulationState()){
                console.log(`Simulation reached a repeated state at step: ${this.totalSimulationSteps}. Starting GoLTeN string was:`);
                console.log(this.startingGoLTeNString);
                this.totalSimulationSteps = 0;
                this.stopSimulation();
            }
        }
        switch (this.simulationMode) {
            case SimulationMode.GameOfLife:
                this.simulationStep();
                break;
            case SimulationMode.SpaceFilling:
                this.spaceFillingSimulationStep();
                break;
            case SimulationMode.Temperature:
                this.temperatureSimulationStep();
                break;
            case SimulationMode.HighEnergy:
                this.highEnergySimulationStep();
                break;
            default:
                this.simulationStep();
        }
        this.applyAllCells();
        this.totalSimulationSteps++;
    }

    onSimulationDelayChange(event: any): void {
        this.simulationDelay = event.target.value;

        if (this.isSimulationRunning) {
            this.stopSimulation();
            this.startSimulation();
        }
    }

    applyAllCells(): void {
        for(let row = 0; row < this.height; row++){
            for(let column = 0; column < this.width; column++){
                this.applyDesiredState(this.grid[row][column]);
            }
        }
    }

    simulationStep(): void {
        for(let row = 0; row < this.height; row++){
            for(let column = 0; column < this.width; column++){
                const currentCell = this.grid[row][column];
                const neighborCounts = this.wrapAroundGrid ? this.countNeighborsWrapAround(currentCell,1) : this.countNeighbors(currentCell,1);
    
                if(currentCell.alive){
                    if(neighborCounts.total === 2 || neighborCounts.total === 3){
                        const majorityTeam = this.findMajorityTeam(neighborCounts.teamCounts);
                        if (majorityTeam !== null) {
                            this.setDesiredState(currentCell, majorityTeam, true);
                        } else {
                            this.setDesiredState(currentCell, currentCell.team, true);
                        }
                    }
                    else{
                        this.setDesiredState(currentCell, 0, false);
                    }
                }
                else{
                    if(neighborCounts.total === 3){
                        const majorityTeam = this.findMajorityTeam(neighborCounts.teamCounts);
                        if (majorityTeam !== null) {
                            this.setDesiredState(currentCell, majorityTeam, true);
                        } else {
                            const neighborTeam = this.pickTeamFromNeighbors(neighborCounts.teamCounts);
                            this.setDesiredState(currentCell, neighborTeam, true);
                        }
                    }
                }
            }
        }
    }

    spaceFillingSimulationStep(): void {
        for(let row = 0; row < this.height; row++){
            for(let column = 0; column < this.width; column++){
                const currentCell = this.grid[row][column];
                const neighborCounts = this.wrapAroundGrid ? this.countNeighborsWrapAround(currentCell,2) : this.countNeighbors(currentCell,2);
                const majorityTeam = this.findMajorityTeam(neighborCounts.teamCounts);
                if(majorityTeam !== null){
                    this.setDesiredState(currentCell, majorityTeam, true);
                }
            }
        }
    }

    temperatureSimulationStep(): void {
        let coolingFactor = 0.1;
        for(let row = 0; row < this.height; row++){
            for(let column = 0; column < this.width; column++){
                const currentCell = this.grid[row][column];
                const neighborCounts = this.wrapAroundGrid ? 
                this.countNeighborsWrapAround(currentCell,1,true) : this.countNeighbors(currentCell,1,true);
                const majorityTeam = this.findMajorityTeam(neighborCounts.teamCounts);
                if(majorityTeam !== null){
                    if(currentCell.team === majorityTeam){
                        currentCell.temperature = Math.max(0.1,currentCell.temperature-coolingFactor);
                    }
                    else{
                        currentCell.temperature = Math.min(1,currentCell.temperature+(coolingFactor*1));
                    }
                    this.setDesiredState(currentCell, majorityTeam, true);
                }
            }
        }
    }

    highEnergySimulationStep(): void {
        let coolingFactor = 0.1;
        for(let row = 0; row < this.height; row++){
            for(let column = 0; column < this.width; column++){
                const currentCell = this.grid[row][column];
                const neighborCounts = this.wrapAroundGrid ? 
                this.countNeighborsWrapAround(currentCell,1,true) : this.countNeighbors(currentCell,1,true);
                const majorityTeam = this.findMajorityTeam(neighborCounts.teamCounts);
                if(majorityTeam !== null){
                    if(currentCell.team === majorityTeam){
                        currentCell.temperature = Math.max(0.1,currentCell.temperature-coolingFactor);
                    }
                    else{
                        currentCell.temperature = 1;
                    }
                    this.setDesiredState(currentCell, majorityTeam, true);
                }
            }
        }
    }

    countNeighborsWrapAround(cell: Cell, radius: number, useTemperature: boolean = false): { total: number; teamCounts: number[] } {
        const x = cell.x;
        const y = cell.y;
        const teamCounts: number[] = new Array(this.numberOfTeams + 1).fill(0);
    
        for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
            for (let colOffset = -radius; colOffset <= radius; colOffset++) {
                if (rowOffset === 0 && colOffset === 0 && this.simulationMode === SimulationMode.GameOfLife) {
                    continue;
                }
                
                const newRow = (y + rowOffset + this.height) % this.height;
                const newCol = (x + colOffset + this.width) % this.width;
                const neighbor = this.grid[newRow][newCol];
                if (neighbor.alive) {
                    if(useTemperature){
                        teamCounts[neighbor.team] += neighbor.temperature;
                    }
                    else{
                        teamCounts[neighbor.team]++;
                    }
                }
            }
        }
    
        const total = teamCounts.reduce((a, b) => a + b) - teamCounts[this.deadCell];
        return { total, teamCounts };
    }

    countNeighbors(cell: Cell, radius: Number, useTemperature: boolean = false): { total: number; teamCounts: number[] } {
        const x = cell.x;
        const y = cell.y;
        const teamCounts: number[] = new Array(this.numberOfTeams + 1).fill(0);
        for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
            for (let colOffset = -radius; colOffset <= radius; colOffset++) {
                if (rowOffset === 0 && colOffset === 0 && this.simulationMode === SimulationMode.GameOfLife) {
                    continue;
                }
                const newRow = y + rowOffset;
                const newCol = x + colOffset;
                if (
                    newRow >= 0 &&
                    newRow < this.height &&
                    newCol >= 0 &&
                    newCol < this.width
                ) {
                    const neighbor = this.grid[newRow][newCol];
                    if (neighbor.alive) {
                        if(useTemperature){
                            teamCounts[neighbor.team] += neighbor.temperature;
                        }
                        else{
                            teamCounts[neighbor.team]++;
                        }
                    }
                }
            }
        }
        const total = teamCounts.reduce((a, b) => a + b) - teamCounts[this.deadCell];
        return { total, teamCounts };
    }    

    findMajorityTeam(teamCounts: number[]): number | null {
        let maxCount = 0;
        let majorityTeam = null;
        for (let team = 1; team < teamCounts.length; team++) {
            if (teamCounts[team] > maxCount) {
                maxCount = teamCounts[team];
                majorityTeam = team;
            } else if (teamCounts[team] === maxCount) {
                majorityTeam = null; // No majority exists
            }
        }
    
        return majorityTeam;
    }

    findSuperMajorityTeam(teamCounts: number[]): number | null {
        let maxCount = 0;
        let majorityTeam = null;
        for (let team = 1; team < teamCounts.length; team++) {
            if (teamCounts[team] > 4) {
                majorityTeam = team;
            }
        }
    
        return majorityTeam;
    }

    pickTeamFromNeighbors(teamCounts: number[]): number {
        const liveTeams: Team[] = [];
        
        for (let team = 1; team < teamCounts.length; team++) {
            if (teamCounts[team] > 0) {
                liveTeams.push(this.teams[team]);
            }
        }
        liveTeams.sort((n1,n2) => n2.count - n1.count);
        return liveTeams[0].id;
    }

    setDesiredState(cell: Cell, team: number, alive: boolean): void {
        cell.desiredTeam = team;
        cell.desiredAlive = alive;
        if(!alive){
            cell.temperature = 1;
        }
    }

    applyDesiredState(cell: Cell): void {
        if(cell.desiredAlive && cell.desiredTeam != cell.team){
            if(cell.alive){
                this.decrementCountOfTeam(cell.team);
            }
            this.incrementCountOfTeam(cell.desiredTeam);
        }
        if(!cell.desiredAlive && cell.alive){
            this.decrementCountOfTeam(cell.team);
        }
        cell.team = cell.desiredTeam;
        cell.color = this.teams[cell.team].color;
        cell.alive = cell.desiredAlive;
    }

    decrementCountOfTeam(team: number): void {
        this.teams[team].count--;
    }

    incrementCountOfTeam(team: number): void {
        this.teams[team].count++;
    }

    becomeAlive(cell: Cell, team: number): void {
        this.setDesiredState(cell, team, true);
        this.applyDesiredState(cell);
    }

    die(cell: Cell): void {
        this.setDesiredState(cell, this.deadCell, false);
        this.applyDesiredState(cell);
    }

    numberToBase64(n: number): string {
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        return base64Chars[Math.floor(n / 64)] + base64Chars[n % 64];
    }

    generateGoLTeN(): string {
        let golten = `${this.width}x${this.height}/`;
        for (const team of this.teams) {
            if (team.id === 0) {
                continue;
            }
            golten += `${team.id}${team.color}|`;
        }
        golten = golten.slice(0, -1);
        golten += '^';
        golten += this.simulationMode + '~' + this.wrapAroundGrid + '!';
        let currentCell;
        let previousCell = -1;
        let runLength = 0;

        const flushRun = () => {
            if (runLength > 0) {
                golten += this.numberToBase64(previousCell) + this.numberToBase64(runLength);
                runLength = 0;
            }
        };
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                const cell = this.grid[row][column];
                if (cell.alive) {
                    currentCell = cell.team;
                } else {
                    currentCell = 0;
                }
        
                if (currentCell === previousCell) {
                    runLength++;
                } else {
                    flushRun();
                    previousCell = currentCell;
                    runLength = 1;
                }
            }
        }
        flushRun();
        return golten;
    }

    base64ToNumber(s: string): number {
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        return 64 * base64Chars.indexOf(s.charAt(0)) + base64Chars.indexOf(s.charAt(1));
    }

    loadGoLTeN(golten: string): void {
        const [dimensions, teamAndSimulationAndCellData] = golten.split('/');
        const [width, height] = dimensions.split('x').map(Number);
        this.width = width;
        this.height = height;
        this.applyGridSize();
        const [teamData, simulationAndCellData] = teamAndSimulationAndCellData.split('^');
        const teamsInGolten = teamData.split('|');
        this.clearTeams();
        this.numberOfTeams = 0;
        for(let i = 0; i < teamsInGolten.length; i++){
            let [teamId, teamColor] = teamsInGolten[i].split('#');
            const newTeam: Team = { id: Number(teamId), color: '#'+teamColor, count: 0 }
            this.addTeam(newTeam);
        }
        const [simulationData, cellData] = simulationAndCellData.split('!');
        const [simMode, gridMode] = simulationData.split('~');
        this.simulationMode = simMode as SimulationMode;
        this.wrapAroundGrid = (gridMode === 'true');
        let row = 0;
        let column = 0;
        let index = 0;
        let previousCell = -1;
        while (index < cellData.length) {
            const teamId = this.base64ToNumber(cellData.slice(index, index + 2));
            index += 2;
            const runLength = this.base64ToNumber(cellData.slice(index, index + 2));
            index += 2;
            for (let i = 0; i < runLength; i++) {
                if (teamId === 0) {
                    this.die(this.grid[row][column]);
                } else {
                    this.becomeAlive(this.grid[row][column], teamId);
                }
                column++;
                if (column === this.width) {
                    column = 0;
                    row++;
                }
            }
            previousCell = teamId;
        }
    }

    generateGoLTeNString(): void {
        this.goltenString = this.generateGoLTeN();
    }

    loadGoLTeNFromString(): void {
        if (this.goltenString) {
            this.loadGoLTeN(this.goltenString);
        }
    }
    copyGoLTeNToClipboard(): void {
        const textarea = document.createElement('textarea');
        textarea.value = this.goltenString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    incrementTeamOfCell(cell: Cell): void {
        if(cell.team == this.numberOfTeams){
            this.die(cell);
            return;
        }
        this.setDesiredState(cell, cell.team + 1, true);
        this.applyDesiredState(cell);
    }

    decrementTeamOfCell(cell: Cell): void {
        if(cell.team == 1){
            this.die(cell);
            return;
        }
        else if(cell.team == this.deadCell){
            this.setDesiredState(cell,this.numberOfTeams,true)
        }
        else{
            this.setDesiredState(cell, cell.team - 1, true)
        }
        this.applyDesiredState(cell);
    }

    updateWidth(width: number) {
        this.width = width;
        this.stopSimulation();
    }
      
    updateHeight(height: number) {
        this.height = height;
        this.stopSimulation();
    }

    simulationModes(): SimulationMode[] {
        return Object.values(SimulationMode);
    }

    updateSimulationDescription(): void {
        switch (this.simulationMode) {
            case SimulationMode.GameOfLife:
                this.simulationDescription = 'Conway\'s Game of Life standard rules, modified to support "teams" of different colors.\n• Any live cell with two or three live neighbors survives.\n• Any dead cell with three live neighbors becomes alive.\n• All other cells either die or stay dead.\n• Live cells become the color of the majority of their neighbors.';
                break;
            case SimulationMode.SpaceFilling:
                this.simulationDescription = '• Cells become the "team" of the majority of their neighbors.\n• Cells look 2 cells away for neighbors.\n• Cells don\'t die.';
                break;
            case SimulationMode.Temperature:
                this.simulationDescription = 'Like "Space Filling" mode, but adds a "temperature" component to cells.\n• When a cell\'s state doesn\'t change between simulation steps, it\'s temperature drops.\n• When a cell\'s state changes between simulation steps, it\'s temperature rises.\n• "Hot" cells contribute more strongly to their team when checking for neighboring cells.';
                break;
            case SimulationMode.HighEnergy:
                this.simulationDescription = 'Like "Temperature" mode, but sets a cell\'s temperature to maximum when it\'s state changes.';
                break;
            default:
                this.simulationDescription = 'Conway\'s Game of Life standard rules, modified to support "teams" of different colors.\n• Any live cell with two or three live neighbors survives.\n• Any dead cell with three live neighbors becomes alive.\n• All other cells either die or stay dead.\n• Live cells become the color of the majority of their neighbors.';
        }
    }

    onLeftClick(cell: Cell): void {
        this.incrementTeamOfCell(cell);
    }

    onRightClick(cell: Cell): boolean {
        this.decrementTeamOfCell(cell);
        return false;
    }
}