const cron = require("node-cron")
const taskModel = require("../models/tasks")

cron.schedule("55 23 * * *", async () => {

    console.log("✅ Cron triggered at 23:55");
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    await taskModel.updateMany(
        {
            status: "pending",
            selectedDate: {
                $gte: startOfToday,
                $lte: endOfToday
            }
        },
        {
            $set: { status: "missed" }
        }
    );

});
