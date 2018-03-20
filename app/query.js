/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
var path = require('path');
var fs = require('fs');
var util = require('util');
var hfc = require('fabric-client');
var helper = require('./helper.js');
var logger = helper.getLogger('Query');
var invoke = require('./invoke-transaction.js')
var py =require('python-shell')

var queryChaincode = async function(peer, channelName, chaincodeName, args, fcn, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
		var channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}

		// send query
		var request = {
			targets : [peer], //queryByChaincode allows for multiple targets
			chaincodeId: chaincodeName,
			fcn: fcn,
			args: args
		};
		let response_payloads = await channel.queryByChaincode(request);
		if (response_payloads) {
			for (let i = 0; i < response_payloads.length; i++) {
				logger.info(args[0]+' now has ' + response_payloads[i].toString('utf8') +
					' after the move');
				return args[0]+' now has ' + response_payloads[i].toString('utf8') +
					' after the move';
			}
		} else {
			logger.error('response_payloads is null');
			return 'response_payloads is null';
		}
	} catch(error) {
		logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};
var getBlockByNumber = async function(peer, channelName, blockNumber, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
		var channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}

		let response_payload = await channel.queryBlock(parseInt(blockNumber, peer));
		if (response_payload) {
			logger.debug(response_payload);
			return response_payload;
		} else {
			logger.error('response_payload is null');
			return 'response_payload is null';
		}
	} catch(error) {
		logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};
var getTransactionByID = async function(peer, channelName, trxnID, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
		var channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}

		let response_payload = await channel.queryTransaction(trxnID, peer);
		if (response_payload) {
			logger.debug(response_payload);
			return response_payload;
		} else {
			logger.error('response_payload is null');
			return 'response_payload is null';
		}
	} catch(error) {
		logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};
var getBlockByHash = async function(peer, channelName, hash, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
		var channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}

		let response_payload = await channel.queryBlockByHash(Buffer.from(hash), peer);
		if (response_payload) {
			logger.debug(response_payload);
			return response_payload;
		} else {
			logger.error('response_payload is null');
			return 'response_payload is null';
		}
	} catch(error) {
		logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};
var getChainInfo = async function(peer, channelName, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
		var channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}

		let response_payload = await channel.queryInfo(peer);
		if (response_payload) {
			logger.debug(response_payload);
			return response_payload;
		} else {
			logger.error('response_payload is null');
			return 'response_payload is null';
		}
	} catch(error) {
		logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};
//getInstalledChaincodes
var getInstalledChaincodes = async function(peer, channelName, type, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

		let response = null
		if (type === 'installed') {
			response = await client.queryInstalledChaincodes(peer, true); //use the admin identity
		} else {
			var channel = client.getChannel(channelName);
			if(!channel) {
				let message = util.format('Channel %s was not defined in the connection profile', channelName);
				logger.error(message);
				throw new Error(message);
			}
			response = await channel.queryInstantiatedChaincodes(peer, true); //use the admin identity
		}
		if (response) {
			if (type === 'installed') {
				logger.debug('<<< Installed Chaincodes >>>');
			} else {
				logger.debug('<<< Instantiated Chaincodes >>>');
			}
			var details = [];
			for (let i = 0; i < response.chaincodes.length; i++) {
				logger.debug('name: ' + response.chaincodes[i].name + ', version: ' +
					response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
				);
				details.push('name: ' + response.chaincodes[i].name + ', version: ' +
					response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
				);
			}
			return details;
		} else {
			logger.error('response is null');
			return 'response is null';
		}
	} catch(error) {
		logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};
var getChannels = async function(peer, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

		let response = await client.queryChannels(peer);
		if (response) {
			logger.debug('<<< channels >>>');
			var channelNames = [];
			for (let i = 0; i < response.channels.length; i++) {
				channelNames.push('channel id: ' + response.channels[i].channel_id);
			}
			logger.debug(channelNames);
			return response;
		} else {
			logger.error('response_payloads is null');
			return 'response_payloads is null';
		}
	} catch(error) {
		logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};

