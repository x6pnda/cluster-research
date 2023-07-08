import cluster from 'cluster';
import { app } from 'electron';

export function initDirWorker() {
    cluster.setupPrimary({
        exec: __dirname + '/TestWorker2.js',
        args: [''],
        silent: false,
    });
    cluster.fork({ UV_THREADPOOL_SIZE: 1024 });
    cluster.on('exit', () => app.quit());
}
