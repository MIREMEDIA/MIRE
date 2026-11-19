# 源码来源

本分支的 `admin-web/` 与 `h5/` 来自已核对的前端白名单快照，不是从测试站 bundle 反编译，也不含原工程 git 历史。

| 目录 | 原工程 | 原分支 | 原 HEAD | 原提交时间 |
|---|---|---|---|---|
| `admin-web/` | `/workspace/mire_repos/admin` 的 `web/` 子目录 | `feature/fe-m9-admin` | `9260bbf7cff7d6a4cf1264083842f4cea382be14` | 2026-11-05 09:57:56 +0800 |
| `h5/` | `/workspace/mire_repos/h5` | `feature/fe-m3-h5` | `6c285a5113459229a4141b5992dac4964d5c4628` | 2026-11-05 09:04:31 +0800 |

快照 SHA-256：

- 后台 `fe-m9-admin-web`：`330819d8497a87c3ddba6cbec50e824bdbdbb5cb03734fdc8f3a763671e2ddae`（71 个文件）
- H5 `fe-m3-h5`：`45b7ab5cc4da61e07948fe124629c83de363a411b2c59543e0b459f50eaa165e`（82 个文件）

刻意未纳入：`.git`、`.env` / `.env.*`、`api/` PHP、`sql/`、部署与门禁脚本、证书与数据库文件。快照内没有 `VITE_*` 的取值。H5 构建会读取 `VITE_API_BASE`、`VITE_GAMES_API`、`VITE_CONTENT_LANG`；`index.html` 里的 `MIRE_CONFIG` 仍是快照原文。历史记录里的 `VITE_GAMES_API=1` 只说明曾有测试站构建打开过真实影游接口，不是本仓库的环境文件。
