import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Couchbase, Database } from "cordova-couchbase-async-sync/core";
import 'rxjs/add/operator/map';

declare var emit: any;

/*
 Generated class for the CouchbaseProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class CouchbaseProvider {
  private isInstantiated: boolean;
  private database: Database;
  private listener: EventEmitter<any> = new EventEmitter();

  public constructor(public http: HttpClient, platform: Platform) {
    if(!this.isInstantiated) {
      platform.ready().then(() => {

        (new Couchbase()).openDatabase("nraboy").then(database => {
          this.database = database;

          let views = {
            items: {
              map: function(doc) {
                if(doc.type == "list" && doc.title) {
                  emit(doc._id, {title: doc.title, rev: doc._rev})
                }
              }.toString()
            }
          };
          this.database.createDesignDocument("_design/todo", views);
          this.database.listen(change => {
            this.listener.emit(change.detail);
          });

          this.isInstantiated = true;
        }, error => {
          console.error(error);
        });

      });
    }
  }

  public getDatabase() {
    return this.database;
  }

  public getChangeListener(): EventEmitter<any> {
    return this.listener;
  }
}