var queryAndInvoke = async function(peer, trxnId, username, org_name,channelName, chaincodeName, peerTargets, permission,fcn) {
	logger.debug("peer "+peer+"\ntxnId:"+trxnId)
	logger.debug("username "+username)
	logger.debug("org "+org_name)
	logger.debug("channelName"+channelName)
	logger.debug("chaincode name "+chaincodeName)
	logger.debug("fcn"+ fcn)
	logger.debug( "targets "+peerTargets)
	logger.debug(" permission"+ permission)
	// =====================================

	try {
			// first setup the client for this org
			var client = await helper.getClientForOrg(org_name, username);
			logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
			var channel = client.getChannel(channelName);
			if(!channel) {
				let message = util.format('Channel %s was not defined in the connection profile', channelName);
				logger.error(message);
				throw new Error(message);
			}
			
			let response_payloads = await channel.queryTransaction(trxnId,peer);
			logger.info("response payload:"+ response_payloads)
			if (response_payloads) {
				for (let i = 0; i < response_payloads.length; i++) {
					logger.info("reponse paloads"+response_payloads[i].toString('utf8'));

					logger.debug("validation code:"+response_payloads["validationCode"])
				}

				if(fcn==="switching"){
					var response=response_payloads["transactionEnvelope"]["payload"]["data"]["actions"][0]["payload"]["action"]["proposal_response_payload"]["extension"]["response"]["payload"];
					logger.debug("response:"+response)

					var obj = JSON.parse(response);
					var switchID=obj["switchID"]
					logger.debug("switchId:"+switchID)
					var args=[]
					args.push(permission)
					args.push(switchID)
					var pyarg=[]
					// args.push(org_name)
					if (args[0]==="ON"){
						pyarg.push("1")
					}else{
						pyarg.push("0")
					}

					pyarg.push(org_name)
					pyarg.push(switchID)
					logger.debug("before invoking python args: "+pyarg)
					var opt={
						mode: 'text',
						scriptPath:'/home/rtcin/go/src/github.com/hyperledger/v1.1preview/balance-transfer/eventing_scripts',
						args: pyarg
						};
						py.run('switch.py',opt,function(err,results){
							if(err) throw err;
							logger.debug('results from switch.py: '+results)
						});
					var cub=""
					for (let i = 0; i < 3; i++){

						cub =response_payloads["transactionEnvelope"]["payload"]["data"]["actions"][0]["payload"]["action"]["proposal_response_payload"]["extension"]["results"]["ns_rwset"][0]["rwset"]["reads"][i]["key"];
						if (cub.search("Room|Cubicle|ConfRoom")!=-1){
							break;
						}
					}
					logger.debug("cubincle ID: "+cub)
					args.push(cub)
					logger.debug("before calling chaincode args: "+args)
				}
				if((fcn==="ApproveOrDeny")||(fcn==="occupyWorkSpace")){
					var schId=response_payloads["transactionEnvelope"]["payload"]["data"]["actions"][0]["payload"]["action"]["proposal_response_payload"]["extension"]["results"]["ns_rwset"][0]["rwset"]["writes"][0]["key"];
					var Id1=response_payloads["transactionEnvelope"]["payload"]["data"]["actions"][0]["payload"]["action"]["proposal_response_payload"]["extension"]["results"]["ns_rwset"][0]["rwset"]["writes"][1]["key"]			
					var Id2=response_payloads["transactionEnvelope"]["payload"]["data"]["actions"][0]["payload"]["action"]["proposal_response_payload"]["extension"]["results"]["ns_rwset"][0]["rwset"]["writes"][2]["key"]			
					logger.debug("schId"+schId)
					logger.debug("Id1"+Id1)
					logger.debug("Id2"+Id2)
					var args=[]
					logger.debug("id1"+Id1.search("Room|Cubicle|ConfRoom"))
					logger.debug("id2"+Id2.search("Room|Cubicle|ConfRoom"))
					if (Id1.search("Room|Cubicle|ConfRoom")>-1){
						cubId=Id1;
						Uid=Id2;
					}else if(Id2.search("Room|Cubicle|ConfRoom")>-1){
						Uid=Id1;
						cubId=Id2;
					}
					if(fcn==="ApproveOrDeny"){
						args.push(cubId)
						args.push(schId)
						args.push(Uid)
						args.push(permission)
					}else if(fcn==="occupyWorkSpace"){
						args.push(schId)
						args.push(Uid)
						args.push((new Date).getTime().toString())
						args.push(cubId)
					}
					logger.debug("schId "+schId)
					logger.debug("cubId "+cubId)
					logger.debug("Uid "+Uid)
					logger.debug("args"+args)
				}
			// 	var peerObj=JSON.parse(peerTargets)
			// 	logger.debug(peerObj)
			// //var msg
			
				var message= invoke.invokeChaincode("",channelName, chaincodeName, fcn, args, username, org_name)
				return message

			}else {
				logger.error('response_payloads is null');
				return 'response_payloads is null';
			}
		
	} catch(error) {
		logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};
	// ==========================

exports.queryAndInvoke=queryAndInvoke;
exports.queryChaincode = queryChaincode;
exports.getBlockByNumber = getBlockByNumber;
exports.getTransactionByID = getTransactionByID;
exports.getBlockByHash = getBlockByHash;
exports.getChainInfo = getChainInfo;
exports.getInstalledChaincodes = getInstalledChaincodes;
exports.getChannels = getChannels;
