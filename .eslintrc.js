module.exports = {
  root: true,
  rules: {
    // 缩进一致
    // indent: ["warn", 2],
    // 键和值之间使用一致的空格
    "key-spacing": [
      "warn",
      {
        beforeColon: false,
        afterColon: true,
      },
    ],
    // 花括号中使用一致的空格
    "object-curly-spacing": ["warn", "always"],
    // 花括号中换行一致
    // "object-curly-newline": [ "warn", { multiline: true, consistent: true } ],
    // "object-curly-newline": [
    //   "warn",
    //   {
    //     multiline: true,
    //     minProperties: 3,
    //   },
    // ],
    // 对象多行属性时, 末尾加上逗号
    // "comma-dangle": ["warn", "always-multiline"],
    // 逗号后使用一致空格
    "comma-spacing": ["warn", { before: false, after: true }],
    // "array-bracket-spacing": [ "warn", "always" ],
    // 结尾加上分号
    // semi: ["warn", "always"],
    // 禁止重复case
    "no-duplicate-case": "error",
    // 禁止对象定义重复属性
    "no-dupe-keys": "error",
    // 禁止对 function 声明重新赋值
    "no-func-assign": "error",
    // 禁止不规则的空白
    "no-irregular-whitespace": "warn",
    // 禁用稀疏数组
    "no-sparse-arrays": "warn",
    // 禁止在 return、throw、continue 和 break 语句之后出现不可达代码
    "no-unreachable": "error",
    // 强制 typeof 表达式与有效的字符串进行比较
    "valid-typeof": "error",
    // 声明却未使用变量
    // "no-unused-vars": [ "warn", { "vars": "all", "args": "after-used" } ],
    // "@typescript-eslint/no-unused-vars": [ "warn" ],
    "vue/require-v-for-key": "warn",
    // template中使用横线分隔属性名
    "vue/attribute-hyphenation": ["warn", "always", { ignore: [] }],
    // template缩进
    // "vue/html-indent": [
    //   "warn",
    //   2,
    //   {
    //     attribute: 1,
    //     baseIndent: 1,
    //     closeBracket: 0,
    //     alignAttributesVertically: true,
    //     ignores: [],
    //   },
    // ],
    // 属性换行
    // "vue/first-attribute-linebreak": [
    //   "warn",
    //   {
    //     singleline: "beside",
    //     multiline: "below",
    //   },
    // ],
    // 属性换行
    // "vue/max-attributes-per-line": [
    //   "warn",
    //   {
    //     singleline: 3,
    //     multiline: { max: 1 },
    //   },
    // ],
    // props命名  小驼峰
    "vue/prop-name-casing": ["error", "camelCase"],
    // 属性顺序
    "vue/attributes-order": [
      "warn",
      {
        order: [
          "DEFINITION",
          "LIST_RENDERING",
          "CONDITIONALS",
          "RENDER_MODIFIERS",
          "GLOBAL",
          ["UNIQUE", "SLOT"],
          "TWO_WAY_BINDING",
          "OTHER_DIRECTIVES",
          "OTHER_ATTR",
          "EVENTS",
          "CONTENT",
        ],
        alphabetical: false,
      },
    ],
    // 不允许对props解构
    "vue/no-setup-props-destructure": "error",
    "prettier/prettier": [
      "warn",
      {
        printWidth: 80,
        semi: true,
        tabWidth: 2, // 缩进字节数
        useTabs: false, // 缩进不使用tab，使用空格
        singleQuote: false,
        bracketSpacing: true,
        trailingComma: "es5",
        eslintIntegration: "true",
      },
    ],
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    parser: "@typescript-eslint/parser",
  },
  parser: "vue-eslint-parser",
  plugins: ["vue", "@typescript-eslint"],
  extends: ["@vue/prettier"],
};
