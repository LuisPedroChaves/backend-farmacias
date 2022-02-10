import CronJob from 'node-cron';

exports.initScheduledJobs = () => {
  const scheduledJobFunction = CronJob.schedule("*/5 * * * *", (now: Date) => {
    console.log("I'm executed on a schedule!");
    console.log(now);
  });

  scheduledJobFunction.start();
}