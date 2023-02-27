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
都可以看做独立的前端项目, 他们共用外部的构建配置和工具函数库等内容     

本插件解决的问题是       
针对ACT\2023\demo1\pages\app.tsx中的 import { xx } from '@/api';     
使 '@/api' 指向 ACT\2023\demo1\api\index.ts

针对ACT\2023\demo2\pages\app.tsx中的 import { yy } from '@/api';     
使 '@/api' 指向 ACT\2023\demo2\api\index.ts

针对COMMON\setting\pages\app.tsx中的 import { zz } from '@/api';     
使 '@/api' 指向 COMMON\setting\api\index.ts

## 配置
示例, 在tsconfig->compilerOptions.plugins中配置
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
1. 发布npm √
2. ~~修改import代码提示~~ -- failed 似乎要通过vscode插件才能实现           
3. 尝试使用vscode插件实现本插件功能, 并完成修改import提示的需求 √    (在vscode插件的package.json的contributes.typescriptServerPlugins中添加本插件, 但似乎不能传递配置参数)
4. 若能完成3, 在vscode插件内能否让.vue文件也支持 ```@/``` 路径

## bugs
在.vue文件中无效, 猜测是vscode插件volar使用了独立的Typescript Language Service.      
若是这样, 在本插件的能力范围内无法解决这个问题
