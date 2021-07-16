import * as parser from "@babel/parser";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import template from "@babel/template";

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
});

const targetCalleeName = ["log", "info", "error", "debug"].map(
  (item) => `console.${item}`
);
traverse(ast, {
  CallExpression(path, state) {
    // @ts-ignore
    if (path.node.isNew) {
      return;
    }
    const calleeName = generate(path.node.callee).code;
    if (targetCalleeName.includes(calleeName)) {
      // @ts-ignore
      const { line, column } = path.node.loc.start;
      const newNode = template.expression(
        `console.log("filename: (${line}, ${column})")`
      )();
      // @ts-ignore
      newNode.isNew = true;

      if (path.findParent((path) => path.isJSXElement())) {
        path.replaceWith(t.arrayExpression([newNode, path.node]));
        path.skip();
      } else {
        path.insertBefore(newNode);
      }
    }
  },
});

describe("test", () => {
  const { code } = generate(ast);
  test("c", () => {
    expect(code).toMatchSnapshot();
  });
});
