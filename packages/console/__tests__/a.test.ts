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

traverse(ast, {
  CallExpression(path, state) {
    if (
      t.isMemberExpression(path.node.callee) &&
      // @ts-ignore
      path.node.callee.object.name === "console" &&
      // @ts-ignore
      ["log", "info", "error", "debug"].includes(path.node.callee.property.name)
    ) {
      // @ts-ignore
      const { line, column } = path.node.loc.start;
      path.node.arguments.unshift(
        t.stringLiteral(`filename: (${line}, ${column})`)
      );
    }
  },
});

describe("test", () => {
  const { code } = generate(ast);
  test("a", () => {
    expect(code).toMatchSnapshot();
  });
});
