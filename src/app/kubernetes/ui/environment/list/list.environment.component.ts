import { ServiceService } from './../../../service/service.service';
import { Params } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { SpaceStore } from './../../../store/space.store';
import { Deployments } from './../../../model/deployment.model';
import { Component, Input, ViewChild } from "@angular/core";

import { Observable, ConnectableObservable } from 'rxjs';

import {
  TreeNode,
  TREE_ACTIONS,
  IActionMapping
} from 'angular2-tree-component';

import { ParentLinkFactory } from "../../../../common/parent-link-factory";
import { CompositeDeploymentStore } from './../../../store/compositedeployment.store';
import { ServiceStore } from './../../../store/service.store';
import { createDeploymentViews } from '../../../view/deployment.view';
import { ReplicaSetService } from './../../../service/replicaset.service';
import { PodService } from './../../../service/pod.service';
import { EventService } from './../../../service/event.service';
import { ConfigMapService } from './../../../service/configmap.service';
import { DeploymentConfigService } from './../../../service/deploymentconfig.service';
import { DeploymentConfigs } from './../../../model/deploymentconfig.model';
import { DeploymentService } from './../../../service/deployment.service';
import { Space, Environment } from './../../../model/space.model';

export let KINDS: Kind[] = [
  {
    name: "ConfigMap",
    path: "configmaps",
  },
  {
    name: "Deployments",
    path: "deployments",
  },
  {
    name: "Events",
    path: "events",
  },
  {
    name: "Pods",
    path: "pods",
  },
  {
    name: "ReplicaSets",
    path: "replicasets",
  },
  {
    name: "Services",
    path: "services",
  },
];

class EnvironmentEntry {
  environment: Environment;
  kinds: KindNode[];
}

class Kind {
  name: string;
  path: string;
}

class KindNode {
  environment: Environment;
  kind: Kind;
  children: [
    {
      data: Observable<any[]>,
    }
  ];
}

@Component({
  selector: 'fabric8-environments-list',
  templateUrl: './list.environment.component.html',
  styleUrls: ['./list.environment.component.scss'],
})
export class EnvironmentListComponent {

  // See: https://angular2-tree.readme.io/docs/options
  options = {
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
        },
      },
    },
    allowDrag: false,
    isExpandedField: 'expanded',
  };

  parentLink: string;

  @Input() loading: boolean;

  //environments: Observable<{ environment: Environment, nodes: { environment: Environment, name: string, path: string, hasChildren: boolean }[] }[]>;

  environments: ConnectableObservable<EnvironmentEntry[]>;
  space: ConnectableObservable<Space>;

  constructor(
    parentLinkFactory: ParentLinkFactory,
    private spaceStore: SpaceStore,
    route: ActivatedRoute,
    private deploymentConfigService: DeploymentConfigService,
    private configMapService: ConfigMapService,
    private eventService: EventService,
    private podService: PodService,
    private replicaSetService: ReplicaSetService,
    private serviceService: ServiceService
  ) {
    this.parentLink = parentLinkFactory.parentLink;
    this.space = route.params.pluck<Params, string>('space')
      .map((id) => spaceStore.load(id))
      .switchMap(() => spaceStore.resource.distinctUntilChanged())
      .skipWhile(space => !space)
      .publish();
    this.space.subscribe(space => console.log(space));
    let kindPaths = Object.keys(KINDS).map(key => KINDS[key].path);
    this.environments = this.space
      .map(space => space.environments)
      .map(environments => environments.map(environment => ({
        environment: environment,
        kinds: KINDS.map(kind => ({
          environment: environment,
          kind: kind,
          children: [
            {
              data: this.getList(kind.path, environment)
                .distinctUntilChanged(),
            },
          ],
        } as KindNode)),
      }),
      ))
      .publish();

    this.environments.subscribe(node => {
      console.log(node);
    });
    this.environments.connect();
    this.space.connect();
  }

  inspect(data: any) {
    console.log('inspecting', data);
    return data;
  }

  private getList(kind: string, environment: Environment): Observable<any[]> {
    let namespace = environment.namespace.name;
    switch (kind) {
      case 'deployments':
        return this.deploymentConfigService.list(namespace);
      case 'configmaps':
        return this.configMapService.list(namespace);
      case 'events':
        return this.eventService.list(namespace);
      case 'pods':
        return this.podService.list(namespace);
      case 'replicasets':
        return this.replicaSetService.list(namespace);
      case 'services':
        return this.serviceService.list(namespace);
      default:
        return Observable.empty();
    }
  }

}
