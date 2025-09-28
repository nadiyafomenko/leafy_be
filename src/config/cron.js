import cron from "cron";
import https from "https";
import { env } from "./env.js";

export const cronJob = new cron.CronJob("*/14 * * * *", () => {
    https.get(env.API_URL, (res) => {
       if(res.statusCode === 200) {
        console.log("Cron job executed");
       }
    }).on("error", (err) => {
        console.log(err);
    });
});
