import { Deployments } from './../../../model/deployment.model';
import { Component, Input, ViewChild } from "@angular/core";

import { Observable } from 'rxjs';

import {
  TreeNode,
  TREE_ACTIONS,
  IActionMapping
} from 'angular2-tree-component';

import { ParentLinkFactory } from "../../../../common/parent-link-factory";
import { CompositeDeploymentStore } from './../../../store/compositedeployment.store';
import { ServiceStore } from './../../../store/service.store';
import { createDeploymentViews } from '../../../view/deployment.view';

class Environment {
  name: string;
  type: EnvironmentType;
  namespaceRef: string;
  space: string;
}

class EnvironmentType {


  public static readonly DEV = { name: 'dev' } as EnvironmentType;
  public static readonly INT = { name: 'int' } as EnvironmentType;
  public static readonly PROD = { name: 'prod' } as EnvironmentType;

  name: string;

  public static readonly MAPPED: Map<string, EnvironmentType> = new Map([
    [EnvironmentType.DEV.name, EnvironmentType.DEV],
    [EnvironmentType.INT.name, EnvironmentType.INT],
    [EnvironmentType.PROD.name, EnvironmentType.PROD],
  ]);

}


@Component({
  selector: 'fabric8-environments-list',
  templateUrl: './list.environment.component.html',
  styleUrls: ['./list.environment.component.scss'],
})
export class EnvironmentListComponent {

  environments: Observable<Environment[]>;

  nodes: any[] = [
    {
      name: 'ConfigMap',
      hasChildren: true
    },
    {
      name: 'Deployments',
      hasChildren: true
    },
    {
      name: 'Events',
      hasChildren: true
    }, {
      name: 'Pods',
      hasChildren: true
    }, {
      name: 'Replica Sets',
      hasChildren: true
    }, {
      name: 'Services',
      hasChildren: true
    }
  ];
  // See: https://angular2-tree.readme.io/docs/options
  options = {
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
        }
      }
    },
    allowDrag: false,
    isExpandedField: 'expanded',
    getChildren: this.getChildren.bind(this)
  };

  parentLink: string;

  @Input() loading: boolean;

  constructor(
    parentLinkFactory: ParentLinkFactory,
    private deploymentsStore: CompositeDeploymentStore,
  ) {
    this.parentLink = parentLinkFactory.parentLink;
    this.environments = Observable.of(['dev', 'int'].map(env => ({
        name: `BalloonPopGame (${env.slice(0, 1).toLocaleUpperCase()}${env.slice(1, env.length)})`,
        type: EnvironmentType.MAPPED.get(env),
        namespaceRef: `rhn-support-pmuir-${env}`,
        space: 'BalloonPopGame'
      } as Environment)));

  }

  private get deployments(): Observable<Deployments> {
    return this.deploymentsStore.loadAll();
  }

getChildren(node: TreeNode) {
  if (node.data.name === 'Deployments') {
    return this.deployments
      .map(deployments => deployments.map(deployment => ({
        name: deployment.name,
        deployment: deployment,
        hasChildren: false
      })))
      .do(val => console.log('children:', val)).first()
      .toPromise();
  } else {
    return Observable.of({}).toPromise();
  }
}

childrenCount(node: TreeNode): string {
  return node && node.children ? `(${node.children.length})` : '';
}

}
