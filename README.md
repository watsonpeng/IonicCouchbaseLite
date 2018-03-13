# README

## Test App on Ionic Framework 3 and Couchbase Lite

### Purpose of this test app

This test app is created to test the cordova-couchbase-async-sync, a JavaScript Wrapper for the Apache Cordova Couchbase Plugin.

Beyond demonstrating the basic interaction between Ionic Framework and Couchbase Lite, this app also samples both the asynchronous and synchronous APIs from the JavaScript Wrapper for the Apache Cordova Couchbase Plugin module.

### How to run this test app

1. First, we need to prepare the cordova-couchbase-async-sync npm module. 
```
git clone git@bitbucket.org:sbajpai-healthwizz/couchbase.git
cd couchbase
npm install
tsc -p .
```
Note that once the required module above is in a npm repository, we will not need the steps above. In addition, we will need to modify the package.json file to point to the cordova-couchbase-async-sync module in the npm repository, instead of a symlink to a local folder.  With that, we should also remove `sync-request` from the `package.json` file. More details on that in below.
2. Prepare the test app
```
npm install -g ionic ios-sim cordova
git clone git@bitbucket.org:sbajpai-healthwizz/couchbase_ionic.git
cd couchbase_ionic
ln -s PATH_TO_MODULE_cordova-couchbase-async-sync cordova-couchbase-async-sync
```
Note that Android version 6.3.0 is configured in config.xml, instead of the latest version.  For the detailed reason, check https://github.com/ionic-team/ionic/issues/13702.
3. Install Android Studio ()and set up Android virtual device for testing).  To run the test app with Android:
```
ionic cordova run android
```
If this, or the following, fails on npm installing sync-request, please do the following and continue:
```
npm uninstall cordova-couchbase-async-sync
npm install sync-request
npm install cordova-couchbase-async-sync
```
The reason for this is as follows.  `sync-request` is a `cordova-couchbase-async-sync` dependency; this test Ionic application does not use `sync-request` directly.  To build the Ionic application using the local `cordova-couchbase-async-sync` module, we install `sync-request` as a direct dependency. The possible failure is due to the conflict dependency.  Thus the fix is to remove `cordova-couchbase-async-sync`, install `sync-request`, and then install `cordova-couchbase-async-sync` again.
4. Build an iOS app with this commmand
```
ionic cordova build ios
```
After that follow the necessary steps to run the iOS app in a simulator or an iOS device.


