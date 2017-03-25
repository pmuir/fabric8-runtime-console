import {Component, OnInit} from "@angular/core";
import {Observable} from "rxjs/Observable";

@Component({
  host:{
      'class':"app-component flex-container in-column-direction flex-grow-1"
  },
  selector: 'fabric8-environments-list-page',
  templateUrl: './list-page.environment.component.html',
  styleUrls: ['./list-page.environment.component.scss'],
})
export class EnvironmentListPageComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {
  }

}
