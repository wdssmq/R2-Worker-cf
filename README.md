# R2-Worker-cf
通过 Cloudflare Worker 管理使用 R2 存储服务

## 使用 Wrangler CLI 开发

> wrangler 安装和登录见下方链接：
>
> wdssmq/fadian-cf：[https://github.com/wdssmq/fadian-cf#readme](https://github.com/wdssmq/fadian-cf#readme "wdssmq/fadian-cf")


## 初始配置

### 克隆项目并安装依赖

```bash
git clone git@github.com:wdssmq/R2-Worker-cf.git R2-Worker-cf
cd R2-Worker-cf
pnpm install

```

### 配置 wrangler 及 R2 存储

```bash
# install 命令会自动执行复制
# cp wrangler.example.toml wrangler.toml

```

默认的 `worker` 和 `R2 存储`名为 `just-imgs`，可自行修改，执行下边命令可创建相应的 R2 存储；

```bash
# bucket_name 为正式使用的存储
wrangler r2 bucket create just-imgs
# preview_bucket_name 用于测试
wrangler r2 bucket create r2-test

# 查看存储列表
wrangler r2 bucket list

```

### 设置 Secrets 变量

> 上传时需要验证，可以使用 Secrets 变量而不是直接写在代码里；

1、本地开发环境设置 Secrets

- 在项目根目录下创建 `.dev.vars` 文件，内容如下：

```dotenv
USER = name
PASS = pwd

```

2、线上环境设置 Secrets

```bash
# 依次执行以下命令，输入对应的值；
wrangler secret put USER

wrangler secret put PASS

# 查看 Secrets
wrangler secret list

# 删除 Secrets
# wrangler secret delete <KEY> [OPTIONS]

```


### 运行 / 发布

执行命令后可以按 \[`b`\] 键打开浏览器，\[`d`\] 键打开开发者工具，\[`l`\] 键开启/关闭本地模式，\[`c`\] 键清空控制台，\[`x`\] 键退出；

默认为本地模式，可按 \[`l`\] 键开启/关闭本地模式；

```bash
# 调试运行
npm run dev

# │ [b] open a browser, [d] open Devtools, [l] turn on local mode, [c] clear console, [x] to exit

```

```bash
# 发布
npm run deploy

```

### 本地测试

```bash
# 下载测试图片
wget  https://www.bing.com/th?id=OHR.Unesco50_ZH-CN3652927413_UHD.jpg -O /tmp/1.jpg

# 上传图片
echo '{"body" : "'"$( cat /tmp/1.jpg | base64)"'", "name" : "test"}' \
| curl -XPUT -H  "Content-Type: application/json" \
-d @-  https://change_user_here:change_pass_here@change_url_here/upload -vvv

```

## 参考

yusukebe/r2-image-worker: Store and Deliver images with R2 backend Cloudflare Workers.
https://github.com/yusukebe/r2-image-worker
