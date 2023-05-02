import { Component, Output, EventEmitter, OnInit } from '@angular/core';

export interface Team {
    id: number;
    color: string;
    count: number;
}

@Component({
    selector: 'app-team-creator',
    templateUrl: './team-creator.component.html',
    styleUrls: ['./team-creator.component.css']
})
export class TeamCreatorComponent implements OnInit {

    constructor() {}

    teamColors = ['#ffffff','#1F618D','#B03A2E','#F1C40F','#27AE60','#8E44AD','#ABB2B9']
    nextTeamColor = '#000000';
    createdTeams = 3;

    ngOnInit(): void {
        this.updateNextTeamColor();
    }
    
    @Output() teamCreated = new EventEmitter<Team>();

    createTeam(): void {
        if(this.createdTeams > 250){
            return;
        }
        const newTeam: Team = {
            id: this.createdTeams,
            color: this.nextTeamColor,
            count: 0,
        };
        this.createdTeams++;
        this.updateNextTeamColor();
        this.teamCreated.emit(newTeam);
    }

    updateNextTeamColor(): void {
        if(this.createdTeams < this.teamColors.length){
            this.nextTeamColor = this.teamColors[this.createdTeams];
        }
        else{
            this.nextTeamColor = this.generateRandomColor();
        }
    }

    generateRandomColor(): string {
        if(this.createdTeams < this.teamColors.length){
            let color = this.teamColors[this.createdTeams];
            this.createdTeams++
            this.updateNextTeamColor();
            return color;
        }
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}
