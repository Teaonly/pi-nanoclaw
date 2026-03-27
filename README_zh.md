# pi-nanoclaw
一个上下文工程透明的 claw 软件，基于 pi-mono 和 nanoclaw 。

## claw 
Host 主控端，负责连接 Channel 以及维护 Channel 到 Container 之间的路由。

## agent
基于 Pi SDK 开发智能体主体，完成用户消息的收发，任务执行，主要包括：基础执行上下文（Agent.md），配套附加工具，以及 Skills 资源。

channel: 一个对话对应一个Channel
container: 系统维持活动的容器，每个活动的容器对应一个Channel
group: group = channel + container

## Containter
容器内资源，容器构建脚本等。

## home 
容器内与主控共享资源，包括各种 skills 集成。
