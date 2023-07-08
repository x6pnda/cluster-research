process.on('uncaughtException', (e) => {
    console.log(e)
});

process.on('unhandledRejection', (e: undefined | null | Error | string) => {
    console.log(e)
});

console.log("Worker started")