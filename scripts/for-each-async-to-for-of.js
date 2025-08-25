export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  root.find(j.CallExpression, {
    callee: { type: 'MemberExpression', property: { name: 'forEach' } },
    arguments: (args) =>
      args.length === 1 &&
      args[0].type === 'ArrowFunctionExpression' &&
      args[0].async,
  }).forEach((p) => {
    const call = p.node
    const arrayExpr = call.callee.object
    const cb = call.arguments[0] // ArrowFunctionExpression
    if (cb.params.length !== 1) return
    const param = cb.params[0]
    const body =
      cb.body.type === 'BlockStatement'
        ? cb.body.body
        : [j.expressionStatement(cb.body)]

    const forOf = j.forOfStatement(
      j.variableDeclaration('const', [j.variableDeclarator(param)]),
      arrayExpr,
      j.blockStatement(body),
    )
    j(p).replaceWith(forOf)
  })

  return root.toSource({ quote: 'single' })
}