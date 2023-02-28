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
  const cache: Record<string, string> = {};
  function resolvedModule(
    moduleName: string,
    containingFile: string,
    fileFilter: RegExp
  ): ts.ResolvedModule | undefined {
    const m = containingFile.match(fileFilter)!;
    const module =
      containingFile.slice(0, m.index! + m[0].length) +
      moduleName.replace("@/", "");
    if (!cache[module]) {
      let filename = "";
      if (/\/$/.test(module)) {
        for (const ext of extensions) {
          if (ts.sys.fileExists(`${module}index${ext}`)) {
            filename = `${module}index${ext}`;
            break;
          }
        }
      } else {
        for (const ext of extensions) {
          if (ts.sys.fileExists(`${module}${ext}`)) {
            filename = `${module}${ext}`;
            break;
          }
        }
        if (!filename) {
          for (const ext of extensions) {
            if (ts.sys.fileExists(`${module}/index${ext}`)) {
              filename = `${module}/index${ext}`;
              break;
            }
          }
        }
      }
      if (filename) {
        cache[module] = filename;
      }
    }
    return cache[module] ? { resolvedFileName: cache[module] } : undefined;
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

      log(2222222222, JSON.stringify(roots), JSON.stringify(folders));

      if (roots?.length && folders?.length) {
        const { fileFilter, importFilter } = createFilter(roots, folders);

        log(333333, info.languageServiceHost.resolveModuleNames);
        if (info.languageServiceHost.resolveModuleNames) {
          log(123456, "hijacked info.languageServiceHost resolveModuleNames");
          const _resolveModuleNames =
            info.languageServiceHost.resolveModuleNames.bind(
              info.languageServiceHost
            );

          info.languageServiceHost.resolveModuleNames = (
            moduleNames,
            containingFile,
            ...rest
          ) => {
            let resolvedModules = _resolveModuleNames(
              moduleNames,
              containingFile,
              ...rest
            );

            resolvedModules = resolvedModules.map((m, index) => {
              if (
                !m &&
                importFilter.test(moduleNames[index]) &&
                fileFilter.test(containingFile) &&
                !/\.[^\\/.]+$/.test(moduleNames[index])
              ) {
                return resolvedModule(
                  moduleNames[index],
                  containingFile,
                  fileFilter
                );
              }
              return m;
            });
            return resolvedModules;
          };
        }
      }

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
        getNewLine: () => info.project.getNewLine(),
        useCaseSensitiveFileNames: () =>
          info.project.useCaseSensitiveFileNames(),
        readFile: (path) => info.project.readFile(path),
        writeFile: (path, content) => info.project.writeFile(path, content),
        fileExists: (path) => info.project.fileExists(path),
        directoryExists: (path) => info.project.directoryExists(path),
        getDirectories: (path) => info.project.getDirectories(path),
        readDirectory: (path, extensions, exclude, include, depth) =>
          info.project.readDirectory(path, extensions, exclude, include, depth),
        realpath: info.project.realpath
          ? (path) => info.project.realpath!(path)
          : undefined,
        getCompilationSettings: () => info.project.getCompilationSettings(),
        getVueCompilationSettings: () => parsed.vueOptions,
        getCurrentDirectory: () => info.project.getCurrentDirectory(),
        getDefaultLibFileName: () => info.project.getDefaultLibFileName(),
        getProjectVersion: () => info.project.getProjectVersion(),
        getProjectReferences: () => info.project.getProjectReferences(),
        getScriptFileNames: () => [
          ...info.project.getScriptFileNames(),
          ...vueFileNames,
        ],
        getScriptVersion: (fileName) => info.project.getScriptVersion(fileName),
        getScriptSnapshot: (fileName) =>
          info.project.getScriptSnapshot(fileName),
        getTypeScriptModule: () => ts,
      };
      for (const key in vueTsLsHost) {
        if (typeof (vueTsLsHost as any)[key] === "function") {
          (vueTsLsHost as any)[key] = new Proxy((vueTsLsHost as any)[key], {
            apply: function (target, thisArg, argumentsList) {
              const res = target.apply(null, argumentsList);
              log(
                147147,
                key,
                JSON.stringify(argumentsList),
                JSON.stringify(res)
              );

              return res;
            },
          });
        }
      }
      const vueTsLs = vueTs.createLanguageService(vueTsLsHost);

      tsFaster.decorate(ts, vueTsLsHost, vueTsLs);

      // for (const key of [
      //   "getSemanticDiagnostics",
      //   "getEncodedSemanticClassifications",
      //   "getCompletionsAtPosition",
      //   "getCompletionEntryDetails",
      //   "getCompletionEntrySymbol",
      //   "getQuickInfoAtPosition",
      //   "getSignatureHelpItems",
      //   "getRenameInfo",
      //   "findRenameLocations",
      //   "getDefinitionAtPosition",
      //   "getDefinitionAndBoundSpan",
      //   "getTypeDefinitionAtPosition",
      //   "getImplementationAtPosition",
      //   "getReferencesAtPosition",
      //   "findReferences",
      // ]) {
      //   if (typeof (vueTsLs as any)[key] === "function") {
      //     (vueTsLs as any)[key] = new Proxy((vueTsLs as any)[key], {
      //       apply: function (target, thisArg, argumentsList) {
      //         const res = target.apply(vueTsLs, argumentsList);
      //         log(
      //           258258,
      //           key,
      //           JSON.stringify(argumentsList),
      //           JSON.stringify(res)
      //         );

      //         return res;
      //       },
      //     });
      //   }
      // }

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
