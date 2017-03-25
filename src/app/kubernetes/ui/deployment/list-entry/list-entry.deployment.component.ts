import {Component, Input, ViewChild} from "@angular/core";
import {DeploymentDeleteDialog} from "../delete-dialog/delete-dialog.deployment.component";
import {DeploymentScaleDialog} from "../scale-dialog/scale-dialog.deployment.component";
import {DeploymentView} from '../../../view/deployment.view';

@Component({
  selector: 'fabric8-deployment-list-entry',
  templateUrl: './list-entry.deployment.component.html',
  styleUrls: ['./list-entry.deployment.component.scss'],
})
export class DeploymentsListEntryComponent {

  @Input() deployment: DeploymentView;

  @Input() loading: boolean;

}
