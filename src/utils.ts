import type * as typescript from "typescript/lib/tsserverlibrary";
import * as tts from "typescript";
import path from "path";
import fs from "fs";
import { parse, compileScript } from "@vue/compiler-sfc";

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

/** 自解析模块缓存 */
const extensions = [".ts", ".tsx", ".js", ".jsx"];
const cache: Record<string, ts.ResolvedModule & { extension?: string }> = {};
function resolvedCustomRelativeModule(
  ts: typeof typescript,
  moduleName: string,
  containingFile: string,
  fileFilter: RegExp
): ts.ResolvedModule | undefined {
  const m = containingFile.match(fileFilter)!;
  const module =
    containingFile.slice(0, m.index! + m[0].length) +
    moduleName.replace("@/", "");
  if (!cache[module]) {
    if (/\.vue$/.test(module)) {
      if (ts.sys.fileExists(module)) {
        cache[module] = {
          resolvedFileName: module,
          isExternalLibraryImport: false,
          extension: ".d.ts",
        };
      }
    } else if (/\/$/.test(module)) {
      for (const ext of extensions) {
        if (ts.sys.fileExists(`${module}index${ext}`)) {
          cache[module] = {
            resolvedFileName: `${module}index${ext}`,
            isExternalLibraryImport: false,
            extension: /\.ts/.test(ext) ? ext : undefined,
          };
          break;
        }
      }
    } else {
      for (const ext of extensions) {
        if (ts.sys.fileExists(`${module}${ext}`)) {
          cache[module] = {
            resolvedFileName: `${module}${ext}`,
            isExternalLibraryImport: false,
            extension: /\.ts/.test(ext) ? ext : undefined,
          };
          break;
        }
      }
      if (!cache[module]) {
        for (const ext of extensions) {
          if (ts.sys.fileExists(`${module}/index${ext}`)) {
            cache[module] = {
              resolvedFileName: `${module}/index${ext}`,
              isExternalLibraryImport: false,
              extension: /\.ts/.test(ext) ? ext : undefined,
            };
            break;
          }
        }
      }
    }
  }
  return cache[module] || undefined;
}

function resolvePluginConfig(info: ts.server.PluginCreateInfo) {
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

  return { roots, folders };
}

/** 解析.vue文件路径 */
function resolveVueFile(
  name: string,
  containingFile: string,
  info: ts.server.PluginCreateInfo
) {
  if (isRelativeVue(name)) {
    return {
      extension: ".d.ts",
      isExternalLibraryImport: false,
      resolvedFileName: path.resolve(path.dirname(containingFile), name),
    };
  }
  return undefined;
}

/** 打印输出 */
function createLog(info: ts.server.PluginCreateInfo) {
  return (...args: any[]) => {
    info.project.projectService.logger.info(
      args.map((arg) => String(arg)).join(" ")
    );
  };
}

function isVue(file: string) {
  return /\.vue$/.test(file);
}

function isRelativeVue(file: string) {
  return isVue(file) && /^\.\.?($|[\\/])/.test(file);
}

function getVueSourceFile(
  filename: string,
  scriptSnapshot: ts.IScriptSnapshot,
  log: any
): ts.SourceFile {
  const { descriptor } = parse(
    scriptSnapshot.getText(0, scriptSnapshot.getLength()),
    {
      filename,
    }
  );

  const compiledScript = compileScript(descriptor, {
    id: filename,
    sourceMap: Boolean(
      descriptor.script?.attrs?.sourceMap ||
        descriptor.scriptSetup?.attrs?.sourceMap
    ),
  });

  // const scriptSnapshot = tts.ScriptSnapshot.fromString(descriptor.script.content);
  const sourceFile = tts.createSourceFile(
    filename,
    compiledScript.content || "",
    tts.ScriptTarget.ESNext,
    true
  );
  log(777777, JSON.stringify(descriptor));
  sourceFile.isDeclarationFile = true;
  return sourceFile;
}
export {
  createFilter,
  resolvedCustomRelativeModule,
  resolvePluginConfig,
  resolveVueFile,
  createLog,
  isVue,
  isRelativeVue,
  getVueSourceFile,
};
