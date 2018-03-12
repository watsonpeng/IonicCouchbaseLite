import { HttpClient } from '@angular/common/http';
import { Component, NgZone } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { CouchbaseProvider } from "../../providers/couchbase/couchbase";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public items: Array<any>;
  public bulkItems: Array<any>;
  public bulkItemCount: number;

  public constructor(public alertCtrl: AlertController,
                     public couchbase: CouchbaseProvider,
                     public http: HttpClient,
                     public zone: NgZone) {
    this.items = [];
    this.bulkItems = [];
    this.bulkItemCount = 0;
  }

  public ionViewDidEnter() {
    setTimeout(() => {
      this.couchbase.getChangeListener().subscribe(data => {
      for(let i = 0; i < data.length; i++) {
        if(!data[i].hasOwnProperty("deleted") && data[i].id.indexOf("_design") === -1) {
          this.couchbase.getDatabase().getDocument(data[i].id).then(result => {
            if(result.type === "list") {
              this.zone.run(() => {
                // try update first
                var updated = false;
                for (var j = this.items.length - 1; j >= 0; --j) {
                  if (this.items[j]["_id"] === data[i]["id"]) {
                    this.items[j] = result;
                    updated = true;
                  }
                }
                if (!updated) {
                  this.items.push(result);
                }
              });
            }
          });
        } else if(data[i].hasOwnProperty("deleted") && data[i].id.indexOf("_design") === -1) {
          this.zone.run(() => {
            for (var j = this.items.length - 1; j >= 0; --j) {
              if (this.items[j]["_id"] === data[i]["id"]) {
                this.items.splice(j, 1);
                break;
              }
            }
          });
        }
      }
    });
    this.refresh();
    }, 100);
  }

  public refresh() {
    this.couchbase.getDatabase().queryView("_design/todo", "items", {}).then((result: any) => {
      this.items = [];
      for(var i = 0; i < result.rows.length; i++) {
        this.items.push(result.rows[i].value);
      }
    }, error => {
      console.error("ERROR: " + JSON.stringify(error));
    });
  }

  public add() {
    let prompt = this.alertCtrl.create({
      title: 'Todo Items',
      message: "Add a new item to the todo list",
      inputs: [
        {
          name: 'title',
          placeholder: 'Title'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {}
        },
        {
          text: 'Save',
          handler: data => {
            this.couchbase.getDatabase().createDocument({type: "list", title: data.title});
          }
        }
      ]
    });
    prompt.present();
  }

  public delete(documentId, revision) {
    this.couchbase.getDatabase().deleteDocument(documentId, revision).then(res => {
      // id, rev in response
      // this.couchbase.getDatabase().purgeDocument().then( // purge all deleted documents
      this.couchbase.getDatabase().purgeDocument(res.id).then(
        r1 => { console.log("document purged: ");
        },
        err => {
          console.log("document purged failed: ");
        }
      )
    });
  }

  public deleteSync(documentId, revision) {
    this.couchbase.getDatabase().deleteDocumentSync(documentId, revision);
  }

  public showAll() {
    let res = this.couchbase.getDatabase().getAllDocumentsSync({include_docs: true});
    let allDocs = res.rows.filter(x => x.id.indexOf("_design") === -1);
    let prompt = this.alertCtrl.create({
      title: 'All Items',
      message: "All items from sychronous call",
      buttons: allDocs.map(x => { return { 'text': x.doc.title, 'handler': data => {} }; })
    });
    prompt.present();
  }

  public edit(documentId, revision) {
    let prompt = this.alertCtrl.create({
      title: 'Todo Items',
      message: "Edit an existing item on the todo list",
      inputs: [
        {
          name: 'title',
          placeholder: 'Title'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {}
        },
        {
          text: 'Save',
          handler: data => {
            this.couchbase.getDatabase().updateDocument(documentId, revision, {type: "list", title: data.title});
          }
        }
      ]
    });
    prompt.present();
  }

  public bulkLoad() {
    let prompt = this.alertCtrl.create({
      title: 'Bulk Load Data from a URL',
      message: "The URL must return JSON array",
      inputs: [
        {
          name: 'url',
          // the URL must return a list of JSON objects, or contain such a list
          placeholder: 'URL, e.g., https://api.github.com/users'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {}
        },
        {
          text: 'Load',
          handler: data => {
            this.http.get(data.url).subscribe(res => {
              var data = null;
              if(Array.isArray(res)) {
                data = res;
              } else if (typeof res === "object") {
                for(var v in res) {
                  if(Array.isArray(res[v])) {
                    data = res[v];
                    break;
                  }
                }
              }

              if(!data) {
                throw "Cannot find an data array in the API response";
              }

              this.couchbase.getBulkDB().createDocuments(data as Array<any>).then(res => {
                this.couchbase.getBulkDB().getAllDocuments().then(
                  res => {
                    this.bulkItemCount = res.total_rows;
                    let allDocs = res.rows.slice(this.bulkItemCount - 5, this.bulkItemCount).filter(x => x.id.indexOf("_design") === -1);
                    this.bulkItems = allDocs.map(x => { return { 'id': x.id }; });
                  }
                );
              }, err => {
                console.log("Data uploading failure:" + err);
              });
            });
          }
        }
      ]
    });
    prompt.present();
  }

  public bulkLoadSync() {
    let prompt = this.alertCtrl.create({
      title: 'Synchronously Load Data from a URL',
      message: "The URL must return JSON array or contains such a array in the return",
      inputs: [
        {
          name: 'url',
          // the URL must return a list of JSON objects, or contain such a list
          placeholder: 'URL, e.g., https://api.github.com/users'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {}
        },
        {
          text: 'Load',
          handler: data => {
            this.http.get(data.url).subscribe(res => {
              var data = null;
              if(Array.isArray(res)) {
                data = res;
              } else if (typeof res === "object") {
                for(var v in res) {
                  if(Array.isArray(res[v])) {
                    data = res[v];
                    break;
                  }
                }
              }

              if(!data) {
                throw "Cannot find an data array in the API response";
              }

              let db = this.couchbase.getBulkDB();

              db.createDocumentsSync(data as Array<any>);
              var result = db.getAllDocumentsSync();
              this.bulkItemCount = result.total_rows;
              let allDocs = result.rows.slice(this.bulkItemCount - 5, this.bulkItemCount).filter(x => x.id.indexOf("_design") === -1);
              this.bulkItems = allDocs.map(x => { return { 'id': x.id }; });
            });
          }
        }
      ]
    });
    prompt.present();
  }

}
