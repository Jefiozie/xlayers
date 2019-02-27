import { Injectable } from "@angular/core";

export enum Template {
  HTML,
  JSX
}
interface cssthing {
  className: string;
  declarations: string[];
}
@Injectable({
  providedIn: "root"
})
export class SharedCodegen {
  private indentationSymbol = `  `; // 2 spaces ftw

  generateComponentStyles(ast: SketchMSLayer) {
    const styles: Array<cssthing> = [
      {
        className: ":host",
        declarations: [`display: block;`, `position: relative;`]
      }
    ];

    (function computeStyle(_ast: SketchMSLayer, _styles) {
      const content = (name: string, data: string[]) => {
        if (data) {
          styles.push({ className: name, declarations: data });
        }
      };
      if (_ast.layers && Array.isArray(_ast.layers)) {
        _ast.layers.forEach(layer => {
          const rules: string[] = [];
          if (layer.css) {
            // tslint:disable-next-line:forin
            for (const prop in layer.css) {
              rules.push(`${prop}: ${layer.css[prop]};`);
            }
            content(`${(layer as any).css__className}`, rules);
          }

          computeStyle(layer, [
            {
              className: `${(layer as any).css__className}`,
              declarations: rules
            }
          ]);
        });
      }
    })(ast, styles);
    this.parseDuplications(styles);
    return styles
      .map(
        e =>
          `.${e.className} {
            ${e.declarations
              .map(rule => this.indentationSymbol + rule)
              .join("\n")}
     }
    `
      )
      .join("\n");
  }

  parseDuplications(stylesAst: cssthing[]): any {
    for (let index = 0; index < stylesAst.length; index++) {
      let checkingDecIndex = index;
      const currentDeclaration: cssthing = stylesAst[index];
      const currentDeclarationSet = new Set<string>(
        currentDeclaration.declarations
      );
      while (++checkingDecIndex < stylesAst.length) {
        const checkDeclarationPropertySet = new Set<string>(
          stylesAst[checkingDecIndex].declarations
        );

        for (const key of Array.from(currentDeclarationSet.values())) {
          if (checkDeclarationPropertySet.has(key)) {
            checkDeclarationPropertySet.delete(key);
          }
        }
        console.error(stylesAst[checkingDecIndex])
        stylesAst[checkingDecIndex].declarations = Object.assign(
          Array.from(checkDeclarationPropertySet.values())
        );
      }
    }
    return stylesAst;
  }

  openTag(tag = "div", attributes = []) {
    return `<${tag}${
      attributes.length !== 0 ? " " + attributes.join(" ") : ""
    }>`;
  }

  closeTag(tag = "div") {
    return `</${tag}>`;
  }

  indent(n: number, content: string) {
    const indentation = !!n ? this.indentationSymbol.repeat(n) : "";
    return indentation + content;
  }

  generateComponentTemplate(ast: SketchMSLayer, kind: Template) {
    const template: Array<string> = [];
    this.computeTemplate(ast, template, 0, kind);
    return template.join("\n");
  }

  private computeTemplate(
    ast: SketchMSLayer,
    template = [],
    depth = 0,
    kind = Template.HTML
  ) {
    let classNameAttr = "class";
    if (kind === Template.JSX) {
      classNameAttr = "className";
    }

    if (ast.layers && Array.isArray(ast.layers)) {
      ast.layers.forEach(layer => {
        if (layer.css) {
          const attributes = [
            `${classNameAttr}="${(layer as any).css__className}"`,
            `role="${layer._class}"`,
            `aria-label="${layer.name}"`
          ];
          template.push(this.indent(depth, this.openTag("div", attributes)));
        }

        const content = this.computeTemplate(layer, template, depth + 1, kind);
        if (content) {
          template.push(this.indent(depth + 1, content));
        }

        if (layer.css) {
          template.push(this.indent(depth, this.closeTag("div")));
        }
      });
    } else {
      const innerText = [];

      if ((ast as any)._class === "text") {
        innerText.push(this.openTag("span"));
        innerText.push(ast.attributedString.string);
        innerText.push(this.closeTag("span"));
      }

      return innerText.join("");
    }
  }
}
