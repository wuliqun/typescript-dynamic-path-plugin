# typescript-dynamic-path-plugin

## 介绍
A TypeScript Language Service Plugin  
用于帮助typescript在多项目仓库中识别定位@/路径  

## 示例
项目结构如下
```
project\
  ACT\
    2023\
      demo1\
      demo2\
  COMMON\
    setting\
  utils\
```
该项目结构下, 
+  ```ACT\2023\demo1```   
+ ```ACT\2023\demo2```   
+ ```COMMON\setting```       
都可以看做独立的前端项目, 他们公用外部的构建配置和工具函数库等内容     

本插件解决的问题是       
针对ACT\2023\demo1\pages\app.tsx中的 import { xx } from '@/api';     
使 '@/api' 指向 ACT\2023\demo1\api\index.ts

针对ACT\2023\demo2\pages\app.tsx中的 import { yy } from '@/api';     
使 '@/api' 指向 ACT\2023\demo2\api\index.ts

针对COMMON\setting\pages\app.tsx中的 import { zz } from '@/api';     
使 '@/api' 指向 COMMON\setting\api\index.ts

## 配置
示例
```
{
  "name":"typescript-dynamic-path-plugin",
  "roots":[
    {
      "name":"ACT",
      "depth":2
    },
    {
      "name":"COMMON",
      "depth":1
    }
  ],
  "folders":["api","components","pages","store","img","js","style","scripts"]
}
```
roots 指定项目根目录, 该根目录下的文件夹都是各自独立的前端项目,须使用depth指定深度          
folders 独立项目下的文件夹, 只有在这里定义了的文件夹才可以使用 ```@/api``` ```@/style``` 的形式引入  


## TODO:
发布npm

## bugs
在.vue文件中无效, 猜测是vscode插件volar使用了独立的Typescript Language Service.      
若是这样, 在本插件的能力范围内无法解决这个问题