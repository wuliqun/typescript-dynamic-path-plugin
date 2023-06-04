import * as vue from "@volar/vue-language-core";
import * as vueTs from "@volar/vue-typescript";
import type * as ts from "typescript/lib/tsserverlibrary";
import * as tsFaster from "@volar/typescript-faster";
import {
  createFilter,
  resolvedCustomRelativeModule,
  resolvePluginConfig,
  resolveVueFile,
  createLog,
  isVue,
  getVueSourceFile,
} from "./utils";

const init: ts.server.PluginModuleFactory = (modules) => {
  const { typescript: ts } = modules;

  const pluginModule: ts.server.PluginModule = {
    create(info) {
      /** 日志输出 */
      const log = createLog(info);

      log("Typescript-dynamic-path-plugin started!");

      const projectName = info.project.getProjectName();

      if (!info.project.fileExists(projectName)) {
        // project name not a tsconfig path, this is a inferred project
        return info.languageService;
      }

      // Creates new virtual source files for the CSS modules.
      const _createLanguageServiceSourceFile =
        ts.createLanguageServiceSourceFile;
      ts.createLanguageServiceSourceFile = (
        fileName,
        scriptSnapshot,
        ...rest
      ): ts.SourceFile => {
        const sourceFile = isVue(fileName)
          ? getVueSourceFile(fileName, scriptSnapshot, log)
          : _createLanguageServiceSourceFile(fileName, scriptSnapshot, ...rest);
        return sourceFile;
      };

      // Updates virtual source files as files update.
      const _updateLanguageServiceSourceFile =
        ts.updateLanguageServiceSourceFile;
      ts.updateLanguageServiceSourceFile = (
        sourceFile,
        scriptSnapshot,
        ...rest
      ): ts.SourceFile => {
        return isVue(sourceFile.fileName)
          ? getVueSourceFile(sourceFile.fileName, scriptSnapshot, log)
          : _updateLanguageServiceSourceFile(
              sourceFile,
              scriptSnapshot,
              ...rest
            );
      };

      if (info.languageServiceHost.resolveModuleNames) {
        const { roots, folders } = resolvePluginConfig(info);
        const _resolveModuleNames =
          info.languageServiceHost.resolveModuleNames.bind(
            info.languageServiceHost
          );
        info.languageServiceHost.resolveModuleNames = (
          moduleNames,
          containingFile,
          reusedNames,
          redirectedReference,
          options,
          containingSourceFile
        ) => {
          let resolvedModules = _resolveModuleNames!(
            moduleNames,
            containingFile,
            reusedNames,
            redirectedReference,
            options,
            containingSourceFile
          );

          const { fileFilter, importFilter } = createFilter(roots, folders);

          log(
            111111,
            "resolvedModules",
            JSON.stringify(moduleNames),
            JSON.stringify(resolvedModules)
          );
          resolvedModules = resolvedModules.map((m, index) => {
            // 屏蔽掉vue/types/jsx.d.ts 避免冲突react
            if (
              m &&
              /vue(\/|\\)types(\/|\\)jsx\.d\.ts$/.test(m.resolvedFileName)
            ) {
              return undefined;
            }

            if (
              !m &&
              importFilter.test(moduleNames[index]) &&
              fileFilter.test(containingFile) &&
              (/\.vue$/.test(moduleNames[index]) ||
                !/\.[^\\/.]+$/.test(moduleNames[index]))
            ) {
              return resolvedCustomRelativeModule(
                ts,
                moduleNames[index],
                containingFile,
                fileFilter
              );
            }

            if (!m && /\.vue$/.test(moduleNames[index])) {
              return resolveVueFile(moduleNames[index], containingFile, info);
            }

            return m;
          });
          log(222222, "resolvedModules after", JSON.stringify(resolvedModules));
          return resolvedModules;
        };
      }

      return info.languageService;
    },
    getExternalFiles(project) {
      return project.getFileNames().filter((filename) => isVue(filename));
    },
  };
  return pluginModule;
};

export = init;
