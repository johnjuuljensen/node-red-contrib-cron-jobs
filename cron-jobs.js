module.exports = function(RED) {
    function CronJobs(config) {
        RED.nodes.createNode(this,config);
		this.name = config.name;
		this.jobs= {};
        var node = this;

		this.on('input', function(msg) {
			var CronJob = require('cron').CronJob;
			var parser = require('cron-parser');

			var jobsRescheduled = 0;
			(msg.jobs||[]).forEach(function(j){
				try {
					parser.parseExpression(j.schedule);
				} catch (err) {
					node.error("Invalid Expression for job " + j.id);
					return;
				}

				if(node.jobs[j.id]){
					node.jobs[j.id].stop();
					jobsRescheduled++;
				}

				var jmsgs = [].concat( j.msg || msg.defaultMsg );
				node.jobs[j.id] = new CronJob(j.schedule, function () {
					node.status({fill: "green", shape: "dot", text: "Job started. id = " + j.id});
					jmsgs.forEach(function(m){
						node.send(m);
					});
					setTimeout(function () {
						node.status({});
					}, 2000);
				});

				node.jobs[j.id].start();
			});

			node.status({fill: "blue", shape: "dot", text: "Jobs deployed"});
			setTimeout(function () {
				node.status({});
			}, 2000);

			node.send({
				"topic": "cron-jobs: scheduled",
				"payload": {
					"jobsRescheduled": jobsRescheduled,
					"jobsReceived": msg.jobs
				}
			});

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