const fs = require('fs');
const WebpackObfuscator = require('webpack-obfuscator');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

function clearLibElectron() {
    if (!fs.existsSync('./lib-electron')) {
        fs.mkdirSync('./lib-electron');
        return;
    }

    for (const item of fs.readdirSync('./lib-electron')) {
        const path = `./lib-electron/${item}`;
        const fd = fs.openSync(path);
        const data = fs.fstatSync(fd);
        fs.closeSync(fd);

        if (data.isDirectory()) {
            fs.rmSync(path, { recursive: true, force: true });
        } else {
            fs.unlinkSync(path);
        }
    }
}

clearLibElectron();

const plugins = [
    new WebpackObfuscator({
        optionsPreset: 'medium-obfuscation',
        sourceMap: true,
        disableConsoleOutput: false,
        seed: 110611782,
        // debugProtection: false,
        // debugProtectionInterval: false,
    }),
];

const rules = [
    {
        test: /\.ts$/,
        include: /(electron|src)/,
        exclude: /(node_modules|\.webpack)/,
        use: [
            {
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                    configFile: 'tsconfig.electron.json',
                },
            },
        ],
    },
    {
        test: /\.node$/,
        use: 'node-loader',
    },
    { test: /\.(sh|ps1|exe|apk|ttf|html|png|webm|webp|pub|pem)$/, use: 'raw-loader' },
];

const base = {
    mode: 'production',
    module: { rules },
    devtool: 'source-map',
    plugins,
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    externalsPresets: {
        node: true, // in order to ignore built-in modules like path, fs, etc.
    },
    resolve: {
        plugins: [new TsconfigPathsPlugin({ logLevel: 'info', configFile: './tsconfig.electron.json' })],
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    },
};

module.exports = [
    {
        entry: './electron/main.ts',
        target: 'electron-main',
        output: {
            path: __dirname + '/lib-electron',
            filename: 'main.js',
        },
        ...base,
    },
    {
        entry: './electron/preload.ts',
        target: 'electron-main',
        output: {
            path: __dirname + '/lib-electron',
            filename: 'preload.js',
        },
        ...base,
    },
    {
        entry: './electron/TestWorker.ts',
        target: 'electron-main',
        devtool: 'source-map',
        output: {
            path: __dirname + '/lib-electron',
            filename: 'TestWorker.js',
        },
        ...base,
    },
    {
        entry: './electron/test/TestWorker2.ts',
        target: 'electron-main',
        devtool: 'source-map',
        output: {
            path: __dirname + '/lib-electron',
            filename: 'TestWorker2.js',
        },
        ...base,
    },
];
