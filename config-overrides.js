const path = require('path')
const publicPathPlugin = (config, env) => {
    config.output = {
        // filename: "[name].[hash:8].js",
        path: path.resolve(__dirname, "build"),
        // publicPath: ""
        // publicPath: "https://lincode-1307674517"
        publicPath: 'https://lincode-1307674517.cos.ap-guangzhou.myqcloud.com',
        // chunkFilename: "[name].[hash:8].async.js",
    }
    return config
}
const { override } = require('customize-cra')
// module.exports = override(
//     fixBabelImports('import', {
//         libraryName: 'antd-mobile',
//         style: 'css',
//     }),
// );
module.exports = {
    webpack: override(
        publicPathPlugin // if you need  env ,  must set your plugin first, because  customize-cra's api not exports it

    )
}