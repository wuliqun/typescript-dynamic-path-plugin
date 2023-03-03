import * as vue from "@volar/vue-language-core";
import * as vueTs from "@volar/vue-typescript";
import type * as ts from "typescript/lib/tsserverlibrary";
import * as tsFaster from "@volar/typescript-faster";

interface RootConfig {
  name: string;
  depth: number;
}

/** 根据配置生成匹配正则 */
function createFilter(roots: RootConfig[], folders: string[]) {
  const rootsStr = roots.map((r) => {
    let res = r.name;
    for (let i = 0; i < r.depth; i++) {
      res += "/[^/]+";
    }
    return res;
  });
  return {
    fileFilter: new RegExp(`/(${rootsStr.join("|")})/`),
    importFilter: new RegExp(`^@/(${folders.join("|")})\\b`),
  };
}

const extensions = [".ts", ".tsx", ".js", ".jsx"];

const init: ts.server.PluginModuleFactory = (modules) => {
  const { typescript: ts } = modules;
  const externalFiles = new Map<ts.server.Project, string[]>();

  /** 自解析模块缓存 */
  const cache: Record<string, ts.ResolvedModule & {extension?:string}> = {};
  function resolvedCustomRelativeModule(
    moduleName: string,
    containingFile: string,
    fileFilter: RegExp
  ): ts.ResolvedModule | undefined {
    const m = containingFile.match(fileFilter)!;
    const module =
      containingFile.slice(0, m.index! + m[0].length) +
      moduleName.replace("@/", "");
    if (!cache[module]) {
      if(/\.vue$/.test(module)){
        if(ts.sys.fileExists(module)){
          cache[module] = {
            resolvedFileName:module,
            isExternalLibraryImport:false,
            extension:'.d.ts'
          }
        }
      }else if (/\/$/.test(module)) {
        for (const ext of extensions) {
          if (ts.sys.fileExists(`${module}index${ext}`)) {
            cache[module] = {
              resolvedFileName:`${module}index${ext}`,
              isExternalLibraryImport:false,
              extension:/\.ts/.test(ext) ? ext : undefined
            }
            break;
          }
        }
      } else {
        for (const ext of extensions) {
          if (ts.sys.fileExists(`${module}${ext}`)) {
            cache[module] = {
              resolvedFileName:`${module}${ext}`,
              isExternalLibraryImport:false,
              extension:/\.ts/.test(ext) ? ext : undefined
            }
            break;
          }
        }
        if (!cache[module]) {
          for (const ext of extensions) {
            if (ts.sys.fileExists(`${module}/index${ext}`)) {
              cache[module] = {
                resolvedFileName:`${module}/index${ext}`,
                isExternalLibraryImport:false,
                extension:/\.ts/.test(ext) ? ext : undefined
              }
              break;
            }
          }
        }
      }
    }
    return cache[module] || undefined;
  }

  /** 解析.vue文件路径 */
  function resolveVueFile(name:string,containingFile:string){
    return     undefined;
  }

  const pluginModule: ts.server.PluginModule = {
    create(info) {
      /** 日志输出 */
      function log(...args: any[]) {
        info.project.projectService.logger.info(
          args.map((arg) => String(arg)).join(" ")
        );
      }
      log("Typescript-dynamic-path-plugin started!");

      const projectName = info.project.getProjectName();

      if (!info.project.fileExists(projectName)) {
        // project name not a tsconfig path, this is a inferred project
        return info.languageService;
      }

      // 根目录
      const roots: RootConfig[] = info.config.roots || [
        {
          name: "ACT",
          depth: 2,
        },
        {
          name: "COMMON",
          depth: 1,
        },
      ];
      // 相对目录
      const folders: string[] = info.config.folders || [
        "api",
        "components",
        "pages",
        "store",
        "img",
        "js",
        "style",
        "scripts",
      ];

      const extraFileExtensions: ts.FileExtensionInfo[] = [
        {
          extension: "vue",
          isMixedContent: true,
          scriptKind: ts.ScriptKind.Deferred,
        },
      ];
      const parsed = vue.createParsedCommandLine(
        ts,
        ts.sys,
        projectName,
        extraFileExtensions
      );
      const vueFileNames = parsed.fileNames.filter((fileName) =>
        fileName.endsWith(".vue")
      );
      if (!vueFileNames.length) {
        // no vue file
        return info.languageService;
      }

      externalFiles.set(info.project, vueFileNames);

      // fix: https://github.com/johnsoncodehk/volar/issues/205
      if (!(info.project as any).__vue_getScriptKind) {
        (info.project as any).__vue_getScriptKind = info.project.getScriptKind;
        info.project.getScriptKind = (fileName) => {
          if (fileName.endsWith(".vue")) {
            return ts.ScriptKind.Deferred;
          }
          return (info.project as any).__vue_getScriptKind(fileName);
        };
      }

      const vueTsLsHost: vue.VueLanguageServiceHost = {
        getNewLine: () => {
          log(147147,`getNewLine`,info.project.getNewLine());
          return info.project.getNewLine()
        },
        useCaseSensitiveFileNames: () =>{
          log(147147,`useCaseSensitiveFileNames`,info.project.useCaseSensitiveFileNames());
          return info.project.useCaseSensitiveFileNames()
        },
        readFile: (path) => {
          log(147147,`readFile`,path,info.project.readFile(path));
          return info.project.readFile(path);
        },
        writeFile: (path, content) => {
          log(147147,`writeFile`,path,content);
          return info.project.writeFile(path, content)
        },
        fileExists: (path) => {
          log(147147,`fileExists`,path,info.project.fileExists(path));
          return info.project.fileExists(path)
        },
        directoryExists: (path) => {
          log(147147,`directoryExists`,path,info.project.directoryExists(path));
          return info.project.directoryExists(path)
        },
        getDirectories: (path) => {
          log(147147,`getDirectories`,path,info.project.getDirectories(path));
          return info.project.getDirectories(path)
        },
        readDirectory: (path, extensions, exclude, include, depth) =>
          {
            log(147147,`readDirectory`,path, extensions, exclude, include, depth,info.project.readDirectory(path, extensions, exclude, include, depth));
            return info.project.readDirectory(path, extensions, exclude, include, depth)
          },
        realpath: info.project.realpath
          ? (path) => {
            log(147147,`realpath`,path,info.project.realpath!(path));
            return info.project.realpath!(path)
          }
          : undefined,
        getCompilationSettings: () => {
          log(147147,`getCompilationSettings`,info.project.getCompilationSettings());
          return info.project.getCompilationSettings()
        },
        getVueCompilationSettings: () => {
          log(147147,`getVueCompilationSettings`,parsed.vueOptions);
          return parsed.vueOptions
        },
        getCurrentDirectory: () => {
          log(147147,`getCurrentDirectory`,info.project.getCurrentDirectory());
          return info.project.getCurrentDirectory()
        },
        getDefaultLibFileName: () => {
          log(147147,`getDefaultLibFileName`,info.project.getDefaultLibFileName());
          return info.project.getDefaultLibFileName()
        },
        getProjectVersion: () => {
          log(147147,`getProjectVersion`,info.project.getProjectVersion());
          return info.project.getProjectVersion()
        },
        getProjectReferences: () => {
          log(147147,`getProjectReferences`,info.project.getProjectReferences());
          return info.project.getProjectReferences();
        },
        getScriptFileNames: () => [
          ...info.project.getScriptFileNames(),
          ...vueFileNames,
        ],
        getScriptVersion: (fileName) => info.project.getScriptVersion(fileName),
        getScriptSnapshot: (fileName) =>
          info.project.getScriptSnapshot(fileName),
        getTypeScriptModule: () => ts,
        resolveModuleNames:info.languageServiceHost.resolveModuleNames ? (moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile)=> {
          let resolvedModules = info.languageServiceHost.resolveModuleNames!(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile);

          const { fileFilter, importFilter } = createFilter(roots, folders);

          log(951951,'resolvedModules',JSON.stringify(moduleNames),JSON.stringify(resolvedModules));
          resolvedModules = resolvedModules.map((m, index) => {
            if (
              !m &&
              importFilter.test(moduleNames[index]) &&
              fileFilter.test(containingFile) &&
              (/\.vue$/.test(moduleNames[index]) || !/\.[^\\/.]+$/.test(moduleNames[index]))
            ) {
              log(888888,moduleNames[index])
              return resolvedCustomRelativeModule(
                moduleNames[index],
                containingFile,
                fileFilter
              );
            }

            if(!m && /\.vue$/.test(moduleNames[index])){
              log(888877,moduleNames[index])
              log(555555,moduleNames[index],containingFile)
              return resolveVueFile(moduleNames[index],containingFile);
            }

            return m;
          });
          log(922222,'resolvedModules',JSON.stringify(resolvedModules));
          return resolvedModules;
        }:undefined
      };
      const vueTsLs = vueTs.createLanguageService(vueTsLsHost);

      tsFaster.decorate(ts, vueTsLsHost, vueTsLs);


      return new Proxy(info.languageService, {
        get: (target: any, property: keyof ts.LanguageService) => {
          if (
            property === "getSemanticDiagnostics" ||
            property === "getEncodedSemanticClassifications" ||
            property === "getCompletionsAtPosition" ||
            property === "getCompletionEntryDetails" ||
            property === "getCompletionEntrySymbol" ||
            property === "getQuickInfoAtPosition" ||
            property === "getSignatureHelpItems" ||
            property === "getRenameInfo" ||
            property === "findRenameLocations" ||
            property === "getDefinitionAtPosition" ||
            property === "getDefinitionAndBoundSpan" ||
            property === "getTypeDefinitionAtPosition" ||
            property === "getImplementationAtPosition" ||
            property === "getReferencesAtPosition" ||
            property === "findReferences"
          ) {
            log(123654, "original proxy:", property);
            return vueTsLs[property];
          }
          return target[property];
        },
      });
    },
    getExternalFiles(project) {
      return externalFiles.get(project) ?? [];
    },
  };
  return pluginModule;
};

export = init;
