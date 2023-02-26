interface RootConfig{
  name:string,
  depth:number
}

/** 根据配置生成匹配正则 */
function createFilter(roots:RootConfig[],folders:string[]){
  const rootsStr = roots.map(r=>{
    let res = r.name;
    for(let i = 0;i<r.depth;i++){
      res += '/[^/]+'
    }
    return res;
  })
  return {
    fileFilter:new RegExp(`/(${rootsStr.join('|')})/`),
    importFilter:new RegExp(`^@/(${folders.join('|')})\\b`)
  }
}

const extensions = [".ts",".tsx",".js",".jsx"];

function init(modules: { typescript: typeof import("typescript/lib/tsserverlibrary") }) {
  const ts = modules.typescript;

  function resolvedModule(moduleName:string,containingFile:string,fileFilter:RegExp):ts.ResolvedModule|undefined{
    let res:ts.ResolvedModule|undefined = undefined;
    const m = containingFile.match(fileFilter)!;
    const module = containingFile.slice(0,m.index! + m[0].length) + moduleName.replace('@/','');
    let filename = '';
    if(/\.[^\\/.]+$/.test(module)){
      if(ts.sys.fileExists(module)){
        filename = module;
      }
    }else if(/\/$/.test(module)){
      for(const ext of extensions){
        if(ts.sys.fileExists(`${module}index${ext}`)){
          filename = `${module}index${ext}`;
          break;
        }
      }
    }else{
      for(const ext of extensions){
        if(ts.sys.fileExists(`${module}${ext}`)){
          filename = `${module}${ext}`;
          break;
        }
      }
      if(!filename){
        for(const ext of extensions){
          if(ts.sys.fileExists(`${module}/index${ext}`)){
            filename = `${module}/index${ext}`;
            break;
          }
        }
      }
    }
    if(filename){
      res = {resolvedFileName:filename};
    }
    return res;
  }

  function create(info: ts.server.PluginCreateInfo) {
    /** 日志输出 */
    function log(...args:any[]){
      info.project.projectService.logger.info(args.map(arg=>String(arg)).join(" "));
    }
    log('Typescript-dynamic-path-plugin started!');

    // 根目录
    const roots = info.config.roots as RootConfig[];
    // 相对目录
    const folders = info.config.folders as string[];    


    if (roots?.length && folders?.length){
      const {fileFilter,importFilter} = createFilter(roots,folders);

      if(info.languageServiceHost.resolveModuleNames) {
        const _resolveModuleNames =
          info.languageServiceHost.resolveModuleNames.bind(
            info.languageServiceHost,
          );
  
        info.languageServiceHost.resolveModuleNames = (
          moduleNames,
          containingFile,
          ...rest
        ) => {
          let resolvedModules = _resolveModuleNames(
            moduleNames,
            containingFile,
            ...rest,
          );
          
          resolvedModules = resolvedModules.map((m,index)=>{
            if(!m && importFilter.test(moduleNames[index]) && fileFilter.test(containingFile) && !/\.vue$/.test(moduleNames[index])){
              return resolvedModule(moduleNames[index],containingFile,fileFilter);
            }
            return m;
          })
          return resolvedModules;
        };
      }
    }

    return info.languageService;
  }

  return { create };
}

export = init;