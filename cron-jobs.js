module.exports = function(RED) {
    function CronJobs(config) {
        RED.nodes.createNode(this,config);
		this.name = config.name;
		this.jobs= {};
        var node = this;

		this.on('input', function(msg) {
			var CronJob = require('cron').CronJob;
			var parser = require('cron-parser');

			// {
			// 	"defaultMsg": {
			// 		"topic": "",
			// 		"payload": ""
			// 	},
			// 	"jobs":[
			// {"id":"id1", "schedule":"* * * * * ", "msg":{ "topic": "", "payload": {}} },
			// {"id","id2", "schedule":"*/30 * * * * " }, // Will use the defaultMsg
			// ...
			// ]}	
			
			(msg.jobs||[]).forEach(function(j){
				try {
					parser.parseExpression(j.schedule);
				} catch (err) {
					node.error("Invalid Expression for job " + j.id);
					return;
				}

				if(node.jobs[j.id]){
					node.jobs[j.id].stop();
				}

				var jmsg = j.msg || msg.defaultMsg;
				node.jobs[j.id] = new CronJob(j.schedule, function () {
					node.status({fill: "green", shape: "dot", text: "Job started. id = " + j.id});
					node.send(jmsg);
					node.status({});
				});

				node.jobs[j.id].start();
			});

			node.status({fill: "blue", shape: "dot", text: "Jobs deployed"});
			setTimeout(function () {
				node.status({});
			}, 2000);

		});
		
		this.on('close', function (done) {
			node.jobs.values().forEach(function(job){
				job.stop();
			});
			node.status({fill: "red", shape: "dot", text: "Jobs stopped"});
			done();
		});
	
    }
    RED.nodes.registerType("cron-jobs",CronJobs);
}