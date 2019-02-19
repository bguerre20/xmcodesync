// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as needle from 'needle';
import * as fs from 'fs';


//global vars
var commPlan = '';
var sharedLib = '';
var commPlanID = '';
var scriptID = '';
var pulledScriptType = '';
var url = '';
let info : any;

var ops = <needle.NeedleOptions>{
	'username':'',
	'password':'',
	'json':true
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let disposable2 = vscode.commands.registerCommand('xmcodesync.xmpull', () => {
		
		getScript().then(function(parsedScript) {
			if (parsedScript) {
				vscode.workspace.openTextDocument({content:parsedScript,language:'javascript'}).then((doc) => {
				vscode.window.showTextDocument(doc, 0, true);
				});
			}
		});
	});

	let disposable3 = vscode.commands.registerCommand('xmcodesync.xmpush', () => {
		postScript();
	});

	let disposable4 = vscode.commands.registerCommand('xmcodesync.xmsetup', () => {
		setupNewInstance();
	});

	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
	context.subscriptions.push(disposable4);
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function getScript() {
	commPlan = '';
	commPlanID = '';	
	//edit this to handle more than one script pull and push.
	if (!loadInstance()) {
		vscode.window.showWarningMessage('Instance not found. Please set a new instance using the xm setup command.');
		return new Promise<any>((resolve,reject)=>{resolve()});
	}
	
	var scriptObj:ScriptObj = {};

	let qpCommPlanItems:Array<any> = [];
	let qpScriptItems:Array<any> = [];
	
	return needle('get', url + '/api/xm/1/plans', ops)
	.then(function(plans) {
		for(var i = 0; i < plans.body.count;i++) {
			qpCommPlanItems.push(<myQPItem>{"label":plans.body.data[i].name, "value":plans.body.data[i]});	
		}
			
		return vscode.window.showQuickPick(qpCommPlanItems, <vscode.QuickPickOptions>{placeHolder:"Select a comm plan", ignoreFocusOut:true, matchOnDetail:true, matchOnDescription:true}).then((selectedPlan) =>{
			if(selectedPlan){
				commPlanID = selectedPlan.value.id;
			}
			return needle('get', url + '/api/xm/1/plans/'+commPlanID+'/shared-libraries',ops);
		});
	})
	.then(function(sharedLibs) {
		console.log(sharedLibs.body.count);
		for (var j = 0; j < sharedLibs.body.count; j++) {
			qpScriptItems.push({"label":sharedLibs.body.data[j].name, "detail": "Shared Library","value":sharedLibs.body.data[j]});	
		}

		return needle('get', url + '/api/xm/1/plans/'+commPlanID+'/integrations',ops).then(function(commPlanIntegrations) {
			
			for (var k = 0; k < commPlanIntegrations.body.count; k++) {
				qpScriptItems.push({"label":commPlanIntegrations.body.data[k].name, "detail": "Integration","value":commPlanIntegrations.body.data[k]});	
			}

			return vscode.window.showQuickPick(qpScriptItems, <vscode.QuickPickOptions>{placeHolder:"Select a script", ignoreFocusOut:true, matchOnDetail:true, matchOnDescription:true}).then((selectedScript) =>{
				if(selectedScript){
					scriptObj = selectedScript.value;
					let script = scriptObj.script||'';

					scriptID = scriptObj.id||'';
					pulledScriptType = selectedScript.detail;

					
					let buff = Buffer.from(script, 'base64')  
					
					let text = "//script_info\n//" + scriptObj.name + "\n//" + scriptObj.id + "\n";
					text += buff.toString('ascii');
					
					return text;
			}});
		});
	});
}//end getSharedLibrary function

export function postScript() {
	var data:ScriptObj = {};
	
	let scriptToSend  = '';
	let activeText = vscode.window.activeTextEditor;
	if (activeText){
		scriptToSend = activeText.document.getText()
		
		let base64data = Buffer.from(scriptToSend).toString('base64');
		
		//read first 3 lines of script file
		let scriptLines = scriptToSend.split('\n');
		let newScript = '';
		if (scriptLines[0] === '//script_info') {
			data.id = scriptLines[2].replace("//", "");
			for (var i = 3; i < scriptLines.length; i++) {
				newScript += scriptLines[i] + "\n";
			}
			base64data = Buffer.from(newScript).toString('base64');
		}
		else {
			data.id = scriptID;
			data.script = base64data;
		}

		

		if (pulledScriptType === "Shared Library") {
			needle("post", 'https://bguerre.xmatters.com/api/xm/1/shared-libraries', data, ops).then(function(httpResponse) {
				vscode.window.showInformationMessage('Code has been pushed.');
			});
		}
		else if (pulledScriptType === "Integration") {
			data.script = scriptToSend;
			needle("post", 'https://bguerre.xmatters.com/api/xm/1/plans/'+ commPlanID + '/integrations', data, ops).then(function(httpResponse) {	
				vscode.window.showInformationMessage('Code has been pushed.');
			});
		}
	}
}//end postSharedLibraryFunction

export function setupNewInstance() {
	vscode.window.showInputBox(<vscode.InputBoxOptions>{placeHolder:"Please enter in your instance shortname.", ignoreFocusOut:true}).then((instanceName)=> {
		if (instanceName) {
			vscode.window.showInputBox(<vscode.InputBoxOptions>{placeHolder:"Please enter in your auth userID", ignoreFocusOut:true}).then((userID)=> {
				if (userID) {
					vscode.window.showInputBox(<vscode.InputBoxOptions>{placeHolder:"Please enter in your auth password", ignoreFocusOut:true, password:true}).then((pw)=> {
						if (pw) {
							if (instanceName.indexOf('://') >-1){
								let parsedInstanceName = instanceName.replace(instanceName.split('.com')[1], '');
								url = parsedInstanceName;
							}else {
								url = 'https://' + instanceName + '.xmatters.com';
							}

							ops.username = userID;
							ops.password = pw;
							
							let instance:InstanceConfigObj = {url:url,user:ops.username,pw:ops.password};

							needle('get', url + '/api/xm/1/people/' + ops.username, ops).then((testResponse)=>{
								if (testResponse.statusCode && testResponse.statusCode >= 200 && testResponse.statusCode <= 299) {
									vscode.window.showInformationMessage("Test connection Successful.");
									fs.writeFileSync("xm_code_sync_info.json", JSON.stringify(instance,null,4));
								}
								else {
									vscode.window.showWarningMessage("Incorrect information entered: see console log for details.");
									console.warn("Incorrect information entered: \n url: " + url + "\n username: " + ops.username + "\n password: NOT LOGGED");
								}
							});
						}
					});
				}
			});
		}
	});

}//end setupNewInstance

export function loadInstance() {
	let content:InstanceConfigObj;
	if (fs.existsSync('xm_code_sync_info.json')) {
			content = JSON.parse(fs.readFileSync('xm_code_sync_info.json', 'utf8').toString());
	
		url = content.url;
		ops.username = content.user;
		ops.password = content.pw;

		return true;
	}
	else {return false;}
}//end loadInstanceFunction


interface ScriptObj {
	id?:string;
	name?:string;
	script?:string;
}

interface InstanceConfigObj {
	url:string;
	user:string;
	pw:string;
}

interface myQPItem extends vscode.QuickPickItem {
	value:any;
}