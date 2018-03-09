import { Component, NgZone } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { CouchbaseProvider } from "../../providers/couchbase/couchbase";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public items: Array<any>;

  public constructor(public alertCtrl: AlertController,
                     public couchbase: CouchbaseProvider,
                     public zone: NgZone) {
    this.items = [];
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

}
