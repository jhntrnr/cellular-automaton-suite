import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GolGridComponent } from './gol-grid/gol-grid.component';
import { TeamCreatorComponent } from './team-creator/team-creator.component';


@NgModule({
  declarations: [
    AppComponent,
    GolGridComponent,
    TeamCreatorComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
  ],
  providers: [TeamCreatorComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
