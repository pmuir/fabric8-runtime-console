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

export let KINDS: any[] = [
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
        }
      }
    },
    allowDrag: false,
    isExpandedField: 'expanded',
    getChildren: this.getChildren.bind(this)
  };

  parentLink: string;

  @Input() loading: boolean;

  environments: Observable<{ environment: Environment, nodes: { environment: Environment, name: string, path: string, hasChildren: boolean }[] }[]>;

  space: ConnectableObservable<Space>;
  data: Observable<Map<Environment, Map<string, any[]>>>;
  environments1: Observable<Environment[]>;

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
      .map(environments => environments.map(environment => {
        let e = {
          environment: environment,
          // Create the tree nodes for each environment
          nodes: KINDS.map(kind => ({
            environment: environment,
            name: kind.name,
            path: kind.path,
            hasChildren: true,
          })),
        };
        return e;
      }));
    this.data = this.space
      .map(space => space.environments)
      .switchMap(environments => {
        let res = environments.map(environment => {
          return kindPaths
            .map(kind => {
              return this.getList(kind, environment)
                .distinctUntilChanged()
                .map(obj => ({ environment: environment, obj: obj, kind: kind }));
            });
        });
        let reduced = res.reduce((acc, val) => acc.concat(val), []);
        return Observable.merge(...reduced);
      })
      .scan((res, wrapper) => {
        if (!res.has(wrapper.environment)) {
          res.set(wrapper.environment, new Map());
        }
        res.get(wrapper.environment).set(wrapper.kind, wrapper.obj);
        return res;
      }, new Map<Environment, any>());

    this.data.subscribe(data => {
      console.log(data);
    });
    this.environments.subscribe(environments => console.log(environments));
    this.environments1 = Observable.of([]);
    this.space.connect();
  }

  getChildren(node: TreeNode) {
    return new Promise(resolve => {

    });
    return ;
  }

  childrenCount(node: TreeNode): string {
    return node && node.children ? `(${node.children.length})` : '';
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
