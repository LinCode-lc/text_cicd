
// console.log(process.env)
// import OSS from 'ali-oss'
import fs from 'fs'
import { resolve } from 'path'
import readdirp from 'readdirp'
import PQueue from 'p-queue'

const queue = new PQueue({ concurrency: 10 })
import COS from 'cos-nodejs-sdk-v5'
// var COS = require('cos-nodejs-sdk-v5');
var cos = new COS({
    SecretId: process.argv[process.argv.indexOf('SECRET_ID') + 1],
    SecretKey: process.argv[process.argv.indexOf('SECRET_KEY') + 1]
});
// const client = new OSS({
//     // region: 'oss-cn-beijing',
//     region: "ap-guangzhou",
//     accessKeyId: process.argv[process.argv.indexOf('ACCESS_KEY_ID') + 1],
//     accessKeySecret: process.argv[process.argv.indexOf('ACCESS_KEY_SECRET') + 1],
//     bucket: 'shanyue-cra'
// })

// 判断文件 (Object)是否在 OSS 中存在
// 对于带有 hash 的文件而言，如果存在该文件名，则在 OSS 中存在
// 对于不带有 hash 的文件而言，可对该 Object 设置一个 X-OSS-META-MTIME 或者 X-OSS-META-HASH 每次对比来判断该文件是否存在更改，本函数跳过
// 如果再严谨点，将会继续对比 header 之类
// async function isExistObject(objectName) {
//     try {
//         await client.head(objectName)
//         return true
//     } catch (e) {
//         return false
//     }
// }
function isExistObject(objectName) {
    return new Promise((resolve, reject) => {
        cos.headObject({
            Bucket: 'lincode-1307674517', /* 填入您自己的存储桶，必须字段 */
            Region: 'ap-guangzhou',  /* 存储桶所在地域，例如ap-beijing，必须字段 */
            Key: objectName,  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
        }, function (err, data) {
            if (data) {
                console.log(2)
                resolve(true)
            } else if (err.code == 404) {
                console.log(1)
                resolve(false)
            } else if (err.code == 403) {
                console.log(2)
                console.log('没有该对象读权限');
            }
        });
    })
}
// objectName: static/css/main.079c3a.css
// withHash: 该文件名是否携带 hash 值
// async function uploadFile(objectName, withHash = false) {
//     const file = resolve('./build', objectName)
//     // 如果路径名称不带有 hash 值，则直接判断在 OSS 中不存在该文件名，需要重新上传
//     const exist = withHash ? await isExistObject(objectName) : false
//     if (!exist) {
//         const cacheControl = withHash ? 'max-age=31536000' : 'no-cache'
//         // 为了加速传输速度，这里使用 stream
//         await client.putStream(objectName, createReadStream(file), {
//             headers: {
//                 'Cache-Control': cacheControl
//             }
//         })
//         console.log(`Done: ${objectName}`)
//     } else {
//         // 如果该文件在 OSS 已存在，则跳过该文件 (Object)
//         console.log(`Skip: ${objectName}`)
//     }
// }
async function uploadFile(objectName, withHash = false) {
    const file = resolve('./build', objectName)
    console.log(file)
    //如果路径名称不带有 hash 值，则直接判断在 OSS 中不存在该文件名，需要重新上传
    const exist = withHash ? await isExistObject(objectName) : false
    console.log(exist)
    if (!exist) {
        const cacheControl = withHash ? 'max-age=31536000' : 'no-cache'
        cos.putObject({
            Bucket: 'lincode-1307674517', /* 填入您自己的存储桶，必须字段 */
            Region: 'ap-guangzhou',  /* 存储桶所在地域，例如ap-beijing，必须字段 */
            Key: objectName,  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
            StorageClass: 'STANDARD',
            /* 当Body为stream类型时，ContentLength必传，否则onProgress不能返回正确的进度信息 */
            Body: fs.createReadStream(file), // 上传文件对象
            ContentLength: fs.statSync(file).size,
            CacheControl: cacheControl,
            onProgress: function (progressData) {
                console.log(JSON.stringify(progressData));
            }
        }, function (err, data) {
            console.log(err || data);
        });
    } else {
        // 如果该文件在 OSS 已存在，则跳过该文件 (Object)
        console.log(`Skip: ${objectName}`)
    }
}
async function main() {
    // 首先上传不带 hash 的文件
    for await (const entry of readdirp('./build', { depth: 0, type: 'files' })) {
        // console.log(entry.path)
        let myPath = entry.path.replace(/\\/g, "/")
        queue.add(() => uploadFile(myPath))
        // uploadFile(entry.path)
    }
    // 上传携带 hash 的文件
    for await (const entry of readdirp('./build/static', { type: 'files' })) {
        let myPath = entry.path.replace(/\\/g, "/")
        queue.add(() => uploadFile(`static/${myPath}`, true))
        // uploadFile(`static/${entry.path}`, true)
    }
}

main().catch(e => {
    console.error(e)
    process.exitCode = 1
})